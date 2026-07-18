import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type PriceRow = Record<string, unknown>;

const columns = ["product_name", "source", "rating", "review_count", "method", "source_date", "timestamp_extract_utc", "product_name_en", "measurement_scale_standardized", "quantity_standardized", "price_local", "price_usd", "price_eur", "price_chf", "price_jpy", "price_cny", "price_aud", "price_sgd", "product_category", "country"];

function text(value: unknown) { return typeof value === "string" ? value : ""; }
function number(value: unknown) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }

function summary(rows: PriceRow[]) {
  const by = (field: string) => Object.entries(rows.reduce<Record<string, number>>((all, row) => { const key = text(row[field]) || "Unspecified"; all[key] = (all[key] || 0) + 1; return all; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 40);
  const dated = rows.map((row) => ({ date: text(row.timestamp_extract_utc).slice(0, 10), price: number(row.price_usd) })).filter((item) => item.date && item.price !== null) as { date: string; price: number }[];
  const totals = dated.reduce<Record<string, { sum: number; count: number }>>((all, item) => { all[item.date] ||= { sum: 0, count: 0 }; all[item.date].sum += item.price; all[item.date].count += 1; return all; }, {});
  return { rowCount: rows.length, countries: by("country"), categories: by("product_category"), dateRange: dated.length ? [dated.map((item) => item.date).sort()[0], dated.map((item) => item.date).sort().at(-1)] : [], chart: Object.entries(totals).sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, averagePrice: Number((value.sum / value.count).toFixed(2)) })), samples: rows.slice(0, 250).map((row) => Object.fromEntries(columns.map((column) => [column, row[column] ?? null]))) };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { request?: unknown } | null;
  const userRequest = typeof body?.request === "string" ? body.request.trim() : "";
  if (!userRequest) return NextResponse.json({ error: "Please enter a request." }, { status: 400 });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "OPENAI_API_KEY is not configured on the server." }, { status: 500 });
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase.from("detail_price").select("*");
  if (error) return NextResponse.json({ error: "I’m sorry, I’m unable to retrieve detail_price right now." }, { status: 500 });
  const dataset = summary((data ?? []) as PriceRow[]);
  const instructions = `You are Product Price Master Agent. You may answer only by using the supplied detail_price dataset summary. Never browse the web, claim any other data source, or perform work outside product-price analysis. If the supplied data cannot answer the request, say exactly: "Sorry, I’m unable to fulfill this request from the detail_price database." Historical dates are timestamp_extract_utc, never source_date. product_category can be supplemented only by product_name and product_name_en in the supplied samples. Give a concise analysis followed by a clearly labelled Recommendation. Do not invent values.`;
  const openAI = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: JSON.stringify({ model: "gpt-5", instructions, input: `User request: ${userRequest}\n\nDatabase summary (the only available evidence):\n${JSON.stringify(dataset)}` }) });
  if (!openAI.ok) return NextResponse.json({ error: "I’m sorry, I’m unable to complete the AI analysis right now." }, { status: 502 });
  const response = await openAI.json() as { output_text?: string };
  return NextResponse.json({ answer: response.output_text || "Sorry, I’m unable to fulfill this request from the detail_price database.", chart: dataset.chart, recordsAnalyzed: dataset.rowCount });
}
