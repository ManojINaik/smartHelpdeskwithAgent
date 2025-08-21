import React, { useEffect, useState } from 'react';
import api from '../lib/api';

interface Article {
  _id: string;
  title: string;
  body: string;
  tags: string[];
  status: 'draft' | 'published';
  updatedAt: string;
}

export const KBList: React.FC = () => {
  const [query, setQuery] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search() {
    setLoading(true); setError(null);
    try {
      const res = await api.get('/api/kb', { params: { query } });
      setArticles(res.data.results);
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || 'Search failed');
    } finally { setLoading(false); }
  }

  useEffect(() => { search(); }, []);

  return (
    <div className="mx-auto max-w-5xl p-4">
      <div className="mb-4 flex gap-2">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search KB..." className="flex-1 rounded border px-3 py-2" />
        <button className="rounded bg-blue-600 px-4 py-2 text-white" onClick={search}>Search</button>
      </div>
      {loading && <div className="text-gray-600">Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      <ul className="space-y-2">
        {articles.map(a => (
          <li key={a._id} className="rounded border p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{a.title}</div>
                <div className="text-sm text-gray-600">{a.status} • {new Date(a.updatedAt).toLocaleString()}</div>
              </div>
              <span className={`rounded px-2 py-0.5 text-xs ${a.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>{a.status}</span>
            </div>
            <p className="mt-2 line-clamp-2 text-gray-700">{a.body}</p>
            <div className="mt-2 text-xs text-gray-600">{a.tags?.join(', ')}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default KBList;


