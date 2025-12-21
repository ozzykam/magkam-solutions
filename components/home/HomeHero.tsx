'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import SearchBar from '@/components/layout/SearchBar';

interface HomeHeroProps {
  hero: {
    headline: string;
    highlightedText: string;
    subtitle: string;
    primaryCTA: { text: string; link: string };
    secondaryCTA: { text: string; link: string };
  };
}

const HERO_IMAGES = [
  '/main-page-hero-1.webp',
  '/main-page-hero-2.webp',
];

const ROTATION_INTERVAL = 5000; // 5 seconds

export default function HomeHero({ hero }: HomeHeroProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);

      // After fade out, change image
      setTimeout(() => {
        setCurrentImageIndex((prevIndex) =>
          (prevIndex + 1) % HERO_IMAGES.length
        );
        setIsTransitioning(false);
      }, 500); // Half second for fade out
    }, ROTATION_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background Images */}
      {HERO_IMAGES.map((image, index) => (
        <div
          key={image}
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${
            index === currentImageIndex && !isTransitioning
              ? 'opacity-100'
              : 'opacity-0'
          }`}
          style={{ backgroundImage: `url(${image})` }}
        />
      ))}

      {/* Overlay for text readability */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            {hero.headline}
            <br />
            <span className="text-primary-400">{hero.highlightedText}</span>
          </h1>
          <p className="text-xl text-gray-100 mb-8 max-w-2xl mx-auto">
            {hero.subtitle}
          </p>
          <div className="flex gap-4 justify-center">
            <Link href={hero.primaryCTA.link}>
              <Button variant="primary" size="lg">
                {hero.primaryCTA.text}
              </Button>
            </Link>
            <Link href={hero.secondaryCTA.link}>
              <Button variant="outline" size="lg">
                {hero.secondaryCTA.text}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
