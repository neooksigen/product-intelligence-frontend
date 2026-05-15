"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <div className="flex items-start justify-between border-b border-gray-300 bg-white px-8 py-6 shadow-sm">

      {/* LEFT : LOGO */}
      <Link
        href="/"
        className="text-4xl font-light tracking-wide text-gray-700 hover:text-gray-900 transition"
      >
        Maintelyd
      </Link>

      {/* RIGHT : DROPDOWN */}
      <div className="relative group">

        {/* Main Button */}
        <button
          className="
            border border-gray-500 bg-white px-6 py-4
            text-center shadow-sm transition hover:bg-gray-100
            min-w-[280px]
          "
        >
          <div>
            <h2 className="text-2xl font-medium text-gray-800">
              World Product Price
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Explore product price analytics
            </p>
          </div>
        </button>

        {/* Dropdown */}
        <div
          className="
            invisible absolute right-0 top-full z-50 mt-1
            w-[320px]
            border border-gray-300 bg-white
            opacity-0 shadow-lg
            transition-all duration-200
            group-hover:visible
            group-hover:opacity-100
          "
        >
          <Link
            href="/daily-chart"
            className="block border-b border-gray-200 px-5 py-4 text-sm text-gray-700 hover:bg-gray-100"
          >
            Daily Price Comparison
          </Link>

          <Link
            href="/monthly-chart"
            className="block border-b border-gray-200 px-5 py-4 text-sm text-gray-700 hover:bg-gray-100"
          >
            Monthly Price Comparison
          </Link>

          <Link
            href="/daily-table"
            className="block border-b border-gray-200 px-5 py-4 text-sm text-gray-700 hover:bg-gray-100"
          >
            Daily Price Comparison - Table
          </Link>

          <Link
            href="/monthly-table"
            className="block border-b border-gray-200 px-5 py-4 text-sm text-gray-700 hover:bg-gray-100"
          >
            Monthly Price Comparison - Table
          </Link>

          <Link
            href="/country"
            className="block border-b border-gray-200 px-5 py-4 text-sm text-gray-700 hover:bg-gray-100"
          >
            Price Monitoring per Country
          </Link>

          <Link
            href="/raw"
            className="block px-5 py-4 text-sm text-gray-700 hover:bg-gray-100"
          >
            Raw Data Price
          </Link>
        </div>
      </div>
    </div>
  );
}