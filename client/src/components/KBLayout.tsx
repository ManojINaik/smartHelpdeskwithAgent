import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { 
  BookOpen, 
  Edit3, 
  Search, 
  Plus,
  User,
  Settings,
  BarChart3,
  Users
} from 'lucide-react';

const NavLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      className={`rounded px-3 py-2 text-sm font-medium transition-colors ${
        active 
          ? 'bg-white/90 text-gray-900' 
          : 'text-white/90 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </Link>
  );
};

export const KBLayout: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-gradient-to-r from-indigo-600 to-purple-600/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/kb" className="text-lg font-semibold text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Knowledge Base
            </Link>
            <nav className="hidden gap-1 sm:flex">
              <NavLink to="/kb">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Browse
                </div>
              </NavLink>
              {user?.role === 'admin' && (
                <NavLink to="/kb/editor">
                  <div className="flex items-center gap-2">
                    <Edit3 className="h-4 w-4" />
                    Editor
                  </div>
                </NavLink>
              )}
              <NavLink to="/agent">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Agent
                </div>
              </NavLink>
              {user?.role === 'admin' && (
                <>
                  <NavLink to="/admin/metrics">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Admin
                    </div>
                  </NavLink>
                  <NavLink to="/admin/users">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Users
                    </div>
                  </NavLink>
                  <NavLink to="/admin/config">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Settings
                    </div>
                  </NavLink>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden items-center gap-3 sm:flex">
                <span className="rounded bg-white/10 px-2 py-1 text-xs text-white/90">
                  {user.role}
                </span>
                <span className="text-sm text-white/90">{user.name}</span>
              </div>
            )}
            <button 
              onClick={logout} 
              className="rounded bg-white/90 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-white"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        {title && (
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
            {pathname === '/kb' && user?.role === 'admin' && (
              <Button asChild>
                <Link to="/kb/editor">
                  <Plus className="h-4 w-4 mr-2" />
                  New Article
                </Link>
              </Button>
            )}
          </div>
        )}
        <div className="rounded-xl border border-gray-200 bg-white/90 p-4 shadow-sm sm:p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default KBLayout;
