import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  BarChart3, 
  Users, 
  Settings, 
  BookOpen, 
  MessageSquare, 
  Bell,
  Shield,
  LogOut,
  User,
  Search
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

export const AgentNavbar: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  
  return (
    <div className="min-h-screen bg-background">
      {/* Modern Agent Navigation Bar */}
      <header className="sticky top-0 z-30 bg-primary-500 gradient-primary shadow-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link to="/agent" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-mulish font-bold text-white">
                  Agent Dashboard
                </span>
                <p className="text-xs font-mulish font-semibold text-white/70">
                  Support Management
                </p>
              </div>
            </Link>
            
            {/* Agent Navigation */}
            <nav className="hidden lg:flex items-center gap-2">
              <NavLink to="/agent">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </div>
              </NavLink>
              <NavLink to="/kb">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Knowledge Base
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
            {/* Search */}
            <div className="hidden md:flex relative">
              <div className="w-64 h-10 bg-white/20 rounded-3xl flex items-center px-4">
                <Search className="h-4 w-4 text-white/70 mr-3" />
                <input 
                  type="text" 
                  placeholder="Search tickets..."
                  className="bg-transparent text-sm font-mulish font-medium text-white placeholder:text-white/70 flex-1 outline-none"
                />
              </div>
            </div>
            
            {/* Notifications */}
            <div className="relative">
              <button className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all">
                <Bell className="h-5 w-5 text-white" />
              </button>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-warning-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-mulish font-bold text-white">2</span>
              </div>
            </div>
            
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
        {children}
      </main>
    </div>
  );
};

export default AgentNavbar;
