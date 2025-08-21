import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ModernCard } from './ui/card';
import { NotificationBell } from './NotificationCenter';
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  Settings, 
  User,
  Shield,
  LogOut,
  Menu,
  X
} from 'lucide-react';

const NavLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      className={`rounded-2xl px-3 py-2 text-sm font-mulish font-semibold transition-all duration-200 ${
        active 
          ? 'bg-white text-primary-600 shadow-lg transform scale-105' 
          : 'text-white/90 hover:bg-white/20 hover:text-white hover:scale-105'
      }`}
    >
      {children}
    </Link>
  );
};

export const AdminLayout: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-background">
      {/* Modern Admin Header */}
      <header className="sticky top-0 z-30 bg-primary-500 gradient-primary shadow-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link to="/admin/metrics" className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-mulish font-bold text-white">
                  Smart Helpdesk
                </span>
                <p className="text-xs font-mulish font-semibold text-white/70">
                  Admin Dashboard
                </p>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              <NavLink to="/admin/metrics">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Metrics
                </div>
              </NavLink>
              <NavLink to="/kb">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Knowledge Base
                </div>
              </NavLink>
              <NavLink to="/agent">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Agent View
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
            </nav>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
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
            
            {/* Notifications */}
            <NotificationBell className="w-9 h-9 sm:w-11 sm:h-11" />
            
            {/* User Profile */}
            {user && (
              <div className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-2">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-mulish font-bold text-white leading-tight">
                    {user.email || user.name}
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <Badge variant="secondary" size="sm" className="bg-white/20 text-white border-white/30 text-xs px-2 py-0.5">
                      {user.role}
                    </Badge>
                  </div>
                </div>
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-warning-400 to-warning-500 flex items-center justify-center">
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
            )}
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/20 bg-primary-600">
            <nav className="px-4 py-4 space-y-2">
              <Link
                to="/admin/metrics"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-white/90 hover:bg-white/20 hover:text-white transition-all"
              >
                <BarChart3 className="h-5 w-5" />
                <span className="font-mulish font-semibold">Metrics</span>
              </Link>
              <Link
                to="/kb"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-white/90 hover:bg-white/20 hover:text-white transition-all"
              >
                <BookOpen className="h-5 w-5" />
                <span className="font-mulish font-semibold">Knowledge Base</span>
              </Link>
              <Link
                to="/agent"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-white/90 hover:bg-white/20 hover:text-white transition-all"
              >
                <User className="h-5 w-5" />
                <span className="font-mulish font-semibold">Agent View</span>
              </Link>
              <Link
                to="/admin/users"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-white/90 hover:bg-white/20 hover:text-white transition-all"
              >
                <Users className="h-5 w-5" />
                <span className="font-mulish font-semibold">Users</span>
              </Link>
              <Link
                to="/admin/config"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-white/90 hover:bg-white/20 hover:text-white transition-all"
              >
                <Settings className="h-5 w-5" />
                <span className="font-mulish font-semibold">Settings</span>
              </Link>
            </nav>
          </div>
        )}
      </header>
      
      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        {title && (
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-mulish font-bold text-primary-800 mb-2">
              {title}
            </h1>
            <p className="text-base sm:text-lg font-mulish font-medium text-neutral-400">
              Manage and monitor your helpdesk system
            </p>
          </div>
        )}
        
        {/* Modern Card Container */}
        <ModernCard>
          {children}
        </ModernCard>
      </main>
    </div>
  );
};

export default AdminLayout;


