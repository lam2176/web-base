'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Banner, Product } from '@/lib/types/api';

interface ImageBannerCarouselProps {
  banners: Banner[];
  products: Product[];
  locale: string;
}

type Slide = {
  id: string | number;
  image: string;
  alt: string;
  href?: string;
};

export default function ImageBannerCarousel({ banners, products, locale }: ImageBannerCarouselProps) {
  // Slides từ banner (ưu tiên nếu có)
  const bannerSlides: Slide[] =
    banners
      ?.filter((banner) => banner.image)
      .map((banner) => ({
        id: `banner-${banner.id}`,
        image: banner.image!,
        alt:
          locale === 'vi'
            ? banner.titleVi || banner.titleEn || 'Banner'
            : banner.titleEn || banner.titleVi || 'Banner',
        href: banner.link || undefined,
      })) ?? [];

  // Slides từ product (fallback khi không có banner)
  const productSlides: Slide[] =
    products
      ?.filter((product) => product.images && product.images.length > 0)
      .map((product) => {
        const href = product.slug
          ? `/${locale}/products/${product.slug}`
          : `/${locale}/products/${product.id}`;
        return {
          id: `product-${product.id}`,
          image: product.images![0].url,
          alt:
            locale === 'vi'
              ? product.nameVi || product.nameEn || 'Product'
              : product.nameEn || product.nameVi || 'Product',
          href,
        };
      }) ?? [];

  const baseSlides = bannerSlides.length > 0 ? bannerSlides : productSlides;

  if (!baseSlides || baseSlides.length === 0) return null;

  // Lấy đủ 10 ảnh, nếu ít hơn thì lặp lại
  let allSlides: Slide[] = [...baseSlides];
  while (allSlides.length < 10) {
    allSlides = [...allSlides, ...baseSlides];
  }
  allSlides = allSlides.slice(0, 10);

  // Chia thành 2 hàng, mỗi hàng 5 ảnh
  const row1Slides = allSlides.slice(0, 5);
  const row2Slides = allSlides.slice(5, 10);

  // Tạo bản sao để tạo hiệu ứng infinite loop (mỗi hàng có 3 bộ)
  const duplicatedRow1 = [...row1Slides, ...row1Slides, ...row1Slides];
  const duplicatedRow2 = [...row2Slides, ...row2Slides, ...row2Slides];

  return (
    <>
      {/* Mobile: Hidden */}
      <div className="md:hidden"></div>

      {/* Tablet & Desktop: 2 cột dọc */}
      <div className="hidden md:flex absolute right-0 top-0 h-full w-[400px] md:w-[500px] lg:w-[500px] xl:w-[600px] overflow-hidden z-10 gap-2 md:gap-3">
        {/* Cột 1 - 5 ảnh đầu */}
        <div className="relative h-full w-[calc(50%-0.25rem)] md:w-[calc(50%-0.375rem)] overflow-hidden">
          <div className="flex flex-col h-full gap-2 md:gap-3 animate-scroll-down">
            {duplicatedRow1.map((slide, index) => {
              const content = slide.image ? (
                <>
                  <Image
                    src={slide.image}
                    alt={slide.alt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 200px, (max-width: 1024px) 250px, (max-width: 1280px) 250px, 300px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-green-500 to-green-400" />
              );

              const Wrapper: React.ElementType = slide.href ? Link : 'div';
              const wrapperProps = slide.href 
                ? { href: slide.href, className: "relative flex-shrink-0 w-full h-[120px] md:h-[150px] lg:h-[150px] xl:h-[180px] rounded-lg overflow-hidden shadow-lg group hover:shadow-xl transition-shadow duration-300" }
                : { className: "relative flex-shrink-0 w-full h-[120px] md:h-[150px] lg:h-[150px] xl:h-[180px] rounded-lg overflow-hidden shadow-lg group hover:shadow-xl transition-shadow duration-300" };

              return (
                <Wrapper
                  key={`${slide.id}-col1-${index}`}
                  {...wrapperProps}
                >
                  {content}
                </Wrapper>
              );
            })}
          </div>
        </div>

        {/* Cột 2 - 5 ảnh tiếp theo */}
        <div className="relative h-full w-[calc(50%-0.25rem)] md:w-[calc(50%-0.375rem)] overflow-hidden">
          <div className="flex flex-col h-full gap-2 md:gap-3 animate-scroll-up">
            {duplicatedRow2.map((slide, index) => {
              const content = slide.image ? (
                <>
                  <Image
                    src={slide.image}
                    alt={slide.alt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 200px, (max-width: 1024px) 250px, (max-width: 1280px) 250px, 300px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-green-500 to-green-400" />
              );

              const Wrapper: React.ElementType = slide.href ? Link : 'div';
              const wrapperProps = slide.href 
                ? { href: slide.href, className: "relative flex-shrink-0 w-full h-[120px] md:h-[150px] lg:h-[150px] xl:h-[180px] rounded-lg overflow-hidden shadow-lg group hover:shadow-xl transition-shadow duration-300" }
                : { className: "relative flex-shrink-0 w-full h-[120px] md:h-[150px] lg:h-[150px] xl:h-[180px] rounded-lg overflow-hidden shadow-lg group hover:shadow-xl transition-shadow duration-300" };

              return (
                <Wrapper
                  key={`${slide.id}-col2-${index}`}
                  {...wrapperProps}
                >
                  {content}
                </Wrapper>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

