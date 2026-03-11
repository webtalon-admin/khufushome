export function App() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface font-sans">
      <h1 className="text-4xl font-bold text-text-primary">KhufusHome Finance</h1>
      <p className="mt-2 text-lg text-text-secondary">
        finance.khufushome.com — Personal finance management
      </p>
      <div className="mt-6 flex gap-4 text-sm">
        <div className="rounded-lg bg-surface-tertiary px-4 py-3 text-center">
          <span className="block font-mono text-2xl font-bold text-success">$12,450</span>
          <span className="text-text-muted">Income</span>
        </div>
        <div className="rounded-lg bg-surface-tertiary px-4 py-3 text-center">
          <span className="block font-mono text-2xl font-bold text-error">$8,320</span>
          <span className="text-text-muted">Expenses</span>
        </div>
      </div>
    </div>
  );
}
