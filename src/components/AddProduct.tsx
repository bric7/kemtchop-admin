// AddProduct.tsx - Version avec extraction de token universelle
import React, { useState, useEffect, useRef } from 'react';
import { Upload, Film, ImageIcon, Plus, Trash2, CheckCircle2, Users, LayoutGrid, ToggleRight } from 'lucide-react';

// ✅ URL de l'API dynamique (Vite) - avec fallback sécurisé
const getApiBaseUrl = (): string => {
  try {
    // @ts-ignore - Vite injecte import.meta.env au runtime
    const viteUrl = (import.meta as any).env?.VITE_API_URL;
    if (viteUrl && viteUrl.trim()) {
      return viteUrl.replace(/\/$/, ''); // Remove trailing slash
    }
  } catch (e) {
    // Ignore si import.meta.env n'est pas disponible
  }
  // Fallback sécurisé : en prod, mieux vaut échouer que de pointer vers localhost
  return import.meta.env?.MODE === 'development' 
    ? 'http://localhost:8000' 
    : 'https://kemtchop-backend-production.up.railway.app';
};

// On garde les mêmes catégories que sur l'App Mobile pour la synchronisation
const CATEGORIES = ["Grillades", "Plats Locaux", "Boissons", "Accompagnements", "rôti"];

