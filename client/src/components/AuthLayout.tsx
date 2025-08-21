import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  BookOpen, 
  MessageSquare, 
  User,
  LogOut,
  Settings,
  BarChart3,
  Bell,
  Search
} from 'lucide-react';

export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Modern Navigation Bar */}
      <header className="sticky top-0 z-30 bg-background-card shadow-soft border-b border-neutral-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-500 flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-mulish font-bold text-primary-800">
                Smart Helpdesk
              </span>
            </Link>
            
            {/* Search Bar */}
            <div className="hidden md:flex relative">
              <div className="w-72 h-10 bg-neutral-100 rounded-3xl flex items-center px-4">
                <Search className="h-4 w-4 text-neutral-500 mr-3" />
                <input 
                  type="text" 
                  placeholder="Search tickets..."
                  className="bg-transparent text-sm font-mulish font-medium text-neutral-600 placeholder:text-neutral-500 flex-1 outline-none"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* Navigation Links */}
                <nav className="hidden lg:flex items-center gap-2">
                  <Link
                    to="/"
                    className="px-4 py-2 rounded-2xl text-sm font-mulish font-semibold text-neutral-600 hover:bg-neutral-100 hover:text-primary-600 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Support
                    </div>
                  </Link>
                  <Link
                    to="/kb"
                    className="px-4 py-2 rounded-2xl text-sm font-mulish font-semibold text-neutral-600 hover:bg-neutral-100 hover:text-primary-600 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Knowledge Base
                    </div>
                  </Link>
                  {user?.role === 'agent' && (
                    <Link
                      to="/agent"
                      className="px-4 py-2 rounded-2xl text-sm font-mulish font-semibold text-neutral-600 hover:bg-neutral-100 hover:text-primary-600 transition-all"
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
                      className="px-4 py-2 rounded-2xl text-sm font-mulish font-semibold text-neutral-600 hover:bg-neutral-100 hover:text-primary-600 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Admin
                      </div>
                    </Link>
                  )}
                </nav>
                
                {/* Notification Bell */}
                <div className="relative">
                  <button className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center hover:bg-neutral-100 transition-all">
                    <Bell className="h-4 w-4 text-neutral-600" />
                  </button>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-mulish font-bold text-white">2</span>
                  </div>
                </div>
                
                {/* User Profile */}
                <div className="flex items-center gap-3">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-mulish font-semibold text-primary-800">
                      {user.name}
                    </p>
                    <Badge variant="accent" size="sm">
                      {user.role}
                    </Badge>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-warning-400 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={logout}
                    className="text-neutral-600 hover:text-primary-600"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button variant="outline" asChild className="font-mulish font-semibold">
                  <Link to="/login">
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Link>
                </Button>
                <Button asChild className="font-mulish font-bold">
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
      <footer className="bg-background-card border-t border-neutral-200">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-sm font-mulish font-bold text-primary-800">
                  Smart Helpdesk
                </span>
                <p className="text-xs font-mulish font-medium text-neutral-400">
                  © 2024 All rights reserved
                </p>
              </div>
            </div>
            <div className="flex items-center gap-8 text-sm font-mulish font-semibold text-neutral-600">
              <Link to="/privacy" className="hover:text-primary-600 transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-primary-600 transition-colors">
                Terms of Service
              </Link>
              <Link to="/contact" className="hover:text-primary-600 transition-colors">
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
