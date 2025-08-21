import React, { useEffect, useState } from 'react';
import api from '../lib/api';

export const KBEditor: React.FC = () => {
  const [id, setId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<string>('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => { setMessage(null); }, [title, body, tags, status]);

  async function save() {
    setMessage(null);
    const payload: any = { title, body, tags: tags.split(',').map(s => s.trim()).filter(Boolean), status };
    try {
      if (!id) {
        const res = await api.post('/api/kb', payload);
        setId(res.data.article._id);
        setMessage('Article created');
      } else {
        await api.put(`/api/kb/${id}`, payload);
        setMessage('Article updated');
      }
    } catch (e: any) {
      setMessage(e?.response?.data?.error?.message || 'Save failed');
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-4">
      <h2 className="mb-4 text-xl font-semibold">KB Editor</h2>
      {message && <div className="mb-3 text-sm text-gray-700">{message}</div>}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input className="mt-1 w-full rounded border px-3 py-2" value={title} onChange={e => setTitle(e.target.value)} />
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700">Body</label>
        <textarea className="mt-1 w-full rounded border px-3 py-2" rows={10} value={body} onChange={e => setBody(e.target.value)} />
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700">Tags</label>
        <input className="mt-1 w-full rounded border px-3 py-2" placeholder="comma,separated" value={tags} onChange={e => setTags(e.target.value)} />
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700">Status</label>
        <select className="mt-1 w-full rounded border px-3 py-2" value={status} onChange={e => setStatus(e.target.value as any)}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button className="rounded bg-blue-600 px-4 py-2 text-white" onClick={save}>{id ? 'Update' : 'Create'}</button>
        {id && <button className="rounded bg-gray-200 px-4 py-2" onClick={() => { setId(null); setTitle(''); setBody(''); setTags(''); setStatus('draft'); }}>New</button>}
      </div>
    </div>
  );
};

export default KBEditor;


