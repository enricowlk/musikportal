import { UserRole, UserPermissions } from '@/app/types';

export function getUserPermissions(role: UserRole): UserPermissions {
  switch (role) {
    case 'admin':
      return {
        canUpload: true,
        canViewPlaylists: true,
        canCreatePlaylists: true,
        canDeletePlaylists: true,
        canViewTurniere: true,
        canCreateTurniere: true,
        canViewAllTurniere: true,
        canAccessDashboard: true,
        canManageTokens: true,
      };
    
    case 'ausrichter':
      return {
        canUpload: true,
        canViewPlaylists: true,
        canCreatePlaylists: true,
        canDeletePlaylists: true,
        canViewTurniere: true,
        canCreateTurniere: true,
        canViewAllTurniere: false, // Sehen nur ihre eigenen Veranstaltungen
        canAccessDashboard: true,
        canManageTokens: false,
      };
    
    case 'formation':
      return {
        canUpload: true,
        canViewPlaylists: false,
        canCreatePlaylists: false,
        canDeletePlaylists: false,
        canViewTurniere: false,
        canCreateTurniere: false,
        canViewAllTurniere: false,
        canAccessDashboard: false, // Nur Upload-Seite
        canManageTokens: false,
      };
    
    default:
      return {
        canUpload: false,
        canViewPlaylists: false,
        canCreatePlaylists: false,
        canDeletePlaylists: false,
        canViewTurniere: false,
        canCreateTurniere: false,
        canViewAllTurniere: false,
        canAccessDashboard: false,
        canManageTokens: false,
      };
  }
}

export function hasPermission(role: UserRole, permission: keyof UserPermissions): boolean {
  const permissions = getUserPermissions(role);
  return permissions[permission];
}
