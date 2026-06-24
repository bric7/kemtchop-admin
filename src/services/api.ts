// src/services/api.ts - Client API centralisé pour TOUT le frontend KemTchop Admin
// ✅ Standardisé : UNE seule clé de session, gestion d'erreurs, support FormData

// ✅ Récupère l'URL de base depuis Vite (injectée au build)
// Fallback conditionnel : localhost UNIQUEMENT en dev
const getApiBase = (): string => {
  try {
    // @ts-ignore - Vite injecte import.meta.env au runtime
    const viteUrl = (import.meta as any).env?.VITE_API_URL;
    if (viteUrl) return viteUrl.replace(/\/$/, ''); // Remove trailing slash
  } catch (e) {
    // Ignore si import.meta.env n'est pas disponible
  }
  // ⚠️ En production, mieux vaut échouer que de pointer vers localhost
  return import.meta.env?.MODE === 'development' 
    ? 'http://localhost:8000' 
    : 'https://kemtchop-backend-production.up.railway.app';
};

// ✅ CLÉ UNIQUE pour toute la session (plus de dispersion)
const SESSION_KEY = 'kemtchop_session';

// ✅ Helper pour récupérer le token depuis la session centralisée
const getAuthToken = (): string | null => {
  try {
    const sessionRaw = localStorage.getItem(SESSION_KEY);
    if (!sessionRaw) return null;
    
    const session = JSON.parse(sessionRaw);
    // Supporte les formats: {token}, {access_token}, {jwt}
    return session.token || session.access_token || session.jwt || null;
  } catch (e) {
    console.error('❌ Erreur lecture session:', e);
    return null;
  }
};

// ✅ Helper pour vérifier les permissions depuis la session
export const hasPermission = (required: string): boolean => {
  try {
    const sessionRaw = localStorage.getItem(SESSION_KEY);
    if (!sessionRaw) return false;
    
    const session = JSON.parse(sessionRaw);
    const perms = session.permissions || [];
    
    // Supporte string ("orders,users") ou array (["orders", "users"])
    if (typeof perms === 'string') {
      return perms.split(',').map((p: string) => p.trim()).includes(required);
    }
    if (Array.isArray(perms)) {
      return perms.includes(required);
    }
    return false;
  } catch (e) {
    console.error('❌ Erreur vérification permission:', e);
    return false;
  }
};

// ✅ Helper pour vérifier si l'utilisateur est authentifié
export const isAuthenticated = (): boolean => !!getAuthToken();

// ✅ Fonction centralisée pour les requêtes API
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
  requireAuth: boolean = true
): Promise<any> => {
  const apiBase = getApiBase();
  const url = `${apiBase}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  // Préparation des headers
  const headers: Record<string, string> = { ...options.headers } as Record<string, string>;
  
  // ✅ N'ajoute Content-Type que si ce n'est pas un FormData (pour les uploads)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  // ✅ Ajoute le token d'authentification si requis
  if (requireAuth) {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentification requise. Veuillez vous reconnecter.');
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      // ✅ Gestion du cache pour éviter les réponses obsolètes
      cache: 'no-store',
    });

    // ✅ Gestion des erreurs HTTP
    if (!response.ok) {
      let errorDetail = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorData.message || errorDetail;
      } catch (e) {
        // Si la réponse n'est pas du JSON, utiliser le status text
        errorDetail = `${response.status} ${response.statusText}`;
      }
      throw new Error(errorDetail);
    }

    // ✅ Gestion de la réponse : JSON ou texte selon le content-type
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await response.json();
    }
    return await response.text();
    
  } catch (error: any) {
    // ✅ Messages d'erreur utilisateur-friendly pour les erreurs réseau
    if (error.message?.includes('Failed to fetch') || error.message?.includes('Network')) {
      throw new Error('Impossible de contacter le serveur. Vérifie ta connexion internet.');
    }
    throw error;
  }
};

// ✅ Helpers pour les méthodes courantes (avec requireAuth par défaut)
export const api = {
  // GET
  get: (endpoint: string, requireAuth: boolean = true) => 
    apiRequest(endpoint, { method: 'GET' }, requireAuth),
  
  // POST (supporte JSON et FormData)
  post: (endpoint: string, body: any, requireAuth: boolean = true) => 
    apiRequest(endpoint, { method: 'POST', body }, requireAuth),
  
  // PUT
  put: (endpoint: string, body: any, requireAuth: boolean = true) => 
    apiRequest(endpoint, { method: 'PUT', body }, requireAuth),
  
  // PATCH
  patch: (endpoint: string, body: any, requireAuth: boolean = true) => 
    apiRequest(endpoint, { method: 'PATCH', body }, requireAuth),
  
  // DELETE
  delete: (endpoint: string, requireAuth: boolean = true) => 
    apiRequest(endpoint, { method: 'DELETE' }, requireAuth),
  
  // Upload de fichier (FormData, toujours authentifié)
  upload: (endpoint: string, formData: FormData) => 
    apiRequest(endpoint, { method: 'POST', body: formData }, true),
};

// ✅ Fonction de logout centralisée (à appeler partout pour déconnecter)
export const logout = (): void => {
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    // Nettoyer les anciennes clés obsolètes
    ['token', 'admin_token', 'user_permissions', 'admin_username', 'admin_role'].forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    console.log('🔓 [Logout] Session nettoyée');
  } catch (e) {
    console.error('❌ [Logout] Erreur:', e);
  }
};

// ✅ Exports utilitaires pour le debug et les checks
export const getApiBaseUrl = getApiBase;
export const isProduction = () => getApiBase() !== 'http://localhost:8000';
export const getSessionKey = () => SESSION_KEY;