import React from 'react';
import Image from 'next/image';
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
} from '@heroicons/react/24/outline';

import { ArrowRightCircleIcon } from '@heroicons/react/24/solid';
import { getStoreSettings } from '@/services/business-info-service';
import { getSEOForRoute, applyTemplateVariables } from '@/services/seo-service';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  const businessName = settings.businessName || 'MagKam Solutions';

  // Get SEO settings from admin configuration
  const seoConfig = await getSEOForRoute('/about');

  // Apply template variables to title and description
  const title = seoConfig.title
    ? applyTemplateVariables(seoConfig.title, { businessName })
    : `About Us | ${businessName}`;

  const description = seoConfig.description
    ? applyTemplateVariables(seoConfig.description, { businessName })
    : `Learn about ${businessName} – a studio focused on building modern, maintainable websites and web applications for small businesses, creatives, and community-focused organizations.`;

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
      description:
        'We prioritize small businesses, cooperatives, and local organizations, designing tools that help them grow without sacrificing who they are.',
    },
    {
      icon: SparklesIcon,
      title: 'Modern Solutions',
      description:
        'From responsive websites to full-featured web apps, we build with modern stacks that are fast, accessible, and easy to maintain.',
    },
    {
      icon: TruckIcon,
      title: 'Smooth Delivery',
      description:
        'We keep projects moving with clear timelines, structured milestones, and a launch plan that feels organized—not chaotic.',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Trust & Transparency',
      description:
        'No buzzword soup, no surprise costs. Just honest communication, straightforward pricing, and clear expectations at every step.',
    },
    {
      icon: UserGroupIcon,
      title: 'Collaborative Process',
      description:
        'We treat every build as a partnership, working closely with you to refine features, content, and strategy so the final product actually fits your work.',
    },
  ];

  const stats = [
    { label: 'Projects Delivered', value: '20+' },
    { label: 'Industries Served', value: '5+' },
    { label: 'Avg. Response Time', value: '< 24 hrs' },
    { label: 'Customer Satisfaction', value: '100%' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <div
          className="relative text-white bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/aziz-and-crew.png)' }}
        >
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Enterprise-Quality
                <br/>Websites, Web Apps, & Mobile Apps
                <br/>for Real-World Businesses
              </h1>
              <p className="text-xl md:text-2xl text-primary-100 max-w-3xl mx-auto">
                MagKam Solutions designs and builds modern digital experiences that help
                teams of all sizes look professional, work more efficiently, and connect more
                deeply with the people they serve.
              </p>
            </div>
          </div>
        </div>

        {/* Our Story Section */}
        <div className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Our Story</h2>
              <div className="text-lg text-gray-600 space-y-4">
                {/* Image with caption - floats on larger screens */}
                <div className="float-none sm:float-left sm:mr-6 sm:mb-4 mb-6 text-center sm:w-64">
                  <Link href="https://magkam.com" target="_blank" rel="noopener noreferrer" className="block cursor-pointer">
                    <Image
                      width={300}
                      height={300}
                      src="/aziz-pic.webp"
                      alt="Aziz Kamara, Founder and Lead Developer"
                      className="w-48 sm:w-full sm:h-auto rounded-lg object-cover shadow-lg mx-auto hover:shadow-xl transition-shadow duration-200"
                    />
                  </Link>
                  <div className="mt-3">
                    <p className="font-bold text-gray-900">Aziz Kamara</p>
                    <p className="text-sm text-primary-600 font-semibold">Founder and Lead Developer</p>
                  </div>
                </div>

                <p>
                  MagKam Solutions grew out of observing an all-to-common pattern: talented
                  people running local, community-based organizations and small businesses,
                  stuck with clunky websites and tools that did not reflect the quality of the
                  important work they were doing in their communities.
                </p>
                <p>
                  We started building custom digital solutions to close that gap. Instead
                  of forcing businesses into rigid templates, we focus on understanding
                  how you operate, who you serve, and what &quot;a good day&quot; looks like for
                  you and your team.
                </p>
                <p>
                  Today, we partner with small businesses, nonprofits, and community-based
                  organizations to create websites and web applications that feel
                  intentional, reliable, and built to grow with you (and not just launched
                  then forgotten).
                </p>
                <p>
                  At MagKam Solutions, we do not simply deliver a product and disappear. We
                  partner closely with our clients, communicate clearly throughout the process,
                  and design systems they can confidently grow with over time.
                </p>
                <p>
                  We are especially passionate about working with local businesses, mission-driven
                  organizations, and founders who care about the communities they serve.
                </p>
                <p>
                  If you are looking for a development partner who understands both the
                  technical and human sides of building software, we are always happy to
                  start a conversation.
                </p>
                  <Link
                      href="https://magkam.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:text-primary-700 font-semibold mt-1 float-right inline-block"
                  >
                    ...more about Aziz <ArrowRightCircleIcon className="w-4 h-4 inline-block" />
                  </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat: { label: string; value: string }, index: number) => (
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
                These principles guide how we build, how we communicate, and how we show up
                for the people we work with.
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
              <h2 className="text-3xl font-bold text-gray-900 mb-4">How We Work Together</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                A clear, collaborative process from first conversation to launch—and beyond.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                  Discover & Define
                </h3>
                <p className="text-gray-600">
                  We start with a conversation about your business, your goals, and what
                  is not working today. From there, we define scope, priorities, and a
                  realistic roadmap.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                  Design & Build
                </h3>
                <p className="text-gray-600">
                  We design the experience and build the underlying system—whether that is
                  a marketing site, a booking platform, or a custom web app—sharing
                  progress and gathering feedback along the way.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                  Launch, Support, Grow
                </h3>
                <p className="text-gray-600">
                  We handle launch support, basic training, and ongoing improvements so
                  your digital presence can evolve as your business does.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-primary-600 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Level Up Your Digital Presence?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Whether you need a clean, modern website or a custom web application, we’d
              love to learn about your work and explore what we can build together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Start a Project
              </Link>
              <Link
                href="/solutions"
                className="bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-800 transition-colors border-2 border-white"
              >
                View Services
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
