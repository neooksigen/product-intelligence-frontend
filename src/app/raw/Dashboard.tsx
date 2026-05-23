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

type RawPrice = {
  date: string;
  product_name: string;
  quantity: string;
  measurement_scale: string;
  price: string;
  source: string;
  rating: string;
  review_count: string;
  place: string;
  method: string;
  source_date: string;
  timestamp_extract_utc: string;
  raw_product_name: string;
  product_name_en: string;
  measurement_scale_standardized: string;
  quantity_standardized: number;
  
  price_local: number;
  price_usd: number;
  price_eur: number;
  price_chf: number;
  price_jpy: number;
  price_cny: number;
  price_aud: number;
  price_sgd: number;

  product_category: string;
  country: string;
  id: string;
  update_timestamp_utc: string;
};

// ✅ constrain metric to ONLY numeric keys
type MetricKey = {
  [K in keyof RawPrice]-?: RawPrice[K] extends number | undefined ? K : never;
}[keyof RawPrice] & string;

const COLORS = [
  "#8884d8","#82ca9d","#ff7300","#ff0000","#00c49f","#0088fe","#a83279","#ffc658",
  "#8dd1e1","#d0ed57","#a4de6c","#d88884","#84d8c4","#c484d8","#d8c484","#84a9d8",
  "#d884a6","#a6d884","#ff8c42","#6a4c93","#1982c4"
]; //added here 30 april 2026 15:47

// ✅ Dashboard
export default function Dashboard({ data }: { data: RawPrice[] }) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);

  const [countries, setCountries] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  //const [filtered, setFiltered] = useState<RawPrice[]>(data || []);
  const [filtered, setFiltered] = useState<RawPrice[]>([]);

  //this useEffect to limit data last 2 days when the page is loaded.
useEffect(() => {
  if (!data || data.length === 0) return;

  // get max date from dataset (latest date)
  const maxDate = data.reduce((max, d) =>
    d.date > max ? d.date : max,
    data[0].date
  );

  // calculate 2 days before
  const max = new Date(maxDate);
  const min = new Date(max);
  min.setDate(max.getDate() - 1); //edited 23 may 2026

  const format = (dt: Date) => dt.toISOString().slice(0, 10);

  setStartDate(format(min));
  setEndDate(format(max));
}, [data]);

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

  if (startDate) {
    result = result.filter(d => d.date >= startDate);
  }

  if (endDate) {
    result = result.filter(d => d.date <= endDate);
  }

  setFiltered(result);
  }, [data, selectedCategories, selectedCountries, startDate, endDate]);

  return (
<div className="min-h-screen bg-white text-black">

  <Navbar />       
    <div className="p-6 grid grid-cols-4 grid-rows-2 gap-6">

      {/* LEFT TOP (filters) */}      
      <div className="col-span-1 row-span-1 space-y-6">
        <h1 className="text-xl font-bold">Raw Product Price</h1>

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
      const rows = filtered.map(obj => header.map(h => obj[h as keyof RawPrice]));

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
<div className="col-span-3 bg-white p-4 rounded-xl overflow-auto border border-black">
  <table className="w-full border border-black text-sm bg-white text-black">
    <thead className="bg-yellow-200 text-black">
      <tr>
        <th className="border p-2">Date</th>
        <th className="border p-2">Product Name</th>
        <th className="border p-2">Quantity</th>        
        <th className="border p-2">Measurement Scale</th>
        <th className="border p-2">Price</th>
        <th className="border p-2">Source</th>
        <th className="border p-2">Rating</th>
        <th className="border p-2">Review Count</th>
        <th className="border p-2">Place</th>
        <th className="border p-2">Method</th>
        <th className="border p-2">Source Date</th>
        <th className="border p-2">Timestamp Extract UTC</th>
        <th className="border p-2">Raw Product Name</th>
        <th className="border p-2">Product Name English</th>
        <th className="border p-2">Measurement Scale Standardized</th>
        <th className="border p-2">Quantity Standardized</th>
        <th className="border p-2">Local Price</th>
        <th className="border p-2">USD Price</th>
        <th className="border p-2">EUR Price</th>
        <th className="border p-2">CHF Price</th>
        <th className="border p-2">JPY Price</th>
        <th className="border p-2">CNY Price</th>
        <th className="border p-2">AUD Price</th>
        <th className="border p-2">SGD Price</th>
        <th className="border p-2">Product Category</th>        
        <th className="border p-2">Country</th>     
        <th className="border p-2">Id</th>           
        <th className="border p-2">Update Timestamp UTC</th>               
      </tr>
    </thead>
    <tbody>
      {filtered.map((row, i) => (
        <tr key={i}>
          <td className="border border-black p-2 text-black bg-white">{row.date}</td>
          <td className="border border-black p-2 text-black bg-white">{row.product_name}</td>
          <td className="border border-black p-2 text-black bg-white">{row.quantity}</td>
          <td className="border border-black p-2 text-black bg-white">{row.measurement_scale}</td>
          <td className="border border-black p-2 text-black bg-white">{row.price}</td>
          <td className="border border-black p-2 text-black bg-white">{row.source}</td>
          <td className="border border-black p-2 text-black bg-white">{row.rating}</td>
          <td className="border border-black p-2 text-black bg-white">{row.review_count}</td>
          <td className="border border-black p-2 text-black bg-white">{row.place}</td>
          <td className="border border-black p-2 text-black bg-white">{row.method}</td>
          <td className="border border-black p-2 text-black bg-white">{row.source_date}</td>
          <td className="border border-black p-2 text-black bg-white">{row.timestamp_extract_utc}</td>
          <td className="border border-black p-2 text-black bg-white">{row.raw_product_name}</td>
          <td className="border border-black p-2 text-black bg-white">{row.product_name_en}</td>
          <td className="border border-black p-2 text-black bg-white">{row.measurement_scale_standardized}</td>
          <td className="border border-black p-2 text-black bg-white">{row.quantity_standardized}</td>
          <td className="border border-black p-2 text-black bg-white">{row.price_local}</td>
          <td className="border border-black p-2 text-black bg-white">{row.price_usd}</td>
          <td className="border border-black p-2 text-black bg-white">{row.price_eur}</td>
          <td className="border border-black p-2 text-black bg-white">{row.price_chf}</td>
          <td className="border border-black p-2 text-black bg-white">{row.price_jpy}</td>
          <td className="border border-black p-2 text-black bg-white">{row.price_cny}</td>
          <td className="border border-black p-2 text-black bg-white">{row.price_aud}</td>
          <td className="border border-black p-2 text-black bg-white">{row.price_sgd}</td>
          <td className="border border-black p-2 text-black bg-white">{row.product_category}</td>
          <td className="border border-black p-2 text-black bg-white">{row.country}</td>          
          <td className="border border-black p-2 text-black bg-white">{row.id}</td>
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

