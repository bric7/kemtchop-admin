import React, { useEffect, useState } from 'react';

const FinanceManager = () => {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ SOLUTION : Utiliser l'URL de l'API via variable d'environnement Vite
  const getApiBase = (): string => {
    try {
      // @ts-ignore - Vite injecte import.meta.env au runtime
      const viteUrl = ((import.meta as any).env?.VITE_API_URL);
      if (viteUrl) return viteUrl.replace(/\/$/, '');
    } catch (e) {
      // Ignore si import.meta.env n'est pas disponible au build
    }
    return 'http://localhost:8000';
  };

  // ✅ Helper pour récupérer le token admin (même clé que Login.tsx)
  const getAdminToken = (): string | null => {
    try {
      return localStorage.getItem('token');
    } catch (e) {
      console.error('❌ Erreur parse token:', e);
      return null;
    }
  };

  const fetchPayouts = async () => {
    setLoading(true);
    
    const token = getAdminToken();
    if (!token) {
      console.error('❌ Token admin manquant → redirection vers login');
      setLoading(false);
      return;
    }
    
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/admin/payouts/pending`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.status === 401) {
        console.error('❌ Token invalide ou expiré');
        localStorage.removeItem('token');
        return;
      }
      
      if (!res.ok) {
        throw new Error(`Erreur HTTP: ${res.status}`);
      }
      
      const data = await res.json();
      setPayouts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur fetch payouts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchPayouts(); 
  }, []);

  const confirmPayment = async (orderId: number) => {
    const token = getAdminToken();
    if (!token) {
      alert('⚠️ Session expirée. Reconnecte-toi.');
      return;
    }
    
    try {
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/admin/orders/${orderId}/pay-commission`, { 
        method: "PATCH",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        alert('⚠️ Session expirée. Reconnecte-toi.');
        localStorage.removeItem('token');
        return;
      }

      if (response.ok) {
        console.log(`✅ Paiement validé pour la commande #${orderId}`);
        fetchPayouts();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert("Erreur: " + (errorData.detail || response.status));
      }
    } catch (error) {
      console.error("❌ Erreur réseau:", error);
      alert("Impossible de joindre le serveur. Vérifie ta connexion.");
    }
  };

  return (
    <div className="p-6 bg-white rounded-[2.5rem] shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-8 px-2">
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-gray-900">
            Paiements en attente
          </h2>
          <p className="text-gray-400 text-xs font-bold uppercase">Gestion des commissions ambassadeurs</p>
        </div>
        <button 
          onClick={fetchPayouts}
          disabled={loading}
          className={`p-3 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors ${loading ? 'opacity-50' : ''}`}
        >
          🔄
        </button>
      </div>
      
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-gray-400 font-black uppercase text-xs tracking-widest">
              Chargement des commissions...
            </p>
          </div>
        ) : payouts.length > 0 ? (
          payouts.map((p: any) => (
            <div key={p.order_id} className="bg-white border-2 border-gray-50 p-6 rounded-[2rem] flex flex-wrap justify-between items-center hover:border-green-100 transition-all shadow-sm">
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-black text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase">
                    {p.affiliate_code}
                  </span>
                  <span className="text-[10px] font-mono text-gray-300">#ORD-{p.order_id}</span>
                </div>
                <p className="text-sm font-black text-gray-900 mb-1">
                  Verser sur : <span className="text-blue-600">{p.payout_phone || "Non défini"}</span>
                </p>
                <p className="text-[11px] text-gray-400 font-bold uppercase">
                  Client : {p.customer || "Anonyme"}
                </p>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-2xl font-black text-gray-900">
                    {p.amount ? p.amount.toLocaleString() : 0} F
                  </p>
                  <p className="text-[9px] font-black text-green-500 bg-green-50 px-2 py-0.5 rounded-md uppercase inline-block">
                    Commission 15%
                  </p>
                </div>
                
                <button 
                  onClick={() => confirmPayment(p.order_id)}
                  className="bg-black text-white px-8 py-4 rounded-2xl text-[10px] font-black hover:bg-green-600 active:scale-95 transition-all shadow-lg shadow-gray-200 uppercase tracking-widest"
                >
                  Valider Paiement ✅
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
            <div className="text-4xl mb-4">🎉</div>
            <p className="text-gray-400 font-black uppercase text-xs tracking-widest">
              Toutes les commissions sont payées !
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceManager;