import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { getEnvConfig } from '../config/env.js';
import { UserRole } from '../types/models.js';

export interface JwtPayload {
  sub: string;
  role: UserRole;
  email: string;
  iat?: number;
  exp?: number;
}

export function signAccessToken(user: { id: string; email: string; role: UserRole }): string {
  const config = getEnvConfig();
  const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
  const secret: Secret = config.JWT_SECRET as unknown as Secret;
  const options: SignOptions = { expiresIn: config.JWT_EXPIRES_IN as unknown as any };
  return jwt.sign(payload, secret, options);
}

export function signRefreshToken(user: { id: string; email: string; role: UserRole }): string {
  const config = getEnvConfig();
  const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
  const secret: Secret = config.JWT_SECRET as unknown as Secret;
  const options: SignOptions = { expiresIn: config.JWT_REFRESH_EXPIRES_IN as unknown as any };
  return jwt.sign(payload, secret, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  const config = getEnvConfig();
  const secret: Secret = config.JWT_SECRET as unknown as Secret;
  return jwt.verify(token, secret) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  const config = getEnvConfig();
  const secret: Secret = config.JWT_SECRET as unknown as Secret;
  return jwt.verify(token, secret) as JwtPayload;
}



