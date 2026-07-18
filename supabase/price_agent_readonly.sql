-- Run this once in the Supabase SQL Editor, using a project owner/admin account.
-- The application calls this function through Supabase RPC. It executes only one
-- SELECT/WITH query and retains the caller's RLS/read permissions (SECURITY INVOKER).

create or replace function end_data.run_price_agent_query(query_text text)
returns setof jsonb
language plpgsql
security invoker
set search_path = end_data, pg_temp
as $$
declare
  query_sql text := btrim(query_text);
begin
  if query_sql = '' or length(query_sql) > 12000 then
    raise exception 'Invalid query length';
  end if;

  if lower(ltrim(query_sql)) not like 'select%' and lower(ltrim(query_sql)) not like 'with%' then
    raise exception 'Only SELECT or WITH queries are allowed';
  end if;

  if query_sql ~ ';' then
    raise exception 'Multiple statements are not allowed';
  end if;

  if position('detail_price' in lower(query_sql)) = 0 then
    raise exception 'The query must read detail_price';
  end if;

  if query_sql ~* '\m(insert|update|delete|merge|upsert|drop|alter|create|truncate|grant|revoke|copy|call|do|execute|vacuum|analyze|comment|security|set_config|pg_sleep|dblink|information_schema|pg_catalog|auth|storage)\M' then
    raise exception 'Only read-only detail_price SQL is allowed';
  end if;

  perform set_config('statement_timeout', '5000', true);
  return query execute format('select to_jsonb(result_row) from (%s) result_row limit 500', query_sql);
end;
$$;

revoke all on function end_data.run_price_agent_query(text) from public;
grant execute on function end_data.run_price_agent_query(text) to anon, authenticated;
notify pgrst, 'reload schema';
