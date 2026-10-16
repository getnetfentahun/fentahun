"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);

    try {
      const result = await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirect: false,
      });
      if (result?.error) {
        setError("The email or password is incorrect.");
        return;
      }
      router.replace("/employees");
      router.refresh();
    } catch {
      setError("Unable to sign in right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
        <p className="text-sm font-semibold text-brand">Super Double T General Trading PLC</p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">Sign in</h1>
        <p className="mt-2 text-sm text-slate-500">Use your employee account to continue.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              maxLength={120}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={200}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
