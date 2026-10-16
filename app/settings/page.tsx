import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import SettingsForm from "@/components/settings-form";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditSystemSettings } from "@/lib/report-utils";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, name: true },
  });
  if (!user) redirect("/login");
  if (user.role === UserRole.EMPLOYEE) notFound();

  const settings = await prisma.systemSettings.findUnique({ where: { id: "singleton" } });
  return (
    <div className="min-h-screen lg:pl-[260px]">
      <Sidebar activePage="Settings" />
      <header className="flex min-h-[76px] items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-9">
        <div>
          <p className="text-xs font-medium text-slate-400">Pages / Settings</p>
          <h1 id="settings-title" className="mt-1 text-xl font-bold tracking-tight text-ink sm:text-2xl">Settings</h1>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-ink">{user.name}</p>
          <p className="text-xs text-slate-500">{user.role}</p>
        </div>
      </header>
      <main aria-labelledby="settings-title" className="mx-auto max-w-[1000px] px-4 py-6 sm:px-6 sm:py-8 lg:px-9">
        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card sm:p-7">
          <div className="mb-6">
            <h2 className="text-base font-bold text-ink">Organization and report defaults</h2>
            <p className="mt-1 text-sm text-slate-500">Changes are stored in PostgreSQL and affect the dashboard date and default report range.</p>
          </div>
          <SettingsForm
            initialTimezone={settings?.timezone ?? "Africa/Addis_Ababa"}
            initialReportDays={settings?.reportDefaultDays ?? 30}
            canEdit={canEditSystemSettings(user.role)}
          />
        </section>
      </main>
    </div>
  );
}
