import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { User, UserRole, EmployeePermissions, Address } from '@/types/user';

const USERS_COLLECTION = 'users';

/**
 * Get all users (for admin)
 */
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      uid: doc.id,
    })) as User[];
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }
};

/**
 * Get users by role
 */
export const getUsersByRole = async (role: UserRole): Promise<User[]> => {
  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      where('role', '==', role),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      uid: doc.id,
    })) as User[];
  } catch (error) {
    console.error('Error fetching users by role:', error);
    throw error;
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (uid: string): Promise<User | null> => {
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      uid: docSnap.id,
      ...docSnap.data(),
    } as User;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

/**
 * Update user role (admin only)
 */
export const updateUserRole = async (
  uid: string,
  role: UserRole,
  permissions?: EmployeePermissions
): Promise<void> => {
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);

    const updateData: any = {
      role,
      updatedAt: Timestamp.now(),
    };

    // Add permissions if provided (for employee/manager roles)
    if (permissions) {
      updateData.permissions = permissions;
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

/**
 * Update user permissions (admin only)
 */
export const updateUserPermissions = async (
  uid: string,
  permissions: EmployeePermissions
): Promise<void> => {
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);

    await updateDoc(docRef, {
      permissions,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating user permissions:', error);
    throw error;
  }
};

/**
 * Update user info (admin)
 */
export const updateUser = async (
  uid: string,
  updates: Partial<Omit<User, 'uid' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);

    const cleanedUpdates: any = {
      updatedAt: Timestamp.now(),
    };

    if (updates.name !== undefined) cleanedUpdates.name = updates.name;
    if (updates.email !== undefined) cleanedUpdates.email = updates.email;
    if (updates.phone !== undefined) cleanedUpdates.phone = updates.phone;
    if (updates.avatar !== undefined) cleanedUpdates.avatar = updates.avatar;
    if (updates.role !== undefined) cleanedUpdates.role = updates.role;
    if (updates.permissions !== undefined) cleanedUpdates.permissions = updates.permissions;
    if (updates.addresses !== undefined) cleanedUpdates.addresses = updates.addresses;

    await updateDoc(docRef, cleanedUpdates);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

/**
 * Delete user (admin only)
 * Note: This only deletes the Firestore document
 * Deleting Firebase Auth user requires Firebase Admin SDK
 */
export const deleteUser = async (uid: string): Promise<void> => {
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    await deleteDoc(docRef);
    // TODO: Also delete from Firebase Auth using Admin SDK
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

/**
 * Search users by name or email
 */
export const searchUsers = async (searchQuery: string): Promise<User[]> => {
  try {
    // Firestore doesn't support full-text search natively
    // Fetch all users and filter client-side
    const allUsers = await getAllUsers();
    const searchLower = searchQuery.toLowerCase();

    return allUsers.filter(user =>
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

/**
 * Add a new address to user
 */
export const addUserAddress = async (uid: string, address: Address): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('User not found');
    }

    const user = userSnap.data() as User;
    const addresses = user.addresses || [];

    // If this is the first address or marked as default, make it default
    const newAddress = {
      ...address,
      id: address.id || doc(collection(db, 'temp')).id, // Generate ID if not provided
      isDefault: addresses.length === 0 ? true : (address.isDefault || false),
    };

    // If setting as default, unset other defaults
    if (newAddress.isDefault) {
      addresses.forEach(addr => addr.isDefault = false);
    }

    addresses.push(newAddress);

    await updateDoc(userRef, {
      addresses,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error adding address:', error);
    throw error;
  }
};

/**
 * Update an existing address
 */
export const updateUserAddress = async (uid: string, addressId: string, updates: Partial<Address>): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('User not found');
    }

    const user = userSnap.data() as User;
    const addresses = user.addresses || [];
    const addressIndex = addresses.findIndex(addr => addr.id === addressId);

    if (addressIndex === -1) {
      throw new Error('Address not found');
    }

    // If setting as default, unset other defaults
    if (updates.isDefault) {
      addresses.forEach(addr => addr.isDefault = false);
    }

    addresses[addressIndex] = { ...addresses[addressIndex], ...updates };

    await updateDoc(userRef, {
      addresses,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating address:', error);
    throw error;
  }
};

/**
 * Delete an address
 */
export const deleteUserAddress = async (uid: string, addressId: string): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('User not found');
    }

    const user = userSnap.data() as User;
    const addresses = user.addresses || [];
    const addressToDelete = addresses.find(addr => addr.id === addressId);

    if (!addressToDelete) {
      throw new Error('Address not found');
    }

    // Filter out the address
    let updatedAddresses = addresses.filter(addr => addr.id !== addressId);

    // If we deleted the default address and there are other addresses, make the first one default
    if (addressToDelete.isDefault && updatedAddresses.length > 0) {
      updatedAddresses[0].isDefault = true;
    }

    await updateDoc(userRef, {
      addresses: updatedAddresses,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    throw error;
  }
};

/**
 * Set an address as default
 */
export const setDefaultAddress = async (uid: string, addressId: string): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('User not found');
    }

    const user = userSnap.data() as User;
    const addresses = user.addresses || [];

    // Unset all defaults
    addresses.forEach(addr => addr.isDefault = false);

    // Set the new default
    const addressIndex = addresses.findIndex(addr => addr.id === addressId);
    if (addressIndex === -1) {
      throw new Error('Address not found');
    }

    addresses[addressIndex].isDefault = true;

    await updateDoc(userRef, {
      addresses,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error setting default address:', error);
    throw error;
  }
};
