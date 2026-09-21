import { getTranslations } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/product/product-card";
import { ArrowRight } from "lucide-react";
import { productService } from "@/lib/api/services/product.service";
import { categoryService } from "@/lib/api/services/category.service";
import { bannerService } from "@/lib/api/services/banner.service";
import { getCategoryName } from "@/lib/utils/i18n";
import CategoryCard from "@/components/category/category-card";
import BannerButtons from "@/components/banner/banner-buttons";
import ImageBannerCarousel from "@/components/banner/image-banner-carousel";
import MobileBannerWithText from "@/components/banner/mobile-banner-with-text";
import CouponHighlight from "@/components/coupon/coupon-highlight";
import { couponService } from "@/lib/api/services/coupon.service";
import type { Banner } from "@/lib/types/api";

async function getFeaturedProducts() {
  try {
    return await productService.getFeatured(20);
  } catch (error) {
    console.error("Failed to fetch featured products:", error);
    return [];
  }
}

async function getBannerProducts() {
  try {
    // Lấy danh sách sản phẩm để chạy banner (không phụ thuộc featured)
    const all = await productService.getAll({ limit: 20 });
    return all?.data ?? [];
  } catch (error) {
    console.error("Failed to fetch banner products:", error);
    return [];
  }
}

async function getRootCategories() {
  try {
    return await categoryService.getRootCategories();
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

async function getActiveBanners() {
  try {
    return await bannerService.getActive();
  } catch (error) {
    console.error("Failed to fetch banners:", error);
    return [];
  }
}

async function getActiveCoupons() {
  try {
    return await couponService.getActive();
  } catch (error) {
    console.error("Failed to fetch coupons:", error);
    return [];
  }
}

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const featuredProducts = await getFeaturedProducts();
  const bannerProducts = await getBannerProducts();
  const categories = await getRootCategories();
  const bannersFromAdmin = await getActiveBanners();
  const coupons = await getActiveCoupons();
  const t = await getTranslations({ locale, namespace: "home" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  // Banner mặc định
  const defaultBanner: Banner = {
    id: -1,
    titleVi: '',
    titleEn: '',
    subtitleVi: '',
    subtitleEn: '',
    image: '/banner default.jpg',
    link: undefined,
    order: 9999,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Thêm banner mặc định:
  // - Vào cuối danh sách nếu có banners từ admin
  // - Hoặc làm banner duy nhất nếu không có banners và không có products
  let banners: Banner[];
  if (bannersFromAdmin.length > 0) {
    // Có banners từ admin: thêm banner mặc định vào cuối
    banners = [...bannersFromAdmin, defaultBanner];
  } else if (bannerProducts.length === 0) {
    // Không có banners và không có products: dùng banner mặc định
    banners = [defaultBanner];
  } else {
    // Có products nhưng không có banners: không dùng banner mặc định
    banners = [];
  }

  const hasPrimaryBanner = banners.length > 0;
  const primaryBanner = hasPrimaryBanner ? banners[0] : null;
  const isDefaultBanner = primaryBanner?.id === -1;

  const hasProductImages = bannerProducts.length > 0;
  const hasImages = hasPrimaryBanner || hasProductImages;

  // Banner mặc định luôn dùng text từ translation, không phụ thuộc vào title banner
  // Banner từ admin: nếu có title thì dùng title, nếu không có thì dùng text mặc định
  const heroTitle = isDefaultBanner
    ? t("hero.title")
    : hasPrimaryBanner
    ? (locale === "vi"
        ? primaryBanner!.titleVi || primaryBanner!.titleEn || t("hero.title")
        : primaryBanner!.titleEn || primaryBanner!.titleVi || t("hero.title"))
    : t("hero.title");

  const heroSubtitle = isDefaultBanner
    ? t("hero.description")
    : hasPrimaryBanner
    ? (locale === "vi"
        ? primaryBanner!.subtitleVi || primaryBanner!.subtitleEn || t("hero.description")
        : primaryBanner!.subtitleEn || primaryBanner!.subtitleVi || t("hero.description"))
    : t("hero.description");

  return (
    <div className="flex flex-col">
      {/* Hero Banner / Banners Section */}
      <section
        className={`relative w-full overflow-hidden [&_*]:focus:outline-none [&_*]:focus:ring-0 h-[500px] md:h-[calc(100vh-4rem)]${
          hasImages ? '' : ' bg-white'
        }`}
      >
        <CouponHighlight coupon={coupons[0] ?? null} locale={locale} />
        <div className="relative h-full bg-white">
          {/* Banner Carousel với text: CHỈ khi CÓ banner */}
          {hasPrimaryBanner && (
            <MobileBannerWithText
              banners={banners}
              products={bannerProducts}
              locale={locale}
              shopNowText={t("hero.shopNow")}
              learnMoreText={t("hero.learnMore")}
              heroTitle={heroTitle}
              heroSubtitle={heroSubtitle}
              defaultTitle={t("hero.title")}
              defaultSubtitle={t("hero.description")}
            />
          )}

          {/* Text + ảnh chạy khi KHÔNG có banner nhưng CÓ products */}
          {!hasPrimaryBanner && hasProductImages && (
            <>
              {/* Mobile: Ảnh chạy full màn hình giống banner */}
              <div className="md:hidden">
                <MobileBannerWithText
                  banners={[]}
                  products={bannerProducts}
                  locale={locale}
                  shopNowText={t("hero.shopNow")}
                  learnMoreText={t("hero.learnMore")}
                  heroTitle={heroTitle}
                  heroSubtitle={heroSubtitle}
                />
              </div>
              {/* PC/Tablet: Text bên trái + ảnh chạy bên phải */}
              <div className="hidden md:block">
                {/* Background tĩnh từ banner default.jpg */}
                <Image
                  src="/banner default.jpg"
                  alt="Default banner background"
                  fill
                  className="object-cover"
                  priority
                  sizes="100vw"
                />
                {/* Overlay tối phía sau text để text trắng hiển thị rõ */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-0 flex items-center px-4 z-20 pointer-events-none">
                  <div className="container relative h-full flex items-center px-4">
                    <div className="max-w-2xl space-y-4 md:space-y-6 pointer-events-auto text-center md:text-left">
                      {heroTitle && (
                        <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold leading-tight text-white drop-shadow-lg">
                          {heroTitle}
                        </h1>
                      )}
                      {heroSubtitle && (
                        <p className="text-base md:text-lg lg:text-xl text-white/95 font-medium drop-shadow-md">
                          {heroSubtitle}
                        </p>
                      )}
                      <div className="pointer-events-auto flex flex-col md:flex-row gap-3 justify-center md:justify-start">
                        <BannerButtons
                          bannerLink={primaryBanner?.link}
                          locale={locale}
                          shopNowText={t("hero.shopNow")}
                          learnMoreText={t("hero.learnMore")}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Ảnh chạy bên phải (PC/Tablet) */}
                <ImageBannerCarousel banners={[]} products={bannerProducts} locale={locale} />
              </div>
            </>
          )}
          
          {/* Text Content trên nền trắng (khi KHÔNG có banner và KHÔNG có products) */}
          {!hasPrimaryBanner && !hasProductImages && (
            <div className="absolute inset-0 flex items-center px-4 z-20">
              <div className="container relative h-full flex items-center px-4">
                <div className="max-w-2xl space-y-4 md:space-y-6 pointer-events-auto text-center md:text-left">
                  {heroTitle && (
                    <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold leading-tight text-gray-900">
                      {heroTitle}
                    </h1>
                  )}
                  {heroSubtitle && (
                    <p className="text-base md:text-lg lg:text-xl text-gray-700">
                      {heroSubtitle}
                    </p>
                  )}
                  <div className="pointer-events-auto flex flex-col md:flex-row gap-3 justify-center md:justify-start">
                    <BannerButtons
                      bannerLink={primaryBanner?.link}
                      locale={locale}
                      shopNowText={t("hero.shopNow")}
                      learnMoreText={t("hero.learnMore")}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16 bg-gray-50">
        <div className="container px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t("categories.title")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.slice(0, 3).map((category) => {
              const categoryName = getCategoryName(category, locale);
              const categoryDescription =
                locale === "vi"
                  ? category.descriptionVi || category.descriptionEn
                  : category.descriptionEn || category.descriptionEn;

              return (
                <CategoryCard
                  key={category.id}
                  category={category}
                  locale={locale}
                  categoryName={categoryName}
                  categoryDescription={categoryDescription}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container px-4">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold">
              {t("featuredProducts.title")}
            </h2>
            <Link href={`/${locale}/products`}>
              <Button variant="outline">
                {tCommon("viewAll")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
