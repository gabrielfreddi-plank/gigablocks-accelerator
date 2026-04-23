export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Gigablocks
            </p>
            <p className="text-sm text-zinc-300">Dashboard</p>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
