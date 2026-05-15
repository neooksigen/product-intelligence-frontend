/*export const dynamic = 'force-dynamic';*/

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data, error, count } = await supabase
    .from('daily_price') // <-- key change 
    .select('*', { count: 'exact' });

  console.log({ error, count, dataLen: data?.length, sample: data?.[0] });

  if (error) {
    return <div className="p-6 text-red-600">{error.message}</div>
  }

  return (
    <div className="p-6">
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}