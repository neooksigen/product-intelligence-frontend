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
  const [filtered, setFiltered] = useState<DailyPrice[]>(data || []);
  const [categories, setCategories] = useState<string[]>([]);
  const [measurementScales, setMeasurementScales] = useState<string[]>([]);

  // ✅ FIX 1: strongly typed metric
  const [metric, setMetric] = useState<MetricKey>(
    "price_usd_standardized_median" as MetricKey
  );

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedMeasurementScale, setSelectedMeasurementScale] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (!data) return;
  setCategories(
    [...new Set(data.map((d) => d.product_category))].sort()
  );

  setMeasurementScales(
    [...new Set(data.map((d) => d.measurement_scale_standardized))].sort()
  );
    setFiltered(data);
  }, [data]);

  useEffect(() => {
    if (!data) return;

    let newFiltered = [...data];

    if (selectedCategory) {
      newFiltered = newFiltered.filter(
        (d) => d.product_category === selectedCategory
      );
    }

if (selectedMeasurementScale) {
  newFiltered = newFiltered.filter(
    (d) =>
      d.measurement_scale_standardized ===
      selectedMeasurementScale
  );
}    

    if (startDate) {
      newFiltered = newFiltered.filter((d) => d.date >= startDate);
    }

    if (endDate) {
      newFiltered = newFiltered.filter((d) => d.date <= endDate);
    }

    setFiltered(newFiltered);
}, [
  selectedCategory,
  selectedMeasurementScale,
  startDate,
  endDate,
  data,
]);

  return (
<div className="min-h-screen bg-white text-black">

  <Navbar />     
    <div className="p-6 grid grid-cols-4 grid-rows-2 gap-6">
      {/* LEFT TOP (filters) */}      
      <div className="col-span-1 row-span-1 space-y-6 bg-white text-black">
        <h1 className="text-xl font-bold">Daily Price Comparison</h1>

        {/* CATEGORY */}
        <div>
          <label className="font-semibold">Select Category</label>
          <select
            className="w-full border border-black bg-white p-2 text-black"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

{/* MEASUREMENT SCALE */}
<div>
  <label className="font-semibold">
    Select Measurement Scale
  </label>

  <select
    className="w-full border border-black bg-white p-2 text-black"
    value={selectedMeasurementScale}
    onChange={(e) =>
      setSelectedMeasurementScale(e.target.value)
    }
  >
    <option value="">All</option>

    {measurementScales.map((m) => (
      <option key={m}>{m}</option>
    ))}
  </select>
</div>

        {/* DATE RANGE */}
        <div>
          <label className="font-semibold">Start Date</label>
          <input
            type="date"
            className="w-full border border-black bg-white p-2 text-black"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div>
          <label className="font-semibold">End Date</label>
          <input
            type="date"
            className="w-full border border-black bg-white p-2 text-black"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {/* METRIC */}
        <div>
          <label className="font-semibold">Select Metric</label>
          <select
            className="w-full border border-black bg-white p-2 text-black"
            value={metric}
            onChange={(e) => setMetric(e.target.value as MetricKey)} // ✅ FIX 2
          >
            <option value="price_local_standardized">Local Price</option>
            <option value="price_usd_standardized">USD Price</option>
            <option value="price_eur_standardized">EUR Price</option>
            <option value="price_chf_standardized">CHF Price</option>
            <option value="price_jpy_standardized">JPY Price</option>
            <option value="price_cny_standardized">CNY Price</option>
            <option value="price_aud_standardized">AUD Price</option>
            <option value="price_sgd_standardized">SGD Price</option>

            <option value="price_local_standardized_median">
              Local Price (Median)
            </option>
            <option value="price_usd_standardized_median">
              USD Price (Median)
            </option>
            <option value="price_eur_standardized_median">
              EUR Price (Median)
            </option>
            <option value="price_chf_standardized_median">
              CHF Price (Median)
            </option>
            <option value="price_jpy_standardized_median">
              JPY Price (Median)
            </option>
            <option value="price_cny_standardized_median">
              CNY Price (Median)
            </option>
            <option value="price_aud_standardized_median">
              AUD Price (Median)
            </option>
            <option value="price_sgd_standardized_median">
              SGD Price (Median)
            </option>
          </select>
        </div>
      </div>

      {/* RIGHT TOP (line chart) */}
      <div className="col-span-3 row-span-1 bg-white border border-black p-4 rounded-2xl">
        <h2 className="mb-4 text-xl font-semibold text-black">
  Daily Price
</h2>

        <MultiLineChart data={filtered} metric={metric} />
      </div>

      {/* LEFT BOTTOM (empty) */} 
      <div className="col-span-1 row-span-1"></div>

      {/* RIGHT BOTTOM (stacked bar) */}
      <div className="col-span-3 row-span-1 bg-white border border-black p-4 rounded-2xl">
        <h2 className="mb-4 text-xl font-semibold text-black">
  Daily Product Count
</h2>

        <StackedBarChart data={filtered} />
      </div>

    </div>
    </div>
  );
}

//
// 🔵 LINE CHART
//
function MultiLineChart({
  data,
  metric,
}: {
  data: DailyPrice[];
  metric: MetricKey;
}) {  
    
  const transformed = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};

    // ✅ FIX 3: strongly typed Set
    const countries = new Set<string>();

    data.forEach((d) => {
        const raw = metric ? d[metric] : undefined; //fixed by Claude Code 30 april 2026 !!!
        if (typeof raw !== "number") return;        
        //if (value == null) return;

        const date = d.date;
        const country = d.country;
        if (typeof date !== "string" || typeof country !== "string") return;
        countries.add(country);

        if (!map[date]) {
            map[date] = {};
        }

        map[date][country] = raw;
    });

    return {
      chartData: Object.entries(map)
        .map(([date, values]) => ({ date, ...values }))
        .sort((a, b) => a.date.localeCompare(b.date)),

      countries: Array.from(countries), // now string[]
    };
  }, [data, metric]);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={transformed.chartData}>
        <XAxis dataKey="date" tick={{ fill: "black" }} />
        <YAxis tick={{ fill: "black" }} />
        <Tooltip />
        <Legend />

    {transformed.countries.map((c, index) => (
        <Line
         key={c}
         type="monotone"
         dataKey={c}
         name={c}
         stroke={COLORS[index % COLORS.length]}
         strokeWidth={2}
         dot={true}
        />
   ))}
      </LineChart>
    </ResponsiveContainer>
  );
}


//
// 🟩 STACKED BAR CHART
//
function StackedBarChart({ data }: { data: DailyPrice[] }) {
  const transformed = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    const countries = new Set<string>();

    data.forEach((d) => {
      const value = d.count_products;
      if (typeof value !== "number") return;

      const date = d.date;
      const country = d.country;
      if (typeof date !== "string" || typeof country !== "string") return;
      countries.add(country);

      if (!map[date]) {
          map[date] = {};
      }
      map[date][country] = value;
    });

    return {
      chartData: Object.entries(map)
        .map(([date, values]) => ({ date, ...values }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      countries: Array.from(countries),
    };
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={transformed.chartData}>
        <XAxis dataKey="date" tick={{ fill: "black" }} />
        <YAxis tick={{ fill: "black" }} />
        <Tooltip />
        <Legend />

        {transformed.countries.map((c, index) => (
          <Bar
            key={c}
            dataKey={c}
            stackId="a"
            fill={COLORS[index % COLORS.length]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
