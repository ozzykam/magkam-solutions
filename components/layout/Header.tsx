'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { StoreSettings } from '@/types/business-info';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getUserBookmarks } from '@/services/content-bookmark-service';
import { signOut } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import SearchBar from '@/components/layout/SearchBar';

const Header: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  // const [solutionsMenuOpen, setSolutionsMenuOpen] = useState(false);
  // const [mobileSolutionsOpen, setMobileSolutionsOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
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
  const [businessName, setBusinessName] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [features, setFeatures] = useState<{
    calculators?: { enabled: boolean; showInNavigation?: boolean };
    bookmarks?: { enabled: boolean; showInNavigation?: boolean };
    search?: { enabled: boolean };
    userRegistration?: { enabled: boolean };
  }>({});

  // Load bookmark count
  useEffect(() => {
    const loadBookmarkCount = async () => {
      if (user) {
        try {
          const bookmarks = await getUserBookmarks(user.uid);
          setBookmarkCount(bookmarks.length);
        } catch (error) {
          console.error('Error loading bookmark count:', error);
        }
      } else {
        setBookmarkCount(0);
      }
    };

    loadBookmarkCount();
  }, [user]);

  // Load content settings, service settings, business name, and logo
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'storeSettings', 'main'));
        if (settingsDoc.exists()) {
          const settings = settingsDoc.data() as StoreSettings;

          // Set business name
          if (settings.businessName) {
            setBusinessName(settings.businessName);
          }

          // Set logo
          if (settings.themeSettings?.logo) {
            setLogo(settings.themeSettings.logo);
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

          // Set feature flags
          if (settings.features) {
            setFeatures({
              calculators: settings.features.calculators,
              bookmarks: settings.features.bookmarks,
              search: settings.features.search,
              userRegistration: settings.features.userRegistration,
            });
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <>
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            {logo ? (
              <>
                <Image
                  src={logo}
                  alt={businessName || 'Logo'}
                  width={150}
                  height={48}
                  className="h-10 w-auto object-contain"
                  priority
                />
                <span className="text-xl font-bold text-gray-900">{businessName}</span>
              </>
            ) : (
              <>
                <div className="w-8 h-8 bg-primary-600 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {businessName ? businessName.charAt(0).toUpperCase() : 'L'}
                  </span>
                </div>
                <span className="text-xl font-bold text-gray-900">{businessName}</span>
              </>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {serviceSettings && serviceSettings.enabled && (
              <Link
                href={`/${serviceSettings.urlSlug}`}
                className="text-gray-700 hover:text-primary-600 transition-colors"
              >
                {serviceSettings.serviceNamePlural}
              </Link>
            )}
            {contentSettings && (
              <Link href={`/${contentSettings.urlSlug}`} className="text-gray-700 hover:text-primary-600 transition-colors">
                {contentSettings.sectionNamePlural}
              </Link>
            )}

            {/* Solutions Dropdown -- Disabled for Now
            <div className="relative">
              <button
                onClick={() => setSolutionsMenuOpen(!solutionsMenuOpen)}
                onMouseEnter={() => setSolutionsMenuOpen(true)}
                onMouseLeave={() => setSolutionsMenuOpen(false)}
                className="flex items-center gap-1 text-gray-700 hover:text-primary-600 transition-colors"
              >
                Solutions
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {solutionsMenuOpen && (
                <div
                  className="absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg py-2 animate-fade-in"
                  onMouseEnter={() => setSolutionsMenuOpen(true)}
                  onMouseLeave={() => setSolutionsMenuOpen(false)}
                >
                  <Link
                    href="/solutions/websites"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setSolutionsMenuOpen(false)}
                  >
                    <div className="font-semibold">Websites</div>
                    <div className="text-xs text-gray-500">Modern web development</div>
                  </Link>
                  <Link
                    href="/solutions/ecommerce"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setSolutionsMenuOpen(false)}
                  >
                    <div className="font-semibold">Ecommerce</div>
                    <div className="text-xs text-gray-500">Custom online platforms</div>
                  </Link>
                  <Link
                    href="/solutions/custom-software"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setSolutionsMenuOpen(false)}
                  >
                    <div className="font-semibold">Custom Software</div>
                    <div className="text-xs text-gray-500">CRMs, SaaS, and more</div>
                  </Link>
                  <Link
                    href="/solutions/consulting"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setSolutionsMenuOpen(false)}
                  >
                    <div className="font-semibold">Consulting</div>
                    <div className="text-xs text-gray-500">Technical strategy</div>
                  </Link>
                  <hr className="my-2" />
                  <Link
                    href="/solutions"
                    className="block px-4 py-2 text-sm text-primary-600 hover:bg-gray-100 font-semibold"
                    onClick={() => setSolutionsMenuOpen(false)}
                  >
                    View All Solutions →
                  </Link>
                </div>
              )}
            </div> */}

            {features.calculators?.enabled && features.calculators?.showInNavigation && (
              <Link href="/calculators" className="text-gray-700 hover:text-primary-600 transition-colors">
                Calculators
              </Link>
            )}
            <Link href="/about" className="text-gray-700 hover:text-primary-600 transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-primary-600 transition-colors">
              Contact
            </Link>
          </nav>

          {/* Right Side - Search, Cart, User */}
          <div className="flex items-center gap-4">
            {/* Desktop Search Icon - Hidden on mobile */}
            {features.search?.enabled && (
              <button
                onClick={() => setDesktopSearchOpen(!desktopSearchOpen)}
                className="hidden md:block text-gray-700 hover:text-primary-600 transition-colors"
                aria-label="Search"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            )}

            {/* Mobile Search Icon - Visible only on mobile */}
            {features.search?.enabled && (
              <button
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                className="md:hidden text-gray-700 hover:text-primary-600 transition-colors"
                aria-label="Search"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            )}

            {/* Bookmarks Icon - Hidden on mobile */}
            {isAuthenticated && contentSettings && features.bookmarks?.enabled && (
              <Link href="/bookmarks" className="hidden md:flex relative hover:opacity-80 transition-opacity">
                {bookmarkCount > 0 ? (
                  <svg className="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                )}
              </Link>
            )}

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-semibold text-sm">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 animate-fade-in">
                    <Link
                      href="/account"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      My Account
                    </Link>
                    {/* <Link
                      href="/account/orders"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Orders
                    </Link>
                    <Link
                      href="/wishlist"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Wishlist
                    </Link> */}
                    {contentSettings && features.bookmarks?.enabled && (
                      <Link
                        href="/bookmarks"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Bookmarks
                      </Link>
                    )}
                    {(user?.role === 'admin' || user?.role === 'super_admin') && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <hr className="my-1" />
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              features.userRegistration?.enabled && (
                <div className="hidden md:flex items-center gap-2">
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="primary" size="sm">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-700 hover:text-primary-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 animate-slide-down">
            <nav className="flex flex-col gap-4">
              {serviceSettings && serviceSettings.enabled && (
                <Link
                  href={`/${serviceSettings.urlSlug}`}
                  className="text-gray-700 hover:text-primary-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {serviceSettings.serviceNamePlural}
                </Link>
              )}
              {contentSettings && (
                <Link
                  href={`/${contentSettings.urlSlug}`}
                  className="text-gray-700 hover:text-primary-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {contentSettings.sectionNamePlural}
                </Link>
              )}

              {/* Mobile Solutions Dropdown
              <div>
                <button
                  onClick={() => setMobileSolutionsOpen(!mobileSolutionsOpen)}
                  className="flex items-center gap-1 text-gray-700 hover:text-primary-600 transition-colors w-full text-left"
                >
                  Solutionssss
                  <svg className={`w-4 h-4 transition-transform ${mobileSolutionsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {mobileSolutionsOpen && (
                  <div className="ml-4 mt-2 flex flex-col gap-2">
                    <Link
                      href="/solutions/websites"
                      className="text-sm text-gray-700 hover:text-primary-600 transition-colors"
                      onClick={() => {
                        setMobileSolutionsOpen(false);
                        setMobileMenuOpen(false);
                      }}
                    >
                      Websites
                    </Link>
                    <Link
                      href="/solutions/ecommerce"
                      className="text-sm text-gray-700 hover:text-primary-600 transition-colors"
                      onClick={() => {
                        setMobileSolutionsOpen(false);
                        setMobileMenuOpen(false);
                      }}
                    >
                      Ecommerce
                    </Link>
                    <Link
                      href="/solutions/custom-software"
                      className="text-sm text-gray-700 hover:text-primary-600 transition-colors"
                      onClick={() => {
                        setMobileSolutionsOpen(false);
                        setMobileMenuOpen(false);
                      }}
                    >
                      Custom Software
                    </Link>
                    <Link
                      href="/solutions/consulting"
                      className="text-sm text-gray-700 hover:text-primary-600 transition-colors"
                      onClick={() => {
                        setMobileSolutionsOpen(false);
                        setMobileMenuOpen(false);
                      }}
                    >
                      Consulting
                    </Link>
                    <Link
                      href="/solutions"
                      className="text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors"
                      onClick={() => {
                        setMobileSolutionsOpen(false);
                        setMobileMenuOpen(false);
                      }}
                    >
                      View All →
                    </Link>
                  </div>
                )}
              </div> */}

              {features.calculators?.enabled && features.calculators?.showInNavigation && (
                <Link
                  href="/calculators"
                  className="text-gray-700 hover:text-primary-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Calculators
                </Link>
              )}
              <Link href="/about" className="text-gray-700 hover:text-primary-600 transition-colors">
                About
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-primary-600 transition-colors">
                Contact
              </Link>
              {!isAuthenticated && features.userRegistration?.enabled && (
                <>
                  <hr className="my-2" />
                  <Link href="/login">
                    <Button variant="ghost" size="sm" fullWidth>
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="primary" size="sm" fullWidth>
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}

        {/* Mobile Search Overlay */}
        {mobileSearchOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b shadow-lg p-4 z-50 animate-slide-down">
            <SearchBar
              isExpanded={mobileSearchOpen}
              onToggle={setMobileSearchOpen}
              className="w-full"
            />
          </div>
        )}

        {/* Desktop Search Overlay */}
        {desktopSearchOpen && (
          <div className="hidden md:block absolute top-full mt-2 right-2  z-50 w-full max-w-[500px] animate-slide-down">
            <SearchBar
              isExpanded={desktopSearchOpen}
              onToggle={setDesktopSearchOpen}
              className="w-full"
            />
          </div>
        )}
      </div>
    </header>

    </>
  );
};

export default Header;
