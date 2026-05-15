"use client";

import Link from "next/link";
import { useState } from "react";
import  Navbar from "@/components/NavbarCustom";

type DashboardProps = {
  totalCollected: number;
  totalRefined: number;
  yesterdayCollected: number;
  todayCollected: number;
  monitoringRows: {
    date: string;
    country: string;
    count_all_data_collected: number;
  }[];
  lastUpdate: string;
};

function MetricCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: number;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex h-[110px] w-[220px] items-center justify-center rounded-full border border-gray-500 bg-white px-6 text-center shadow-sm">
        <div>
          <p className="text-mg font-small text-gray-700">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-gray-800">
            {value.toLocaleString()}
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-600 text-center">{subtitle}</p>
    </div>
  );
}

function ExploreButton({
  title,
  href,
}: {
  title: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex h-[70px] w-[170px] items-center justify-center border border-gray-500 bg-white text-center text-sm font-medium text-gray-800 transition hover:bg-gray-100"
    >
      {title}
    </Link>
  );
}

export default function Dashboard({
  totalCollected,
  totalRefined,
  yesterdayCollected,
  todayCollected,
  monitoringRows,
  lastUpdate,
}: DashboardProps) {
  return (
    <div className="min-h-screen bg-[#efefef] px-6 py-8 text-gray-700">
      <div className="mx-auto max-w-7xl">

  <Navbar />

        {/* Welcome Section */}
        <div className="mt-14 text-center">
          <h2 className="text-5xl font-light text-gray-700">
            Welcome to Maintelyd
          </h2>

          <p className="mt-10 text-3xl font-light text-gray-700">
            We are an early phase business for data mining around the world
            with AI.
          </p>

          <p className="mt-8 text-3xl font-light text-gray-700">
            Our current 1st data product is World Product Price
          </p>
        </div>

        {/* Metrics */}
        <div className="mt-20 grid grid-cols-1 gap-10 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Data mined since March 2026"
            value={totalCollected}
            subtitle=""
          />

          <MetricCard
            title="Data mined & refined since March 2026"
            value={totalRefined}
            subtitle=""
          />

          <MetricCard
            title="Data mined on yesterday"
            value={yesterdayCollected}
            subtitle=""
          />

          <MetricCard
            title="Data mined on today"
            value={todayCollected}
            subtitle=""
          />
        </div>

{/* Monitoring Table */}
<div className="mt-20 flex flex-col items-center">

  {/* Title */}
  <h3 className="mb-6 text-3xl font-light text-gray-700">
    Last 1 Month Data Mining Result
  </h3>

  {(() => {
    const rowsPerPage = 10;

    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(
      monitoringRows.length / rowsPerPage
    );

    const startIndex = (currentPage - 1) * rowsPerPage;

    const currentRows = monitoringRows.slice(
      startIndex,
      startIndex + rowsPerPage
    );

    return (
      <>
        {/* Table */}
        <div className="overflow-hidden border border-gray-400 bg-white shadow-sm">
          <table className="min-w-[520px] border-collapse text-left">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-6 py-4 text-sm font-medium text-gray-700">
                  Date
                </th>

                <th className="border border-gray-300 px-6 py-4 text-sm font-medium text-gray-700">
                  Country
                </th>

                <th className="border border-gray-300 px-6 py-4 text-sm font-medium text-gray-700">
                  Data Mining Result
                </th>
              </tr>
            </thead>

            <tbody>
              {currentRows.map((row, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 px-6 py-4 text-sm text-gray-700">
                    {row.date}
                  </td>

                  <td className="border border-gray-300 px-6 py-4 text-sm text-gray-700">
                    {row.country}
                  </td>

                  <td className="border border-gray-300 px-6 py-4 text-sm text-gray-700">
                    {row.count_all_data_collected.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-8 flex items-center gap-2">
          {Array.from({ length: totalPages }).map((_, index) => {
            const page = index + 1;

            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`
                  h-10 w-10 border text-sm transition
                  ${
                    currentPage === page
                      ? "border-gray-700 bg-gray-700 text-white"
                      : "border-gray-400 bg-white text-gray-700 hover:bg-gray-100"
                  }
                `}
              >
                {page}
              </button>
            );
          })}
        </div>
      </>
    );
  })()}
</div>

        {/* Last Update */}
        <div className="mt-10 text-sm text-gray-700">
          <span className="font-semibold">Last Update :</span>{" "}
          {lastUpdate}
          <span className="text-gray-500">
            {" "}(UTC) {/*timezone is UTC.*/}
          </span>
        </div>

        {/* Explore */}
        <div className="mt-20 text-center">
          <h2 className="text-5xl font-light text-gray-700">
            Start Explore !
          </h2>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-5">
            <ExploreButton
              title="Daily Price Comparison"
              href="/daily-chart"
            />

            <ExploreButton
              title="Monthly Price Comparison"
              href="/monthly-chart"
            />

            <ExploreButton
              title="Daily Price Comparison - Table"
              href="/daily-table"
            />

            <ExploreButton
              title="Monthly Price Comparison - Table"
              href="/monthly-table"
            />

            <ExploreButton
              title="Price Monitoring per Country"
              href="/country"
            />

            <ExploreButton
              title="Raw Data Price"
              href="/raw"
            />
          </div>
        </div>
      </div>
    </div>
  );
}