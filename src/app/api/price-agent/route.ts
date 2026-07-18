import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type PriceRow = Record<string, unknown>;
type Currency = "local" | "usd" | "eur" | "chf" | "jpy" | "cny" | "aud" | "sgd";
type Aggregate = { product: string; country: string; scale: string; recordCount: number; averageUnitPrice: number; minimumUnitPrice: number; maximumUnitPrice: number };

const priceFields: Record<Currency, string> = { local: "price_local", usd: "price_usd", eur: "price_eur", chf: "price_chf", jpy: "price_jpy", cny: "price_cny", aud: "price_aud", sgd: "price_sgd" };
const currencyLabels: Record<Currency, string> = { local: "local currency", usd: "USD", eur: "EUR", chf: "CHF", jpy: "JPY", cny: "CNY", aud: "AUD", sgd: "SGD" };
const ignoredWords = new Set(["a", "an", "and", "are", "average", "by", "can", "comparison", "compare", "currency", "for", "from", "give", "hi", "historical", "history", "how", "i", "in", "is", "me", "of", "on", "per", "please", "price", "prices", "recommend", "show", "the", "to", "unit", "what", "with", "year", "usd", "eur", "chf", "jpy", "cny", "aud", "sgd", "local"]);
const apology = "Sorry, I’m unable to fulfill this request from the detail_price database.";

function string(value: unknown) { return typeof value === "string" ? value : ""; }
function numeric(value: unknown) { const number = Number(value); return Number.isFinite(number) ? number : null; }
function normal(value: unknown) { return string(value).toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim(); }
function mean(values: number[]) { return values.reduce((sum, value) => sum + value, 0) / values.length; }
function round(value: number) { return Number(value.toFixed(4)); }

function parseCurrency(request: string): Currency {
  const words = normal(request).split(" ");
  const currency = (["usd", "eur", "chf", "jpy", "cny", "aud", "sgd"] as Currency[]).find((value) => words.includes(value));
  return currency ?? (normal(request).includes("local currency") ? "local" : "usd");
}

function parseDateRange(request: string) {
  const dates = request.match(/\b\d{4}-\d{2}-\d{2}\b/g) ?? [];
  if (dates.length >= 2 && dates[0] && dates[1]) return { start: dates[0], end: dates[1] };
  const year = request.match(/\b(20\d{2})\b/)?.[1];
  return year ? { start: `${year}-01-01`, end: `${year}-12-31` } : null;
}

function productText(row: PriceRow) {
  return `${normal(row.product_name)} ${normal(row.product_name_en)} ${normal(row.product_category)}`.trim();
}

function analyze(rows: PriceRow[], request: string) {
  const requestText = normal(request);
  const currency = parseCurrency(request);
  const priceField = priceFields[currency];
  const countries = [...new Set(rows.map((row) => string(row.country)).filter(Boolean))];
  const requestedCountries = countries.filter((country) => requestText.includes(normal(country)));
  const countryFiltered = requestedCountries.length ? rows.filter((row) => requestedCountries.includes(string(row.country))) : rows;
  const terms = [...new Set(requestText.split(" ").filter((word) => word.length > 2 && !ignoredWords.has(word)))];
  const productTerms = terms.filter((term) => countryFiltered.some((row) => productText(row).includes(term)));
  const productFiltered = productTerms.length ? countryFiltered.filter((row) => productTerms.some((term) => productText(row).includes(term))) : countryFiltered;
  const dateRange = parseDateRange(request);
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

  const aggregateMap = new Map<string, { product: string; country: string; scale: string; values: number[] }>();
  for (const item of usable) {
    const scale = string(item.row.measurement_scale_standardized) || "standard unit";
    const matchedTerms = productTerms.filter((term) => productText(item.row).includes(term));
    const labels = matchedTerms.length ? matchedTerms : [string(item.row.product_category) || string(item.row.product_name_en) || string(item.row.product_name) || "matching products"];
    for (const product of labels) {
      const key = [product, string(item.row.country), scale].join("|");
      const group = aggregateMap.get(key) ?? { product, country: string(item.row.country), scale, values: [] };
      group.values.push(item.unitPrice);
      aggregateMap.set(key, group);
    }
  }
  const aggregates: Aggregate[] = [...aggregateMap.values()].map((group) => ({
    product: group.product,
    country: group.country,
    scale: group.scale,
    recordCount: group.values.length,
    averageUnitPrice: round(mean(group.values)),
    minimumUnitPrice: round(Math.min(...group.values)),
    maximumUnitPrice: round(Math.max(...group.values)),
  })).sort((a, b) => a.product.localeCompare(b.product) || a.country.localeCompare(b.country) || a.scale.localeCompare(b.scale));

  const daily = new Map<string, number[]>();
  for (const item of usable) {
    const date = string(item.row.timestamp_extract_utc).slice(0, 10);
    if (date) daily.set(date, [...(daily.get(date) ?? []), item.unitPrice]);
  }
  const chart = [...daily.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, values]) => ({ date, averagePrice: round(mean(values)) }));
  return { currency, requestedCountries, productTerms, dateRange, selectedRows: dateFiltered.length, usableRows: usable.length, aggregates, chart };
}

