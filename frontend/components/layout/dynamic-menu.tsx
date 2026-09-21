'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { MenuItem } from '@/lib/types/api';

interface DynamicMenuProps {
  items: MenuItem[];
  locale: string;
  className?: string;
}

export default function DynamicMenu({ items, locale, className = '' }: DynamicMenuProps) {
  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);

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

  const renderMenuItem = (item: MenuItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const url = getMenuUrl(item);
    const label = getMenuLabel(item);

    if (!hasChildren) {
      return (
        <Link
          key={item.id}
          href={url}
          target={item.openInNewTab ? '_blank' : undefined}
          rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
          className="text-sm font-medium transition-colors hover:text-primary"
        >
          {label}
        </Link>
      );
    }

    return (
      <div
        key={item.id}
        className="relative"
        onMouseEnter={() => setOpenSubmenu(item.id)}
        onMouseLeave={() => setOpenSubmenu(null)}
      >
        <button className="flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary">
          {label}
          <ChevronDown className="h-4 w-4" />
        </button>

        {openSubmenu === item.id && (
          <div className="absolute left-0 top-full z-50 mt-2 min-w-[200px] rounded-md border bg-white shadow-lg">
            <div className="py-2">
              {item.children!.map((child) => (
                <Link
                  key={child.id}
                  href={getMenuUrl(child)}
                  target={child.openInNewTab ? '_blank' : undefined}
                  rel={child.openInNewTab ? 'noopener noreferrer' : undefined}
                  className="block px-4 py-2 text-sm transition-colors hover:bg-gray-100"
                >
                  {getMenuLabel(child)}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // If className is empty, render items inline (for use in header)
  if (!className) {
    return (
      <>
        {items.map((item) => renderMenuItem(item))}
      </>
    );
  }

  return (
    <nav className={className}>
      {items.map((item) => renderMenuItem(item))}
    </nav>
  );
}

