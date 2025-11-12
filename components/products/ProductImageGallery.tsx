'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Badge from '@/components/ui/Badge';
import { Tag } from '@/types/tag';
import { getAllTags } from '@/services/tag-service';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  onSale: boolean;
  salePercent: number;
  isFeatured: boolean;
  tags: string[];
}

export default function ProductImageGallery({
  images,
  productName,
  onSale,
  salePercent,
  tags,
}: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);

  useEffect(() => {
      const loadTags = async () => {
        try {
          const allTags = await getAllTags(true);
          setAvailableTags(allTags);
        } catch (error) {
          console.error('Error loading tags:', error);
        }
      };
      loadTags();
    }, []);
  
  const productTags = availableTags.filter(tag => tags.includes(tag.slug));

  return (
    <div>
      {/* Main Image */}
      <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
        <Image
          src={images[selectedImage] || '/placeholder-product.jpg'}
          alt={productName}
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
        <div className="absolute bottom-2 left-2 right-2 flex gap-2 flex-wrap items-center">
          {productTags.map(tag => (
            <div key={tag.id} className="relative w-6 h-6 rounded overflow-hidden bg-white shadow-sm">
              <Image
                src={tag.imageUrl}
                alt={tag.name}
                fill
                className="object-cover"
                title={tag.name}
              />
            </div>
          ))}
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
                alt={`${productName} ${index + 1}`}
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
