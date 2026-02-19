export default function DashboardShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-[#0b0f14] text-gray-100">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-gray-400 mt-3 max-w-2xl">
              {subtitle}
            </p>
          )}
        </header>

        <div className="space-y-8">{children}</div>
      </div>
    </div>
  );
}
