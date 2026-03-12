export function App() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface font-sans">
      <h1 className="text-4xl font-bold text-text-primary">KhufusHome Dashboard</h1>
      <p className="mt-2 text-lg text-text-secondary">khufushome.com — Main hub</p>
      <div className="mt-6 flex gap-3">
        <span className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white">
          3D View
        </span>
        <span className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white">
          Finance
        </span>
      </div>
    </div>
  );
}
