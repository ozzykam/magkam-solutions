import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getStoreSettings } from '@/services/business-info-service';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  const businessName = settings.businessName || 'MagKam Solutions';

  return {
    title: `Custom Software & Platforms | ${businessName}`,
    description: 'Build exactly what your business needs. CRMs, SaaS tools, internal dashboards, mobile apps, automation systems, and custom workflows. Starting at $15,000.',
    keywords: 'custom software, CRM development, SaaS platform, mobile apps, PWA, inventory tracking, automation systems, custom platforms',
    openGraph: {
      title: `Custom Software & Platforms | ${businessName}`,
      description: 'No limits, no templates. Build custom platforms engineered around your business logic.',
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

export default async function CustomSoftwarePage() {
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
              <li className="text-gray-900 font-medium">Custom Software</li>
            </ol>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-50 to-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Build Exactly What Your Business Needs — No Limits, No Templates
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8">
                CRMs, SaaS tools, internal dashboards, mobile apps, automation systems, and custom workflows.
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
                  className="border-2 border-primary-600 text-primary-600 px-8 py-4 rounded-md font-semibold text-lg hover:bg-primary-50 active:bg-primary-100 transition-colors duration-200"
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
                {businessName} builds fully custom platforms engineered around your business logic.
              </p>
              <p className="text-lg text-gray-700">
                Whether you&apos;re modernizing operations, automating workflows, or building a new SaaS product — this is the solution for you.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Common Platform Types:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'CRM & customer portals',
                  'Inventory tracking & forecasting',
                  'Field service tools',
                  'Mobile apps (PWA or hybrid)',
                  'Scheduling & resource management',
                  'Multi-vendor marketplaces',
                  'Community platforms',
                  'Reporting & analytics dashboards',
                ].map((type, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary-600"></span>
                    <span className="text-gray-700">{type}</span>
                  </div>
                ))}
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
                Custom software platforms starting at $15,000. Final pricing depends on your specific requirements.
              </p>
            </div>

            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
              <div className="text-center mb-8">
                <p className="text-4xl font-bold text-primary-600 mb-4">Starting at $15,000</p>
                <p className="text-gray-600">Based on:</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  'Complexity',
                  'Number of user roles',
                  'Integrations',
                  'Data structure',
                  'Custom automation',
                  'Mobile support (if needed)',
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

        {/* Core Capabilities */}
        <section className="py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Core Capabilities
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                'Fully custom backend logic',
                'Secure authentication (Email, Google, OAuth)',
                'Firestore or SQL-based databases',
                'Admin dashboards & role-based permissions',
                'Real-time updates',
                'Mobile app compatibility (PWA)',
                'Advanced analytics & reporting',
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

        {/* Integrations */}
        <section className="py-16 md:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Integrations
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Connect your platform to the tools and services you already use.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
              {[
                'Stripe',
                'Square',
                'HubSpot',
                'Gusto',
                'Google APIs',
                'Cloud Messaging',
                'REST APIs',
                'GraphQL',
              ].map((integration, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm p-6 text-center hover:shadow-md transition-shadow duration-200">
                  <p className="text-gray-900 font-semibold">{integration}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg p-8 max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Optional Capabilities</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'AI automation & recommendations',
                  'Encrypted messaging',
                  'Offline support',
                  'Multi-tenant architecture',
                  'Admin billing portals',
                ].map((capability, index) => (
                  <div key={index} className="flex items-center gap-3 bg-gray-50 rounded-lg p-4">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="text-gray-700">{capability}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-16 md:py-20">
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
                    <th className="px-6 py-4 text-center font-semibold">Off-the-Shelf SaaS</th>
                    <th className="px-6 py-4 text-center font-semibold">Large Agency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[
                    ['Customization', 'Complete', 'None', 'High'],
                    ['Ownership', 'Full', 'None', 'Full'],
                    ['Long-Term Cost', 'Low', 'High', 'Very High'],
                    ['Integrations', 'Unlimited', 'Limited', 'High'],
                    ['Code Control', '✔', '✘', '✔'],
                    ['Performance', 'Excellent', 'Varies', 'Excellent'],
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
        <section className="py-16 md:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Industries Served
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                'Skilled Trades & Field Services',
                'Professional Services',
                'Markets & Retail',
                'Nonprofits & Community Orgs',
                'Startups building MVPs',
              ].map((industry) => (
                <div key={industry} className="bg-white rounded-lg shadow-sm p-6 text-center hover:shadow-md transition-shadow duration-200">
                  <p className="text-gray-900 font-semibold">{industry}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-4">
              <FAQItem
                question="How long does a custom platform take?"
                answer="2–6 months depending on complexity."
              />
              <FAQItem
                question="Will you help define the system architecture?"
                answer="Yes — all custom builds include discovery & planning."
              />
              <FAQItem
                question="Can features be added later?"
                answer="Yes — platforms are built with scalability in mind."
              />
              <FAQItem
                question="Do you support secure or sensitive data?"
                answer="Yes — Firestore security rules + best practices."
              />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 md:py-20 bg-primary-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Let&apos;s build a platform that gives your business an edge.
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
