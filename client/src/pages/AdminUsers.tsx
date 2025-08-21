import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import AdminLayout from '../components/AdminLayout';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Alert, AlertDescription } from '../components/ui/alert';
import * as Dialog from '@radix-ui/react-dialog';
import * as Checkbox from '@radix-ui/react-checkbox';
import { 
  Users, 
  Search, 
  Shield, 
  UserCheck, 
  User,
  Mail,
  Calendar,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Info,
  Loader2,
  X,
  Check
} from 'lucide-react';

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'agent' | 'user';
  createdAt: string;
  lastLogin?: string;
}

interface UserStats {
  ticketsCreated: number;
  ticketsAssigned: number;
  articlesCreated: number;
  repliesCount: number;
}

interface DeletionCheck {
  canDelete: boolean;
  warnings: string[];
  ticketCount: number;
  articleCount: number;
  assignedTicketCount: number;
}

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [deletionCheck, setDeletionCheck] = useState<DeletionCheck | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [deleteOptions, setDeleteOptions] = useState({
    transferOwnership: true,
    deleteAssociatedData: false
  });

  useEffect(() => { 
    loadUsers(); 
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/users');
      setUsers(res.data.users);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const setRole = async (id: string, role: 'admin'|'agent'|'user') => {
    setUpdating(id);
    try {
      await api.put(`/api/admin/users/${id}/role`, { role });
      setUsers(u => u.map(x => x._id === id ? { ...x, role } : x));
    } catch (error) {
      console.error('Failed to update user role:', error);
    } finally {
      setUpdating(null);
    }
  };

  const openDeleteDialog = async (user: UserData) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
    
    try {
      // Get deletion check info
      const checkRes = await api.get(`/api/admin/users/${user._id}/deletion-check`);
      setDeletionCheck(checkRes.data);
      
      // Get user stats
      const statsRes = await api.get(`/api/admin/users/${user._id}/stats`);
      setUserStats(statsRes.data.stats);
    } catch (error) {
      console.error('Failed to load user deletion info:', error);
    }
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
    setDeletionCheck(null);
    setUserStats(null);
    setDeleteOptions({ transferOwnership: true, deleteAssociatedData: false });
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    setDeleting(userToDelete._id);
    try {
      await api.delete(`/api/admin/users/${userToDelete._id}`, {
        data: deleteOptions
      });
      
      // Remove user from list
      setUsers(u => u.filter(x => x._id !== userToDelete._id));
      closeDeleteDialog();
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      alert(`Failed to delete user: ${error.response?.data?.error?.message || error.message}`);
    } finally {
      setDeleting(null);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'agent': return 'default';
      case 'user': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'agent': return <UserCheck className="h-4 w-4" />;
      case 'user': return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Users">
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-600">Loading users...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="User Management">
      <div className="space-y-6">
        {/* Search and Stats */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={loadUsers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-semibold">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UserCheck className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Agents</p>
                  <p className="text-2xl font-semibold">
                    {users.filter(u => u.role === 'agent').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Shield className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Admins</p>
                  <p className="text-2xl font-semibold">
                    {users.filter(u => u.role === 'admin').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium text-gray-700">User</th>
                    <th className="text-left p-3 font-medium text-gray-700">Email</th>
                    <th className="text-left p-3 font-medium text-gray-700">Role</th>
                    <th className="text-left p-3 font-medium text-gray-700">Joined</th>
                    <th className="text-left p-3 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user._id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {user.email}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant={getRoleBadgeVariant(user.role) as any}>
                          <div className="flex items-center gap-1">
                            {getRoleIcon(user.role)}
                            {user.role}
                          </div>
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Select 
                            value={user.role} 
                            onValueChange={(value: 'admin'|'agent'|'user') => setRole(user._id, value)}
                            disabled={updating === user._id}
                          >
                            <SelectTrigger className="w-32 h-10 font-mulish font-semibold">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="agent">Agent</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(user)}
                            disabled={deleting === user._id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          >
                            {deleting === user._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No users found matching your search.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Delete User Dialog */}
      <Dialog.Root open={deleteDialogOpen} onOpenChange={closeDeleteDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 sm:rounded-lg">
            <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </Dialog.Close>
            
            <div className="flex flex-col space-y-1.5 text-left">
              <Dialog.Title className="text-lg font-semibold leading-none tracking-tight flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Delete User Account
              </Dialog.Title>
              <Dialog.Description className="text-sm text-gray-600">
                You are about to permanently delete the user account for{' '}
                <span className="font-semibold">{userToDelete?.name}</span>{' '}
                ({userToDelete?.email}). This action cannot be undone.
              </Dialog.Description>
            </div>
            
            {deletionCheck && userStats && (
              <div className="space-y-4 py-4">
                {/* User Statistics */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    User Activity Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Tickets Created:</span>
                      <span className="font-medium">{userStats.ticketsCreated}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Tickets Assigned:</span>
                      <span className="font-medium">{userStats.ticketsAssigned}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Articles Created:</span>
                      <span className="font-medium">{userStats.articlesCreated}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Replies Made:</span>
                      <span className="font-medium">{userStats.repliesCount}</span>
                    </div>
                  </div>
                </div>
                
                {/* Warnings */}
                {deletionCheck.warnings.length > 0 && (
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      <div className="font-medium mb-2">Important Considerations:</div>
                      <ul className="list-disc pl-4 space-y-1">
                        {deletionCheck.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Cannot delete if it's the last admin */}
                {!deletionCheck.canDelete && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <div className="font-medium">Cannot Delete User</div>
                      <p>This user cannot be deleted because they are the last admin user. You must promote another user to admin first.</p>
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Deletion Options */}
                {deletionCheck.canDelete && (userStats.ticketsCreated > 0 || userStats.articlesCreated > 0 || userStats.repliesCount > 0) && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <h4 className="font-medium text-gray-900">Data Handling Options:</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Checkbox.Root
                          id="transferOwnership"
                          checked={deleteOptions.transferOwnership}
                          onCheckedChange={(checked: boolean) => 
                            setDeleteOptions(prev => ({
                              ...prev, 
                              transferOwnership: checked,
                              deleteAssociatedData: checked ? false : prev.deleteAssociatedData
                            }))
                          }
                          className="peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white"
                        >
                          <Checkbox.Indicator className="flex items-center justify-center text-current">
                            <Check className="h-4 w-4" />
                          </Checkbox.Indicator>
                        </Checkbox.Root>
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor="transferOwnership"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Transfer ownership to system user (Recommended)
                          </label>
                          <p className="text-xs text-gray-600">
                            Keep all data but transfer ownership to a system user. Content will be preserved with attribution notes.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <Checkbox.Root
                          id="deleteAssociatedData"
                          checked={deleteOptions.deleteAssociatedData}
                          onCheckedChange={(checked: boolean) => 
                            setDeleteOptions(prev => ({
                              ...prev, 
                              deleteAssociatedData: checked,
                              transferOwnership: checked ? false : prev.transferOwnership
                            }))
                          }
                          className="peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-red-600 data-[state=checked]:text-white"
                        >
                          <Checkbox.Indicator className="flex items-center justify-center text-current">
                            <Check className="h-4 w-4" />
                          </Checkbox.Indicator>
                        </Checkbox.Root>
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor="deleteAssociatedData"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-red-700"
                          >
                            Delete all associated data (Destructive)
                          </label>
                          <p className="text-xs text-red-600">
                            Permanently delete all tickets, articles, and replies created by this user. This cannot be undone.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              <Button variant="outline" onClick={closeDeleteDialog}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={!deletionCheck?.canDelete || deleting === userToDelete?._id}
              >
                {deleting === userToDelete?._id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete User
                  </>
                )}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </AdminLayout>
  );
};

export default AdminUsers;



