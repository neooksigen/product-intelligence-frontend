//
// 🔵 LINE CHART
//
function MultiLineChart({
  data,
  metric,
}: {
  data: DailyPrice[];
  metric: MetricKey;
}) {  
    
  const transformed = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};

    // ✅ FIX 3: strongly typed Set
    const countries = new Set<string>();

    data.forEach((d) => {
        const raw = metric ? d[metric] : undefined; //fixed by Claude Code 30 april 2026 !!!
        if (typeof raw !== "number") return;        
        //if (value == null) return;

        const date = d.date;
        const country = d.country;
        if (typeof date !== "string" || typeof country !== "string") return;
        countries.add(country);

        if (!map[date]) {
            map[date] = {};
        }

        map[date][country] = raw;
    });

    return {
      chartData: Object.entries(map)
        .map(([date, values]) => ({ date, ...values }))
        .sort((a, b) => a.date.localeCompare(b.date)),

      countries: Array.from(countries), // now string[]
    };
  }, [data, metric]);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={transformed.chartData}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />

    {transformed.countries.map((c, index) => (
        <Line
         key={c}
         type="monotone"
         dataKey={c}
         name={c}
         stroke={COLORS[index % COLORS.length]}
         strokeWidth={2}
         dot={true}
        />
   ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
