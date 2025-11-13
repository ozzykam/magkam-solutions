import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { getStoreSettings } from '@/services/business-info-service';
import { getSEOForRoute, applyTemplateVariables } from '@/services/seo-service';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  const businessName = settings.businessName || 'Local Market';

  // Get SEO settings from admin configuration
  const seoConfig = await getSEOForRoute('/privacy');

  // Apply template variables to title and description
  const title = seoConfig.title
    ? applyTemplateVariables(seoConfig.title, { businessName })
    : `Privacy Policy | ${businessName}`;

  const description = seoConfig.description
    ? applyTemplateVariables(seoConfig.description, { businessName })
    : `Learn how ${businessName} collects, uses, and protects your personal information. Read our comprehensive privacy policy.`;

  return {
    title,
    description,
    keywords: seoConfig.keywords?.join(', '),
    openGraph: {
      title,
      description,
      type: 'website',
      images: seoConfig.ogImage ? [{ url: seoConfig.ogImage }] : undefined,
    },
    robots: seoConfig.noindex ? 'noindex, nofollow' : 'index, follow',
  };
}

export default async function PrivacyPage() {
  const settings = await getStoreSettings();
  const businessName = settings.businessName || 'Local Market';
  const email = settings.email || 'privacy@localmarket.com';
  const phone = settings.phone || '[Your Phone Number]';
  const address = settings.address
    ? `${settings.address.street}, ${settings.address.city}, ${settings.address.state} ${settings.address.zipCode}`
    : '[Your Address]';
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-gray-600 mb-8">Last Updated: January 2025</p>

      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
          <p className="text-gray-700 mb-4">
            {businessName} (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy
            explains how we collect, use, disclose, and safeguard your information when you use our service,
            including our website and mobile applications.
          </p>
          <p className="text-gray-700 mb-4">
            By using our Service, you agree to the collection and use of information in accordance with this
            policy. If you do not agree with our policies and practices, please do not use our Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">2.1 Personal Information</h3>
          <p className="text-gray-700 mb-4">
            We collect personal information that you voluntarily provide to us when you:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li><strong>Create an account:</strong> Name, email address, phone number, password</li>
            <li><strong>Place an order:</strong> Billing address, delivery address, payment information</li>
            <li><strong>Contact us:</strong> Any information you provide in correspondence</li>
            <li><strong>Participate in surveys:</strong> Feedback, preferences, and opinions</li>
            <li><strong>Leave reviews:</strong> Service ratings and comments</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">2.2 Payment Information</h3>
          <p className="text-gray-700 mb-4">
            We use secure third-party payment processors to handle all payment transactions. We do not store
            complete credit card numbers or CVV codes on our servers. Payment information is encrypted and
            transmitted directly to our payment processor using industry-standard SSL/TLS encryption.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">2.3 Automatically Collected Information</h3>
          <p className="text-gray-700 mb-4">
            When you access our Service, we automatically collect certain information about your device and usage:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
            <li><strong>Usage Data:</strong> Pages visited, time spent, links clicked, search queries</li>
            <li><strong>Location Data:</strong> General location based on IP address (not precise GPS unless you grant permission)</li>
            <li><strong>Cookies and Tracking:</strong> We use cookies, web beacons, and similar technologies (see Section 6)</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">2.4 Shopping and Preference Information</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Order history and purchase patterns</li>
            <li>Service preferences and favorites</li>
            <li>Shopping cart contents</li>
            <li>Dietary preferences and restrictions (if provided)</li>
            <li>Delivery/pickup preferences and saved time slots</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
          <p className="text-gray-700 mb-4">
            We use the information we collect for the following purposes:
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.1 Order Fulfillment</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Process and fulfill your orders</li>
            <li>Communicate about your orders (confirmations, updates, delivery notifications)</li>
            <li>Coordinate delivery or pickup</li>
            <li>Handle returns, refunds, and customer service requests</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.2 Account Management</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Create and manage your account</li>
            <li>Authenticate your identity and prevent fraud</li>
            <li>Provide customer support</li>
            <li>Send administrative information and service updates</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.3 Personalization</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Personalize your shopping experience</li>
            <li>Recommend services based on your preferences</li>
            <li>Remember your delivery addresses and payment methods</li>
            <li>Show relevant promotions and deals</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.4 Marketing Communications</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Send promotional emails about new services, sales, and special offers (you can opt out)</li>
            <li>Notify you about abandoned carts</li>
            <li>Share relevant content and newsletters</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.5 Analytics and Improvement</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Analyze usage patterns and trends</li>
            <li>Improve our website and services</li>
            <li>Test new features and functionality</li>
            <li>Monitor and prevent fraud and security issues</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.6 Legal Compliance</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Comply with legal obligations and regulations</li>
            <li>Enforce our Terms of Service</li>
            <li>Protect our rights and property</li>
            <li>Respond to legal requests from authorities</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. How We Share Your Information</h2>
          <p className="text-gray-700 mb-4">
            We do not sell your personal information. We may share your information in the following circumstances:
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.1 Service Providers</h3>
          <p className="text-gray-700 mb-4">
            We share information with third-party service providers who perform services on our behalf:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li><strong>Payment Processors:</strong> To process credit card and other payment transactions</li>
            <li><strong>Delivery Services:</strong> To fulfill delivery orders</li>
            <li><strong>Cloud Hosting:</strong> Firebase/Google Cloud Platform for secure data storage</li>
            <li><strong>Email Services:</strong> To send transactional and marketing emails</li>
            <li><strong>Analytics Providers:</strong> To analyze website usage and performance</li>
            <li><strong>Customer Support Tools:</strong> To provide customer service</li>
          </ul>
          <p className="text-gray-700 mb-4">
            These service providers are contractually obligated to protect your information and only use it for
            the purposes we specify.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.2 Legal Requirements</h3>
          <p className="text-gray-700 mb-4">
            We may disclose your information if required by law or in response to:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Court orders, subpoenas, or other legal processes</li>
            <li>Requests from government agencies or law enforcement</li>
            <li>Situations involving potential threats to safety</li>
            <li>Protection of our legal rights and property</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.3 Business Transfers</h3>
          <p className="text-gray-700 mb-4">
            In the event of a merger, acquisition, reorganization, or sale of assets, your information may be
            transferred to the acquiring entity. You will be notified of any such change.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
          <p className="text-gray-700 mb-4">
            We implement appropriate technical and organizational measures to protect your personal information:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li><strong>Encryption:</strong> SSL/TLS encryption for data transmission</li>
            <li><strong>Secure Storage:</strong> Firebase security rules and authentication</li>
            <li><strong>Access Controls:</strong> Role-based access for employees and administrators</li>
            <li><strong>Regular Audits:</strong> Security assessments and monitoring</li>
            <li><strong>Payment Security:</strong> PCI-DSS compliant payment processing</li>
          </ul>
          <p className="text-gray-700 mb-4">
            However, no method of transmission over the Internet or electronic storage is 100% secure. While we
            strive to use commercially acceptable means to protect your information, we cannot guarantee absolute
            security.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Cookies and Tracking Technologies</h2>
          <p className="text-gray-700 mb-4">
            We use cookies and similar tracking technologies to enhance your experience:
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">6.1 Types of Cookies</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li><strong>Essential Cookies:</strong> Required for website functionality (authentication, shopping cart)</li>
            <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
            <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our site</li>
            <li><strong>Marketing Cookies:</strong> Track visits across websites for advertising purposes</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">6.2 Your Cookie Choices</h3>
          <p className="text-gray-700 mb-4">
            Most browsers automatically accept cookies, but you can modify your browser settings to decline cookies.
            However, this may prevent you from taking full advantage of our Service. You can also use browser
            extensions or privacy tools to manage tracking.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Privacy Rights</h2>
          <p className="text-gray-700 mb-4">
            Depending on your location, you may have the following rights regarding your personal information:
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">7.1 Access and Portability</h3>
          <p className="text-gray-700 mb-4">
            You have the right to request a copy of the personal information we hold about you and to receive
            it in a portable format.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">7.2 Correction</h3>
          <p className="text-gray-700 mb-4">
            You can update or correct your account information at any time by logging into your account settings.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">7.3 Deletion</h3>
          <p className="text-gray-700 mb-4">
            You can request that we delete your personal information, subject to certain legal exceptions (e.g.,
            we may need to retain order history for accounting purposes).
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">7.4 Opt-Out of Marketing</h3>
          <p className="text-gray-700 mb-4">
            You can opt out of marketing emails by clicking the &quot;unsubscribe&quot; link in any marketing email or by
            updating your email preferences in your account settings. You will still receive transactional emails
            related to your orders.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">7.5 Do Not Track</h3>
          <p className="text-gray-700 mb-4">
            Some browsers have &quot;Do Not Track&quot; features. Currently, there is no industry standard for responding
            to Do Not Track signals, so we do not respond to them.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">7.6 Exercising Your Rights</h3>
          <p className="text-gray-700 mb-4">
            To exercise any of these rights, please contact us at{' '}
            <a href={`mailto:${email}`} className="text-primary-600 hover:text-primary-700">
              {email}
            </a>
            . We will respond to your request within 30 days.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Retention</h2>
          <p className="text-gray-700 mb-4">
            We retain your personal information for as long as necessary to fulfill the purposes outlined in this
            Privacy Policy, unless a longer retention period is required by law. Specifically:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li><strong>Account Information:</strong> Retained while your account is active</li>
            <li><strong>Order History:</strong> Retained for 7 years for tax and accounting purposes</li>
            <li><strong>Marketing Data:</strong> Retained until you opt out or request deletion</li>
            <li><strong>Analytics Data:</strong> Anonymized after 26 months</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Children&apos;s Privacy</h2>
          <p className="text-gray-700 mb-4">
            Our Service is not directed to children under 13 years of age. We do not knowingly collect personal
            information from children under 13. If you are a parent or guardian and believe your child has provided
            us with personal information, please contact us, and we will delete such information.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Third-Party Links</h2>
          <p className="text-gray-700 mb-4">
            Our Service may contain links to third-party websites or services. We are not responsible for the
            privacy practices of these third parties. We encourage you to read their privacy policies before
            providing any information.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. International Data Transfers</h2>
          <p className="text-gray-700 mb-4">
            Your information may be transferred to and processed in countries other than your country of residence.
            These countries may have different data protection laws. By using our Service, you consent to the
            transfer of your information to the United States and other countries where we operate.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. California Privacy Rights (CCPA)</h2>
          <p className="text-gray-700 mb-4">
            If you are a California resident, you have additional rights under the California Consumer Privacy Act:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Right to know what personal information is collected, used, shared, or sold</li>
            <li>Right to delete personal information (subject to exceptions)</li>
            <li>Right to opt out of the sale of personal information (we do not sell your information)</li>
            <li>Right to non-discrimination for exercising your privacy rights</li>
          </ul>
          <p className="text-gray-700 mb-4">
            To exercise these rights, contact us at{' '}
            <a href={`mailto:${email}`} className="text-primary-600 hover:text-primary-700">
              {email}
            </a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. European Privacy Rights (GDPR)</h2>
          <p className="text-gray-700 mb-4">
            If you are located in the European Economic Area (EEA), you have rights under the General Data
            Protection Regulation (GDPR), including:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Right to access your personal data</li>
            <li>Right to rectification of inaccurate data</li>
            <li>Right to erasure (&quot;right to be forgotten&quot;)</li>
            <li>Right to restrict processing</li>
            <li>Right to data portability</li>
            <li>Right to object to processing</li>
            <li>Right to withdraw consent</li>
          </ul>
          <p className="text-gray-700 mb-4">
            Our legal basis for processing your data includes: performance of contract, legitimate interests,
            and your consent. You may lodge a complaint with your local data protection authority.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Changes to This Privacy Policy</h2>
          <p className="text-gray-700 mb-4">
            We may update this Privacy Policy from time to time. We will notify you of any material changes by
            posting the new Privacy Policy on this page and updating the &quot;Last Updated&quot; date. We may also send
            you an email notification for significant changes.
          </p>
          <p className="text-gray-700 mb-4">
            Your continued use of the Service after any changes indicates your acceptance of the updated policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Contact Us</h2>
          <p className="text-gray-700 mb-4">
            If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices,
            please contact us:
          </p>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-gray-700 mb-2">
              <strong>Privacy Officer</strong>
            </p>
            <p className="text-gray-700 mb-2">
              <strong>Email:</strong>{' '}
              <a href={`mailto:${email}`} className="text-primary-600 hover:text-primary-700">
                {email}
              </a>
            </p>
            <p className="text-gray-700 mb-2">
              <strong>Phone:</strong> {phone}
            </p>
            <p className="text-gray-700 mb-2">
              <strong>Mail:</strong> {businessName} Privacy Department, {address}
            </p>
            <p className="text-gray-700">
              <strong>Contact Form:</strong>{' '}
              <Link href="/contact" className="text-primary-600 hover:text-primary-700">
                Visit our contact page
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
