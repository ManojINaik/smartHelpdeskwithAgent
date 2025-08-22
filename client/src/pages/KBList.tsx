import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import KBLayout from '../components/KBLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Search, Edit3, Calendar, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Article {
  _id: string;
  title: string;
  body: string;
  tags: string[];
  status: 'draft' | 'published';
  updatedAt: string;
}

export const KBList: React.FC = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to extract clean preview text from markdown
  const getPreviewText = (markdownContent: string, maxLength: number = 200): string => {
    // Remove markdown formatting for preview
    let preview = markdownContent
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/```[\s\S]*?```/g, '[Code Block]') // Replace code blocks
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, keep text
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    if (preview.length > maxLength) {
      preview = preview.substring(0, maxLength).trim() + '...';
    }
    
    return preview || 'No content preview available';
  };

  async function loadAllArticles() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/kb/all');
      setArticles(res.data.results);
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || 'Failed to load articles');
    } finally {
      setLoading(false);
    }
  }

  async function search() {
    if (!query.trim()) {
      // If query is empty, load all articles instead of searching
      loadAllArticles();
      return;
    }
    
    setLoading(true); 
    setError(null);
    try {
      const res = await api.get('/api/kb', { params: { query } });
      setArticles(res.data.results);
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || 'Search failed');
    } finally { 
      setLoading(false); 
    }
  }

  useEffect(() => { 
    loadAllArticles(); 
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search();
  };

  return (
    <KBLayout title="Knowledge Base">
      <div className="space-y-6">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search knowledge base articles..."
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </form>

        {/* Loading and Error States */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-600">Loading articles...</div>
          </div>
        )}
        
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Articles List */}
        {!loading && !error && (
          <div className="space-y-4">
            {articles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                {query.trim() ? (
                  <>
                    <p>No articles found for "{query}".</p>
                    <p className="text-sm mt-1">Try adjusting your search terms.</p>
                  </>
                ) : (
                  <>
                    <p>No knowledge base articles found.</p>
                    <p className="text-sm mt-1">Create your first article to get started.</p>
                  </>
                )}
              </div>
            ) : (
              articles.map(article => (
                <Card key={article._id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                          <Link 
                            to={`/kb/article/${article._id}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {article.title}
                          </Link>
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(article.updatedAt).toLocaleDateString()}
                          </div>
                          <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>
                            {article.status}
                          </Badge>
                        </div>
                      </div>
                      {user?.role === 'admin' && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/kb/editor/${article._id}`}>
                            <Edit3 className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 line-clamp-3 mb-3">
                      {getPreviewText(article.body)}
                    </p>
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-gray-400" />
                        <div className="flex gap-1 flex-wrap">
                          {article.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </KBLayout>
  );
};

export default KBList;


