"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useCartStore } from '@/lib/stores/cart.store'
import { useCustomerAuthStore } from '@/lib/store/customerAuthStore'
import { customerAddressApi, type Address } from '@/lib/api/customerAuth'
import { guestCheckoutStorage } from '@/lib/utils/localStorage'
import { useCurrency } from '@/lib/hooks/useCurrency'
import { usePromoStore } from '@/lib/stores/promo.store'
import { discountCodeService } from '@/lib/api/services/discount-code.service'
import { couponService } from '@/lib/api/services/coupon.service'
import { DiscountCode } from '@/lib/types/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { CustomerAuthModal } from '@/components/customer/customer-auth-modal'
import Image from 'next/image'
import { Package, LogIn, User, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'

interface CheckoutContentProps {
  locale: string
}

const createCheckoutSchema = (t: any) => {
  return z.object({
    fullName: z.string().min(2, t('checkout.validation.fullNameMin')),
    email: z.string().email(t('checkout.validation.emailInvalid')),
    phoneNumber: z.string().min(10, t('checkout.validation.phoneInvalid')),
    address: z.string().min(5, t('checkout.validation.addressMin')),
    ward: z.string().min(1, t('checkout.validation.wardRequired')),
    district: z.string().min(1, t('checkout.validation.districtRequired')),
    province: z.string().min(1, t('checkout.validation.provinceRequired')),
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
  const { customer, accessToken, isAuthenticated } = useCustomerAuthStore()
  const { formatPrice } = useCurrency()
  const autoCoupon = usePromoStore((state) => state.autoCoupon)
  const setAutoCoupon = usePromoStore((state) => state.setAutoCoupon)

  const [isLoading, setIsLoading] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null)
  const [discountLoading, setDiscountLoading] = useState(false)
  const [discountError, setDiscountError] = useState<string | null>(null)
  const [cartLoaded, setCartLoaded] = useState(false)
  const [addressesKey, setAddressesKey] = useState(0)
  const [saveAddress, setSaveAddress] = useState(true) // Save new address by default

  // Check if a saved address is selected (not new address)
  const isAddressSelected = selectedAddressId !== null

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(createCheckoutSchema(t)),
    defaultValues: {
      fullName: '',
      email: '',
      phoneNumber: '',
      address: '',
      ward: '',
      district: '',
      province: '',
      note: '',
      discountCode: '',
    },
  })

  // Load customer addresses if logged in - always reload on mount
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      loadAddresses()
    }
  }, [isAuthenticated, accessToken])

  // Reload addresses when page becomes visible (user switches back to this tab/window)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated && accessToken) {
        loadAddresses()
      }
    }

    const handleFocus = () => {
      if (isAuthenticated && accessToken) {
        loadAddresses()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [isAuthenticated, accessToken])

  // Load guest info from localStorage if not logged in
  useEffect(() => {
    if (!isAuthenticated) {
      const savedInfo = guestCheckoutStorage.get()
      if (savedInfo) {
        setValue('fullName', savedInfo.customerName)
        setValue('email', savedInfo.customerEmail)
        setValue('phoneNumber', savedInfo.customerPhone)
        setValue('address', savedInfo.address)
        setValue('ward', savedInfo.ward || '')
        setValue('district', savedInfo.district || '')
        setValue('province', savedInfo.province || '')
        setValue('note', savedInfo.notes || '')
      }
    }
  }, [isAuthenticated, setValue])

  // Set customer info if logged in (only if no address is selected)
  useEffect(() => {
    if (isAuthenticated && customer && selectedAddressId === null && addresses.length === 0) {
      setValue('fullName', customer.fullName)
      setValue('email', customer.email)
      if (customer.phoneNumber) {
        setValue('phoneNumber', customer.phoneNumber)
      }
    }
  }, [isAuthenticated, customer, setValue, selectedAddressId, addresses.length])

  const discountCodeValue = watch('discountCode')

  const autoDiscountAmount = useMemo(() => {
    if (!autoCoupon) return 0
    const value = parseFloat(autoCoupon.discountValue || '0')
    if (!value) return 0
    const amount =
      autoCoupon.discountType === 'percentage'
        ? (subtotal * value) / 100
        : value
    return Math.min(amount, subtotal)
  }, [autoCoupon, subtotal])

  const manualDiscountAmount = useMemo(() => {
    if (!appliedDiscount) return 0
    const value = parseFloat(appliedDiscount.discountValue || '0')
    if (!value) return 0
    const amount =
      appliedDiscount.discountType === 'percentage'
        ? (subtotal * value) / 100
        : value
    return Math.min(amount, subtotal)
  }, [appliedDiscount, subtotal])

  const totalDiscount = useMemo(
    () => Math.min(subtotal, autoDiscountAmount + manualDiscountAmount),
    [subtotal, autoDiscountAmount, manualDiscountAmount]
  )
  const payableTotal = useMemo(
    () => Math.max(0, subtotal - totalDiscount),
    [subtotal, totalDiscount]
  )

  const loadAddresses = async () => {
    if (!accessToken) return

    setLoadingAddresses(true)
    try {
      const addressList = await customerAddressApi.getAll(accessToken)
      setAddresses(addressList)

      // Auto-select default address
      const defaultAddress = addressList.find(addr => addr.isDefault)
      if (defaultAddress) {
        // Directly set the address here instead of calling handleAddressSelect
        // to avoid timing issues with state updates
        setSelectedAddressId(defaultAddress.id)
        setValue('fullName', defaultAddress.fullName)
        setValue('phoneNumber', defaultAddress.phoneNumber)
        setValue('address', defaultAddress.address)
        setValue('ward', defaultAddress.ward || '')
        setValue('district', defaultAddress.district || '')
        setValue('province', defaultAddress.province || '')
      }
    } catch (error) {
      console.error('Failed to load addresses:', error)
    } finally {
      setLoadingAddresses(false)
    }
  }

  const handleAddressSelect = (addressId: string) => {
    if (addressId === 'new') {
      setSelectedAddressId(null)
      setValue('fullName', customer?.fullName || '')
      setValue('phoneNumber', customer?.phoneNumber || '')
      setValue('address', '')
      setValue('ward', '')
      setValue('district', '')
      setValue('province', '')
      return
    }

    const address = addresses.find(a => a.id === parseInt(addressId))
    if (address) {
      setSelectedAddressId(address.id)
      setValue('fullName', address.fullName)
      setValue('phoneNumber', address.phoneNumber)
      setValue('address', address.address)
      setValue('ward', address.ward || '')
      setValue('district', address.district || '')
      setValue('province', address.province || '')
    }
  }

  // Mark cart as loaded after mount
  useEffect(() => {
    // Give a small delay to allow cart store to initialize
    const timer = setTimeout(() => {
      setCartLoaded(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Only redirect if cart is loaded and truly empty
    if (cartLoaded && items.length === 0) {
      router.push(`/${locale}/cart`)
      return
    }
  }, [items, cartLoaded, locale, router])

  // Load active coupon if not already in store
  useEffect(() => {
    const loadActiveCoupon = async () => {
      if (autoCoupon) return // Already have a coupon
      try {
        const coupons = await couponService.getActive()
        if (coupons.length > 0) {
          const coupon = coupons[0]
          const now = Date.now()
          const start = new Date(coupon.startDate).getTime()
          const end = new Date(coupon.endDate).getTime()
          if (now >= start && now <= end) {
            setAutoCoupon(coupon)
          }
        }
      } catch (error) {
        console.error('Failed to load active coupon:', error)
      }
    }
    loadActiveCoupon()
  }, [autoCoupon, setAutoCoupon])

  const onSubmit = async (data: CheckoutFormData) => {
    setIsLoading(true)
    try {
      const { orderService } = await import('@/lib/api/services/order.service')

      // Save address to customer profile if checkbox is checked and it's a new address
      if (isAuthenticated && saveAddress && selectedAddressId === null && accessToken) {
        try {
          await customerAddressApi.create(accessToken, {
            fullName: data.fullName,
            phoneNumber: data.phoneNumber,
            address: data.address,
            ward: data.ward,
            district: data.district,
            province: data.province,
            isDefault: addresses.length === 0, // Set as default if it's the first address
          })
          // Reload addresses after saving
          await loadAddresses()
        } catch (error) {
          console.error('Failed to save address:', error)
          // Continue with order creation even if address save fails
        }
      }

      // Format the address as a single string
      const fullAddress = `${data.address}, ${data.ward}, ${data.district}, ${data.province}`

      const orderData: any = {
        customerName: data.fullName,
        customerEmail: data.email,
        customerPhone: data.phoneNumber,
        customerAddress: fullAddress,
        discountCodeId: appliedDiscount?.id,
        couponCode: autoCoupon?.code,
        notes: data.note,
        items: items.map(item => {
          const productName = locale === 'vi' 
            ? (item.nameVi || item.name)
            : (item.nameEn || item.name)
          
          const orderItem: any = {
            productId: item.productId,
            productName,
            quantity: item.quantity,
            price: item.price,
          };

          if (item.variantId) {
            orderItem.variantId = item.variantId;
          }

          if (item.variantName) {
            orderItem.variantName = item.variantName;
          }

          return orderItem;
        }),
      }

      // Note: customerId will be automatically extracted from JWT token by backend
      const order = await orderService.create(orderData)

      if (!order || !order.orderNumber) {
        throw new Error('Order created but orderNumber is missing')
      }

      // Save guest checkout info to localStorage if not logged in
      if (!isAuthenticated) {
        guestCheckoutStorage.save({
          customerName: data.fullName,
          customerEmail: data.email,
          customerPhone: data.phoneNumber,
          address: data.address,
          ward: data.ward,
          district: data.district,
          province: data.province,
          notes: data.note,
        })
      }

      // Clear cart
      await clearCart()
      setAppliedDiscount(null)
      setValue('discountCode', '')
      setDiscountError(null)

      // Show success toast
      toast({
        title: t('checkout.success.title'),
        description: `${t('checkout.success.orderNumber')}: ${order.orderNumber}`,
      })

      // Redirect to success page
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

  const emailValue = watch('email')
  const phoneValue = watch('phoneNumber')

  const handleApplyDiscount = useCallback(async () => {
    const code = (discountCodeValue || '').trim()

    if (!code) {
      setDiscountError(
        locale === 'vi' ? 'Vui lòng nhập mã giảm giá' : 'Please enter a discount code'
      )
      return
    }

    setDiscountLoading(true)
    setDiscountError(null)
    try {
      // Pass customer email and phone for per-user usage validation
      const discount = await discountCodeService.validate({
        code,
        customerEmail: emailValue || undefined,
        customerPhone: phoneValue || undefined,
      })
      setAppliedDiscount(discount)
      setValue('discountCode', discount.code)
      toast({
        title: t('checkout.discount.applied'),
        description: t('checkout.discount.appliedDescription', { code: discount.code }),
      })
    } catch (error: any) {
      setAppliedDiscount(null)
      const message =
        error?.response?.data?.message ||
        t('checkout.discount.invalid')
      setDiscountError(message)
    } finally {
      setDiscountLoading(false)
    }
  }, [discountCodeValue, emailValue, phoneValue, locale, toast, setValue, t])

  const handleRemoveDiscount = useCallback(() => {
    setAppliedDiscount(null)
    setDiscountError(null)
    setValue('discountCode', '')
  }, [setValue])

  // Show loading while cart is being loaded
  if (!cartLoaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="mt-2 text-sm text-gray-600">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t('checkout.title')}</h1>

      {/* Login Banner for Guest Users */}
      {!isAuthenticated && (
        <Card className="mb-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <LogIn className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  {t('auth.loginToCheckout')}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {t('checkout.loginBanner.autoFillInfo')}
                </p>
              </div>
            </div>
            <Button onClick={() => setShowAuthModal(true)} variant="default">
              {t('auth.login')}
            </Button>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address & Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {t('checkout.shippingAddress')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Address Selection for Logged-in Users */}
                {isAuthenticated && addresses.length > 0 && (
                  <div>
                    <Label>{t('checkout.form.selectAddress')}</Label>
                    <Select
                      value={selectedAddressId?.toString() || 'new'}
                      onValueChange={handleAddressSelect}
                      disabled={loadingAddresses}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('checkout.form.selectAddressPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {addresses.map(address => (
                          <SelectItem key={address.id} value={address.id.toString()}>
                            {address.addressName && <span className="font-semibold text-primary">{address.addressName} • </span>}
                            {address.fullName} - {address.phoneNumber}
                            {address.isDefault && <Badge className="ml-2" variant="secondary">{t('checkout.form.defaultAddress')}</Badge>}
                          </SelectItem>
                        ))}
                        <SelectItem value="new">
                          {t('checkout.form.addNewAddress')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Customer Name */}
                <div>
                  <Label htmlFor="fullName">{t('checkout.form.fullName')} *</Label>
                  <Input
                    id="fullName"
                    {...register('fullName')}
                    placeholder={t('checkout.form.fullNamePlaceholder')}
                    disabled={isAddressSelected}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>
                  )}
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">{t('checkout.email')} *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder={t('checkout.form.emailPlaceholder')}
                      disabled={isAuthenticated}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phoneNumber">{t('checkout.form.phoneNumber')} *</Label>
                    <Input
                      id="phoneNumber"
                      {...register('phoneNumber')}
                      placeholder={t('checkout.form.phoneNumberPlaceholder')}
                      disabled={isAddressSelected}
                    />
                    {errors.phoneNumber && (
                      <p className="text-sm text-destructive mt-1">{errors.phoneNumber.message}</p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Address Details */}
                <div>
                  <Label htmlFor="address">{t('checkout.form.addressLabel')} *</Label>
                  <Input
                    id="address"
                    {...register('address')}
                    placeholder={t('checkout.form.addressPlaceholder')}
                    disabled={isAddressSelected}
                  />
                  {errors.address && (
                    <p className="text-sm text-destructive mt-1">{errors.address.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="ward">{t('checkout.form.ward')} *</Label>
                    <Input
                      id="ward"
                      {...register('ward')}
                      placeholder={t('checkout.form.wardPlaceholder')}
                      disabled={isAddressSelected}
                    />
                    {errors.ward && (
                      <p className="text-sm text-destructive mt-1">{errors.ward.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="district">{t('checkout.form.district')} *</Label>
                    <Input
                      id="district"
                      {...register('district')}
                      placeholder={t('checkout.form.districtPlaceholder')}
                      disabled={isAddressSelected}
                    />
                    {errors.district && (
                      <p className="text-sm text-destructive mt-1">{errors.district.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="province">{t('checkout.form.province')} *</Label>
                    <Input
                      id="province"
                      {...register('province')}
                      placeholder={t('checkout.form.provincePlaceholder')}
                      disabled={isAddressSelected}
                    />
                    {errors.province && (
                      <p className="text-sm text-destructive mt-1">{errors.province.message}</p>
                    )}
                  </div>
                </div>

                {/* Save Address Checkbox - Only show for logged-in users with new address */}
                {isAuthenticated && !isAddressSelected && (
                  <div className="flex items-start space-x-2 pt-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <Checkbox
                      id="saveAddress"
                      checked={saveAddress}
                      onCheckedChange={(checked) => setSaveAddress(checked as boolean)}
                      className="mt-0.5"
                    />
                    <Label htmlFor="saveAddress" className="text-sm font-normal cursor-pointer leading-relaxed">
                      💾 {t('checkout.form.saveAddressForLater')}
                    </Label>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t('checkout.additionalInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="note">{t('checkout.notes')}</Label>
                  <Textarea
                    id="note"
                    {...register('note')}
                    placeholder={t('checkout.form.notePlaceholder')}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="discountCode">{t('checkout.discountCode')}</Label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      id="discountCode"
                      {...register('discountCode')}
                      placeholder={locale === 'vi' ? 'Nhập mã giảm giá' : 'Enter discount code'}
                      disabled={!!appliedDiscount}
                      readOnly={!!appliedDiscount}
                      className={appliedDiscount ? 'bg-muted text-muted-foreground' : undefined}
                    />
                    {appliedDiscount ? (
                      <Button type="button" variant="secondary" onClick={handleRemoveDiscount}>
                        {locale === 'vi' ? 'Hủy mã' : 'Remove'}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleApplyDiscount}
                        disabled={discountLoading}
                      >
                        {discountLoading
                          ? locale === 'vi'
                            ? 'Đang kiểm tra...'
                            : 'Checking...'
                          : locale === 'vi'
                          ? 'Áp dụng'
                          : 'Apply'}
                      </Button>
                    )}
                  </div>
                  {appliedDiscount && (
                    <p className="text-xs text-green-600 mt-1">
                      {locale === 'vi'
                        ? `Đã áp dụng mã ${appliedDiscount.code}`
                        : `Code ${appliedDiscount.code} applied`}
                    </p>
                  )}
                  {discountError && (
                    <p className="text-xs text-destructive mt-1">{discountError}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('checkout.orderSummary')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {items.map((item) => (
                    <div key={`${item.productId}-${item.variantId || 'no-variant'}`} className="flex gap-3">
                      <div className="relative w-16 h-16 flex-shrink-0 bg-gray-100 rounded">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={locale === 'vi' 
                              ? (item.nameVi || item.name)
                              : (item.nameEn || item.name)}
                            fill
                            className="object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-1">
                          {locale === 'vi' 
                            ? (item.nameVi || item.name)
                            : (item.nameEn || item.name)}
                        </p>
                        {item.variantName && (
                          <p className="text-xs text-muted-foreground">{item.variantName}</p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {locale === 'vi' ? 'SL' : 'Qty'}: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">{formatPrice(item.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('checkout.subtotal')}</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('checkout.shipping')}</span>
                    <span>{locale === 'vi' ? 'Miễn phí' : 'Free'}</span>
                  </div>
                  {autoDiscountAmount > 0 && autoCoupon && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>
                        {locale === 'vi'
                          ? `Chương trình: ${autoCoupon.nameVi || autoCoupon.nameEn || autoCoupon.code}`
                          : `Promotion: ${autoCoupon.nameEn || autoCoupon.nameVi || autoCoupon.code}`}
                      </span>
                      <span>-{formatPrice(autoDiscountAmount)}</span>
                    </div>
                  )}
                  {manualDiscountAmount > 0 && appliedDiscount && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>
                        {locale === 'vi'
                          ? `Mã ${appliedDiscount.code}`
                          : `Code ${appliedDiscount.code}`}
                      </span>
                      <span>-{formatPrice(manualDiscountAmount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>{t('checkout.total')}</span>
                    <span className="text-primary">{formatPrice(payableTotal)}</span>
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? (locale === 'vi' ? 'Đang xử lý...' : 'Processing...') : t('checkout.placeOrder')}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  {locale === 'vi'
                    ? 'Bằng cách đặt hàng, bạn đồng ý với các điều khoản và điều kiện của chúng tôi'
                    : 'By placing an order, you agree to our terms and conditions'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {/* Auth Modal */}
      <CustomerAuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        defaultMode="login"
        onSuccess={() => {
          setShowAuthModal(false)
          loadAddresses()
        }}
      />
    </div>
  )
}
