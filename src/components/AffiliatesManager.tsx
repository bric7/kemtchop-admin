import React, { useState } from 'react';
import { Search, UserCheck, Copy, Phone, ShieldAlert } from 'lucide-react';

const AffiliatesManager = () => {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  
  const SERVER_URL = "http://127.0.0.1:8000"; 
  const session = JSON.parse(localStorage.getItem('kemtchop_session') || '{}');

  const handleSearchAndActivate = async () => {
    if (!phone) return alert("Entrez un numéro !");
    
    setLoading(true);
    setUserData(null);

    try {
      // Cette route doit pointer vers la gestion des CLIENTS/AFFILIÉS
      const response = await fetch(`${SERVER_URL}/admin/activate-affiliate/?phone=${phone}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUserData(data);
        setPhone(""); 
      } else {
        alert(data.detail || "Client non trouvé dans la base Android");
      }
    } catch (error) {
      alert("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Lien copié pour l'ambassadeur !");
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-black uppercase italic">Gestion des Clients & Affiliés</h2>
        <p className="text-gray-500 text-sm">Recherchez un utilisateur Android pour l'activer ou l'aider.</p>
      </div>

      {/* ZONE DE RECHERCHE */}
      <div className="bg-gray-50 p-6 rounded-[2rem] border-2 border-dashed border-gray-200 mb-8">
        <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Numéro de téléphone Client</label>
        <div className="flex gap-3 mt-2">
          <div className="relative flex-1">
            <Phone className="absolute left-4 top-4 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="6XXXXXXXX" 
              className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border-none shadow-sm font-bold text-lg"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <button 
            onClick={handleSearchAndActivate}
            disabled={loading}
            className="bg-black text-white px-8 rounded-2xl font-black uppercase italic hover:bg-red-600 transition-colors disabled:bg-gray-300"
          >
            {loading ? "Recherche..." : "Gérer"}
          </button>
        </div>
      </div>

      {/* RÉSULTAT DU COMPTE CLIENT */}
      {userData && (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl overflow-hidden">
          <div className="bg-green-500 p-6 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <UserCheck size={28} />
              <h3 className="font-black uppercase italic">Compte Client Trouvé</h3>
            </div>
            <span className="bg-white text-green-600 px-4 py-1 rounded-full font-black text-xs">
              {userData.affiliate_code || "CLIENT STANDARD"}
            </span>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Nom du client</p>
                <p className="font-black text-gray-800">{userData.user_name || "Non renseigné"}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Téléphone</p>
                <p className="font-black text-gray-800">{userData.phone || "N/A"}</p>
              </div>
            </div>

            {/* SECTION MOT DE PASSE OUBLIÉ / INFOS */}
            <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-2xl flex items-start gap-3">
              <ShieldAlert className="text-yellow-600 shrink-0" size={20} />
              <div>
                <p className="text-xs font-bold text-yellow-800 uppercase text-[10px]">Aide Connexion</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Si le client a oublié son mot de passe, confirmez son identité avec le nom ci-dessus.
                </p>
              </div>
            </div>

            {/* LIEN D'AFFILIATION SI ACTIVÉ */}
            {userData.share_link && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-3 text-center">Lien d'ambassadeur généré</p>
                <div className="flex items-center gap-2 bg-gray-900 p-2 rounded-2xl overflow-hidden">
                  <code className="flex-1 text-green-400 text-[11px] font-mono px-4 truncate">
                    {userData.share_link}
                  </code>
                  <button 
                    onClick={() => copyToClipboard(userData.share_link)}
                    className="bg-white text-black p-3 rounded-xl hover:bg-green-500 hover:text-white transition-all"
                  >
                    <Copy size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AffiliatesManager;