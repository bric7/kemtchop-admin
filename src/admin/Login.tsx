// Login.tsx - Version sécurisée et corrigée
import React, { useState, FormEvent, ChangeEvent } from 'react';
import { Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin?: (sessionData: any) => void;
}

// ✅ CLÉ UNIQUE pour toute la session (plus de dispersion)
const SESSION_KEY = 'kemtchop_session';

// ✅ Helper pour récupérer l'URL API (centralisé)
const getApiBaseUrl = (): string => {
  try {
    // @ts-ignore - Vite injecte import.meta.env au runtime
    const viteUrl = (import.meta as any).env?.VITE_API_URL;
    if (viteUrl) return viteUrl.replace(/\/$/, '');
  } catch (e) {
    // Ignore si import.meta.env n'est pas disponible
  }
  // Fallback sécurisé : en prod, mieux vaut échouer que de pointer vers localhost
  return import.meta.env?.MODE === 'development' 
    ? 'http://localhost:8000' 
    : 'https://kemtchop-backend-production.up.railway.app';
};

// ✅ Helper pour nettoyer TOUTES les anciennes clés de session
const cleanupLegacyStorage = (): void => {
  const legacyKeys = ['token', 'admin_token', 'user_permissions', 'admin_username', 'admin_role'];
  legacyKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch (e) {
      console.warn(`⚠️ Impossible de supprimer ${key}:`, e);
    }
  });
};

// ✅ Helper pour sauvegarder la session de manière centralisée
const saveSession = (sessionData: any): void => {
  // Nettoyer d'abord les anciennes clés
  cleanupLegacyStorage();
  
  // Sauvegarder dans UNE seule clé
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  
  // Optionnel : aussi dans sessionStorage pour plus de sécurité (disparaît au fermeture onglet)
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
};

// ✅ Helper pour valider strictement un token JWT
const isValidToken = (token: any): boolean => {
  if (!token || typeof token !== 'string') return false;
  // Un JWT valide a au moins 3 parties séparées par des points et une longueur minimale
  const parts = token.split('.');
  return parts.length === 3 && token.length > 50;
};

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // ✅ Validation basique des inputs
    if (!username.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs');
      setLoading(false);
      return;
    }

    try {
      const apiBase = getApiBaseUrl();
      const loginEndpoint = '/admin/login'; // ✅ Endpoint correct pour l'admin
      
      console.log('🔍 [Login] Connexion à:', `${apiBase}${loginEndpoint}`);
      
      const response = await fetch(`${apiBase}${loginEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      // ✅ Gestion des erreurs HTTP
      if (!response.ok) {
        let errorDetail = 'Identifiants incorrects';
        try {
          const errorData = await response.json();
          errorDetail = errorData.detail || errorData.message || errorDetail;
        } catch (e) {
          // Si la réponse n'est pas du JSON, utiliser le status
          errorDetail = `Erreur ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorDetail);
      }

      const data = await response.json();

      // ✅ VALIDATION CRITIQUE : Le token DOIT être présent et valide
      const jwtToken = data.access_token || data.token;
      
      if (!isValidToken(jwtToken)) {
        console.error('❌ [Login] Token invalide reçu:', {
          hasToken: !!jwtToken,
          tokenType: typeof jwtToken,
          tokenLength: jwtToken?.length,
          fullResponse: data
        });
        throw new Error('Token d\'authentification invalide. Veuillez réessayer ou contacter le support.');
      }

      // ✅ Normalisation des permissions (support string ou array)
      const normalizePermissions = (perms: any): string[] => {
        if (!perms) return [];
        if (Array.isArray(perms)) return perms.filter((p: any) => typeof p === 'string');
        if (typeof perms === 'string') {
          return perms.split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 0);
        }
        return [];
      };

      const permissions = normalizePermissions(data.permissions);

      // ✅ Construction de la session CENTRALISÉE
      const sessionData = {
        token: jwtToken,
        user_phone: data.phone || username, // Fallback si phone non présent
        user_name: data.user_name || data.username || username,
        role: data.role || 'admin',
        permissions: permissions,
        is_affiliate: data.is_affiliate || false,
        affiliate_code: data.affiliate_code || null,
        logged_at: new Date().toISOString(),
        // Conserver tout autre champ utile retourné par l'API
        ...Object.fromEntries(
          Object.entries(data).filter(([key]) => 
            !['access_token', 'token', 'permissions'].includes(key)
          )
        ),
      };

      // ✅ Sauvegarde centralisée dans UNE seule clé
      saveSession(sessionData);

      console.log('✅ [Login] Session sauvegardée:', {
        user: sessionData.user_name,
        role: sessionData.role,
        permissionsCount: permissions.length,
        tokenPreview: `${jwtToken.substring(0, 20)}...`
      });

      // ✅ Callback optionnel pour le parent
      if (onLogin) {
        onLogin(sessionData);
      }

    } catch (err: any) {
      console.error('❌ [Login] Échec connexion:', {
        message: err.message,
        username,
        apiBase: getApiBaseUrl()
      });
      
      // Messages d'erreur utilisateur-friendly
      const userMessage = err.message?.includes('Network') || err.message?.includes('Failed to fetch')
        ? 'Impossible de contacter le serveur. Vérifie ta connexion internet.'
        : err.message || 'Une erreur inattendue est survenue';
      
      setError(userMessage);
      
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fonction de logout centralisée (à exporter si besoin ailleurs)
  const handleLogout = (): void => {
    try {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      cleanupLegacyStorage();
      console.log('🔓 [Logout] Session nettoyée');
    } catch (e) {
      console.error('❌ [Logout] Erreur:', e);
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
              disabled={loading}
              autoComplete="username"
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
              disabled={loading}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-4 text-gray-400 hover:text-black disabled:opacity-50"
              disabled={loading}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="text-red-600 flex-shrink-0" size={16} />
              <p className="text-red-700 text-[11px] font-bold leading-tight">
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-gray-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Connexion...
              </>
            ) : (
              "Se connecter"
            )}
          </button>
        </form>

        {/* Footer avec lien de secours */}
        <div className="mt-8 text-center">
          <p className="text-[10px] text-gray-400">
            Problème d'accès ?{' '}
            <a 
              href="https://wa.me/237670040475?text=Bonjour,%20j'ai%20un%20problème%20pour%20accéder%20au%20panel%20admin%20KemTchop"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-600 font-bold hover:underline"
            >
              Contacter le support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;