function deterministicAnswer(result: ReturnType<typeof analyze>) {
  if (!result.aggregates.length) return apology;
  const currency = currencyLabels[result.currency];
  const heading = `Database-only unit-price analysis (${currency}; raw price ÷ quantity_standardized)`;
  const lines = result.aggregates.map((item) => `• ${item.product} — ${item.country}, per ${item.scale}: average ${item.averageUnitPrice.toLocaleString()} ${currency} (${item.recordCount} records; range ${item.minimumUnitPrice.toLocaleString()}–${item.maximumUnitPrice.toLocaleString()})`);
  const lowest = [...result.aggregates].sort((a, b) => a.averageUnitPrice - b.averageUnitPrice)[0];
  const period = result.dateRange ? ` Filtered by timestamp_extract_utc from ${result.dateRange.start} to ${result.dateRange.end}.` : " Historical dates, when charted, use timestamp_extract_utc.";
  return `${heading}\n\n${lines.join("\n")}\n\nRecommendation: Within these matching database records, ${lowest.product} in ${lowest.country} (${lowest.scale}) has the lowest average unit price at ${lowest.averageUnitPrice.toLocaleString()} ${currency}.${period}`;
}

async function optionalExplanation(request: string, result: ReturnType<typeof analyze>, fallback: string) {
  if (!process.env.OPENAI_API_KEY || !result.aggregates.length) return fallback;
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "gpt-5",
        instructions: `You are Product Price Master Agent. Use only the supplied, pre-calculated detail_price result. Never browse the web or refer to any source other than detail_price. Every number is already price divided by quantity_standardized. Do not change, recalculate, omit, or invent numbers. Historical dates use timestamp_extract_utc. Reply concisely with an analysis and a labelled Recommendation.`,
        input: `User request: ${request}\n\nCalculated database result:\n${fallback}`,
      }),
    });
    if (!response.ok) return fallback;
    const body = await response.json() as { output_text?: string };
    return body.output_text?.trim() || fallback;
  } catch {
    return fallback;
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { request?: unknown } | null;
  const userRequest = typeof body?.request === "string" ? body.request.trim() : "";
  if (!userRequest) return NextResponse.json({ error: "Please enter a request." }, { status: 400 });

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase.from("detail_price").select("*");
  if (error) return NextResponse.json({ error: "I’m sorry, I’m unable to retrieve detail_price right now." }, { status: 500 });

  const result = analyze((data ?? []) as PriceRow[], userRequest);
  const fallback = deterministicAnswer(result);
  const answer = await optionalExplanation(userRequest, result, fallback);
  return NextResponse.json({ answer, chart: result.chart, recordsAnalyzed: result.usableRows, chartLabel: `Average ${currencyLabels[result.currency]} price per standard unit`, aggregates: result.aggregates, calculation: `${priceFields[result.currency]} ÷ quantity_standardized`, matchedRows: result.selectedRows });
}
