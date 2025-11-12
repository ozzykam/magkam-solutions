import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { getStoreSettings } from '@/services/business-info-service';
import { getSEOForRoute, applyTemplateVariables } from '@/services/seo-service';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  const businessName = settings.businessName || 'Local Market';

  // Get SEO settings from admin configuration
  const seoConfig = await getSEOForRoute('/terms');

  // Apply template variables to title and description
  const title = seoConfig.title
    ? applyTemplateVariables(seoConfig.title, { businessName })
    : `Terms of Service | ${businessName}`;

  const description = seoConfig.description
    ? applyTemplateVariables(seoConfig.description, { businessName })
    : `Terms and conditions for using ${businessName} services. Read our policies on orders, payments, delivery, and user conduct.`;

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

export default async function TermsPage() {
  const settings = await getStoreSettings();
  const businessName = settings.businessName || 'Local Market';
  const email = settings.email || 'legal@localmarket.com';
  const phone = settings.phone || '[Your Phone Number]';
  const address = settings.address
    ? `${settings.address.street}, ${settings.address.city}, ${settings.address.state} ${settings.address.zipCode}`
    : '[Your Address]';
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-gray-600 mb-8">Last Updated: October 2025</p>

      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-700 mb-4">
            By accessing and using {businessName} (&quot;the Service&quot;), you accept and agree to be bound by the terms
            and provision of this agreement. If you do not agree to these Terms of Service, please do not use
            our Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Account Registration</h2>
          <p className="text-gray-700 mb-4">
            To access certain features of the Service, you may be required to create an account. You agree to:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Provide accurate, current, and complete information during registration</li>
            <li>Maintain and promptly update your account information</li>
            <li>Maintain the security of your password and accept all risks of unauthorized access</li>
            <li>Notify us immediately of any unauthorized use of your account</li>
            <li>Be responsible for all activities that occur under your account</li>
          </ul>
          <p className="text-gray-700">
            We reserve the right to suspend or terminate your account if any information provided proves to be
            inaccurate, false, or violates these terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Orders and Payments</h2>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.1 Order Placement</h3>
          <p className="text-gray-700 mb-4">
            When you place an order through our Service, you are making an offer to purchase products at the
            stated price. All orders are subject to acceptance and availability. We reserve the right to refuse
            or cancel any order for any reason, including:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Product unavailability or out of stock</li>
            <li>Errors in product or pricing information</li>
            <li>Suspected fraudulent or unauthorized transactions</li>
            <li>Orders that cannot be fulfilled for any reason</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.2 Pricing</h3>
          <p className="text-gray-700 mb-4">
            All prices are displayed in USD and are subject to change without notice. We make every effort to
            ensure pricing accuracy, but errors may occur. If a product&apos;s correct price is higher than stated,
            we will either contact you before shipping or cancel your order and notify you.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.3 Payment</h3>
          <p className="text-gray-700 mb-4">
            Payment is required at the time of order placement. We accept major credit cards and other payment
            methods as indicated on our checkout page. By providing payment information, you represent that you
            are authorized to use the payment method and authorize us to charge the total amount including taxes
            and delivery fees.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Delivery and Pickup</h2>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.1 Delivery Times</h3>
          <p className="text-gray-700 mb-4">
            We offer scheduled delivery and pickup time slots. While we strive to meet all scheduled times,
            delivery windows are estimates and not guaranteed. Delays may occur due to weather, traffic, or
            other unforeseen circumstances.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.2 Delivery Requirements</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Someone 21 years or older must be present to receive orders containing age-restricted items</li>
            <li>You must provide accurate delivery address and contact information</li>
            <li>Orders may be left at your door for contactless delivery unless otherwise specified</li>
            <li>You are responsible for inspecting your order upon delivery</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.3 Pickup Orders</h3>
          <p className="text-gray-700 mb-4">
            For pickup orders, you must collect your order during your selected time slot. Orders not collected
            within 24 hours may be canceled without refund. You may need to show identification and order
            confirmation when collecting your order.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Product Information</h2>
          <p className="text-gray-700 mb-4">
            We make every effort to display products accurately with detailed descriptions and images. However:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Colors and images may vary slightly from actual products</li>
            <li>Product weights and sizes are approximate</li>
            <li>Fresh produce quality may vary based on seasonal availability</li>
            <li>Product substitutions may occur for out-of-stock items (we will contact you when possible)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. User Conduct</h2>
          <p className="text-gray-700 mb-4">You agree not to:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Use the Service for any unlawful purpose or in violation of these terms</li>
            <li>Impersonate any person or entity or misrepresent your affiliation</li>
            <li>Interfere with or disrupt the Service or servers</li>
            <li>Attempt to gain unauthorized access to any portion of the Service</li>
            <li>Engage in any automated use of the system (bots, scrapers, etc.)</li>
            <li>Submit false or misleading information</li>
            <li>Engage in fraudulent activity or abuse of promotional offers</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Returns and Refunds</h2>
          <p className="text-gray-700 mb-4">
            Please refer to our <Link href="/returns" className="text-primary-600 hover:text-primary-700">Return and Refund Policy</Link> for
            detailed information about returns, refunds, and product satisfaction guarantees.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Intellectual Property</h2>
          <p className="text-gray-700 mb-4">
            The Service and its original content, features, and functionality are owned by {businessName} and are
            protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
          </p>
          <p className="text-gray-700 mb-4">
            You may not copy, modify, distribute, sell, or lease any part of our Service without our prior
            written consent.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Limitation of Liability</h2>
          <p className="text-gray-700 mb-4">
            To the maximum extent permitted by law, {businessName} shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred
            directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Your access to or use of or inability to access or use the Service</li>
            <li>Any conduct or content of any third party on the Service</li>
            <li>Unauthorized access, use, or alteration of your transmissions or content</li>
            <li>Food-borne illness or allergic reactions to products purchased</li>
          </ul>
          <p className="text-gray-700 mb-4">
            Our total liability to you for any claim arising from or relating to the Service shall not exceed
            the amount you paid to us in the twelve (12) months preceding the claim.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Food Safety and Allergens</h2>
          <p className="text-gray-700 mb-4">
            While we strive to provide accurate product information including allergen warnings:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>You are responsible for reading all product labels and ingredients</li>
            <li>Products may contain or have been processed in facilities with common allergens</li>
            <li>Cross-contamination may occur during processing, packaging, or delivery</li>
            <li>We are not liable for allergic reactions or food-borne illnesses</li>
            <li>Consult product packaging and manufacturer information for complete allergen details</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Modifications to Service</h2>
          <p className="text-gray-700 mb-4">
            We reserve the right to modify, suspend, or discontinue the Service (or any part thereof) at any time
            with or without notice. We shall not be liable to you or any third party for any modification,
            suspension, or discontinuance of the Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to Terms</h2>
          <p className="text-gray-700 mb-4">
            We reserve the right to update or modify these Terms of Service at any time. We will notify you of
            any changes by posting the new Terms of Service on this page and updating the &quot;Last Updated&quot; date.
            Your continued use of the Service after any such changes constitutes your acceptance of the new terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Governing Law</h2>
          <p className="text-gray-700 mb-4">
            These Terms shall be governed and construed in accordance with the laws of the United States, without
            regard to its conflict of law provisions. Any disputes arising from these terms or the Service shall
            be resolved in the courts of the applicable jurisdiction.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Severability</h2>
          <p className="text-gray-700 mb-4">
            If any provision of these Terms is found to be unenforceable or invalid, that provision shall be
            limited or eliminated to the minimum extent necessary so that these Terms shall otherwise remain in
            full force and effect.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Contact Information</h2>
          <p className="text-gray-700 mb-4">
            If you have any questions about these Terms of Service, please contact us:
          </p>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-gray-700 mb-2">
              <strong>Email:</strong> <a href={`mailto:${email}`} className="text-primary-600 hover:text-primary-700">{email}</a>
            </p>
            <p className="text-gray-700 mb-2">
              <strong>Phone:</strong> {phone}
            </p>
            <p className="text-gray-700 mb-2">
              <strong>Mail:</strong> {businessName} Legal Department, {address}
            </p>
            <p className="text-gray-700">
              <strong>Contact Form:</strong> <Link href="/contact" className="text-primary-600 hover:text-primary-700">Visit our contact page</Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
