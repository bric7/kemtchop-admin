import React, { useState, useEffect, useRef } from 'react';
import { Upload, Film, ImageIcon, Plus, Trash2, CheckCircle2, Users, LayoutGrid, ToggleRight } from 'lucide-react';

// On garde les mêmes catégories que sur l'App Mobile pour la synchronisation
const CATEGORIES = ["Grillades", "Plats Locaux", "Boissons", "Accompagnements", "rôti"];

export default function AddProduct() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // --- ÉTATS ---
  const [category, setCategory] = useState("Grillades");
  const [isHero, setIsHero] = useState(false); // État pour le produit phare
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

  // Calcul automatique des packs
  useEffect(() => {
    const solo = Number(priceSolo) || 0;
    const size = Number(familySize) || 0;
    setPriceDuo(solo * 2);
    if (size > 0) {
      const totalFamily = (solo * size) - 500;
      setPriceFamily(totalFamily > 0 ? totalFamily : 0);
    } else {
      setPriceFamily(0);
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
    if (!productName || !imageFile || !priceSolo) {
      alert("Erreur : Le nom, le prix solo et l'image sont obligatoires !");
      return;
    }

    setLoading(true);
    const formData = new FormData();

    formData.append('product_name', productName);
    formData.append('title', productName);
    formData.append('category', category);
    formData.append('is_available', isAvailable.toString());
    formData.append('is_hero', isHero.toString()); // Envoi du statut Hero
    formData.append('price_solo', priceSolo);
    formData.append('price_duo', priceDuo.toString());
    formData.append('price_family', priceFamily.toString());
    formData.append('family_size', familySize);
    formData.append('image', imageFile);
    if (videoFile) formData.append('video', videoFile);
    formData.append('complements', complements.join(','));

    try {
      const response = await fetch('http://localhost:8000/admin/upload-content', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setSuccess(true);
        // Reset du formulaire
        setProductName('');
        setPriceSolo('');
        setIsHero(false);
        setImageFile(null);
        setImagePreview(null);
        setVideoFile(null);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert("Erreur serveur.");
      }
    } catch (error) {
      alert("Impossible de contacter le serveur Kemtchop.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="bg-black p-6 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Nouveau Menu : Configurer Kemtchop</h2>
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