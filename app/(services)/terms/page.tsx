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
  const businessName = settings.businessName || 'MagKam Solutions';
  const email = settings.email || 'aziz@magkam.com';
  const phone = settings.phone || '[your number here]';
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
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Services and Project Agreements</h2>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.1 Service Offerings</h3>
          <p className="text-gray-700 mb-4">
            {businessName} provides custom software development services including but not limited to:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Custom website development (Next.js, React, Angular)</li>
            <li>Mobile application development (React Native, iOS, Android)</li>
            <li>Custom ecommerce platforms and marketplaces</li>
            <li>Custom software solutions (CRMs, SaaS platforms, internal tools)</li>
            <li>Technical consulting and code review services</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.2 Project Proposals and Pricing</h3>
          <p className="text-gray-700 mb-4">
            All projects begin with a consultation and written proposal outlining scope, deliverables, timeline,
            and pricing. Pricing is project-specific and based on complexity, features, and estimated development time.
            All prices are quoted in USD. We reserve the right to decline projects that are not a good fit or that
            fall outside our area of expertise.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.3 Payment Terms</h3>
          <p className="text-gray-700 mb-4">
            Payment terms are specified in individual project agreements and typically include:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Initial deposit (typically 30-50%) required before work begins</li>
            <li>Milestone payments for larger projects</li>
            <li>Final payment due upon project completion and delivery</li>
            <li>Monthly retainer payments for ongoing maintenance and support services</li>
          </ul>
          <p className="text-gray-700 mb-4">
            We accept payment via credit card, ACH transfer, or other methods as specified in your project agreement.
            Late payments may result in suspension of work or termination of services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Project Delivery and Timelines</h2>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.1 Project Timelines</h3>
          <p className="text-gray-700 mb-4">
            Project timelines are estimates provided in good faith based on the defined scope of work. Actual
            delivery dates may vary due to:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Changes in project scope or requirements</li>
            <li>Delays in client feedback or approval</li>
            <li>Technical challenges or third-party service dependencies</li>
            <li>Force majeure events beyond our reasonable control</li>
          </ul>
          <p className="text-gray-700 mb-4">
            While we make every effort to meet agreed timelines, they are not guaranteed unless specifically
            stated as a hard deadline in the project agreement.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.2 Client Responsibilities</h3>
          <p className="text-gray-700 mb-4">Timely project completion requires client cooperation, including:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Providing necessary content, assets, and access credentials</li>
            <li>Responding to requests for feedback within agreed timeframes</li>
            <li>Making timely decisions on design and functionality choices</li>
            <li>Completing testing and providing feedback during review periods</li>
          </ul>
          <p className="text-gray-700 mb-4">
            Delays caused by client non-responsiveness or late delivery of required materials may result in
            project timeline extensions and potential additional costs.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.3 Project Delivery and Handoff</h3>
          <p className="text-gray-700 mb-4">
            Upon project completion, we will deliver all agreed-upon deliverables including source code,
            documentation, and deployment instructions as specified in the project agreement. You are
            responsible for reviewing deliverables and reporting any issues within the agreed warranty period.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Intellectual Property and Ownership</h2>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">5.1 Code Ownership</h3>
          <p className="text-gray-700 mb-4">
            Unless otherwise specified in the project agreement, upon full payment, you will receive full ownership
            of the custom code and assets developed specifically for your project. This includes:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Custom application code written for your project</li>
            <li>Custom designs and graphics created for your project</li>
            <li>Project documentation and user guides</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">5.2 Third-Party Components</h3>
          <p className="text-gray-700 mb-4">
            Projects may include third-party libraries, frameworks, and open-source components that remain under
            their respective licenses. We will inform you of any significant third-party dependencies and their
            licensing requirements.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">5.3 Portfolio Rights</h3>
          <p className="text-gray-700 mb-4">
            {businessName} reserves the right to display completed projects in our portfolio, marketing materials,
            and case studies unless otherwise agreed in writing. We will not disclose confidential business
            information without your permission.
          </p>
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
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Refunds and Cancellations</h2>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">7.1 Deposit Refunds</h3>
          <p className="text-gray-700 mb-4">
            Initial project deposits are generally non-refundable once work has commenced. If you cancel a project
            before work begins, deposits may be refunded minus any consultation time or administrative costs incurred.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">7.2 Project Cancellation</h3>
          <p className="text-gray-700 mb-4">
            Either party may terminate a project with written notice. In the event of cancellation:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Client will pay for all work completed up to the cancellation date</li>
            <li>{businessName} will deliver any completed work or work-in-progress</li>
            <li>Remaining deposits or prepayments will be refunded after deducting costs for work performed</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">7.3 Satisfaction and Revisions</h3>
          <p className="text-gray-700 mb-4">
            Project agreements include a specified number of revision rounds. We will work with you to ensure
            satisfaction within the agreed scope. Additional revisions beyond the agreed amount may incur
            additional fees. Please refer to our <Link href="/returns" className="text-primary-600 hover:text-primary-700">Refund Policy</Link> for
            more details.
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
            <li>Your access to or use of or inability to access or use the Service or delivered software</li>
            <li>Any conduct or content of any third party on the Service</li>
            <li>Unauthorized access, use, or alteration of your transmissions or content</li>
            <li>Software bugs, errors, or failures in third-party services or dependencies</li>
            <li>Business losses or damages claimed to result from software downtime or defects</li>
          </ul>
          <p className="text-gray-700 mb-4">
            Our total liability to you for any claim arising from or relating to our services shall not exceed
            the total amount you paid to us for the specific project or service in question.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Warranties and Support</h2>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">10.1 Warranty Period</h3>
          <p className="text-gray-700 mb-4">
            We provide a limited warranty on our work for a period specified in your project agreement (typically
            30-90 days after final delivery). During this period, we will fix bugs and defects in our code at no
            additional charge.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">10.2 Warranty Exclusions</h3>
          <p className="text-gray-700 mb-4">Our warranty does not cover:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Issues caused by modifications made by you or third parties</li>
            <li>Problems arising from hosting environment changes or incompatibilities</li>
            <li>Third-party service failures or API changes</li>
            <li>Feature requests or changes beyond the original scope</li>
            <li>Issues caused by improper use or deployment of the software</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">10.3 Ongoing Support and Maintenance</h3>
          <p className="text-gray-700 mb-4">
            After the warranty period, ongoing support and maintenance services are available through monthly
            retainer agreements. Support services may include bug fixes, minor updates, security patches, and
            technical assistance as specified in the support agreement.
          </p>
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
            <p className="text-gray-700">
              <strong>Contact Form:</strong> <Link href="/contact" className="text-primary-600 hover:text-primary-700">Visit our contact page</Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
