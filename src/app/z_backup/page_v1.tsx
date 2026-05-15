import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data, error, count } = await supabase
    .from("daily_price")
    .select("*", { count: "exact" });
    
  return (
    <div className="p-6">
      <h1>Debug</h1>

      <p>Count: {count}</p>
      <p>Error: {error?.message}</p>

      <pre>{JSON.stringify(
           {name: "Sammy", email: "sammy@example.com", plan: "Pro" }
        )}</pre>
    </div>
  );
}