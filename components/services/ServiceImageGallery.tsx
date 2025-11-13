'use client';

import { useState } from 'react';
import Image from 'next/image';
import Badge from '@/components/ui/Badge';

interface ServiceImageGalleryProps {
  images: string[];
  serviceName: string;
  onSale: boolean;
  salePercent: number;
  isFeatured: boolean;
  tags: string[];
}

export default function ServiceImageGallery({
  images,
  serviceName,
  onSale,
  salePercent,
}: ServiceImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  return (
    <div>
      {/* Main Image */}
      <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
        <Image
          src={images[selectedImage] || '/placeholder-service.jpg'}
          alt={serviceName}
          fill
          className="object-cover"
          priority
        />
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {onSale && salePercent > 0 && (
            <Badge variant="sale">{salePercent}% OFF</Badge>
          )}
        </div>
      </div>

      {/* Thumbnail Images */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-colors ${
                selectedImage === index ? 'border-primary-600' : 'border-transparent hover:border-gray-300'
              }`}
            >
              <Image
                src={image}
                alt={`${serviceName} ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
