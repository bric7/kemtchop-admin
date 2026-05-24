// src/components/PushCampaignManager.tsx
import React, { useState } from 'react';
import { Send, Users, Bell, AlertCircle } from 'lucide-react';

interface PushCampaignForm {
  title: string;
  body: string;
  target: 'all' | 'affiliates' | 'segment:VIP' | 'segment:NEW';
  data?: Record<string, any>;
}

export default function PushCampaignManager() {
  const [form, setForm] = useState<PushCampaignForm>({
    title: '',
    body: '',
    target: 'all',
    data: {},
  });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const getToken = () => {
    const s = JSON.parse(localStorage.getItem('kemtchop_session') || '{}');
    return s.access_token || s.token || '';
  };

  const sendCampaign = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      return alert('⚠️ Titre et message requis');
    }
    
    setSending(true);
    const token = getToken();
    
    try {
      const response = await fetch(`${API_BASE}/admin/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      
      const data = await response.json();
      setResult(data);
      
      if (data.status === 'success') {
        alert(`✅ Campagne envoyée !\n📤 ${data.sent} notifications\n❌ ${data.failed} échecs`);
      }
    } catch (e) {
      console.error('❌ Erreur envoi campagne:', e);
      alert('Erreur de connexion au serveur');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border p-6 shadow-sm">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Bell className="text-red-600" size={20} />
          Nouvelle Campagne Push
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: 🎉 Nouvelle offre spéciale !"
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-red-100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Ex: -20% sur tous les plats ce weekend..."
              rows={4}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-red-100 resize-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cible</label>
            <select
              value={form.target}
              onChange={(e) => setForm({ ...form, target: e.target.value as any })}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-red-100"
            >
              <option value="all">👥 Tous les utilisateurs</option>
              <option value="affiliates">🤝 Uniquement les affiliés</option>
              <option value="segment:VIP">⭐ Clients VIP (>50 000F)</option>
              <option value="segment:NEW">🆕 Nouveaux clients</option>
            </select>
          </div>
          
          <button
            onClick={sendCampaign}
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 transition"
          >
            <Send size={18} />
            {sending ? 'Envoi en cours...' : 'Envoyer la campagne'}
          </button>
        </div>
      </div>
      
      {result && (
        <div className={`p-4 rounded-xl ${result.status === 'success' ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5" />
            <div>
              <p className="font-bold">Résultat :</p>
              <p>📤 Envoyés : {result.sent}</p>
              <p>❌ Échecs : {result.failed}</p>
              {result.errors?.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm">Voir les erreurs</summary>
                  <pre className="text-xs mt-1 bg-white p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(result.errors, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}