import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { StoreSettings } from '@/types/business-info';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ContentReviews from '@/components/content/ContentReviews';
import BookmarkButton from '@/components/content/BookmarkButton';
import { getContentPostBySlug, incrementViewCount } from '@/services/content-service';
import { getContentReviews } from '@/services/content-review-service';
import { stripHtml, truncateText } from '@/lib/utils/html';
import { getSEOForTemplate } from '@/services/seo-service';
import { EyeIcon, ClockIcon, UserIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

interface ContentPostPageProps {
  params: Promise<{
    contentSlug: string;
    slug: string;
  }>;
}

/**
 * Generate metadata for SEO using template + post-specific data
 */
export async function generateMetadata({ params }: ContentPostPageProps): Promise<Metadata> {
  const { slug } = await params;

  // Fetch post
  const post = await getContentPostBySlug(slug);
  if (!post) {
    return { title: 'Post Not Found' };
  }

  // Fetch store settings
  const storeSettingsDoc = await getDoc(doc(db, 'storeSettings', 'main'));
  const storeSettings = storeSettingsDoc.data() as StoreSettings | undefined;
  const businessName = storeSettings?.businessName || 'Our Store';

  // Generate plain text description for SEO (strip HTML from description)
  const plainTextDescription = post.excerpt || truncateText(stripHtml(post.description), 160);

  // Get SEO template configuration
  const seoConfig = await getSEOForTemplate('contentPost', {
    title: post.title,
    excerpt: post.excerpt || plainTextDescription,
    authorName: post.authorName,
    categoryName: post.categoryName || '',
    businessName,
  });

  // Combine keywords: template keywords + post tags (deduplicated)
  const templateKeywords = seoConfig.keywords || [];
  const postTags = post.tags || [];
  const combinedKeywords = Array.from(new Set([...templateKeywords, ...postTags]));

  // Use custom meta fields if set, otherwise use template/defaults
  const title = post.metaTitle || seoConfig.title || `${post.title} | ${businessName}`;
  const description = post.metaDescription || seoConfig.description || plainTextDescription;

  return {
    title,
    description,
    keywords: combinedKeywords.join(', '),
    openGraph: {
      title,
      description,
      images: post.coverImage
        ? [{
            url: post.coverImage,
            width: 1200,
            height: 630,
            alt: post.title,
          }]
        : [],
      type: 'article',
      publishedTime: post.publishedAt?.toDate().toISOString(),
      modifiedTime: post.updatedAt?.toDate().toISOString(),
      authors: [post.authorName],
      section: post.categoryName || undefined,
      tags: postTags,
      siteName: businessName,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.coverImage ? [post.coverImage] : [],
      creator: post.authorName ? `@${post.authorName.replace(/\s+/g, '')}` : undefined,
    },
    other: {
      // Article Rich Pins (Pinterest)
      'article:author': post.authorName,
      ...(post.publishedAt ? { 'article:published_time': post.publishedAt.toDate().toISOString() } : {}),
      ...(post.updatedAt ? { 'article:modified_time': post.updatedAt.toDate().toISOString() } : {}),
      ...(post.categoryName ? { 'article:section': post.categoryName } : {}),
      // Pinterest-specific
      'pinterest:card': 'article',
    },
    robots: seoConfig.noindex ? 'noindex, nofollow' : 'index, follow',
  };
}

/**
 * Content Post Detail Page - Server Component
 */
export default async function ContentPostPage({ params }: ContentPostPageProps) {
  const { contentSlug, slug } = await params;

  // Fetch store settings
  const storeSettingsDoc = await getDoc(doc(db, 'storeSettings', 'main'));
  const storeSettings = storeSettingsDoc.data() as StoreSettings | undefined;

  // Verify content settings
  const contentSettings = storeSettings?.contentSettings;
  if (!contentSettings || !contentSettings.enabled || contentSlug !== contentSettings.urlSlug) {
    notFound();
  }

  // Fetch post
  const post = await getContentPostBySlug(slug);
  if (!post || !post.isPublished) {
    notFound();
  }

  // Increment view count (fire and forget)
  incrementViewCount(post.id);

  // Fetch reviews
  const reviews = await getContentReviews(post.id);

  // Serialize review timestamps
  const serializedReviews = reviews.map(review => ({
    ...review,
    createdAt: review.createdAt.toDate(),
    updatedAt: review.updatedAt.toDate(),
  }));

  // Content is safe - it comes from admin-controlled Quill editor
  // No sanitization needed since only admins can create/edit content

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow bg-white">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumb */}
          <nav className="mb-8 text-sm">
            <ol className="flex items-center gap-2 text-gray-600">
              <li><Link href="/" className="hover:text-primary-600">Home</Link></li>
              <li>/</li>
              <li><Link href={`/${contentSlug}`} className="hover:text-primary-600">{contentSettings.sectionNamePlural}</Link></li>
              <li>/</li>
              <li className="text-gray-900">{post.title}</li>
            </ol>
          </nav>

          {/* Header */}
          <header className="mb-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 flex-1">
                {post.title}
              </h1>
              <BookmarkButton postId={post.id} postTitle={post.title} variant="large" />
            </div>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-gray-600">
              {contentSettings.showAuthor && (
                <div className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  <span>{post.authorName}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5" />
                <span>
                  {post.publishedAt?.toDate().toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>

              {contentSettings.showViewCount && (
                <div className="flex items-center gap-2">
                  <EyeIcon className="w-5 h-5" />
                  <span>{post.viewCount} views</span>
                </div>
              )}
            </div>

            {/* Category & Tags */}
            {(post.categoryName || post.tags.length > 0) && (
              <div className="flex flex-wrap gap-2 mt-4">
                {/* Category Badge */}
                {post.categoryName && (
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded-full font-medium">
                    {post.categoryName}
                  </span>
                )}

                {/* Tags */}
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Cover Image */}
          {post.coverImage && (
            <div className="relative w-full h-96 mb-12 rounded-lg overflow-hidden">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Featured Items */}
          {post.featuredItems.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-8 mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <ShoppingBagIcon className="w-6 h-6" />
                {contentSettings.itemsLabel}
              </h2>

              <div className="space-y-4">
                {post.featuredItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 bg-white rounded-lg p-4"
                  >
                    {/* Item Image */}
                    {item.image && (
                      <div className="flex-shrink-0 w-16 h-16 relative rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    {/* Item Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          {item.productSlug ? (
                            <Link
                              href={`/products/${item.productSlug}`}
                              className="font-medium text-gray-900 hover:text-primary-600"
                            >
                              {item.name}
                              {item.isAvailable === false && (
                                <span className="ml-2 text-xs text-red-600">(Out of Stock)</span>
                              )}
                            </Link>
                          ) : (
                            <span className="font-medium text-gray-900">{item.name}</span>
                          )}

                          {item.quantity && (
                            <p className="text-sm text-gray-600 mt-1">{item.quantity}</p>
                          )}

                          {item.notes && (
                            <p className="text-sm text-gray-500 mt-1 italic">{item.notes}</p>
                          )}
                        </div>

                        {item.productSlug && (
                          <Link
                            href={`/products/${item.productSlug}`}
                            className="flex-shrink-0 text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            View Product →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-lg max-w-none mb-12 text-gray-800"
            dangerouslySetInnerHTML={{ __html: post.description }}
          />

          {/* Additional Images */}
          {post.images.length > 0 && (
            <div className="mb-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {post.images.map((img, index) => (
                  <div key={index} className="relative w-full h-64 rounded-lg overflow-hidden">
                    <Image
                      src={img}
                      alt={`${post.title} - Image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <ContentReviews
            contentPostId={post.id}
            initialReviews={serializedReviews}
            totalReviews={post.totalReviews}
            averageRating={post.averageRating}
          />

          {/* Back Link */}
          <div className="pt-8 border-t border-gray-200 mt-8">
            <Link
              href={`/${contentSlug}`}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              ← Back to {contentSettings.sectionNamePlural}
            </Link>
          </div>
        </article>
      </main>

      <Footer />

      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.title,
            description: post.excerpt || truncateText(stripHtml(post.description), 160),
            image: post.coverImage ? [post.coverImage] : [],
            datePublished: post.publishedAt?.toDate().toISOString(),
            dateModified: post.updatedAt.toDate().toISOString(),
            author: {
              '@type': 'Person',
              name: post.authorName,
            },
            publisher: {
              '@type': 'Organization',
              name: storeSettings?.businessName || 'Our Store',
              logo: {
                '@type': 'ImageObject',
                url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://yourstore.com'}/logo.png`,
              },
            },
          }),
        }}
      />
    </div>
  );
}
