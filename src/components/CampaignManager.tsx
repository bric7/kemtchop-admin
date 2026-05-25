// src/components/CampaignManager.tsx
import React, { useState, useEffect } from "react";
import { MessageCircle, ShoppingCart, Video, Send, RefreshCw, AlertCircle } from "lucide-react";

type CampaignType = "abandoned_cart" | "video_interest";

interface CampaignTarget {
  phone: string;
  customer_name?: string;
  last_event: string;
  last_event_date: string;
  product_interest?: string;
  cart_value?: number;
  total_events: number;
}

export default function CampaignManager() {
  const [campaignType, setCampaignType] = useState<CampaignType>("abandoned_cart");
  const [targets, setTargets] = useState<CampaignTarget[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageTemplate, setMessageTemplate] = useState("");
  const [sending, setSending] = useState(false);

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
  const getToken = (): string => {
    try {
      const s = JSON.parse(localStorage.getItem("kemtchop_session") || "{}");
      return s.access_token || s.token || "";
    } catch (e) {
      console.error("❌ Erreur parse session:", e);
      return "";
    }
  };

  // Charger les cibles selon le type de campagne
  const fetchTargets = async () => {
    setLoading(true);
    const token = getToken();
    if (!token) { setLoading(false); return; }

    try {
      const apiBase = getApiBase();
      const url =
        campaignType === "abandoned_cart"
          ? `${apiBase}/admin/analytics/abandoned-carts?hours=48&min_cart_value=1000`
          : `${apiBase}/admin/analytics/video-interest?hours=72`;

      const res = await fetch(url, { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      });
      
      if (res.ok) {
        const data = await res.json();
        setTargets(Array.isArray(data) ? data : []);
        // Pré-remplir le message
        setMessageTemplate(
          campaignType === "abandoned_cart"
            ? `Bonjour {name} 👋\n\nVotre commande de {product} est toujours dans votre panier chez KemTchop ! 🍲\n\n🎁 Finalisez avec -10% : RELANCE10\n👉 {link}`
            : `Bonjour {name} 👋\n\nMerci d'avoir regardé notre vidéo sur KemTchop ! 🎥\n\n🎁 Première commande : -15% avec BIENVENUE15\n👉 {link}`
        );
      } else {
        setTargets([]);
      }
    } catch (e) {
      console.error("❌ Erreur fetch targets:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTargets(); }, [campaignType]);

  // Préparer et ouvrir WhatsApp Web
  const sendCampaign = () => {
    if (targets.length === 0) return alert("⚠️ Aucun destinataire pour cette campagne");
    if (!messageTemplate.trim()) return alert("⚠️ Le message est vide");

    setSending(true);
    const first = targets[0];
    // Nettoyage du numéro pour WhatsApp (enlever espaces, +, 00)
    const cleanPhone = first.phone.replace(/\D/g, "").replace(/^0+/, "").replace(/^237/, "237");

    const personalized = messageTemplate
      .replace(/{name}/g, first.customer_name || "Cher client")
      .replace(/{product}/g, first.product_interest || "nos délices")
      .replace(/{link}/g, `https://kemtchop.app/home?phone=${cleanPhone}`)
      .replace(/{code}/g, cleanPhone);

    window.open(
      `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(personalized)}`,
      "_blank"
    );

    alert(
      `📋 Message prêt pour ${targets.length} destinataires !\n\n` +
      `1. WhatsApp Web s'est ouvert avec le 1er message pré-rempli\n` +
      `2. Copiez-collez pour les autres, ou utilisez WhatsApp Business pour l'envoi groupé\n\n` +
      `💡 Astuce : Ne spammez pas. Max 50 messages/jour pour éviter le blocage.`
    );
    setSending(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-3">
          <button
            onClick={() => setCampaignType("abandoned_cart")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition ${
              campaignType === "abandoned_cart" ? "bg-red-600 text-white shadow-lg" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <ShoppingCart size={16} /> Paniers abandonnés ({targets.length})
          </button>
          <button
            onClick={() => setCampaignType("video_interest")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition ${
              campaignType === "video_interest" ? "bg-blue-600 text-white shadow-lg" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Video size={16} /> Intéressés par vidéos ({targets.length})
          </button>
        </div>
        <button onClick={fetchTargets} className="p-2 text-gray-400 hover:text-gray-600" title="Actualiser">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Zone de message */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <label className="block text-sm font-bold text-gray-700 mb-2">Message WhatsApp (modifiable) :</label>
        <textarea
          value={messageTemplate}
          onChange={(e) => setMessageTemplate(e.target.value)}
          className="w-full h-32 p-3 border border-gray-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none resize-none"
          placeholder="Bonjour {name}..."
        />
        <div className="flex flex-wrap gap-2 mt-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          <span>Variables :</span>
          <span className="px-2 py-1 bg-gray-50 rounded">{`{name}`}</span>
          <span className="px-2 py-1 bg-gray-50 rounded">{`{product}`}</span>
          <span className="px-2 py-1 bg-gray-50 rounded">{`{link}`}</span>
        </div>
      </div>

      {/* Liste des destinataires */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex justify-between items-center">
          <h3 className="font-black text-gray-900">Destinataires ciblés</h3>
          <button
            onClick={sendCampaign}
            disabled={sending || targets.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Send size={16} /> {sending ? "Préparation..." : `Lancer (${targets.length})`}
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 font-medium animate-pulse">Chargement des cibles...</div>
        ) : targets.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-3">
            <AlertCircle className="text-gray-300" size={40} />
            <p className="text-gray-500 font-medium">Aucun utilisateur ciblé pour les dernières 48h/72h</p>
            <p className="text-xs text-gray-400">Continuez à tracker les événements mobile pour remplir cette liste</p>
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Intérêt</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Panier</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {targets.map((t, i) => (
                  <tr key={i} className="hover:bg-red-50/20 transition">
                    <td className="px-6 py-4">
                      <p className="font-bold text-sm text-gray-900">{t.customer_name || "Anonyme"}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{t.phone}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{t.product_interest || "Vidéo/Produit"}</td>
                    <td className="px-6 py-4">
                      {t.cart_value ? <span className="font-bold text-green-600">{t.cart_value.toLocaleString()} F</span> : "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          const cleanPhone = t.phone.replace(/\D/g, "").replace(/^0+/, "").replace(/^237/, "237");
                          const msg = messageTemplate
                            .replace(/{name}/g, t.customer_name || "Cher client")
                            .replace(/{product}/g, t.product_interest || "nos délices")
                            .replace(/{link}/g, `https://kemtchop.app/home?phone=${cleanPhone}`);
                          window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
                        }}
                        className="px-3 py-1.5 text-[10px] font-black uppercase bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                      >
                        WhatsApp
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}