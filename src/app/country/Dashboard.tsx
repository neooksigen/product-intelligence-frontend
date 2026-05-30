"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ComposedChart,
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

  measurement_scale_standardized: string;   // NEW
  
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
  const [country, setCountry] = useState("");
  const [countries, setCountries] = useState<string[]>([]);

const [measurementScales, setMeasurementScales] = useState<string[]>([]);
const [selectedMeasurementScale, setSelectedMeasurementScale] = useState("");  

  const [metric, setMetric] = useState<MetricKey>(
   "price_usd_standardized_median" as MetricKey
  );

  const [filtered, setFiltered] = useState<MonthlyPrice[]>([]);

useEffect(() => {
  if (!data) return;

  const uniqueCountries = [...new Set(data.map((d) => d.country))]
    .sort((a, b) => a.localeCompare(b));

  const uniqueMeasurementScales = [
    ...new Set(data.map((d) => d.measurement_scale_standardized))
  ].sort((a, b) => a.localeCompare(b));

  setCountries(uniqueCountries);
  setMeasurementScales(uniqueMeasurementScales);
}, [data]);

useEffect(() => {
  if (!data || !country) {
    setFiltered([]);
    return;
  }

  let result = data.filter(
    (d) => d.country === country
  );

  if (selectedMeasurementScale) {
    result = result.filter(
      (d) =>
        d.measurement_scale_standardized ===
        selectedMeasurementScale
    );
  }

  setFiltered(result);
}, [country, selectedMeasurementScale, data]);

  const groupedData = useMemo(() => {
    const map: Record<string, MonthlyPrice[]> = {};

    filtered.forEach((row) => {
      if (!map[row.product_category]) {
        map[row.product_category] = [];
      }
      map[row.product_category].push(row);
    });

    // sort inside each category
    Object.keys(map).forEach((cat) => {
      map[cat] = map[cat].sort((a, b) =>
        a.year_month.localeCompare(b.year_month)
      );
    });

    return map;
  }, [filtered]);
  
  return (
<div className="min-h-screen bg-white text-black">

  <Navbar />     
  <div className="p-6 grid grid-cols-4 gap-6">    
    {/* LEFT */}  
  <div className="col-span-1 space-y-6 bg-white text-black">
  <h1 className="text-xl font-bold">Price Monitoring per Country</h1>

  {/* COUNTRY */}
  <div>
    <label className="font-semibold">Select Country</label>
    <select
      className="w-full border border-black bg-white p-2 text-black"
      value={country}
      onChange={(e) => setCountry(e.target.value)}
    >
      <option value="">Select Country</option>
      {countries.map((c) => (
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
      <option key={m} value={m}>
        {m}
      </option>
    ))}
  </select>
</div>

  {/* METRIC */}
  <div>
    <label className="font-semibold">Select Metric</label>
    <select
      className="w-full border border-black bg-white p-2 text-black"
      value={metric}
      onChange={(e) => setMetric(e.target.value as MetricKey)}
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

{/* BOTTOM (line chart) */}
<div className="col-span-3 grid grid-cols-2 md:grid-cols-3 gap-4">
  {!country && <p>Please select a country</p>}

  {Object.entries(groupedData)
  .sort(([a], [b]) => a.localeCompare(b))  
  .map(([category, rows]) => (
    <div key={category} className="bg-white border border-black p-4 rounded-xl">
      <h3 className="text-center font-semibold mb-2">
        Product Category: {category}
      </h3>

      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={rows}>
          <XAxis dataKey="year_month" tick={{ fill: "black" }} />
         {/* LEFT Y AXIS → price */}
         <YAxis yAxisId="left" 
          tickFormatter={(v) => v.toFixed(2)}         
          tick={{ fontSize: 12, fill: "black" }}   // ✅ force ticks to show clearly
          width={60}                // ✅ give space so ticks are not clipped
          label={{
            value: "Price",
            angle: -90,
            position: "insideLeft",
            style: { textAnchor: "middle" }
           }}         
         />
         {/* RIGHT Y AXIS → count */}
         <YAxis yAxisId="right" 
          orientation="right" 
          tick={{ fontSize: 12, fill: "black" }}
          width={50}
          label={{
           value: "Count Products",
           angle: 90,
           position: "insideRight",
           style: { textAnchor: "middle" }
           }}                  
         />
          <Tooltip />

         {/* BAR → count_products */}
         <Bar
          yAxisId="right"
          dataKey="count_products"
          fill="#82ca9d"
          fillOpacity={0.4}
          name="Count Products"
         />
         {/* LINE → price */}                  
          <Line 
            yAxisId="left"
            type="monotone"
            dataKey={metric}
            stroke="#0000ff"
            strokeWidth={2}
            dot={true}
            name="Price"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  ))}
  </div>

</div>
</div>
  );
}
