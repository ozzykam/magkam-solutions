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
  limit,
  QueryConstraint,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Service, ServiceFilters, CreateServiceData } from '@/types/services';

const SERVICES_COLLECTION = 'services';

/**
 * Create a new service
 */
export const createService = async (
  serviceData: CreateServiceData,
  userId: string
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, SERVICES_COLLECTION), {
      ...serviceData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId,
      averageRating: 0,
      totalReviews: 0,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating service:', error);
    throw error;
  }
};

/**
 * Update an existing service
 */
export const updateService = async (
  serviceId: string,
  updates: Partial<Omit<Service, 'id' | 'createdAt' | 'createdBy'>>
): Promise<void> => {
  try {
    const docRef = doc(db, SERVICES_COLLECTION, serviceId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating service:', error);
    throw error;
  }
};

/**
 * Delete a service
 */
export const deleteService = async (serviceId: string): Promise<void> => {
  try {
    const docRef = doc(db, SERVICES_COLLECTION, serviceId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting service:', error);
    throw error;
  }
};

/**
 * Get all services with optional filters
 * Public-facing: Only returns active services
 */
export const getServices = async (filters?: ServiceFilters): Promise<Service[]> => {
  try {
    const constraints: QueryConstraint[] = [];

    // Only active services (for public)
    constraints.push(where('isActive', '==', true));

    // Filter by category
    if (filters?.categoryId) {
      constraints.push(where('categoryId', '==', filters.categoryId));
    }

    // Filter by tags
    if (filters?.tags && filters.tags.length > 0) {
      constraints.push(where('tags', 'array-contains-any', filters.tags));
    }

    // Filter by featured
    if (filters?.isFeatured) {
      constraints.push(where('isFeatured', '==', true));
    }

    // Filter by pricing type
    if (filters?.pricingType) {
      constraints.push(where('pricingType', '==', filters.pricingType));
    }

    // Filter by on sale
    if (filters?.onSale) {
      constraints.push(where('onSale', '==', true));
    }

    // Order by sortOrder if available, otherwise by creation date
    constraints.push(orderBy('sortOrder', 'asc'));

    const q = query(collection(db, SERVICES_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    let services = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Service[];

    // Client-side price filtering (for basePrice)
    if (filters?.minPrice !== undefined) {
      services = services.filter(s => {
        return s.basePrice !== undefined && s.basePrice >= filters.minPrice!;
      });
    }

    if (filters?.maxPrice !== undefined) {
      services = services.filter(s => {
        return s.basePrice !== undefined && s.basePrice <= filters.maxPrice!;
      });
    }

    // Client-side search filtering
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      services = services.filter(s =>
        s.name.toLowerCase().includes(searchLower) ||
        s.description.toLowerCase().includes(searchLower) ||
        (s.shortDescription && s.shortDescription.toLowerCase().includes(searchLower)) ||
        s.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    return services;
  } catch (error) {
    console.error('Error fetching services:', error);
    throw error;
  }
};

/**
 * Get all services for admin (includes inactive)
 */
export const getAllServicesAdmin = async (): Promise<Service[]> => {
  try {
    const q = query(
      collection(db, SERVICES_COLLECTION),
      orderBy('sortOrder', 'asc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Service[];
  } catch (error) {
    console.error('Error fetching all services:', error);
    throw error;
  }
};

/**
 * Get a single service by ID
 */
export const getServiceById = async (serviceId: string): Promise<Service | null> => {
  try {
    const docRef = doc(db, SERVICES_COLLECTION, serviceId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Service;
  } catch (error) {
    console.error('Error fetching service:', error);
    throw error;
  }
};

/**
 * Get a single service by slug
 */
export const getServiceBySlug = async (slug: string): Promise<Service | null> => {
  try {
    const q = query(
      collection(db, SERVICES_COLLECTION),
      where('slug', '==', slug),
      where('isActive', '==', true),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as Service;
  } catch (error) {
    console.error('Error fetching service by slug:', error);
    throw error;
  }
};

/**
 * Get featured services
 */
export const getFeaturedServices = async (limitCount: number = 6): Promise<Service[]> => {
  try {
    const q = query(
      collection(db, SERVICES_COLLECTION),
      where('isFeatured', '==', true),
      where('isActive', '==', true),
      orderBy('sortOrder', 'asc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Service[];
  } catch (error) {
    console.error('Error fetching featured services:', error);
    throw error;
  }
};

/**
 * Get services on sale
 */
export const getServicesOnSale = async (limitCount?: number): Promise<Service[]> => {
  try {
    const constraints: QueryConstraint[] = [
      where('onSale', '==', true),
      where('isActive', '==', true),
      orderBy('salePercent', 'desc'),
    ];

    if (limitCount) {
      constraints.push(limit(limitCount));
    }

    const q = query(collection(db, SERVICES_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Service[];
  } catch (error) {
    console.error('Error fetching services on sale:', error);
    throw error;
  }
};

/**
 * Get services by category
 */
export const getServicesByCategory = async (categoryId: string): Promise<Service[]> => {
  try {
    const q = query(
      collection(db, SERVICES_COLLECTION),
      where('categoryId', '==', categoryId),
      where('isActive', '==', true),
      orderBy('sortOrder', 'asc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Service[];
  } catch (error) {
    console.error('Error fetching services by category:', error);
    throw error;
  }
};

/**
 * Search services by name or tags
 */
export const searchServices = async (searchQuery: string): Promise<Service[]> => {
  try {
    // Note: Firestore doesn't support full-text search natively
    // For production, consider using Algolia, Elasticsearch, or Firestore's text search extension
    // This is a basic implementation that fetches all services and filters client-side

    const q = query(
      collection(db, SERVICES_COLLECTION),
      where('isActive', '==', true)
    );

    const snapshot = await getDocs(q);
    const searchLower = searchQuery.toLowerCase();

    const services = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Service[];

    // Client-side search
    return services.filter(service =>
      service.name.toLowerCase().includes(searchLower) ||
      service.description.toLowerCase().includes(searchLower) ||
      service.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  } catch (error) {
    console.error('Error searching services:', error);
    throw error;
  }
};