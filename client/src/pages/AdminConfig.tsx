import React, { useEffect, useState } from 'react';
import api from '../lib/api';

export const AdminConfig: React.FC = () => {
  const [config, setConfig] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => { (async () => {
    const res = await api.get('/api/config');
    setConfig(res.data.config);
  })(); }, []);

  const save = async () => {
    setMessage(null);
    const res = await api.put('/api/config', config);
    setConfig(res.data.config);
    setMessage('Saved');
  };

  if (!config) return <div className="p-4 text-gray-600">Loading...</div>;

  return (
    <div className="mx-auto max-w-3xl p-4">
      <h2 className="mb-4 text-xl font-semibold">System Settings</h2>
      {message && <div className="mb-3 text-sm text-green-700">{message}</div>}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Auto Close Enabled</label>
          <input type="checkbox" checked={config.autoCloseEnabled} onChange={e => setConfig({ ...config, autoCloseEnabled: e.target.checked })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Confidence Threshold ({Math.round(config.confidenceThreshold*100)}%)</label>
          <input type="range" min={0} max={1} step={0.01} value={config.confidenceThreshold} onChange={e => setConfig({ ...config, confidenceThreshold: Number(e.target.value) })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">SLA Hours</label>
          <input className="mt-1 w-full rounded border px-3 py-2" type="number" min={1} max={336} value={config.slaHours} onChange={e => setConfig({ ...config, slaHours: Number(e.target.value) })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Max Attachment Size (bytes)</label>
          <input className="mt-1 w-full rounded border px-3 py-2" type="number" min={0} value={config.maxAttachmentSize} onChange={e => setConfig({ ...config, maxAttachmentSize: Number(e.target.value) })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Allowed Attachment Types (comma)</label>
          <input className="mt-1 w-full rounded border px-3 py-2" value={config.allowedAttachmentTypes.join(',')} onChange={e => setConfig({ ...config, allowedAttachmentTypes: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })} />
        </div>
        <button className="rounded bg-blue-600 px-4 py-2 text-white" onClick={save}>Save</button>
      </div>
    </div>
  );
};

export default AdminConfig;


