"use client";

import { FormEvent, useMemo, useState } from "react";
import Navbar from "@/components/NavbarCustom";

type Row = Record<string, unknown>;
type Result = { answer: string; rows: Row[]; sql: string | null };
type Message = { request: string; result: Result };

function cell(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function ResultsTable({ rows }: { rows: Row[] }) {
  const columns = useMemo(() => [...new Set(rows.flatMap((row) => Object.keys(row)))], [rows]);
  if (!rows.length || !columns.length) return null;

  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-max w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
          <tr>{columns.map((column) => <th key={column} className="whitespace-nowrap p-3 font-semibold">{column.replaceAll("_", " ")}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-slate-100 last:border-0">
              {columns.map((column) => <td key={column} className="max-w-[24rem] break-words p-3 align-top">{cell(row[column])}</td>)}
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
      const response = await fetch("/api/price-agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ request: question }) });
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
      <section className="mx-auto max-w-6xl p-4 sm:p-6 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Read-only database chat</p>
        <h1 className="mt-2 text-3xl font-bold">Product Price Master Agent</h1>
        <p className="mt-3 max-w-4xl text-slate-600">Ask any product-price question. The agent creates and executes one read-only SQL query against <code>detail_price</code>, then returns its table. Price analysis always uses unit price (= price ÷ <code>quantity_standardized</code>); dates use <code>timestamp_extract_utc</code>. No web search.</p>

        <div className="mt-7 space-y-5">
          {messages.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">Try: “Rank the five most expensive rice products per kilogram in Japan by median USD price in 2026.”</div>}
          {messages.map((message, index) => (
            <article key={`${message.request}-${index}`} className="space-y-3">
              <div className="ml-auto max-w-3xl rounded-2xl rounded-tr-sm bg-teal-700 px-5 py-4 text-white">{message.request}</div>
              <div className="max-w-full rounded-2xl rounded-tl-sm border border-slate-200 bg-white p-5 shadow-sm">
                <p className="leading-7 text-slate-700">{message.result.answer}</p>
                <ResultsTable rows={message.result.rows} />
                {message.result.sql && <details className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600"><summary className="cursor-pointer font-semibold">Generated read-only SQL</summary><pre className="mt-3 overflow-x-auto whitespace-pre-wrap">{message.result.sql}</pre></details>}
              </div>
            </article>
          ))}
          {loading && <div className="max-w-sm rounded-2xl rounded-tl-sm border border-slate-200 bg-white p-4 text-slate-600 shadow-sm">Writing and running a read-only query…</div>}
        </div>
        {error && <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}</p>}
        <form onSubmit={submit} className="sticky bottom-3 mt-7 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
          <label htmlFor="request" className="sr-only">Your question</label>
          <textarea id="request" value={request} onChange={(event) => setRequest(event.target.value)} rows={3} placeholder="Ask about average, median, ranking, product categories, countries, or dates…" className="w-full resize-y rounded-lg border border-slate-300 p-3 outline-none focus:border-teal-600" />
          <div className="mt-3 flex items-center justify-between gap-3"><p className="text-xs text-slate-500">detail_price only · Read-only SQL · No web search</p><button disabled={loading || !request.trim()} className="rounded-lg bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800 disabled:opacity-60">{loading ? "Analyzing…" : "Send"}</button></div>
        </form>
      </section>
    </main>
  );
}
