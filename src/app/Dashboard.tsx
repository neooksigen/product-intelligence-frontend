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
    count_all_data_collected_refined: number;
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
      <div className="flex h-[110px] w-full max-w-[300px] items-center justify-center rounded-full border border-gray-500 bg-white px-6 text-center shadow-sm">
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
      className="flex h-[70px] w-full max-w-[260px] items-center justify-center border border-gray-500 bg-white px-4 text-center text-sm font-medium text-gray-800 transition hover:bg-gray-100 sm:w-[170px]"
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
    <div className="min-h-screen bg-[#efefef] px-4 py-5 text-gray-700 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">

  <Navbar />

        {/* Welcome Section */}
        <div className="mt-10 text-center sm:mt-14">
          <h2 className="text-4xl font-light text-gray-700 sm:text-5xl">
            Welcome to Maintelyd
          </h2>

          <p className="mt-7 text-xl font-light leading-relaxed text-gray-700 sm:mt-10 sm:text-3xl">
            We are an early phase business for reliable global data intelligence and analytics, powered with AI.
          </p>

          <p className="mt-7 text-xl font-light leading-relaxed text-gray-700 sm:mt-8 sm:text-3xl">
            Our current 1st data product is World Product Price
          </p>
        </div>

        {/* Metrics */}
        <div className="mt-12 grid grid-cols-1 justify-items-center gap-10 md:mt-20 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Product prices discovered since March 2026"
            value={totalCollected}
            subtitle=""
          />

          <MetricCard
            title="Product prices refined since March 2026"
            value={totalRefined}
            subtitle=""
          />

          <MetricCard
            title="Product prices discovered on yesterday"
            value={yesterdayCollected}
            subtitle=""
          />

          <MetricCard
            title="Product prices discovered on today"
            value={todayCollected}
            subtitle=""
          />
        </div>

{/* Monitoring Table */}
<div className="mt-14 flex flex-col items-center sm:mt-20">

  {/* Title */}
  <h3 className="mb-6 text-center text-2xl font-light text-gray-700 sm:text-3xl">
    Last 1 Month Product Price Discovery Result
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
        <div className="inline-block max-w-full self-center overflow-x-auto border border-gray-400 bg-white shadow-sm">
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
                  Product Price Discovery Result
                </th>
                <th className="border border-gray-300 px-6 py-4 text-sm font-medium text-gray-700">
                  Refining Result
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
                  <td className="border border-gray-300 px-6 py-4 text-sm text-gray-700">
                    {row.count_all_data_collected_refined.toLocaleString()}
                  </td>                  
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-8 flex max-w-full items-center gap-2 overflow-x-auto pb-2">
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
        <div className="mt-14 text-center sm:mt-20">
          <h2 className="text-4xl font-light text-gray-700 sm:text-5xl">
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

        {/* Contact */}
        <div className="mt-24 border-t border-gray-300 pt-10 text-center">
          <p className="text-lg text-gray-700">
            Any inquiries, contact{" "}
            <a
              href="mailto:maintelyd@gmail.com"
              className="font-medium text-gray-900 underline hover:text-gray-600"
            >
              maintelyd@gmail.com
            </a>
            . Happy to help!
          </p>
        </div>

      </div>
    </div>
  );
}
