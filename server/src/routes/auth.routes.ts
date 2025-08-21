import { Router } from 'express';
import { z } from 'zod';
import AuthService from '../services/auth.service.js';
import { authenticate } from '../middleware/auth.js';
import { signAccessToken, verifyRefreshToken } from '../utils/jwt.js';
import rateLimit from 'express-rate-limit';
import { getEnvConfig } from '../config/env.js';

const router = Router();

// Rate limiting for auth endpoints
const env = getEnvConfig();
const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false
});
router.use(authLimiter);

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(['admin', 'agent', 'user']).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await AuthService.register(data);
    res.status(201).json(result);
  } catch (err: any) {
    const status = err.status || 400;
    res.status(status).json({ error: { code: 'AUTH_REGISTER_FAILED', message: err.message } });
  }
});

router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await AuthService.login(data);
    res.json(result);
  } catch (err: any) {
    const status = err.status || 401;
    res.status(status).json({ error: { code: 'AUTH_LOGIN_FAILED', message: err.message } });
  }
});

// Refresh token endpoint
const refreshSchema = z.object({ refreshToken: z.string().min(20) });
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const payload = verifyRefreshToken(refreshToken);
    const accessToken = signAccessToken({ id: payload.sub, email: payload.email, role: payload.role });
    res.json({ accessToken });
  } catch (err: any) {
    res.status(401).json({ error: { code: 'AUTH_REFRESH_FAILED', message: 'Invalid refresh token' } });
  }
});

// Me endpoint to validate token quickly
router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

export default router;


