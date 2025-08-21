import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ModernCard } from './ui/card';
import { NotificationBell } from './NotificationCenter';
import { 
  BookOpen, 
  Edit3, 
  Plus,
  User,
  Settings,
  BarChart3,
  Users,
  Shield,
  LogOut
} from 'lucide-react';

const NavLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => {
  const { pathname } = useLocation();
  const active = pathname === to;
  
  return (
    <Link
      to={to}
      className={`rounded-2xl px-4 py-2.5 text-sm font-mulish font-semibold transition-all ${
        active 
          ? 'bg-white text-primary-600 shadow-lg' 
          : 'text-white/90 hover:bg-white/20 hover:text-white'
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
    <div className="min-h-screen bg-background">
      {/* Modern KB Navigation Bar */}
      <header className="sticky top-0 z-30 bg-primary-500 gradient-primary shadow-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link to="/kb" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-mulish font-bold text-white">
                  Knowledge Base
                </span>
                <p className="text-xs font-mulish font-semibold text-white/70">
                  Articles & Documentation
                </p>
              </div>
            </Link>
            
            {/* KB Navigation */}
            <nav className="hidden lg:flex items-center gap-2">
              <NavLink to="/kb">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
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
                  Agent View
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
          
          <div className="flex items-center gap-4">

            
            {/* New Article Button for Admins */}
            {pathname === '/kb' && user?.role === 'admin' && (
              <Button 
                asChild 
                variant="secondary" 
                size="sm"
                className="bg-white/20 text-white hover:bg-white/30 border-white/30 font-mulish font-semibold"
              >
                <Link to="/kb/editor">
                  <Plus className="h-4 w-4 mr-2" />
                  New Article
                </Link>
              </Button>
            )}
            
            {/* Notifications */}
            <NotificationBell />
            
            {/* User Profile */}
            {user && (
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
              Explore our comprehensive knowledge base
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

export default KBLayout;
