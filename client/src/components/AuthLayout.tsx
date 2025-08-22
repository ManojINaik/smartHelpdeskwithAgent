import React, { useState } from 'react';
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
  Menu,
  X
} from 'lucide-react';

export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Modern Navigation Bar */}
      <header className="sticky top-0 z-30 bg-primary-500 gradient-primary shadow-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-4 sm:gap-8">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-mulish font-bold text-white">
                  Smart Helpdesk
                </span>
                <p className="text-xs font-mulish font-semibold text-white/70">
                  Support Platform
                </p>
              </div>
            </Link>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <>
                {/* Mobile menu button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden text-white/90 hover:text-white hover:bg-white/20 w-9 h-9 p-0"
                >
                  {mobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
                
                {/* Desktop Navigation Links */}
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
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-mulish font-bold text-white">
                      {user.name}
                    </p>
                    <Badge variant="secondary" size="sm" className="bg-white/20 text-white border-white/30">
                      {user.role}
                    </Badge>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-warning-400 flex items-center justify-center">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={logout}
                    className="text-white/90 hover:text-white hover:bg-white/20 w-8 h-8 sm:w-9 sm:h-9 p-0"
                  >
                    <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button variant="outline" asChild className="font-mulish font-semibold bg-white/20 text-white border-white/30 hover:bg-white/30 text-sm px-3 py-2">
                  <Link to="/login">
                    <User className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Sign In</span>
                    <span className="sm:hidden">Sign</span>
                  </Link>
                </Button>
                <Button asChild className="font-mulish font-bold bg-white text-primary-600 hover:bg-white/90 text-sm px-3 py-2">
                  <Link to="/register">
                    <span className="hidden sm:inline">Get Started</span>
                    <span className="sm:hidden">Join</span>
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {user && mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/20 bg-primary-600">
            <nav className="px-4 py-4 space-y-2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-white/90 hover:bg-white/20 hover:text-white transition-all"
              >
                <MessageSquare className="h-5 w-5" />
                <span className="font-mulish font-semibold">Support</span>
              </Link>
              <Link
                to="/kb"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-white/90 hover:bg-white/20 hover:text-white transition-all"
              >
                <BookOpen className="h-5 w-5" />
                <span className="font-mulish font-semibold">Knowledge Base</span>
              </Link>
              {user?.role === 'agent' && (
                <Link
                  to="/agent"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl text-white/90 hover:bg-white/20 hover:text-white transition-all"
                >
                  <BarChart3 className="h-5 w-5" />
                  <span className="font-mulish font-semibold">Dashboard</span>
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link
                  to="/admin/users"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl text-white/90 hover:bg-white/20 hover:text-white transition-all"
                >
                  <Settings className="h-5 w-5" />
                  <span className="font-mulish font-semibold">Admin</span>
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-[calc(100vh-140px)]">
        {children}
      </main>

      {/* Modern Footer */}
      <footer className="bg-primary-800 border-t border-primary-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:gap-6 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
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
            <div className="flex items-center gap-4 sm:gap-8 text-sm font-mulish font-semibold text-white/90">
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
