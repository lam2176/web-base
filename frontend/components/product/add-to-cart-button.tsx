"use client"

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Minus, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AddToCartButtonProps {
  productId: string
  productName: string
  inStock?: boolean
  maxQuantity?: number
}

export default function AddToCartButton({
  productId,
  productName,
  inStock = true,
  maxQuantity = 99,
}: AddToCartButtonProps) {
  const t = useTranslations('products')
  const { toast } = useToast()
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const increaseQuantity = () => {
    if (quantity < maxQuantity) {
      setQuantity(quantity + 1)
    }
  }

  const handleAddToCart = async () => {
    setIsAdding(true)

    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Show success toast
      toast({
        title: t('addedToCart'),
        description: `${quantity}x ${productName}`,
      })

      // Reset quantity after adding
      setQuantity(1)
    } catch (error) {
      // Show error toast
      toast({
        title: t('error'),
        description: t('addToCartError'),
        variant: 'destructive',
      })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium">{t('quantity')}:</span>
        <div className="flex items-center border rounded-md">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={decreaseQuantity}
            disabled={quantity <= 1 || !inStock}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center font-semibold">{quantity}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={increaseQuantity}
            disabled={quantity >= maxQuantity || !inStock}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {maxQuantity <= 10 && (
          <span className="text-sm text-muted-foreground">
            ({t('onlyLeft', { count: maxQuantity })})
          </span>
        )}
      </div>

      {/* Add to Cart Button */}
      <Button
        size="lg"
        className="w-full"
        onClick={handleAddToCart}
        disabled={!inStock || isAdding}
      >
        <ShoppingCart className="h-5 w-5 mr-2" />
        {isAdding ? t('adding') : inStock ? t('addToCart') : t('outOfStock')}
      </Button>

      {!inStock && (
        <p className="text-sm text-destructive text-center">
          {t('outOfStockMessage')}
        </p>
      )}
    </div>
  )
}
