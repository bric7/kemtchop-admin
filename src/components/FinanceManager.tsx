// FinanceManager.tsx - Version corrigée pour cohérence d'authentification
import React, { useEffect, useState } from 'react';
// ✅ IMPORT CRITIQUE : Utiliser le client API centralisé
import { api, hasPermission, logout } from '@/services/api';

const FinanceManager = () => {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Vérification des permissions AU DÉBUT (avant tout fetch)
  useEffect(() => {
    if (!hasPermission('manage_users')) {
      setError('Vous n\'avez pas la permission pour gérer les paiements.');
      setLoading(false);
      return;
    }
    
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // ✅ Utiliser le client API centralisé (gère token + URL automatiquement)
      const data = await api.get('/admin/payouts/pending', true);
      setPayouts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("❌ Erreur fetch payouts:", err);
      
      // Gestion des erreurs d'authentification
      if (err.message?.includes('Authentification requise') || err.message?.includes('401')) {
        setError('Session expirée. Veuillez vous reconnecter.');
        // Optionnel : logout automatique
        // logout();
        // window.location.href = '/admin/login';
      } else {
        setError(err.message || 'Impossible de charger les paiements.');
      }
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (orderId: number) => {
    try {
      // ✅ Utiliser le client API centralisé pour PATCH
      await api.patch(`/admin/orders/${orderId}/pay-commission`, {}, true);
      
      console.log(`✅ Paiement validé pour la commande #${orderId}`);
      
      // Refresh immédiat de la liste
      fetchPayouts();
      
    } catch (err: any) {
      console.error("❌ Erreur validation paiement:", err);
      
      if (err.message?.includes('Authentification requise') || err.message?.includes('401')) {
        alert('⚠️ Session expirée. Reconnecte-toi.');
        logout();
        // Optionnel : redirection
        // window.location.href = '/admin/login';
      } else {
        const errorMsg = err.message?.includes('Network') || err.message?.includes('Failed to fetch')
          ? 'Impossible de joindre le serveur. Vérifie ta connexion.'
          : err.message || 'Erreur lors de la validation du paiement.';
        alert(errorMsg);
      }
    }
  };

  // ✅ Affichage d'erreur si permission manquante ou autre problème
  if (error) {
    return (
      <div className="p-6 bg-white rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="text-center py-20">
          <div className="text-4xl mb-4">🔒</div>
          <p className="text-red-600 font-black uppercase text-sm mb-2">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-gray-400 hover:text-black text-xs font-bold uppercase"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

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
          className={`p-3 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label="Rafraîchir la liste"
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
                  className="bg-black text-white px-8 py-4 rounded-2xl text-[10px] font-black hover:bg-green-600 active:scale-95 transition-all shadow-lg shadow-gray-200 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
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