export default function AddProduct() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // --- ÉTATS ---
  const [category, setCategory] = useState("Grillades");
  const [isHero, setIsHero] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  const [productName, setProductName] = useState('');
  const [priceSolo, setPriceSolo] = useState('');
  const [priceDuo, setPriceDuo] = useState(0);
  const [priceFamily, setPriceFamily] = useState(0);
  const [familySize, setFamilySize] = useState('3');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [complements, setComplements] = useState(['Bâton de manioc', 'Manioc vapeur', 'Plantain frit']);
  const [newCompName, setNewCompName] = useState('');

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // ✅ CLEANUP : Libérer l'URL de prévisualisation au démontage ou changement
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // ✅ Calcul automatique des packs (CORRIGÉ : setPriceFamily au lieu de const priceFamily)
  useEffect(() => {
    const solo = Number(priceSolo) || 0;
    const size = Number(familySize) || 0;
    setPriceDuo(solo * 2);
    if (size > 0) {
      const totalFamily = (solo * size) - 500;
      setPriceFamily(totalFamily > 0 ? totalFamily : 0);
    } else {
      setPriceFamily(0); // ✅ CORRECTION CRITIQUE : setter d'état, pas une constante
    }
  }, [priceSolo, familySize]);

  const addComplement = () => {
    if (newCompName.trim()) {
      setComplements([...complements, newCompName.trim()]);
      setNewCompName('');
    }
  };

  const removeComplement = (index: number) => {
    setComplements(complements.filter((_, i) => i !== index));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // ✅ Libérer l'ancienne URL avant d'en créer une nouvelle
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ Validation des champs obligatoires
    if (!productName.trim() || !imageFile || !priceSolo) {
      alert("Erreur : Le nom, le prix solo et l'image sont obligatoires !");
      return;
    }

    setLoading(true);
    const formData = new FormData();

    formData.append('product_name', productName.trim());
    formData.append('title', productName.trim());
    formData.append('category', category);
    
    // ✅ ENVOI DES BOOLÉENS : 1 pour true, 0 pour false (compatible FastAPI)
    formData.append('is_available', isAvailable ? '1' : '0');
    formData.append('is_hero', isHero ? '1' : '0');
    
    formData.append('price_solo', priceSolo);
    formData.append('price_duo', priceDuo.toString());
    formData.append('price_family', priceFamily.toString());
    formData.append('family_size', familySize);
    formData.append('image', imageFile);
    if (videoFile) formData.append('video', videoFile);
    formData.append('complements', complements.join(','));

    try {
      const apiBaseUrl = getApiBaseUrl();
      
      // ✅ RÉCUPÉRATION ET VALIDATION DU TOKEN (VERSION UNIVERSELLE)
      const sessionRaw = localStorage.getItem('kemtchop_session');
      if (!sessionRaw) {
        throw new Error('Session non trouvée. Veuillez vous reconnecter.');
      }

      const session = JSON.parse(sessionRaw);
      console.log("🔍 [AddProduct] Contenu brut de la session récupérée :", session);

      // On teste TOUTES les clés possibles que ton Login a pu enregistrer
      const token = session.access_token || 
                    session.token || 
                    session.accessToken || 
                    session.data?.access_token ||
                    (typeof session === 'string' ? session : ''); // Au cas où le token a été stocké brut

      if (!token || token === 'undefined' || token === 'null') {
        // 🚨 Si on arrive ici, on affiche le contenu de l'objet pour comprendre ce que le login a stocké
        console.error("❌ [AddProduct] Token introuvable. Session stockée :", session);
        alert(`Erreur : Aucun token trouvé dans la session. Contenu stocké : ${JSON.stringify(session)}`);
        throw new Error('Token introuvable. Problème au niveau du stockage du Login.');
      }

      // ✅ Debug log pour troubleshooting
      console.log('🔍 [Upload Debug]', {
        apiBaseUrl,
        tokenPreview: `${token.substring(0, 30)}...`,
        formDataKeys: Array.from(formData.keys()),
        imageFileName: imageFile?.name,
        videoFileName: videoFile?.name,
      });

      const response = await fetch(`${apiBaseUrl}/admin/upload-content`, {
        method: 'POST',
        headers: {
          // ✅ Header d'authentification requis pour les endpoints admin
          'Authorization': `Bearer ${token}`,
          // ⚠️ NE PAS définir Content-Type manuellement pour FormData
          // Le navigateur ajoute automatiquement : multipart/form-data; boundary=...
        },
        body: formData,
      });

      // ✅ Gestion détaillée des réponses
      if (response.ok) {
        const result = await response.json().catch(() => ({}));
        console.log('✅ Upload réussi:', result);
        
        setSuccess(true);
        
        // Reset complet du formulaire
        setProductName('');
        setPriceSolo('');
        setIsHero(false);
        
        // Cleanup image preview
        if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
          setImagePreview(null);
        }
        setImageFile(null);
        setVideoFile(null);
        
        setTimeout(() => setSuccess(false), 3000);
        
      } else {
        // ✅ Gestion détaillée des erreurs HTTP
        let errorDetail = `Erreur serveur: ${response.status}`;
        try {
          const errorData = await response.json();
          errorDetail = errorData.detail || errorData.message || errorData.error || errorDetail;
        } catch (e) {
          // Si la réponse n'est pas du JSON, utiliser le status text
          errorDetail = `${response.status} ${response.statusText}`;
        }
        
        console.error('❌ Erreur upload:', { status: response.status, detail: errorDetail });
        
        // Messages d'erreur contextuels
        if (response.status === 401) {
          alert('Session expirée. Veuillez vous reconnecter.');
        } else if (response.status === 403) {
          alert('Accès refusé. Permissions insuffisantes.');
        } else if (response.status === 413) {
          alert('Fichier trop volumineux. Veuillez choisir une image plus petite (< 5MB).');
        } else if (response.status === 422) {
          alert(`Données invalides : ${errorDetail}`);
        } else {
          alert(`Erreur: ${errorDetail}`);
        }
      }
    } catch (error: any) {
      console.error("❌ Erreur upload:", error);
      
      // Messages d'erreur utilisateur-friendly
      if (error.message?.includes('Failed to fetch') || error.message?.includes('Network')) {
        alert('Impossible de contacter le serveur. Vérifie ta connexion internet.');
      } else if (error.message?.includes('Session') || error.message?.includes('Token')) {
        alert(error.message);
      } else {
        alert("Une erreur inattendue est survenue. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="bg-black p-6 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Nouveau Menu : Configurer KemTchop</h2>
        <span className="bg-red-600 text-white text-[10px] px-3 py-1 rounded-full font-black uppercase italic">Admin Panel v2.1</span>
      </div>

      <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        <div className="space-y-6">
          {/* NOM ET CATÉGORIE */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1">
                <label className="block text-sm font-bold text-gray-700 mb-2">Nom du plat</label>
                <input 
                type="text" 
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Ex: Poulet DG" 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none" 
                />
            </div>
            <div className="col-span-1">
                <label className="block text-sm font-bold text-gray-700 mb-2">Catégorie</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none bg-white font-bold text-sm"
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>
          </div>

          {/* STATUTS : DISPONIBILITÉ ET PRODUIT PHARE */}
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-3">
                  <ToggleRight size={24} className={isAvailable ? "text-green-500" : "text-gray-300"} />
                  <p className="text-sm font-bold text-gray-700">Disponible immédiatement ?</p>
              </div>
              <input 
                  type="checkbox" 
                  checked={isAvailable} 
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="w-5 h-5 accent-green-500 cursor-pointer"
              />
            </div>

            <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isHero ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-center gap-3">
                  <LayoutGrid size={24} className={isHero ? "text-amber-500" : "text-gray-300"} />
                  <div>
                    <p className="text-sm font-bold text-gray-700">Mettre en avant (Hero) ?</p>
                    <p className="text-[10px] text-amber-600 font-medium italic">S'affichera en grand sur l'accueil</p>
                  </div>
              </div>
              <input 
                  type="checkbox" 
                  checked={isHero} 
                  onChange={(e) => setIsHero(e.target.checked)}
                  className="w-5 h-5 accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* SECTION CALCULATEUR */}
          <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <Users size={18} />
              <p className="text-xs font-black uppercase italic">Calculateur de tarifs</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Prix Solo (Base FCFA)</label>
                <input type="number" value={priceSolo} onChange={(e) => setPriceSolo(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-red-100 outline-none text-lg font-bold focus:border-red-500" placeholder="Ex: 2000" />
              </div>
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Pack Duo</label>
                <p className="text-xl font-black text-gray-800">{priceDuo.toLocaleString()} F</p>
              </div>
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Pack Famille</label>
                  <input type="number" value={familySize} onChange={(e) => setFamilySize(e.target.value)} className="w-8 bg-red-50 text-[12px] text-red-600 font-black outline-none rounded text-center" min="1" />
                </div>
                <p className="text-xl font-black text-red-600">{priceFamily.toLocaleString()} F</p>
              </div>
            </div>
          </div>

          {/* COMPLÉMENTS */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Accompagnements</label>
            <div className="flex gap-2 mb-3">
              <input value={newCompName} onChange={(e) => setNewCompName(e.target.value)} type="text" placeholder="Ex: Riz blanc" className="flex-1 px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-black" />
              <button type="button" onClick={addComplement} className="bg-black text-white px-4 rounded-xl hover:bg-gray-800"><Plus size={20} /></button>
            </div>
            <div className="flex flex-wrap gap-2">
              {complements.map((item, index) => (
                <div key={index} className="bg-gray-100 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 border border-gray-200">
                  {item} <button type="button" onClick={() => removeComplement(index)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* MÉDIAS ET SUBMIT */}
          <div className="grid grid-cols-2 gap-4">
            <input type="file" accept="video/*" ref={videoInputRef} onChange={handleVideoChange} className="hidden" />
            <div onClick={() => videoInputRef.current?.click()} className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer ${videoFile ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
              <Film className={videoFile ? "text-green-500 mx-auto" : "mx-auto text-gray-400"} size={32} />
              <p className="text-[10px] font-bold uppercase mt-2">{videoFile ? "Vidéo OK" : "Vidéo Reel"}</p>
            </div>
            <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageChange} className="hidden" />
            <div onClick={() => imageInputRef.current?.click()} className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer ${imageFile ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
              {imagePreview ? <img src={imagePreview} className="h-12 mx-auto object-cover rounded-lg" alt="" /> : <ImageIcon className="mx-auto text-gray-400" size={32} />}
              <p className="text-[10px] font-bold uppercase mt-2">Image Grille</p>
            </div>
          </div>

          <button type="submit" disabled={loading} className={`w-full py-6 rounded-3xl font-black text-white shadow-xl flex items-center justify-center gap-3 transition-all ${loading ? 'bg-gray-400' : 'bg-red-600 active:scale-95'}`}>
            {success ? <><CheckCircle2 size={24} /> PUBLIÉ !</> : <><Upload size={24} /> {loading ? 'PUBLICATION...' : 'METTRE EN LIGNE'}</>}
          </button>
        </div>
      </form>
    </div>
  );
}