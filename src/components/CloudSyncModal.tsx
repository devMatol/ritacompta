import React, { useState } from 'react';
import { Cloud, Check, X, AlertCircle, Database, Copy, RefreshCw, Smartphone } from 'lucide-react';
import { getSupabaseConfig, saveSupabaseConfig, clearSupabaseConfig, getSupabaseClient } from '../db/supabase';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncSuccess: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  onSyncSuccess
}) => {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [key, setKey] = useState(currentConfig.key);
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !key.trim()) {
      setStatus('error');
      setStatusMsg('Please provide both Project URL and Anon Key.');
      return;
    }

    setStatus('testing');
    setStatusMsg('Testing connection to Supabase...');

    try {
      saveSupabaseConfig(url, key);
      const client = getSupabaseClient();
      if (!client) throw new Error('Could not initialize Supabase client.');

      // Test query
      const { data, error } = await client.from('items').select('id').limit(1);
      if (error) {
        throw new Error(`Database responded with error: ${error.message}. (Did you run the SQL schema in Supabase?)`);
      }

      setStatus('success');
      setStatusMsg('Connected successfully! Real-time multi-device sync is now active.');
      onSyncSuccess();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setStatusMsg(err.message || 'Connection failed.');
    }
  };

  const handleDisconnect = () => {
    clearSupabaseConfig();
    setUrl('');
    setKey('');
    setStatus('idle');
    setStatusMsg('Cloud synchronization disconnected. Operating in local mode.');
    onSyncSuccess();
  };

  const handleCopySql = () => {
    const sql = `-- Kozha Cloud Database Schema
create table if not exists items (
  id text primary key,
  brand text not null,
  title text not null,
  category text not null,
  size text,
  source text,
  purchase_price numeric default 0,
  target_price numeric default 0,
  photo text,
  purchase_date text,
  vinted_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists sales (
  id text primary key,
  item_id text,
  brand text not null,
  title text not null,
  channel text not null,
  sale_price numeric not null,
  purchase_price numeric default 0,
  photo text,
  sale_date text not null,
  purchase_date text,
  payment_method text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists vinted_catalog (
  id text primary key,
  title text not null,
  brand text not null,
  condition text,
  size text,
  price numeric not null,
  photo text,
  url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table items enable row level security;
alter table sales enable row level security;
alter table vinted_catalog enable row level security;

create policy "Anon all on items" on items for all to anon using (true) with check (true);
create policy "Anon all on sales" on sales for all to anon using (true) with check (true);
create policy "Anon all on vinted_catalog" on vinted_catalog for all to anon using (true) with check (true);

alter publication supabase_realtime add table items;
alter publication supabase_realtime add table sales;
alter publication supabase_realtime add table vinted_catalog;`;

    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border-strong rounded-md w-full max-w-lg p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        
        <div className="flex justify-between items-baseline border-b border-border pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Cloud size={18} className="text-accent" />
            <h3 className="font-heading text-lg font-bold text-primary">Live Cloud Database Sync</h3>
          </div>
          <button onClick={onClose} className="text-secondary hover:text-primary p-1">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-secondary leading-relaxed mb-4">
          Connect your free Supabase database so Rita's phone, your computer, and any Vercel deployment share the exact same live inventory in real time.
        </p>

        {currentConfig.isConfigured ? (
          <div className="p-3.5 bg-profit-soft border border-profit/30 rounded-sm mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-profit">
              <span className="w-2 h-2 rounded-full bg-profit animate-pulse"></span>
              <span>Cloud Connected & Real-time Live</span>
            </div>
            <button
              onClick={handleDisconnect}
              className="text-[11px] text-danger hover:underline font-mono"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="p-3 bg-surface-subtle border border-border rounded-sm mb-5 text-xs text-secondary flex items-start gap-2.5">
            <Database size={16} className="text-accent shrink-0 mt-0.5" />
            <div>
              <strong className="text-primary font-semibold">Running in Local Mode:</strong> Changes are currently saved inside this browser only. Configure Supabase below to enable live multi-device sync across phones and computers.
            </div>
          </div>
        )}

        <form onSubmit={handleTestAndSave} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-secondary mb-1">
              Supabase Project URL
            </label>
            <input
              type="url"
              required
              placeholder="https://xyzcompany.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 font-mono text-xs bg-surface border border-border-strong rounded-sm outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-secondary mb-1">
              Supabase Anon / Public Key
            </label>
            <input
              type="text"
              required
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full px-3 py-2 font-mono text-xs bg-surface border border-border-strong rounded-sm outline-none focus:border-accent"
            />
          </div>

          {status === 'testing' && (
            <div className="flex items-center gap-2 text-xs text-accent font-medium">
              <RefreshCw size={13} className="animate-spin" />
              <span>{statusMsg}</span>
            </div>
          )}

          {status === 'success' && (
            <div className="flex items-center gap-2 text-xs text-profit font-medium">
              <Check size={14} />
              <span>{statusMsg}</span>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-start gap-2 text-xs text-danger font-medium p-2.5 bg-danger/10 border border-danger/20 rounded-sm">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{statusMsg}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={handleCopySql}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-surface-subtle border border-border rounded-sm hover:border-accent text-secondary hover:text-primary transition-all"
              title="Copy the SQL table creation script to run in Supabase SQL editor"
            >
              <Copy size={13} />
              <span>{copiedSql ? 'SQL Script Copied!' : 'Copy SQL Schema'}</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-semibold bg-surface border border-border rounded-sm hover:bg-surface-subtle text-secondary"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={status === 'testing'}
                className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider bg-accent text-white rounded-sm hover:brightness-110 shadow-sm transition-all"
              >
                Save & Connect
              </button>
            </div>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-border text-[11px] text-tertiary space-y-1">
          <div><strong className="text-secondary">On Vercel:</strong> You can also set these environment variables directly in your Vercel Project Settings:</div>
          <div className="font-mono bg-surface-subtle p-2 rounded-sm border border-border text-secondary">
            VITE_SUPABASE_URL=https://...supabase.co<br />
            VITE_SUPABASE_ANON_KEY=eyJ...
          </div>
        </div>

      </div>
    </div>
  );
};
