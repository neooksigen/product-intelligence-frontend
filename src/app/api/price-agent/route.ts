import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type PriceRow = Record<string, unknown>;
type Currency = "local" | "usd" | "eur" | "chf" | "jpy" | "cny" | "aud" | "sgd";
type Aggregate = { product: string; country: string; scale: string; period?: string; recordCount: number; averageUnitPrice: number; medianUnitPrice: number; minimumUnitPrice: number; maximumUnitPrice: number };
type QueryPlan = { currency?: Currency; countries?: string[]; products?: string[]; startDate?: string; endDate?: string; historical?: boolean };

const priceFields: Record<Currency, string> = { local: "price_local", usd: "price_usd", eur: "price_eur", chf: "price_chf", jpy: "price_jpy", cny: "price_cny", aud: "price_aud", sgd: "price_sgd" };
const currencyLabels: Record<Currency, string> = { local: "local currency", usd: "USD", eur: "EUR", chf: "CHF", jpy: "JPY", cny: "CNY", aud: "AUD", sgd: "SGD" };
const ignoredWords = new Set(["a", "an", "and", "are", "average", "by", "can", "category", "column", "columns", "comparison", "compare", "country", "currency", "for", "from", "give", "hi", "historical", "history", "how", "i", "in", "into", "is", "kilogram", "kg", "liter", "local", "me", "measurement", "median", "month", "monthly", "name", "of", "on", "per", "please", "price", "prices", "product", "products", "provide", "recommend", "scale", "show", "table", "the", "to", "unit", "what", "with", "year", "usd", "eur", "chf", "jpy", "cny", "aud", "sgd"]);
const apology = "Sorry, I’m unable to fulfill this request from the detail_price database.";

function string(value: unknown) { return typeof value === "string" ? value : ""; }
function numeric(value: unknown) { const number = Number(value); return Number.isFinite(number) ? number : null; }
function normal(value: unknown) { return string(value).toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim(); }
function mean(values: number[]) { return values.reduce((sum, value) => sum + value, 0) / values.length; }
function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}
function round(value: number) { return Number(value.toFixed(4)); }

function parseCurrency(request: string): Currency {
  const words = normal(request).split(" ");
  const currency = (["usd", "eur", "chf", "jpy", "cny", "aud", "sgd"] as Currency[]).find((value) => words.includes(value));
  return currency ?? (normal(request).includes("local currency") ? "local" : "usd");
}

function validCurrency(value: unknown): Currency | undefined {
  return typeof value === "string" && value in priceFields ? value as Currency : undefined;
}

function validDate(value: unknown) {
  return typeof value === "string" && /^20\d{2}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

function planFromJson(value: unknown): QueryPlan | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const strings = (input: unknown) => Array.isArray(input)
    ? input.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 12)
    : [];
  return {
    currency: validCurrency(raw.currency),
    countries: strings(raw.countries),
    products: strings(raw.products),
    startDate: validDate(raw.startDate),
    endDate: validDate(raw.endDate),
    historical: raw.historical === true,
  };
}

async function interpretRequest(request: string): Promise<QueryPlan | null> {
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "gpt-5-mini",
        instructions: "Convert the user's database-only product-price question into JSON only. Do not answer the question and do not use web knowledge. Return exactly this shape: {\"currency\":\"usd|eur|chf|jpy|cny|aud|sgd|local\",\"countries\":[\"...\"],\"products\":[\"...\"],\"startDate\":\"YYYY-MM-DD or null\",\"endDate\":\"YYYY-MM-DD or null\",\"historical\":true|false}. Products must contain only requested real products/categories, for example rice, beef, egg, fruit. Never include instructions, column names, units, country names, or generic words such as product, category, name, price, median, average, comparison, month, table, column, country, measurement, or scale. Use timestamp_extract_utc dates. If a request says March to July 2026, return 2026-03-01 and 2026-07-31. Set historical true when the request says historical, per month, monthly, trend, or over time.",
        input: request,
      }),
    });
    if (!response.ok) return null;
    const body = await response.json() as { output_text?: string };
    const text = body.output_text?.trim().replace(/^```json\s*|\s*```$/g, "");
    return text ? planFromJson(JSON.parse(text)) : null;
  } catch {
    return null;
  }
}

function parseDateRange(request: string) {
  const dates = request.match(/\b\d{4}-\d{2}-\d{2}\b/g) ?? [];
  if (dates.length >= 2 && dates[0] && dates[1]) return { start: dates[0], end: dates[1] };
  const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  const monthPattern = months.join("|");
  const range = new RegExp(`\\b(${monthPattern})\\s*(?:to|until|through|-)\\s*(${monthPattern})\\s*(20\\d{2})\\b`, "i").exec(request);
  if (range?.[1] && range[2] && range[3]) {
    const startMonth = months.indexOf(range[1].toLowerCase());
    const endMonth = months.indexOf(range[2].toLowerCase());
    const year = Number(range[3]);
    if (startMonth >= 0 && endMonth >= startMonth) {
      const endDay = new Date(Date.UTC(year, endMonth + 1, 0)).getUTCDate();
      return { start: `${year}-${String(startMonth + 1).padStart(2, "0")}-01`, end: `${year}-${String(endMonth + 1).padStart(2, "0")}-${endDay}` };
    }
  }
  const year = request.match(/\b(20\d{2})\b/)?.[1];
  return year ? { start: `${year}-01-01`, end: `${year}-12-31` } : null;
}

