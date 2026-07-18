"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 border-b border-gray-300 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-start sm:justify-between sm:px-8 sm:py-6">

      {/* LEFT : LOGO */}
      <Link
        href="/"
        className="text-3xl font-light tracking-wide text-gray-700 transition hover:text-gray-900 sm:text-4xl"
      >
        Maintelyd
      </Link>

      {/* RIGHT : DROPDOWN */}
      <div className="relative w-full sm:w-auto sm:group">

        {/* Main Button */}
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="product-price-navigation"
          onClick={() => setIsOpen((open) => !open)}
          className="w-full border border-gray-500 bg-white px-4 py-3 text-center shadow-sm transition hover:bg-gray-100 sm:min-w-[280px] sm:px-6 sm:py-4"
        >
          <div>
            <h2 className="text-xl font-medium text-gray-800 sm:text-2xl">
              World Product Price
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Explore product price analytics
            </p>
          </div>
        </button>

        {/* Dropdown */}
        <div
          className={`
            absolute right-0 top-full z-50 mt-1 w-full
            sm:w-[320px]
            border border-gray-300 bg-white
            shadow-lg transition-all duration-200
            ${isOpen ? "visible opacity-100" : "invisible opacity-0"}
            sm:group-hover:visible sm:group-hover:opacity-100
          `}
          id="product-price-navigation"
          onMouseLeave={() => setIsOpen(false)}
        >
          <Link
            href="/daily-chart"
            onClick={() => setIsOpen(false)}
            className="block border-b border-gray-200 px-5 py-4 text-sm text-gray-700 hover:bg-gray-100"
          >
            Daily Price Comparison
          </Link>

          <Link
            href="/monthly-chart"
            onClick={() => setIsOpen(false)}
            className="block border-b border-gray-200 px-5 py-4 text-sm text-gray-700 hover:bg-gray-100"
          >
            Monthly Price Comparison
          </Link>

          <Link
            href="/daily-table"
            onClick={() => setIsOpen(false)}
            className="block border-b border-gray-200 px-5 py-4 text-sm text-gray-700 hover:bg-gray-100"
          >
            Daily Price Comparison - Table
          </Link>

          <Link
            href="/monthly-table"
            onClick={() => setIsOpen(false)}
            className="block border-b border-gray-200 px-5 py-4 text-sm text-gray-700 hover:bg-gray-100"
          >
            Monthly Price Comparison - Table
          </Link>

          <Link
            href="/country"
            onClick={() => setIsOpen(false)}
            className="block border-b border-gray-200 px-5 py-4 text-sm text-gray-700 hover:bg-gray-100"
          >
            Price Monitoring per Country
          </Link>

          <Link
            href="/raw"
            onClick={() => setIsOpen(false)}
            className="block border-b border-gray-200 px-5 py-4 text-sm text-gray-700 hover:bg-gray-100"
          >
            Raw Data Price
          </Link>

          <Link
            href="/price-agent"
            onClick={() => setIsOpen(false)}
            className="block px-5 py-4 text-sm text-gray-700 hover:bg-gray-100"
          >
            Product Price Master Agent
          </Link>
        </div>
      </div>
    </div>
  );
}
