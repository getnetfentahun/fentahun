import Link from "next/link";
import { EmploymentStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function EmployeeDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const employee = await prisma.employee.findUnique({
    where: { employeeCode: id },
    include: { department: { select: { name: true } } },
  });
  if (!employee) notFound();

  if (session.user.role === "EMPLOYEE" && session.user.employeeId !== employee.id) notFound();
  if (!["ADMIN", "HR", "EMPLOYEE"].includes(session.user.role)) notFound();

  const fullName = `${employee.firstName} ${employee.lastName}`;
  const employmentStatus = statusFromDatabase(employee.employmentStatus);
  const details = [
    { label: "Employee ID", value: employee.employeeCode },
    { label: "Department", value: employee.department.name },
    { label: "Job title", value: employee.jobTitle },
    { label: "Phone number", value: employee.phoneNumber || "Not provided" },
    { label: "Work location", value: employee.location || "Not provided" },
    { label: "Email address", value: employee.email || "Not provided" },
    { label: "Start date", value: employee.hireDate?.toISOString().slice(0, 10) ?? "Not provided" },
  ];

  return (
    <div className="min-h-screen lg:pl-[260px]">
      <Sidebar activePage="Employees" />
      <div className="min-h-screen">
        <header className="flex min-h-[76px] items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-9">
          <div>
            <p className="text-xs font-medium text-slate-400">Pages / Employees / Profile</p>
            <h1 id="page-title" className="mt-1 text-xl font-bold tracking-tight text-ink sm:text-2xl">
              Employee details
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-right sm:block">
              <span className="block text-sm font-semibold leading-5 text-ink">Meron Kebede</span>
              <span className="block text-xs leading-4 text-slate-500">HR Administrator</span>
            </span>
            <span aria-label="Meron Kebede profile" role="img" className="grid h-10 w-10 place-items-center rounded-full bg-orange-100 text-sm font-bold text-orange-800">
              MK
            </span>
          </div>
        </header>

        <main aria-labelledby="page-title" className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8 lg:px-9">
          <Link href="/employees" className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand">
            <span aria-hidden="true">←</span>
            Back to employees
          </Link>

          <section className="mt-6 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:px-7 sm:py-6">
              <span aria-hidden="true" className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-emerald-50 text-lg font-bold text-brand">
                {fullName.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-ink">{fullName}</h2>
                <p className="mt-1 text-sm text-slate-500">{employee.jobTitle}</p>
              </div>
              <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                employmentStatus === "Active"
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-600/10"
                  : employmentStatus === "On Leave"
                    ? "bg-amber-50 text-amber-700 ring-amber-600/10"
                    : "bg-slate-100 text-slate-600 ring-slate-500/10"
              }`}>
                {employmentStatus}
              </span>
            </div>

            <div className="p-5 sm:p-7">
              <h3 className="text-sm font-bold text-ink">Employment information</h3>
              <dl className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                {details.map((detail) => (
                  <div key={detail.label} className="border-b border-slate-100 pb-4">
                    <dt className="text-xs font-medium text-slate-500">{detail.label}</dt>
                    <dd className="mt-1.5 break-words text-sm font-semibold text-slate-800">{detail.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-5 text-xs text-slate-400">
                Employee profile information is managed in the attendance database.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function statusFromDatabase(status: EmploymentStatus) {
  switch (status) {
    case EmploymentStatus.ACTIVE:
      return "Active";
    case EmploymentStatus.ON_LEAVE:
      return "On Leave";
    case EmploymentStatus.INACTIVE:
      return "Inactive";
  }
}
