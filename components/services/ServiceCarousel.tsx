'use client';

import React, { useRef } from 'react';
import { Service } from '@/types/service';
import ServiceCard from './ServiceCard';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

type ServiceWithDates = Omit<Service, 'createdAt' | 'updatedAt' | 'saleStart' | 'saleEnd'> & {
  createdAt: Date;
  updatedAt: Date;
  saleStart?: Date;
  saleEnd?: Date;
};

interface ServiceCarouselProps {
  title: string;
  services: (Service | ServiceWithDates)[];
  viewAllHref?: string;
}

export default function ServiceCarousel({ title, services, viewAllHref }: ServiceCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });
    }
  };

  if (services.length === 0) return null;

  return (
    <div className="mb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <div className="flex items-center gap-2">
          {viewAllHref && (
            <a
              href={viewAllHref}
              className="text-primary-600 hover:text-primary-700 font-medium text-sm mr-4"
            >
              View all →
            </a>
          )}
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-full bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-full bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRightIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollContainerRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4 pt-6 pr-[20px]"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {services.map((service) => (
          <div key={service.id} className="flex-shrink-0 w-72">
            <ServiceCard service={service} />
          </div>
        ))}
      </div>
    </div>
  );
}