function productText(row: PriceRow) {
  return `${normal(row.product_name)} ${normal(row.product_name_en)} ${normal(row.product_category)}`.trim();
}

function analyze(rows: PriceRow[], request: string, plan: QueryPlan | null) {
  const requestText = normal(request);
  const currency = plan?.currency ?? parseCurrency(request);
  const priceField = priceFields[currency];
  const countries = [...new Set(rows.map((row) => string(row.country)).filter(Boolean))];
  const planCountries = new Set((plan?.countries ?? []).map(normal));
  const requestedCountries = countries.filter((country) => planCountries.has(normal(country)) || requestText.includes(normal(country)));
  const countryFiltered = requestedCountries.length ? rows.filter((row) => requestedCountries.includes(string(row.country))) : rows;
  const terms = [...new Set(requestText.split(" ").filter((word) => word.length > 2 && !ignoredWords.has(word)))];
  const countryWords = new Set(requestedCountries.flatMap((country) => normal(country).split(" ")));
  const plannedProducts = (plan?.products ?? []).map(normal).filter((term) => term && !ignoredWords.has(term));
  const productCandidates = plannedProducts.length ? plannedProducts : terms;
  const productTerms = productCandidates.filter((term) => !countryWords.has(term) && countryFiltered.some((row) => productText(row).includes(term)));
  if (!productTerms.length) return { currency, requestedCountries, productTerms, dateRange: null, selectedRows: 0, usableRows: 0, aggregates: [] };
  const productFiltered = productTerms.length ? countryFiltered.filter((row) => productTerms.some((term) => productText(row).includes(term))) : countryFiltered;
  const dateRange = plan?.startDate && plan?.endDate ? { start: plan.startDate, end: plan.endDate } : parseDateRange(request);
  const dateFiltered = dateRange ? productFiltered.filter((row) => {
    const date = string(row.timestamp_extract_utc).slice(0, 10);
    return date >= dateRange.start && date <= dateRange.end;
  }) : productFiltered;
  const usable = dateFiltered.flatMap((row) => {
    const quantity = numeric(row.quantity_standardized);
    const price = numeric(row[priceField]);
    if (!quantity || quantity <= 0 || price === null) return [];
    return [{ row, unitPrice: price / quantity }];
  });

  const groupHistorically = Boolean(plan?.historical || /\b(historical|history|trend|monthly|by month|per month|over time)\b/i.test(request));
  const aggregateMap = new Map<string, { product: string; country: string; scale: string; period?: string; values: number[] }>();
  for (const item of usable) {
    const scale = string(item.row.measurement_scale_standardized) || "standard unit";
    const matchedTerms = productTerms.filter((term) => productText(item.row).includes(term));
    const labels = matchedTerms;
    for (const product of labels) {
      const period = groupHistorically ? string(item.row.timestamp_extract_utc).slice(0, 7) : undefined;
      const key = [period ?? "", product, string(item.row.country), scale].join("|");
      const group = aggregateMap.get(key) ?? { product, country: string(item.row.country), scale, period, values: [] };
      group.values.push(item.unitPrice);
      aggregateMap.set(key, group);
    }
  }
  const aggregates: Aggregate[] = [...aggregateMap.values()].map((group) => ({
    period: group.period,
    product: group.product,
    country: group.country,
    scale: group.scale,
    recordCount: group.values.length,
    averageUnitPrice: round(mean(group.values)),
    medianUnitPrice: round(median(group.values)),
    minimumUnitPrice: round(Math.min(...group.values)),
    maximumUnitPrice: round(Math.max(...group.values)),
  })).sort((a, b) => (a.period ?? "").localeCompare(b.period ?? "") || a.product.localeCompare(b.product) || a.country.localeCompare(b.country) || a.scale.localeCompare(b.scale));
  return { currency, requestedCountries, productTerms, dateRange, selectedRows: dateFiltered.length, usableRows: usable.length, aggregates };
}

function deterministicAnswer(result: ReturnType<typeof analyze>) {
  if (!result.aggregates.length) return apology;
  const currency = currencyLabels[result.currency];
  const heading = `Database-only unit-price analysis (${currency}; raw price ÷ quantity_standardized)`;
  const period = result.dateRange ? ` Filtered by timestamp_extract_utc from ${result.dateRange.start} to ${result.dateRange.end}.` : "";
  return `${heading}. ${result.aggregates.length} table row(s) matched.${period}`;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { request?: unknown } | null;
  const userRequest = typeof body?.request === "string" ? body.request.trim() : "";
  if (!userRequest) return NextResponse.json({ error: "Please enter a request." }, { status: 400 });

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase.from("detail_price").select("*");
  if (error) return NextResponse.json({ error: "I’m sorry, I’m unable to retrieve detail_price right now." }, { status: 500 });

  const plan = await interpretRequest(userRequest);
  const result = analyze((data ?? []) as PriceRow[], userRequest, plan);
  const answer = deterministicAnswer(result);
  return NextResponse.json({ answer, recordsAnalyzed: result.usableRows, aggregates: result.aggregates, calculation: `${priceFields[result.currency]} ÷ quantity_standardized`, currencyLabel: currencyLabels[result.currency], matchedRows: result.selectedRows });
}
