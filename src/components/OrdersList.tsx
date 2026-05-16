import React, { useEffect, useState } from "react";

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const SERVER_IP = "127.0.0.1"; 

  // --- FONCTION POUR RÉCUPÉRER LE TOKEN ---
  const getAuthToken = () => {
    const session = localStorage.getItem('kemtchop_session');
    if (!session) return null;
    return JSON.parse(session).access_token;
  };

  const fetchOrders = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`http://${SERVER_IP}:8000/admin/orders`, {
        headers: {
          'Authorization': `Bearer ${token}` // On envoie le badge
        }
      });
      
      if (!response.ok) throw new Error("Accès refusé");
      
      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur fetch orders:", err);
    }
  };

  const handleNextStatus = async (orderId, currentStatus) => {
    const token = getAuthToken();
    if (!token) return;

    const statusFlow = {
      "en_attente": "cuisine",
      "cuisine": "livraison",
      "en_cuisine": "livraison",
      "livraison": "termine",
      "en_livraison": "termine"
    };

    const nextStatus = statusFlow[currentStatus] || "termine";

    try {
      const response = await fetch(
        `http://${SERVER_IP}:8000/admin/orders/${orderId}/status?new_status=${nextStatus}`,
        { 
          method: "PATCH",
          headers: {
            'Authorization': `Bearer ${token}` // On envoie aussi le badge ici
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
      // On ne rafraîchit que si on a un token (évite les 401 en boucle si déconnecté)
      if (getAuthToken()) fetchOrders();
    }, 5000); 
    return () => clearInterval(interval);
  }, []);

  const renderColumn = (title, statusList, bgColor) => {
    const filteredOrders = orders.filter((order) => 
        statusList.includes(order.status)
    );

    const sortedOrders = [...filteredOrders].sort((a, b) => Number(b.id) - Number(a.id));

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
          {sortedOrders.map((order) => (
            <div key={order.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
              
              <div className="flex justify-between items-start mb-3">
                <p className="text-[10px] font-mono text-gray-300">#{order.id}</p>
                <div className="text-right">
                    <span className="text-sm font-black text-gray-900 block">
                        {order.total_amount.toLocaleString()} F
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