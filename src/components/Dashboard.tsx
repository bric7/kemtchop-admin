import React, { useEffect, useState } from 'react';
import { DollarSign, ShoppingBag, Utensils, TrendingUp, Users } from 'lucide-react';

const Dashboard = () => {
  const [data, setData] = useState({ 
    revenue: 0, 
    orders: 0, 
    products: 0, 
    top_product: "Chargement...",
    commissions: 0 
  });
  
  const SERVER_IP = "127.0.0.1";

  useEffect(() => {
    // 1. On récupère le token depuis le localStorage
    const session = localStorage.getItem('kemtchop_session');
    if (!session) return;

    const { access_token } = JSON.parse(session);

    // 2. Requête Fetch avec la bonne structure
    fetch(`http://${SERVER_IP}:8000/admin/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${access_token}`, // Le fameux JWT
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("Session expirée ou non autorisée");
        return res.json();
      })
      .then(json => setData(json))
      .catch(err => console.error("Erreur stats:", err));
  }, []);

  const cards = [
    { 
      title: "Chiffre d'Affaires", 
      value: `${data.revenue?.toLocaleString()} F`, 
      icon: <DollarSign />, 
      color: "bg-green-500", 
      shadow: "shadow-green-100" 
    },
    { 
      title: "Commissions à Payer", 
      value: `${data.commissions?.toLocaleString()} F`, 
      icon: <Users />, 
      color: "bg-blue-600", 
      shadow: "shadow-blue-100" 
    },
    { 
      title: "Commandes Totales", 
      value: data.orders, 
      icon: <ShoppingBag />, 
      color: "bg-red-500", 
      shadow: "shadow-red-100" 
    },
    { 
      title: "Meilleure Vente", 
      value: data.top_product, 
      icon: <TrendingUp />, 
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