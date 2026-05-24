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
  ShieldCheck,
  Settings,
  Package
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
import CustomersManager from '../components/CustomersManager';
import CampaignManager from '../components/CampaignManager';
import { MessageCircle } from 'lucide-react'; // Si pas déjà importé

const AdminPanel = () => {
  // 1. GESTION DE LA SESSION
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('kemtchop_session');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 2. CONFIGURATION DE TOUS LES MENUS (IDs uniques)
  const menuItems = [
    { id: 'dashboard', label: 'Stats', icon: <LayoutDashboard size={20} /> },
    { id: 'products', label: 'Nouveau Plat', icon: <PlusCircle size={20} /> },
    { id: 'manage_menu', label: 'Catalogue', icon: <BookOpen size={20} /> },
    { id: 'orders', label: 'Commandes', icon: <ShoppingCart size={20} /> },
    { id: 'delivery', label: 'Zones Livr.', icon: <Truck size={20} /> },
    { id: 'affiliates', label: 'Affiliés', icon: <Users size={20} /> },
    { id: 'finance', label: 'Commissions', icon: <CreditCard size={20} /> },
    { id: 'users', label: 'Comptes', icon: <ShieldCheck size={20} /> },
    { id: 'campaigns', label: 'Campagnes WA', icon: <MessageCircle size={20} /> },
    { id: 'team', label: 'Équipe', icon: <UserIcon size={20} /> },          // 👥 Managers (accès admin)
    { id: 'affiliates_view', label: 'Ambassadeurs', icon: <Users size={20} /> }, // 🤝 Affiliés
    { id: 'customers_view', label: 'Clients', icon: <Users size={20} /> },  // 👤 Clients simples
    { id: 'inventory', label: 'Stocks', icon: <Package size={20} /> },
    { id: 'settings', label: 'Paramètres', icon: <Settings size={20} /> },
    { id: 'wallet', label: 'Portefeuille', icon: <CreditCard size={20} /> },
  ];

  // ✅ MAPPING : Noms des permissions → IDs des menus correspondants
  const PERMISSION_TO_MENU_MAP: Record<string, string[]> = {
    'view_stats': ['dashboard'],
    'edit_orders': ['orders'],
    'users': ['users', 'team', 'customers_view'],  // manage_users donne accès à Équipe + Clients
    'manage_products': ['products', 'manage_menu'],
    'manage_delivery': ['delivery'],
    'manage_affiliates': ['affiliates', 'affiliates_view'],
    'manage_finance': ['finance', 'wallet'],
    'manage_inventory': ['inventory'],
    'manage_settings': ['settings'],
    'manage_users': ['users', 'team', 'customers_view', 'campaigns'],
    // Fallback : permissions avec même nom que menu ID
    'dashboard': ['dashboard'],
    'orders': ['orders'],
    'products': ['products'],
    'team': ['team'],
    'settings': ['settings'],
    'wallet': ['wallet'],
    'inventory': ['inventory'],
    'delivery': ['delivery'],
    'affiliates': ['affiliates'],
    'finance': ['finance'],
    'manage_menu': ['manage_menu'],
    'affiliates_view': ['affiliates_view'],
    'customers_view': ['customers_view'],
  };

  // ✅ Helper pour vérifier si un menu doit être affiché
  const canAccessMenuItem = (itemId: string): boolean => {
    // ✅ L'admin et super_admin voient tout
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    if (isAdmin) return true;
    
    // Pour les autres, vérifier les permissions
    const permissions = user?.permissions || [];
    const permsArray = Array.isArray(permissions) 
      ? permissions 
      : (typeof permissions === 'string' ? permissions.split(',').map((p: string) => p.trim()) : []);
    
    // Check 1: Permission directe (même nom que menu ID)
    if (permsArray.includes(itemId)) return true;
    
    // Check 2: Permission mappée vers ce menu ID
    for (const perm of permsArray) {
      const mappedIds = PERMISSION_TO_MENU_MAP[perm] || [];
      if (mappedIds.includes(itemId)) return true;
    }
    
    return false;
  };

  // 3. LOGIQUE DE REDIRECTION AUTOMATIQUE
  useEffect(() => {
    if (user) {
      if (!canAccessMenuItem(activeTab)) {
        const firstAllowed = menuItems.find(item => canAccessMenuItem(item.id));
        if (firstAllowed) setActiveTab(firstAllowed.id);
      }
    }
  }, [user, activeTab]);

  const handleLogin = (userData: any) => {
    setUser(userData);
    localStorage.setItem('kemtchop_session', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('kemtchop_session');
    localStorage.removeItem('user_permissions');
    localStorage.removeItem('token');
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
            .filter(item => canAccessMenuItem(item.id))
            .map((item) => (
              <button
                key={item.id}  // ✅ IDs uniques garantis
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
          {/* AFFICHAGE CONDITIONNEL PAR PERMISSIONS - SANS DOUBLONS */}
          {activeTab === 'dashboard' && canAccessMenuItem('dashboard') && <Dashboard />}
          {activeTab === 'products' && canAccessMenuItem('products') && <AddProduct />}
          {activeTab === 'manage_menu' && canAccessMenuItem('manage_menu') && <ProductManager />}
          {activeTab === 'orders' && canAccessMenuItem('orders') && <OrdersList />}
          {activeTab === 'delivery' && canAccessMenuItem('delivery') && <DeliveryManager />}
          {activeTab === 'affiliates' && canAccessMenuItem('affiliates') && <AffiliatesManager />}
          {activeTab === 'finance' && canAccessMenuItem('finance') && <FinanceManager />}
          {activeTab === 'users' && canAccessMenuItem('users') && <UsersManager />}
          {activeTab === 'campaigns' && canAccessMenuItem('campaigns') && <CampaignManager />}
          
          {/* ✅ NOUVEAUX ONGLETS - Un seul rendu chacun */}
          {activeTab === 'team' && canAccessMenuItem('team') && <TeamManager />}
          {activeTab === 'affiliates_view' && canAccessMenuItem('affiliates_view') && <AffiliatesManager />}
          {activeTab === 'customers_view' && canAccessMenuItem('customers_view') && <CustomersManager />}
          
          {/* Placeholders pour les onglets en développement */}
          {activeTab === 'inventory' && canAccessMenuItem('inventory') && (
            <div className="text-center py-20">
              <Package className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500 font-bold">Gestion des stocks — En développement</p>
            </div>
          )}
          {activeTab === 'settings' && canAccessMenuItem('settings') && (
            <div className="text-center py-20">
              <Settings className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500 font-bold">Paramètres — En développement</p>
            </div>
          )}
          {activeTab === 'wallet' && canAccessMenuItem('wallet') && (
            <div className="text-center py-20">
              <CreditCard className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500 font-bold">Portefeuille — En développement</p>
            </div>
          )}

          {/* SÉCURITÉ : Message si accès refusé */}
          {!canAccessMenuItem(activeTab) && (
            <div className="h-64 flex flex-col items-center justify-center bg-white rounded-[2rem] border border-gray-100 shadow-sm">
              <ShieldCheck className="text-gray-200 mb-4" size={48} />
              <p className="text-gray-400 font-black uppercase text-sm">Accès refusé : Permission "{activeTab}" requise</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;