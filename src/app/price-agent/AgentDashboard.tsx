"use client";

import { FormEvent, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Navbar from "@/components/NavbarCustom";

type ChartPoint = { date: string; averagePrice: number };
type Result = { answer: string; chart: ChartPoint[]; recordsAnalyzed: number };

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
      <p className="mt-3 max-w-3xl text-slate-600">Ask about product prices, countries, categories, or historical trends. Historical analysis always uses <code>timestamp_extract_utc</code>. This agent only uses the <code>detail_price</code> database table and never searches the web.</p>
      <form onSubmit={submit} className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label htmlFor="request" className="font-semibold">Your request</label>
        <textarea id="request" value={request} onChange={(event) => setRequest(event.target.value)} rows={5}
          placeholder="Example: Compare historical USD prices of rice in Indonesia and Singapore, then recommend which market has the lower average price."
          className="mt-3 w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-teal-600" />
        <button disabled={loading} className="mt-3 rounded-lg bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800 disabled:opacity-60">
          {loading ? "Analyzing detail_price…" : "Analyze prices"}
        </button>
      </form>
      {error && <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}</p>}
      {result && <section className="mt-7 grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Analysis and recommendation</h2><p className="mt-4 whitespace-pre-wrap leading-7 text-slate-700">{result.answer}</p><p className="mt-5 text-sm text-slate-500">Records analyzed: {result.recordsAnalyzed.toLocaleString()}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Historical average USD price</h2><p className="mt-1 text-sm text-slate-500">Grouped by timestamp_extract_utc date</p>
          <div className="mt-5 h-72">{result.chart.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={result.chart}><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis /><Tooltip /><Line type="monotone" dataKey="averagePrice" name="Average USD price" stroke="#0f766e" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer> : <p className="pt-20 text-center text-slate-500">No dated USD prices are available for this request.</p>}</div>
        </article>
      </section>}
    </section>
  </main>;
}
