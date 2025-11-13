import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {
  HeartIcon,
  UserGroupIcon,
  SparklesIcon,
  TruckIcon,
  ShieldCheckIcon,
  GlobeAmericasIcon
} from '@heroicons/react/24/outline';
import { getStoreSettings } from '@/services/business-info-service';
import { getSEOForRoute, applyTemplateVariables } from '@/services/seo-service';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  const businessName = settings.businessName || 'Local Market';

  // Get SEO settings from admin configuration
  const seoConfig = await getSEOForRoute('/about');

  // Apply template variables to title and description
  const title = seoConfig.title
    ? applyTemplateVariables(seoConfig.title, { businessName })
    : `About Us | ${businessName}`;

  const description = seoConfig.description
    ? applyTemplateVariables(seoConfig.description, { businessName })
    : `Learn about ${businessName} - connecting communities through fresh, local food. Supporting local farmers and artisans.`;

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

export default function AboutPage() {
  const values = [
    {
      icon: HeartIcon,
      title: 'Community First',
      description: 'We believe in supporting local farmers and artisans, creating a thriving community marketplace.',
    },
    {
      icon: SparklesIcon,
      title: 'Quality Services',
      description: 'Every service is carefully selected to ensure you receive the freshest, highest-quality goods.',
    },
    {
      icon: TruckIcon,
      title: 'Fresh & Fast',
      description: 'From farm to table in record time. Most deliveries arrive within 24 hours of harvest.',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Trust & Transparency',
      description: 'Know exactly where your food comes from and meet the people who grow it.',
    },
    {
      icon: GlobeAmericasIcon,
      title: 'Sustainability',
      description: 'Supporting local reduces carbon footprint and promotes sustainable farming practices.',
    },
    {
      icon: UserGroupIcon,
      title: 'Community Impact',
      description: 'Every purchase directly supports local families and strengthens our community.',
    },
  ];

  const stats = [
    { label: 'Average Monthly Visitors', value: '100,000+' },
    { label: 'Satisfied Clients', value: '150+' },
    { label: 'Successful Launches', value: '200+' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Websites & Digital Services That Empower Your Business 
              </h1>
              <p className="text-xl md:text-2xl text-primary-100 max-w-3xl mx-auto">
                We&apos;re more than just a digital agency – we&apos;re a bridge between business owners
                and communities who believe in quality, sustainability, and local impact.
              </p>
            </div>
          </div>
        </div>

        {/* Our Story Section */}
        <div className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="text-lg text-gray-600 space-y-4">
                <p>
                  Local Market was born from a simple idea: what if getting fresh,
                  locally-grown food was as easy as ordering online? We saw talented farmers
                  and artisans struggling to reach customers, while those customers were searching
                  for fresh, quality services.
                </p>
                <p>
                  Today, we&apos;ve created a thriving marketplace that brings together the best local
                  vendors and conscious consumers. Every purchase you make supports local families,
                  reduces environmental impact, and strengthens our community.
                </p>
                <p>
                  We&apos;re proud to be part of a movement toward sustainable, local food systems –
                  and we&apos;re just getting started.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl font-bold text-primary-600 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                These principles guide everything we do and every decision we make.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-lg border-2 border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <value.icon className="w-6 h-6 text-primary-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {value.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {value.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-gradient-to-b from-gray-50 to-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Getting fresh, local services delivered to your door is simple
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                  Browse & Shop
                </h3>
                <p className="text-gray-600">
                  Explore services from local vendors. Filter by tags, vendors, or search for exactly what you need.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                  Place Your Order
                </h3>
                <p className="text-gray-600">
                  Add items to your cart and checkout. Choose delivery or pickup, and select your preferred time slot.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                  Enjoy Fresh Services
                </h3>
                <p className="text-gray-600">
                  Receive your order and enjoy the freshest services from your community. Support local, eat well.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-primary-600 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Support Local?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join thousands of customers who choose fresh, local, and sustainable.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/shop"
                className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Start Shopping
              </Link>
              <Link
                href="/contact"
                className="bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-800 transition-colors border-2 border-white"
              >
                Get In Touch
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
