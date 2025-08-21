import React from 'react';
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
  LogOut
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
  
  return (
    <div className="min-h-screen bg-background">
      {/* Modern Admin Header */}
      <header className="sticky top-0 z-30 bg-primary-500 gradient-primary shadow-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Link to="/admin/metrics" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-mulish font-bold text-white">
                  Smart Helpdesk
                </span>
                <p className="text-xs font-mulish font-semibold text-white/70">
                  Admin Dashboard
                </p>
              </div>
            </Link>
            
            {/* Admin Navigation */}
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
          
          <div className="flex items-center gap-3">

            
            {/* Notifications */}
            <NotificationBell className="w-11 h-11" />
            
            {/* User Profile */}
            {user && (
              <div className="flex items-center gap-3 pl-2">
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
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-warning-400 to-warning-500 flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={logout}
                  className="text-white/90 hover:text-white hover:bg-white/20 w-9 h-9 p-0"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {title && (
          <div className="mb-8">
            <h1 className="text-4xl font-mulish font-bold text-primary-800 mb-2">
              {title}
            </h1>
            <p className="text-lg font-mulish font-medium text-neutral-400">
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


