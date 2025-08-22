import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { ModernCard, GradientCard } from './ui/card';
import { 
  Shield, 
  CheckCircle,
  ArrowRight,
  Edit,
  User
} from 'lucide-react';

export const LandingHero: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute left-[-195px] top-[712px] w-[936px] h-[936px] bg-background-secondary rounded-full opacity-80" />
        <div className="absolute right-0 top-0 w-[400px] h-[400px] bg-primary-100 rounded-full opacity-60" />
      </div>
      
      <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-20">
          {/* Profile Card - Inspired by design */}
          <div className="flex justify-center mb-12">
            <GradientCard className="relative w-96 text-center">
              {/* Profile Avatar */}
              <div className="relative mb-6">
                <div className="w-44 h-44 mx-auto rounded-full bg-warning-400 flex items-center justify-center text-6xl shadow-xl">
                  🚀
                </div>
                <div className="absolute bottom-2 right-20 w-9 h-9 bg-white/20 rounded-full" />
              </div>
              
              <h2 className="text-sm font-mulish font-semibold text-white/90 mb-1">
                Welcome back
              </h2>
              <h1 className="text-2xl font-mulish font-bold text-white mb-6">
                Smart Helpdesk
              </h1>
              
              <Button 
                variant="secondary" 
                size="lg" 
                className="bg-white text-primary-800 hover:bg-white/90 rounded-4xl font-mulish font-semibold px-8"
                asChild
              >
                <Link to="/register">
                  <Edit className="w-4 h-4 mr-2" />
                  Get Started
                </Link>
              </Button>
            </GradientCard>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-mulish font-bold text-primary-800 mb-6 leading-tight">
            AI-Powered Support
            <span className="block text-primary-400">
              Made Simple
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-neutral-400 mb-8 max-w-3xl mx-auto leading-relaxed font-mulish font-medium">
            Transform your customer support with intelligent AI that learns, adapts, and provides instant solutions. 
            Experience the future of helpdesk management.
          </p>
        </div>

        {/* Features Grid - Modern Card Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {/* Payment Card Inspired Design */}
          <ModernCard variant="payment" className="relative">
            <div className="mb-6">
              <h3 className="text-lg font-mulish font-bold text-neutral-900 mb-2">
                Smart Ticketing
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mulish font-bold text-neutral-400 uppercase tracking-widest mb-2">
                    PRIORITY LEVEL
                  </label>
                  <div className="h-15 w-full rounded-lg border-2 border-primary-500 bg-background flex items-center px-5">
                    <span className="text-base font-mulish font-bold tracking-widest text-primary-800">
                      HIGH PRIORITY
                    </span>
                    <Shield className="ml-auto w-6 h-6 text-primary-500" />
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-mulish font-bold text-neutral-400 uppercase tracking-widest mb-2">
                      STATUS
                    </label>
                    <div className="h-15 rounded-lg border-2 border-neutral-200 bg-background flex items-center px-4">
                      <span className="text-sm font-mulish font-bold text-primary-800">
                        ACTIVE
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-mulish font-bold text-neutral-400 uppercase tracking-widest mb-2">
                      AGENT
                    </label>
                    <div className="h-15 rounded-lg border-2 border-neutral-200 bg-background flex items-center px-4">
                      <span className="text-sm font-mulish font-bold text-primary-800">
                        AI BOT
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between mt-6">
                <Button variant="outline" size="lg" className="font-mulish font-bold">
                  Cancel
                </Button>
                <Button variant="default" size="lg" className="font-mulish font-bold">
                  Create Ticket
                </Button>
              </div>
            </div>
          </ModernCard>
          
          {/* Profile Success Card */}
          <ModernCard variant="profile">
            <div className="space-y-6">
              <div className="flex items-center">
                <div className="w-9 h-9 rounded-full bg-success-500 flex items-center justify-center mr-4">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-mulish font-bold text-primary-900">
                    Knowledge Base
                  </h3>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-9 h-9 rounded-full bg-success-500 flex items-center justify-center mr-4">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-mulish font-bold text-primary-900">
                    Agent Dashboard
                  </h3>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-9 h-9 rounded-full border-2 border-primary-400 flex items-center justify-center mr-4">
                  <User className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <h3 className="text-lg font-mulish font-bold text-primary-400">
                    Analytics Setup
                  </h3>
                  <p className="text-sm font-mulish font-semibold text-neutral-700">
                    Configure advanced reporting and insights dashboard
                  </p>
                </div>
              </div>
            </div>
          </ModernCard>

          {/* Success Notification Card */}
          <ModernCard className="text-center">
            <div className="mb-6">
              <div className="w-17 h-17 mx-auto rounded-full bg-success-500 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-mulish font-bold text-neutral-900 mb-2">
                Setup Complete
              </h2>
              <p className="text-base font-mulish font-semibold text-neutral-400">
                Your helpdesk is ready to serve customers
              </p>
            </div>
          </ModernCard>
        </div>

        {/* Analytics Section - Chart Inspired */}
        <div className="mb-20">
          <ModernCard className="">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-5xl font-mulish font-bold text-primary-600 mb-2">
                  $58,092.10
                </h2>
                <p className="text-sm font-mulish font-bold text-success-light">
                  +530.21% over the past quarter
                </p>
              </div>
              <div className="flex items-center gap-2 text-primary-900">
                <span className="font-mulish font-bold">Analytics</span>
                <ArrowRight className="w-5 h-5 rotate-90" />
              </div>
            </div>
            
            {/* Chart Area Simulation */}
            <div className="relative h-48 mb-6">
              <div className="absolute inset-0 bg-gradient-to-t from-primary-500/20 to-transparent rounded-lg" />
              <div className="absolute bottom-0 left-0 right-0 h-24 border-t-2 border-primary-500 rounded-lg" />
              <div className="absolute left-1/2 top-12 w-0.5 h-24 border-l-2 border-dashed border-primary-600" />
              <div className="absolute left-1/2 top-20 w-3 h-3 bg-white border-2 border-primary-600 rounded-full" />
            </div>
            
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-sm font-mulish font-bold text-neutral-600 mb-1">Jan</p>
                <p className="text-base font-mulish font-bold text-neutral-800">$30,000</p>
              </div>
              <div>
                <p className="text-sm font-mulish font-bold text-neutral-600 mb-1">Feb</p>
                <p className="text-base font-mulish font-bold text-neutral-800">$40,000</p>
              </div>
              <div>
                <p className="text-sm font-mulish font-bold text-neutral-600 mb-1">Mar</p>
                <p className="text-base font-mulish font-bold text-neutral-800">$50,000</p>
              </div>
            </div>
          </ModernCard>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <GradientCard className="text-center">
            <h2 className="text-4xl font-mulish font-bold text-white mb-6">
              Ready to Transform Your Support?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto font-mulish font-medium">
              Join thousands of companies that have revolutionized their customer support.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button 
                asChild 
                size="xl" 
                variant="secondary" 
                className="bg-white text-primary-800 hover:bg-white/90 font-mulish font-bold"
              >
                <Link to="/register">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button 
                asChild 
                size="xl" 
                variant="outline" 
                className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-mulish font-bold"
              >
                <Link to="/login">
                  Sign In
                </Link>
              </Button>
            </div>
          </GradientCard>
        </div>
      </div>
    </div>
  );
};

export default LandingHero;
