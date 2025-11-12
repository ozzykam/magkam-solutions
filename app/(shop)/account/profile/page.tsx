'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Image from 'next/image';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui';
import SingleImageUploader from '@/components/admin/SingleImageUploader';
import { getUserById, updateUser } from '@/services/user-service';
import { changePassword } from '@/lib/firebase/auth';
import { User, UserRole } from '@/types/user';
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const { user: authUser, isAuthenticated, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: '',
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const loadUserData = useCallback(async () => {
    if (!authUser?.uid) return;

    try {
      setIsLoading(true);
      const userData = await getUserById(authUser.uid);

      if (userData) {
        setUser(userData);
        setFormData({
          name: userData.name,
          email: userData.email,
          phone: (userData).phone || '',
          avatar: (userData).avatar || '',
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      showToast('Failed to load profile', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [authUser, showToast]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleSave = async () => {
    if (!authUser?.uid) return;

    try {
      setIsSaving(true);

      const updates: {
        name: string;
        email: string;
        phone?: string;
        avatar?: string;
      } = {
        name: formData.name.trim(),
        email: formData.email.trim(),
      };

      if (formData.phone) updates.phone = formData.phone.trim();
      if (formData.avatar) updates.avatar = formData.avatar;

      await updateUser(authUser.uid, updates);
      showToast('Profile updated successfully', 'success');
      setIsEditing(false);
      loadUserData();
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'error' as const;
      case UserRole.ADMIN:
        return 'warning' as const;
      case UserRole.MANAGER:
        return 'info' as const;
      case UserRole.EMPLOYEE:
        return 'default' as const;
      case UserRole.CUSTOMER:
        return 'success' as const;
      default:
        return 'default' as const;
    }
  };

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'Super Admin';
      case UserRole.ADMIN:
        return 'Admin';
      case UserRole.MANAGER:
        return 'Manager';
      case UserRole.EMPLOYEE:
        return 'Employee';
      case UserRole.CUSTOMER:
        return 'Customer';
      default:
        return 'Guest';
    }
  };

  const validatePasswordForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!passwordFormData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!passwordFormData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordFormData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }

    if (!passwordFormData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (passwordFormData.currentPassword === passwordFormData.newPassword) {
      errors.newPassword = 'New password must be different from current password';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = async () => {
    if (!validatePasswordForm()) return;

    try {
      setIsSaving(true);
      await changePassword(passwordFormData.currentPassword, passwordFormData.newPassword);
      showToast('Password changed successfully', 'success');
      setIsChangingPassword(false);
      setPasswordFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordErrors({});
    } catch (error) {
      console.error('Error changing password:', error);
      showToast('Failed to change password', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">User not found</p>
      </div>
    );
  }

  const isStaff = [UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-1">Manage your personal information</p>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Profile Information */}
      <Card>
        <div className="p-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {isEditing ? (
                <SingleImageUploader
                  image={formData.avatar}
                  onChange={(imageUrl) => setFormData({ ...formData, avatar: imageUrl })}
                  folder="avatars"
                  label="Profile Picture"
                />
              ) : (
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                  {formData.avatar ? (
                    <Image
                      width={96}
                      height={96}
                      src={formData.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UserCircleIcon className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                <Badge variant={getRoleBadgeVariant(user.role)}>
                  {getRoleDisplayName(user.role)}
                </Badge>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <Input
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />

                  <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                  />

                  <Input
                    label="Phone (optional)"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />

                  <div className="flex gap-3 pt-4">
                    <Button onClick={handleSave} loading={isSaving}>
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          name: user.name,
                          email: user.email,
                          phone: (user).phone || '',
                          avatar: (user).avatar || '',
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                    <span>{user.email}</span>
                  </div>
                  {formData.phone && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <PhoneIcon className="w-5 h-5 text-gray-400" />
                      <span>{formData.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <span>Member since {user.createdAt.toDate().toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Role-specific sections */}

      {/* Staff Permissions */}
      {isStaff && user.permissions && (
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheckIcon className="w-6 h-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Permissions</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(user.permissions).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${value ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm text-gray-700">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Change Password */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <LockClosedIcon className="w-6 h-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
            </div>
            {!isChangingPassword && (
              <Button variant="outline" onClick={() => setIsChangingPassword(true)}>
                Change Password
              </Button>
            )}
          </div>

          {isChangingPassword ? (
            <div className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                value={passwordFormData.currentPassword}
                onChange={(e) => setPasswordFormData({ ...passwordFormData, currentPassword: e.target.value })}
                error={passwordErrors.currentPassword}
                placeholder="Enter your current password"
              />

              <Input
                label="New Password"
                type="password"
                value={passwordFormData.newPassword}
                onChange={(e) => setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })}
                error={passwordErrors.newPassword}
                placeholder="Enter new password (min. 6 characters)"
                helperText="Password must be at least 6 characters"
              />

              <Input
                label="Confirm New Password"
                type="password"
                value={passwordFormData.confirmPassword}
                onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })}
                error={passwordErrors.confirmPassword}
                placeholder="Confirm your new password"
              />

              <div className="flex gap-3 pt-2">
                <Button onClick={handlePasswordChange} loading={isSaving}>
                  Update Password
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordFormData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                    setPasswordErrors({});
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-gray-600 text-sm">
              Keep your account secure by regularly updating your password.
            </p>
          )}
        </div>
      </Card>

      {/* Quick Access Links */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Cog6ToothIcon className="w-6 h-6 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Quick Access</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={() => router.push('/account/orders')}
              leftIcon={<ClipboardDocumentListIcon className="w-5 h-5" />}
            >
              My Orders
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={() => router.push('/account/addresses')}
              leftIcon={<MapPinIcon className="w-5 h-5" />}
            >
              Saved Addresses
            </Button>
            {isStaff && (
              <Button
                variant="outline"
                fullWidth
                onClick={() => router.push('/admin')}
                leftIcon={<ShieldCheckIcon className="w-5 h-5" />}
              >
                Admin Dashboard
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
