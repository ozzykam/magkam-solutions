'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { StoreSettings } from '@/types/business-info';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useCart } from '@/lib/contexts/CartContext';
import { useWishlist } from '@/lib/contexts/WishlistContext';
import { getUserBookmarks } from '@/services/content-bookmark-service';
import { signOut } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import SearchBar from '@/components/layout/SearchBar';

const Header: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { getUniqueItemCount, openCartDrawer } = useCart();
  const { getItemCount } = useWishlist();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const [contentSettings, setContentSettings] = useState<{
    enabled: boolean;
    sectionNamePlural: string;
    urlSlug: string;
  } | null>(null);
  const [businessName, setBusinessName] = useState('');

  const uniqueItemCount = getUniqueItemCount();
  const wishlistCount = getItemCount();
  const [bookmarkCount, setBookmarkCount] = useState(0);

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

  // Load content settings and business name
  useEffect(() => {
    const loadContentSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'storeSettings', 'main'));
        if (settingsDoc.exists()) {
          const settings = settingsDoc.data() as StoreSettings;

          // Set business name
          if (settings.businessName) {
            setBusinessName(settings.businessName);
          }

          // Set content settings
          if (settings.contentSettings?.enabled) {
            setContentSettings({
              enabled: settings.contentSettings.enabled,
              sectionNamePlural: settings.contentSettings.sectionNamePlural,
              urlSlug: settings.contentSettings.urlSlug,
            });
          }
        }
      } catch (error) {
        console.error('Error loading content settings:', error);
      }
    };

    loadContentSettings();
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
            <div className="w-8 h-8 bg-primary-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <span className="text-xl font-bold text-gray-900">{businessName}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/shop" className="text-gray-700 hover:text-primary-600 transition-colors">
              Shop
            </Link>
            {contentSettings && (
              <Link href={`/${contentSettings.urlSlug}`} className="text-gray-700 hover:text-primary-600 transition-colors">
                {contentSettings.sectionNamePlural}
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
            <button
              onClick={() => setDesktopSearchOpen(!desktopSearchOpen)}
              className="hidden md:block text-gray-700 hover:text-primary-600 transition-colors"
              aria-label="Search"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Mobile Search Icon - Visible only on mobile */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden text-gray-700 hover:text-primary-600 transition-colors"
              aria-label="Search"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Wishlist Icon - Hidden on mobile */}
            {isAuthenticated && (
              <Link href="/wishlist" className="hidden md:flex relative text-gray-700 hover:text-primary-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            )}

            {/* Bookmarks Icon - Hidden on mobile */}
            {isAuthenticated && contentSettings && (
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

            {/* Cart Icon */}
            <button
              onClick={openCartDrawer}
              className="relative text-gray-700 hover:text-primary-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {uniqueItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {uniqueItemCount}
                </span>
              )}
            </button>

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
                    <Link
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
                    </Link>
                    {contentSettings && (
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
              <Link href="/shop" className="text-gray-700 hover:text-primary-600 transition-colors">
                Shop
              </Link>
              {contentSettings && (
                <Link
                  href={`/${contentSettings.urlSlug}`}
                  className="text-gray-700 hover:text-primary-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {contentSettings.sectionNamePlural}
                </Link>
              )}
              <Link href="/about" className="text-gray-700 hover:text-primary-600 transition-colors">
                About
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-primary-600 transition-colors">
                Contact
              </Link>
              {!isAuthenticated && (
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
