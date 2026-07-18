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

type DailyPrice = {
  date: string;
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
  measurement_scale_standardized: string;   
};

// ✅ constrain metric to ONLY numeric keys
type MetricKey = {
  [K in keyof DailyPrice]-?: DailyPrice[K] extends number | undefined ? K : never;
}[keyof DailyPrice] & string;

const COLORS = [
  "#8884d8","#82ca9d","#ff7300","#ff0000","#00c49f","#0088fe","#a83279","#ffc658",
  "#8dd1e1","#d0ed57","#a4de6c","#d88884","#84d8c4","#c484d8","#d8c484","#84a9d8",
  "#d884a6","#a6d884","#ff8c42","#6a4c93","#1982c4"
]; //added here 30 april 2026 15:47

// ✅ Dashboard
export default function Dashboard({ data }: { data: DailyPrice[] }) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedMeasurementScales, setSelectedMeasurementScales] = useState<string[]>([]);  

  const [countries, setCountries] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [measurementScales, setMeasurementScales] = useState<string[]>([]);  

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [filtered, setFiltered] = useState<DailyPrice[]>(data || []);

  useEffect(() => {
    if (!data) return;

  const sortedCategories = [...new Set(data.map(d => d.product_category))]
    .sort((a, b) => a.localeCompare(b));

const sortedCountries = [...new Set(data.map(d => d.country))]
  .sort((a, b) => a.localeCompare(b));

const sortedMeasurementScales =
  [...new Set(data.map(d => d.measurement_scale_standardized))]
    .sort((a, b) => a.localeCompare(b));

setCategories(sortedCategories);
setCountries(sortedCountries);
setMeasurementScales(sortedMeasurementScales);
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

if (selectedMeasurementScales.length > 0) {
  result = result.filter(d =>
    selectedMeasurementScales.includes(
      d.measurement_scale_standardized
    )
  );
}  

  if (startDate) {
    result = result.filter(d => d.date >= startDate);
  }

  if (endDate) {
    result = result.filter(d => d.date <= endDate);
  }

  setFiltered(result);
}, [
  data,
  selectedCategories,
  selectedCountries,
  selectedMeasurementScales,
  startDate,
  endDate
]);

  return (
<div className="min-h-screen bg-white text-black">

  <Navbar />    
    <div className="data-page-layout">

      {/* LEFT TOP (filters) */}      
      <div className="data-page-filters">
        <h1 className="text-xl font-bold">Daily Price Comparison</h1>

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

{/* MEASUREMENT SCALE MULTI */}
<div>
  <label className="font-semibold">
    Select Measurement Scales
  </label>

  <select
    multiple
    className="w-full border p-2 h-32"
    value={selectedMeasurementScales}
    onChange={(e) =>
      setSelectedMeasurementScales(
        Array.from(
          e.target.selectedOptions,
          (opt) => opt.value
        )
      )
    }
  >
    {measurementScales.map((m) => (
      <option key={m}>{m}</option>
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
  <label className="font-semibold">Start Date</label>
  <input
    type="date"
    className="w-full border p-2"
    value={startDate}
    onChange={(e) => setStartDate(e.target.value)}
  />
</div>

<div>
  <label className="font-semibold">End Date</label>
  <input
    type="date"
    className="w-full border p-2"
    value={endDate}
    onChange={(e) => setEndDate(e.target.value)}
  />
</div>

{/* DOWNLOAD BUTTON*/}
<div>
  <button
    className="bg-teal-400 hover:bg-teal-500 text-black px-4 py-2 rounded w-full" 
    onClick={() => {
      const header = Object.keys(filtered[0] || {});
      const rows = filtered.map(obj => header.map(h => obj[h as keyof DailyPrice]));

      const csv = [
        header.join(","),
        ...rows.map(r => r.join(","))
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "daily_price.csv";
      a.click();
    }}
  >
    Download CSV
  </button>
</div>

</div>

{/*TABLE ON RIGHT SIDE */}
<div className="data-page-content overflow-x-auto rounded-xl border border-black bg-white p-4">
  <table className="w-full border border-black text-sm bg-white text-black">
    <thead className="bg-yellow-200 text-black">
      <tr>
        <th className="border border-black p-2 text-black">Date</th>
        <th className="border border-black p-2 text-black">Product Category</th>
        <th className="border border-black p-2 text-black">Country</th>
        <th className="border border-black p-2 text-black">Local Price</th>
        <th className="border border-black p-2 text-black">USD Price</th>
        <th className="border border-black p-2 text-black">EUR Price</th>
        <th className="border border-black p-2 text-black">CHF Price</th>
        <th className="border border-black p-2 text-black">JPY Price</th>
        <th className="border border-black p-2 text-black">CNY Price</th>
        <th className="border border-black p-2 text-black">AUD Price</th>
        <th className="border border-black p-2 text-black">SGD Price</th>
        <th className="border border-black p-2 text-black">Local Price (median)</th>
        <th className="border border-black p-2 text-black">USD Price (median)</th>
        <th className="border border-black p-2 text-black">EUR Price (median)</th>
        <th className="border border-black p-2 text-black">CHF Price (median)</th>
        <th className="border border-black p-2 text-black">JPY Price (median)</th>
        <th className="border border-black p-2 text-black">CNY Price (median)</th>
        <th className="border border-black p-2 text-black">AUD Price (median)</th>
        <th className="border border-black p-2 text-black">SGD Price (median)</th>
        <th className="border border-black p-2 text-black">Standard Deviation Local Price</th>
        <th className="border border-black p-2 text-black">Count Products</th>
        <th className="border border-black p-2 text-black">Update Timestamp (UTC)</th>
        <th className="border border-black p-2 text-black">Measurement Scale Standardized</th>        
      </tr>
    </thead>
    <tbody>
      {filtered.map((row, i) => (
        <tr key={i}>
          <td className="border border-black p-2 text-black bg-white">{row.date}</td>
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
          <td className="border border-black p-2 text-black bg-white">{row.measurement_scale_standardized}</td>                                                                                                                                                                                   
        </tr>
      ))}
    </tbody>
  </table>
</div>

</div>
</div>
);
}
