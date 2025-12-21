import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getStoreSettings } from '@/services/business-info-service';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  const businessName = settings.businessName || 'MagKam Solutions';

  return {
    title: `Solutions | ${businessName}`,
    description: 'Custom web development solutions including websites, ecommerce platforms, mobile apps, custom software, and technical consulting for businesses of all sizes.',
    keywords: 'web development, ecommerce platforms, mobile apps, iOS, Android, custom software, technical consulting, React, Next.js, Firebase',
    openGraph: {
      title: `Solutions | ${businessName}`,
      description: 'Custom web development and mobile app solutions tailored to your business needs.',
      type: 'website',
    },
  };
}

interface SolutionCardProps {
  title: string;
  tagline: string;
  pricing: string;
  features: string[];
  href: string;
  icon: React.ReactNode;
}

function SolutionCard({ title, tagline, pricing, features, href, icon }: SolutionCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-xl transition-shadow duration-300">
      <div className="mb-6">
        <div className="w-16 h-16 rounded-lg bg-primary-100 flex items-center justify-center mb-4 text-primary-600">
          {icon}
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{tagline}</p>
        <p className="text-xl font-semibold text-primary-600 mb-6">{pricing}</p>
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href={href}
        className="block w-full bg-primary-600 text-white px-6 py-3 rounded-md font-semibold text-center hover:bg-primary-700 active:bg-primary-800 transition-colors duration-200 shadow-sm hover:shadow-md"
      >
        Learn More
      </Link>
    </div>
  );
}

interface IndustryCardProps {
  name: string;
  icon: React.ReactNode;
}

function IndustryCard({ name, icon }: IndustryCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 text-center hover:shadow-md transition-shadow duration-200">
      <div className="w-12 h-12 mx-auto mb-3 text-primary-600">
        {icon}
      </div>
      <h4 className="text-gray-900 font-semibold">{name}</h4>
    </div>
  );
}

export default async function SolutionsPage() {
  const settings = await getStoreSettings();
  const businessName = settings.businessName || 'MagKam Solutions';

  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section
          className="relative bg-cover bg-center bg-no-repeat py-16 md:py-24"
          style={{ backgroundImage: 'url(/workspace-image.webp)' }}
        >
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Custom Solutions Built for Your Business
            </h1>
            <p className="text-xl md:text-2xl text-gray-100 max-w-3xl mx-auto mb-8">
              Modern web development, mobile apps, ecommerce platforms, and custom software engineered for growth, performance, and scalability.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="#solutions"
                className="bg-primary-600 text-white px-8 py-4 rounded-md font-semibold text-lg hover:bg-primary-700 active:bg-primary-800 transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                Explore Solutions
              </Link>
              <Link
                href="/contact"
                className="border-2 border-white text-white px-8 py-4 rounded-md font-semibold text-lg hover:bg-white/10 active:bg-white/20 transition-colors duration-200"
              >
                Request Consultation
              </Link>
            </div>
          </div>
        </section>

        {/* Solutions Grid */}
        <section id="solutions" className="py-16 md:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Our Solutions
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Choose the solution that fits your business needs. All projects include full ownership, modern architecture, and ongoing support.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <SolutionCard
                title="Websites"
                tagline="Modern, mobile-first websites built for growth"
                pricing="$1,200 - $7,500"
                features={[
                  'Custom design with no templates',
                  'SEO optimized and mobile responsive',
                  'Fast performance with Next.js/React or Angular',
                  'Full ownership of code and assets',
                ]}
                href="/solutions/websites"
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                }
              />

              <SolutionCard
                title="Ecommerce"
                tagline="Custom ecommerce platforms built around your business"
                pricing="Starting at $7,500"
                features={[
                  'Fully custom workflows and inventory',
                  'Multi-vendor support and automation',
                  'Stripe and POS integrations',
                  'Staff CMS for easy product updates',
                ]}
                href="/solutions/ecommerce"
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
              />

              <SolutionCard
                title="Mobile Apps"
                tagline="Cross-platform iOS and Android apps with React Native"
                pricing="Starting at $12,000"
                features={[
                  'Single codebase for iOS and Android',
                  'Built with React Native',
                  'App Store and Play Store deployment',
                  'Push notifications and offline support',
                ]}
                href="/solutions/mobile-apps"
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                }
              />

              <SolutionCard
                title="Custom Software"
                tagline="Build exactly what your business needs"
                pricing="Starting at $15,000"
                features={[
                  'CRMs, SaaS platforms, internal tools',
                  'Custom backend logic and automation',
                  'Role-based permissions and dashboards',
                  'Mobile app compatibility (PWA)',
                ]}
                href="/solutions/custom-software"
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                }
              />

              <SolutionCard
                title="Consulting"
                tagline="Technical strategy and architecture guidance"
                pricing="$150/hour"
                features={[
                  'Code reviews and architecture audits',
                  'Performance optimization consulting',
                  'Technology stack recommendations',
                  'Team training and best practices',
                ]}
                href="/solutions/consulting"
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                }
              />
            </div>
          </div>
        </section>

        {/* Industries Served */}
        <section className="py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Industries We Serve
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Tailored solutions for diverse business needs across multiple sectors.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              <IndustryCard
                name="Restaurants & Cafes"
                icon={
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                }
              />

              <IndustryCard
                name="Grocery & Markets"
                icon={
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
              />

              <IndustryCard
                name="Skilled Trades"
                icon={
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                }
              />

              <IndustryCard
                name="Professional Services"
                icon={
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />

              <IndustryCard
                name="Nonprofits"
                icon={
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                }
              />
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 md:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Choose {businessName}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4 text-primary-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Full Ownership</h3>
                <p className="text-gray-600">You own 100% of your code and assets. No rental model, no vendor lock-in.</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4 text-primary-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Excellent Performance</h3>
                <p className="text-gray-600">Built with modern frameworks for speed, SEO, and user experience.</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4 text-primary-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Transparent Pricing</h3>
                <p className="text-gray-600">Clear, upfront pricing with no hidden fees or long-term subscriptions.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 md:py-20 bg-primary-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Build Your Solution?
            </h2>
            <p className="text-xl mb-8 text-primary-50">
              Let&apos;s discuss your project and create a custom solution that fits your needs and budget.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="bg-white text-primary-600 px-8 py-4 rounded-md font-semibold text-lg hover:bg-gray-100 transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                Start Your Project
              </Link>
              <Link
                href="/contact"
                className="border-2 border-white text-white px-8 py-4 rounded-md font-semibold text-lg hover:bg-primary-700 transition-colors duration-200"
              >
                Request Free Consultation
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
