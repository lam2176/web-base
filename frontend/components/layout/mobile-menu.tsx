"use client"

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { X, User, Package, MapPin, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { useCustomerAuthStore } from '@/lib/store/customerAuthStore'
import { CustomerAuthModal } from '@/components/customer/customer-auth-modal'
import { useRouter, usePathname } from 'next/navigation'
import { Separator } from '@/components/ui/separator'
import Image from 'next/image'
import { useMenuPages } from '@/lib/hooks/use-menu'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  locale: string
}

export default function MobileMenu({ isOpen, onClose, locale }: MobileMenuProps) {
  const t = useTranslations('common')
  const tCustomer = useTranslations('customer')
  const tAuth = useTranslations('auth')
  const router = useRouter()
  const pathname = usePathname()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { customer, isAuthenticated, clearAuth } = useCustomerAuthStore()
  const { data: menuPages = [] } = useMenuPages()

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

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

  const handleLogout = () => {
    clearAuth()
    onClose()
    router.push(`/${locale}`)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 md:hidden"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-background z-50 shadow-xl md:hidden animate-in slide-in-from-right duration-300">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-background">
            <span className="text-lg font-semibold">Menu</span>
            <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-muted">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto">
            {/* User Info - if logged in */}
            {isAuthenticated && customer && (
              <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-b">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center shadow-md">
                    <User className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold truncate">
                      {customer.fullName || customer.email?.split('@')[0]}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {customer.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Login prompt - if not logged in */}
            {!isAuthenticated && (
              <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-b">
                <Button
                  variant="default"
                  className="w-full h-11"
                  onClick={() => {
                    setShowAuthModal(true)
                    onClose()
                  }}
                >
                  <User className="mr-2 h-5 w-5" />
                  {tAuth('login')}
                </Button>
              </div>
            )}

            <div className="p-4">
              <ul className="space-y-1">
              <li>
                <Link
                  href={`/${locale}`}
                  className="block py-3 px-3 text-base font-medium transition-colors hover:text-primary hover:bg-muted rounded-lg"
                  onClick={onClose}
                >
                  {t('home')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/products`}
                  className="block py-3 px-3 text-base font-medium transition-colors hover:text-primary hover:bg-muted rounded-lg"
                  onClick={onClose}
                >
                  {t('products')}
                </Link>
              </li>
              {/* Pages with showInMenu=true */}
              {menuPages.map((page) => (
                <li key={page.id}>
                  <Link
                    href={`/${locale}/${page.slug}`}
                    className="block py-3 px-3 text-base font-medium transition-colors hover:text-primary hover:bg-muted rounded-lg"
                    onClick={onClose}
                  >
                    {locale === 'vi' ? page.titleVi : page.titleEn}
                  </Link>
                </li>
              ))}
              </ul>

            {/* Profile Links - if logged in */}
            {isAuthenticated && customer && (
              <>
                <Separator className="my-4" />
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {tCustomer('profile')}
                </p>
                <ul className="space-y-1">
                  <li>
                    <Link
                      href={`/${locale}/profile`}
                      className="flex items-center gap-3 py-3 px-3 text-base font-medium transition-colors hover:text-primary hover:bg-muted rounded-lg"
                      onClick={onClose}
                    >
                      <User className="h-5 w-5" />
                      {tCustomer('profile')}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={`/${locale}/profile/orders`}
                      className="flex items-center gap-3 py-3 px-3 text-base font-medium transition-colors hover:text-primary hover:bg-muted rounded-lg"
                      onClick={onClose}
                    >
                      <Package className="h-5 w-5" />
                      {tCustomer('myOrders')}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={`/${locale}/profile/addresses`}
                      className="flex items-center gap-3 py-3 px-3 text-base font-medium transition-colors hover:text-primary hover:bg-muted rounded-lg"
                      onClick={onClose}
                    >
                      <MapPin className="h-5 w-5" />
                      {tCustomer('addresses')}
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 py-3 px-3 text-base font-medium transition-colors hover:bg-red-50 text-red-600 w-full text-left rounded-lg"
                    >
                      <LogOut className="h-5 w-5" />
                      {tAuth('logout')}
                    </button>
                  </li>
                </ul>
              </>
            )}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <div className="flex gap-3">
              <Button
                variant="outline"
                className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-3 py-2 shadow-sm ${
                  locale === 'en' ? 'bg-primary/10 text-primary' : 'bg-white text-gray-600'
                }`}
                onClick={() => {
                  if (locale !== 'en') switchLanguage()
                  onClose()
                }}
              >
                <Image src="/flags/en.svg" alt="English" width={32} height={20} className="rounded border" />
                <span className="font-semibold">EN</span>
              </Button>
              <Button
                variant="outline"
                className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-3 py-2 shadow-sm ${
                  locale === 'vi' ? 'bg-primary/10 text-primary' : 'bg-white text-gray-600'
                }`}
                onClick={() => {
                  if (locale !== 'vi') switchLanguage()
                  onClose()
                }}
              >
                <Image src="/flags/vi.svg" alt="Vietnamese" width={32} height={20} className="rounded border" />
                <span className="font-semibold">VI</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <CustomerAuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        defaultMode="login"
      />
    </>
  )
}
