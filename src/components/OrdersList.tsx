// OrdersList.tsx - Version finale optimisée
import React, { useEffect, useState, useCallback } from "react";
// ✅ Import unique du client API centralisé
import { api, hasPermission as checkPermission, isAuthenticated } from "@/services/api";

const OrdersList = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false); // ✅ Pour éviter le clignotement

  // ✅ FONCTION pour récupérer les commandes (utilisée partout)
  const fetchOrders = useCallback(async (isInitialLoad: boolean = false) => {
    // ✅ Ne montre le loader QUE lors du premier chargement
    if (isInitialLoad || orders.length === 0) {
      setLoading(true);
    }
    setError(null);
    
    try {
      // ✅ Utilise le client API centralisé (gère token + URL automatiquement)
      const data = await api.get('/admin/orders', true); // true = requireAuth
      
      // ✅ Filtrage FLEXIBLE avec fallback et logs de debug
      const filteredOrders = Array.isArray(data) 
        ? data.filter((o: any) => {
            // Debug : log si le champ role est manquant (pour diagnostic)
          
            
            // Filtre : soit pas de username (commande client), soit rôle interne valide
            const isInternalTeam = o.username && ['admin', 'manager', 'cuisine', 'livreur'].includes(o.role);
            const isClientOrder = !o.username; // Commande passée par un client normal
            
            // ✅ Inclure les deux types (ajuste selon ton besoin métier)
            return isInternalTeam || isClientOrder;
          })
        : [];
      
      // Trier par ID décroissant (plus récent en premier)
      const sortedOrders = [...filteredOrders].sort((a: any, b: any) => 
        Number(b.id) - Number(a.id)
      );
      
      setOrders(sortedOrders);
      setHasLoadedOnce(true); // ✅ Marque que le premier chargement est fait
      
    } catch (err: any) {
      console.error("❌ Erreur fetch orders:", err.message);
      
      // Gestion des erreurs d'authentification
      if (err.message?.includes('Authentification requise') || err.message?.includes('401')) {
        setError('Session expirée. Veuillez vous reconnecter.');
        // Optionnel : logout automatique
        // api.logout();
        // window.location.href = '/admin/login';
      } else {
        setError(err.message || 'Impossible de charger les commandes.');
      }
    } finally {
      // ✅ Ne cache le loader QUE si c'était le premier chargement
      if (isInitialLoad || orders.length === 0) {
        setLoading(false);
      }
    }
  }, [orders.length]); // ✅ Dépendance minimale

  // ✅ useEffect principal : Chargement initial + Polling
  useEffect(() => {
    // Chargement initial
    fetchOrders(true); // true = isInitialLoad
    
    // Polling toutes les 5 secondes si authentifié
    // ⚠️ Désactive avec POLLING_ENABLED = false si besoin
    const POLLING_ENABLED = true;
    if (POLLING_ENABLED) {
      const interval = setInterval(() => {
        if (isAuthenticated()) {  // ✅ Appel direct, pas api.isAuthenticated()
          fetchOrders(false); // false = pas de loader
        }
      }, 5000);
      
      // Cleanup au démontage
      return () => clearInterval(interval);
    }
  }, [fetchOrders]);

  // ✅ Handler pour changer le statut d'une commande (utilise api.patch)
  const handleNextStatus = async (orderId: number, currentStatus: string) => {
    const statusFlow: Record<string, string> = {
      "en_attente": "cuisine",
      "cuisine": "livraison",
      "en_cuisine": "livraison",
      "livraison": "termine",
      "en_livraison": "termine"
    };

    const nextStatus = statusFlow[currentStatus];
    if (!nextStatus) return;

    try {
      // ✅ Utilise le client API centralisé pour PATCH
      await api.patch(
        `/admin/orders/${orderId}/status?new_status=${nextStatus}`,
        {}, // Corps vide pour PATCH
        true // requireAuth
      );
      
      // Refresh immédiat après mise à jour réussie (sans loader)
      fetchOrders(false);
      
    } catch (err: any) {
      console.error("❌ Erreur mise à jour statut:", err.message);
      alert("Erreur: " + (err.message || "Impossible de modifier cette commande"));
    }
  };

  // ✅ Vérification de permission (utilise le helper centralisé)
  if (!checkPermission('orders')) {
    return (
      <div className="p-8 text-center animate-in fade-in duration-300">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-xl font-black text-gray-900 uppercase italic mb-2">
          Accès refusé
        </h2>
        <p className="text-gray-500 font-bold">
          Vous n'avez pas la permission <span className="text-red-600">"orders"</span> pour gérer les commandes.
        </p>
        <p className="text-gray-400 text-sm mt-4">
          Contactez l'administrateur pour obtenir cet accès.
        </p>
      </div>
    );
  }

  // ✅ Affichage d'erreur si problème
  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-red-600 font-bold mb-4">{error}</p>
        <button 
          onClick={() => fetchOrders(true)}
          className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  // ✅ Loading state : uniquement au premier chargement
  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // ✅ Composant de colonne réutilisable
  const renderColumn = (title: string, statusList: string[], bgColor: string) => {
    const filteredOrders = orders.filter((order: any) => 
      statusList.includes(order.status)
    );

    return (
      <div className="flex-1 min-w-[320px] bg-gray-50 rounded-[2.5rem] p-6 shadow-inner border border-gray-100">
        <div className="flex justify-between items-center mb-6 px-2">
          <h3 className="font-black text-gray-400 text-[10px] tracking-widest uppercase">
            {title}
          </h3>
          <span className={`px-3 py-1 rounded-full text-[10px] font-black ${bgColor} text-white`}>
            {filteredOrders.length}
          </span>
        </div>

        <div className="space-y-4">
          {filteredOrders.map((order: any) => (
            <div key={order.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
              
              {/* Header commande */}
              <div className="flex justify-between items-start mb-3">
                <p className="text-[10px] font-mono text-gray-300">#{order.id}</p>
                <div className="text-right">
                  <span className="text-sm font-black text-gray-900 block">
                    {order.total_amount?.toLocaleString() || 0} F
                  </span>
                  {order.affiliate_code && (
                    <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-lg uppercase mt-1 inline-block">
                      +{(order.total_amount * 0.15).toLocaleString()} F
                    </span>
                  )}
                </div>
              </div>

              {/* Infos client */}
              <h4 className="font-black text-gray-900 leading-tight uppercase text-sm italic">
                {order.customer_name}
              </h4>
              <p className="text-xs font-bold text-gray-500 mb-2 mt-1">🍗 {order.product_name}</p>
              
              {/* Détails livraison */}
              <div className="space-y-1 mb-4">
                <p className="text-[10px] text-gray-400 flex items-center font-bold uppercase">
                  📍 {order.zone}
                </p>
                <p className="text-[10px] text-red-500 flex items-center font-black uppercase">
                  🕒 {order.delivery_time}
                </p>
              </div>

              {/* Bouton d'action */}
              {order.status !== "termine" && (
                <button
                  onClick={() => handleNextStatus(order.id, order.status)}
                  className="w-full py-4 bg-black text-white rounded-2xl text-[10px] font-black hover:bg-red-600 active:scale-95 transition-all uppercase tracking-widest"
                >
                  {order.status === "en_attente" 
                    ? "👨‍🍳 Envoyer Cuisine" 
                    : (order.status === "cuisine" || order.status === "en_cuisine")
                    ? "🛵 Lancer Livraison" 
                    : "💰 Terminer"}
                </button>
              )}
            </div>
          ))}
          
          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm font-bold">
              Aucune commande
            </div>
          )}
        </div>
      </div>
    );
  };

  // ✅ Rendu principal
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex gap-8 overflow-x-auto pb-10 items-start no-scrollbar">
        {renderColumn("💰 Nouveaux", ["en_attente"], "bg-orange-500")}
        {renderColumn("👨‍🍳 En Cuisine", ["cuisine", "en_cuisine"], "bg-blue-500")}
        {renderColumn("🛵 En Livraison", ["livraison", "en_livraison"], "bg-purple-600")}
        {renderColumn("✅ Terminés", ["termine", "livre"], "bg-green-600")}
      </div>
    </div>
  );
};

export default OrdersList;