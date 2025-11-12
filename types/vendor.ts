import { Timestamp } from 'firebase/firestore';

export interface Vendor {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo?: string;
  coverImage?: string;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  contact: {
    email: string;
    phone: string;
    website?: string;
  };
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  certifications?: string[]; // ['organic', 'non-gmo', 'fair-trade', etc.]
  story?: string; // Longer description about the vendor
  isActive: boolean;
  isFeatured: boolean; // Show on homepage/marketing pages
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
