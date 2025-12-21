import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getStoreSettings } from '@/services/business-info-service';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  const businessName = settings.businessName || 'MagKam Solutions';

  return {
    title: `Ecommerce Solutions | ${businessName}`,
    description: 'Custom ecommerce platforms built around your business workflows. Multi-vendor support, inventory automation, and Stripe integration. Starting at $7,500.',
    keywords: 'custom ecommerce, ecommerce platform, multi-vendor marketplace, Stripe integration, inventory management, POS integration',
    openGraph: {
      title: `Ecommerce Solutions | ${businessName}`,
      description: 'A flexible, scalable ecommerce engine tailored to your operations and customer experience.',
      type: 'website',
    },
  };
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

export default async function EcommercePage() {
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
              <li className="text-gray-900 font-medium">Ecommerce</li>
            </ol>
          </div>
        </nav>

        {/* Hero Section */}
        <section
          className="relative bg-cover bg-center bg-no-repeat py-16 md:py-24"
          style={{ backgroundImage: 'url(/ecommerce-hero.webp)' }}
        >
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                Custom Ecommerce Platforms Built Around Your Business — Not a Template
              </h1>
              <p className="text-xl md:text-2xl text-gray-100 mb-8">
                A flexible, scalable ecommerce engine tailored to your operations and customer experience.
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
                Unlike Shopify or template platforms, {businessName} builds ecommerce systems that match the real workflows of your business.
              </p>
              <p className="text-lg text-gray-700">
                Perfect for markets, restaurants, and multi-vendor environments needing automation, scheduling, and custom inventory handling.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8 max-w-3xl mx-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Best For:</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-600"></span>
                  <span className="text-gray-700">Grocery stores & local markets</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-600"></span>
                  <span className="text-gray-700">Specialty retail</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-600"></span>
                  <span className="text-gray-700">Restaurants offering pickup/delivery</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-600"></span>
                  <span className="text-gray-700">Multi-vendor marketplaces</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-600"></span>
                  <span className="text-gray-700">Any business needing custom ecommerce logic</span>
                </li>
              </ul>
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
                Custom ecommerce platforms starting at $7,500. Final pricing depends on your specific needs.
              </p>
            </div>

            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
              <div className="text-center mb-8">
                <p className="text-4xl font-bold text-primary-600 mb-4">Starting at $7,500</p>
                <p className="text-gray-600">Pricing depends on:</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  'Vendor management',
                  'Inventory automation',
                  'Delivery/pickup logistics',
                  'CMS complexity',
                  'Stripe or POS integrations',
                  'Custom workflow requirements',
                ].map((factor, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-primary-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700 font-medium">{factor}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <Link
                  href="/contact"
                  className="inline-block bg-primary-600 text-white px-8 py-4 rounded-md font-semibold text-lg hover:bg-primary-700 active:bg-primary-800 transition-colors duration-200 shadow-sm hover:shadow-md"
                >
                  Get a Custom Quote
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Core Ecommerce Capabilities
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {[
                'Product catalogs & inventory management',
                'Multi-vendor support (optional)',
                'Dynamic menus or live-updating product lists',
                'Stripe integration',
                'Pickup/delivery scheduling',
                'Cart & checkout flows',
                'Customer accounts & order history',
                'CMS for staff updates',
                'Email/SMS notifications',
              ].map((feature, index) => (
                <div key={index} className="flex items-start gap-3 bg-white rounded-lg shadow-sm p-6">
                  <svg className="w-6 h-6 text-primary-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700 font-medium">{feature}</span>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Optional Add-Ons</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'Forecasting tools',
                  'POS integration (Square, Toast, Clover)',
                  'Vendor dashboards',
                  'Analytics dashboards',
                  'AI-based product recommendations',
                ].map((addon, index) => (
                  <div key={index} className="flex items-center gap-3 bg-white rounded-lg p-4">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="text-gray-700">{addon}</span>
                  </div>
                ))}
              </div>
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
                    <th className="px-6 py-4 text-center font-semibold">Shopify</th>
                    <th className="px-6 py-4 text-center font-semibold">Wix/Squarespace</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[
                    ['Fully Custom Workflows', '✔', '✘', '✘'],
                    ['Multi-Vendor Support', '✔', 'Add-ons', 'Limited'],
                    ['Checkout Flexibility', 'High', 'Low', 'Low'],
                    ['Performance', 'Excellent', 'Good', 'Good'],
                    ['Long-Term Fees', 'Low', 'High', 'Medium'],
                    ['Inventory Automation', 'Custom', 'Limited', 'Limited'],
                    ['Ownership', 'Full', 'No', 'No'],
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
                'Grocery Stores & Local Markets',
                'Restaurants & Cafes',
                'Professional Retail Services',
                'Multi-Vendor Marketplaces',
                'Nonprofits selling merchandise',
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
                question="Can I still use Stripe, Square, or my POS?"
                answer="Yes — custom integrations are fully supported."
              />
              <FAQItem
                question="Do I own my ecommerce system?"
                answer="Yes. No rental model."
              />
              <FAQItem
                question="Can I update products myself?"
                answer="Yes — your build will include a staff-friendly CMS."
              />
              <FAQItem
                question="What about recurring billing?"
                answer="Supported through Stripe integrations."
              />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 md:py-20 bg-primary-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Let&apos;s build an ecommerce platform tailored to your business.
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
