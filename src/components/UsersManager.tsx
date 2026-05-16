import React, { useState, useEffect } from "react";
import { Search, ShieldAlert, User, RefreshCw } from "lucide-react";

export default function UsersManager() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Remplace par ton IP si tu testes sur un autre appareil
  const SERVER_IP = "127.0.0.1";

  // 1. Charger la liste des utilisateurs
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`http://${SERVER_IP}:8000/admin/users`);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fonction de réinitialisation
  const handleSendSetupLink = async (phone: string, userName: string) => {
  try {
    const response = await fetch(`http://${SERVER_IP}:8000/admin/generate-reset-link/${phone}`, {
      method: "POST"
    });
    const data = await response.json();

    if (response.ok) {
      const message = `Bonjour ${userName}, voici votre lien unique pour configurer votre accès sécurisé sur Kemtchop : ${data.link}`;
      // Ouvre WhatsApp avec le message pré-rempli
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    }
  } catch (error) {
    alert("Erreur lors de la génération du lien");
  }
};
  // Filtrage pour la recherche
  const filteredUsers = users.filter(
    (u: any) =>
      u.phone.includes(search) || u.customer_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Barre de recherche stylisée */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="text-gray-400 group-focus-within:text-red-600 transition-colors" size={20} />
        </div>
        <input
          type="text"
          placeholder="Rechercher un client (Nom ou Numéro)..."
          className="w-full pl-12 pr-4 py-4 bg-white rounded-[2rem] border border-gray-100 shadow-sm outline-none focus:ring-2 focus:ring-red-100 focus:border-red-600 transition-all font-medium"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Liste des utilisateurs */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 text-center text-gray-400 font-bold animate-pulse">
            Chargement de la base clients...
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Client</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Contact</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Sécurité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user: any) => (
                  <tr key={user.phone} className="hover:bg-red-50/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
                          <User size={18} />
                        </div>
                        <span className="font-bold text-gray-900">{user.customer_name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="font-mono text-sm text-gray-500">{user.phone}</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button
                        onClick={() => handleSendSetupLink(user.phone, user.customer_name)}
                        className="inline-flex items-center gap-2 bg-white border border-gray-200 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest text-gray-700 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm active:scale-95"
                      >
                        <RefreshCw size={14} />
                        Reset Pass
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <ShieldAlert className="text-gray-200" size={48} />
                      <p className="text-gray-400 font-bold italic">Aucun client trouvé pour cette recherche.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Petit footer d'info */}
      <div className="flex justify-center items-center gap-2 text-gray-400">
        <div className="h-1 w-1 rounded-full bg-gray-300"></div>
        <p className="text-[10px] font-black uppercase tracking-tighter italic">
          {filteredUsers.length} clients enregistrés sur Kemtchop
        </p>
        <div className="h-1 w-1 rounded-full bg-gray-300"></div>
      </div>
    </div>
  );
}