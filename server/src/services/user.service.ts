import User from '../models/User.js';
import Ticket from '../models/Ticket.js';
import Article from '../models/Article.js';
import AgentSuggestion from '../models/AgentSuggestion.js';
import AuditLogService from './audit.service.js';
import { ObjectId } from 'mongoose';

export interface UserDeletionOptions {
  transferOwnership?: boolean;
  systemUserId?: string;
  deleteAssociatedData?: boolean;
}

export interface UserDeletionResult {
  success: boolean;
  deletedUserId: string;
  ticketsAffected: number;
  articlesAffected: number;
  repliesAffected: number;
  transferredToSystemUser?: boolean;
  errors?: string[];
}

class UserService {
  
  /**
   * Delete a user safely by handling all foreign key constraints
   */
  async deleteUser(
    userId: string, 
    deletingAdminId: string,
    options: UserDeletionOptions = {}
  ): Promise<UserDeletionResult> {
    const {
      transferOwnership = true,
      systemUserId,
      deleteAssociatedData = false
    } = options;

    const result: UserDeletionResult = {
      success: false,
      deletedUserId: userId,
      ticketsAffected: 0,
      articlesAffected: 0,
      repliesAffected: 0,
      errors: []
    };

    try {
      // First check if user exists
      const userToDelete = await User.findById(userId);
      if (!userToDelete) {
        result.errors!.push('User not found');
        return result;
      }

      // Prevent deletion of the last admin
      if (userToDelete.role === 'admin') {
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount <= 1) {
          result.errors!.push('Cannot delete the last admin user');
          return result;
        }
      }

      // Prevent self-deletion
      if (userId === deletingAdminId) {
        result.errors!.push('Cannot delete your own account');
        return result;
      }

      // Get or create system user for ownership transfer
      let systemUser = null;
      if (transferOwnership) {
        if (systemUserId) {
          systemUser = await User.findById(systemUserId);
        }
        
        if (!systemUser) {
          // Create a system user if none exists
          systemUser = await this.getOrCreateSystemUser();
        }
        
        if (!systemUser) {
          result.errors!.push('Failed to find or create system user for ownership transfer');
          return result;
        }
        
        result.transferredToSystemUser = true;
      }

      // Handle tickets created by the user
      const userTickets = await Ticket.find({ createdBy: userId });
      if (userTickets.length > 0) {
        if (deleteAssociatedData) {
          // Delete all tickets created by the user
          await Ticket.deleteMany({ createdBy: userId });
          result.ticketsAffected = userTickets.length;
        } else if (transferOwnership && systemUser) {
          // Transfer ownership to system user
          await Ticket.updateMany(
            { createdBy: userId },
            { 
              createdBy: systemUser._id,
              $push: {
                replies: {
                  content: `Note: This ticket was originally created by ${userToDelete.name} (${userToDelete.email}) before their account was deleted. Ownership has been transferred to the system.`,
                  author: systemUser._id,
                  authorType: 'system',
                  createdAt: new Date()
                }
              }
            }
          );
          result.ticketsAffected = userTickets.length;
        } else {
          result.errors!.push(`User has ${userTickets.length} tickets that would become orphaned`);
          return result;
        }
      }

      // Handle tickets assigned to the user
      const assignedTickets = await Ticket.find({ assignee: userId });
      if (assignedTickets.length > 0) {
        // Unassign tickets and reset status to open
        await Ticket.updateMany(
          { assignee: userId },
          { 
            assignee: null,
            status: 'open',
            $push: {
              replies: {
                content: `Note: This ticket was previously assigned to ${userToDelete.name} (${userToDelete.email}) before their account was deleted. The ticket has been unassigned and is now available for re-assignment.`,
                author: systemUser?._id || userToDelete._id,
                authorType: 'system',
                createdAt: new Date()
              }
            }
          }
        );
      }

      // Handle replies authored by the user
      const ticketsWithUserReplies = await Ticket.find({ 'replies.author': userId });
      let repliesCount = 0;
      for (const ticket of ticketsWithUserReplies) {
        const userRepliesInTicket = ticket.replies.filter(r => r.author.toString() === userId);
        repliesCount += userRepliesInTicket.length;
        
        if (deleteAssociatedData) {
          // Remove all replies by the user
          ticket.replies = ticket.replies.filter(r => r.author.toString() !== userId);
        } else if (systemUser) {
          // Transfer authorship to system user and add note
          ticket.replies.forEach(reply => {
            if (reply.author.toString() === userId) {
              reply.author = systemUser._id as any;
              reply.content = `[Original author: ${userToDelete.name} (${userToDelete.email}) - account deleted]\n\n${reply.content}`;
            }
          });
        }
        await ticket.save();
      }
      result.repliesAffected = repliesCount;

      // Handle articles created by the user
      const userArticles = await Article.find({ createdBy: userId });
      if (userArticles.length > 0) {
        if (deleteAssociatedData) {
          // Delete all articles created by the user
          await Article.deleteMany({ createdBy: userId });
          result.articlesAffected = userArticles.length;
        } else if (transferOwnership && systemUser) {
          // Transfer ownership to system user
          await Article.updateMany(
            { createdBy: userId },
            { createdBy: systemUser._id }
          );
          result.articlesAffected = userArticles.length;
        } else {
          result.errors!.push(`User has ${userArticles.length} articles that would become orphaned`);
          return result;
        }
      }

      // Handle agent suggestions
      await AgentSuggestion.deleteMany({ agentId: userId });

      // Finally, delete the user
      await User.findByIdAndDelete(userId);

      // Log the deletion
      await AuditLogService.log(
        'user-deletion',
        `delete-${userId}`, 
        'system',
        'USER_DELETED',
        {
          deletedUserId: userId,
          deletedUserEmail: userToDelete.email,
          deletedUserName: userToDelete.name,
          deletedUserRole: userToDelete.role,
          deletedBy: deletingAdminId,
          ticketsAffected: result.ticketsAffected,
          articlesAffected: result.articlesAffected,
          repliesAffected: result.repliesAffected,
          transferOwnership,
          deleteAssociatedData
        }
      );

      result.success = true;
      return result;

    } catch (error) {
      console.error('Error deleting user:', error);
      result.errors!.push(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Get or create a system user for ownership transfer
   */
  private async getOrCreateSystemUser() {
    // Try to find existing system user
    let systemUser = await User.findOne({ 
      email: 'system@helpdesk.internal',
      role: 'agent'
    });

    if (!systemUser) {
      // Create system user
      systemUser = new User({
        name: 'System User',
        email: 'system@helpdesk.internal',
        password_hash: 'system-user-no-login', // This will be hashed but user can't login
        role: 'agent'
      });
      await systemUser.save();
    }

    return systemUser;
  }

  /**
   * Check if a user can be safely deleted
   */
  async canDeleteUser(userId: string): Promise<{
    canDelete: boolean;
    warnings: string[];
    ticketCount: number;
    articleCount: number;
    assignedTicketCount: number;
  }> {
    const user = await User.findById(userId);
    if (!user) {
      return {
        canDelete: false,
        warnings: ['User not found'],
        ticketCount: 0,
        articleCount: 0,
        assignedTicketCount: 0
      };
    }

    const warnings: string[] = [];
    
    // Check if last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        warnings.push('This is the last admin user');
      }
    }

    // Count associated data
    const [ticketCount, articleCount, assignedTicketCount] = await Promise.all([
      Ticket.countDocuments({ createdBy: userId }),
      Article.countDocuments({ createdBy: userId }),
      Ticket.countDocuments({ assignee: userId })
    ]);

    if (ticketCount > 0) {
      warnings.push(`User has created ${ticketCount} ticket(s)`);
    }
    
    if (articleCount > 0) {
      warnings.push(`User has created ${articleCount} article(s)`);
    }
    
    if (assignedTicketCount > 0) {
      warnings.push(`User is assigned to ${assignedTicketCount} ticket(s)`);
    }

    return {
      canDelete: warnings.length === 0 || warnings.every(w => !w.includes('last admin')),
      warnings,
      ticketCount,
      articleCount,
      assignedTicketCount
    };
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string) {
    const [ticketsCreated, ticketsAssigned, articlesCreated, repliesCount] = await Promise.all([
      Ticket.countDocuments({ createdBy: userId }),
      Ticket.countDocuments({ assignee: userId }),
      Article.countDocuments({ createdBy: userId }),
      Ticket.aggregate([
        { $unwind: '$replies' },
        { $match: { 'replies.author': userId } },
        { $count: 'totalReplies' }
      ]).then(result => result[0]?.totalReplies || 0)
    ]);

    return {
      ticketsCreated,
      ticketsAssigned,
      articlesCreated,
      repliesCount
    };
  }
}

export default new UserService();