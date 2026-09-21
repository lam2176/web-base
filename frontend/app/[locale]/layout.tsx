import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from "@/providers/query-provider";
import { storeService } from "@/lib/api/services/store.service";
import "../globals.css";

const inter = Inter({ subsets: ["latin"] });

const locales = ["en", "vi"];

// Force dynamic rendering to always fetch fresh data
export const dynamic = "force-dynamic";

// Revalidate metadata every hour in production
export const revalidate = 3600;

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  try {
    const storeInfo = await storeService.getInfo();
    const storeName = locale === "vi" ? storeInfo.nameVi : storeInfo.nameEn;
    const description =
      locale === "vi"
        ? storeInfo.descriptionVi || "Cửa hàng thương mại điện tử chất lượng"
        : storeInfo.descriptionEn || "Your one-stop shop for quality products";

    return {
      title: {
        default: storeName,
        template: `%s | ${storeName}`,
      },
      description,
      keywords:
        locale === "vi"
          ? "mua sắm, thương mại điện tử, cửa hàng online"
          : "shopping, e-commerce, online store",
      openGraph: {
        title: storeName,
        description,
        type: "website",
        locale: locale === "vi" ? "vi_VN" : "en_US",
        siteName: storeName,
        images: storeInfo.logo?.url
          ? [{ url: storeInfo.logo.url, alt: storeName }]
          : [],
      },
      twitter: {
        card: "summary_large_image",
        title: storeName,
        description,
        images: storeInfo.logo?.url ? [storeInfo.logo.url] : [],
      },
    };
  } catch (error) {
    // Fallback metadata if API call fails
    console.error("[Metadata] Error fetching store info:", error);
    const fallbackTitle = locale === "vi" ? "Cửa hàng" : "Shop";
    return {
      title: {
        default: fallbackTitle,
        template: `%s | ${fallbackTitle}`,
      },
      description:
        locale === "vi"
          ? "Cửa hàng thương mại điện tử chất lượng"
          : "Your one-stop shop for quality products",
    };
  }
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Validate locale
  if (!locales.includes(locale)) {
    notFound();
  }

  // Get messages for the current locale
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <QueryProvider>
          <NextIntlClientProvider messages={messages}>
            {children}
            <Toaster />
          </NextIntlClientProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
