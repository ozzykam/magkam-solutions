import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Vendor } from '@/types/vendor';

const VENDORS_COLLECTION = 'vendors';

/**
 * Get a vendor by ID
 */
export const getVendorById = async (vendorId: string): Promise<Vendor | null> => {
  try {
    const docRef = doc(db, VENDORS_COLLECTION, vendorId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Vendor;
  } catch (error) {
    console.error('Error fetching vendor:', error);
    throw error;
  }
};

/**
 * Get a vendor by slug
 */
export const getVendorBySlug = async (slug: string): Promise<Vendor | null> => {
  try {
    const q = query(
      collection(db, VENDORS_COLLECTION),
      where('slug', '==', slug),
      where('isActive', '==', true)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as Vendor;
  } catch (error) {
    console.error('Error fetching vendor by slug:', error);
    throw error;
  }
};

/**
 * Get all active vendors
 */
export const getVendors = async (): Promise<Vendor[]> => {
  try {
    const q = query(
      collection(db, VENDORS_COLLECTION),
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Vendor[];
  } catch (error) {
    console.error('Error fetching vendors:', error);
    throw error;
  }
};

/**
 * Get all vendors (including inactive) - for admin
 */
export const getAllVendors = async (): Promise<Vendor[]> => {
  try {
    const q = query(
      collection(db, VENDORS_COLLECTION),
      orderBy('name', 'asc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Vendor[];
  } catch (error) {
    console.error('Error fetching all vendors:', error);
    throw error;
  }
};

/**
 * Get vendors by location (city)
 */
export const getVendorsByCity = async (city: string): Promise<Vendor[]> => {
  try {
    const q = query(
      collection(db, VENDORS_COLLECTION),
      where('location.city', '==', city),
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Vendor[];
  } catch (error) {
    console.error('Error fetching vendors by city:', error);
    throw error;
  }
};

/**
 * Get vendors with specific certification
 */
export const getVendorsByCertification = async (certification: string): Promise<Vendor[]> => {
  try {
    const q = query(
      collection(db, VENDORS_COLLECTION),
      where('certifications', 'array-contains', certification),
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Vendor[];
  } catch (error) {
    console.error('Error fetching vendors by certification:', error);
    throw error;
  }
};

/**
 * Search vendors by name
 */
export const searchVendors = async (searchQuery: string): Promise<Vendor[]> => {
  try {
    // Firestore doesn't support full-text search natively
    // This fetches all vendors and filters client-side
    // For production, consider using Algolia or similar

    const q = query(
      collection(db, VENDORS_COLLECTION),
      where('isActive', '==', true)
    );

    const snapshot = await getDocs(q);
    const searchLower = searchQuery.toLowerCase();

    const vendors = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Vendor[];

    return vendors.filter(vendor =>
      vendor.name.toLowerCase().includes(searchLower) ||
      vendor.description.toLowerCase().includes(searchLower) ||
      vendor.location.city.toLowerCase().includes(searchLower)
    );
  } catch (error) {
    console.error('Error searching vendors:', error);
    throw error;
  }
};

/**
 * Create a new vendor
 */
export const createVendor = async (
  vendorData: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Vendor> => {
  try {
    // Clean the data to remove undefined values
    const cleanedData: any = {
      name: vendorData.name,
      slug: vendorData.slug,
      description: vendorData.description,
      location: {
        address: vendorData.location.address,
        city: vendorData.location.city,
        state: vendorData.location.state,
        zipCode: vendorData.location.zipCode,
      },
      contact: {
        email: vendorData.contact.email,
        phone: vendorData.contact.phone,
      },
      isActive: vendorData.isActive,
      isFeatured: vendorData.isFeatured,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Add optional fields if they exist
    if (vendorData.logo) cleanedData.logo = vendorData.logo;
    if (vendorData.coverImage) cleanedData.coverImage = vendorData.coverImage;
    if (vendorData.location.coordinates) cleanedData.location.coordinates = vendorData.location.coordinates;
    if (vendorData.contact.website) cleanedData.contact.website = vendorData.contact.website;
    if (vendorData.socialMedia) cleanedData.socialMedia = vendorData.socialMedia;
    if (vendorData.certifications && vendorData.certifications.length > 0) {
      cleanedData.certifications = vendorData.certifications;
    }
    if (vendorData.story) cleanedData.story = vendorData.story;

    const docRef = await addDoc(collection(db, VENDORS_COLLECTION), cleanedData);

    return {
      id: docRef.id,
      ...cleanedData,
    } as Vendor;
  } catch (error) {
    console.error('Error creating vendor:', error);
    throw error;
  }
};

/**
 * Update a vendor
 */
export const updateVendor = async (
  vendorId: string,
  updates: Partial<Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    const docRef = doc(db, VENDORS_COLLECTION, vendorId);

    // Clean the updates
    const cleanedUpdates: any = {
      updatedAt: Timestamp.now(),
    };

    if (updates.name !== undefined) cleanedUpdates.name = updates.name;
    if (updates.slug !== undefined) cleanedUpdates.slug = updates.slug;
    if (updates.description !== undefined) cleanedUpdates.description = updates.description;
    if (updates.logo !== undefined) cleanedUpdates.logo = updates.logo;
    if (updates.coverImage !== undefined) cleanedUpdates.coverImage = updates.coverImage;
    if (updates.location !== undefined) cleanedUpdates.location = updates.location;
    if (updates.contact !== undefined) cleanedUpdates.contact = updates.contact;
    if (updates.socialMedia !== undefined) cleanedUpdates.socialMedia = updates.socialMedia;
    if (updates.certifications !== undefined) cleanedUpdates.certifications = updates.certifications;
    if (updates.story !== undefined) cleanedUpdates.story = updates.story;
    if (updates.isActive !== undefined) cleanedUpdates.isActive = updates.isActive;
    if (updates.isFeatured !== undefined) cleanedUpdates.isFeatured = updates.isFeatured;

    await updateDoc(docRef, cleanedUpdates);
  } catch (error) {
    console.error('Error updating vendor:', error);
    throw error;
  }
};

/**
 * Delete a vendor
 */
export const deleteVendor = async (vendorId: string): Promise<void> => {
  try {
    const docRef = doc(db, VENDORS_COLLECTION, vendorId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting vendor:', error);
    throw error;
  }
};
