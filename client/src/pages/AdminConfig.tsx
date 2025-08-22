import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import AdminLayout from '../components/AdminLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { 
  Save, 
  CheckCircle, 
  AlertCircle,
  Clock,
  FileText,
  Shield,
  Zap
} from 'lucide-react';

interface ConfigData {
  autoCloseEnabled: boolean;
  confidenceThreshold: number;
  slaHours: number;
  maxAttachmentSize: number;
  allowedAttachmentTypes: string[];
}

export const AdminConfig: React.FC = () => {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { 
    loadConfig(); 
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/config');
      setConfig(res.data.config);
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!config) return;
    
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.put('/api/config', config);
      setConfig(res.data.config);
      setMessage('Settings saved successfully');
    } catch (error) {
      setMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="System Settings">
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-600">Loading settings...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!config) {
    return (
      <AdminLayout title="System Settings">
        <div className="text-center py-8 text-red-600">
          Failed to load configuration
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="System Settings">
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

        {/* Auto Close Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Auto Close Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-close">Auto Close Enabled</Label>
                <p className="text-sm text-gray-600">
                  Automatically close tickets after they are resolved
                </p>
              </div>
              <Switch
                id="auto-close"
                checked={config.autoCloseEnabled}
                onCheckedChange={(checked: boolean) => setConfig({ ...config, autoCloseEnabled: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* AI Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              AI Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="confidence">
                Confidence Threshold ({Math.round(config.confidenceThreshold * 100)}%)
              </Label>
              <p className="text-sm text-gray-600 mb-2">
                Minimum confidence level for AI to auto-resolve tickets
              </p>
              <input
                id="confidence"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={config.confidenceThreshold}
                onChange={e => setConfig({ ...config, confidenceThreshold: Number(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SLA Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Service Level Agreement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="sla-hours">SLA Hours</Label>
              <p className="text-sm text-gray-600 mb-2">
                Maximum time (in hours) to respond to tickets
              </p>
              <Input
                id="sla-hours"
                type="number"
                min={1}
                max={336}
                value={config.slaHours}
                onChange={e => setConfig({ ...config, slaHours: Number(e.target.value) })}
              />
            </div>
          </CardContent>
        </Card>

        {/* File Upload Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              File Upload Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="max-size">Max Attachment Size (bytes)</Label>
              <p className="text-sm text-gray-600 mb-2">
                Maximum file size allowed for attachments
              </p>
              <Input
                id="max-size"
                type="number"
                min={0}
                value={config.maxAttachmentSize}
                onChange={e => setConfig({ ...config, maxAttachmentSize: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="allowed-types">Allowed Attachment Types</Label>
              <p className="text-sm text-gray-600 mb-2">
                Comma-separated list of allowed file extensions
              </p>
              <Input
                id="allowed-types"
                value={config.allowedAttachmentTypes.join(', ')}
                onChange={e => setConfig({ 
                  ...config, 
                  allowedAttachmentTypes: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) 
                })}
                placeholder="pdf, jpg, png, doc, docx"
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminConfig;



