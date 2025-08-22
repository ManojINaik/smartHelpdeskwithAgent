import React, { useState } from 'react';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Search, 
  Brain, 
  Clock, 
  TrendingUp, 
  Database,
  Zap,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

interface RAGTestResult {
  result: {
    articles: Array<{
      article: {
        _id: string;
        title: string;
        body: string;
        tags: string[];
        status: string;
        createdAt: string;
        updatedAt: string;
      };
      score: number;
      relevanceReason: string;
    }>;
    query: string;
    searchMethod: 'vector' | 'hybrid' | 'keyword';
    totalMatches: number;
    executionTimeMs: number;
  };
}

interface RAGStats {
  stats: {
    totalArticles: number;
    articlesWithEmbeddings: number;
    embeddingsNeedingUpdate: number;
    averageEmbeddingAge: number;
    coveragePercentage: number;
    upToDatePercentage: number;
  };
}

export const RAGTestInterface: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RAGTestResult | null>(null);
  const [stats, setStats] = useState<RAGStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [embeddingLoading, setEmbeddingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useVectorSearch, setUseVectorSearch] = useState(true);

  const searchRAG = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/api/rag/search', {
        query: query.trim(),
        limit: 5,
        useVectorSearch
      });
      
      setResult(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'RAG search failed');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    setStatsLoading(true);
    
    try {
      const response = await api.get('/api/rag/stats');
      setStats(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load RAG stats');
    } finally {
      setStatsLoading(false);
    }
  };

  const generateAllEmbeddings = async () => {
    setEmbeddingLoading(true);
    setError(null);
    
    try {
      await api.post('/api/rag/embeddings/generate-all');
      setError(null);
      alert('Embedding generation started in background. Check server logs for progress.');
      
      // Refresh stats after a moment
      setTimeout(loadStats, 2000);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to start embedding generation');
    } finally {
      setEmbeddingLoading(false);
    }
  };

  React.useEffect(() => {
    loadStats();
  }, []);

  const getSearchMethodIcon = (method: string) => {
    switch (method) {
      case 'vector': return <Brain className="h-4 w-4 text-purple-600" />;
      case 'hybrid': return <Zap className="h-4 w-4 text-blue-600" />;
      case 'keyword': return <Search className="h-4 w-4 text-green-600" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  const getSearchMethodColor = (method: string) => {
    switch (method) {
      case 'vector': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'hybrid': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'keyword': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">RAG System Test Interface</h2>
          <p className="text-gray-600">Test vector search and retrieval-augmented generation</p>
        </div>
      </div>

      {/* RAG Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            RAG System Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="flex items-center gap-2 text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600" />
              Loading statistics...
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.stats.totalArticles}</div>
                <div className="text-sm text-blue-700">Total Articles</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.stats.articlesWithEmbeddings}</div>
                <div className="text-sm text-green-700">With Embeddings</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.stats.coveragePercentage}%</div>
                <div className="text-sm text-purple-700">Coverage</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.stats.embeddingsNeedingUpdate}</div>
                <div className="text-sm text-orange-700">Need Update</div>
              </div>
              <div className="text-center p-4 bg-teal-50 rounded-lg">
                <div className="text-2xl font-bold text-teal-600">{stats.stats.upToDatePercentage}%</div>
                <div className="text-sm text-teal-700">Up to Date</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{stats.stats.averageEmbeddingAge.toFixed(1)}</div>
                <div className="text-sm text-gray-700">Avg Age (days)</div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">No statistics available</div>
          )}
          
          <div className="mt-4 flex gap-2">
            <Button 
              onClick={loadStats}
              disabled={statsLoading}
              variant="outline"
              size="sm"
            >
              {statsLoading ? 'Loading...' : 'Refresh Stats'}
            </Button>
            <Button 
              onClick={generateAllEmbeddings}
              disabled={embeddingLoading}
              size="sm"
            >
              {embeddingLoading ? 'Starting...' : 'Generate All Embeddings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* RAG Search Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Test RAG Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Query
            </label>
            <Textarea
              placeholder="Enter a support query to test RAG retrieval (e.g., 'I need a refund for my order', 'Login not working', 'Shipping delay')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useVectorSearch}
                onChange={(e) => setUseVectorSearch(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Use Vector Search</span>
            </label>
          </div>

          <Button 
            onClick={searchRAG}
            disabled={loading || !query.trim()}
            className="w-full"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Searching...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Test RAG Search
              </div>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Search Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Search Results
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                {getSearchMethodIcon(result.result.searchMethod)}
                <Badge className={getSearchMethodColor(result.result.searchMethod)}>
                  {result.result.searchMethod.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {result.result.executionTimeMs}ms
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                {result.result.totalMatches} matches
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {result.result.articles.length > 0 ? (
                result.result.articles.map((item) => (
                  <div key={item.article._id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{item.article.title}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Score: {item.score.toFixed(1)}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {item.relevanceReason}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm mb-3 line-clamp-3">
                      {item.article.body}
                    </p>
                    <div className="flex items-center gap-2">
                      {item.article.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Info className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <h3 className="font-medium text-gray-600 mb-1">No Results Found</h3>
                  <p className="text-sm">Try a different query or check if articles are published</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};