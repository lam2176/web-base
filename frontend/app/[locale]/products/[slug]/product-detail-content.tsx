"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart, Heart } from "lucide-react";
import { productService } from "@/lib/api/services/product.service";
import { Product, ProductVariant } from "@/lib/types/api";
import { useCartStore } from "@/lib/stores/cart.store";
import { useCurrency } from "@/lib/hooks/useCurrency";
import { sanitizeHtml } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import ProductGallery from "@/components/product/product-gallery";
import Link from "next/link";
import Image from "next/image";

interface ProductDetailContentProps {
  locale: string;
  slug: string;
}

export default function ProductDetailContent({
  locale,
  slug,
}: ProductDetailContentProps) {
  const t = useTranslations();
  const router = useRouter();
  const { toast } = useToast();
  const { addItem } = useCartStore();
  const { formatPrice } = useCurrency();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariantId, setSelectedVariantId] = useState<
    number | undefined
  >();
  const [quantity, setQuantity] = useState(1);

  // Get localized values
  const productName = product
    ? (locale === 'vi'
        ? product.nameVi || product.name
        : product.nameEn || product.name) || ''
    : '';

  const productDescription = product
    ? (locale === 'vi'
        ? product.descriptionVi || product.description
        : product.descriptionEn || product.description) || ''
    : '';

  const categoryName = product?.category
    ? (locale === 'vi'
        ? product.category.nameVi || product.category.name
        : product.category.nameEn || product.category.name) || ''
    : '';

  const getVariantName = (variant: ProductVariant) => {
    // Use variant value (e.g., "256GB - Natural Titanium") instead of name (e.g., "Storage")
    return variant.value || variant.name || '';
  };

  const selectedVariant = product?.variants?.find(v => v.id === selectedVariantId);
  const variantPrice = selectedVariant?.priceAdjustment || 0;

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const data = await productService.getBySlug(slug);
      setProduct(data);

      // Auto-select first active variant if product has variants
      if (data.variants && data.variants.length > 0) {
        const firstActiveVariant = data.variants.find(v => v.isActive !== false);
        if (firstActiveVariant?.id) {
          setSelectedVariantId(firstActiveVariant.id);
        }
      }

      // Fetch related products
      if (data.id) {
        try {
          const related = await productService.getRelated(data.id, 4);
          setRelatedProducts(related);
        } catch (error) {
          console.error("Failed to fetch related products:", error);
        }
      }
    } catch (error) {
      console.error("Failed to fetch product:", error);
      toast({
        title: t("common.error"),
        description: t("products.error"),
        variant: "destructive",
      });
      router.push(`/${locale}/products`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    // Check if product has variants and one is selected
    const hasVariants = product.variants && product.variants.length > 0;
    if (hasVariants && !selectedVariantId) {
      toast({
        title: t("products.error"),
        description: locale === 'vi' ? 'Vui lòng chọn phân loại sản phẩm' : 'Please select a variant',
        variant: "destructive",
      });
      return;
    }

    const canPurchase =
      !product.trackInventory ||
      product.allowOutOfStockPurchase ||
      (product.inventoryQuantity || 0) >= quantity;

    if (!canPurchase) {
      toast({
        title: t("products.error"),
        description: t("products.outOfStockMessage"),
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedVariant = selectedVariantId
        ? product.variants?.find(v => v.id === selectedVariantId)
        : undefined;
      const variantName = selectedVariant ? getVariantName(selectedVariant) : undefined;

      await addItem({
        productId: product.id,
        variantId: selectedVariantId,
        variantName,
        quantity,
        name: productName,
        price: getCurrentPrice(),
        image: product.images?.[0]?.url,
        slug: product.slug,
      });
      toast({
        title: t("products.addedToCart"),
        description: t("products.addedToCartDescription", { 
          quantity, 
          product: productName 
        }),
      });
    } catch (error) {
      toast({
        title: t("products.error"),
        description: t("products.error"),
        variant: "destructive",
      });
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push(`/${locale}/cart`);
  };

  const getAvailableStock = () => {
    if (!product) return 0;
    if (!product.trackInventory) return 999;

    // If variant is selected, use variant stock, otherwise use product stock
    if (selectedVariant) {
      return selectedVariant.stockQuantity;
    }
    return product.inventoryQuantity || 0;
  };

  const getCurrentPrice = () => {
    if (!product) return 0;
    const basePrice = product.price || 0;
    return basePrice + variantPrice;
  };

  const getCompareAtPrice = () => {
    if (!product) return undefined;
    if (!product.compareAtPrice) return undefined;
    return product.compareAtPrice + variantPrice;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-6 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square w-full" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const availableStock = getAvailableStock();
  const currentPrice = getCurrentPrice();
  const compareAtPrice = getCompareAtPrice();
  const images = product.images?.map((img) => img.url) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/${locale}`}>{t("nav.home")}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/${locale}/products`}>
              {t("nav.products")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          {categoryName && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  href={`/${locale}/products?categoryId=${product.category?.id}`}
                >
                  {categoryName}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </>
          )}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{productName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Product Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Gallery */}
        <div>
          <ProductGallery images={images} productName={productName} />
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{productName}</h1>
            {categoryName && (
              <p className="text-muted-foreground">{categoryName}</p>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center gap-4">
            <p className="text-3xl font-bold text-primary">
              {formatPrice(currentPrice)}
            </p>
            {compareAtPrice && compareAtPrice > currentPrice && (
              <>
                <p className="text-xl text-muted-foreground line-through">
                  {formatPrice(compareAtPrice)}
                </p>
                <Badge variant="destructive">
                  {Math.round(
                    ((compareAtPrice - currentPrice) / compareAtPrice) * 100
                  )}
                  % OFF
                </Badge>
              </>
            )}
          </div>

          {/* Stock Status */}
          <div>
            {!product.trackInventory || product.allowOutOfStockPurchase ? (
              <Badge variant="secondary">{t("products.inStock")}</Badge>
            ) : (availableStock || 0) > 0 ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{t("products.inStock")}</Badge>
                {(availableStock || 0) <= 10 && (
                  <span className="text-sm text-orange-600">
                    {t("products.onlyLeft", { count: availableStock || 0 })}
                  </span>
                )}
              </div>
            ) : (
              <Badge variant="destructive">{t("products.outOfStock")}</Badge>
            )}
          </div>

          {/* Description */}
          {productDescription && (
            <div>
              <h3 className="font-semibold mb-2">
                {t("products.description")}
              </h3>
              <div
                className="text-muted-foreground prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(productDescription) }}
              />
            </div>
          )}

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-3">
                {t("products.variant")}
              </label>
              <div className="grid grid-cols-1 gap-3">
                {product.variants.filter(v => v.isActive !== false).map((variant) => {
                  const variantDisplayName = getVariantName(variant);
                  const priceText = variant.priceAdjustment && variant.priceAdjustment !== 0
                    ? ` (${variant.priceAdjustment > 0 ? '+' : ''}${formatPrice(variant.priceAdjustment)})`
                    : '';
                  const isSelected = selectedVariantId === variant.id;

                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setSelectedVariantId(variant.id || undefined)}
                      className={`
                        relative flex items-center justify-between p-4 rounded-lg border-2 transition-all
                        ${isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }
                      `}
                    >
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-900">
                          {variantDisplayName}
                        </div>
                        {priceText && (
                          <div className="text-sm text-gray-600 mt-1">
                            {priceText}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <div className="ml-3 flex-shrink-0">
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                              <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("products.quantity")}
            </label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-semibold">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setQuantity(Math.min(availableStock || 999, quantity + 1))
                }
                disabled={
                  product.trackInventory &&
                  !product.allowOutOfStockPurchase &&
                  quantity >= (availableStock || 0)
                }
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Product Meta */}
          {(product.sku || product.barcode) && (
            <div className="text-sm text-muted-foreground space-y-1">
              {product.sku && (
                <p>
                  {t("products.sku")}: {product.sku}
                </p>
              )}
              {product.barcode && (
                <p>
                  {locale === "vi" ? "Mã vạch" : "Barcode"}: {product.barcode}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              size="lg"
              className="flex-1"
              onClick={handleAddToCart}
              disabled={
                product.trackInventory &&
                !product.allowOutOfStockPurchase &&
                availableStock === 0
              }
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {t("products.addToCart")}
            </Button>
            <Button
              size="lg"
              variant="default"
              className="flex-1"
              onClick={handleBuyNow}
              disabled={
                product.trackInventory &&
                !product.allowOutOfStockPurchase &&
                availableStock === 0
              }
            >
              {t("products.buyNow")}
            </Button>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">
            {t("products.relatedProducts")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => {
              const relatedName = locale === 'vi'
                ? relatedProduct.nameVi || relatedProduct.name
                : relatedProduct.nameEn || relatedProduct.name;

              return (
                <Link
                  key={relatedProduct.id}
                  href={`/${locale}/products/${relatedProduct.slug}`}
                >
                  <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative aspect-square overflow-hidden bg-gray-100">
                      <Image
                        src={
                          relatedProduct.images?.[0]?.url ||
                          "/placeholder-product.jpg"
                        }
                        alt={relatedName || 'Product'}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                        {relatedName}
                      </h3>
                      <p className="text-lg font-bold text-primary">
                        {formatPrice(relatedProduct.price || 0)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
