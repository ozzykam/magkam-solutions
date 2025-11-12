import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { getStoreSettings } from '@/services/business-info-service';

export const metadata: Metadata = {
  title: 'Return & Refund Policy | Local Market',
  description: 'Learn about our return and refund policy for fresh and local products',
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
            At {businessName}, we&apos;re committed to providing you with the freshest, highest-quality products from
            local farmers and vendors. We stand behind everything we sell and want you to be completely satisfied
            with your purchase.
          </p>
          <p className="text-gray-700 mb-4">
            If you&apos;re not 100% satisfied with any product, we&apos;ll make it right. This policy explains how our
            return and refund process works.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Fresh and Perishable Products</h2>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">1.1 Product Quality Issues</h3>
          <p className="text-gray-700 mb-4">
            For fresh produce, dairy, meat, seafood, and other perishable items:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li><strong>Quality Concerns:</strong> If a product is damaged, spoiled, or not up to our quality standards</li>
            <li><strong>Incorrect Items:</strong> If you received the wrong product or quantity</li>
            <li><strong>Missing Items:</strong> If items from your order are missing</li>
            <li><strong>Damaged in Transit:</strong> If products were damaged during delivery</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">1.2 Timeframe for Fresh Products</h3>
          <p className="text-gray-700 mb-4">
            Due to the perishable nature of fresh products, quality issues must be reported:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li><strong>Within 24 hours</strong> of delivery or pickup</li>
            <li>With photographic evidence of the issue (when possible)</li>
            <li>Before consuming or disposing of the product (if safe to retain)</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">1.3 Resolution Options</h3>
          <p className="text-gray-700 mb-4">
            For quality issues with perishable products, we offer:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li><strong>Full Refund:</strong> Credit back to your original payment method</li>
            <li><strong>Store Credit:</strong> Account credit for future purchases (typically 10% bonus)</li>
            <li><strong>Replacement:</strong> Same product delivered in your next order (when available)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Non-Perishable Products</h2>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">2.1 Return Eligibility</h3>
          <p className="text-gray-700 mb-4">
            Non-perishable items (canned goods, dry goods, packaged products) may be returned if:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>The product is unopened and in original condition</li>
            <li>You have your order confirmation or receipt</li>
            <li>The product is within its best-by/expiration date</li>
            <li>The return is requested within 14 days of purchase</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">2.2 Non-Returnable Items</h3>
          <p className="text-gray-700 mb-4">
            For health and safety reasons, the following cannot be returned once received:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Opened food items or packages with broken seals</li>
            <li>Fresh produce, meat, poultry, or seafood (unless quality issue)</li>
            <li>Dairy products and eggs (unless quality issue)</li>
            <li>Prepared or hot foods</li>
            <li>Personal care items that have been opened</li>
            <li>Items marked as &quot;final sale&quot; or &quot;clearance&quot;</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">2.3 Return Process</h3>
          <p className="text-gray-700 mb-4">
            To return eligible non-perishable items:
          </p>
          <ol className="list-decimal pl-6 text-gray-700 space-y-2 mb-4">
            <li>Contact us within 14 days of receiving your order</li>
            <li>Provide your order number and reason for return</li>
            <li>Return items during your next pickup or delivery, or bring to our location</li>
            <li>Items must be unopened and in original condition</li>
          </ol>
          <p className="text-gray-700 mb-4">
            Refunds will be processed within 5-7 business days after we receive the returned items.
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
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Refund Methods</h2>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.1 Original Payment Method</h3>
          <p className="text-gray-700 mb-4">
            Refunds are typically issued to your original payment method:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li><strong>Credit/Debit Card:</strong> 5-7 business days for funds to appear</li>
            <li><strong>Bank Account:</strong> 3-5 business days</li>
            <li>Note: Processing time may vary depending on your financial institution</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.2 Store Credit</h3>
          <p className="text-gray-700 mb-4">
            You may choose store credit instead of a refund:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li><strong>Instant Processing:</strong> Credit appears in your account immediately</li>
            <li><strong>Bonus Credit:</strong> Receive 10% extra when choosing store credit</li>
            <li><strong>No Expiration:</strong> Use your credit anytime</li>
            <li><strong>Flexible Use:</strong> Apply to any future purchase</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.3 Partial Refunds</h3>
          <p className="text-gray-700 mb-4">
            Partial refunds may be issued for:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Items received in less than perfect condition but still usable</li>
            <li>Discounted replacement items when originals are unavailable</li>
            <li>Cases resolved through customer service discretion</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Delivery Issues</h2>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">5.1 Missed Deliveries</h3>
          <p className="text-gray-700 mb-4">
            If you missed your delivery window:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Contact us immediately to reschedule</li>
            <li>We&apos;ll attempt redelivery based on availability</li>
            <li>Perishable items may not be refundable if customer unavailable</li>
            <li>We&apos;ll work with you to find the best solution</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">5.2 Incorrect Address</h3>
          <p className="text-gray-700 mb-4">
            If you provided an incorrect delivery address:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Contact us as soon as possible to update</li>
            <li>Redelivery fees may apply</li>
            <li>Refunds may not be available if delivery was successful to provided address</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">5.3 Package Not Received</h3>
          <p className="text-gray-700 mb-4">
            If your order shows delivered but you didn&apos;t receive it:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Check with household members and neighbors</li>
            <li>Look around your delivery location (porch, garage, etc.)</li>
            <li>Contact us within 24 hours of delivery confirmation</li>
            <li>We&apos;ll investigate with our delivery team</li>
            <li>Refund or replacement issued after investigation</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Temperature-Sensitive Products</h2>
          <p className="text-gray-700 mb-4">
            We take special care with temperature-sensitive items (frozen, refrigerated):
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li><strong>Insulated Packaging:</strong> Items packed with ice packs and insulation</li>
            <li><strong>Time Windows:</strong> Strict adherence to delivery schedules</li>
            <li><strong>Quality Guarantee:</strong> Items should arrive cold/frozen</li>
          </ul>
          <p className="text-gray-700 mb-4">
            If temperature-sensitive items arrive warm or thawed:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Report immediately with photos</li>
            <li>Do not consume potentially unsafe products</li>
            <li>Full refund or replacement provided</li>
            <li>We&apos;ll investigate our cold-chain process</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Substitutions</h2>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">7.1 When Substitutions Occur</h3>
          <p className="text-gray-700 mb-4">
            If an item is out of stock, we may substitute with a similar product of equal or greater value.
            We&apos;ll always try to contact you first when possible.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">7.2 Substitution Policy</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Substitutions will be of comparable quality and value</li>
            <li>You&apos;ll never pay more for a substitution</li>
            <li>If the substitute costs less, you&apos;ll be refunded the difference</li>
            <li>You may refuse any substitution at delivery</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">7.3 Refusing Substitutions</h3>
          <p className="text-gray-700 mb-4">
            If you don&apos;t want a substituted item:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Inform our delivery person at the time of delivery</li>
            <li>Contact us within 24 hours for a refund</li>
            <li>Update your account preferences to disable substitutions</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Special Orders and Custom Items</h2>
          <p className="text-gray-700 mb-4">
            Items specially ordered at your request:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>May not be returnable (you&apos;ll be informed at time of order)</li>
            <li>Are still covered by our quality guarantee</li>
            <li>May require advance payment</li>
            <li>Cancellations must be made at least 48 hours before fulfillment</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Bulk and Wholesale Orders</h2>
          <p className="text-gray-700 mb-4">
            For bulk or wholesale orders:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Different return policies may apply</li>
            <li>Returns subject to 15% restocking fee (except quality issues)</li>
            <li>Must be returned within 7 days</li>
            <li>Contact your account representative for specific terms</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Refund Exceptions</h2>
          <p className="text-gray-700 mb-4">
            We reserve the right to deny refunds or returns if:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>The request is made outside our specified timeframes</li>
            <li>There&apos;s evidence of misuse or improper storage</li>
            <li>Items were damaged after delivery due to customer negligence</li>
            <li>There&apos;s a pattern of excessive returns indicating abuse</li>
            <li>The product was consumed before reporting the issue</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Customer Satisfaction Guarantee</h2>
          <div className="bg-primary-50 border-l-4 border-primary-500 p-6 mb-4">
            <p className="text-gray-900 font-semibold mb-2">
              We&apos;re committed to your satisfaction
            </p>
            <p className="text-gray-700">
              If something isn&apos;t right, we&apos;ll make it right. Our goal is to ensure you have a great experience
              with every order. Don&apos;t hesitate to reach out if you have any concerns about product quality,
              delivery, or your overall experience with {businessName}.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Prevention Tips</h2>
          <p className="text-gray-700 mb-4">
            To help ensure the best experience:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li><strong>Inspect Upon Delivery:</strong> Check your order as soon as you receive it</li>
            <li><strong>Proper Storage:</strong> Refrigerate or freeze perishables immediately</li>
            <li><strong>Check Dates:</strong> Note best-by and use-by dates on products</li>
            <li><strong>Contact Us Quickly:</strong> Report issues within 24 hours</li>
            <li><strong>Save Packaging:</strong> Keep packaging for potential returns</li>
            <li><strong>Take Photos:</strong> Document any quality issues</li>
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
