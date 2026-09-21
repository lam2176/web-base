"use client"

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Facebook, Instagram, Mail, Phone, MapPin, Youtube } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useStoreInfoStore } from '@/lib/stores/store-info.store'
import { useFooterMenus, useMenuPages } from '@/lib/hooks/use-menu'
import { Menu, MenuItem } from '@/lib/types/api'

interface FooterProps {
  locale: string
}

export default function Footer({ locale }: FooterProps) {
  const t = useTranslations('common')
  const { storeInfo, fetchStoreInfo } = useStoreInfoStore()
  const { data: footerMenusData = [], refetch: refetchFooterMenus } = useFooterMenus()
  const { data: menuPages = [] } = useMenuPages()
  const [menuDisplay, setMenuDisplay] = useState<'off' | 'header' | 'footer' | 'both'>('both')
  
  useEffect(() => {
    const updateMenuDisplay = () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('menuDisplay') as 'off' | 'header' | 'footer' | 'both'
        setMenuDisplay(saved || 'both')
        // Refetch menus when display changes
        refetchFooterMenus()
      }
    }
    
    // Initial load
    updateMenuDisplay()
    
    // Listen for changes
    window.addEventListener('menuDisplayChanged', updateMenuDisplay as EventListener)
    
    return () => {
      window.removeEventListener('menuDisplayChanged', updateMenuDisplay as EventListener)
    }
  }, [refetchFooterMenus])
  
  // Filter menus based on display setting and ensure only active menus
  // TEMPORARILY DISABLE ALL DATABASE MENUS until old menus are deleted from database
  // To re-enable: uncomment the code below and comment out the empty array
  const footerMenus: Menu[] = [] // Disable all database menus temporarily
  
  // Uncomment below to re-enable database menus after running disable-old-menus.sql:
  /*
  const footerMenus = (menuDisplay === 'footer' || menuDisplay === 'both')
    ? (footerMenusData || []).filter(menu => {
        // Only show menus that are explicitly active with valid ID and items
        if (!menu || !menu.id || typeof menu.id !== 'number') return false;
        if (menu.isActive !== true) return false;
        if (!menu.items || menu.items.length === 0) return false;
        // Ensure all items are active
        const hasActiveItems = menu.items.some(item => 
          item && item.id && item.isActive === true && !item.parentId
        );
        return hasActiveItems;
      })
    : []
  */

  useEffect(() => {
    if (!storeInfo) {
      fetchStoreInfo()
    }
  }, [storeInfo, fetchStoreInfo])

  const getMenuUrl = (item: MenuItem): string => {
    if (item.type === 'custom' && item.url) {
      return item.url;
    }
    if (item.type === 'page' && item.pageSlug) {
      return `/${locale}/${item.pageSlug}`;
    }
    if (item.type === 'category' && item.categoryId) {
      return `/${locale}/category/${item.categoryId}`;
    }
    if (item.type === 'product') {
      return `/${locale}/products`;
    }
    return '#';
  };

  const getMenuLabel = (item: MenuItem): string => {
    return locale === 'vi' ? item.labelVi : item.labelEn;
  };

  return (
    <footer className="border-t bg-background">
      <div className="container px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Store Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              {storeInfo ? (locale === 'vi' ? storeInfo.nameVi : storeInfo.nameEn) : 'SHOP'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {storeInfo
                ? (locale === 'vi' ? storeInfo.descriptionVi || t('footer.description') : storeInfo.descriptionEn || t('footer.description'))
                : t('footer.description')}
            </p>
            <div className="flex space-x-4">
              {storeInfo?.socialLinks?.facebook && (
                <a
                  href={storeInfo.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {storeInfo?.socialLinks?.instagram && (
                <a
                  href={storeInfo.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {storeInfo?.socialLinks?.tiktok && (
                <a
                  href={storeInfo.socialLinks.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
              )}
              {storeInfo?.socialLinks?.youtube && (
                <a
                  href={storeInfo.socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Youtube className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          {/* Dynamic Footer Menus */}
          {footerMenus.length > 0 ? (
            footerMenus
              .filter(menu => menu.id && menu.isActive === true)
              .map((menu) => (
              <div key={menu.id} className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {locale === 'vi' ? menu.nameVi : menu.nameEn}
                </h3>
                <ul className="space-y-2">
                  {menu.items?.filter(item => !item.parentId && item.isActive === true && item.id).map((item) => (
                    <li key={item.id}>
                      <Link
                        href={getMenuUrl(item)}
                        target={item.openInNewTab ? '_blank' : undefined}
                        rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        {getMenuLabel(item)}
                      </Link>
                      {/* Sub-menu items */}
                      {item.children && item.children.length > 0 && (
                        <ul className="ml-4 mt-1 space-y-1">
                          {item.children.filter(child => child.isActive === true && child.id).map((child) => (
                            <li key={child.id}>
                              <Link
                                href={getMenuUrl(child)}
                                target={child.openInNewTab ? '_blank' : undefined}
                                rel={child.openInNewTab ? 'noopener noreferrer' : undefined}
                                className="text-xs text-muted-foreground hover:text-primary transition-colors"
                              >
                                {getMenuLabel(child)}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : null}

          {/* Quick Links - Always show */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href={`/${locale}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('home')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/products`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('products')}
                </Link>
              </li>
              {/* Pages with showInMenu=true */}
              {menuPages.map((page) => (
                <li key={page.id}>
                  <Link
                    href={`/${locale}/${page.slug}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {locale === 'vi' ? page.titleVi : page.titleEn}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('footer.contact')}</h3>
            <ul className="space-y-3">
              {storeInfo?.address && (
                <li className="flex items-start space-x-3 text-sm text-muted-foreground">
                  <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>{storeInfo.address}</span>
                </li>
              )}
              {storeInfo?.hotline && (
                <li className="flex items-center space-x-3 text-sm text-muted-foreground">
                  <Phone className="h-5 w-5 flex-shrink-0" />
                  <a href={`tel:${storeInfo.hotline}`} className="hover:text-primary">
                    {storeInfo.hotline}
                  </a>
                </li>
              )}
              {storeInfo?.email && (
                <li className="flex items-center space-x-3 text-sm text-muted-foreground">
                  <Mail className="h-5 w-5 flex-shrink-0" />
                  <a href={`mailto:${storeInfo.email}`} className="hover:text-primary">
                    {storeInfo.email}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Google Maps */}
          {(storeInfo?.mapUrl || storeInfo?.mapUrl) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('footer.location')}</h3>
              <div className="w-full h-48 rounded-lg overflow-hidden">
                <iframe
                  key={`map-${locale}`}
                  src={
                    locale === 'vi' 
                      ? storeInfo.mapUrl || storeInfo.mapUrl
                      : storeInfo.mapUrl || storeInfo.mapUrl
                  }
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} {storeInfo ? (locale === 'vi' ? storeInfo.nameVi : storeInfo.nameEn) : 'SHOP'}. {t('footer.rights')}
            </p>
            <p className="text-sm text-muted-foreground">
              {locale === 'vi' ? 'Phát triển bởi' : 'Developed by'}{' '}
              <a
                href="https://3ktechone.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                3K TechOne
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
