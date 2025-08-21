import AuditLog from '../models/AuditLog.js';

export type AuditActor = 'system' | 'agent' | 'user';

export class AuditLogService {
  static async log(ticketId: string, traceId: string, actor: AuditActor, action: string, meta: Record<string, any> = {}) {
    try {
      await (AuditLog as any).createEntry(ticketId, traceId, actor, action, meta);
    } catch {
      // best-effort
    }
  }
}

export default AuditLogService;


