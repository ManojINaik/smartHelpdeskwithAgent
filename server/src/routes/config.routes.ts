import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth.js';
import ConfigService from '../services/config.service.js';
import AuditLogService from '../services/audit.service.js';

const router = Router();

router.get('/', authenticate, authorize(['admin']), async (req, res) => {
  const cfg = await ConfigService.getEffectiveConfig();
  res.json({ config: cfg });
});

const updateSchema = z.object({
  autoCloseEnabled: z.boolean().optional(),
  confidenceThreshold: z.number().min(0).max(1).optional(),
  slaHours: z.number().min(1).max(24 * 14).optional(),
  emailNotificationsEnabled: z.boolean().optional(),
  maxAttachmentSize: z.number().min(0).max(104857600).optional(),
  allowedAttachmentTypes: z.array(z.string()).max(50).optional(),
});

router.put('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const updates = updateSchema.parse(req.body);
    const updated = await ConfigService.updateConfig(updates, req.user!.sub);
    await AuditLogService.log('000000000000000000000000', req.traceId || 'n/a', 'agent', 'CONFIG_UPDATED', { updates });
    res.json({ config: updated });
  } catch (err: any) {
    res.status(400).json({ error: { code: 'CONFIG_UPDATE_FAILED', message: err.message } });
  }
});

export default router;


