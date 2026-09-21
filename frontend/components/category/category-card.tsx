"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Category } from "@/lib/types/api";

interface CategoryCardProps {
  category: Category;
  locale: string;
  categoryName: string;
  categoryDescription?: string;
}

export default function CategoryCard({
  category,
  locale,
  categoryName,
  categoryDescription,
}: CategoryCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get all images from category.images array or fallback to category.image
  const images: string[] = [];
  
  if (category.images && category.images.length > 0) {
    // Use images from images array
    category.images.forEach((img) => {
      // Check multiple possible URL sources
      const imageUrl = img.media?.url || 
                       (img.media?.filepath ? `/${img.media.filepath}` : null) ||
                       (typeof img.media === 'string' ? img.media : null);
      if (imageUrl) {
        images.push(imageUrl);
      }
    });
  }
  
  // Fallback to category.image if no images in array
  if (images.length === 0 && category.image) {
    images.push(category.image);
  }

  const currentImage = images[currentImageIndex] || null;

  const goToPrevious = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <Link href={`/${locale}/products?categoryId=${category.id}`}>
      <div className="relative h-64 rounded-lg overflow-hidden group cursor-pointer">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
        
        {currentImage ? (
          <Image
            src={currentImage}
            alt={categoryName}
            fill
            className="object-cover transition-opacity duration-300"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-primary/20" />
        )}

        {/* Navigation Arrows - Only show if more than 1 image */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white z-20 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.preventDefault();
                goToPrevious();
              }}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white z-20 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.preventDefault();
                goToNext();
              }}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>

            {/* Image Counter */}
            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded z-20">
              {currentImageIndex + 1} / {images.length}
            </div>
          </>
        )}

        {/* Category Info */}
        <div className="absolute bottom-6 left-6 z-20">
          <h3 className="text-2xl font-bold text-white mb-2">
            {categoryName}
          </h3>
          {categoryDescription && (
            <p className="text-white/90">{categoryDescription}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

