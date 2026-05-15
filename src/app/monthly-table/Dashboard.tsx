"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import Link from "next/link";
import  Navbar from "@/components/NavbarCustom";

type MonthlyPrice = {
  year_month: string;
  country: string;
  product_category: string;

  count_products?: number;  

  price_local_standardized?: number;
  price_usd_standardized?: number;
  price_eur_standardized?: number;
  price_chf_standardized?: number;
  price_jpy_standardized?: number;
  price_cny_standardized?: number;
  price_aud_standardized?: number;
  price_sgd_standardized?: number;

  price_local_standardized_median?: number;
  price_usd_standardized_median?: number;
  price_eur_standardized_median?: number;
  price_chf_standardized_median?: number;
  price_jpy_standardized_median?: number;
  price_cny_standardized_median?: number;
  price_aud_standardized_median?: number;
  price_sgd_standardized_median?: number;

  stddev_price_local?: number;
  update_timestamp_utc?: string;
};

// ✅ constrain metric to ONLY numeric keys
type MetricKey = {
  [K in keyof MonthlyPrice]-?: MonthlyPrice[K] extends number | undefined ? K : never;
}[keyof MonthlyPrice] & string;

const COLORS = [
  "#8884d8","#82ca9d","#ff7300","#ff0000","#00c49f","#0088fe","#a83279","#ffc658",
  "#8dd1e1","#d0ed57","#a4de6c","#d88884","#84d8c4","#c484d8","#d8c484","#84a9d8",
  "#d884a6","#a6d884","#ff8c42","#6a4c93","#1982c4"
]; //added here 30 april 2026 15:47

