import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Save } from 'lucide-react';

export default function DeliveryManager() {
  const [zones, setZones] = useState<string[]>([]);
  const [newZone, setNewZone] = useState('');
  const [basePrice, setBasePrice] = useState(1000);
  const [loading, setLoading] = useState(false);

  // ✅ SOLUTION : Utiliser l'URL de l'API via variable d'environnement Vite
  const getApiBase = (): string => {
    try {
      // @ts-ignore - Vite injecte import.meta.env au runtime
      const viteUrl = ((import.meta as any).env?.VITE_API_URL);
      if (viteUrl) return viteUrl.replace(/\/$/, '');
    } catch (e) {
      // Ignore si import.meta.env n'est pas disponible au build
    }
    return 'http://localhost:8000';
  };

  // ✅ Helper pour extraire le token JWT
  const getAuthToken = (): string | null => {
    try {
      const sessionRaw = localStorage.getItem('kemtchop_session');
      if (!sessionRaw) return null;
      const session = JSON.parse(sessionRaw);
      return session.access_token || session.token || null;
    } catch (e) {
      console.error('❌ Erreur parse session:', e);
      return null;
    }
  };

  // 1. Charger les réglages depuis le backend au démarrage
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const apiBase = getApiBase();
        const token = getAuthToken();
        
        const res = await fetch(`${apiBase}/admin/settings/delivery-zones`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const data = await res.json();
        setZones(data.zones || []);
        setBasePrice(data.price || 1000);
      } catch (err) {
        console.error("Erreur Backend:", err);
      }
    };
    fetchSettings();
  }, []);

  // 2. Fonction pour ajouter une zone à la liste locale
  const addZone = () => {
    const formattedZone = newZone.trim();
    if (formattedZone) {
      if (!zones.includes(formattedZone)) {
        setZones([...zones, formattedZone]);
      }
      setNewZone('');
    }
  };

  // 🔍 Récupérer le token admin depuis le storage
  const handleSave = async () => {
    setLoading(true);
    
    const token = getAuthToken();
    console.log('🔍 [DeliveryManager] Token trouvé:', token ? 'OUI (length=' + token.length + ')' : 'NON');
    
    if (!token) {
      console.error('❌ [DeliveryManager] Token manquant → alerte session expirée');
      alert('⚠️ Session admin expirée. Reconnecte-toi pour sauvegarder.');
      setLoading(false);
      return;
    }

    try {
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/admin/settings/update-zones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ zones, price: basePrice }),
      });

      if (response.status === 401) {
        console.error('❌ Token invalide ou expiré');
        alert('Session expirée. Reconnecte-toi à l\'admin.');
        localStorage.removeItem('token');
        return;
      }

      if (response.ok) {
        alert("✅ Configuration enregistrée ! L'app mobile est à jour.");
        console.log('🔄 Zones mises à jour : invalider le cache client');
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`❌ Erreur serveur : ${errorData.detail || response.status}`);
      }
    } catch (err: any) {
      console.error("❌ Erreur réseau:", err);
      alert("❌ Impossible de contacter le serveur backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      {/* HEADER NOIR */}
      <div className="bg-black p-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <MapPin className="text-red-500" /> Logistique & Frais de Livraison
        </h2>
      </div>

      <div className="p-8 space-y-8">
        
        {/* SECTION PRIX DE BASE */}
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
          <label className="block text-sm font-black text-gray-700 uppercase mb-2">
            Prix Standard (FCFA)
          </label>
          <input 
            type="number" 
            value={basePrice}
            onChange={(e) => setBasePrice(parseInt(e.target.value) || 0)}
            className="w-full md:w-1/3 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500"
          />
          <p className="text-xs text-gray-500 mt-2 italic">
            * Note : Si un client tape un quartier absent de la liste ci-dessous, l'application mobile ajoutera automatiquement +500 F au total.
          </p>
        </div>

        {/* SECTION AJOUT DE QUARTIER */}
        <div>
          <label className="block text-sm font-black text-gray-700 uppercase mb-4">
            Zones à tarif normal ({basePrice} F)
          </label>
          <div className="flex gap-2 mb-6">
            <input 
              value={newZone}
              onChange={(e) => setNewZone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addZone()}
              placeholder="Ex: Bastos, Akwa, Odza..." 
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-red-500" 
            />
            <button 
              type="button"
              onClick={addZone}
              className="bg-black text-white px-8 rounded-xl font-bold hover:bg-gray-800 transition-all active:scale-95"
            >
              Ajouter
            </button>
          </div>

          {/* LISTE DES BADGES (ZONES) */}
          <div className="flex flex-wrap gap-3">
            {zones.length === 0 && (
              <p className="text-gray-400 text-sm italic">Aucune zone enregistrée pour le moment.</p>
            )}
            {zones.map((zone, index) => (
              <div 
                key={index} 
                className="flex items-center bg-red-50 text-red-600 px-4 py-2 rounded-full font-bold border border-red-100 animate-in fade-in zoom-in duration-300"
              >
                {zone}
                <button 
                  onClick={() => setZones(zones.filter((_, i) => i !== index))} 
                  className="ml-3 hover:text-red-800 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* BOUTON DE SAUVEGARDE FINALE */}
        <button 
          onClick={handleSave}
          disabled={loading}
          className={`w-full py-5 rounded-2xl font-black text-white transition-all shadow-lg flex items-center justify-center gap-3 ${
            loading ? 'bg-gray-400' : 'bg-red-600 hover:scale-[1.01] active:scale-[0.99] shadow-red-100'
          }`}
        >
          <Save size={22} />
          {loading ? "SYNCHRONISATION..." : "ENREGISTRER LA CONFIGURATION"}
        </button>
      </div>
    </div>
  );
}