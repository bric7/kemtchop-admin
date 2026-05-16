import React, { useEffect, useState } from "react";
import { Edit3, Trash2, X, Save, Loader2, Image as ImageIcon, Video } from "lucide-react";

const ProductManager = () => {
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Utilise "localhost" si tu es sur PC, ou l'IP locale si tu testes sur mobile
  const SERVER_IP = "127.0.0.1"; 

  // Fonction utilitaire pour nettoyer et corriger les URLs d'images/vidéos
  const getCorrectUrl = (url) => {
    if (!url) return "https://via.placeholder.com/400x300?text=Pas+de+média";
    
    // Si l'URL contient déjà le dossier /videos/, on extrait le nom du fichier
    // Cela évite les problèmes d'IP enregistrées en dur dans la BDD
    if (url.includes("/videos/")) {
      const fileName = url.split("/videos/").pop();
      return `http://${SERVER_IP}:8000/videos/${fileName}`;
    }
    
    return url.startsWith('http') ? url : `http://${SERVER_IP}:8000${url}`;
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`http://${SERVER_IP}:8000/admin/products`);
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("Erreur lors de la récupération :", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // États pour la logique de calcul dynamique
  const [soloPrice, setSoloPrice] = useState(0);
  const [familyCount, setFamilyCount] = useState(3);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Voulez-vous vraiment supprimer "${name}" ?`)) {
      try {
        const res = await fetch(`http://${SERVER_IP}:8000/admin/products/${id}`, { method: 'DELETE' });
        if (res.ok) {
          alert("✅ Produit supprimé.");
          fetchProducts();
        }
      } catch (error) {
        alert("Erreur lors de la suppression");
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    
    formData.append("price_duo", (soloPrice * 2).toString());
    formData.append("price_family", (soloPrice * familyCount - 500).toString());

    try {
      const response = await fetch(`http://${SERVER_IP}:8000/admin/products/${editingProduct.id}`, {
        method: "PATCH",
        body: formData,
      });
      if (response.ok) {
        setEditingProduct(null);
        fetchProducts();
      }
    } catch (error) {
      console.error("Erreur update:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((p) => (
          <div key={p.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-lg group border border-gray-100">
            <div className="relative h-48 bg-gray-200">
              <img 
                src={getCorrectUrl(p.image_url)} 
                alt={p.product_name} 
                className="w-full h-full object-cover" 
                onError={(e) => { 
                    e.target.onerror = null; 
                    e.target.src = "https://via.placeholder.com/400x300?text=Erreur+Image"; 
                }}
              />
              
              <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => {
                  setEditingProduct(p);
                  setSoloPrice(p.price);
                  setFamilyCount(p.family_size || 3);
                }} className="p-3 bg-white/90 backdrop-blur rounded-2xl text-blue-600 shadow-xl hover:scale-110 transition-transform">
                  <Edit3 size={18} />
                </button>
                <button onClick={() => handleDelete(p.id, p.product_name)} className="p-3 bg-white/90 backdrop-blur rounded-2xl text-red-600 shadow-xl hover:scale-110 transition-transform">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="p-5">
              <h3 className="font-black text-lg italic uppercase tracking-tighter text-gray-800">{p.product_name}</h3>
              <p className="text-[10px] text-gray-400 font-bold mb-3 truncate italic">{p.complements || "Aucun complément"}</p>
              <div className="flex justify-between items-end">
                <p className="font-black text-xl text-red-600">{p.price} <span className="text-[10px]">CFA</span></p>
                <div className="flex gap-2">
                   {p.video_url && <Video size={14} className="text-green-500" />}
                   <ImageIcon size={14} className="text-blue-500" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODALE DE MODIFICATION */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl my-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-red-600">Mise à jour Plat</h2>
              <button onClick={() => setEditingProduct(null)} className="p-2 bg-gray-100 rounded-full hover:bg-red-100 transition-colors text-gray-400"><X /></button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-2 italic">Titre/Accroche</label>
                    <input name="title" defaultValue={editingProduct.title} className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none ring-red-500 focus:ring-2 border-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-2 italic">Nom du Plat</label>
                    <input name="product_name" defaultValue={editingProduct.product_name} className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none ring-red-500 focus:ring-2 border-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-2 italic">Compléments</label>
                    <input name="complements" defaultValue={editingProduct.complements} className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none ring-red-500 focus:ring-2 border-none" placeholder="Frites, Plantain, Jus..." />
                  </div>
                </div>

                <div className="space-y-4 bg-gray-900 p-6 rounded-[2.5rem] shadow-inner">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 italic">Prix Solo (Base)</label>
                    <input 
                      name="price" type="number" value={soloPrice}
                      onChange={(e) => setSoloPrice(Number(e.target.value))}
                      className="w-full p-4 bg-white/5 rounded-2xl font-black text-xl text-red-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 italic">Nb Pers. Famille</label>
                    <input 
                      name="family_size" type="number" value={familyCount}
                      onChange={(e) => setFamilyCount(Number(e.target.value))}
                      className="w-full p-4 bg-white/5 rounded-2xl font-black text-xl text-white outline-none" 
                    />
                  </div>
                  <div className="pt-2 space-y-2 border-t border-white/10 mt-2">
                    <div className="flex justify-between text-[11px] font-bold italic">
                      <span className="text-gray-400">Auto Duo (x2):</span>
                      <span className="text-red-500">{soloPrice * 2} F</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold italic">
                      <span className="text-gray-400">Auto Famille (-500):</span>
                      <span className="text-green-500">{soloPrice * familyCount - 500} F</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col items-center justify-center p-6 bg-blue-50/50 rounded-3xl border-2 border-dashed border-blue-200 text-blue-600 cursor-pointer hover:bg-blue-100 transition-colors">
                  <ImageIcon size={24} />
                  <span className="text-[10px] font-black mt-2 uppercase tracking-widest">Image</span>
                  <input name="image" type="file" className="hidden" accept="image/*" />
                </label>
                <label className="flex flex-col items-center justify-center p-6 bg-green-50/50 rounded-3xl border-2 border-dashed border-green-200 text-green-600 cursor-pointer hover:bg-green-100 transition-colors">
                  <Video size={24} />
                  <span className="text-[10px] font-black mt-2 uppercase tracking-widest">Vidéo</span>
                  <input name="video" type="file" className="hidden" accept="video/*" />
                </label>
              </div>

              <button type="submit" disabled={loading} className="w-full py-5 bg-red-600 text-white rounded-[2rem] font-black shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 uppercase tracking-widest">
                {loading ? <Loader2 className="animate-spin" /> : <Save />}
                {loading ? "Mise à jour..." : "Enregistrer les modifications"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager;