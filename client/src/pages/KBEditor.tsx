import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import KBLayout from '../components/KBLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Save, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

export const KBEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<string>('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { 
    setMessage(null); 
  }, [title, body, tags, status]);

  // Load existing article if editing
  useEffect(() => {
    if (id) {
      loadArticle();
    }
  }, [id]);

  const loadArticle = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/kb/${id}`);
      const article = res.data.article;
      setTitle(article.title);
      setBody(article.body);
      setTags(article.tags?.join(', ') || '');
      setStatus(article.status);
    } catch (e: any) {
      setMessage(e?.response?.data?.error?.message || 'Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  async function save() {
    setSaving(true);
    setMessage(null);
    const payload: any = { 
      title, 
      body, 
      tags: tags.split(',').map(s => s.trim()).filter(Boolean), 
      status 
    };
    
    try {
      if (!id) {
        const res = await api.post('/api/kb', payload);
        setMessage('Article created successfully');
        setTimeout(() => {
          navigate(`/kb/editor/${res.data.article._id}`);
        }, 1000);
      } else {
        await api.put(`/api/kb/${id}`, payload);
        setMessage('Article updated successfully');
      }
    } catch (e: any) {
      setMessage(e?.response?.data?.error?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const createNew = () => {
    setTitle('');
    setBody('');
    setTags('');
    setStatus('draft');
    setMessage(null);
    navigate('/kb/editor');
  };

  if (loading) {
    return (
      <KBLayout title="Loading Article...">
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-600">Loading article...</div>
        </div>
      </KBLayout>
    );
  }

  return (
    <KBLayout title={id ? 'Edit Article' : 'New Article'}>
      <div className="space-y-6">
        {/* Message Display */}
        {message && (
          <div className={`flex items-center gap-2 rounded-md p-3 ${
            message.includes('successfully') 
              ? 'bg-green-50 text-green-700' 
              : 'bg-red-50 text-red-700'
          }`}>
            {message.includes('successfully') ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {message}
          </div>
        )}

        {/* Editor Form */}
        <Card>
          <CardHeader>
            <CardTitle>Article Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Enter article title..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <Textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Write your article content here..."
                rows={12}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <Input
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="Enter tags separated by commas..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <Select value={status} onValueChange={(value: 'draft' | 'published') => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={save} disabled={saving || !title.trim() || !body.trim()}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : (id ? 'Update Article' : 'Create Article')}
              </Button>
              
              {id && (
                <Button variant="outline" onClick={createNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Article
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </KBLayout>
  );
};

export default KBEditor;


