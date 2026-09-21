"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface BannerButtonsProps {
  bannerLink?: string;
  locale: string;
  shopNowText: string;
  learnMoreText: string;
}

export default function BannerButtons({
  bannerLink,
  locale,
  shopNowText,
  learnMoreText,
}: BannerButtonsProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="flex flex-wrap gap-3 md:gap-4" onClick={handleClick}>
      {bannerLink ? (
        <Link href={bannerLink} onClick={handleClick} className="focus:outline-none w-full sm:w-auto">
          <Button
            size="default"
            className="text-sm md:text-base bg-green-600 text-white hover:bg-green-700 focus:ring-0 focus:ring-offset-0 w-full sm:w-auto shadow-md md:shadow-lg whitespace-nowrap"
          >
            {shopNowText}
            <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
          </Button>
        </Link>
      ) : (
        <Link href={`/${locale}/products`} onClick={handleClick} className="focus:outline-none w-full sm:w-auto">
          <Button
            size="default"
            className="text-sm md:text-base bg-green-600 text-white hover:bg-green-700 focus:ring-0 focus:ring-offset-0 w-full sm:w-auto shadow-md md:shadow-lg whitespace-nowrap"
          >
            {shopNowText}
            <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
          </Button>
        </Link>
      )}
      <Link href={`/${locale}/about`} onClick={handleClick} className="focus:outline-none w-full sm:w-auto">
        <Button
          size="default"
          variant="outline"
          className="text-sm md:text-base 
                     bg-white 
                     text-gray-900 
                     border-gray-300 
                     hover:bg-gray-100 
                     focus:ring-0 focus:ring-offset-0 
                     w-full sm:w-auto shadow-md md:shadow-lg whitespace-nowrap"
        >
          {learnMoreText}
        </Button>
      </Link>
    </div>
  );
}

