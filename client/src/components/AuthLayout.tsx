import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  BookOpen, 
  MessageSquare, 
  User,
  LogOut,
  Settings,
  BarChart3
} from 'lucide-react';

export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-600" />
              Smart Helpdesk
            </Link>
            <nav className="hidden gap-1 sm:flex">
              <Link
                to="/"
                className="rounded px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Support
                </div>
              </Link>
              {user && (
                <Link
                  to="/kb"
                  className="rounded px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Knowledge Base
                  </div>
                </Link>
              )}
              {user?.role === 'agent' && (
                <Link
                  to="/agent"
                  className="rounded px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Agent Dashboard
                  </div>
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link
                  to="/admin/users"
                  className="rounded px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Admin
                  </div>
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  {user.name}
                </div>
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link to="/login">
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/register">
                    Get Started
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-600" />
              <span className="text-sm text-gray-600">Smart Helpdesk © 2024</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <Link to="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
              <Link to="/contact" className="hover:text-gray-900 transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout;
