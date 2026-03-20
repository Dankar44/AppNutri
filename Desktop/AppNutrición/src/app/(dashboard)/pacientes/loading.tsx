export default function PacientesLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex justify-between mb-6">
        <div><div className="h-8 w-40 bg-muted rounded mb-2" /><div className="h-4 w-56 bg-muted rounded" /></div>
        <div className="h-10 w-36 bg-muted rounded-lg" />
      </div>
      <div className="bg-card rounded-xl border border-border">
        <div className="h-12 border-b border-border" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 border-b border-border last:border-0" />
        ))}
      </div>
    </div>
  );
}
