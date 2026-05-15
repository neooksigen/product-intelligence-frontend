import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import Dashboard from "./Dashboard";

export default async function HomePage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)  
  // Replace these dummy values with Supabase query later

    // Get 1 row only. And rename data to specific unique name.
  const { data: count_all_data_collected, error : error_count_all_data_collected } = await supabase
    .from('monitoring_process')
    .select('count_all_data_collected')
    .single()

  const { data: count_all_data_collected_refined, error : error_count_all_data_collected_refined } = await supabase
    .from('monitoring_process')
    .select('count_all_data_collected_refined')
    .single()

  const { data: count_all_data_collected_yesterday, error : error_count_all_data_collected_yesterday } = await supabase
    .from('monitoring_process')
    .select('count_all_data_collected_yesterday')
    .single() 

  const { data: count_all_data_collected_today, error : error_count_all_data_collected_today } = await supabase
    .from('monitoring_process')
    .select('count_all_data_collected_today')
    .single()   
  
  const { data: current_timestamp_utc, error : error_current_timestamp_utc } = await supabase
    .from('monitoring_process')
    .select('current_timestamp_utc')
    .single()    
  
  const { data: monitoring_process_detail } = await supabase
    .from('monitoring_process_detail')
    .select('*')

  const safeData = monitoring_process_detail ?? []    

  // safe mapping
  const transformed = safeData.map(d => ({
    ...d,
    date: d.date,
    country: d.country,
    count_all_data_collected: d.count_all_data_collected  
  }))

  const dashboardData = {
    totalCollected: count_all_data_collected?.count_all_data_collected ?? 0,
    totalRefined: count_all_data_collected_refined?.count_all_data_collected_refined ?? 0,
    yesterdayCollected: count_all_data_collected_yesterday?.count_all_data_collected_yesterday ?? 0,
    todayCollected: count_all_data_collected_today?.count_all_data_collected_today ?? 0,
    lastUpdate: current_timestamp_utc?.current_timestamp_utc ?? "Error reading timestamp.",
    monitoringRows: transformed
    
  };

  return (
    <Dashboard
      totalCollected={dashboardData.totalCollected}
      totalRefined={dashboardData.totalRefined}
      yesterdayCollected={dashboardData.yesterdayCollected}
      todayCollected={dashboardData.todayCollected}
      lastUpdate={dashboardData.lastUpdate}
      monitoringRows={dashboardData.monitoringRows}
    />
  );
}