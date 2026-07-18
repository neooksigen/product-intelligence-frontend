"use client";

import { FormEvent, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Navbar from "@/components/NavbarCustom";

type ChartPoint = { date: string; averagePrice: number };
type Aggregate = { product: string; country: string; scale: string; recordCount: number; averageUnitPrice: number; minimumUnitPrice: number; maximumUnitPrice: number };
type Result = { answer: string; chart: ChartPoint[]; recordsAnalyzed: number; chartLabel: string; aggregates: Aggregate[]; calculation: string; matchedRows: number };

export default function AgentDashboard() {
  const [request, setRequest] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!request.trim()) return;
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/price-agent", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "The analysis could not be completed.");
      setResult(body);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The analysis could not be completed.");
    } finally { setLoading(false); }
  }

  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <Navbar />
    <section className="mx-auto max-w-6xl p-6 md:p-10">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Database-only analysis</p>
      <h1 className="mt-2 text-3xl font-bold">Product Price Master Agent</h1>
      <p className="mt-3 max-w-3xl text-slate-600">Ask about product prices, countries, categories, or historical trends. Every price calculation is divided by <code>quantity_standardized</code> so it is expressed per standard unit. Historical analysis always uses <code>timestamp_extract_utc</code>. This agent only uses the <code>detail_price</code> database table and never searches the web.</p>
      <form onSubmit={submit} className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label htmlFor="request" className="font-semibold">Your request</label>
        <textarea id="request" value={request} onChange={(event) => setRequest(event.target.value)} rows={5}
          placeholder="Example: What is the average USD price per kilogram of egg, beef, and rice in Japan?"
          className="mt-3 w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-teal-600" />
        <button disabled={loading} className="mt-3 rounded-lg bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800 disabled:opacity-60">
          {loading ? "Analyzing detail_price…" : "Analyze prices"}
        </button>
      </form>
      {error && <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}</p>}
      {result && <section className="mt-7 grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Analysis and recommendation</h2><p className="mt-4 whitespace-pre-wrap leading-7 text-slate-700">{result.answer}</p><p className="mt-5 text-sm text-slate-500">Calculation: {result.calculation} · Usable records: {result.recordsAnalyzed.toLocaleString()}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">{result.chartLabel}</h2><p className="mt-1 text-sm text-slate-500">Grouped by timestamp_extract_utc date</p>
          <div className="mt-5 h-72">{result.chart.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={result.chart}><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis /><Tooltip /><Line type="monotone" dataKey="averagePrice" name="Average USD price" stroke="#0f766e" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer> : <p className="pt-20 text-center text-slate-500">No dated USD prices are available for this request.</p>}</div>
        </article>
        {result.aggregates.length > 0 && <article className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2"><h2 className="text-xl font-bold">Calculated database results</h2><p className="mt-1 text-sm text-slate-500">Each value is a price per quantity_standardized unit.</p><table className="mt-4 w-full min-w-[720px] text-left text-sm"><thead className="border-b text-slate-500"><tr><th className="p-2">Product</th><th className="p-2">Country</th><th className="p-2">Scale</th><th className="p-2">Average</th><th className="p-2">Range</th><th className="p-2">Records</th></tr></thead><tbody>{result.aggregates.map((item) => <tr key={`${item.product}-${item.country}-${item.scale}`} className="border-b last:border-0"><td className="p-2 font-medium">{item.product}</td><td className="p-2">{item.country}</td><td className="p-2">{item.scale}</td><td className="p-2">{item.averageUnitPrice.toLocaleString()}</td><td className="p-2">{item.minimumUnitPrice.toLocaleString()} – {item.maximumUnitPrice.toLocaleString()}</td><td className="p-2">{item.recordCount.toLocaleString()}</td></tr>)}</tbody></table></article>}
      </section>}
    </section>
  </main>;
}
