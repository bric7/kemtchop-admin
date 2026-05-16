import React, { useEffect, useState } from 'react';

const FinanceManager = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const SERVER_IP = "127.0.0.1"; 

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      // On utilise ta route de commissions en attente
      const res = await fetch(`http://${SERVER_IP}:8000/admin/payouts/pending`);
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

  const confirmPayment = async (orderId) => {
    try {
      const response = await fetch(`http://${SERVER_IP}:8000/admin/orders/${orderId}/pay-commission`, { 
        method: "PATCH" 
      });

      if (response.ok) {
        // Notification plus propre qu'un simple alert
        console.log(`Paiement validé pour la commande #${orderId}`);
        fetchPayouts(); // Rafraîchir la liste
      } else {
        const errorData = await response.json();
        alert("Erreur: " + errorData.detail);
      }
    } catch (error) {
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
          className="p-3 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"
        >
          🔄
        </button>
      </div>
      
      <div className="grid gap-4">
        {payouts.map((p) => (
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
        ))}

        {!loading && payouts.length === 0 && (
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