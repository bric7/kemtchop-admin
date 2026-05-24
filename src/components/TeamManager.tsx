// src/components/TeamManager.tsx
import React, { useState, useEffect } from "react";
import { Search, ShieldAlert, User, RefreshCw, Trash2, Briefcase, PlusCircle, X } from "lucide-react";

// ============================================================
// ✅ MODAL D'AJOUT/MODIFICATION (défini AVANT le composant principal)
// ============================================================
interface TeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  editingUser?: any | null;
}

// ✅ Remplace TOUT le composant TeamMemberModal par celui-ci :

const TeamMemberModal: React.FC<TeamMemberModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editingUser 
}) => {
  const [formData, setFormData] = useState({
    customer_name: '',
    username: '',
    phone: '',
    password: '',  // ✅ Toujours requis en création si username défini
    role: 'manager',
    permissions: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (editingUser) {
        // Mode édition : pré-remplir (sans mot de passe)
        setFormData({
          customer_name: editingUser.customer_name || '',
          username: editingUser.username || '',
          phone: editingUser.phone || '',
          password: '',  // Jamais pré-remplir
          role: editingUser.role || 'manager',
          permissions: editingUser.permissions 
            ? (typeof editingUser.permissions === 'string' 
                ? editingUser.permissions.split(',').map((p: string) => p.trim()) 
                : editingUser.permissions)
            : [],
        });
      } else {
        // Mode création : formulaire vide
        setFormData({
          customer_name: '',
          username: '',
          phone: '',
          password: '',
          role: 'manager',
          permissions: [],
        });
      }
    }
  }, [isOpen, editingUser]);

  const availablePermissions = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'orders', label: '📦 Commandes' },
    { id: 'products', label: '🍽️ Produits' },
    { id: 'manage_menu', label: '📋 Catalogue' },
    { id: 'delivery', label: '🚚 Livraisons' },
    { id: 'users', label: '👥 Gestion équipe' },
    { id: 'settings', label: '⚙️ Paramètres' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // ✅ Validation frontend
    if (!formData.customer_name.trim()) {
      setError("Nom complet requis");
      return;
    }
    if (!formData.phone.trim()) {
      setError("Téléphone requis");
      return;
    }
    if (!editingUser && formData.username && !formData.password) {
      setError("Mot de passe requis quand un username est défini");
      return;
    }
    
    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      console.error('❌ Erreur soumission:', err);
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSubmitting(false);
    }
  };

  const togglePermission = (permId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter((p: string) => p !== permId)
        : [...prev.permissions, permId]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-black text-lg">
            {editingUser ? '✏️ Modifier' : '➕ Ajouter'} un membre d'équipe
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Message d'erreur */}
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm font-medium">
              ⚠️ {error}
            </div>
          )}
          
          {/* Nom complet */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nom complet *</label>
            <input
              type="text"
              required
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-red-100"
              placeholder="Ex: Jean Dupont"
            />
          </div>
          
          {/* Username */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Username (obligatoire pour l'accès admin panel) *
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-red-100"
              placeholder="Ex: jean_manager"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Ce username servira à se connecter à l'admin panel
            </p>
          </div>
          
          {/* Téléphone */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Téléphone *</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-red-100"
              placeholder="Ex: 690882398"
            />
          </div>
          
          {/* Mot de passe - TOUJOURS visible en création */}
          {!editingUser && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Mot de passe * (min. 6 caractères)
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-red-100"
                placeholder="••••••••"
                minLength={6}
              />
              <p className="text-[10px] text-gray-400 mt-1">
                L'utilisateur utilisera ce mot de passe pour se connecter
              </p>
            </div>
          )}
          
          {/* Rôle */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Rôle *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-red-100"
            >
              <option value="manager">🔵 Manager — Gestion commandes & équipe</option>
              <option value="cuisine">🟠 Cuisine — Voir les commandes en cours</option>
              <option value="livreur">🟢 Livreur — Voir les livraisons assignées</option>
            </select>
          </div>
          
          {/* Permissions */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Permissions *</label>
            <div className="grid grid-cols-2 gap-2">
              {availablePermissions.map((perm) => (
                <label key={perm.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(perm.id)}
                    onChange={() => togglePermission(perm.id)}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span>{perm.label}</span>
                </label>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Coche les accès que ce membre aura dans l'admin panel
            </p>
          </div>
          
          {/* Boutons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50"
              disabled={submitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? 'Enregistrement...' : editingUser ? '💾 Modifier' : '✅ Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// ✅ COMPOSANT PRINCIPAL TeamManager
// ============================================================
export default function TeamManager() {
  // ✅ TOUS LES HOOKS DOIVENT ÊTRE ICI, DANS LE COMPOSANT
  const [team, setTeam] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  // ✅ États pour le modal d'ajout/modification
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  const SERVER_IP = "127.0.0.1";

  const getSession = () => {
    const raw = localStorage.getItem('kemtchop_session');
    return raw ? JSON.parse(raw) : null;
  };

  const getAuthToken = () => {
    const session = getSession();
    return session?.access_token || session?.token || null;
  };

  // ✅ Fonction pour créer/modifier un utilisateur via l'API backend
 const handleSubmitUser = async (data: any) => {
  const session = getSession();
  const token = getAuthToken();
  if (!session || !token) throw new Error('Session invalide');

  const url = editingUser 
    ? `http://${SERVER_IP}:8000/admin/users/${editingUser.id}`
    : `http://${SERVER_IP}:8000/admin/users`;
  
  const method = editingUser ? 'PUT' : 'POST';
  
  console.log(`📡 ${method} ${url}`, data);
  
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();
  console.log(`📥 Réponse ${response.status}:`, result);
  
  if (!response.ok) {
    // ✅ Afficher l'erreur précise du backend
    throw new Error(result.detail || `Erreur ${response.status}: ${response.statusText}`);
  }
  
  alert(`✅ ${editingUser ? 'Modifications' : 'Compte'} enregistré avec succès !`);
  fetchTeam(); // Rafraîchir la liste
};

  // ✅ Charger UNIQUEMENT les membres d'équipe (accès admin panel)
  const fetchTeam = async () => {
    const token = getAuthToken();
    if (!token) { setLoading(false); return; }

    try {
      const response = await fetch(`http://${SERVER_IP}:8000/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      
      const data = await response.json();
      
      // ✅ FILTRAGE CRITIQUE : ne garder que l'équipe interne
      const teamMembers = (Array.isArray(data) ? data : []).filter((u: any) => 
        u.username && u.username.trim() &&  // ← Accès admin panel requis
        ['admin', 'manager', 'cuisine', 'livreur'].includes(u.role)  // ← Rôles d'équipe uniquement
      );
      
      setTeam(teamMembers);
    } catch (error) {
      console.error("❌ Erreur chargement équipe:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeam(); }, []);

  // ✅ Vérifier si l'utilisateur actuel peut supprimer un membre d'équipe
  const canDeleteUser = (targetUser: any): boolean => {
    const session = getSession();
    if (!session) return false;
    
    if (targetUser.username === session.username) return false;
    if (targetUser.role === 'admin' && session.role !== 'admin') return false;
    
    const perms = Array.isArray(session.permissions) 
      ? session.permissions 
      : (typeof session.permissions === 'string' ? session.permissions.split(',') : []);
    
    return perms.includes('manage_users') || perms.includes('delete_users') || session.role === 'admin';
  };

  const handleDelete = async (userId: number, targetUsername: string, targetRole: string) => {
    const token = getAuthToken();
    const session = getSession();
    if (!token || !session) { alert('⚠️ Session expirée'); return; }
    
    if (targetUsername === session.username) { alert("🚫 Tu ne peux pas supprimer ton propre compte !"); return; }
    if (targetRole === 'admin' && session.role !== 'admin') { alert("🚫 Seul un admin peut supprimer un autre admin !"); return; }
    
    if (!window.confirm(`⚠️ Supprimer l'accès de "${targetUsername}" ?\n\nCette action est irréversible.`)) return;

    setDeletingId(userId);
    try {
      const response = await fetch(`http://${SERVER_IP}:8000/admin/users/${userId}`, {
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      
      if (response.ok) { 
        alert("✅ Accès révoqué"); 
        fetchTeam(); 
      } else { 
        alert("❌ Erreur lors de la suppression"); 
      }
    } catch { 
      alert("❌ Erreur de connexion"); 
    } finally { 
      setDeletingId(null); 
    }
  };

  const handleAssignTask = (user: any) => {
    alert(`📋 Assigner une tâche à ${user.customer_name} (${user.role})\n\nFonctionnalité à développer.`);
  };

  const handleSendSetupLink = async (phone: string, userName: string) => {
    const token = getAuthToken();
    if (!token) return;
    
    try {
      const response = await fetch(`http://${SERVER_IP}:8000/admin/generate-reset-link/${phone}`, {
        method: "POST",
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (response.ok) {
        const message = `Bonjour ${userName}, voici votre lien pour configurer votre accès Kemtchop : ${data.link}`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
      }
    } catch (e) { console.error("Erreur reset link:", e); }
  };

  const filteredTeam = team.filter((u: any) =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: 'bg-red-100 text-red-700 border-red-200',
      manager: 'bg-blue-100 text-blue-700 border-blue-200',
      cuisine: 'bg-orange-100 text-orange-700 border-orange-200',
      livreur: 'bg-green-100 text-green-700 border-green-200',
    };
    return styles[role] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header avec recherche + bouton Ajouter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-4 top-4 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher un membre (Nom, Username, Rôle)..."
            className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border outline-none focus:ring-2 focus:ring-red-100"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button onClick={fetchTeam} className="p-2 text-gray-400 hover:text-gray-600" title="Actualiser">
            <RefreshCw size={18} />
          </button>
          {/* ✅ Bouton Ajouter un membre */}
          <button
            onClick={() => { setEditingUser(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition"
          >
            <PlusCircle size={16} />
            Ajouter
          </button>
        </div>
      </div>

      {/* Liste de l'équipe */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 text-center text-gray-400">Chargement de l'équipe...</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Membre</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Rôle</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Contact</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTeam.map((user: any) => {
                const canDelete = canDeleteUser(user);
                const isSelf = user.username === getSession()?.username;
                
                return (
                  <tr key={user.id} className="hover:bg-blue-50/30 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black">
                          {user.username?.substring(0,2).toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{user.customer_name || 'Anonyme'}</p>
                          <p className="text-[10px] text-gray-400 font-mono">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${getRoleBadge(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{user.phone || 'N/A'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {/* Bouton Modifier */}
                        <button
                          onClick={() => { setEditingUser(user); setModalOpen(true); }}
                          className="px-3 py-1.5 text-[10px] font-black uppercase border rounded hover:bg-blue-50 flex items-center gap-1"
                          title="Modifier ce membre"
                        >
                          ✏️ Modifier
                        </button>
                        
                        {/* Bouton Assigner une tâche */}
                        <button
                          onClick={() => handleAssignTask(user)}
                          className="px-3 py-1.5 text-[10px] font-black uppercase border rounded hover:bg-blue-50 flex items-center gap-1"
                          title="Assigner une tâche"
                        >
                          <Briefcase size={12} />
                          Tâche
                        </button>
                        
                        {/* Bouton Reset Password */}
                        <button
                          onClick={() => handleSendSetupLink(user.phone, user.customer_name)}
                          className="px-3 py-1.5 text-[10px] font-black uppercase border rounded hover:bg-gray-50"
                        >
                          Reset
                        </button>
                        
                        {/* Bouton Supprimer (conditionnel) */}
                        {canDelete ? (
                          <button
                            onClick={() => handleDelete(user.id, user.username, user.role)}
                            disabled={deletingId === user.id}
                            className={`px-3 py-1.5 text-[10px] font-black uppercase border rounded transition ${
                              deletingId === user.id 
                                ? 'bg-gray-200 text-gray-400 cursor-wait' 
                                : 'hover:bg-red-600 hover:text-white'
                            }`}
                          >
                            {deletingId === user.id ? '...' : 'Supprimer'}
                          </button>
                        ) : (
                          <span className="px-3 py-1.5 text-[10px] font-black uppercase text-gray-400" title={isSelf ? "Ton compte" : "Permission requise"}>
                            {isSelf ? "Toi" : "—"}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredTeam.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400">
                    {search ? "Aucun membre ne correspond à ta recherche" : "Aucun membre d'équipe trouvé"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ✅ Modal d'ajout/modification — rendu à la fin */}
      <TeamMemberModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingUser(null); }}
        onSubmit={handleSubmitUser}
        editingUser={editingUser}
      />
    </div>
  );
}