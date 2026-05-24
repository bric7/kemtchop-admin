// src/components/CustomersManager.tsx
import React, { useState, useEffect } from "react";
import { Search, Users, MessageCircle, Package } from "lucide-react";

export default function CustomersManager() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const SERVER_IP = "127.0.0.1";
  const getSession = () => JSON.parse(localStorage.getItem('kemtchop_session') || 'null');

  // ✅ Charger uniquement les clients (ceux sans username = pas d'accès admin)
  const fetchCustomers = async () => {
    const session = getSession();
    if (!session) return;
    try {
      const response = await fetch(`http://${SERVER_IP}:8000/admin/users`, {
        headers: { 'Authorization': `Bearer ${session.access_token || session.token}` }
      });
      if (!response.ok) throw new Error(`Erreur: ${response.status}`);
      const data = await response.json();
      // ✅ Filtrer : ne garder que les clients (pas de username OU role = 'customer')
      const custs = (Array.isArray(data) ? data : []).filter((u: any) => !u.username || u.role === 'customer');
      setCustomers(custs);
    } catch (e) { console.error("Erreur chargement clients:", e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCustomers(); }, []);

  // ✅ Envoyer un message WhatsApp de campagne
  const sendCampaign = (phone: string, name: string, orderCount: number = 0) => {
    const message = orderCount > 0
      ? `Bonjour ${name} 👋\n\nMerci pour vos ${orderCount} commandes chez KemTchop ! 🍲\n\n🎁 Offre spéciale : -10% sur votre prochaine commande avec le code FIDELITE10\n\nCommandez ici : ${window.location.origin.replace('/admin', '')}\n\nÀ très vite ! 🇨🇲`
      : `Bonjour ${name} 👋\n\nDécouvrez les délices du Cameroun avec KemTchop ! 🍲\n\n🎁 Offre de bienvenue : -15% sur votre première commande avec le code BIENVENUE15\n\nCommandez ici : ${window.location.origin.replace('/admin', '')}\n\nÀ très vite ! 🇨🇲`;
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // ✅ Campagne groupée
  const sendBulkCampaign = () => {
    const selected = customers.filter((c: any) => c.phone);
    if (selected.length === 0) { alert("Aucun client avec numéro"); return; }
    
    const campaignText = `🎉 Offre spéciale KemTchop !\n-15% sur toutes les commandes cette semaine avec le code PROMO15.\nCommandez maintenant : ${window.location.origin.replace('/admin', '')}\n\nBon appétit ! 🇨🇲🍲`;
    
    window.open(`https://web.whatsapp.com/send?text=${encodeURIComponent(campaignText)}`, '_blank');
    alert(`📋 Message prêt pour ${selected.length} clients !\n\nUtilisez WhatsApp Web pour envoyer.`);
  };

  const filtered = customers.filter((c: any) =>
    c.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="relative w-80">
          <Search className="absolute left-4 top-4 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher un client..."
            className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border outline-none focus:ring-2 focus:ring-red-100"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={sendBulkCampaign}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition"
        >
          <MessageCircle size={18} />
          Campagne Clients ({filtered.length})
        </button>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 text-center text-gray-400">Chargement des clients...</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Client</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Contact</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Commandes</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((cust: any) => (
                <tr key={cust.id} className="hover:bg-blue-50/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black">
                        {cust.customer_name?.substring(0,2).toUpperCase() || '?'}
                      </div>
                      <p className="font-bold text-sm">{cust.customer_name || 'Anonyme'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{cust.phone || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-gray-700">{cust.order_count || 0}</span>
                    <p className="text-[10px] text-gray-400">commandes</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => sendCampaign(cust.phone, cust.customer_name, cust.order_count)}
                      className="px-3 py-1.5 text-[10px] font-black uppercase bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-1 ml-auto"
                    >
                      <MessageCircle size={12} />
                      Message
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-gray-400">Aucun client trouvé</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}