import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';

export const SuggestionReview: React.FC = () => {
  const { ticketId } = useParams();
  const [suggestion, setSuggestion] = useState<any>(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/api/agent/suggestion/${ticketId}`);
        setSuggestion(res.data.suggestion);
        setDraft(res.data.suggestion.draftReply);
      } finally { setLoading(false); }
    }
    if (ticketId) load();
  }, [ticketId]);

  const accept = async () => {
    await api.post('/api/agent/suggestion/accept', { ticketId, editedReply: draft });
    window.history.back();
  };
  const reject = async () => {
    await api.post('/api/agent/suggestion/reject', { ticketId });
    window.history.back();
  };

  if (loading) return <div className="p-4 text-gray-600">Loading...</div>;
  if (!suggestion) return <div className="p-4 text-red-600">No suggestion found</div>;

  return (
    <div className="mx-auto max-w-3xl p-4">
      <h2 className="mb-2 text-xl font-semibold">AI Suggestion</h2>
      <div className="mb-4 text-sm text-gray-600">Confidence: {(suggestion.confidence * 100).toFixed(0)}% • Category: {suggestion.predictedCategory}</div>
      <textarea className="mb-3 w-full rounded border p-2" rows={8} value={draft} onChange={e => setDraft(e.target.value)} />
      <div className="flex gap-2">
        <button className="rounded bg-green-600 px-4 py-2 text-white" onClick={accept}>Accept & Send</button>
        <button className="rounded bg-gray-200 px-4 py-2" onClick={reject}>Reject</button>
      </div>
    </div>
  );
};

export default SuggestionReview;


