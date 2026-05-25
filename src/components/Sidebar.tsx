// src/components/Sidebar.tsx
import React, { useState } from "react";
import { 
  LayoutDashboard, PlusCircle, ShoppingBag, Settings, Truck,
  UtensilsCrossed, LogOut, UserCheck, Users, Wallet, ShieldAlert, Bug
} from "lucide-react";

// ✅ Interface pour la session utilisateur
interface UserSession {
  role: string;
  permissions: string[];
  username: string;
  raw: string | null;
  error?: string;
}

// ✅ Helper pour lire les permissions FRAÎCHES
const getCurrentSession = (): UserSession => {
  try {
    const raw = localStorage.getItem('kemtchop_session');
    if (!raw) return { role: 'guest', permissions: [], username: '', raw: null };
    
    const session = JSON.parse(raw);
    let perms = session.permissions || [];
    if (typeof perms === 'string') {
      perms = perms.split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 0);
    }
    
    return {
      role: session.role || 'guest',
      permissions: Array.isArray(perms) ? perms : [],
      username: session.username || '',
      raw: raw
    };
  } catch (e: any) {
    return { role: 'guest', permissions: [], username: '', raw: null, error: String(e) };
  }
};

// ✅ Interface pour les éléments du menu
interface MenuItem {
  id: string;
  name: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const [showDebug, setShowDebug] = useState(false);
  
  // Lire les permissions à chaque rendu
  const session = getCurrentSession();
  const { role: userRole, permissions: userPermissions, username, raw, error } = session;

  // Liste complète des menus
  const allMenuItems: MenuItem[] = [
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

  // Filtrage avec re-lecture pour fraîcheur garantie
  const menuItems = allMenuItems.filter(item => {
    const { role, permissions } = getCurrentSession();
    if (role === 'admin') return true;
    return permissions.includes(item.id);
  });

  const handleLogout = () => {
    localStorage.removeItem('kemtchop_session');
    localStorage.removeItem('user_permissions');
    localStorage.removeItem('token');
    window.location.href = "/login";
  };

  return (
    <div className="w-72 h-screen bg-white border-r border-gray-100 flex flex-col sticky top-0 shadow-sm">
      
      {/* 🔧 BOUTON DEBUG */}
      <button 
        onClick={() => setShowDebug(!showDebug)}
        className="absolute top-2 right-2 p-2 bg-yellow-400 rounded-full hover:bg-yellow-500 z-50"
        title="Toggle Debug Panel"
      >
        <Bug size={16} className="text-black" />
      </button>

      {/* 🔧 PANNEAU DEBUG VISIBLE */}
      {showDebug && (
        <div className="absolute top-12 right-2 w-64 bg-black text-green-400 text-[10px] font-mono p-3 rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto">
          <p className="font-bold mb-2">🔍 DEBUG SIDEBAR</p>
          
          <p className="mb-1">👤 Role: <span className="text-white">{userRole}</span></p>
          <p className="mb-1">🔑 Permissions: <span className="text-white">{userPermissions.join(', ') || '⚠️ VIDE'}</span></p>
          <p className="mb-1">👤 Username: <span className="text-white">{username || '⚠️ VIDE'}</span></p>
          
          <p className="mt-2 font-bold">✅ Menus qui DEVRAIENT s'afficher :</p>
          {allMenuItems.filter(item => {
            if (userRole === 'admin') return true;
            return userPermissions.includes(item.id);
          }).map(m => (
            <p key={m.id} className="text-green-300">  • {m.id}</p>
          ))}
          
          <p className="mt-2 font-bold">📦 Menus qui S'AFFICHENT :</p>
          {menuItems.map(m => (
            <p key={m.id} className="text-blue-300">  • {m.id}</p>
          ))}
          
          {error && <p className="mt-2 text-red-400">❌ Erreur: {error}</p>}
          
          <button 
            onClick={() => { 
              if (raw) {
                navigator.clipboard.writeText(raw); 
                alert('Copié!'); 
              }
            }}
            className="mt-3 w-full py-1 bg-gray-800 rounded hover:bg-gray-700"
          >
            📋 Copier session JSON
          </button>
        </div>
      )}

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

      {/* NAVIGATION */}
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
          <p className="px-4 text-xs text-gray-400 italic">⚠️ Aucun accès configuré.</p>
        )}
      </nav>

      {/* FOOTER */}
      <div className="p-6 border-t border-gray-50">
        <div className="bg-gray-900 rounded-[2rem] p-5 text-white shadow-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center font-black text-sm uppercase">
              {username?.substring(0, 2) || 'KU'}
            </div>
            <div className="overflow-hidden">
              <p className="opacity-50 text-[8px] uppercase font-black tracking-widest">{userRole}</p>
              <p className="text-xs font-black truncate uppercase italic">{username || 'Utilisateur'}</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
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