
export const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/50 p-8">
      <div className="container mx-auto">
        <div className="h-[200px] bg-white/10 rounded-lg animate-pulse" />
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[200px] bg-white/10 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
};
