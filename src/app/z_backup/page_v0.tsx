import { supabase } from "@/lib/supabase";

export default async function Page() {
  const { data, error } = await supabase
    .from("daily_price")
    .select("*")
    .limit(10);

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Daily Price (Preview)</h1>
      <pre className="text-sm bg-gray-100 p-4 rounded">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}