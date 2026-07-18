"use client";

import { FormEvent, useState } from "react";
import Navbar from "@/components/NavbarCustom";

type Aggregate = {
  product: string;
  country: string;
  scale: string;
  period?: string;
  recordCount: number;
  averageUnitPrice: number;
  medianUnitPrice: number;
  minimumUnitPrice: number;
  maximumUnitPrice: number;
};

type Result = {
  answer: string;
  recordsAnalyzed: number;
  aggregates: Aggregate[];
  calculation: string;
  matchedRows: number;
  currencyLabel: string;
};

type Message = { request: string; result: Result };

function ResultsTable({ result }: { result: Result }) {
  if (!result.aggregates.length) return null;
  const hasPeriods = result.aggregates.some((item) => item.period);

  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-[620px] w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
          <tr>
            {hasPeriods && <th className="p-3">Month</th>}
            <th className="p-3">Product</th>
            <th className="p-3">Country</th>
            <th className="p-3">Measurement scale</th>
            <th className="p-3">Median price ({result.currencyLabel})</th>
          </tr>
        </thead>
        <tbody>
          {result.aggregates.map((item) => (
            <tr key={`${item.period ?? "all"}-${item.product}-${item.country}-${item.scale}`} className="border-b border-slate-100 last:border-0">
              {hasPeriods && <td className="p-3">{item.period ?? "All months"}</td>}
              <td className="p-3 font-medium">{item.product}</td>
              <td className="p-3">{item.country}</td>
              <td className="p-3">{item.scale}</td>
              <td className="p-3 font-semibold">{item.medianUnitPrice.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AgentDashboard() {
  const [request, setRequest] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    const question = request.trim();
    if (!question || loading) return;

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/price-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request: question }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "The analysis could not be completed.");
      setMessages((history) => [...history, { request: question, result: body as Result }]);
      setRequest("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The analysis could not be completed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <section className="mx-auto max-w-5xl p-4 sm:p-6 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Database-only chat</p>
        <h1 className="mt-2 text-3xl font-bold">Product Price Master Agent</h1>
        <p className="mt-3 max-w-3xl text-slate-600">Ask a price-analysis question and receive a database result table. Every calculation is price ÷ <code>quantity_standardized</code>; historical questions use <code>timestamp_extract_utc</code>. This agent uses only <code>detail_price</code> and never searches the web.</p>

        <div className="mt-7 space-y-5">
          {messages.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
              Try: “What is the historical median USD price of egg in Japan from March to July 2026?”
            </div>
          )}
          {messages.map((message, index) => (
            <article key={`${message.request}-${index}`} className="space-y-3">
              <div className="ml-auto max-w-3xl rounded-2xl rounded-tr-sm bg-teal-700 px-5 py-4 text-white">
                {message.request}
              </div>
              <div className="max-w-full rounded-2xl rounded-tl-sm border border-slate-200 bg-white p-5 shadow-sm">
                <p className="whitespace-pre-wrap leading-7 text-slate-700">{message.result.answer}</p>
                <ResultsTable result={message.result} />
                <p className="mt-4 text-xs text-slate-500">Calculation: {message.result.calculation} · Usable records: {message.result.recordsAnalyzed.toLocaleString()}</p>
              </div>
            </article>
          ))}
          {loading && <div className="max-w-sm rounded-2xl rounded-tl-sm border border-slate-200 bg-white p-4 text-slate-600 shadow-sm">Analyzing detail_price…</div>}
        </div>

        {error && <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}</p>}
        <form onSubmit={submit} className="sticky bottom-3 mt-7 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
          <label htmlFor="request" className="sr-only">Your question</label>
          <textarea id="request" value={request} onChange={(event) => setRequest(event.target.value)} rows={3}
            placeholder="Ask about product prices, median, comparisons, countries, or dates…"
            className="w-full resize-y rounded-lg border border-slate-300 p-3 outline-none focus:border-teal-600" />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">Tables only · No web search</p>
            <button disabled={loading || !request.trim()} className="rounded-lg bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800 disabled:opacity-60">
              {loading ? "Analyzing…" : "Send"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
