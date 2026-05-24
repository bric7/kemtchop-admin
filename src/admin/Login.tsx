import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const SERVER_IP = "127.0.0.1";

  // ✅ Helper pour normaliser les permissions : chaîne CSV → tableau
  const normalizePermissions = (perms: string | string[] | null | undefined): string[] => {
    if (!perms) return [];
    if (Array.isArray(perms)) return perms;
    if (typeof perms === 'string') {
      return perms.split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 0);
    }
    return [];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`http://${SERVER_IP}:8000/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ Le backend retourne 'access_token' ou 'token'
        const jwtToken = data.access_token || data.token;
        
        if (jwtToken) {
          // ✅ Sauvegarder le token
          localStorage.setItem('token', jwtToken);
          
          // ✅ Normaliser les permissions (CSV → tableau)
          const permissions = normalizePermissions(data.permissions);
          
          // ✅ Sauvegarder les permissions DANS LES DEUX ENDROITS (compatibilité)
          // 1. Dans kemtchop_session (format backend)
          const sessionData = {
            ...data,
            permissions: permissions  // ← Toujours un tableau ici
          };
          localStorage.setItem('kemtchop_session', JSON.stringify(sessionData));
          
          // 2. Dans user_permissions (accès facile pour le frontend)
          localStorage.setItem('user_permissions', JSON.stringify(permissions));
          
          // ✅ Sauvegarder les infos utilisateur
          localStorage.setItem('admin_username', data.username || username);
          localStorage.setItem('admin_role', data.role || 'admin');
          
          console.log('✅ [Login] Token sauvegardé:', jwtToken.substring(0, 30) + '...');
          console.log('✅ [Login] Permissions normalisées:', permissions);
        } else {
          console.error('❌ [Login] Aucun token trouvé dans la réponse:', data);
          setError('Token manquant dans la réponse du serveur');
        }
        
        // ✅ Puis appeler le callback parent
        onLogin(data); 
      } else {
        setError(data.detail || "Identifiants incorrects");
      }
    } catch (err) {
      console.error('❌ Erreur login:', err);
      setError("Impossible de contacter le serveur de sécurité");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 border border-gray-100">
        
        {/* LOGO / TITRE */}
        <div className="text-center mb-10">
          <div className="inline-block p-4 bg-black rounded-3xl mb-4">
             <Lock className="text-red-600" size={32} />
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter text-gray-900">
            KEMTCHOP<span className="text-red-600">.</span>ADMIN
          </h1>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-2">
            Accès réservé au personnel
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* USERNAME */}
          <div className="relative">
            <User className="absolute left-4 top-4 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Identifiant"
              className="w-full bg-gray-50 border-2 border-transparent focus:border-red-600 focus:bg-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-bold text-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {/* PASSWORD */}
          <div className="relative">
            <Lock className="absolute left-4 top-4 text-gray-400" size={20} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mot de passe"
              className="w-full bg-gray-50 border-2 border-transparent focus:border-red-600 focus:bg-white rounded-2xl py-4 pl-12 pr-12 outline-none transition-all font-bold text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-4 text-gray-400 hover:text-black"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {error && (
            <p className="text-red-600 text-[10px] font-black uppercase text-center bg-red-50 py-2 rounded-lg">
              ⚠️ {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-gray-200 active:scale-95 disabled:opacity-50"
          >
            {loading ? "Vérification..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;