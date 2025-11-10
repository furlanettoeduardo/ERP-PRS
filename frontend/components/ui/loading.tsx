export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-gray-200"></div>
        <div className="h-16 w-16 rounded-full border-4 border-blue-600 border-t-transparent animate-spin absolute top-0 left-0"></div>
      </div>
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-full"></div>
    </div>
  );
}
