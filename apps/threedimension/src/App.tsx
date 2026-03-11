export function App() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface font-sans">
      <h1 className="text-4xl font-bold text-text-primary">KhufusHome 3D View</h1>
      <p className="mt-2 text-lg text-text-secondary">
        threedimension.khufushome.com — Interactive house visualization
      </p>
      <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-surface-secondary px-4 py-2">
        <span className="size-3 rounded-full bg-device-on" />
        <span className="text-sm text-text-primary">Devices online</span>
      </div>
    </div>
  );
}
