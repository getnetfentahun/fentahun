export default function ReportsLoading() {
  return (
    <main aria-label="Loading reports" className="mx-auto max-w-[1480px] animate-pulse px-4 py-8 sm:px-6 lg:px-9">
      <div className="h-24 rounded-xl bg-white" />
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-24 rounded-xl bg-white" />)}</div>
      <div className="mt-5 h-80 rounded-xl bg-white" />
    </main>
  );
}
