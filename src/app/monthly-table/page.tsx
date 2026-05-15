/*export const dynamic = 'force-dynamic';*/

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import Dashboard from "./Dashboard"

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data } = await supabase
    .from('monthly_price')
    .select('*')

  const safeData = data ?? []

  // 🔥 IMPORTANT: map year_month → year_month
  const transformed = safeData.map(d => ({
    ...d,
    year_month: d.year_month,
    count_products: d.count_products  //30 april 2026 added recommended by chatgpt (optional)  
  }))

  return (
    <div className="p-6">
      <Dashboard data={transformed} />
    </div>
  )
}