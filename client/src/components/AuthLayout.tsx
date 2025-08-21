import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { NotificationBell } from './NotificationCenter';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  BookOpen, 
  MessageSquare, 
  User,
  LogOut,
  Settings,
  BarChart3,
  Bell
} from 'lucide-react';

export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Modern Navigation Bar */}
      <header className="sticky top-0 z-30 bg-primary-500 gradient-primary shadow-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-mulish font-bold text-white">
                  Smart Helpdesk
                </span>
                <p className="text-xs font-mulish font-semibold text-white/70">
                  Support Platform
                </p>
              </div>
            </Link>
            

          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* Navigation Links */}
                <nav className="hidden lg:flex items-center gap-2">
                  <Link
                    to="/"
                    className="rounded-2xl px-4 py-2.5 text-sm font-mulish font-semibold transition-all text-white/90 hover:bg-white/20 hover:text-white"
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Support
                    </div>
                  </Link>
                  <Link
                    to="/kb"
                    className="rounded-2xl px-4 py-2.5 text-sm font-mulish font-semibold transition-all text-white/90 hover:bg-white/20 hover:text-white"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Knowledge Base
                    </div>
                  </Link>
                  {user?.role === 'agent' && (
                    <Link
                      to="/agent"
                      className="rounded-2xl px-4 py-2.5 text-sm font-mulish font-semibold transition-all text-white/90 hover:bg-white/20 hover:text-white"
                    >
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Dashboard
                      </div>
                    </Link>
                  )}
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin/users"
                      className="rounded-2xl px-4 py-2.5 text-sm font-mulish font-semibold transition-all text-white/90 hover:bg-white/20 hover:text-white"
                    >
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Admin
                      </div>
                    </Link>
                  )}
                </nav>
                
                {/* Notification Bell */}
                <NotificationBell />
                
                {/* User Profile */}
                <div className="flex items-center gap-3">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-mulish font-bold text-white">
                      {user.name}
                    </p>
                    <Badge variant="secondary" size="sm" className="bg-white/20 text-white border-white/30">
                      {user.role}
                    </Badge>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-warning-400 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={logout}
                    className="text-white/90 hover:text-white hover:bg-white/20"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button variant="outline" asChild className="font-mulish font-semibold bg-white/20 text-white border-white/30 hover:bg-white/30">
                  <Link to="/login">
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Link>
                </Button>
                <Button asChild className="font-mulish font-bold bg-white text-primary-600 hover:bg-white/90">
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
      <main className="flex-1 min-h-[calc(100vh-140px)]">
        {children}
      </main>

      {/* Modern Footer */}
      <footer className="bg-primary-800 border-t border-primary-700">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-sm font-mulish font-bold text-white">
                  Smart Helpdesk
                </span>
                <p className="text-xs font-mulish font-medium text-white/70">
                  © 2024 All rights reserved
                </p>
              </div>
            </div>
            <div className="flex items-center gap-8 text-sm font-mulish font-semibold text-white/90">
              <Link to="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link to="/contact" className="hover:text-white transition-colors">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout;
