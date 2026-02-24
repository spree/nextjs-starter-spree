export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse"
        >
          <div className="aspect-square bg-gray-200" />
          <div className="p-4">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="mt-2 h-5 bg-gray-200 rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
