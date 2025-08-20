"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole, UserPermissions } from '@/app/types';
import { getUserPermissions } from '@/app/lib/permissions';

interface UserContextType {
  role: UserRole | null;
  permissions: UserPermissions | null;
  userId: string | null;
  userName: string | null;
  isLoading: boolean;
  updateUserInfo: (role: UserRole, userId: string, userName: string) => void;
  clearUserInfo: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateUserInfo = React.useCallback((newRole: UserRole, newUserId: string, newUserName: string) => {
    setRole(newRole);
    setPermissions(getUserPermissions(newRole));
    setUserId(newUserId);
    setUserName(newUserName);
    setIsLoading(false);
  }, []);

  const clearUserInfo = React.useCallback(() => {
    setRole(null);
    setPermissions(null);
    setUserId(null);
    setUserName(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Beim Start nur isLoading auf false setzen
    // Die Auth wird durch AuthGuard und Login-Process gehandhabt
    setIsLoading(false);
  }, []);

  return (
    <UserContext.Provider value={{
      role,
      permissions,
      userId,
      userName,
      isLoading,
      updateUserInfo,
      clearUserInfo
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
