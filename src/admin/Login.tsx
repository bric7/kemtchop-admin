import React, { useState, FormEvent, ChangeEvent } from 'react';
import { Lock, User, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLogin?: (data: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // ✅ SOLUTION : Utiliser l'URL de l'API via variable d'environnement Vite
  // Fallback vers localhost uniquement en dev local
  const API_BASE = ((import.meta as any).env?.VITE_API_URL) || 'http://localhost:8000';

  const normalizePermissions = (perms: string | string[] | null | undefined): string[] => {
    if (!perms) return [];
    if (Array.isArray(perms)) return perms;
    if (typeof perms === 'string') {
      return perms.split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 0);
    }
    return [];
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // ✅ Utiliser API_BASE au lieu de SERVER_IP hardcoded
      console.log('🔍 [Login] Tentative de connexion à:', `${API_BASE}/auth/login`);
      
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const jwtToken = data.access_token || data.token;
        
        if (jwtToken) {
          localStorage.setItem('token', jwtToken);
          
          const permissions = normalizePermissions(data.permissions);
          
          const sessionData = {
            ...data,
            permissions: permissions
          };
          localStorage.setItem('kemtchop_session', JSON.stringify(sessionData));
          localStorage.setItem('user_permissions', JSON.stringify(permissions));
          localStorage.setItem('admin_username', data.username || username);
          localStorage.setItem('admin_role', data.role || 'admin');
          
          console.log('✅ [Login] Token sauvegardé');
          console.log('✅ [Login] Permissions normalisées:', permissions);
        } else {
          console.error('❌ [Login] Aucun token trouvé dans la réponse:', data);
          setError('Token manquant dans la réponse du serveur');
        }
        
        if (onLogin) {
          onLogin(data);
        }
      } else {
        setError(data.detail || "Identifiants incorrects");
      }
    } catch (err) {
      console.error('❌ Erreur login:', {
        message: err instanceof Error ? err.message : String(err),
        apiBase: API_BASE,
        url: `${API_BASE}/auth/login`
      });
      setError("Impossible de contacter le serveur. Vérifie ta connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 border border-gray-100">
        
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
          <div className="relative">
            <User className="absolute left-4 top-4 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Identifiant"
              className="w-full bg-gray-50 border-2 border-transparent focus:border-red-600 focus:bg-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-bold text-sm"
              value={username}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-4 text-gray-400" size={20} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mot de passe"
              className="w-full bg-gray-50 border-2 border-transparent focus:border-red-600 focus:bg-white rounded-2xl py-4 pl-12 pr-12 outline-none transition-all font-bold text-sm"
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
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