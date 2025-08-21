import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import TicketStatus from '../components/TicketStatus';
import { Link } from 'react-router-dom';

import AgentNavbar from '../components/AgentNavbar';
import { 
  Clock, 
  UserCheck, 
  CheckCircle, 
  AlertCircle,
  MessageSquare,
  Calendar,
  ArrowRight,
  TestTube,
  Zap
} from 'lucide-react';

export const AgentDashboard: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [recentSuggestions, setRecentSuggestions] = useState<any[]>([]);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Load all tickets for agent: assigned to me + unassigned
        // Do not pass assignedToMe, server already returns assigned+unassigned by default for agents
        const response = await api.get('/api/tickets', { 
          params: { 
            pageSize: 100
          } 
        });
        setTickets(response.data.items);
      } finally { 
        setLoading(false); 
      }
    }
    load();
  }, []);

  const testAutoTriage = async () => {
    setTestLoading(true);
    try {
      const testCases = [
        "I have a billing issue with my payment method. The charge was declined but I know my card is working.",
        "There's a technical error on your website. I keep getting a 500 error when I try to login.",
        "My package shipment is delayed and the tracking shows no updates for 3 days.",
        "General question about your service features."
      ];
      
      const results = [];
      for (const text of testCases) {
        const response = await api.post('/api/agent/debug/triage-test', { text });
        results.push(response.data);
      }
      
      setTestResult(results);
      
      // Also load recent suggestions
      const suggestionsResponse = await api.get('/api/agent/debug/recent-suggestions?limit=5');
      setRecentSuggestions(suggestionsResponse.data.suggestions || []);
    } catch (error) {
      console.error('Test failed:', error);
      setTestResult([{ error: 'Test failed. Check console for details.' }]);
    } finally {
      setTestLoading(false);
    }
  };

  // Group tickets by status
  const waitingAssigned = tickets.filter(t => t.status === 'waiting_human' && t.assignee);
  const unassigned = tickets.filter(t => t.status === 'open' || (t.status === 'waiting_human' && !t.assignee));
  const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed');
  const triaged = tickets.filter(t => t.status === 'triaged');

  if (loading) {
    return (
      <AgentNavbar>
        <div className="flex items-center justify-center p-8">
          <div className="text-gray-600">Loading tickets...</div>
        </div>
      </AgentNavbar>
    );
  }

  const TicketCard: React.FC<{ ticket: any }> = ({ ticket }) => (
    <div className="group rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-card transition-all hover:shadow-lg hover:scale-[1.02] duration-300">
      <div className="flex items-start justify-between mb-3 sm:mb-4 gap-3">
        <div className="flex-1 min-w-0">
          <Link 
            to={`/tickets/${ticket._id}`} 
            className="text-base sm:text-lg font-mulish font-bold text-neutral-900 hover:text-primary-600 transition-colors line-clamp-2 mb-2 block"
          >
            {ticket.title}
          </Link>
          <p className="text-sm font-mulish font-medium text-neutral-600 line-clamp-2 sm:line-clamp-3 leading-relaxed">{ticket.description}</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <TicketStatus status={ticket.status} />
          <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-300" />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 sm:pt-4 border-t border-neutral-100 gap-2 sm:gap-0">
        <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-mulish font-medium text-neutral-500">
          <div className="flex items-center gap-1 sm:gap-2">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>{ticket.replies?.length || 0} replies</span>
          </div>
        </div>
      </div>
    </div>
  );

  const SectionHeader: React.FC<{ 
    title: string; 
    count: number; 
    icon: React.ReactNode; 
    color: string;
    description: string;
  }> = ({ title, count, icon, color, description }) => (
    <div className="mb-4 sm:mb-6">
      <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
        <div className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl ${color} shadow-sm flex-shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-mulish font-bold text-neutral-900 truncate">{title}</h3>
          <p className="text-xs sm:text-sm font-mulish font-medium text-neutral-500 line-clamp-1 sm:line-clamp-none">{description}</p>
        </div>
        <div className="ml-auto rounded-2xl bg-neutral-100 px-3 py-1 sm:px-4 sm:py-2 shadow-sm flex-shrink-0">
          <span className="text-base sm:text-lg font-mulish font-bold text-neutral-700">{count}</span>
        </div>
      </div>
    </div>
  );

  return (
    <AgentNavbar>
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-mulish font-bold text-neutral-900 mb-2 sm:mb-3">Agent Dashboard</h1>
          <p className="text-base sm:text-lg font-mulish font-medium text-neutral-600">Manage and respond to support tickets</p>
        </div>

        {/* Debug Section */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <TestTube className="h-5 w-5 text-yellow-600" />
                <h2 className="text-lg font-mulish font-bold text-yellow-800">Auto-Triage Debug</h2>
              </div>
              <button
                onClick={() => setDebugMode(!debugMode)}
                className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-200 transition-colors"
              >
                {debugMode ? 'Hide' : 'Show'} Debug
              </button>
            </div>
            
            {debugMode && (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <button
                    onClick={testAutoTriage}
                    disabled={testLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                  >
                    <Zap className="h-4 w-4" />
                    {testLoading ? 'Testing...' : 'Test Auto-Triage'}
                  </button>
                </div>
                
                {testResult && (
                  <div className="bg-white rounded-lg p-4 border border-yellow-200">
                    <h3 className="font-bold text-gray-800 mb-3">Test Results:</h3>
                    <div className="space-y-3">
                      {testResult.map((result: any, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-600 mb-2">Test {index + 1}:</div>
                          <div className="text-xs text-gray-500 mb-2">{result.input}</div>
                          <div className="flex gap-4 text-sm">
                            <span className="font-medium">Category: {result.classification?.predictedCategory}</span>
                            <span className="font-medium">Confidence: {(result.classification?.confidence * 100)?.toFixed(1)}%</span>
                            <span className={`font-bold ${
                              result.willAutoClose ? 'text-green-600' : 'text-orange-600'
                            }`}>
                              {result.willAutoClose ? '✅ Auto-Close' : '👤 Human'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{result.decisionReason}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {recentSuggestions.length > 0 && (
                  <div className="bg-white rounded-lg p-4 border border-yellow-200">
                    <h3 className="font-bold text-gray-800 mb-3">Recent Suggestions:</h3>
                    <div className="space-y-2">
                      {recentSuggestions.map((suggestion: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                          <span className="font-medium">{suggestion.predictedCategory}</span>
                          <span>{(suggestion.confidence * 100).toFixed(1)}%</span>
                          <span className={`font-bold ${
                            suggestion.autoClosed ? 'text-green-600' : 'text-orange-600'
                          }`}>
                            {suggestion.autoClosed ? '✅' : '👤'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="bg-white rounded-lg p-4 border border-yellow-200">
                  <h3 className="font-bold text-gray-800 mb-3">🎨 AI Response Preview:</h3>
                  <div className="text-xs text-gray-600 mb-3">Here's what a structured AI response looks like:</div>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">🤖 AI Assistant</span>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">Auto-Generated</span>
                        </div>
                        <div className="bg-white rounded-lg p-3 border text-xs">
                          <p className="font-semibold text-gray-800 mb-1">Dear Valued Customer,</p>
                          <p className="text-gray-700 mb-2">Thank you for contacting us about your billing inquiry...</p>
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-800">• Recommended Solution:</p>
                            <p className="text-gray-600 ml-3">1. Verify your account details...</p>
                            <p className="font-semibold text-gray-800 mt-2">• Additional Resources:</p>
                            <p className="text-blue-600 ml-3">• Billing FAQ Guide</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    ✨ Structured responses include sections, formatting, and professional tone
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:gap-10 md:grid-cols-2 xl:grid-cols-4">
          {/* Waiting / Assigned */}
          <section className="space-y-6">
            <SectionHeader
              title="Waiting / Assigned"
              count={waitingAssigned.length}
              icon={<Clock className="h-5 w-5 text-orange-600" />}
              color="bg-orange-100"
              description="Tickets assigned to you"
            />
            <div className="space-y-3 sm:space-y-4">
              {waitingAssigned.map(ticket => (
                <TicketCard key={ticket._id} ticket={ticket} />
              ))}
              {waitingAssigned.length === 0 && (
                <div className="rounded-2xl border-2 border-dashed border-neutral-200 p-6 sm:p-8 text-center bg-neutral-50">
                  <Clock className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-neutral-400 mb-3" />
                  <p className="text-sm sm:text-base font-mulish font-semibold text-neutral-500">No tickets waiting</p>
                  <p className="text-xs sm:text-sm font-mulish font-medium text-neutral-400 mt-1">New assignments will appear here</p>
                </div>
              )}
            </div>
          </section>

          {/* Unassigned */}
          <section className="space-y-6">
            <SectionHeader
              title="Unassigned"
              count={unassigned.length}
              icon={<AlertCircle className="h-5 w-5 text-red-600" />}
              color="bg-red-100"
              description="Tickets needing assignment"
            />
            <div className="space-y-4">
              {unassigned.map(ticket => (
                <TicketCard key={ticket._id} ticket={ticket} />
              ))}
              {unassigned.length === 0 && (
                <div className="rounded-2xl border-2 border-dashed border-neutral-200 p-8 text-center bg-neutral-50">
                  <AlertCircle className="mx-auto h-12 w-12 text-neutral-400 mb-3" />
                  <p className="text-base font-mulish font-semibold text-neutral-500">No unassigned tickets</p>
                  <p className="text-sm font-mulish font-medium text-neutral-400 mt-1">All tickets have been assigned</p>
                </div>
              )}
            </div>
          </section>

          {/* Triaged */}
          <section className="space-y-6">
            <SectionHeader
              title="Triaged"
              count={triaged.length}
              icon={<UserCheck className="h-5 w-5 text-blue-600" />}
              color="bg-blue-100"
              description="AI processed tickets"
            />
            <div className="space-y-4">
              {triaged.map(ticket => (
                <TicketCard key={ticket._id} ticket={ticket} />
              ))}
              {triaged.length === 0 && (
                <div className="rounded-2xl border-2 border-dashed border-neutral-200 p-8 text-center bg-neutral-50">
                  <UserCheck className="mx-auto h-12 w-12 text-neutral-400 mb-3" />
                  <p className="text-base font-mulish font-semibold text-neutral-500">No triaged tickets</p>
                  <p className="text-sm font-mulish font-medium text-neutral-400 mt-1">AI-processed tickets will appear here</p>
                </div>
              )}
            </div>
          </section>

          {/* Resolved */}
          <section className="space-y-6">
            <SectionHeader
              title="Resolved"
              count={resolved.length}
              icon={<CheckCircle className="h-5 w-5 text-green-600" />}
              color="bg-green-100"
              description="Completed tickets"
            />
            <div className="space-y-4">
              {resolved.map(ticket => (
                <TicketCard key={ticket._id} ticket={ticket} />
              ))}
              {resolved.length === 0 && (
                <div className="rounded-2xl border-2 border-dashed border-neutral-200 p-8 text-center bg-neutral-50">
                  <CheckCircle className="mx-auto h-12 w-12 text-neutral-400 mb-3" />
                  <p className="text-base font-mulish font-semibold text-neutral-500">No resolved tickets</p>
                  <p className="text-sm font-mulish font-medium text-neutral-400 mt-1">Completed tickets will appear here</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </AgentNavbar>
  );
};

export default AgentDashboard;



