"use client";
import Image from "next/image";
import { ReactNode } from "react";

interface TopHeaderProps {
  brandName: string;
  logo?: ReactNode;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  brandName,
  logo = (
    <Image
      src="/firecrawl-logo-with-fire.png"
      alt="Firecrawl"
      width={160}
      height={57}
      priority
      className="h-[57px] w-auto object-contain" // match intrinsic height to avoid clipping
    />
  ),
}) => {
  return (
    <header className="fixed top-0 inset-x-0 h-[64px] bg-white border-b z-40">
      <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center h-[57px] max-w-[200px] overflow-hidden">
            {logo}
          </div>
        </div>

        {/* Navigation */}
        <nav
          className="hidden md:flex items-center space-x-6"
          aria-label="Main navigation"
        >
          {/* links retained, brand name removed */}
          <a className="text-sm text-gray-600 hover:text-gray-900" href="#">
            Docs
          </a>
          <a className="text-sm text-gray-600 hover:text-gray-900" href="#">
            Pricing
          </a>
          <a className="text-sm text-gray-600 hover:text-gray-900" href="#">
            Support
          </a>
        </nav>

        {/* Right Buttons */}
        <div className="flex items-center space-x-3">
          <button
            className="px-3 py-1.5 text-sm rounded-md border"
            aria-label="Notifications"
          >
            Alerts
          </button>
          <button
            className="px-3 py-1.5 text-sm rounded-md bg-gray-100 hover:bg-gray-200"
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};
