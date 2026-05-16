import React from "react";
import { 
  LayoutDashboard, PlusCircle, ShoppingBag, Settings, Truck,
  UtensilsCrossed, LogOut, UserCheck, Users, Wallet, ShieldAlert 
} from "lucide-react";

export default function Sidebar({ activeTab, setActiveTab }: any) {
  
  // 1. Récupération de la session (on utilise les permissions que le backend envoie maintenant)
  const session = JSON.parse(localStorage.getItem('kemtchop_session') || '{}');
  const userRole = session.role || 'guest';
  const userPermissions = session.permissions || []; // C'est une liste : ["dashboard", "orders"]

  // 2. Définition de tous les menus
  // Note : On n'a plus besoin de la liste "roles" ici, car on filtre par ID
  const allMenuItems = [
    { id: 'dashboard', name: 'Tableau de bord', icon: <LayoutDashboard size={20}/> },
    { id: 'orders', name: 'Commandes', icon: <ShoppingBag size={20}/> },
    { id: 'products', name: 'Ajouter un Plat', icon: <PlusCircle size={20}/> },
    { id: 'manage_menu', name: 'Catalogue Plats', icon: <UtensilsCrossed size={20}/> },
    { id: 'delivery', name: 'Livraison', icon: <Truck size={20}/> },
    { id: 'affiliates', name: 'Affiliés / Ambassadeurs', icon: <UserCheck size={20}/> },
    { id: 'users', name: 'Clients & Sécurité', icon: <Users size={20}/> }, 
    { id: 'team', name: 'Équipe & Accès', icon: <ShieldAlert size={20}/> },
    { id: 'finance', name: 'Paiements & Commissions', icon: <Wallet size={20}/> },
    { id: 'settings', name: 'Paramètres', icon: <Settings size={20}/> },
  ];

  // 3. LOGIQUE DE FILTRAGE DYNAMIQUE
  const menuItems = allMenuItems.filter(item => {
    // L'admin voit absolument tout
    if (userRole === 'admin') return true;
    
    // Pour les autres (manager, cuisine, livreur), on vérifie si l'ID du menu est dans leurs permissions
    return userPermissions.includes(item.id);
  });

  return (
    <div className="w-72 h-screen bg-white border-r border-gray-100 flex flex-col sticky top-0 shadow-sm">
      
      {/* HEADER LOGO */}
      <div className="p-8">
        <div className="flex flex-col">
           <h1 className="text-3xl font-black text-red-600 tracking-tighter uppercase italic leading-none">
             KEM<span className="text-black">TCHOP</span>
           </h1>
           <div className="flex items-center gap-2 mt-2">
             <div className="relative flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
             </div>
             <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">
               Console {userRole === 'admin' ? 'Propriétaire' : 'Accès Restreint'}
             </p>
           </div>
        </div>
      </div>

      {/* NAVIGATION DYNAMIQUE */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        <p className="px-4 text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4">
            Navigation
        </p>
        
        {menuItems.length > 0 ? (
          menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-[1.5rem] transition-all duration-300 group ${
                activeTab === item.id 
                  ? 'bg-red-600 text-white font-bold shadow-lg shadow-red-200 translate-x-1' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={`${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>
                {item.icon}
              </span>
              <span className="text-sm font-bold tracking-tight">{item.name}</span>
            </button>
          ))
        ) : (
          <p className="px-4 text-xs text-gray-400 italic">Aucun accès configuré.</p>
        )}
      </nav>

      {/* FOOTER USER */}
      <div className="p-6 border-t border-gray-50">
        <div className="bg-gray-900 rounded-[2rem] p-5 text-white shadow-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center font-black text-sm uppercase">
              {session.username?.substring(0, 2) || 'KU'}
            </div>
            <div className="overflow-hidden">
              <p className="opacity-50 text-[8px] uppercase font-black tracking-widest">{userRole}</p>
              <p className="text-xs font-black truncate uppercase italic">{session.username || 'Utilisateur'}</p>
            </div>
          </div>
          
          <button 
            onClick={() => {
                localStorage.removeItem('kemtchop_session');
                window.location.href = "/login"; // Redirection propre
            }}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            <LogOut size={14} />
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}