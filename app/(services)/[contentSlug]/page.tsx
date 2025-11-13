import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { StoreSettings } from '@/types/business-info';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ContentSearch from '@/components/content/ContentSearch';
import { getContentPosts } from '@/services/content-service';

interface ContentListPageProps {
  params: Promise<{
    contentSlug: string;
  }>;
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params }: ContentListPageProps): Promise<Metadata> {
  const { contentSlug } = await params;

  // Fetch store settings
  const storeSettingsDoc = await getDoc(doc(db, 'storeSettings', 'main'));
  const storeSettings = storeSettingsDoc.data() as StoreSettings | undefined;
  const businessName = storeSettings?.businessName || 'Our Store';

  // Check if this matches our content URL slug
  const contentSettings = storeSettings?.contentSettings;
  if (!contentSettings || contentSlug !== contentSettings.urlSlug) {
    return { title: 'Page Not Found' };
  }

  return {
    title: `${contentSettings.sectionNamePlural} | ${businessName}`,
    description: `Browse our ${contentSettings.sectionNamePlural.toLowerCase()}`,
    openGraph: {
      title: `${contentSettings.sectionNamePlural} | ${businessName}`,
      description: `Browse our ${contentSettings.sectionNamePlural.toLowerCase()}`,
      type: 'website',
    },
  };
}

/**
 * Content Listing Page - Server Component
 * Dynamic route that shows blog posts, recipes, style guides, etc.
 */
export default async function ContentListPage({ params }: ContentListPageProps) {
  const { contentSlug } = await params;

  // Fetch store settings
  const storeSettingsDoc = await getDoc(doc(db, 'storeSettings', 'main'));
  const storeSettings = storeSettingsDoc.data() as StoreSettings | undefined;

  // Check if this matches our content URL slug
  const contentSettings = storeSettings?.contentSettings;
  if (!contentSettings || !contentSettings.enabled || contentSlug !== contentSettings.urlSlug) {
    notFound();
  }

  // Fetch published posts
  const posts = await getContentPosts(true);

  // Serialize timestamps for client components
  const serializedPosts = posts.map((post) => ({
    ...post,
    createdAt: post.createdAt.toDate(),
    updatedAt: post.updatedAt.toDate(),
    publishedAt: post.publishedAt?.toDate(),
  }));

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {contentSettings.sectionNamePlural}
            </h1>
            <p className="text-xl text-gray-600">
              Discover our latest {contentSettings.sectionNamePlural.toLowerCase()}
            </p>
          </div>

          {/* Search and Posts */}
          <ContentSearch
            posts={serializedPosts}
            contentSlug={contentSlug}
            sectionNamePlural={contentSettings.sectionNamePlural}
            itemsLabel={contentSettings.itemsLabel}
            showAuthor={contentSettings.showAuthor}
            showViewCount={contentSettings.showViewCount}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
