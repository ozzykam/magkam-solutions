import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getStoreSettings } from '@/services/business-info-service';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  const businessName = settings.businessName || 'MagKam Solutions';

  return {
    title: `Website Development | ${businessName}`,
    description: 'Modern, mobile-first websites built for growth. Custom design, fast performance, and scalable architecture. Pricing from $1,200 to $7,500.',
    keywords: 'website development, Next.js, React, Angular, custom website design, mobile-first, SEO optimization',
    openGraph: {
      title: `Website Development | ${businessName}`,
      description: 'Premium design, fast performance, and scalable architecture using today\'s leading frameworks.',
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

export default async function WebsitesPage() {
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
              <li className="text-gray-900 font-medium">Websites</li>
            </ol>
          </div>
        </nav>

        {/* Hero Section */}
        <section
          className="relative bg-cover bg-center bg-no-repeat py-16 md:py-24"
          style={{ backgroundImage: 'url(/website-hero-bg.webp)' }}
        >
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                Modern, Mobile-First Websites Built for Growth
              </h1>
              <p className="text-xl md:text-2xl text-gray-100 mb-8">
                Premium design, fast performance, and scalable architecture using today&apos;s leading frameworks.
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
                {businessName} builds modern websites tailored to your brand and designed for long-term growth.
              </p>
              <p className="text-lg text-gray-700">
                Every site is built with accessibility, performance, SEO, and mobile responsiveness at the core.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="bg-white rounded-lg shadow-md p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Best For:</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary-600"></span>
                    <span className="text-gray-700">Restaurants & cafes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary-600"></span>
                    <span className="text-gray-700">Skilled trades & field services</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary-600"></span>
                    <span className="text-gray-700">Professional services</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary-600"></span>
                    <span className="text-gray-700">Nonprofits & community organizations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary-600"></span>
                    <span className="text-gray-700">Small businesses and startups</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow-md p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Tech Options:</h3>
                <div className="flex flex-wrap gap-2">
                  {['Angular', 'Next.js', 'React', 'Static Rendering', 'SSR/ISR', 'Firebase Hosting', 'Vercel'].map((tech) => (
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
                Transparent pricing with no hidden fees. Choose the tier that fits your needs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <PricingTier
                name="Basic Website"
                priceRange="$750 - $3,000"
                description="For businesses needing a clean, fast, professional online presence."
                features={[
                  'Up to 5 custom pages',
                  'Mobile-first design',
                  'SEO setup',
                  '1 round of revisions',
                  '2 hours/month maintenance (additional: $150/hr)',
                ]}
              />

              <PricingTier
                name="Pro Website"
                priceRange="$3,500 - $7,500"
                description="A more advanced site with richer UI, motion, integrations, and optimized performance."
                features={[
                  'Up to 10 pages',
                  'Advanced UI/UX & animations',
                  'Custom components/forms',
                  '3 rounds of revisions',
                  '4 hours/month maintenance (additional: $175/hr)',
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
                All Website Packages Include
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                'Custom design (no templates)',
                'Responsive layout optimized for mobile',
                'SEO fundamentals (meta tags, structured content, performance tuning)',
                'Google Analytics + Search Console setup',
                'DNS, hosting, and email configuration',
                'Contact forms + CRM/Email integration',
                'Security best practices',
                'Deployment to Vercel or similar',
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

        {/* Comparison Table */}
        <section className="py-16 md:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                How We Compare
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg shadow-md overflow-hidden">
                <thead className="bg-primary-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Feature</th>
                    <th className="px-6 py-4 text-center font-semibold">{businessName}</th>
                    <th className="px-6 py-4 text-center font-semibold">Wix/Squarespace</th>
                    <th className="px-6 py-4 text-center font-semibold">Large Agency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[
                    ['Custom Design', '✔', 'Limited', '✔'],
                    ['Ownership', 'Full', 'Rental', 'Full'],
                    ['SEO Performance', 'Excellent', 'Moderate', 'Excellent'],
                    ['Flexibility', 'Unlimited', 'Template-restricted', 'High'],
                    ['Integrations', 'Unlimited', 'Limited', 'High'],
                    ['Long-Term Cost', 'Low', 'Medium', 'Very High'],
                    ['Speed/Performance', 'Excellent', 'Good', 'Excellent'],
                  ].map(([feature, us, competitor1, competitor2], index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-6 py-4 font-medium text-gray-900">{feature}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-primary-100 text-primary-800 font-semibold">
                          {us}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-700">{competitor1}</td>
                      <td className="px-6 py-4 text-center text-gray-700">{competitor2}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Industries Served */}
        <section className="py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Industries Served
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                'Restaurants & Cafes',
                'Grocery Stores & Local Markets',
                'Skilled Trades & Field Services',
                'Professional Services',
                'Nonprofits & Community Organizations',
              ].map((industry) => (
                <div key={industry} className="bg-white rounded-lg shadow-sm p-6 text-center hover:shadow-md transition-shadow duration-200">
                  <p className="text-gray-900 font-semibold">{industry}</p>
                </div>
              ))}
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
                question="How long does a website project take?"
                answer="Most Basic builds take 1–2 weeks; Pro builds 3–4 weeks."
              />
              <FAQItem
                question="Do I own my website?"
                answer="Yes. You retain full ownership of all code and assets."
              />
              <FAQItem
                question="What's included in maintenance?"
                answer="Bug fixes, content updates, small feature changes, and performance checks."
              />
              <FAQItem
                question="Do you use templates?"
                answer="No — all design and development is custom."
              />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 md:py-20 bg-primary-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to build your new website?
            </h2>
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
