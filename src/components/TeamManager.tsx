// src/components/TeamManager.tsx - Version sécurisée (plus de logs de password)
import React, { useState, useEffect } from "react";
import { Search, ShieldAlert, User, RefreshCw, Trash2, Briefcase, PlusCircle, X } from "lucide-react";
// ✅ IMPORT CRITIQUE : Utiliser le client API centralisé
import { api, hasPermission, logout } from '@/services/api';

// ============================================================
// ✅ MODAL D'AJOUT/MODIFICATION (défini AVANT le composant principal)
// ============================================================
interface TeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  editingUser?: any | null;
}

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
    password: '',
    role: 'manager',
    permissions: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (editingUser) {
        setFormData({
          customer_name: editingUser.customer_name || '',
          username: editingUser.username || '',
          phone: editingUser.phone || '',
          password: '', // ✅ Password vide en mode édition (on ne le change pas si vide)
          role: editingUser.role || 'manager',
          permissions: editingUser.permissions 
            ? (typeof editingUser.permissions === 'string' 
                ? editingUser.permissions.split(',').map((p: string) => p.trim()) 
                : editingUser.permissions)
            : [],
        });
      } else {
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
      console.error('❌ Erreur soumission:', err.message);
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
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm font-medium">
              ⚠️ {error}
            </div>
          )}
          
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
  const [team, setTeam] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  // ✅ Vérification des permissions au montage
  useEffect(() => {
    if (!hasPermission('manage_users')) {
      setLoading(false);
      return;
    }
    fetchTeam();
  }, []);

  // ✅ Fonction pour créer/modifier un utilisateur via l'API centralisée
  const handleSubmitUser = async (data: any) => {
    try {
      // ✅ Ne PAS logger le password ! Loguer seulement les champs non sensibles
      const safeLogData = { ...data };
      if (safeLogData.password) {
        safeLogData.password = '***'; // ✅ Masquer le password dans les logs
      }
      console.log(`📡 ${editingUser ? 'PUT' : 'POST'} /admin/users`, {
        username: safeLogData.username,
        role: safeLogData.role,
        permissionsCount: safeLogData.permissions?.length || 0
      });
      
      const url = editingUser 
        ? `/admin/users/${editingUser.id}`
        : '/admin/users';
      
      const method = editingUser ? 'put' : 'post';
      
      // ✅ Utiliser le client API centralisé (gère token + URL automatiquement)
      const result = await api[method](url, data, true);
      
      console.log(`✅ ${editingUser ? 'Modifications' : 'Compte'} enregistré:`, {
        id: result.id || result.user_id,
        username: result.username
      });
      
      alert(`✅ ${editingUser ? 'Modifications' : 'Compte'} enregistré avec succès !`);
      fetchTeam();
    } catch (error: any) {
      console.error('❌ Erreur sauvegarde utilisateur:', error.message);
      throw error; // Re-throw pour que le modal puisse afficher l'erreur
    }
  };

  // ✅ Charger UNIQUEMENT les membres d'équipe (accès admin panel)
  const fetchTeam = async () => {
    setLoading(true);
    try {
      // ✅ Utiliser le client API centralisé
      const data = await api.get('/admin/users', true);
      
      // ✅ FILTRAGE CRITIQUE : ne garder que l'équipe interne
      const teamMembers = (Array.isArray(data) ? data : []).filter((u: any) => 
        u.username && u.username.trim() &&
        ['admin', 'manager', 'cuisine', 'livreur'].includes(u.role)
      );
      
      setTeam(teamMembers);
    } catch (error: any) {
      console.error("❌ Erreur chargement équipe:", error.message);
      if (error.message?.includes('Authentification requise')) {
        logout();
        // Optionnel : redirection
        // window.location.href = '/admin/login';
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Vérifier si l'utilisateur actuel peut supprimer un membre d'équipe
  const canDeleteUser = (targetUser: any): boolean => {
    const sessionRaw = localStorage.getItem('kemtchop_session');
    if (!sessionRaw) return false;
    
    try {
      const session = JSON.parse(sessionRaw);
      if (targetUser.username === session.username) return false;
      if (targetUser.role === 'admin' && session.role !== 'admin') return false;
      
      const perms = Array.isArray(session.permissions) 
        ? session.permissions 
        : (typeof session.permissions === 'string' ? session.permissions.split(',') : []);
      
      return perms.includes('manage_users') || perms.includes('delete_users') || session.role === 'admin';
    } catch {
      return false;
    }
  };

  const handleDelete = async (userId: number, targetUsername: string, targetRole: string) => {
    const sessionRaw = localStorage.getItem('kemtchop_session');
    if (!sessionRaw) { alert('⚠️ Session expirée'); return; }
    
    try {
      const session = JSON.parse(sessionRaw);
      if (targetUsername === session.username) { alert("🚫 Tu ne peux pas supprimer ton propre compte !"); return; }
      if (targetRole === 'admin' && session.role !== 'admin') { alert("🚫 Seul un admin peut supprimer un autre admin !"); return; }
    } catch {
      alert('⚠️ Session invalide');
      return;
    }
    
    if (!window.confirm(`⚠️ Supprimer l'accès de "${targetUsername}" ?\n\nCette action est irréversible.`)) return;

    setDeletingId(userId);
    try {
      // ✅ Utiliser le client API centralisé pour DELETE
      await api.delete(`/admin/users/${userId}`, true);
      alert("✅ Accès révoqué"); 
      fetchTeam(); 
    } catch (error: any) {
      console.error("❌ Erreur suppression:", error.message);
      if (error.message?.includes('Authentification requise')) {
        alert('⚠️ Session expirée. Reconnecte-toi.');
        logout();
      } else {
        alert("❌ Erreur lors de la suppression: " + error.message);
      }
    } finally { 
      setDeletingId(null); 
    }
  };

  const handleAssignTask = (user: any) => {
    alert(`📋 Assigner une tâche à ${user.customer_name} (${user.role})\n\nFonctionnalité à développer.`);
  };

  const handleSendSetupLink = async (phone: string, userName: string) => {
    try {
      // ✅ Utiliser le client API centralisé
      const result = await api.post(`/admin/generate-reset-link/${phone}`, {}, true);
      
      if (result?.link) {
        const message = `Bonjour ${userName}, voici votre lien pour configurer votre accès Kemtchop : ${result.link}`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
      }
    } catch (e: any) { 
      console.error("❌ Erreur reset link:", e.message);
      alert("Impossible d'envoyer le lien de réinitialisation");
    }
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

  // ✅ Affichage si pas de permission
  if (!hasPermission('manage_users')) {
    return (
      <div className="p-8 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-xl font-black text-gray-900 uppercase italic mb-2">
          Accès refusé
        </h2>
        <p className="text-gray-500 font-bold">
          Vous n'avez pas la permission <span className="text-red-600">"manage_users"</span> pour gérer l'équipe.
        </p>
      </div>
    );
  }

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
                const isSelf = user.username === (JSON.parse(localStorage.getItem('kemtchop_session') || '{}')?.username);
                
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
                        <button
                          onClick={() => { setEditingUser(user); setModalOpen(true); }}
                          className="px-3 py-1.5 text-[10px] font-black uppercase border rounded hover:bg-blue-50 flex items-center gap-1"
                          title="Modifier ce membre"
                        >
                          ✏️ Modifier
                        </button>
                        
                        <button
                          onClick={() => handleAssignTask(user)}
                          className="px-3 py-1.5 text-[10px] font-black uppercase border rounded hover:bg-blue-50 flex items-center gap-1"
                          title="Assigner une tâche"
                        >
                          <Briefcase size={12} />
                          Tâche
                        </button>
                        
                        <button
                          onClick={() => handleSendSetupLink(user.phone, user.customer_name)}
                          className="px-3 py-1.5 text-[10px] font-black uppercase border rounded hover:bg-gray-50"
                        >
                          Reset
                        </button>
                        
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