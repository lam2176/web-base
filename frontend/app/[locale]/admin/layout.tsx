"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/lib/stores/auth.store";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FolderTree,
  FileText,
  Image as ImageIcon,
  Settings,
  LogOut,
  Menu,
  X,
  Ticket,
  Tag,
  Users,
  User as UserIcon,
  Globe,
  UserCircle,
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";

const navigation = [
  { key: "dashboard", href: "/admin", icon: LayoutDashboard },
  { key: "categories", href: "/admin/categories", icon: FolderTree },
  { key: "products", href: "/admin/products", icon: Package },
  { key: "orders", href: "/admin/orders", icon: ShoppingCart },
  { key: "customers", href: "/admin/customers", icon: UserCircle },
  { key: "pages", href: "/admin/pages", icon: FileText },
  { key: "banners", href: "/admin/banners", icon: ImageIcon },
  { key: "coupons", href: "/admin/coupons", icon: Ticket },
  { key: "discountCodes", href: "/admin/discount-codes", icon: Tag },
  { key: "media", href: "/admin/media", icon: ImageIcon },
  { key: "users", href: "/admin/users", icon: Users },
  { key: "settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("auth.admin.nav");
  const { user, isAuthenticated, logout, checkAuth } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    // Skip auth check for login page
    if (pathname?.includes("/admin/login")) {
      return;
    }

    // Small delay to allow zustand to restore state from localStorage
    const timer = setTimeout(() => {
      // Check authentication after state is restored
      if (!isAuthenticated) {
        router.push(`/${locale}/admin/login`);
        return;
      }

      // Check if user has admin/staff role
      if (user && user.role !== "admin" && user.role !== "staff") {
        router.push(`/${locale}`);
        return;
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user, router, locale, pathname]);

  const handleLogout = async () => {
    await logout();
    router.push(`/${locale}/admin/login`);
  };

  const switchLanguage = () => {
    const newLocale = locale === "vi" ? "en" : "vi";
    const currentPath = pathname?.replace(`/${locale}`, "") || "/admin";
    router.push(`/${newLocale}${currentPath}`);
  };

  // Don't render admin layout on login page
  if (pathname?.includes("/admin/login")) {
    return <>{children}</>;
  }

  // Show loading while checking auth
  if (!isAuthenticated || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not admin/staff, don't render (will redirect in useEffect)
  if (user.role !== "admin" && user.role !== "staff") {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b px-6">
            <h1 className="text-xl font-bold text-gray-900">
              {t("adminPanel")}
            </h1>
            <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {navigation.map((item) => {
              const isActive = pathname === `/${locale}${item.href}`;
              return (
                <Link
                  key={item.key}
                  href={`/${locale}${item.href}`}
                  className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {t(item.key)}
                </Link>
              );
            })}
          </nav>

          {/* User info & Logout */}
          <div className="border-t p-4">
            <div className="mb-3 flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
                <UserIcon className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {user?.fullName || user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="mr-3 h-5 w-5" />
              {t("logout")}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-6">
          <div className="flex items-center gap-4">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900">
              {navigation.find((item) => pathname === `/${locale}${item.href}`)
                ?.key
                ? t(
                    navigation.find(
                      (item) => pathname === `/${locale}${item.href}`
                    )!.key
                  )
                : t("adminPanel")}
            </h2>
          </div>
            <button
              onClick={switchLanguage}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              title={
                locale === "vi" ? "Switch to English" : "Chuyển sang Tiếng Việt"
              }
            >
              <Globe className="h-5 w-5" />
              <span className="hidden sm:inline">
                {locale === "vi" ? "English" : "Tiếng Việt"}
              </span>
              <span className="sm:hidden">{locale.toUpperCase()}</span>
            </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
