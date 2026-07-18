import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type SqlPlan = { sql: string; title?: string };
type ResponsesApiBody = {
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
};

const apology = "Sorry, I’m unable to fulfill this request from the detail_price database.";
const dangerousSql = /\b(insert|update|delete|merge|upsert|drop|alter|create|truncate|grant|revoke|copy|call|do|execute|vacuum|analyze|comment|security|set_config|pg_sleep|dblink|information_schema|pg_catalog|auth\.|storage\.)\b/i;

function planFromJson(value: unknown): SqlPlan | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.sql !== "string") return null;
  const sql = raw.sql.trim().replace(/;\s*$/, "");
  if (!sql || sql.length > 12_000) return null;
  return { sql, title: typeof raw.title === "string" ? raw.title.slice(0, 120) : undefined };
}

function isAllowedSql(sql: string) {
  if (!/^(select|with)\b/i.test(sql) || dangerousSql.test(sql)) return false;
  if (sql.includes(";") || !/\bdetail_price\b/i.test(sql)) return false;
  return true;
}

function responseText(body: ResponsesApiBody) {
  if (body.output_text?.trim()) return body.output_text.trim();
  return body.output
    ?.flatMap((item) => item.content ?? [])
    .filter((item) => item.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text)
    .join("\n")
    .trim() ?? "";
}

async function createSqlPlan(question: string): Promise<SqlPlan | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        instructions: `You translate a user question into one PostgreSQL read-only query for the table detail_price. Return JSON only: {"title":"short title","sql":"one query"}.

Allowed table and columns only:
detail_price(product_name, source, rating, review_count, method, source_date, timestamp_extract_utc, product_name_en, measurement_scale_standardized, quantity_standardized, price_local, price_usd, price_eur, price_chf, price_jpy, price_cny, price_aud, price_sgd, product_category, country).

Rules:
- Generate exactly one SELECT query, or one WITH ... SELECT query. Never generate DDL/DML, comments, semicolons, web searches, or another table.
- You may use WHERE, GROUP BY, HAVING, ORDER BY, LIMIT, CTEs, window functions including ROW_NUMBER/PARTITION BY, and PostgreSQL aggregate functions such as AVG, MIN, MAX, percentile_cont(0.5) within group (order by ...).
- For every price analysis, first calculate a unit price as price_currency / NULLIF(quantity_standardized, 0), then apply AVG, median, MIN, MAX, ranking, or comparisons to that unit price. Use the currency asked by the user; default to price_usd.
- Use timestamp_extract_utc for every historical/date analysis. For month grouping use date_trunc('month', timestamp_extract_utc)::date.
- Match a requested product/category using product_category, product_name, or product_name_en. Return user-friendly column aliases.
- Add LIMIT 500 unless aggregation guarantees fewer results.
- Do not answer the user; return only the JSON query plan.`,
        input: question,
      }),
    });
    if (!response.ok) return null;
    const body = await response.json() as ResponsesApiBody;
    const text = responseText(body).replace(/^```json\s*|\s*```$/g, "");
    const plan = text ? planFromJson(JSON.parse(text)) : null;
    return plan && isAllowedSql(plan.sql) ? plan : null;
  } catch {
    return null;
  }
}

function normaliseRows(value: unknown) {
  if (!Array.isArray(value)) return [] as Record<string, unknown>[];
  return value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object").slice(0, 500);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { request?: unknown } | null;
  const question = typeof body?.request === "string" ? body.request.trim() : "";
  if (!question) return NextResponse.json({ error: "Please enter a request." }, { status: 400 });

  const plan = await createSqlPlan(question);
  if (!plan) return NextResponse.json({ answer: apology, rows: [], sql: null });

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase.rpc("run_price_agent_query", { query_text: plan.sql });
  if (error) {
    return NextResponse.json({
      answer: "Sorry, I’m unable to run this read-only detail_price query right now. Please confirm that the run_price_agent_query function has been installed in Supabase.",
      rows: [],
      sql: plan.sql,
    });
  }

  const rows = normaliseRows(data);
  const answer = rows.length
    ? `${plan.title ?? "Database result"}: ${rows.length} row(s) returned from detail_price.`
    : "The read-only detail_price query completed, but no rows matched the request.";
  return NextResponse.json({ answer, rows, sql: plan.sql });
}
