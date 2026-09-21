"use client"

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useCartStore } from '@/lib/stores/cart.store'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useCurrency } from '@/lib/hooks/useCurrency'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'
import { Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface CheckoutContentProps {
  locale: string
}

const createCheckoutSchema = (locale: string) => {
  const isVi = locale === 'vi'
  return z.object({
    fullName: z.string().min(2, isVi ? 'Họ tên phải có ít nhất 2 ký tự' : 'Full name must be at least 2 characters'),
    email: z.string().email(isVi ? 'Email không hợp lệ' : 'Invalid email address'),
    phoneNumber: z.string().min(10, isVi ? 'Số điện thoại không hợp lệ' : 'Invalid phone number'),
    address: z.string().min(5, isVi ? 'Địa chỉ phải có ít nhất 5 ký tự' : 'Address must be at least 5 characters'),
    ward: z.string().min(1, isVi ? 'Vui lòng nhập phường/xã' : 'Please enter ward'),
    district: z.string().min(1, isVi ? 'Vui lòng nhập quận/huyện' : 'Please enter district'),
    province: z.string().min(1, isVi ? 'Vui lòng nhập tỉnh/thành phố' : 'Please enter province'),
    note: z.string().optional(),
    discountCode: z.string().optional(),
  })
}

type CheckoutFormData = z.infer<ReturnType<typeof createCheckoutSchema>>

export default function CheckoutContent({ locale }: CheckoutContentProps) {
  const t = useTranslations()
  const router = useRouter()
  const { toast } = useToast()
  const { items, subtotal, clearCart } = useCartStore()
  const { user } = useAuthStore()
  const { formatPrice } = useCurrency()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(createCheckoutSchema(locale)),
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      address: '',
      ward: '',
      district: '',
      province: '',
      note: '',
      discountCode: '',
    },
  })

  useEffect(() => {
    // Redirect if cart is empty
    if (items.length === 0) {
      router.push(`/${locale}/cart`)
      return
    }
  }, [items])

  const onSubmit = async (data: CheckoutFormData) => {
    setIsLoading(true)
    try {
      const { orderService } = await import('@/lib/api/services/order.service')

      // Format the address as a single string
      const fullAddress = `${data.address}, ${data.ward}, ${data.district}, ${data.province}`

      console.log('Creating order with data:', {
        customerName: data.fullName,
        customerEmail: data.email,
        itemsCount: items.length,
      })

      const order = await orderService.create({
        customerName: data.fullName,
        customerEmail: data.email,
        customerPhone: data.phoneNumber,
        customerAddress: fullAddress,
        notes: data.note,
        items: items.map(item => {
          const orderItem: any = {
            productId: item.productId,
            productName: item.name,
            quantity: item.quantity,
            price: item.price,
          };

          // Only include variantId if it exists
          if (item.variantId) {
            orderItem.variantId = item.variantId;
          }

          // Only include variantName if it exists
          if (item.variantName) {
            orderItem.variantName = item.variantName;
          }

          return orderItem;
        }),
      })

      console.log('Order created successfully:', order)

      if (!order || !order.orderNumber) {
        throw new Error('Order created but orderNumber is missing')
      }

      // Clear cart
      await clearCart()

      // Show success toast
      toast({
        title: locale === 'vi' ? 'Đặt hàng thành công!' : 'Order placed successfully!',
        description: `${locale === 'vi' ? 'Mã đơn hàng' : 'Order number'}: ${order.orderNumber}`,
      })

      // Redirect to success page
      console.log('Redirecting to:', `/${locale}/checkout/success?orderNumber=${order.orderNumber}`)
      router.push(`/${locale}/checkout/success?orderNumber=${order.orderNumber}`)
    } catch (error: any) {
      console.error('Failed to create order:', error)
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || (locale === 'vi' ? 'Không thể tạo đơn hàng' : 'Failed to create order'),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t('checkout.title')}</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>{locale === 'vi' ? 'Thông tin khách hàng' : 'Customer Information'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="fullName">{locale === 'vi' ? 'Họ và tên' : 'Full Name'} *</Label>
                  <Input
                    id="fullName"
                    {...register('fullName')}
                    placeholder={locale === 'vi' ? 'Nguyễn Văn A' : 'John Doe'}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">{t('checkout.email')} *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="example@email.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phoneNumber">{t('checkout.phone')} *</Label>
                    <Input
                      id="phoneNumber"
                      {...register('phoneNumber')}
                      placeholder={locale === 'vi' ? '0123456789' : '+1234567890'}
                    />
                    {errors.phoneNumber && (
                      <p className="text-sm text-destructive mt-1">{errors.phoneNumber.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle>{t('checkout.shippingAddress')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">{t('checkout.address')} *</Label>
                  <Input
                    id="address"
                    {...register('address')}
                    placeholder={locale === 'vi' ? '123 Đường ABC' : '123 Main Street'}
                  />
                  {errors.address && (
                    <p className="text-sm text-destructive mt-1">{errors.address.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="ward">{locale === 'vi' ? 'Phường/Xã' : 'Ward'} *</Label>
                    <Input
                      id="ward"
                      {...register('ward')}
                      placeholder={locale === 'vi' ? 'Phường 1' : 'Ward 1'}
                    />
                    {errors.ward && (
                      <p className="text-sm text-destructive mt-1">{errors.ward.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="district">{locale === 'vi' ? 'Quận/Huyện' : 'District'} *</Label>
                    <Input
                      id="district"
                      {...register('district')}
                      placeholder={locale === 'vi' ? 'Quận 1' : 'District 1'}
                    />
                    {errors.district && (
                      <p className="text-sm text-destructive mt-1">{errors.district.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="province">{locale === 'vi' ? 'Tỉnh/Thành phố' : 'Province/City'} *</Label>
                    <Input
                      id="province"
                      {...register('province')}
                      placeholder={locale === 'vi' ? 'TP. Hồ Chí Minh' : 'Ho Chi Minh City'}
                    />
                    {errors.province && (
                      <p className="text-sm text-destructive mt-1">{errors.province.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Notes */}
            <Card>
              <CardHeader>
                <CardTitle>{t('checkout.notes')}</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  {...register('note')}
                  className="w-full min-h-[100px] p-3 border rounded-md"
                  placeholder={locale === 'vi' ? 'Ghi chú đơn hàng (tùy chọn)' : 'Order notes (optional)'}
                />
              </CardContent>
            </Card>

            {/* Discount Code */}
            <Card>
              <CardHeader>
                <CardTitle>{locale === 'vi' ? 'Mã giảm giá' : 'Discount Code'}</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  {...register('discountCode')}
                  placeholder={locale === 'vi' ? 'Nhập mã giảm giá (nếu có)' : 'Enter discount code (optional)'}
                />
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>{t('checkout.orderSummary')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2 pt-2">
                  {items.map((item) => {
                    return (
                      <div key={item.id} className="flex gap-3 pb-3 border-b last:border-b-0">
                        <div className="relative w-20 h-20 flex-shrink-0">
                          <div className="relative w-full h-full rounded-md overflow-hidden bg-gray-100">
                            {item.image ? (
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                className="object-cover"
                                sizes="80px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                <Package className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-md z-10">
                            {item.quantity}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm line-clamp-2 mb-1">{item.name}</p>
                          {item.variantName && (
                            <p className="text-xs text-muted-foreground mb-1">
                              {item.variantName}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {formatPrice(item.price)} × {item.quantity}
                            </p>
                            <p className="text-sm font-bold text-primary">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <Separator />

                {/* Price Summary */}
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
                      {locale === 'vi' ? 'Miễn phí' : 'Free'}
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

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading
                    ? (locale === 'vi' ? 'Đang xử lý...' : 'Processing...')
                    : t('checkout.placeOrder')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
