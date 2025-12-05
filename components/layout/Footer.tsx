'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { StoreSettings } from '@/types/business-info';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [businessName, setBusinessName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [contactInfo, setContactInfo] = useState<{
    email?: string;
    phone?: string;
    address?: { street: string; city: string; state: string; zipCode: string };
  }>({});
  const [socialMedia, setSocialMedia] = useState<{
    facebook?: string;
    instagram?: string;
    x?: string;
    linkedin?: string;
    youtube?: string;
  }>({});
  const [contentSettings, setContentSettings] = useState<{
    enabled: boolean;
    sectionNamePlural: string;
    urlSlug: string;
  } | null>(null);
  const [serviceSettings, setServiceSettings] = useState<{
    enabled: boolean;
    serviceNamePlural: string;
    urlSlug: string;
  } | null>(null);
  const [features, setFeatures] = useState<{
    calculators?: { enabled: boolean; showInNavigation?: boolean };
    contact?: { enabled: boolean };
  }>({});

  // Load settings from Firebase
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'storeSettings', 'main'));
        if (settingsDoc.exists()) {
          const settings = settingsDoc.data() as StoreSettings;

          // Set business info
          if (settings.businessName) {
            setBusinessName(settings.businessName);
          }
          if (settings.businessDescription) {
            setBusinessDescription(settings.businessDescription);
          }

          // Set logo
          if (settings.themeSettings?.logo) {
            setLogo(settings.themeSettings.logo);
          }

          // Set contact info
          setContactInfo({
            email: settings.email,
            phone: settings.phone,
            address: settings.address,
          });

          // Set social media
          if (settings.socialMedia) {
            setSocialMedia(settings.socialMedia);
          }

          // Set service settings
          if (settings.serviceSettings) {
            setServiceSettings({
              enabled: settings.serviceSettings.enabled ?? true,
              serviceNamePlural: settings.serviceSettings.serviceNamePlural || 'Services',
              urlSlug: settings.serviceSettings.urlSlug || 'services',
            });
          }

          // Set content settings
          if (settings.contentSettings?.enabled) {
            setContentSettings({
              enabled: settings.contentSettings.enabled,
              sectionNamePlural: settings.contentSettings.sectionNamePlural,
              urlSlug: settings.contentSettings.urlSlug,
            });
          }

          // Set features
          if (settings.features) {
            setFeatures({
              calculators: settings.features.calculators,
              contact: settings.features.contact,
            });
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              {logo ? (
                <>
                  <Image
                    src={logo}
                    alt={businessName || 'Logo'}
                    width={120}
                    height={40}
                    className="h-8 w-auto object-contain"
                  />
                  <span className="text-xl font-bold text-white">{businessName}</span>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 bg-primary-600 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {businessName ? businessName.charAt(0).toUpperCase() : 'L'}
                    </span>
                  </div>
                  <span className="text-xl font-bold text-white">{businessName || 'Your Business'}</span>
                </>
              )}
            </Link>
            {businessDescription && (
              <p className="text-sm text-gray-400 mb-4">
                {businessDescription}
              </p>
            )}

            {/* Contact Info */}
            {(contactInfo.email || contactInfo.phone || contactInfo.address) && (
              <div className="text-sm text-gray-400 mb-4 space-y-1">
                {contactInfo.email && (
                  <div>
                    <a href={`mailto:${contactInfo.email}`} className="hover:text-primary-500 transition-colors">
                      {contactInfo.email}
                    </a>
                  </div>
                )}
                {contactInfo.phone && (
                  <div>
                    <a href={`tel:${contactInfo.phone}`} className="hover:text-primary-500 transition-colors">
                      {contactInfo.phone}
                    </a>
                  </div>
                )}
                {contactInfo.address && (
                  <div className="mt-2">
                    <div>{contactInfo.address.street}</div>
                    <div>
                      {contactInfo.address.city}, {contactInfo.address.state} {contactInfo.address.zipCode}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Social Media Links */}
            {(socialMedia.facebook || socialMedia.x || socialMedia.instagram || socialMedia.linkedin || socialMedia.youtube) && (
              <div className="flex gap-4">
                {socialMedia.facebook && (
                  <a href={socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-500 transition-colors" aria-label="Facebook">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                )}
                {socialMedia.x && (
                  <a href={socialMedia.x} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-500 transition-colors" aria-label="X (Twitter)">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </a>
                )}
                {socialMedia.instagram && (
                  <a href={socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-500 transition-colors" aria-label="Instagram">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                    </svg>
                  </a>
                )}
                {socialMedia.linkedin && (
                  <a href={socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-500 transition-colors" aria-label="LinkedIn">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                )}
                {socialMedia.youtube && (
                  <a href={socialMedia.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-500 transition-colors" aria-label="YouTube">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Services/Products Column */}
          {serviceSettings && serviceSettings.enabled && (
            <div>
              <h3 className="text-white font-semibold mb-4">{serviceSettings.serviceNamePlural}</h3>
              <ul className="space-y-2">
                <li>
                  <Link href={`/${serviceSettings.urlSlug}`} className="text-sm hover:text-primary-500 transition-colors">
                    All {serviceSettings.serviceNamePlural}
                  </Link>
                </li>
                <li>
                  <Link href="/solutions" className="text-sm hover:text-primary-500 transition-colors">
                    Solutions
                  </Link>
                </li>
                {features.calculators?.enabled && (
                  <li>
                    <Link href="/calculators" className="text-sm hover:text-primary-500 transition-colors">
                      Calculators
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Content Column */}
          {contentSettings && (
            <div>
              <h3 className="text-white font-semibold mb-4">{contentSettings.sectionNamePlural}</h3>
              <ul className="space-y-2">
                <li>
                  <Link href={`/${contentSettings.urlSlug}`} className="text-sm hover:text-primary-500 transition-colors">
                    All {contentSettings.sectionNamePlural}
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* Company Column */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm hover:text-primary-500 transition-colors">
                  About Us
                </Link>
              </li>
              {features.contact?.enabled && (
                <li>
                  <Link href="/contact" className="text-sm hover:text-primary-500 transition-colors">
                    Contact
                  </Link>
                </li>
              )}
              <li>
                <Link href="/privacy" className="text-sm hover:text-primary-500 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm hover:text-primary-500 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © {currentYear} {businessName || 'Your Business'}. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-sm text-gray-400 hover:text-primary-500 transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-gray-400 hover:text-primary-500 transition-colors">
                Terms
              </Link>
              <Link href="/sitemap" className="text-sm text-gray-400 hover:text-primary-500 transition-colors">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
