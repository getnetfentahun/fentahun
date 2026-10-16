import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import BiometricCameraPrototype from "@/components/biometric-camera-prototype";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageBiometrics } from "@/lib/biometric-policy";

export default async function BiometricPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, employeeId: true, name: true },
  });
  if (!user) redirect("/login");
  if (user.role === UserRole.EMPLOYEE && !user.employeeId) notFound();
  if (![UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE].includes(user.role)) notFound();

  const canManage = canManageBiometrics(user.role);
  const employees = await prisma.employee.findMany({
    where: canManage ? undefined : { id: user.employeeId! },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: { employeeCode: true, firstName: true, lastName: true },
  });

  return (
    <div className="min-h-screen lg:pl-[260px]">
      <Sidebar activePage="Biometric" />
      <header className="flex min-h-[76px] items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-9">
        <div>
          <p className="text-xs font-medium text-slate-400">Pages / Biometric</p>
          <h1 id="biometric-page-title" className="mt-1 text-xl font-bold tracking-tight text-ink sm:text-2xl">Biometric attendance</h1>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-ink">{user.name}</p>
          <p className="text-xs text-slate-500">{user.role}</p>
        </div>
      </header>

      <main aria-labelledby="biometric-page-title" className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 sm:py-8 lg:px-9">
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
          <p className="text-sm font-bold text-amber-900">Development prototype — biometric identity verification is not enabled</p>
          <p className="mt-1 text-sm leading-6 text-amber-800">
            Camera preview is only a permission/device test. There is no face matching, liveness detection, biometric enrollment, or biometric attendance recording.
          </p>
        </div>

        <section aria-labelledby="face-section-title" className="mb-6 rounded-xl border border-slate-200/80 bg-white p-5 shadow-card sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="face-section-title" className="text-base font-bold text-ink">Face recognition</h2>
              <p className="mt-1 text-sm text-slate-500">Camera access starts only after an explicit user action.</p>
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20">
              Prototype only
            </span>
          </div>
          <BiometricCameraPrototype />
          {canManage && (
            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-ink">Employee enrollment status</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Only ADMIN/HR can view this roster. Enrollment is not available until a secure matching and liveness system is selected and reviewed.
              </p>
              {employees.length ? (
                <ul className="mt-3 divide-y divide-slate-200">
                  {employees.map((employee) => (
                    <li key={employee.employeeCode} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                      <span className="font-medium text-slate-800">{employee.employeeCode} · {employee.firstName} {employee.lastName}</span>
                      <span className="text-xs font-semibold text-slate-500">Not enrolled</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-600">No employees are available for enrollment readiness.</p>
              )}
            </div>
          )}
          {!canManage && (
            <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              Your biometric enrollment status: <span className="font-semibold">Not enrolled</span>. Only ADMIN/HR can manage enrollment.
            </p>
          )}
        </section>

        <section aria-labelledby="fingerprint-section-title" className="mb-6 rounded-xl border border-slate-200/80 bg-white p-5 shadow-card sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="fingerprint-section-title" className="text-base font-bold text-ink">Fingerprint scanner</h2>
              <p className="mt-1 text-sm text-slate-500">Integration point reserved for compatible physical hardware.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Hardware not connected</span>
          </div>
          <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-800">Scanner SDK/API required</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Connect a supported scanner through its vendor SDK or a secured local device service. Do not send or store raw fingerprint images in the browser or database.
            </p>
          </div>
        </section>

        <section aria-labelledby="events-section-title" className="mb-6 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <h2 id="events-section-title" className="text-base font-bold text-ink">Recent biometric attendance events</h2>
            <p className="mt-1 text-xs text-slate-500">No events are reported until a verified biometric method is implemented.</p>
          </div>
          <p className="px-5 py-8 text-center text-sm text-slate-500 sm:px-6">
            No biometric attendance events. Existing attendance records do not identify a capture method.
          </p>
        </section>

        <section aria-labelledby="manual-attendance-title" className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
          <h2 id="manual-attendance-title" className="text-base font-bold text-emerald-950">Manual attendance remains available</h2>
          <p className="mt-1 text-sm text-emerald-900">Continue recording and reviewing attendance using the existing attendance page.</p>
          <a href="/attendance" className="mt-4 inline-flex rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand">
            Go to attendance
          </a>
        </section>
      </main>
    </div>
  );
}
