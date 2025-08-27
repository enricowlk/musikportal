import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { UserRole, TokenData } from '@/app/types';
import { hasPermission } from '@/app/lib/permissions';

// Erweiterte User-Daten für ESV-Integration
export interface CurrentUser {
  id: string;
  name: string;
  role: UserRole;
  token: string;
  esvId?: string;
  vereinId?: string;
  active: boolean;
}

export async function checkPermission(
  request: NextRequest, 
  permission: keyof import('@/app/types').UserPermissions
): Promise<{ 
  hasAccess: boolean; 
  user?: { id: string; name: string; role: UserRole } 
}> {
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    return { hasAccess: false };
  }
  
  try {
    const tokensData = await fs.readFile(process.cwd() + "/data/tokens.json", "utf-8");
    const tokens: TokenData[] = JSON.parse(tokensData);
    
    const validToken = tokens.find(t => t.token === token && t.active);
    
    if (!validToken) {
      return { hasAccess: false };
    }
    
    const hasAccess = hasPermission(validToken.role, permission);
    
    return {
      hasAccess,
      user: {
        id: validToken.id,
        name: validToken.name,
        role: validToken.role
      }
    };
  } catch {
    return { hasAccess: false };
  }
}

export async function getCurrentUser(request: NextRequest): Promise<CurrentUser | null> {
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    return null;
  }
  
  try {
    const tokensData = await fs.readFile(process.cwd() + "/data/tokens.json", "utf-8");
    const tokens: TokenData[] = JSON.parse(tokensData);
    
    const validToken = tokens.find(t => t.token === token && t.active);
    
    if (!validToken) {
      return null;
    }
    
    return {
      id: validToken.id,
      name: validToken.name,
      role: validToken.role,
      token: validToken.token,
      esvId: validToken.esvId,
      vereinId: validToken.vereinId,
      active: validToken.active
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export function requirePermission(permission: keyof import('@/app/types').UserPermissions) {
  return async function middleware(request: NextRequest) {
    const { hasAccess } = await checkPermission(request, permission);
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Keine Berechtigung für diese Aktion' },
        { status: 403 }
      );
    }
    
    return NextResponse.next();
  };
}
