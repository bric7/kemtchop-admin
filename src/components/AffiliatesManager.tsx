// src/components/AffiliatesManager.tsx
import React, { useState, useEffect } from "react";
import { Search, Users, MessageCircle, Copy, Check } from "lucide-react";

export default function AffiliatesManager() {
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const SERVER_IP = "127.0.0.1";
  const BASE_URL = `http://${SERVER_IP}:8000`;

  const getSession = () => JSON.parse(localStorage.getItem('kemtchop_session') || 'null');

  // ✅ Charger uniquement les affiliés (is_affiliate = true)
  const fetchAffiliates = async () => {
    const session = getSession();
    if (!session) return;
    try {
      const response = await fetch(`${BASE_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${session.access_token || session.token}` }
      });
      if (!response.ok) throw new Error(`Erreur: ${response.status}`);
      const data = await response.json();
      // ✅ Filtrer : ne garder que les affiliés
      const affs = (Array.isArray(data) ? data : []).filter((u: any) => u.is_affiliate);
      setAffiliates(affs);
    } catch (e) { console.error("Erreur chargement affiliés:", e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAffiliates(); }, []);

  // ✅ Générer le lien de parrainage
  const getReferralLink = (affiliateCode: string) => {
    return `${BASE_URL}/home?ref=${affiliateCode}`;
  };

  // ✅ Copier le lien dans le presse-papier
  const copyReferralLink = async (code: string, id: number) => {
    const link = getReferralLink(code);
    await navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ✅ Ouvrir WhatsApp avec message de campagne
  const sendWhatsAppCampaign = (phone: string, name: string, affiliateCode: string) => {
    const message = `Bonjour ${name} 👋\n\nVotre code affilié KemTchop : *${affiliateCode}*\nPartagez ce lien et gagnez 15% sur chaque commande :\n${getReferralLink(affiliateCode)}\n\nMerci de faire partie de l'aventure ! 🇨🇲🍲`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // ✅ Envoyer un message groupé à plusieurs affiliés (pour campagnes)
  const sendBulkWhatsApp = () => {
    const selected = affiliates.filter((a: any) => a.phone);
    if (selected.length === 0) { alert("Aucun affilié avec numéro de téléphone"); return; }
    
    const campaignText = `🚀 Nouvelle campagne KemTchop !\nPartagez votre lien affilié cette semaine et doublez vos gains.\nVotre code : [CODE]\nLien : [LIEN]\n\nBonne chance ! 🎉`;
    
    // Ouvrir WhatsApp Web avec le message pré-rempli (l'utilisateur devra copier-coller pour chaque destinataire)
    const encoded = encodeURIComponent(campaignText);
    window.open(`https://web.whatsapp.com/send?text=${encoded}`, '_blank');
    
    alert(`📋 Message prêt pour ${selected.length} affiliés !\n\nCopiez-collez le message dans WhatsApp Web pour chaque destinataire.\n\n💡 Astuce : Utilisez WhatsApp Business pour envoyer des messages groupés automatiquement.`);
  };

  const filtered = affiliates.filter((a: any) =>
    a.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.phone?.includes(search) ||
    a.affiliate_code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header avec action groupée */}
      <div className="flex justify-between items-center">
        <div className="relative w-80">
          <Search className="absolute left-4 top-4 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher un affilié..."
            className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border outline-none focus:ring-2 focus:ring-red-100"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={sendBulkWhatsApp}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition"
        >
          <MessageCircle size={18} />
          Campagne WhatsApp ({filtered.length})
        </button>
      </div>

      {/* Liste des affiliés */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 text-center text-gray-400">Chargement des affiliés...</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Affilié</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Code</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Commission</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((aff: any) => {
                const commission = (aff.pending_commissions || 0).toLocaleString();
                return (
                  <tr key={aff.id} className="hover:bg-green-50/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center font-black">
                          {aff.customer_name?.substring(0,2).toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{aff.customer_name}</p>
                          <p className="text-[10px] text-gray-400">{aff.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{aff.affiliate_code}</code>
                        <button onClick={() => copyReferralLink(aff.affiliate_code, aff.id)} className="p-1 hover:bg-gray-100 rounded" title="Copier le lien">
                          {copiedId === aff.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-green-600">{commission} FCFA</span>
                      <p className="text-[10px] text-gray-400">en attente</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => sendWhatsAppCampaign(aff.phone, aff.customer_name, aff.affiliate_code)}
                        className="px-3 py-1.5 text-[10px] font-black uppercase bg-green-600 text-white rounded hover:bg-green-700 transition flex items-center gap-1 ml-auto"
                      >
                        <MessageCircle size={12} />
                        Message
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-gray-400">Aucun affilié trouvé</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}