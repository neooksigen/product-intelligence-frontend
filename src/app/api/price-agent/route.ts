import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type PriceRow = Record<string, unknown>;
type Currency = "local" | "usd" | "eur" | "chf" | "jpy" | "cny" | "aud" | "sgd";

const columns = ["product_name", "source", "rating", "review_count", "method", "source_date", "timestamp_extract_utc", "product_name_en", "measurement_scale_standardized", "quantity_standardized", "price_local", "price_usd", "price_eur", "price_chf", "price_jpy", "price_cny", "price_aud", "price_sgd", "product_category", "country"];
const currencyFields: Record<Currency, string> = { local: "price_local", usd: "price_usd", eur: "price_eur", chf: "price_chf", jpy: "price_jpy", cny: "price_cny", aud: "price_aud", sgd: "price_sgd" };
const currencyLabels: Record<Currency, string> = { local: "local currency", usd: "USD", eur: "EUR", chf: "CHF", jpy: "JPY", cny: "CNY", aud: "AUD", sgd: "SGD" };
const requestStopWords = new Set(["a", "an", "and", "are", "average", "by", "can", "compare", "comparison", "currency", "for", "from", "give", "hi", "historical", "history", "how", "i", "in", "is", "me", "of", "on", "per", "please", "price", "prices", "recommend", "show", "the", "to", "unit", "what", "with", "year"]);

function text(value: unknown) { return typeof value === "string" ? value : ""; }
function number(value: unknown) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
function normalized(value: unknown) { return text(value).toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim(); }
function average(values: number[]) { return values.length ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(4)) : null; }

function requestedCurrency(request: string): Currency {
  const normalizedRequest = normalized(request);
  const currencies: Currency[] = ["usd", "eur", "chf", "jpy", "cny", "aud", "sgd"];
  return currencies.find((currency) => normalizedRequest.split(" ").includes(currency)) ?? (normalizedRequest.includes("local currency") ? "local" : "usd");
}

function relevantRows(rows: PriceRow[], request: string) {
  const requestText = normalized(request);
  const countries = [...new Set(rows.map((row) => text(row.country)).filter(Boolean))];
  const requestedCountries = countries.filter((country) => requestText.includes(normalized(country)));
  const countryRows = requestedCountries.length ? rows.filter((row) => requestedCountries.includes(text(row.country))) : rows;
  const words = [...new Set(requestText.split(" ").filter((word) => word.length > 2 && !requestStopWords.has(word)))];
  const matchingTerms = words.filter((term) => countryRows.some((row) => `${normalized(row.product_name)} ${normalized(row.product_name_en)} ${normalized(row.product_category)}`.includes(term)));
  const selected = matchingTerms.length ? countryRows.filter((row) => {
    const product = `${normalized(row.product_name)} ${normalized(row.product_name_en)} ${normalized(row.product_category)}`;
    return matchingTerms.some((term) => product.includes(term));
  }) : countryRows;
  return { selected, requestedCountries, matchingTerms };
}

function makeDataset(rows: PriceRow[], request: string) {
  const currency = requestedCurrency(request);
  const priceField = currencyFields[currency];
  const { selected, requestedCountries, matchingTerms } = relevantRows(rows, request);
  const usable = selected.map((row) => {
    const quantity = number(row.quantity_standardized);
    const price = number(row[priceField]);
    return { row, unitPrice: quantity && quantity > 0 && price !== null ? price / quantity : null };
  }).filter((item): item is { row: PriceRow; unitPrice: number } => item.unitPrice !== null);
  const groupTerms = matchingTerms.length ? matchingTerms : ["all matching products"];
  const groupCountries = requestedCountries.length ? requestedCountries : [...new Set(usable.map((item) => text(item.row.country)).filter(Boolean))];
  const aggregates = groupTerms.flatMap((term) => groupCountries.flatMap((country) => {
    const matched = usable.filter(({ row }) => {
      const product = `${normalized(row.product_name)} ${normalized(row.product_name_en)} ${normalized(row.product_category)}`;
      return (term === "all matching products" || product.includes(term)) && (!country || text(row.country) === country);
    });
    const scales = [...new Set(matched.map(({ row }) => text(row.measurement_scale_standardized) || "standard unit"))];
    return scales.map((scale) => {
      const sameScale = matched.filter(({ row }) => (text(row.measurement_scale_standardized) || "standard unit") === scale);
      return { productTerm: term, country, measurementScale: scale, recordCount: sameScale.length, averagePricePerStandardUnit: average(sameScale.map(({ unitPrice }) => unitPrice)), currency: currencyLabels[currency] };
    });
  })).filter((item) => item.recordCount > 0);
  const dated = usable.map(({ row, unitPrice }) => ({ date: text(row.timestamp_extract_utc).slice(0, 10), unitPrice })).filter((item) => item.date);
  const daily = dated.reduce<Record<string, number[]>>((all, item) => { (all[item.date] ||= []).push(item.unitPrice); return all; }, {});
  return {
    rowCount: rows.length,
    matchedRowCount: selected.length,
    usableRowCount: usable.length,
    requestedCountries,
    matchingTerms,
    currency: currencyLabels[currency],
    calculation: `${priceField} divided by quantity_standardized`,
    aggregates,
    dateRange: dated.length ? [dated.map((item) => item.date).sort()[0], dated.map((item) => item.date).sort().at(-1)] : [],
    chart: Object.entries(daily).sort(([a], [b]) => a.localeCompare(b)).map(([date, values]) => ({ date, averagePrice: average(values) })),
    samples: usable.slice(0, 500).map(({ row, unitPrice }) => ({ ...Object.fromEntries(columns.map((column) => [column, row[column] ?? null])), price_per_standard_unit: Number(unitPrice.toFixed(6)), price_currency: currencyLabels[currency] })),
  };
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

  const dataset = makeDataset((data ?? []) as PriceRow[], userRequest);
  const instructions = `You are Product Price Master Agent. You may answer only by using the supplied detail_price dataset. Never browse the web, claim any other data source, or perform work outside product-price analysis. Every price analysis must use price / quantity_standardized; never report a raw package price as an analysis result. The dataset's aggregates are the authoritative calculation: present them clearly, including product term, country, measurement scale, currency, average price per standard unit, and record count when applicable. Historical dates are timestamp_extract_utc, never source_date. product_category can be supplemented only by product_name and product_name_en in the supplied samples. If the supplied data has no usable matching rows, say exactly: "Sorry, I’m unable to fulfill this request from the detail_price database." Give a concise analysis followed by a clearly labelled Recommendation. Do not invent values.`;
  const openAI = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: JSON.stringify({ model: "gpt-5", instructions, input: `User request: ${userRequest}\n\nDatabase results (the only available evidence):\n${JSON.stringify(dataset)}` }) });
  if (!openAI.ok) return NextResponse.json({ error: "I’m sorry, I’m unable to complete the AI analysis right now." }, { status: 502 });
  const response = await openAI.json() as { output_text?: string };
  return NextResponse.json({ answer: response.output_text || "Sorry, I’m unable to fulfill this request from the detail_price database.", chart: dataset.chart, recordsAnalyzed: dataset.usableRowCount, chartLabel: `Average ${dataset.currency} price per standard unit` });
}
