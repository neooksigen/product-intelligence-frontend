export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      
      <h1 className="text-3xl font-bold mb-8 text-center">
        Welcome, what do you want to explore?
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl">
        
        <MenuButton title="Daily Price Comparison - Table" link="/daily-table" />
        <MenuButton title="Monthly Price Comparison - Table" link="/monthly-table" />
        <MenuButton title="Price Monitoring per Country" link="/country" />
        <MenuButton title="Daily Price Comparison - Chart" link="/daily-chart" />
        <MenuButton title="Monthly Price Comparison - Chart" link="/monthly-chart" />
        <MenuButton title="Raw Data Price" link="/raw" />

      </div>

    </main>
  );
}

function MenuButton({ title, link }: { title: string; link: string }) {
  return (
    <a
      href={link}
      className="block p-4 bg-white rounded-2xl shadow hover:shadow-lg transition text-center font-medium"
    >
      {title}
    </a>
  );
}