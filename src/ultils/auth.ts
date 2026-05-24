// utils/auth.ts
export const getUserPermissions = (): string[] => {
  // ✅ Essayer d'abord user_permissions (format tableau JSON)
  const userPerms = localStorage.getItem('user_permissions');
  if (userPerms) {
    try {
      const parsed = JSON.parse(userPerms);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.error('❌ Erreur parse user_permissions:', e);
    }
  }
  
  // ✅ Fallback : lire depuis kemtchop_session
  const session = localStorage.getItem('kemtchop_session');
  if (session) {
    try {
      const parsed = JSON.parse(session);
      let perms = parsed.permissions;
      
      if (typeof perms === 'string') {
        return perms.split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 0);
      }
      if (Array.isArray(perms)) {
        return perms;
      }
    } catch (e) {
      console.error('❌ Erreur parse kemtchop_session:', e);
    }
  }
  
  return [];
};

export const hasPermission = (required: string): boolean => {
  const permissions = getUserPermissions();
  return permissions.includes(required);
};

export const hasAnyPermission = (required: string[]): boolean => {
  const permissions = getUserPermissions();
  return required.some(perm => permissions.includes(perm));
};

export const hasAllPermissions = (required: string[]): boolean => {
  const permissions = getUserPermissions();
  return required.every(perm => permissions.includes(perm));
};