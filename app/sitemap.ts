import { MetadataRoute } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { StoreSettings } from '@/types/business-info';
import { getProducts } from '@/services/product-service';
import { getTopLevelCategories } from '@/services/category-service';
import { getVendors } from '@/services/vendor-service';
import { getContentPosts } from '@/services/content-service';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yourstore.com';

  // Fetch store settings for content settings
  const storeSettingsDoc = await getDoc(doc(db, 'storeSettings', 'main'));
  const storeSettings = storeSettingsDoc.data() as StoreSettings | undefined;
  const contentSettings = storeSettings?.contentSettings;

  // Fetch all data
  const [products, categories, vendors, contentPosts] = await Promise.all([
    getProducts(),
    getTopLevelCategories(),
    getVendors(),
    contentSettings?.enabled ? getContentPosts(true) : Promise.resolve([]),
  ]);

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/vendors`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ];

  // Product pages
  const productPages = products
    .filter(p => p.isActive)
    .map((product) => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: product.updatedAt.toDate(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  // Category pages
  const categoryPages = categories.map((category) => ({
    url: `${baseUrl}/categories/${category.slug}`,
    lastModified: category.updatedAt.toDate(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Vendor pages
  const vendorPages = vendors
    .filter(v => v.isActive)
    .map((vendor) => ({
      url: `${baseUrl}/vendors/${vendor.slug}`,
      lastModified: vendor.updatedAt.toDate(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

  // Content posts pages (blog, recipes, style guides, etc.)
  const contentPages: MetadataRoute.Sitemap = [];
  if (contentSettings?.enabled && contentPosts.length > 0) {
    // Add content listing page
    contentPages.push({
      url: `${baseUrl}/${contentSettings.urlSlug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    });

    // Add individual content posts
    contentPosts.forEach((post) => {
      contentPages.push({
        url: `${baseUrl}/${contentSettings.urlSlug}/${post.slug}`,
        lastModified: post.updatedAt.toDate(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      });
    });
  }

  return [...staticPages, ...productPages, ...categoryPages, ...vendorPages, ...contentPages];
}
