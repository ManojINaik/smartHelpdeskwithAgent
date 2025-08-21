import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { signAccessToken, signRefreshToken } from '../utils/jwt.js';
import { UserRole } from '../types/models.js';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

export class AuthService {
  static async register(data: RegisterData): Promise<AuthResponse> {
    const existing = await (User as any).findByEmail(data.email);
    if (existing) {
      throw Object.assign(new Error('Email already in use'), { status: 409 });
    }

    const password_hash = data.password;
    const role: UserRole = data.role ?? 'user';

    const user = await User.create({
      name: data.name,
      email: data.email,
      password_hash,
      role
    });

    const accessToken = signAccessToken({ id: String(user._id), email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ id: String(user._id), email: user.email, role: user.role });

    return {
      accessToken,
      refreshToken,
      user: { id: String(user._id), name: user.name, email: user.email, role: user.role }
    };
  }

  static async login(data: LoginData): Promise<AuthResponse> {
    const user = await (User as any).findByEmail(data.email);
    if (!user) {
      throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    }

    const ok = await bcrypt.compare(data.password, user.password_hash);
    if (!ok) {
      throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    }

    const accessToken = signAccessToken({ id: String(user._id), email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ id: String(user._id), email: user.email, role: user.role });

    return {
      accessToken,
      refreshToken,
      user: { id: String(user._id), name: user.name, email: user.email, role: user.role }
    };
  }
}

export default AuthService;



