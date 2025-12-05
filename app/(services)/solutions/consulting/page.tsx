import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getStoreSettings } from '@/services/business-info-service';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  const businessName = settings.businessName || 'MagKam Solutions';

  return {
    title: `Consulting & Technical Strategy | ${businessName}`,
    description: 'Technical strategy, architecture design, and digital roadmapping. Get clarity, direction, and expert guidance for your software and tech stack. Starting at $150/hr.',
    keywords: 'technical consulting, system architecture, tech stack selection, MVP planning, performance audits, SEO audits, database design, migration planning',
    openGraph: {
      title: `Consulting & Technical Strategy | ${businessName}`,
      description: 'Get clarity, direction, and expert guidance for your software, operations, and long-term tech stack.',
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

export default async function ConsultingPage() {
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
              <li className="text-gray-900 font-medium">Consulting</li>
            </ol>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-50 to-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Technical Strategy, Architecture Design, and Digital Roadmapping
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8">
                Get clarity, direction, and expert guidance for your software, operations, and long-term tech stack.
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
                For businesses that need high-level guidance, project planning, or technical leadership.
              </p>
              <p className="text-lg text-gray-700">
                This solution is ideal for startups, established organizations, and teams planning modernization or expansion.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Consulting Engagement Types:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'System architecture',
                  'Tech stack selection',
                  'Database & data modeling',
                  'Workflow & automation planning',
                  'Migration & modernization',
                  'MVP planning & scoping',
                  'Performance/SEO audits',
                  'Infrastructure audits',
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
                Flexible engagement models to fit your needs and budget.
              </p>
            </div>

            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
              <div className="text-center mb-8">
                <p className="text-4xl font-bold text-primary-600 mb-4">Starting at $150/hr</p>
                <p className="text-gray-600">Pricing varies by engagement type:</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4 text-primary-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Hourly Consulting</h3>
                  <p className="text-sm text-gray-600">Pay as you go for specific questions or guidance</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4 text-primary-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Project-Based</h3>
                  <p className="text-sm text-gray-600">Discovery phases with deliverables and documentation</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4 text-primary-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Ongoing Advising</h3>
                  <p className="text-sm text-gray-600">Monthly or quarterly retainer for continuous support</p>
                </div>
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

        {/* What's Included */}
        <section className="py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                What&apos;s Included
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Architecture & Planning */}
              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mb-4 text-primary-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Architecture & Planning</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700">Platform design</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700">Database schema planning</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700">API flow mapping</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700">Scalability recommendations</span>
                  </li>
                </ul>
              </div>

              {/* Business-Focused Guidance */}
              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mb-4 text-primary-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Business-Focused Guidance</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700">MVP feature prioritization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700">Cost-effective growth strategy</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700">Roadmapping</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700">Team & vendor recommendations</span>
                  </li>
                </ul>
              </div>

              {/* Technical Audits */}
              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mb-4 text-primary-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Technical Audits</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700">Performance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700">SEO</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700">Infrastructure</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700">Codebase analysis (optional)</span>
                  </li>
                </ul>
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
                    <th className="px-6 py-4 text-center font-semibold">Traditional Agency</th>
                    <th className="px-6 py-4 text-center font-semibold">Freelancers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[
                    ['Business + Technical Perspective', '✔', 'Limited', 'Varies'],
                    ['Custom Architecture', '✔', '✔', '✘'],
                    ['Flexibility', 'High', 'Low', 'High'],
                    ['Cost Efficiency', 'High', 'Low', 'High'],
                    ['Long-Term Advising', 'Available', 'Rare', 'Rare'],
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
                'Startups',
                'Professional Services',
                'Nonprofits',
                'Retail & Markets',
                'Skilled Trades',
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
                question="What do I need before a consulting call?"
                answer="Nothing — discovery is included."
              />
              <FAQItem
                question="Do you offer recurring advising?"
                answer="Yes — available as a monthly or quarterly engagement."
              />
              <FAQItem
                question="Can this lead into development work?"
                answer="Yes — consulting can transition into full-scale production."
              />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 md:py-20 bg-primary-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready for clarity and direction?
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
