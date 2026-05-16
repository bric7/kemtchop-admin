import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  CreditCard, 
  LogOut, 
  User as UserIcon,
  Menu,
  X,
  PlusCircle,
  BookOpen,
  Truck,
  Users,
  ShieldCheck
} from 'lucide-react';

// Importation de tous tes composants
import Login from './Login'; 
import Dashboard from '../components/Dashboard'; 
import AddProduct from "../components/AddProduct";
import ProductManager from "../components/ProductManager";
import OrdersList from '../components/OrdersList';
import DeliveryManager from "../components/DeliveryManager";
import AffiliatesManager from "../components/AffiliatesManager";
import FinanceManager from '../components/FinanceManager';
import UsersManager from "../components/UsersManager";
import TeamManager from "../components/TeamManager";

const AdminPanel = () => {
  // 1. GESTION DE LA SESSION
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('kemtchop_session');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 2. CONFIGURATION DE TOUS LES MENUS (Avec Rôles)
  const menuItems = [
    { id: 'dashboard', label: 'Stats', icon: <LayoutDashboard size={20} />, roles: ['admin'] },
    { id: 'products', label: 'Nouveau Plat', icon: <PlusCircle size={20} />, roles: ['admin'] },
    { id: 'manage_menu', label: 'Menu', icon: <BookOpen size={20} />, roles: ['admin'] },
    { id: 'orders', label: 'Commandes', icon: <ShoppingCart size={20} />, roles: ['admin', 'manager', 'livreur'] },
    { id: 'delivery', label: 'Zones Livr.', icon: <Truck size={20} />, roles: ['admin'] },
    { id: 'affiliates', label: 'Affiliés', icon: <Users size={20} />, roles: ['admin'] },
    { id: 'finance', label: 'Commissions', icon: <CreditCard size={20} />, roles: ['admin'] },
    { id: 'users', label: 'Comptes', icon: <ShieldCheck size={20} />, roles: ['admin'] },
    { id: 'team', label: 'Gestion Équipe', icon: <UserIcon size={20} />, roles: ['admin'] },
  ];

  // 3. LOGIQUE DE REDIRECTION AUTOMATIQUE
  useEffect(() => {
    if (user) {
      const currentItem = menuItems.find(item => item.id === activeTab);
      // Si l'onglet actuel n'est pas permis pour ce rôle, on redirige
      if (!currentItem || !currentItem.roles.includes(user.role)) {
        const firstAllowed = menuItems.find(item => item.roles.includes(user.role));
        if (firstAllowed) setActiveTab(firstAllowed.id);
      }
    }
  }, [user, activeTab]);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('kemtchop_session', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('kemtchop_session');
    setActiveTab('dashboard');
  };

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      
      {/* --- SIDEBAR --- */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-black transition-all duration-300 flex flex-col shadow-2xl z-20`}>
        <div className="p-6 flex items-center justify-between text-white">
          {isSidebarOpen && (
            <h1 className="font-black text-xl italic tracking-tighter">KEMTCHOP<span className="text-red-600">.</span></h1>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-400 hover:text-white">
            {isSidebarOpen ? <X size={20} /> : <Menu size={24} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {menuItems
            .filter(item => item.roles.includes(user.role))
            .map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                  activeTab === item.id 
                  ? 'bg-red-600 text-white shadow-lg' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.icon}
                {isSidebarOpen && <span className="font-bold text-sm">{item.label}</span>}
              </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-3 bg-white/5 rounded-xl mb-2 text-white">
            <UserIcon size={16} className="text-red-600" />
            {isSidebarOpen && (
              <div className="truncate">
                <p className="text-[10px] font-black uppercase tracking-widest">{user.username}</p>
                <p className="text-[9px] text-gray-500 font-bold uppercase">{user.role}</p>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-3 py-3 text-gray-400 hover:text-red-500 font-bold text-sm transition-colors">
            <LogOut size={20} />
            {isSidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* --- CONTENU --- */}
      <main className="flex-1 h-screen overflow-y-auto">
        <header className="bg-white border-b border-gray-100 p-8 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">
              {menuItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-green-500 bg-green-50 px-3 py-1 rounded-full">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
             LIVE
          </div>
        </header>

        <div className="p-8">
          {/* AFFICHAGE CONDITIONNEL COMPLET */}
          {activeTab === 'dashboard' && user.role === 'admin' && <Dashboard />}
          {activeTab === 'products' && user.role === 'admin' && <AddProduct />}
          {activeTab === 'manage_menu' && user.role === 'admin' && <ProductManager />}
          {activeTab === 'orders' && <OrdersList />}
          {activeTab === 'delivery' && user.role === 'admin' && <DeliveryManager />}
          {activeTab === 'affiliates' && user.role === 'admin' && <AffiliatesManager />}
          {activeTab === 'finance' && user.role === 'admin' && <FinanceManager />}
          {activeTab === 'users' && user.role === 'admin' && <UsersManager />}
          {activeTab === 'team' && <TeamManager />}

          {/* SÉCURITÉ : Message si un non-admin essaie de forcer un onglet */}
          {(!['admin'].includes(user.role) && !['orders'].includes(activeTab)) && (
  <div className="h-64 flex flex-col items-center justify-center bg-white rounded-[2rem] border border-gray-100 shadow-sm">
     <ShieldCheck className="text-gray-200 mb-4" size={48} />
     <p className="text-gray-400 font-black uppercase text-sm">Accès Réservé à Brice</p>
  </div>
)}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;