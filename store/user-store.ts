import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '@/types';

interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
  clearUser: () => void;
  isAdmin: () => boolean;
  isManager: () => boolean;
  isEmployee: () => boolean;
  isCustomer: () => boolean;
  isSuperAdmin: () => boolean;
  hasPermission: (permission: keyof User['permissions']) => boolean;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,

      setUser: (user) => set({ user }),

      clearUser: () => set({ user: null }),

      isAdmin: () => {
        const { user } = get();
        return user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;
      },

      isSuperAdmin: () => {
        const { user } = get();
        return user?.role === UserRole.SUPER_ADMIN;
      },

      isManager: () => {
        const { user } = get();
        return (
          user?.role === UserRole.MANAGER ||
          user?.role === UserRole.ADMIN ||
          user?.role === UserRole.SUPER_ADMIN
        );
      },

      isEmployee: () => {
        const { user } = get();
        return (
          user?.role === UserRole.EMPLOYEE ||
          user?.role === UserRole.MANAGER ||
          user?.role === UserRole.ADMIN ||
          user?.role === UserRole.SUPER_ADMIN
        );
      },

      isCustomer: () => {
        const { user } = get();
        return user?.role === UserRole.CUSTOMER;
      },

      hasPermission: (permission) => {
        const { user } = get();
        if (!user) return false;

        // Admins and Super Admins have all permissions
        if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
          return true;
        }

        // Check specific permission for employees/managers
        return user.permissions?.[permission] ?? false;
      },
    }),
    {
      name: 'user-storage',
      // Only persist basic user info, not sensitive data
      partialize: (state) => ({ user: state.user }),
    }
  )
);
