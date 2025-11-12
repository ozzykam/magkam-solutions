import React from 'react';
import { Metadata } from 'next';
import { getStoreSettings } from '@/services/business-info-service';
import { getSEOForRoute, applyTemplateVariables } from '@/services/seo-service';
import ContactPageContent from '@/components/contact/ContactPageContent';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  const businessName = settings.businessName || 'Local Market';

  // Get SEO settings from admin configuration
  const seoConfig = await getSEOForRoute('/contact');

  // Apply template variables to title and description
  const title = seoConfig.title
    ? applyTemplateVariables(seoConfig.title, { businessName })
    : `Contact Us | ${businessName}`;

  const description = seoConfig.description
    ? applyTemplateVariables(seoConfig.description, { businessName })
    : `Get in touch with ${businessName}. We're here to answer your questions and help you find the perfect local products.`;

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

export default function ContactPage() {
  return <ContactPageContent />;
}
