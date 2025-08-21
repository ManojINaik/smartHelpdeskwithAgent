import React from 'react';
import { useAuth } from '../context/AuthContext';
import useTickets from '../hooks/useTickets';
import CreateTicketForm from '../components/CreateTicketForm';
import TicketList from '../components/TicketList';
import AuthLayout from '../components/AuthLayout';
import LandingHero from '../components/LandingHero';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, ModernCard } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  MessageSquare, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Users,
  Shield,
  BookOpen,
  BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const { loading, error, items: tickets, refresh } = useTickets();

  const getStatusCount = (status: string) => {
    return tickets?.filter((ticket: any) => ticket.status === status).length || 0;
  };

  // Show landing page for non-authenticated users
  if (!user) {
    return <LandingHero />;
  }

  // Show dashboard for authenticated users
  return (
    <AuthLayout>
      <div className="min-h-[calc(100vh-200px)] bg-[#E2F1FF]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 sm:py-6">
          {/* Hero Section */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full">
                <MessageSquare className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-mulish font-bold text-neutral-900 mb-3">
              Welcome back, {user.name}!
            </h1>
            <p className="text-base sm:text-lg font-mulish font-medium text-neutral-600 mb-4 sm:mb-6 max-w-2xl mx-auto px-4">
              Here's what's happening with your support tickets and how we can help you today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center px-4">
              <Button asChild className="h-11 px-6 text-base font-mulish font-bold bg-primary-500 hover:bg-primary-600">
                <Link to="/kb">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Browse Knowledge Base
                </Link>
              </Button>
              {user.role === 'agent' && (
                <Button variant="outline" asChild className="h-11 px-6 text-base font-mulish font-bold">
                  <Link to="/agent">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Agent Dashboard
                  </Link>
                </Button>
              )}
              {user.role === 'admin' && (
                <Button variant="outline" asChild className="h-11 px-6 text-base font-mulish font-bold">
                  <Link to="/admin/users">
                    <Users className="h-4 w-4 mr-2" />
                    Admin Panel
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <ModernCard variant="profile" className="shadow-card">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-mulish font-semibold text-neutral-400 uppercase tracking-wider line-clamp-1">Total Tickets</p>
                  <p className="text-xl sm:text-2xl font-mulish font-bold text-neutral-900 mt-1">{tickets?.length || 0}</p>
                </div>
                <div className="p-2 sm:p-3 bg-primary-100 rounded-2xl flex-shrink-0">
                  <MessageSquare className="h-4 w-4 sm:h-6 sm:w-6 text-primary-600" />
                </div>
              </div>
            </ModernCard>

            <ModernCard variant="profile" className="shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mulish font-semibold text-neutral-400 uppercase tracking-wider">Open Tickets</p>
                  <p className="text-2xl font-mulish font-bold text-warning-500 mt-1">{getStatusCount('open')}</p>
                </div>
                <div className="p-3 bg-warning-100 rounded-2xl">
                  <Clock className="h-6 w-6 text-warning-500" />
                </div>
              </div>
            </ModernCard>

            <ModernCard variant="profile" className="shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mulish font-semibold text-neutral-400 uppercase tracking-wider">Resolved</p>
                  <p className="text-2xl font-mulish font-bold text-success-500 mt-1">{getStatusCount('resolved')}</p>
                </div>
                <div className="p-3 bg-success-100 rounded-2xl">
                  <CheckCircle className="h-6 w-6 text-success-500" />
                </div>
              </div>
            </ModernCard>

            <ModernCard variant="profile" className="shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mulish font-semibold text-neutral-400 uppercase tracking-wider">In Progress</p>
                  <p className="text-2xl font-mulish font-bold text-primary-500 mt-1">{getStatusCount('waiting_human')}</p>
                </div>
                <div className="p-3 bg-primary-100 rounded-2xl">
                  <TrendingUp className="h-6 w-6 text-primary-600" />
                </div>
              </div>
            </ModernCard>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Create Ticket Section */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <ModernCard variant="payment" className="shadow-card h-fit">
                <div className="mb-4 sm:mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
                    <h2 className="text-lg sm:text-xl font-mulish font-bold text-neutral-900">
                      Create New Ticket
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm font-mulish font-medium text-neutral-400">
                    Submit a new support request and we'll get back to you as soon as possible.
                  </p>
                </div>
                <CreateTicketForm />
              </ModernCard>
            </div>

            {/* Tickets List Section */}
            <div className="lg:col-span-2 order-1 lg:order-2">
              <ModernCard variant="default" className="shadow-card">
                <div className="mb-4 sm:mb-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
                        <h2 className="text-lg sm:text-xl font-mulish font-bold text-neutral-900">
                          Your Support Tickets
                        </h2>
                      </div>
                      <p className="text-xs sm:text-sm font-mulish font-medium text-neutral-400">
                        Track the status of your support requests and view responses from our team.
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={refresh} disabled={loading} className="font-mulish font-semibold w-full sm:w-auto">
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'Refresh'
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  {loading && (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                        <span className="font-mulish font-medium text-neutral-600">Loading your tickets...</span>
                      </div>
                    </div>
                  )}
                  
                  {error && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <span className="font-mulish font-semibold text-red-600">{error}</span>
                    </div>
                  )}
                  
                  {!loading && !error && tickets && tickets.length === 0 && (
                    <div className="text-center py-12">
                      <div className="p-4 bg-neutral-100 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <MessageSquare className="h-8 w-8 text-neutral-400" />
                      </div>
                      <h3 className="text-lg font-mulish font-bold text-neutral-900 mb-2">No tickets yet</h3>
                      <p className="font-mulish font-medium text-neutral-600 mb-4">
                        You haven't created any support tickets yet. Create your first ticket to get started!
                      </p>
                      <Button className="font-mulish font-bold bg-primary-500 hover:bg-primary-600">
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Ticket
                      </Button>
                    </div>
                  )}
                  
                  {!loading && !error && tickets && tickets.length > 0 && (
                    <TicketList />
                  )}
                </div>
              </ModernCard>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-mulish font-bold text-neutral-900 mb-3">Why Choose Smart Helpdesk?</h2>
              <p className="text-base font-mulish font-medium text-neutral-600 max-w-2xl mx-auto">
                Experience the future of customer support with our intelligent, AI-powered helpdesk solution.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ModernCard variant="profile" className="shadow-card text-center">
                <div className="p-4 bg-primary-100 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-mulish font-bold text-neutral-900 mb-2">AI-Powered Support</h3>
                <p className="font-mulish font-medium text-neutral-600">
                  Get instant answers with our intelligent AI that learns from your knowledge base and provides accurate responses.
                </p>
              </ModernCard>

              <ModernCard variant="profile" className="shadow-card text-center">
                <div className="p-4 bg-success-100 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-success-600" />
                </div>
                <h3 className="text-lg font-mulish font-bold text-neutral-900 mb-2">Expert Team</h3>
                <p className="font-mulish font-medium text-neutral-600">
                  Our dedicated support team is available 24/7 to help you resolve any issues quickly and efficiently.
                </p>
              </ModernCard>

              <ModernCard variant="profile" className="shadow-card text-center">
                <div className="p-4 bg-warning-100 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-warning-500" />
                </div>
                <h3 className="text-lg font-mulish font-bold text-neutral-900 mb-2">Real-time Tracking</h3>
                <p className="font-mulish font-medium text-neutral-600">
                  Track the progress of your tickets in real-time and get notified when updates are available.
                </p>
              </ModernCard>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default HomePage;


