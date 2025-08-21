import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import wsClient from '../lib/ws';

type Role = 'admin' | 'agent' | 'user';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('accessToken'));
  const [loading, setLoading] = useState<boolean>(!!token);

  useEffect(() => {
    async function fetchMe() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const resp = await api.get('/api/auth/me');
        const userData = resp.data.user;
        const normalized = {
          id: userData.id ?? userData._id ?? userData.sub,
          name: userData.name ?? userData.username ?? userData.email,
          email: userData.email,
          role: userData.role,
        } as any;
        setUser(normalized);

        // Connect WebSocket with proper userId
        const userId = normalized.id;
        if (userId && userId !== 'undefined') {
          wsClient.connect(userId);
        }
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
        setToken(null);
        wsClient.disconnect();
      } finally {
        setLoading(false);
      }
    }
    fetchMe();
  }, [token]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    loading,
    async login(email, password) {
      const resp = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('accessToken', resp.data.accessToken);
      localStorage.setItem('refreshToken', resp.data.refreshToken);
      setToken(resp.data.accessToken);
      const u = resp.data.user;
      const normalized = {
        id: u.id ?? u._id ?? u.sub,
        name: u.name ?? u.username ?? u.email,
        email: u.email,
        role: u.role,
      } as any;
      setUser(normalized);
      return normalized as User;
    },
    async register(name, email, password) {
      const resp = await api.post('/api/auth/register', { name, email, password });
      localStorage.setItem('accessToken', resp.data.accessToken);
      localStorage.setItem('refreshToken', resp.data.refreshToken);
      setToken(resp.data.accessToken);
      const u = resp.data.user;
      const normalized = {
        id: u.id ?? u._id ?? u.sub,
        name: u.name ?? u.username ?? u.email,
        email: u.email,
        role: u.role,
      } as any;
      setUser(normalized);
      return normalized as User;
    },
    logout() {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setToken(null);
      wsClient.disconnect();
    }
  }), [user, token, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


