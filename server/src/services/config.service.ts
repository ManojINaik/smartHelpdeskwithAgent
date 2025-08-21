import { getEnvConfig } from '../config/env.js';
import Config from '../models/Config.js';

export interface EffectiveConfig {
  autoCloseEnabled: boolean;
  confidenceThreshold: number;
  slaHours: number;
  emailNotificationsEnabled: boolean;
  maxAttachmentSize: number;
  allowedAttachmentTypes: string[];
}

class ConfigServiceImpl {
  private cache: EffectiveConfig | null = null;
  private lastLoadedAt = 0;
  private ttlMs = 10_000; // 10s cache TTL

  private toEffective(env = getEnvConfig()): EffectiveConfig {
    return {
      autoCloseEnabled: env.AUTO_CLOSE_ENABLED,
      confidenceThreshold: env.CONFIDENCE_THRESHOLD,
      slaHours: env.SLA_HOURS,
      emailNotificationsEnabled: false,
      maxAttachmentSize: env.MAX_FILE_SIZE,
      allowedAttachmentTypes: env.ALLOWED_FILE_TYPES.split(',').map(s => s.trim().toLowerCase())
    };
  }

  async getEffectiveConfig(forceReload = false): Promise<EffectiveConfig> {
    const now = Date.now();
    if (!forceReload && this.cache && (now - this.lastLoadedAt < this.ttlMs)) {
      return this.cache;
    }

    const latest = await Config.findOne({}).sort({ updatedAt: -1 });
    if (!latest) {
      this.cache = this.toEffective();
      this.lastLoadedAt = now;
      return this.cache;
    }

    this.cache = {
      autoCloseEnabled: latest.autoCloseEnabled,
      confidenceThreshold: latest.confidenceThreshold,
      slaHours: latest.slaHours,
      emailNotificationsEnabled: latest.emailNotificationsEnabled,
      maxAttachmentSize: latest.maxAttachmentSize,
      allowedAttachmentTypes: latest.allowedAttachmentTypes,
    };
    this.lastLoadedAt = now;
    return this.cache;
  }

  async updateConfig(updates: Partial<EffectiveConfig>, updatedBy: string) {
    const envEff = await this.getEffectiveConfig(true);
    const next: EffectiveConfig = {
      ...envEff,
      ...updates,
    };
    const doc = await Config.create({ ...next, updatedBy });
    this.cache = next;
    this.lastLoadedAt = Date.now();
    return doc;
  }
}

export const ConfigService = new ConfigServiceImpl();
export default ConfigService;



