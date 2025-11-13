'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Badge from '@/components/ui/Badge';
import { Service, getEffectivePrice, calculateSalePercent, getSaleEndText, isCurrentlyOnSale } from '@/types/service';

type ServiceWithDates = Omit<Service, 'createdAt' | 'updatedAt' | 'saleStart' | 'saleEnd'> & {
  createdAt: Date;
  updatedAt: Date;
  saleStart?: Date;
  saleEnd?: Date;
};

interface ServiceCardProps {
  service: Service | ServiceWithDates;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  const {
    name,
    slug,
    basePrice,
    salePrice,
    onSale,
    images,
  } = service;

  const displayPrice = getEffectivePrice(service as Service);
  const salePercent = calculateSalePercent(Number(basePrice), salePrice);

  const isNewArrival = (() => {
    // Handle both Firestore Timestamps and plain Date objects
    const createdAt = service.createdAt instanceof Date
      ? service.createdAt
      : service.createdAt.toDate();
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 1; // Consider new if added within last 30 days
  });

  return (
    <div className="relative h-full">
      <Link href={`/services/${slug}`}>
        <div className="relative bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
          {/* Image Container */}
          <div className="relative aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
            <Image
              src={images[0] || '/placeholder-service.jpg'}
              alt={name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />

            {/* Sale Badge */}
            {(onSale || isCurrentlyOnSale(service as Service)) && salePercent > 0 && (
              <div
                className="absolute bottom-4 right-0 bg-red-600 text-white text-xs font-bold px-14 py-2 transform rotate-[-45deg] translate-x-[25%] shadow-md text-center cursor-default select-none"
                onClick={(e) => e.preventDefault()}
              >
                {getSaleEndText(service as Service) ? (
                  <>
                    SALE!<br />
                    {getSaleEndText(service as Service)}<br /> 
                    {salePercent}% OFF
                  </>
                  ) : (
                  <>
                    SALE!<br />
                    {salePercent}% OFF
                  </>
              )}
              </div>
            )}
          </div>


        {/* Service Info */}
        <div className="p-4 flex flex-col flex-grow">
          {/* Price */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-gray-900">
              <span className="text-xl">${Math.floor(Number(displayPrice))}</span>
              <span className="text-xs align-top">{(Number(displayPrice) % 1).toFixed(2).substring(2)}</span>
            </span>
            {onSale && salePrice && (
              <>
                <span className="text-sm text-red-500 line-through">
                  ${(Number(basePrice) || 0).toFixed(2)}
                </span>
              </>
            )}
          </div>

          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
            {name}
          </h3>
        </div>
      </div>
      </Link>
      {/* New Arrival Badge */}
            {isNewArrival() && (
              <div className="absolute bottom-[-15px] left-0 right-0 flex justify-center z-10">
                <Badge variant="new">New Item!</Badge>
              </div>
            )}
    </div>
  );
};

export default ServiceCard;
