"use client";

export default function SettingsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-xl font-bold text-ink">Settings could not be loaded</h1>
      <p className="mt-2 text-sm text-slate-600">Check your database connection and try again.</p>
      <button type="button" onClick={reset} className="mt-5 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white">Try again</button>
    </main>
  );
}
