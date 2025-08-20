"use client";
import { ReactNode } from 'react';
import { useUser } from '@/app/context/UserContext';
import { UserPermissions } from '@/app/types';

interface PermissionWrapperProps {
  children: ReactNode;
  permission?: keyof UserPermissions;
  role?: 'admin' | 'ausrichter' | 'formation';
  fallback?: ReactNode;
}

export default function PermissionWrapper({ 
  children, 
  permission, 
  role, 
  fallback = null 
}: PermissionWrapperProps) {
  const { permissions, role: userRole, isLoading } = useUser();

  if (isLoading) {
    return null;
  }

  // Check specific role if provided
  if (role && userRole !== role) {
    return <>{fallback}</>;
  }

  // Check permission if provided
  if (permission && permissions && !permissions[permission]) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
