import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { getStoreSettings } from '@/services/business-info-service';

export const metadata: Metadata = {
  title: 'Return & Refund Policy | Local Market',
  description: 'Learn about our return and refund policy for fresh and local services',
};

export default async function ReturnsPage() {
  const settings = await getStoreSettings();
  const businessName = settings.businessName || 'Local Market';
  const email = settings.email || 'support@localmarket.com';
  const phone = settings.phone || '[Your Phone Number]';
  const address = settings.address
    ? `${settings.address.street}, ${settings.address.city}, ${settings.address.state} ${settings.address.zipCode}`
    : '[Your Address]';
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Return & Refund Policy</h1>
      <p className="text-gray-600 mb-8">Last Updated: January 2025</p>

      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Commitment to Quality</h2>
          <p className="text-gray-700 mb-4">
            At {businessName}, we&apos;re committed to providing you with the freshest, highest-quality services from
            local farmers and vendors. We stand behind everything we sell and want you to be completely satisfied
            with your purchase.
          </p>
          <p className="text-gray-700 mb-4">
            If you&apos;re not 100% satisfied with any service, we&apos;ll make it right. This policy explains how our
            return and refund process works.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How to Request a Refund or Return</h2>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.1 Contact Methods</h3>
          <p className="text-gray-700 mb-4">
            You can request a refund or report an issue through:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li><strong>Email:</strong> <a href={`mailto:${email}`} className="text-primary-600 hover:text-primary-700">{email}</a></li>
            <li><strong>Phone:</strong> {phone} (Mon-Sat, 8am-6pm)</li>
            <li><strong>Contact Form:</strong> <Link href="/contact" className="text-primary-600 hover:text-primary-700">Visit our contact page</Link></li>
            <li><strong>Account Portal:</strong> Log in and go to Order History → Select Order → Request Refund</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.2 Information to Provide</h3>
          <p className="text-gray-700 mb-4">
            To expedite your request, please include:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Order number and date</li>
            <li>Product name(s) and SKU if available</li>
            <li>Description of the issue</li>
            <li>Photos of damaged, spoiled, or incorrect items (when applicable)</li>
            <li>Your preferred resolution (refund, replacement, or store credit)</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.3 Response Time</h3>
          <p className="text-gray-700 mb-4">
            We strive to respond to all refund and return requests within:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li><strong>Quality Issues:</strong> Same business day (if reported during business hours)</li>
            <li><strong>General Returns:</strong> 1-2 business days</li>
            <li><strong>Refund Processing:</strong> 5-7 business days after approval</li>
          </ul>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Changes to This Policy</h2>
          <p className="text-gray-700 mb-4">
            We may update this Return & Refund Policy from time to time. Changes will be posted on this page
            with an updated &quot;Last Updated&quot; date. Please review this policy periodically.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Contact Us</h2>
          <p className="text-gray-700 mb-4">
            Questions about returns or refunds? We&apos;re here to help:
          </p>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-gray-700 mb-2">
              <strong>Customer Support Team - {businessName}</strong>
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
              <strong>Address:</strong> {address}
            </p>
            <p className="text-gray-700 mb-2">
              <strong>Hours:</strong> Monday-Saturday, 8:00 AM - 6:00 PM
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