// ✅ Dashboard
export default function Dashboard({ data }: { data: MonthlyPrice[] }) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);

  const [countries, setCountries] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const [startMonth, setStartMonth] = useState("");
  const [endMonth, setEndMonth] = useState("");

  const [filtered, setFiltered] = useState<MonthlyPrice[]>(data || []);

  useEffect(() => {
    if (!data) return;
  const sortedCategories = [...new Set(data.map(d => d.product_category))]
    .sort((a, b) => a.localeCompare(b));

  const sortedCountries = [...new Set(data.map(d => d.country))]
    .sort((a, b) => a.localeCompare(b));

  setCategories(sortedCategories);
  setCountries(sortedCountries);   
  }, [data]);

  useEffect(() => {
  if (!data) return;

  let result = [...data];

  if (selectedCategories.length > 0) {
    result = result.filter(d =>
      selectedCategories.includes(d.product_category)
    );
  }

  if (selectedCountries.length > 0) {
    result = result.filter(d =>
      selectedCountries.includes(d.country)
    );
  }

  if (startMonth) {
    result = result.filter(d => d.year_month >= startMonth);
  }

  if (endMonth) {
    result = result.filter(d => d.year_month <= endMonth);
  }

  setFiltered(result);
  }, [data, selectedCategories, selectedCountries, startMonth, endMonth]);

  return (
<div className="min-h-screen bg-white text-black">

  <Navbar />

    <div className="p-6 grid grid-cols-4 grid-rows-2 gap-6">

      {/* LEFT TOP (filters) */}      
      <div className="col-span-1 row-span-1 space-y-6">
        <h1 className="text-xl font-bold">Monthly Price Comparison</h1>

{/* CATEGORY MULTI */}
<div>
  <label className="font-semibold">Select Product Categories</label>
  <select
    multiple
    className="w-full border p-2 h-32"
    value={selectedCategories}
    onChange={(e) =>
      setSelectedCategories(
        Array.from(e.target.selectedOptions, (opt) => opt.value)
      )
    }
  >
    {categories.map((c) => (
      <option key={c}>{c}</option>
    ))}
  </select>
</div>

{/* COUNTRY MULTI */}
<div>
  <label className="font-semibold">Select Countries</label>
  <select
    multiple
    className="w-full border p-2 h-32"
    value={selectedCountries}
    onChange={(e) =>
      setSelectedCountries(
        Array.from(e.target.selectedOptions, (opt) => opt.value)
      )
    }
  >
    {countries.map((c) => (
      <option key={c}>{c}</option>
    ))}
  </select>
</div>

{/* DATE RANGE */}
<div>
  <label className="font-semibold">Start Month</label>
  <input
    type="month"
    className="w-full border p-2"
    value={startMonth}
    onChange={(e) => setStartMonth(e.target.value)}
  />
</div>

<div>
  <label className="font-semibold">End Month</label>
  <input
    type="month"
    className="w-full border p-2"
    value={endMonth}
    onChange={(e) => setEndMonth(e.target.value)}
  />
</div>

{/* DOWNLOAD BUTTON*/}
<div>
  <button
    className="bg-teal-400 hover:bg-teal-500 text-black px-4 py-2 rounded w-full" 
    onClick={() => {
      const header = Object.keys(filtered[0] || {});
      const rows = filtered.map(obj => header.map(h => obj[h as keyof MonthlyPrice]));

      const csv = [
        header.join(","),
        ...rows.map(r => r.join(","))
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "monthly_price.csv";
      a.click();
    }}
  >
    Download CSV
  </button>
</div>

</div>

{/*TABLE ON RIGHT SIDE */}
<div className="col-span-3 bg-white p-4 rounded-xl overflow-auto border border-black">
  <table className="w-full border border-black text-sm bg-white text-black">
    <thead className="bg-yellow-200 text-black">
      <tr>
        <th className="border p-2">Year Month</th>
        <th className="border p-2">Product Category</th>
        <th className="border p-2">Country</th>
        <th className="border p-2">Local Price</th>
        <th className="border p-2">USD Price</th>
        <th className="border p-2">EUR Price</th>
        <th className="border p-2">CHF Price</th>
        <th className="border p-2">JPY Price</th>
        <th className="border p-2">CNY Price</th>
        <th className="border p-2">AUD Price</th>
        <th className="border p-2">SGD Price</th>
        <th className="border p-2">Local Price (median)</th>
        <th className="border p-2">USD Price (median)</th>
        <th className="border p-2">EUR Price (median)</th>
        <th className="border p-2">CHF Price (median)</th>
        <th className="border p-2">JPY Price (median)</th>
        <th className="border p-2">CNY Price (median)</th>
        <th className="border p-2">AUD Price (median)</th>
        <th className="border p-2">SGD Price (median)</th>
        <th className="border p-2">Standard Deviation Local Price</th>
        <th className="border p-2">Count Products</th>
        <th className="border p-2">Update Timestamp (UTC)</th>
      </tr>
    </thead>
    <tbody>
      {filtered.map((row, i) => (
        <tr key={i}>
          <td className="border border-black p-2 text-black bg-white">{row.year_month}</td>
          <td className="border border-black p-2 text-black bg-white">{row.product_category}</td>
          <td className="border border-black p-2 text-black bg-white">{row.country}</td>
          <td className="border border-black p-2 text-black bg-white">{row.price_local_standardized}</td>
          <td className="border border-black p-2 text-black bg-white">{row.price_usd_standardized}</td>
          <td className="border border-black p-2 text-black bg-white">{row.price_eur_standardized}</td>
          <td className="border border-black p-2 text-black bg-white">{row.price_chf_standardized}</td>
          <td className="border border-black p-2 text-black bg-white">{row.price_jpy_standardized}</td>
          <td className="border border-black p-2 text-black bg-white">{row.price_cny_standardized}</td>
          <td className="border border-black p-2 text-black bg-white">{row.price_aud_standardized}</td>
          <td className="border border-black p-2 text-black bg-white">{row.price_sgd_standardized}</td>
          <td className="border border-black p-2 text-black bg-white">{row.price_local_standardized_median}</td>
          <td className="border border-black p-2 text-black bg-white">{row.price_usd_standardized_median}</td>
          <td className="border border-black p-2 text-black bg-white">{row.price_eur_standardized_median}</td>
          <td className="border border-black p-2 text-black bg-white">{row.price_chf_standardized_median}</td>
          <td className="border border-black p-2 text-black bg-white">{row.price_jpy_standardized_median}</td>
          <td className="border border-black p-2 text-black bg-white">{row.price_cny_standardized_median}</td>
          <td className="border border-black p-2 text-black bg-white">{row.price_aud_standardized_median}</td>
          <td className="border border-black p-2 text-black bg-white">{row.price_sgd_standardized_median}</td> 
          <td className="border border-black p-2 text-black bg-white">{row.stddev_price_local}</td>   
          <td className="border border-black p-2 text-black bg-white">{row.count_products}</td>   
          <td className="border border-black p-2 text-black bg-white">{row.update_timestamp_utc}</td>                                                                                                                                                                            
        </tr>
      ))}
    </tbody>
  </table>
</div>

</div>
</div>
);
}

