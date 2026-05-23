/*export const dynamic = 'force-dynamic';*/

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import Dashboard from "./Dashboard"

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data } = await supabase
    .from('detail_price')
    .select('*')

  const safeData = data ?? []

  // 🔥 IMPORTANT: map date_key → date
  const transformed = safeData.map(d => ({
    ...d,
    date: d.timestamp_extract_utc
    ? d.timestamp_extract_utc.slice(0, 10)  // ✅ take only YYYY-MM-DD edited 23 may 2026
    : "",
    count_products: d.count_products  //30 april 2026 added recommended by chatgpt (optional)  
  }))

  return (
    <div className="p-6">
      <Dashboard data={transformed} />
    </div>
  )
}
