import React, { useEffect, useState } from "react";

const OrdersList = () => {
  const [orders, setOrders] = useState<any[]>([]);

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

  // ✅ Helper inline pour vérifier les permissions
  const hasPermission = (required: string): boolean => {
    // 1. Essayer user_permissions (format tableau JSON)
    const userPermsRaw = localStorage.getItem('user_permissions');
    if (userPermsRaw) {
      try {
        const perms = JSON.parse(userPermsRaw);
        if (Array.isArray(perms) && perms.includes(required)) return true;
      } catch (e) {
        console.error('❌ Erreur parse user_permissions:', e);
      }
    }
    
    // 2. Fallback : lire depuis kemtchop_session
    const sessionRaw = localStorage.getItem('kemtchop_session');
    if (sessionRaw) {
      try {
        const session = JSON.parse(sessionRaw);
        let perms = session.permissions;
        
        if (typeof perms === 'string') {
          return perms.split(',').map((p: string) => p.trim()).includes(required);
        }
        if (Array.isArray(perms)) {
          return perms.includes(required);
        }
      } catch (e) {
        console.error('❌ Erreur parse kemtchop_session:', e);
      }
    }
    
    return false;
  };

  // ✅ Vérification des permissions AU DÉBUT du composant
  if (!hasPermission('orders')) {
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

  // --- FONCTION POUR RÉCUPÉRER LE TOKEN ---
  const getAuthToken = (): string | null => {
    try {
      const session = localStorage.getItem('kemtchop_session');
      if (!session) return null;
      const parsed = JSON.parse(session);
      return parsed.access_token || parsed.token || null;
    } catch (e) {
      console.error('❌ Erreur parse session:', e);
      return null;
    }
  };

  const fetchOrders = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/admin/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error("Accès refusé");
      
      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur fetch orders:", err);
    }
  };

  const handleNextStatus = async (orderId: number, currentStatus: string) => {
    const token = getAuthToken();
    if (!token) return;

    const statusFlow: Record<string, string> = {
      "en_attente": "cuisine",
      "cuisine": "livraison",
      "en_cuisine": "livraison",
      "livraison": "termine",
      "en_livraison": "termine"
    };

    const nextStatus = statusFlow[currentStatus] || "termine";

    try {
      const apiBase = getApiBase();
      const response = await fetch(
        `${apiBase}/admin/orders/${orderId}/status?new_status=${nextStatus}`,
        { 
          method: "PATCH",
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        fetchOrders(); 
      } else {
        alert("Erreur: Vous n'avez pas les droits pour modifier cette commande.");
      }
    } catch (err) {
      console.error("Erreur mise à jour:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      if (getAuthToken()) fetchOrders();
    }, 5000); 
    return () => clearInterval(interval);
  }, []);

  const renderColumn = (title: string, statusList: string[], bgColor: string) => {
    const filteredOrders = orders.filter((order: any) => 
        statusList.includes(order.status)
    );

    const sortedOrders = [...filteredOrders].sort((a: any, b: any) => Number(b.id) - Number(a.id));

    return (
      <div className="flex-1 min-w-[320px] bg-gray-50 rounded-[2.5rem] p-6 shadow-inner border border-gray-100">
        <div className="flex justify-between items-center mb-6 px-2">
          <h3 className="font-black text-gray-400 text-[10px] tracking-widest uppercase">
            {title}
          </h3>
          <span className={`px-3 py-1 rounded-full text-[10px] font-black ${bgColor} text-white`}>
            {sortedOrders.length}
          </span>
        </div>

        <div className="space-y-4">
          {sortedOrders.map((order: any) => (
            <div key={order.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
              
              <div className="flex justify-between items-start mb-3">
                <p className="text-[10px] font-mono text-gray-300">#{order.id}</p>
                <div className="text-right">
                    <span className="text-sm font-black text-gray-900 block">
                        {order.total_amount?.toLocaleString() || 0} F
                    </span>
                    {order.affiliate_code && (
                        <div className="mt-1 flex flex-col items-end">
                            <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-lg uppercase">
                                + {(order.total_amount * 0.15).toLocaleString()} F
                            </span>
                        </div>
                    )}
                </div>
              </div>

              <h4 className="font-black text-gray-900 leading-tight uppercase text-sm italic">
                {order.customer_name}
              </h4>
              <p className="text-xs font-bold text-gray-500 mb-2 mt-1">🍗 {order.product_name}</p>
              
              <div className="space-y-1 mb-4">
                <p className="text-[10px] text-gray-400 flex items-center font-bold uppercase">
                  <span className="mr-2">📍 {order.zone}</span>
                </p>
                <p className="text-[10px] text-red-500 flex items-center font-black uppercase">
                  <span>🕒 {order.delivery_time}</span>
                </p>
              </div>

              <div className="flex gap-2">
                {order.status !== "termine" && (
                  <button
                    onClick={() => handleNextStatus(order.id, order.status)}
                    className="flex-1 py-4 bg-black text-white rounded-2xl text-[10px] font-black hover:bg-red-600 active:scale-95 transition-all uppercase tracking-widest"
                  >
                    {order.status === "en_attente" 
                      ? "👨‍🍳 Envoyer Cuisine" 
                      : (order.status === "cuisine" || order.status === "en_cuisine")
                      ? "🛵 Lancer Livraison" 
                      : "💰 Terminer"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

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