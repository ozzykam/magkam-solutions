import { Timestamp } from 'firebase/firestore';

export enum UserRole {
  GUEST = 'guest',
  CUSTOMER = 'customer',
  EMPLOYEE = 'employee',
  MANAGER = 'manager',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export interface EmployeePermissions {
  canViewOrders: boolean;
  canUpdateOrders: boolean;
  canManageProducts: boolean;
  canManageInventory: boolean;
  canProcessRefunds: boolean;
  canViewAnalytics: boolean;
  canManageEmployees: boolean; // Manager-level permission
}

export interface Address {
  id: string;
  name: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  isDefault?: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface User {
  uid: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  permissions?: EmployeePermissions; // Only for EMPLOYEE and MANAGER roles
  addresses: Address[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  permissions?: EmployeePermissions;
}

// Helper function to check if user is super admin
export const isSuperAdmin = (email: string | null): boolean => {
  const superAdminEmails = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS?.split(',') || [];
  return email ? superAdminEmails.includes(email.toLowerCase().trim()) : false;
};

// Default permissions for different roles
export const DEFAULT_EMPLOYEE_PERMISSIONS: EmployeePermissions = {
  canViewOrders: true,
  canUpdateOrders: true,
  canManageProducts: false,
  canManageInventory: false,
  canProcessRefunds: false,
  canViewAnalytics: false,
  canManageEmployees: false,
};

export const DEFAULT_MANAGER_PERMISSIONS: EmployeePermissions = {
  canViewOrders: true,
  canUpdateOrders: true,
  canManageProducts: true,
  canManageInventory: true,
  canProcessRefunds: true,
  canViewAnalytics: true,
  canManageEmployees: false, // Can be toggled by admin
};

export const ADMIN_PERMISSIONS: EmployeePermissions = {
  canViewOrders: true,
  canUpdateOrders: true,
  canManageProducts: true,
  canManageInventory: true,
  canProcessRefunds: true,
  canViewAnalytics: true,
  canManageEmployees: true,
};
