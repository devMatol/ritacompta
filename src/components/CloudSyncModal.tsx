import React, { useState } from 'react';
import { Cloud, Check, X, AlertCircle, Database, Copy, RefreshCw } from 'lucide-react';
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
      setStatusMsg('Veuillez renseigner l’URL du projet et la clé publique Anon.');
      return;
    }

    setStatus('testing');
    setStatusMsg('Test de la connexion Supabase...');

    try {
      saveSupabaseConfig(url, key);
      const client = getSupabaseClient();
      if (!client) throw new Error('Impossible d’initialiser le client Supabase.');

      const { error } = await client.from('items').select('id').limit(1);
      if (error) {
        throw new Error(`Erreur de base de données : ${error.message}`);
      }

      setStatus('success');
      setStatusMsg('Connecté avec succès ! Synchronisation temps réel active.');
      onSyncSuccess();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setStatusMsg(err.message || 'Échec de connexion.');
    }
  };

  const handleDisconnect = () => {
    clearSupabaseConfig();
    setUrl('');
    setKey('');
    setStatus('idle');
    setStatusMsg('Synchronisation déconnectée. Fonctionnement en mode local.');
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
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0E0A0D]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="card-glossy w-full max-w-lg p-5 sm:p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        
        <div className="flex justify-between items-baseline pb-3 mb-4 border-b border-[rgba(255,190,220,0.07)]">
          <div className="flex items-center gap-2">
            <Cloud size={18} className="text-accent-light" />
            <h3 className="text-base sm:text-lg font-bold text-primary">Synchronisation Cloud Supabase</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-secondary hover:text-primary transition-all">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-secondary leading-relaxed mb-4">
          Connectez votre base Supabase gratuite pour synchroniser en direct l’inventaire entre téléphone, ordinateur et déploiement Vercel.
        </p>

        {currentConfig.isConfigured ? (
          <div className="p-3.5 bg-[rgba(127,227,181,0.12)] border border-menthe/30 rounded-xl mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-menthe">
              <span className="w-2 h-2 rounded-full bg-menthe shadow-[0_0_8px_rgba(127,227,181,0.6)]" />
              <span>Connecté au cloud & temps réel actif</span>
            </div>
            <button
              onClick={handleDisconnect}
              className="text-[11px] text-corail hover:underline"
            >
              Déconnecter
            </button>
          </div>
        ) : (
          <div className="p-3 bg-white/[0.02] border border-[rgba(255,190,220,0.08)] rounded-xl mb-4 text-xs text-secondary flex items-start gap-2.5">
            <Database size={16} className="text-accent-light shrink-0 mt-0.5" />
            <div>
              <strong className="text-primary font-medium">Mode local :</strong> Les données sont actuellement stockées sur cet appareil uniquement.
            </div>
          </div>
        )}

        <form onSubmit={handleTestAndSave} className="space-y-3.5">
          <div>
            <label className="block text-xs font-normal text-secondary mb-1">
              URL du projet Supabase
            </label>
            <input
              type="url"
              required
              placeholder="https://xyz.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 font-mono text-xs bg-white/[0.04] border border-[rgba(255,190,220,0.12)] rounded-xl text-primary outline-none focus:border-accent-light"
            />
          </div>

          <div>
            <label className="block text-xs font-normal text-secondary mb-1">
              Clé publique Anon
            </label>
            <input
              type="text"
              required
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full px-3 py-2 font-mono text-xs bg-white/[0.04] border border-[rgba(255,190,220,0.12)] rounded-xl text-primary outline-none focus:border-accent-light"
            />
          </div>

          {status === 'testing' && (
            <div className="flex items-center gap-2 text-xs text-accent-light font-medium">
              <RefreshCw size={13} className="animate-spin" />
              <span>{statusMsg}</span>
            </div>
          )}

          {status === 'success' && (
            <div className="flex items-center gap-2 text-xs text-menthe font-medium">
              <Check size={14} />
              <span>{statusMsg}</span>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-start gap-2 text-xs text-corail font-medium p-2.5 bg-corail/10 border border-corail/25 rounded-xl">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{statusMsg}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleCopySql}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-full btn-secondary-glossy"
            >
              <Copy size={13} />
              <span>{copiedSql ? 'Schéma SQL copié !' : 'Copier le schéma SQL'}</span>
            </button>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs rounded-full btn-secondary-glossy"
              >
                Fermer
              </button>
              <button
                type="submit"
                disabled={status === 'testing'}
                className="px-4 py-2 text-xs font-semibold rounded-full bg-[rgba(255,143,192,0.18)] border border-[rgba(255,143,192,0.35)] text-accent-pale hover:bg-[rgba(255,143,192,0.28)] transition-all cursor-pointer"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
