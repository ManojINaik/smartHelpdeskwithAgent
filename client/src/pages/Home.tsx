import React from 'react';
import { useAuth } from '../context/AuthContext';
import useTickets from '../hooks/useTickets';
import CreateTicketForm from '../components/CreateTicketForm';
import TicketList from '../components/TicketList';
import AuthLayout from '../components/AuthLayout';
import LandingHero from '../components/LandingHero';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
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
      <div className="min-h-[calc(100vh-200px)] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full">
                <MessageSquare className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome back, {user.name}!
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Here's what's happening with your support tickets and how we can help you today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="h-12 px-8 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                <Link to="/kb">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Browse Knowledge Base
                </Link>
              </Button>
              {user.role === 'agent' && (
                <Button variant="outline" asChild className="h-12 px-8 text-lg">
                  <Link to="/agent">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Agent Dashboard
                  </Link>
                </Button>
              )}
              {user.role === 'admin' && (
                <Button variant="outline" asChild className="h-12 px-8 text-lg">
                  <Link to="/admin/users">
                    <Users className="h-5 w-5 mr-2" />
                    Admin Panel
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                    <p className="text-2xl font-bold text-gray-900">{tickets?.length || 0}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Open Tickets</p>
                    <p className="text-2xl font-bold text-orange-600">{getStatusCount('open')}</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Resolved</p>
                    <p className="text-2xl font-bold text-green-600">{getStatusCount('resolved')}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-blue-600">{getStatusCount('waiting_human')}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create Ticket Section */}
            <div className="lg:col-span-1">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5 text-indigo-600" />
                    Create New Ticket
                  </CardTitle>
                  <CardDescription>
                    Submit a new support request and we'll get back to you as soon as possible.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CreateTicketForm />
                </CardContent>
              </Card>
            </div>

            {/* Tickets List Section */}
            <div className="lg:col-span-2">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-indigo-600" />
                        Your Support Tickets
                      </CardTitle>
                      <CardDescription>
                        Track the status of your support requests and view responses from our team.
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'Refresh'
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading && (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-gray-600">Loading your tickets...</span>
                      </div>
                    </div>
                  )}
                  
                  {error && (
                    <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <span className="text-red-600">{error}</span>
                    </div>
                  )}
                  
                  {!loading && !error && tickets && tickets.length === 0 && (
                    <div className="text-center py-12">
                      <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <MessageSquare className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No tickets yet</h3>
                      <p className="text-gray-600 mb-4">
                        You haven't created any support tickets yet. Create your first ticket to get started!
                      </p>
                      <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Ticket
                      </Button>
                    </div>
                  )}
                  
                  {!loading && !error && tickets && tickets.length > 0 && (
                    <TicketList />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Smart Helpdesk?</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Experience the future of customer support with our intelligent, AI-powered helpdesk solution.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg text-center">
                <CardContent className="p-8">
                  <div className="p-4 bg-indigo-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Shield className="h-8 w-8 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered Support</h3>
                  <p className="text-gray-600">
                    Get instant answers with our intelligent AI that learns from your knowledge base and provides accurate responses.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg text-center">
                <CardContent className="p-8">
                  <div className="p-4 bg-green-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Expert Team</h3>
                  <p className="text-gray-600">
                    Our dedicated support team is available 24/7 to help you resolve any issues quickly and efficiently.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg text-center">
                <CardContent className="p-8">
                  <div className="p-4 bg-purple-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-time Tracking</h3>
                  <p className="text-gray-600">
                    Track the progress of your tickets in real-time and get notified when updates are available.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default HomePage;


