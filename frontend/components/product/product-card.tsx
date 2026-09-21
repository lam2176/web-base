"use client"

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/lib/stores/cart.store'
import { getProductName } from '@/lib/utils/i18n'
import { useToast } from '@/hooks/use-toast'
import { useCurrency } from '@/lib/hooks/useCurrency'

interface ProductCardProps {
  product: {
    id: number
    slug?: string
    name?: string
    nameVi?: string
    nameEn?: string
    price?: number
    originalPrice?: string
    salePrice?: string
    compareAtPrice?: number
    images?: Array<{ id: number; url: string; alt?: string; altText?: string; order: number }>
    image?: string
    category?: {
      id: number
      name?: string
      nameVi?: string
      nameEn?: string
      slug: string
    } | string
    inStock?: boolean
    isActive?: boolean
    status?: 'active' | 'inactive' | 'out_of_stock'
    featured?: boolean
    isFeatured?: boolean
    stockQuantity?: number
    inventoryQuantity?: number
    trackInventory?: boolean
    allowOutOfStockPurchase?: boolean
    description?: string
    descriptionVi?: string
    descriptionEn?: string
    sku?: string
    barcode?: string
    categoryId?: string | number
    variants?: any[]
    createdAt?: string
    updatedAt?: string
  }
  locale: string
  onAddToCart?: (productId: number) => void
}

export default function ProductCard({ product, locale, onAddToCart }: ProductCardProps) {
  const t = useTranslations('products')
  const { addItem } = useCartStore()
  const { toast } = useToast()
  const { formatPrice } = useCurrency()

  // Get localized product name
  const productName = getProductName(product, locale)

  // Get first image URL
  const imageUrl = product.images && product.images.length > 0
    ? product.images[0].url
    : product.image

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()

    if (onAddToCart) {
      onAddToCart(product.id)
      return
    }

    // Default behavior: add to cart using store
    try {
      addItem({
        productId: product.id,
        quantity: 1,
        name: productName,
        price: product.price,
        image: imageUrl,
        slug: product.slug,
      })

      toast({
        title: t('addedToCart'),
        description: productName,
      })
    } catch {
      toast({
        title: t('error'),
        description: t('addToCartError'),
        variant: 'destructive',
      })
    }
  }

  // Get category name (localized if object, or string)
  const categoryName = typeof product.category === 'string'
    ? product.category
    : product.category
    ? (locale === 'vi'
        ? product.category.nameVi || product.category.name
        : product.category.nameEn || product.category.name)
    : undefined

  // Use slug if available, otherwise use id
  const productLink = product.slug
    ? `/${locale}/products/${product.slug}`
    : `/${locale}/products/${product.id}`

  return (
    <Link href={productLink}>
      <Card className="group overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={productName}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
              <div className="text-center p-4">
                <ShoppingCart className="h-16 w-16 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500 text-sm">{productName}</p>
              </div>
            </div>
          )}
          {categoryName && (
            <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
              {categoryName}
            </div>
          )}
          {product.inStock === false && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {t('outOfStock')}
              </span>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {productName}
          </h3>
          <div className="flex items-center gap-2">
            {product.compareAtPrice && product.compareAtPrice > (product.price || 0) ? (
              <>
                <p className="text-2xl font-bold text-primary">
                  {formatPrice(product.price || 0)}
                </p>
                <p className="text-sm text-gray-500 line-through">
                  {formatPrice(product.compareAtPrice)}
                </p>
              </>
            ) : (
              <p className="text-2xl font-bold text-primary">
                {formatPrice(product.price || 0)}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Button
            className="w-full"
            onClick={handleAddToCart}
            disabled={product.inStock === false}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {t('addToCart')}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  )
}
