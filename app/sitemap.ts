
import { MetadataRoute } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { StoreSettings } from '@/types/business-info';
import { getServices } from '@/services/services-service';
import { getContentPosts } from '@/services/content-service';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yourstore.com';

  // Static pages that are always included
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

  // Try to fetch dynamic data, but gracefully handle errors during build
  try {
    // Fetch store settings for content settings
    const storeSettingsDoc = await getDoc(doc(db, 'storeSettings', 'main'));
    const storeSettings = storeSettingsDoc.data() as StoreSettings | undefined;
    const contentSettings = storeSettings?.contentSettings;

    // Fetch all data
    const [services, categories] = await Promise.all([
      getServices(),
      contentSettings?.enabled ? getContentPosts(true) : Promise.resolve([]),
    ]);

    // Service pages
    const servicePages = services
      .filter(p => p.isActive)
      .map((service) => ({
        url: `${baseUrl}/services/${service.slug}`,
        lastModified: service.updatedAt.toDate(),
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

    // Content posts pages (blog, recipes, style guides, etc.)
    const contentPages: MetadataRoute.Sitemap = [];
    if (contentSettings?.enabled && categories.length > 0) {
      // Add content listing page
      contentPages.push({
        url: `${baseUrl}/${contentSettings.urlSlug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      });

      // Add individual content posts
      categories.forEach((post) => {
        contentPages.push({
          url: `${baseUrl}/${contentSettings.urlSlug}/${post.slug}`,
          lastModified: post.updatedAt.toDate(),
          changeFrequency: 'monthly' as const,
          priority: 0.7,
        });
      });
    }

    return [...staticPages, ...servicePages, ...categoryPages, ...contentPages];
  } catch (error) {
    // During build time, Firebase may not be available
    // Return static pages only
    console.warn('Sitemap: Firebase not available during build, returning static pages only', error);
    return staticPages;
  }
}
