"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updateSystemSettings } from "@/app/settings/actions";

const timezones = [
  "Africa/Addis_Ababa",
  "Africa/Nairobi",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Europe/London",
  "UTC",
];

export default function SettingsForm({
  initialTimezone,
  initialReportDays,
  canEdit,
}: {
  initialTimezone: string;
  initialReportDays: number;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [timezone, setTimezone] = useState(initialTimezone);
  const [reportDefaultDays, setReportDefaultDays] = useState(String(initialReportDays));
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const result = await updateSystemSettings({
        timezone,
        reportDefaultDays: Number(reportDefaultDays),
      });
      if (!result.ok) {
        setMessage({ type: "error", text: result.message });
        return;
      }
      setMessage({ type: "success", text: "Settings saved and will remain after you sign out." });
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Settings could not be saved. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <fieldset disabled={!canEdit} className="space-y-5 disabled:opacity-80">
        <div>
          <label htmlFor="system-timezone" className="mb-1.5 block text-sm font-medium text-slate-700">Organization timezone</label>
          <select id="system-timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)}
            className="w-full max-w-lg rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-emerald-100">
            {!timezones.includes(initialTimezone) && <option value={initialTimezone}>{initialTimezone}</option>}
            {timezones.map((zone) => <option value={zone} key={zone}>{zone.replaceAll("_", " ")}</option>)}
          </select>
          <p className="mt-1 text-xs text-slate-500">Used to define the date range in attendance reports and the dashboard.</p>
        </div>
        <div>
          <label htmlFor="report-default-days" className="mb-1.5 block text-sm font-medium text-slate-700">Default report period (days)</label>
          <input id="report-default-days" type="number" min={1} max={365} step={1} required value={reportDefaultDays}
            onChange={(event) => setReportDefaultDays(event.target.value)}
            className="w-full max-w-lg rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-emerald-100" />
          <p className="mt-1 text-xs text-slate-500">Reports use this range when no dates are provided. Choose 1–365 days.</p>
        </div>
      </fieldset>

      {message && (
        <p role={message.type === "error" ? "alert" : "status"}
          className={`rounded-lg px-4 py-3 text-sm ${message.type === "error" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-800"}`}>
          {message.text}
        </p>
      )}
      {canEdit ? (
        <button type="submit" disabled={saving}
          className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-60">
          {saving ? "Saving…" : "Save settings"}
        </button>
      ) : (
        <p className="text-sm text-slate-500">Only ADMIN users may change these settings.</p>
      )}
    </form>
  );
}
