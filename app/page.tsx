import type { Metadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { StoreSettings } from '@/types/business-info';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import SearchBar from '@/components/layout/SearchBar';

/**
 * Generate metadata for SEO
 */
export async function generateMetadata(): Promise<Metadata> {
  // Fetch store settings for business name
  const storeSettingsDoc = await getDoc(doc(db, 'storeSettings', 'main'));
  const storeSettings = storeSettingsDoc.data() as StoreSettings | undefined;
  const businessName = storeSettings?.businessName || 'Our Store';
  const tagline = storeSettings?.tagline || '';
  const businessDescription = storeSettings?.businessDescription || 'The best quality near you';

  // Use tagline for title if available, otherwise use business description
  const pageTitle = tagline ? `${businessName} - ${tagline}` : `${businessName} - ${businessDescription}`;
  const ogTitle = tagline ? `${businessName} - ${tagline}` : `${businessName} - Fresh Local Services`;
  const twitterTitle = tagline ? `${businessName} - ${tagline}` : `${businessName} - Local Services`;

  return {
    title: pageTitle,
    description: businessDescription,
    keywords: 'local services, fresh food, farmers market, organic, local delivery, farm to table',
    openGraph: {
      title: ogTitle,
      description: businessDescription,
      type: 'website',
      locale: 'en_US',
      siteName: businessName,
    },
    twitter: {
      card: 'summary_large_image',
      title: twitterTitle,
      description: businessDescription,
    },
  };
}

// Icon component for features
function FeatureIcon({ icon }: { icon: string }) {
  const iconPaths = {
    check: 'M5 13l4 4L19 7',
    clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    shield: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    star: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    users: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    heart: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  };

  return (
    <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPaths[icon as keyof typeof iconPaths] || iconPaths.check} />
    </svg>
  );
}

export default async function Home() {
  // Fetch store settings for JSON-LD and homepage content
  const storeSettingsDoc = await getDoc(doc(db, 'storeSettings', 'main'));
  const storeSettings = storeSettingsDoc.data() as StoreSettings | undefined;
  const businessName = storeSettings?.businessName || 'Our Store';
  const businessDescription = storeSettings?.businessDescription || 'The best quality near you';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yourstore.com';

  // Get homepage settings with defaults
  const homepage = storeSettings?.homepageSettings || {
    hero: {
      headline: 'Professional Services',
      highlightedText: 'Tailored to Your Needs',
      subtitle: 'Expert solutions to help your business grow and succeed.',
      primaryCTA: { text: 'View Services', link: '/solutions' },
      secondaryCTA: { text: 'Learn More', link: '/about' },
    },
    features: {
      feature1: { title: 'Quality Service', description: 'Professional service with attention to detail.', icon: 'check' },
      feature2: { title: 'Fast Turnaround', description: 'Efficient delivery without compromising quality.', icon: 'clock' },
      feature3: { title: 'Satisfaction Guaranteed', description: '100% satisfaction guarantee.', icon: 'shield' },
    },
    cta: {
      heading: 'Ready to Get Started?',
      subtitle: 'Join our growing community of satisfied clients',
      buttonText: 'Create Your Account',
      buttonLink: '/register',
    },
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary-50 to-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                {homepage.hero.headline}
                <br />
                <span className="text-primary-600">{homepage.hero.highlightedText}</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                {homepage.hero.subtitle}
              </p>
              {/* Search Bar */}
              <SearchBar className="max-w-sm mx-auto mb-12 top-4"/>
              <div className="flex gap-4 justify-center">
                <Link href={homepage.hero.primaryCTA.link}>
                  <Button variant="primary" size="lg">
                    {homepage.hero.primaryCTA.text}
                  </Button>
                </Link>
                <Link href={homepage.hero.secondaryCTA.link}>
                  <Button variant="outline" size="lg">
                    {homepage.hero.secondaryCTA.text}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FeatureIcon icon={homepage.features.feature1.icon} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{homepage.features.feature1.title}</h3>
                <p className="text-gray-600">
                  {homepage.features.feature1.description}
                </p>
              </div>

              {/* Feature 2 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FeatureIcon icon={homepage.features.feature2.icon} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{homepage.features.feature2.title}</h3>
                <p className="text-gray-600">
                  {homepage.features.feature2.description}
                </p>
              </div>

              {/* Feature 3 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FeatureIcon icon={homepage.features.feature3.icon} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{homepage.features.feature3.title}</h3>
                <p className="text-gray-600">
                  {homepage.features.feature3.description}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              {homepage.cta.heading}
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              {homepage.cta.subtitle}
            </p>
            <Link href={homepage.cta.buttonLink}>
              <Button variant="secondary" size="lg">
                {homepage.cta.buttonText}
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />

      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: businessName,
            description: businessDescription,
            url: baseUrl,
            logo: `${baseUrl}/logo.png`,
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'Customer Service',
              email: storeSettings?.email || 'info@yourstore.com',
            },
            address: storeSettings?.address ? {
              '@type': 'PostalAddress',
              streetAddress: storeSettings.address.street,
              addressLocality: storeSettings.address.city,
              addressRegion: storeSettings.address.state,
              postalCode: storeSettings.address.zipCode,
              addressCountry: 'US',
            } : undefined,
            sameAs: [
              storeSettings?.socialMedia?.facebook,
              storeSettings?.socialMedia?.instagram,
              storeSettings?.socialMedia?.x,
              storeSettings?.socialMedia?.linkedin,
              storeSettings?.socialMedia?.youtube,
            ].filter(Boolean),
          }),
        }}
      />
    </div>
  );
}
