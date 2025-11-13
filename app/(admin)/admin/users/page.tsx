'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui';
import {
  getAllUsers,
  updateUserRole,
  deleteUser,
} from '@/services/user-service';
import { User, UserRole, DEFAULT_EMPLOYEE_PERMISSIONS, DEFAULT_MANAGER_PERMISSIONS } from '@/types/user';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  TrashIcon,
  UserCircleIcon,
  EnvelopeIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

export default function CustomersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  // Role change state
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleChangeUser, setRoleChangeUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole>(UserRole.CUSTOMER);
  const [isSavingRole, setIsSavingRole] = useState(false);


  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      showToast('Failed to load customers', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

   useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filterUsers = useCallback(async () => {
    let filtered = users;

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        user =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  }, [users, roleFilter, searchQuery]);

    useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  const handleViewUser = async (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleOpenRoleModal = (user: User) => {
    setRoleChangeUser(user);
    setNewRole(user.role);
    setIsRoleModalOpen(true);
  };

  const handleCloseRoleModal = () => {
    setIsRoleModalOpen(false);
    setRoleChangeUser(null);
  };

  const handleRoleChange = async () => {
    if (!roleChangeUser) return;

    try {
      setIsSavingRole(true);

      // Determine permissions based on role
      let permissions = undefined;
      if (newRole === UserRole.EMPLOYEE) {
        permissions = DEFAULT_EMPLOYEE_PERMISSIONS;
      } else if (newRole === UserRole.MANAGER) {
        permissions = DEFAULT_MANAGER_PERMISSIONS;
      }

      await updateUserRole(roleChangeUser.uid, newRole, permissions);
      showToast('User role updated successfully', 'success');
      handleCloseRoleModal();
      loadUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      showToast('Failed to update user role', 'error');
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete "${user.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteUser(user.uid);
      showToast('User deleted successfully', 'success');
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('Failed to delete user', 'error');
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
      case UserRole.ADMIN:
        return 'admin';
      case UserRole.MANAGER:
        return 'manager';
      case UserRole.EMPLOYEE:
        return 'employee';
      default:
        return 'default';
    }
  };

  const formatDate = (timestamp: { toDate?: () => Date } | Date | string | null | undefined) => {
    if (!timestamp) return 'N/A';
    const date = typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp && timestamp.toDate
      ? timestamp.toDate()
      : new Date(timestamp as Date | string);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">Manage user accounts and roles</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as 'all' | UserRole)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Roles</option>
                <option value={UserRole.CUSTOMER}>Customer</option>
                <option value={UserRole.EMPLOYEE}>Employee</option>
                <option value={UserRole.MANAGER}>Manager</option>
                <option value={UserRole.ADMIN}>Admin</option>
                <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Users List */}
      <div className="space-y-3">
        {filteredUsers.length === 0 ? (
          <Card>
            <div className="p-12 text-center text-gray-500">
              {searchQuery || roleFilter !== 'all'
                ? 'No customers found matching your filters'
                : 'No customers yet'}
            </div>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.uid}>
              <div className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* User Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <UserCircleIcon className="h-12 w-12 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{user.name}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <EnvelopeIcon className="h-4 w-4" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 sm:hidden">
                        <Badge variant={getRoleBadgeVariant(user.role)} size="sm">
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Info */}
                  <div className="hidden sm:flex items-center gap-6">
                    <Badge variant={getRoleBadgeVariant(user.role)} size="sm">
                      {user.role}
                    </Badge>

                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      {formatDate(user.createdAt)}
                    </div>
                  </div>

                  {/* Actions - Desktop */}
                  <div className="hidden sm:flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewUser(user)}
                      leftIcon={<EyeIcon className="h-4 w-4" />}
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenRoleModal(user)}
                    >
                      Change Role
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteUser(user)}
                      leftIcon={<TrashIcon className="h-4 w-4" />}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Actions - Mobile */}
                <div className="flex sm:hidden items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewUser(user)}
                    fullWidth
                  >
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenRoleModal(user)}
                    fullWidth
                  >
                    Role
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteUser(user)}
                    fullWidth
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-600">
        Showing {filteredUsers.length} of {users.length} customers
      </div>

      {/* User Detail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Customer Details"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-6">
            {/* User Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <UserCircleIcon className="h-16 w-16 text-gray-400" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedUser.name}</h3>
                  <p className="text-gray-600">{selectedUser.email}</p>
                  <Badge variant={getRoleBadgeVariant(selectedUser.role)} size="sm" className="mt-1">
                    {selectedUser.role}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(selectedUser.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(selectedUser.updatedAt)}</p>
                </div>
              </div>
            </div>

            {/* Addresses */}
            {selectedUser.addresses && selectedUser.addresses.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Saved Addresses</h4>
                <div className="space-y-2">
                  {selectedUser.addresses.map((address) => (
                    <div key={address.id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">{address.name}</p>
                      <p className="text-xs text-gray-600">
                        {address.street}
                        {address.apartment && `, ${address.apartment}`}
                      </p>
                      <p className="text-xs text-gray-600">
                        {address.city}, {address.state} {address.zipCode}
                      </p>
                      {address.isDefault && (
                        <Badge variant="success" size="sm" className="mt-1">
                          Default
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Role Change Modal */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={handleCloseRoleModal}
        title="Change User Role"
        size="sm"
      >
        {roleChangeUser && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">User</p>
              <p className="font-medium text-gray-900">{roleChangeUser.name}</p>
              <p className="text-sm text-gray-600">{roleChangeUser.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value={UserRole.CUSTOMER}>Customer</option>
                <option value={UserRole.EMPLOYEE}>Employee</option>
                <option value={UserRole.MANAGER}>Manager</option>
                <option value={UserRole.ADMIN}>Admin</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleCloseRoleModal}>
                Cancel
              </Button>
              <Button onClick={handleRoleChange} loading={isSavingRole}>
                Update Role
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
