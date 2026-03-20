export default function DietasLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex justify-between mb-6">
        <div><div className="h-8 w-52 bg-muted rounded mb-2" /><div className="h-4 w-32 bg-muted rounded" /></div>
        <div className="h-10 w-32 bg-muted rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-5 h-32" />
        ))}
      </div>
    </div>
  );
}
