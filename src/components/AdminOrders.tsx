import React, { useEffect, useState } from 'react';

// ✅ Interface Order en haut du fichier
interface Order {
  id: string;
  customer_name: string;
  status: string;
  product_name: string;
  zone: string;
  complement?: string;
  total_price: number;
  deposit_amount: number;
  phone: string;
  [key: string]: any;
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  
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

  // ✅ Helper pour extraire le token JWT
  const getAuthToken = (): string | null => {
    try {
      const sessionRaw = localStorage.getItem('kemtchop_session');
      if (!sessionRaw) return null;
      const session = JSON.parse(sessionRaw);
      return session.access_token || session.token || null;
    } catch (e) {
      console.error('❌ Erreur parse session:', e);
      return null;
    }
  };

  const fetchOrders = async () => {
    try {
      const apiBase = getApiBase();
      const token = getAuthToken();
      
      const response = await fetch(`${apiBase}/admin/orders`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data: Order[] = await response.json();
      setOrders(data);
    } catch (err) {
      console.log("Erreur de récupération des commandes Kemtchop:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 20000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Paramètre typé
  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  // ✅ Paramètre typé + token + apiBase
  const handleMarkDelivered = async (orderId: string) => {
    if (window.confirm("Marquer cette commande comme livrée ?")) {
      try {
        const apiBase = getApiBase();
        const token = getAuthToken();
        
        const response = await fetch(`${apiBase}/admin/orders/${orderId}/deliver`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });
        
        if (response.ok) {
          alert("✅ Commande marquée comme livrée");
          fetchOrders();
        } else {
          alert("Erreur lors de la mise à jour");
        }
      } catch (err) {
        console.error("Erreur mark delivered:", err);
        alert("Erreur lors de la mise à jour");
      }
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-black text-center text-gray-800 mb-6">
        Gestion des Commandes
      </h1>
      
      <div className="space-y-4">
        {orders.map((order, index) => (
          <div 
            key={order.id || `order-${index}`} 
            className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-lg font-bold text-red-600">{order.customer_name}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                order.status === 'livré' ? 'bg-green-100 text-green-700' :
                order.status === 'en cours' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {order.status}
              </span>
            </div>

            <hr className="border-gray-200 my-3" />

            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="font-bold">Plat:</span> {order.product_name}</p>
              <p><span className="font-bold">Quartier:</span> {order.zone}</p>
              <p><span className="font-bold">Accompagnement:</span> {order.complement || 'Aucun'}</p>
            </div>

            <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
              <div>
                <p className="font-bold text-gray-800">Total: {order.total_price} FCFA</p>
                <p className="text-sm text-green-600 font-bold">Acompte: {order.deposit_amount} FCFA</p>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button 
                onClick={() => handleCall(order.phone)}
                className="flex-1 py-3 px-4 border-2 border-gray-700 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
              >
                📞 Appeler
              </button>
              
              <button 
                onClick={() => handleMarkDelivered(order.id)}
                className="flex-1 py-3 px-4 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-900 transition-colors"
              >
                ✅ Livré
              </button>
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">Aucune commande en attente 🎉</p>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;