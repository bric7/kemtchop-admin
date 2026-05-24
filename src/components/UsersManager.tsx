// src/components/UsersManager.tsx
import React, { useState, useEffect } from "react";
import { Search, ShieldAlert, User, RefreshCw, Trash2, AlertTriangle, Filter } from "lucide-react";

export default function UsersManager() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all"); // ✅ Filtre par rôle
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const SERVER_IP = "127.0.0.1";

  // ✅ Helper pour récupérer la session
  const getSession = () => {
    const raw = localStorage.getItem('kemtchop_session');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  // ✅ Vérifier si l'utilisateur actuel peut supprimer un compte
  const canDeleteUser = (targetUser: any): boolean => {
    const session = getSession();
    if (!session) return false;
    
    const currentUsername = session.username;
    const currentRole = session.role;
    const permissions = session.permissions || [];
    const permsArray = Array.isArray(permissions) 
      ? permissions 
      : (typeof permissions === 'string' ? permissions.split(',').map((p: string) => p.trim()) : []);
    
    // 🔴 RÈGLE 1 : On ne peut JAMAIS supprimer son propre compte
    if (targetUser.username === currentUsername) return false;
    
    // 🔴 RÈGLE 2 : On ne peut PAS supprimer un compte "admin" ou "super_admin" sauf si on est admin
    if (['admin', 'super_admin'].includes(targetUser.role) && !['admin', 'super_admin'].includes(currentRole)) {
      return false;
    }
    
    // ✅ Permission requise : "manage_users" OU "delete_users" OU admin
    const hasPermission = permsArray.includes('manage_users') || permsArray.includes('delete_users');
    if (['admin', 'super_admin'].includes(currentRole)) return true;
    
    return hasPermission;
  };

  // 1. Charger la liste des utilisateurs
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const session = getSession();
    if (!session) {
      console.error('❌ Session manquante');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://${SERVER_IP}:8000/admin/users`, {
        headers: {
          'Authorization': `Bearer ${session.access_token || session.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401 || response.status === 403) {
        console.error('❌ Accès refusé ou token invalide');
        return;
      }

      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erreur chargement utilisateurs:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fonction de suppression protégée
  const handleDelete = async (userId: number, targetUsername: string, targetRole: string) => {
    const session = getSession();
    if (!session) { alert('⚠️ Session expirée. Reconnecte-toi.'); return; }

    if (targetUsername === session.username) { alert("🚫 Tu ne peux pas supprimer ton propre compte !"); return; }
    if (['admin', 'super_admin'].includes(targetRole) && !['admin', 'super_admin'].includes(session.role)) {
      alert("🚫 Tu ne peux pas supprimer un compte administrateur !"); return;
    }

    if (!window.confirm(`⚠️ Es-tu SÛR de vouloir supprimer l'accès de "${targetUsername}" ?\n\nCette action est irréversible.`)) return;

    setDeletingId(userId);
    try {
      const response = await fetch(`http://${SERVER_IP}:8000/admin/users/${userId}`, {
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${session.access_token || session.token}`, 'Content-Type': 'application/json' }
      });

      if (response.status === 401 || response.status === 403) { alert('⚠️ Session expirée ou accès refusé.'); return; }
      const result = await response.json();

      if (response.ok) { alert("✅ Accès révoqué avec succès"); fetchUsers(); }
      else { alert(result.detail || "❌ Erreur lors de la suppression"); }
    } catch (err) {
      console.error("❌ Erreur suppression:", err);
      alert("❌ Erreur de connexion au serveur");
    } finally { setDeletingId(null); }
  };

  // 3. Fonction de réinitialisation de mot de passe
  const handleSendSetupLink = async (phone: string, userName: string) => {
    const session = getSession();
    if (!session) { alert('⚠️ Session expirée. Reconnecte-toi.'); return; }

    try {
      const response = await fetch(`http://${SERVER_IP}:8000/admin/generate-reset-link/${phone}`, {
        method: "POST",
        headers: { 'Authorization': `Bearer ${session.access_token || session.token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();

      if (response.ok) {
        const message = `Bonjour ${userName}, voici votre lien unique pour configurer votre accès sécurisé sur Kemtchop : ${data.link}`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
      } else {
        alert(data.detail || "Erreur lors de la génération du lien");
      }
    } catch (error) {
      console.error("❌ Erreur reset link:", error);
      alert("Erreur lors de la génération du lien");
    }
  };

  // ✅ Filtrage combiné : recherche + rôle
  const filteredUsers = users.filter((u: any) => {
    // Filtre recherche
    const matchesSearch = 
      u.phone?.includes(search) || 
      u.customer_name?.toLowerCase().includes(search.toLowerCase()) || 
      u.username?.toLowerCase().includes(search.toLowerCase());
    
    // Filtre rôle
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // ✅ Badge de rôle avec couleur distinctive
  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: 'bg-red-100 text-red-700 border-red-200',
      super_admin: 'bg-purple-100 text-purple-700 border-purple-200',
      manager: 'bg-blue-100 text-blue-700 border-blue-200',
      cuisine: 'bg-orange-100 text-orange-700 border-orange-200',
      livreur: 'bg-green-100 text-green-700 border-green-200',
      customer: 'bg-gray-100 text-gray-600',
      affiliate: 'bg-pink-100 text-pink-700 border-pink-200',
    };
    return styles[role] || 'bg-gray-100 text-gray-600';
  };

  // ✅ Indicateur visuel : équipe interne vs client vs affilié
  const getUserType = (user: any) => {
    if (user.username && ['admin', 'manager', 'cuisine', 'livreur'].includes(user.role)) {
      return { label: 'Équipe', color: 'text-blue-600', icon: '👥' };
    }
    if (user.is_affiliate) {
      return { label: 'Affilié', color: 'text-pink-600', icon: '🤝' };
    }
    return { label: 'Client', color: 'text-gray-500', icon: '👤' };
  };

  return (
    <div className="space-y-6">
      {/* Barre de recherche + filtre rôle */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="text-gray-400 group-focus-within:text-red-600 transition-colors" size={20} />
          </div>
          <input
            type="text"
            placeholder="Rechercher un utilisateur (Nom, Username ou Numéro)..."
            className="w-full pl-12 pr-4 py-4 bg-white rounded-[2rem] border border-gray-100 shadow-sm outline-none focus:ring-2 focus:ring-red-100 focus:border-red-600 transition-all font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        {/* ✅ Filtre par rôle */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="text-gray-400" size={16} />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="pl-10 pr-8 py-4 bg-white rounded-[2rem] border border-gray-100 shadow-sm outline-none focus:ring-2 focus:ring-red-100 appearance-none cursor-pointer font-medium text-sm"
          >
            <option value="all">👥 Tous les rôles</option>
            <option value="admin">🔴 Admin</option>
            <option value="super_admin">🟣 Super Admin</option>
            <option value="manager">🔵 Manager</option>
            <option value="cuisine">🟠 Cuisine</option>
            <option value="livreur">🟢 Livreur</option>
            <option value="customer">👤 Client</option>
            <option value="affiliate">🤝 Affilié</option>
          </select>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 text-center text-gray-400 font-bold animate-pulse">
            Chargement des comptes...
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Utilisateur</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Type</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Rôle</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Contact</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user: any) => {
                  const canDelete = canDeleteUser(user);
                  const isSelf = user.username === getSession()?.username;
                  const isProtectedRole = ['admin', 'super_admin'].includes(user.role);
                  const userType = getUserType(user);
                  
                  return (
                    <tr key={user.id || user.username} className="hover:bg-red-50/30 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
                            <User size={18} />
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 block">{user.customer_name || "Anonyme"}</span>
                            {user.username && (
                              <span className="text-[10px] text-gray-400 font-mono">@{user.username}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      {/* ✅ Colonne Type : Équipe / Client / Affilié */}
                      <td className="px-8 py-5">
                        <span className={`text-[10px] font-black uppercase flex items-center gap-1 ${userType.color}`}>
                          {userType.icon} {userType.label}
                        </span>
                      </td>
                      
                      <td className="px-8 py-5">
                        <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${getRoleBadge(user.role)}`}>
                          {user.role || 'Membre'}
                        </span>
                      </td>
                      
                      <td className="px-8 py-5">
                        <span className="font-mono text-sm text-gray-500">{user.phone || "N/A"}</span>
                      </td>
                      
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Bouton Reset Password */}
                          <button
                            onClick={() => handleSendSetupLink(user.phone, user.customer_name || user.username || "Client")}
                            className="inline-flex items-center gap-1.5 bg-white border border-gray-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm active:scale-95"
                            title="Envoyer un lien de réinitialisation"
                          >
                            <RefreshCw size={12} />
                            Reset
                          </button>
                          
                          {/* Bouton Supprimer - conditionnel */}
                          {canDelete ? (
                            <button
                              onClick={() => handleDelete(user.id, user.username, user.role)}
                              disabled={deletingId === user.id}
                              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 ${
                                deletingId === user.id
                                  ? 'bg-gray-200 text-gray-400 cursor-wait'
                                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-red-600 hover:text-white hover:border-red-600'
                              }`}
                              title={isSelf ? "Tu ne peux pas supprimer ton propre compte" : "Révoquer l'accès de cet utilisateur"}
                            >
                              <Trash2 size={12} />
                              {deletingId === user.id ? "..." : "Supprimer"}
                            </button>
                          ) : (
                            <span 
                              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                                isSelf 
                                  ? 'bg-gray-100 text-gray-400' 
                                  : isProtectedRole 
                                    ? 'bg-red-50 text-red-400 border border-red-100'
                                    : 'bg-gray-100 text-gray-400'
                              }`}
                              title={isSelf ? "Ton compte" : isProtectedRole ? "Compte administrateur protégé" : "Permission requise : manage_users"}
                            >
                              <ShieldAlert size={12} />
                              {isSelf ? "Toi" : isProtectedRole ? "Protégé" : "—"}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <ShieldAlert className="text-gray-200" size={48} />
                      <p className="text-gray-400 font-bold italic">
                        {search || roleFilter !== 'all' 
                          ? "Aucun utilisateur ne correspond aux filtres" 
                          : "Aucun utilisateur enregistré"}
                      </p>
                      {(search || roleFilter !== 'all') && (
                        <button 
                          onClick={() => { setSearch(""); setRoleFilter("all"); }}
                          className="text-red-600 text-sm font-bold hover:underline mt-2"
                        >
                          Réinitialiser les filtres
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Footer d'info */}
      <div className="flex justify-center items-center gap-2 text-gray-400">
        <div className="h-1 w-1 rounded-full bg-gray-300"></div>
        <p className="text-[10px] font-black uppercase tracking-tighter italic">
          {filteredUsers.length} / {users.length} comptes affichés
        </p>
        <div className="h-1 w-1 rounded-full bg-gray-300"></div>
      </div>
    </div>
  );
}