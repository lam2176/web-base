"use client"

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Trash2, Minus, Plus, ShoppingBag, Package, AlertTriangle, TrendingDown } from 'lucide-react'
import { useCartStore } from '@/lib/stores/cart.store'
import { useCurrency } from '@/lib/hooks/useCurrency'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface CartContentProps {
  locale: string
}

export default function CartContent({ locale }: CartContentProps) {
  const t = useTranslations()
  const router = useRouter()
  const { toast } = useToast()
  const { formatPrice } = useCurrency()
  const [isOperating, setIsOperating] = useState(false)

  const {
    items,
    totalItems,
    subtotal,
    isLoading,
    loadCart,
    updateQuantity,
    removeItem,
  } = useCartStore()

  // Load cart from database on mount
  useEffect(() => {
    loadCart()
  }, [loadCart])

  const handleUpdateQuantity = async (itemId: number, quantity: number) => {
    if (quantity < 1) return
    setIsOperating(true)
    try {
      await updateQuantity(itemId, quantity)
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('cart.error'),
        variant: 'destructive',
      })
    } finally {
      setIsOperating(false)
    }
  }

  const handleRemoveItem = async (itemId: number) => {
    setIsOperating(true)
    try {
      await removeItem(itemId)
      toast({
        title: t('cart.itemRemoved'),
        description: t('cart.itemRemovedDescription'),
      })
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('cart.error'),
        variant: 'destructive',
      })
    } finally {
      setIsOperating(false)
    }
  }

  const handleCheckout = () => {
    router.push(`/${locale}/checkout`)
  }

  // Show loading state while initial cart is loading
  if (isLoading && items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto text-center py-12">
          <CardContent>
            <ShoppingBag className="h-24 w-24 mx-auto mb-4 text-muted-foreground animate-pulse" />
            <h2 className="text-2xl font-bold mb-2">
              {t('cart.loading')}
            </h2>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto text-center py-12">
          <CardContent>
            <ShoppingBag className="h-24 w-24 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">{t('cart.emptyCart')}</h2>
            <p className="text-muted-foreground mb-6">
              {t('cart.emptyCartDescription')}
            </p>
            <Button asChild>
              <Link href={`/${locale}/products`}>
                {t('cart.continueShopping')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{t('cart.title')}</h1>
      <p className="text-muted-foreground mb-6">
        {t('cart.itemsInCart', { count: totalItems })}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            return (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <Link
                      href={`/${locale}/products/${item.slug}`}
                      className="flex-shrink-0"
                    >
                      <div className="relative w-24 h-24 rounded-md overflow-hidden bg-gray-100">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <Package className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/${locale}/products/${item.slug}`}
                        className="font-semibold hover:text-primary line-clamp-2"
                      >
                        {locale === 'vi' 
                          ? (item.nameVi || item.name)
                          : (item.nameEn || item.name)}
                      </Link>
                      {item.variantName && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.variantName}
                        </p>
                      )}

                      {/* Availability & Stock Warnings */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {item.isAvailable === false && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {t('cart.unavailable')}
                          </Badge>
                        )}
                        {item.inStock === false && item.isAvailable !== false && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {t('cart.onlyLeft', { count: item.availableQuantity || 0 })}
                          </Badge>
                        )}
                        {item.priceChanged && item.oldPrice && (
                          <Badge variant="secondary" className="text-xs">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            {t('cart.priceDropped')}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-2">
                        <p className="text-lg font-bold text-primary">
                          {formatPrice(item.price)}
                        </p>
                        {item.priceChanged && item.oldPrice && (
                          <p className="text-sm text-muted-foreground line-through">
                            {formatPrice(item.oldPrice)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex flex-col items-end justify-between">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={isLoading || isOperating}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || isLoading || isOperating}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={isLoading || isOperating}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <p className="text-sm font-semibold">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* Continue Shopping */}
          <Button variant="outline" asChild className="w-full">
            <Link href={`/${locale}/products`}>
              {t('cart.continueShopping')}
            </Link>
          </Button>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>{t('checkout.orderSummary')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Price Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('cart.subtotal')}</span>
                  <span className="font-medium">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('cart.shipping')}</span>
                  <span className="font-medium">
                    {t('cart.calculatedAtCheckout')}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Total */}
              <div className="flex justify-between text-lg font-bold">
                <span>{t('cart.total')}</span>
                <span className="text-primary">
                  {formatPrice(subtotal)}
                </span>
              </div>

              {/* Checkout Button */}
              <Button
                size="lg"
                className="w-full"
                onClick={handleCheckout}
                disabled={items.length === 0 || isLoading || isOperating}
              >
                {t('cart.proceedToCheckout')}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                {t('cart.shippingNote')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
