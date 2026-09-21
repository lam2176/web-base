"use client"

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { ShoppingCart, Menu, User, LogOut, Package, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import MobileMenu from './mobile-menu'
import { useStoreInfoStore } from '@/lib/stores/store-info.store'
import { useCartStore } from '@/lib/stores/cart.store'
import { useCustomerAuthStore } from '@/lib/store/customerAuthStore'
import { useRouter, usePathname } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CustomerAuthModal } from '@/components/customer/customer-auth-modal'
import { useMenuPages } from '@/lib/hooks/use-menu'

interface HeaderProps {
  locale: string
}

export default function Header({ locale }: HeaderProps) {
  const t = useTranslations('common')
  const tCustomer = useTranslations('customer')
  const tAuth = useTranslations('auth')
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { storeInfo, fetchStoreInfo } = useStoreInfoStore()
  const { items, loadCart } = useCartStore()
  const { customer, isAuthenticated, clearAuth } = useCustomerAuthStore()
  const { data: menuPages = [] } = useMenuPages()

  useEffect(() => {
    if (!storeInfo) {
      fetchStoreInfo()
    }
    // Load cart from database on mount
    loadCart()
  }, [storeInfo, fetchStoreInfo, loadCart])

  const handleLogout = () => {
    clearAuth()
    router.push(`/${locale}`)
  }

  const switchLanguage = () => {
    const newLocale = locale === 'en' ? 'vi' : 'en'
    // Get current path without locale prefix
    const pathWithoutLocale = pathname.replace(/^\/(en|vi)/, '') || ''
    // Keep query params and hash if any
    const search = window.location.search || ''
    const hash = window.location.hash || ''
    // Redirect to same path with new locale
    window.location.href = `/${newLocale}${pathWithoutLocale}${search}${hash}`
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-3 md:px-4">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center space-x-2 flex-shrink-0">
          <div className="flex items-center">
            {storeInfo?.logo?.url ? (
              <div className="relative h-8 w-24 md:h-10 md:w-32">
                <Image
                  src={storeInfo.logo.url}
                  alt={locale === 'vi' ? storeInfo.nameVi : storeInfo.nameEn}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            ) : (
              <span className="text-xl md:text-2xl font-bold text-primary">
                {storeInfo ? (locale === 'vi' ? storeInfo.nameVi : storeInfo.nameEn) : 'SHOP'}
              </span>
            )}
          </div>
        </Link>

        {/* Desktop Navigation - Centered */}
        <nav className="hidden md:flex items-center justify-center space-x-8 flex-1">
          {/* Static menu items - always shown */}
          <Link
            href={`/${locale}`}
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            {t('home')}
          </Link>
          <Link
            href={`/${locale}/products`}
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            {t('products')}
          </Link>
          {/* Pages with showInMenu=true */}
          {menuPages.map((page) => (
            <Link
              key={page.id}
              href={`/${locale}/${page.slug}`}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {locale === 'vi' ? page.titleVi : page.titleEn}
            </Link>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
          {/* Language Switcher - Desktop only */}
          <Button
            variant="ghost"
            size="sm"
            onClick={switchLanguage}
            className="hidden md:flex items-center gap-2"
            title={locale === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
          >
            <Image
              src={locale === 'vi' ? '/flags/en.svg' : '/flags/vi.svg'}
              alt={locale === 'vi' ? 'English' : 'Vietnamese'}
              width={32}
              height={20}
              className="rounded border"
            />
            <span className="text-sm font-semibold">
              {locale === 'vi' ? 'EN' : 'VI'}
            </span>
          </Button>

          {/* Profile / Login - Desktop */}
          {isAuthenticated && customer ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hidden md:flex">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {customer.fullName || customer.email?.split('@')[0]}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {customer.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/profile`} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>{tCustomer('profile')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/profile/orders`} className="cursor-pointer">
                    <Package className="mr-2 h-4 w-4" />
                    <span>{tCustomer('myOrders')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/profile/addresses`} className="cursor-pointer">
                    <MapPin className="mr-2 h-4 w-4" />
                    <span>{tCustomer('addresses')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{tAuth('logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAuthModal(true)}
              className="hidden md:flex"
            >
              <User className="mr-2 h-4 w-4" />
              {tAuth('login')}
            </Button>
          )}

          {/* User Icon - Mobile */}
          {isAuthenticated && customer ? (
            <Link href={`/${locale}/profile`}>
              <Button variant="ghost" size="icon" className="md:hidden">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowAuthModal(true)}
              className="md:hidden"
            >
              <User className="h-5 w-5" />
            </Button>
          )}

          {/* Cart Icon */}
          <Link href={`/${locale}/cart`}>
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center">
                  {items.length}
                </span>
              )}
            </Button>
          </Link>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        locale={locale}
      />

      {/* Auth Modal */}
      <CustomerAuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        defaultMode="login"
      />
    </header>
  )
}
