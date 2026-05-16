import React, { useState, useEffect } from "react";
import { ShieldCheck, CheckSquare, Square, Trash2, Users } from "lucide-react";

export default function TeamManager() {
  const [team, setTeam] = useState([]); // Liste des membres
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    password: "",
    role: "manager",
    permissions: ["dashboard"]
  });

  const SERVER_IP = "127.0.0.1";
  const session = JSON.parse(localStorage.getItem('kemtchop_session') || '{}');

  // Liste complète des permissions du Dashboard
  const availablePermissions = [
    { id: 'dashboard', label: 'Tableau de bord (Stats)' },
    { id: 'orders', label: 'Gestion des Commandes' },
    { id: 'products', label: 'Menu & Plats' },
    { id: 'delivery', label: 'Suivi Livraisons' },
    { id: 'inventory', label: 'Gestion des Stocks' },
    { id: 'wallet', label: 'Portefeuille & Gains' },
    { id: 'affiliates', label: 'Gestion Ambassadeurs' },
    { id: 'team', label: 'Gestion d\'Équipe' },
    { id: 'settings', label: 'Paramètres Boutique' },
  ];

  // Charger l'équipe au démarrage
  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const res = await fetch(`http://${SERVER_IP}:8000/admin/users`, {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      setTeam(data);
    } catch (err) { 
      console.error("Erreur chargement équipe:", err); 
    }
  };

  const handleDelete = async (userId: number, name: string) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer l'accès de ${name} ?`)) return;

    try {
      const res = await fetch(`http://${SERVER_IP}:8000/admin/users/${userId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        alert("Membre supprimé");
        fetchTeam(); 
      }
    } catch (err) { 
      alert("Erreur lors de la suppression"); 
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!formData.username || !formData.password) return alert("Login et mot de passe requis");

    const dataToSend = {
      username: formData.username.trim(),
      customer_name: formData.full_name,
      password: formData.password,
      role: formData.role,
      permissions: formData.permissions.join(",") 
    };

    const res = await fetch(`http://${SERVER_IP}:8000/admin/users`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}` 
      },
      body: JSON.stringify(dataToSend),
    });

    if (res.ok) {
      alert("Accès créé !");
      setFormData({ username: "", full_name: "", password: "", role: "manager", permissions: ["dashboard"] });
      fetchTeam();
    } else {
      alert("Erreur lors de la création de l'accès");
    }
  };

  const togglePermission = (permId: string) => {
    setFormData(prev => {
      const isSelected = prev.permissions.includes(permId);
      const newPerms = isSelected 
        ? prev.permissions.filter(p => p !== permId) 
        : [...prev.permissions, permId];
      return { ...prev, permissions: newPerms };
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      {/* FORMULAIRE DE CRÉATION */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-100">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase italic">Nouvel Accès Équipe</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Définir les permissions de l'agent</p>
          </div>
        </div>

        <form onSubmit={handleCreateAccount} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Identifiant de connexion</label>
              <input 
                placeholder="Ex: brice_admin" 
                className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-red-500 transition-all font-bold" 
                value={formData.username} 
                onChange={e => setFormData({...formData, username: e.target.value})} 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Nom complet de l'agent</label>
              <input 
                placeholder="Ex: Jean Luc" 
                className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-red-500 transition-all font-bold" 
                value={formData.full_name} 
                onChange={e => setFormData({...formData, full_name: e.target.value})} 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Mot de passe provisoire</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-red-500 transition-all font-bold" 
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
            />
          </div>
          
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Droits d'accès accordés :</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {availablePermissions.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => togglePermission(p.id)} 
                  className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${
                    formData.permissions.includes(p.id) 
                    ? "border-red-600 bg-red-50 text-red-600 shadow-sm" 
                    : "border-gray-100 bg-gray-50 text-gray-400 hover:bg-gray-100"
                  }`}
                >
                  {formData.permissions.includes(p.id) ? <CheckSquare size={16} className="shrink-0" /> : <Square size={16} className="shrink-0" />}
                  <span className="text-[9px] font-black uppercase leading-tight">{p.label}</span>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase italic hover:bg-red-600 transition-all shadow-lg">
            Valider et Créer l'accès
          </button>
        </form>
      </div>

      {/* LISTE DE L'ÉQUIPE ACTUELLE */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gray-100 text-gray-600 rounded-2xl"><Users size={24} /></div>
          <div>
            <h2 className="text-xl font-black uppercase italic">Membres Actuels</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase italic">Liste des accès révoquables</p>
          </div>
        </div>
        
        <div className="space-y-3">
          {team.map((user: any) => (
            <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center font-black text-xs">
                  {user.username ? user.username.substring(0, 2).toUpperCase() : "???"}
                </div>
                <div>
                  <p className="font-black text-sm uppercase leading-none">{user.customer_name || user.username}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{user.role || 'Membre'}</p>
                </div>
              </div>
              
              {user.username !== session.username ? (
                <button 
                  onClick={() => handleDelete(user.id, user.customer_name || user.username)}
                  className="p-3 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              ) : (
                <span className="text-[8px] font-black text-red-600 bg-red-50 px-3 py-1 rounded-lg uppercase italic border border-red-100">
                  Maître (Toi)
                </span>
              )}
            </div>
          ))}
          
          {team.length === 0 && (
            <p className="text-center text-gray-400 text-xs font-bold uppercase py-8 border-2 border-dashed border-gray-100 rounded-3xl">
              Aucun membre trouvé
            </p>
          )}
        </div>
      </div>
    </div>
  );
}