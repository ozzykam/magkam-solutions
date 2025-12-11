'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { changePassword, updateUserEmail } from '@/lib/firebase/auth';
import { db } from '@/lib/firebase/config';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { UserCircleIcon, LockClosedIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  businessName?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export default function ProfilePage() {
  const { firebaseUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Profile data
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
  });

  // Password change
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (firebaseUser) {
      loadProfile();
    }
  }, [firebaseUser]);

  const loadProfile = async () => {
    if (!firebaseUser) return;

    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

      if (userDoc.exists()) {
        const data = userDoc.data();
        setProfile({
          name: data.name || '',
          email: firebaseUser.email || '',
          phone: data.phone || '',
          businessName: data.businessName || '',
          address: data.address || {
            street: '',
            city: '',
            state: '',
            zipCode: '',
          },
        });
      } else {
        // Initialize with basic data from auth
        setProfile({
          name: firebaseUser.displayName || '',
          email: firebaseUser.email || '',
          phone: '',
          businessName: '',
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
          },
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      alert('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firebaseUser) return;

    try {
      setSaving(true);

      // Update Firestore profile
      const userRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userRef, {
        name: profile.name,
        phone: profile.phone || null,
        businessName: profile.businessName || null,
        address: profile.address?.street || profile.address?.city ? profile.address : null,
        updatedAt: new Date(),
      });

      // Update email if changed
      if (profile.email !== firebaseUser.email) {
        await updateUserEmail(profile.email);
      }

      alert('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firebaseUser) return;

    // Validation
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      setChangingPassword(true);

      // Use centralized auth function
      await changePassword(currentPassword, newPassword);

      alert('Password changed successfully!');
      setShowPasswordChange(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      alert(error.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile & Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account information and preferences</p>
      </div>

      {/* Personal Information */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <UserCircleIcon className="w-6 h-6 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
          </div>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                required
              />
              <Input
                label="Email Address"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                required
              />
              <Input
                label="Phone Number"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
              <Input
                label="Business Name (Optional)"
                placeholder="Your Company LLC"
                value={profile.businessName}
                onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
              />
            </div>

            <div className="pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Billing Address</h3>
              <div className="space-y-4">
                <Input
                  label="Street Address"
                  placeholder="123 Main St"
                  value={profile.address?.street || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      address: { ...profile.address!, street: e.target.value },
                    })
                  }
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="City"
                    placeholder="New York"
                    value={profile.address?.city || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        address: { ...profile.address!, city: e.target.value },
                      })
                    }
                  />
                  <Input
                    label="State"
                    placeholder="NY"
                    value={profile.address?.state || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        address: { ...profile.address!, state: e.target.value },
                      })
                    }
                  />
                  <Input
                    label="ZIP Code"
                    placeholder="10001"
                    value={profile.address?.zipCode || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        address: { ...profile.address!, zipCode: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" variant="primary" loading={saving}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </Card>

      {/* Password Change */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <LockClosedIcon className="w-6 h-6 text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-900">Password & Security</h2>
            </div>
            {!showPasswordChange && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowPasswordChange(true)}
              >
                Change Password
              </Button>
            )}
          </div>

          {showPasswordChange ? (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowPasswordChange(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  disabled={changingPassword}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={changingPassword}>
                  Update Password
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-gray-600 text-sm">
              Your password is securely encrypted. Click "Change Password" to update it.
            </p>
          )}
        </div>
      </Card>

      {/* Account Information */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <BuildingOfficeIcon className="w-6 h-6 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Account ID</span>
              <span className="font-medium text-gray-900 font-mono">{firebaseUser?.uid}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Email Verified</span>
              <span className={`font-medium ${firebaseUser?.emailVerified ? 'text-green-600' : 'text-orange-600'}`}>
                {firebaseUser?.emailVerified ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Account Created</span>
              <span className="font-medium text-gray-900">
                {firebaseUser?.metadata.creationTime
                  ? new Date(firebaseUser.metadata.creationTime).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
