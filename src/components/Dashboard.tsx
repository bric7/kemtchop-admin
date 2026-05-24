import React, { useEffect, useState } from 'react';
import { DollarSign, ShoppingBag, Utensils, TrendingUp, Users, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const [data, setData] = useState({ 
    revenue: 0, 
    orders: 0, 
    products: 0, 
    top_product: "Chargement...",
    commissions: 0 
  });
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const SERVER_IP = "127.0.0.1";

  // ✅ Helper robuste pour extraire le token (gère les deux formats)
  const getAuthToken = (): string | null => {
    try {
      const sessionRaw = localStorage.getItem('kemtchop_session');
      if (!sessionRaw) return null;
      
      const session = JSON.parse(sessionRaw);
      // ✅ Essayer access_token d'abord, puis token (fallback)
      return session.access_token || session.token || null;
    } catch (e) {
      console.error('❌ Erreur parse session:', e);
      return null;
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      
      const token = getAuthToken();
      
      if (!token) {
        console.error('❌ Token manquant ou invalide');
        setError("Session invalide. Veuillez vous reconnecter.");
        setLoading(false);
        // Optionnel: rediriger vers login après un délai
        // setTimeout(() => window.location.href = '/login', 2000);
        return;
      }
      
      try {
        const response = await fetch(`http://${SERVER_IP}:8000/admin/stats`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,  // ✅ Token garanti non-undefined
            'Content-Type': 'application/json'
          },
        });

        // ✅ Gestion détaillée des erreurs HTTP
        if (response.status === 401) {
          throw new Error("Token expiré ou invalide");
        }
        if (response.status === 403) {
          throw new Error("Accès refusé : permissions insuffisantes");
        }
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.detail || `Erreur ${response.status}`);
        }

        const json = await response.json();
        setData(json);
        
      } catch (err: any) {
        console.error("❌ Erreur fetch stats:", err.message || err);
        setError(err.message || "Impossible de charger les statistiques");
        
        // ✅ Si 401/403, proposer une reconnexion
        if (err.message?.includes('expiré') || err.message?.includes('refusé')) {
          setError("Session expirée. [Se reconnecter](/login)");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);  // Exécuté une fois au montage

  // ✅ UI d'erreur avec action de reconnexion
  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="text-red-500 mb-4" size={48} />
        <h3 className="text-lg font-bold text-gray-900 mb-2">Erreur de chargement</h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = '/login';
          }}
          className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition"
        >
          Se reconnecter
        </button>
      </div>
    );
  }

  // ✅ UI de chargement
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  const cards = [
    { 
      title: "Chiffre d'Affaires", 
      value: `${data.revenue?.toLocaleString() || 0} F`, 
      icon: <DollarSign size={20} />, 
      color: "bg-green-500", 
      shadow: "shadow-green-100" 
    },
    { 
      title: "Commissions à Payer", 
      value: `${data.commissions?.toLocaleString() || 0} F`, 
      icon: <Users size={20} />, 
      color: "bg-blue-600", 
      shadow: "shadow-blue-100" 
    },
    { 
      title: "Commandes Totales", 
      value: data.orders ?? 0, 
      icon: <ShoppingBag size={20} />, 
      color: "bg-red-500", 
      shadow: "shadow-red-100" 
    },
    { 
      title: "Meilleure Vente", 
      value: data.top_product || "N/A", 
      icon: <TrendingUp size={20} />, 
      color: "bg-black", 
      shadow: "shadow-gray-200" 
    },
  ];

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-700">
      {/* CARTES STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <div key={index} className={`p-8 rounded-[2.5rem] bg-white border border-gray-50 shadow-xl ${card.shadow} relative overflow-hidden group transition-all hover:-translate-y-1`}>
            <div className={`absolute -right-4 -top-4 w-24 h-24 ${card.color} opacity-10 rounded-full group-hover:scale-110 transition-transform`} />
            <div className={`p-3 rounded-2xl ${card.color} text-white w-fit mb-4`}>
              {card.icon}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{card.title}</p>
            <h2 className="text-2xl font-black mt-1 text-gray-900">{card.value}</h2>
          </div>
        ))}
      </div>

      {/* SECTION ACTIVITÉ & OBJECTIFS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ACTIVITÉ RÉCENTE */}
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
          <h3 className="font-black italic text-xl mb-6 uppercase tracking-tighter">Activité Récente</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-red-100 transition-colors">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-xs font-bold text-gray-700">Un utilisateur à <span className="text-black font-black">Bastos</span> vient de cliquer sur <span className="text-red-600 italic">Poulet DG</span></p>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <p className="text-xs font-bold text-gray-700">Nouveau partenaire activé : <span className="text-blue-600 font-black tracking-widest">KEM-0475-XY</span></p>
            </div>
          </div>
        </div>

        {/* OBJECTIF MENSUEL */}
        <div className="bg-black p-8 rounded-[3rem] text-white relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="font-black italic text-xl mb-6 uppercase tracking-tighter">Objectif du mois</h3>
            <div className="flex flex-col items-center justify-center py-6">
              <span className="text-7xl font-black text-red-600 italic">75%</span>
              <p className="text-[10px] font-black text-gray-400 mt-2 uppercase tracking-[0.2em]">Progression vers 500 commandes</p>
              <div className="w-full bg-white/10 h-4 rounded-full mt-8 p-1">
                <div className="bg-red-600 h-full rounded-full transition-all duration-1000" style={{ width: '75%' }} />
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 right-0 opacity-10">
             <ShoppingBag size={150} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;