import { describe, it, expect } from 'vitest';
import { sanitizeRequest } from '../middleware/security.js';

describe('Security - sanitizeRequest', () => {
  it('sanitizes script tags from inputs', async () => {
    const req: any = { body: { a: '<script>alert(1)</script>ok' }, query: {}, params: {} };
    const res: any = {};
    await new Promise<void>((resolve) => sanitizeRequest(req, res, resolve));
    expect(String(req.body.a)).not.toContain('<script>');
  });
});



