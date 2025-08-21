import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import KBLayout from '../components/KBLayout';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Edit3, Calendar, Tag, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import MarkdownRenderer from '../components/MarkdownRenderer';

interface Article {
  _id: string;
  title: string;
  body: string;
  tags: string[];
  status: 'draft' | 'published';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const KBArticle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadArticle();
    }
  }, [id]);

  const loadArticle = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/kb/${id}`);
      setArticle(res.data.article);
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || 'Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <KBLayout>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-600">Loading article...</div>
        </div>
      </KBLayout>
    );
  }

  if (error || !article) {
    return (
      <KBLayout>
        <div className="rounded-md bg-red-50 p-4 text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error || 'Article not found'}
          </div>
        </div>
      </KBLayout>
    );
  }

  return (
    <KBLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link to="/kb">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Knowledge Base
            </Link>
          </Button>
          {user?.role === 'admin' && (
            <Button variant="outline" asChild>
              <Link to={`/kb/editor/${article._id}`}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Article
              </Link>
            </Button>
          )}
        </div>

        {/* Article Content */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-4">{article.title}</CardTitle>
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
            </div>
          </CardHeader>
          <CardContent>
            <MarkdownRenderer 
              content={article.body} 
              className="mb-6"
            />
            
            {article.tags && article.tags.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Tags:</span>
                  <div className="flex gap-2 flex-wrap">
                    {article.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </KBLayout>
  );
};

export default KBArticle;
