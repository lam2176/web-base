'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Banner, Product } from '@/lib/types/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BannerButtons from './banner-buttons';
import ImageBannerCarousel from './image-banner-carousel';

interface MobileBannerWithTextProps {
  banners: Banner[];
  products: Product[];
  locale: string;
  shopNowText: string;
  learnMoreText: string;
  heroTitle?: string;
  heroSubtitle?: string;
  defaultTitle?: string;
  defaultSubtitle?: string;
}

export default function MobileBannerWithText({
  banners,
  products,
  locale,
  shopNowText,
  learnMoreText,
  heroTitle,
  heroSubtitle,
  defaultTitle,
  defaultSubtitle,
}: MobileBannerWithTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Chuẩn bị slides: ưu tiên lấy ảnh từ banners, nếu không có thì dùng products
  const bannerSlides =
    banners
      ?.filter((banner) => banner.image)
      .map((banner) => ({
        id: `banner-${banner.id}`,
        bannerId: banner.id, // Lưu banner ID để tìm lại banner sau này
        image: banner.image!,
        alt:
          locale === 'vi'
            ? banner.titleVi || banner.titleEn || 'Banner'
            : banner.titleEn || banner.titleVi || 'Banner',
      })) ?? [];

  const productSlides =
    products
      ?.filter((product) => product.images && product.images.length > 0)
      .map((product) => ({
        id: `product-${product.id}`,
        image: product.images![0].url,
        alt:
          locale === 'vi'
            ? product.nameVi || product.nameEn || 'Product'
            : product.nameEn || product.nameVi || 'Product',
      })) ?? [];

  const slides = bannerSlides.length > 0 ? bannerSlides : productSlides;
  const isUsingProductSlides = bannerSlides.length === 0 && productSlides.length > 0;

  if (!slides || slides.length === 0) return null;

  const totalSlides = slides.length;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-play
  useEffect(() => {
    if (!isAutoPlaying || totalSlides <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 5000); // 5 giây

    return () => clearInterval(interval);
  }, [isAutoPlaying, totalSlides]);

  // Lấy banner đang hiển thị dựa trên currentIndex
  const currentSlide = slides[currentIndex];
  const currentBanner = currentSlide && 'bannerId' in currentSlide
    ? banners.find(b => b.id === currentSlide.bannerId)
    : banners[0]; // Fallback về banner đầu tiên nếu không tìm thấy

  return (
    <div 
      className="absolute inset-0 z-0"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
      onTouchStart={() => setIsAutoPlaying(false)}
    >
      {/* Banner Images (ưu tiên ảnh sản phẩm, fallback banner) */}
      <div className="relative h-full w-full overflow-hidden">
        {/* Background tĩnh khi không có banner và chỉ có products */}
        {isUsingProductSlides && (
          <Image
            src="/banner default.jpg"
            alt="Default banner background"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        )}
        
        {slides.map((slide, index) => {
          const isDefaultBannerSlide = 'bannerId' in slide && slide.bannerId === -1;
          
          // Nếu là banner mặc định, hiển thị grid ảnh sản phẩm với background tĩnh
          if (isDefaultBannerSlide && products.length > 0) {
            return (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                {/* Background tĩnh từ banner default.jpg */}
                <Image
                  src="/banner default.jpg"
                  alt="Default banner background"
                  fill
                  className="object-cover"
                  priority={index === 0}
                  sizes="100vw"
                />
                {/* Grid ảnh sản phẩm cho banner mặc định */}
                <ImageBannerCarousel banners={[]} products={products} locale={locale} />
                <div className="absolute inset-0 bg-black/40" />
              </div>
            );
          }
          
          // Banner thường hoặc product slide
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              {slide.image ? (
                <Image
                  src={slide.image}
                  alt={slide.alt}
                  fill
                  className="object-cover"
                  priority={index === 0}
                  sizes="100vw"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-green-500 to-green-400" />
              )}
              <div className="absolute inset-0 bg-black/40" />
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows */}
      {totalSlides > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 bg-black/30 hover:bg-black/50 text-white rounded-full"
            onClick={prevSlide}
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-30 bg-black/30 hover:bg-black/50 text-white rounded-full"
            onClick={nextSlide}
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}

      {/* Dots Indicator */}
      {totalSlides > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'w-6 bg-white'
                  : 'w-2 bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Text Content */}
      {(currentBanner || heroTitle || heroSubtitle) && (
        <div className="absolute left-0 top-0 h-full w-full flex items-center px-4 z-20 pointer-events-none">
          <div className="container relative h-full flex items-center px-4">
            <div className="max-w-2xl space-y-4 md:space-y-6 pointer-events-auto text-center md:text-left">
              {(() => {
                // Banner mặc định (id === -1) luôn dùng text mặc định từ translation
                // Banner từ admin: nếu có title thì chỉ hiển thị title, nếu không có title thì hiển thị text mặc định
                const isDefaultBanner = currentBanner?.id === -1;
                let displayTitle: string | undefined;
                
                if (isDefaultBanner) {
                  // Banner mặc định: luôn dùng text mặc định từ translation
                  displayTitle = defaultTitle || heroTitle;
                } else if (currentBanner) {
                  // Banner từ admin: nếu có title thì chỉ dùng title, nếu không có thì dùng text mặc định
                  const bannerTitle = locale === 'vi'
                    ? currentBanner.titleVi || currentBanner.titleEn
                    : currentBanner.titleEn || currentBanner.titleVi;
                  // Nếu banner có title thì chỉ dùng title, nếu không thì dùng text mặc định
                  displayTitle = (bannerTitle && bannerTitle.trim()) 
                    ? bannerTitle 
                    : (defaultTitle || heroTitle);
                } else {
                  // Không có banner: dùng heroTitle
                  displayTitle = heroTitle;
                }
                
                return displayTitle ? (
                  <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold leading-tight text-white drop-shadow-lg">
                    {displayTitle}
                  </h1>
                ) : null;
              })()}
              {(() => {
                // Banner mặc định (id === -1) luôn dùng text mặc định từ translation
                // Banner từ admin: 
                // - Nếu có title: chỉ hiển thị subtitle từ banner (nếu có), KHÔNG hiển thị text mặc định
                // - Nếu không có title: hiển thị text mặc định
                const isDefaultBanner = currentBanner?.id === -1;
                let displaySubtitle: string | undefined;
                
                if (isDefaultBanner) {
                  // Banner mặc định: luôn dùng text mặc định từ translation
                  displaySubtitle = defaultSubtitle || heroSubtitle;
                } else if (currentBanner) {
                  // Banner từ admin
                  const bannerTitle = locale === 'vi'
                    ? currentBanner.titleVi || currentBanner.titleEn
                    : currentBanner.titleEn || currentBanner.titleVi;
                  const hasTitle = bannerTitle && bannerTitle.trim();
                  
                  if (hasTitle) {
                    // Nếu banner có title: chỉ hiển thị subtitle từ banner (nếu có), KHÔNG hiển thị text mặc định
                    const bannerSubtitle = locale === 'vi'
                      ? currentBanner.subtitleVi || currentBanner.subtitleEn
                      : currentBanner.subtitleEn || currentBanner.subtitleVi;
                    if (bannerSubtitle && bannerSubtitle.trim()) {
                      displaySubtitle = bannerSubtitle;
                    }
                    // Nếu không có subtitle, không hiển thị gì
                  } else {
                    // Nếu banner không có title: hiển thị text mặc định
                    displaySubtitle = defaultSubtitle || heroSubtitle;
                  }
                } else {
                  // Không có banner: dùng heroSubtitle
                  displaySubtitle = heroSubtitle;
                }
                
                return displaySubtitle ? (
                  <p className="text-base md:text-lg lg:text-xl text-white/95 font-medium drop-shadow-md">
                    {displaySubtitle}
                  </p>
                ) : null;
              })()}
              <div className="pointer-events-auto flex flex-col md:flex-row gap-3 justify-center md:justify-start">
                <BannerButtons
                  bannerLink={currentBanner?.link}
                  locale={locale}
                  shopNowText={shopNowText}
                  learnMoreText={learnMoreText}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

