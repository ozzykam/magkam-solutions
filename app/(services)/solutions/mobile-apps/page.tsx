import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getStoreSettings } from '@/services/business-info-service';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  const businessName = settings.businessName || 'MagKam Solutions';

  return {
    title: `Mobile App Development | ${businessName}`,
    description: 'Cross-platform iOS and Android mobile app development with React Native. Single codebase for both platforms. Pricing starting at $12,000.',
    keywords: 'mobile app development, iOS development, Android development, React Native, cross-platform apps, mobile app',
    openGraph: {
      title: `Mobile App Development | ${businessName}`,
      description: 'Professional cross-platform mobile apps for iOS and Android built with React Native.',
      type: 'website',
    },
  };
}

interface PricingTierProps {
  name: string;
  priceRange: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

function PricingTier({ name, priceRange, description, features, highlighted = false }: PricingTierProps) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-8 ${highlighted ? 'ring-2 ring-primary-600' : ''}`}>
      {highlighted && (
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-600 text-white text-sm font-semibold mb-4">
          Most Popular
        </div>
      )}
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{name}</h3>
      <p className="text-3xl font-bold text-primary-600 mb-4">{priceRange}</p>
      <p className="text-gray-600 mb-6">{description}</p>

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
        href="/contact"
        className={`block w-full px-6 py-3 rounded-md font-semibold text-center transition-colors duration-200 shadow-sm hover:shadow-md ${
          highlighted
            ? 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800'
            : 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 active:bg-primary-100'
        }`}
      >
        Get Started
      </Link>
    </div>
  );
}

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-2">{question}</h3>
      <p className="text-gray-600">{answer}</p>
    </div>
  );
}

export default async function MobileAppsPage() {
  const settings = await getStoreSettings();
  const businessName = settings.businessName || 'MagKam Solutions';

  return (
    <>
      <Header />
      <main>
        {/* Breadcrumb */}
        <nav className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <ol className="flex items-center gap-2 text-sm text-gray-600">
              <li><Link href="/" className="hover:text-primary-600">Home</Link></li>
              <li>/</li>
              <li><Link href="/solutions" className="hover:text-primary-600">Solutions</Link></li>
              <li>/</li>
              <li className="text-gray-900 font-medium">Mobile Apps</li>
            </ol>
          </div>
        </nav>

        {/* Hero Section */}
        <section
          className="relative bg-cover bg-center bg-no-repeat py-16 md:py-24"
          style={{ backgroundImage: 'url(/mobile-apps-hero-bg.webp)' }}
        >
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                Cross-Platform Mobile Apps with React Native
              </h1>
              <p className="text-xl md:text-2xl text-gray-100 mb-8">
                Build once, deploy to both iOS and Android. Professional mobile applications with native performance and seamless user experiences.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contact"
                  className="bg-primary-600 text-white px-8 py-4 rounded-md font-semibold text-lg hover:bg-primary-700 active:bg-primary-800 transition-colors duration-200 shadow-sm hover:shadow-md"
                >
                  Start Your Project
                </Link>
                <Link
                  href="/contact"
                  className="border-2 border-white text-white px-8 py-4 rounded-md font-semibold text-lg hover:bg-white/10 active:bg-white/20 transition-colors duration-200"
                >
                  Request a Free Consultation
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Overview */}
        <section className="py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Overview
              </h2>
              <p className="text-lg text-gray-700 mb-4">
                {businessName} builds cross-platform mobile applications using React Native, allowing you to reach both iOS and Android users with a single codebase.
              </p>
              <p className="text-lg text-gray-700">
                Whether you need a consumer-facing app, internal business tool, or companion app to your web platform, we deliver cost-effective solutions that scale with your business.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="bg-white rounded-lg shadow-md p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Best For:</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary-600"></span>
                    <span className="text-gray-700">Restaurants & food delivery services</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary-600"></span>
                    <span className="text-gray-700">Retail & ecommerce businesses</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary-600"></span>
                    <span className="text-gray-700">Service-based businesses with booking needs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary-600"></span>
                    <span className="text-gray-700">Internal business tools & workforce apps</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary-600"></span>
                    <span className="text-gray-700">Startups launching new products</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow-md p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Tech Options:</h3>
                <div className="flex flex-wrap gap-2">
                  {['React Native', 'Firebase', 'Push Notifications', 'Offline Support', 'App Store Deployment'].map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center px-3 py-1 rounded-full bg-primary-100 text-primary-800 text-sm font-semibold"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-16 md:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Pricing
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Transparent pricing with no hidden fees. One codebase, two platforms.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <PricingTier
                name="Basic Mobile App"
                priceRange="$12,000 - $18,000"
                description="Essential features and functionality for straightforward mobile apps built with React Native."
                features={[
                  'iOS and Android deployment',
                  'Up to 8 core screens',
                  'Backend integration (Firebase/custom API)',
                  'Basic push notifications',
                  'App Store & Play Store submission',
                  '2 rounds of revisions',
                  '4 hours/month maintenance (additional: $150/hr)',
                ]}
              />

              <PricingTier
                name="Advanced Mobile App"
                priceRange="$18,000 - $30,000"
                description="Complex functionality, custom features, and advanced integrations with React Native."
                features={[
                  'iOS and Android deployment',
                  'Up to 15 core screens',
                  'Advanced backend integration',
                  'Push notifications & deep linking',
                  'Offline-first architecture',
                  'App Store & Play Store submission',
                  '3 rounds of revisions',
                  '8 hours/month maintenance (additional: $175/hr)',
                ]}
                highlighted
              />
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                All Mobile App Packages Include
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                'Custom UI/UX design tailored to your brand',
                'Native performance and smooth animations',
                'Push notification infrastructure',
                'Secure authentication & user management',
                'App Store & Play Store submission',
                'Analytics integration (Firebase, Mixpanel, etc.)',
                'Offline support & data synchronization',
                'Backend API development or integration',
                'Beta testing with TestFlight & Google Play Beta',
                'App Store Optimization (ASO) basics',
                'Post-launch monitoring & crash reporting',
                'App icon & splash screen design',
              ].map((feature, index) => (
                <div key={index} className="flex items-start gap-3 bg-white rounded-lg shadow-sm p-6">
                  <svg className="w-6 h-6 text-primary-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700 font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why React Native */}
        <section className="py-16 md:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why React Native?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                React Native combines the best of web and mobile development, delivering native performance with the efficiency of a single codebase.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Cost-Effective</h3>
                <p className="text-gray-600">
                  One codebase for both iOS and Android means lower development and maintenance costs compared to building two separate native apps.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Fast Development</h3>
                <p className="text-gray-600">
                  Hot reload and component reusability accelerate development. Launch your app faster and iterate quickly based on user feedback.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Native Performance</h3>
                <p className="text-gray-600">
                  React Native compiles to native code, delivering smooth animations and responsive UIs that feel native to each platform.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Easy Maintenance</h3>
                <p className="text-gray-600">
                  Fix bugs and add features once, deploy everywhere. Simplified maintenance means less time managing code and more time growing your business.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Rich Ecosystem</h3>
                <p className="text-gray-600">
                  Access thousands of pre-built components and libraries. Backed by Facebook/Meta and a massive developer community.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Platform Flexibility</h3>
                <p className="text-gray-600">
                  Write platform-specific code when needed. React Native gives you the flexibility to customize for iOS or Android when required.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Development Process */}
        <section className="py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Our Development Process
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                  Discovery & Planning
                </h3>
                <p className="text-gray-600 text-sm">
                  We define user flows, features, and technical requirements. Wireframes and prototypes set the foundation.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                  Design & Prototyping
                </h3>
                <p className="text-gray-600 text-sm">
                  Custom UI/UX design with interactive prototypes. Review and refine before development begins.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                  Development & Testing
                </h3>
                <p className="text-gray-600 text-sm">
                  Agile development with regular builds. Continuous testing on real devices throughout the process.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  4
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                  Launch & Support
                </h3>
                <p className="text-gray-600 text-sm">
                  App Store submission, launch monitoring, and ongoing support to ensure success.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-4">
              <FAQItem
                question="How long does mobile app development take?"
                answer="While React Native apps can take anywhere from 3–9 months to build depending on scope and complexity, our implementation of modern AI-assisted tooling can often reduce development timelines, with some projects delivered in under 16 weeks."
              />
              <FAQItem
                question="Do you handle App Store submission?"
                answer="Yes. We handle the entire submission process for both Apple App Store and Google Play Store, including all required assets and metadata."
              />
              <FAQItem
                question="Can you build for both iOS and Android?"
                answer="Absolutely. With React Native, we build a single codebase that runs on both iOS and Android, saving time and cost while delivering a native experience on both platforms."
              />
              <FAQItem
                question="What's included in maintenance?"
                answer="Bug fixes, OS compatibility updates, minor feature additions, performance monitoring, crash reporting resolution, and App Store compliance updates."
              />
              <FAQItem
                question="Do I own the app and source code?"
                answer="Yes. You retain full ownership of all code, designs, and assets. We can also provide source code documentation and handoff if needed."
              />
              <FAQItem
                question="Can the app work offline?"
                answer="Yes. We can implement offline-first architecture with local data storage and synchronization when connectivity is restored."
              />
              <FAQItem
                question="Why React Native instead of native development?"
                answer="React Native allows us to deliver apps faster and more cost-effectively while maintaining near-native performance. You get the best of both worlds: efficiency of cross-platform development with the quality of native apps."
              />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 md:py-20 bg-primary-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to build your mobile app?
            </h2>
            <p className="text-xl mb-8 text-primary-50">
              Let&apos;s discuss your app idea and create a solution that delights your users.
            </p>
            <Link
              href="/contact"
              className="inline-block bg-white text-primary-600 px-8 py-4 rounded-md font-semibold text-lg hover:bg-gray-100 transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              Start Your Project
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
