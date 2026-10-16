import { AttendanceStatus, UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveReport } from "@/lib/report-data";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

function csvExportUrl(from: string, to: string, employeeId: string, departmentId: string) {
  const params = new URLSearchParams({ from, to });
  if (employeeId) params.set("employeeId", employeeId);
  if (departmentId) params.set("departmentId", departmentId);
  return `/api/reports/attendance.csv?${params.toString()}`;
}

export default async function ReportsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, employeeId: true, name: true },
  });
  if (!user) redirect("/login");

  const query = await searchParams;
  const repeatedFilter = Object.values(query).some((value) => Array.isArray(value));
  const resolved = await resolveReport(
    { role: user.role, employeeId: user.employeeId },
    {
      from: one(query.from),
      to: one(query.to),
      employeeId: one(query.employeeId),
      departmentId: one(query.departmentId),
    },
  );
  if (repeatedFilter) resolved.error = "A report filter was supplied more than once.";
  const canManage = user.role === UserRole.ADMIN || user.role === UserRole.HR;
  const employeeWhere = {
    ...(resolved.filters.departmentId ? { departmentId: resolved.filters.departmentId } : {}),
    ...(resolved.filters.employeeId ? { id: resolved.filters.employeeId } : {}),
  };

  if (resolved.error) {
    return (
      <ReportLayout name={user.name} role={user.role}>
        <ReportFiltersForm filters={resolved.filters} employees={[]} departments={[]} canManage={canManage} />
        <div role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
          {resolved.error}
        </div>
      </ReportLayout>
    );
  }

  const reportData = await Promise.all([
    prisma.attendance.findMany({
      where: resolved.where,
      orderBy: [{ attendanceDate: "desc" }, { employee: { lastName: "asc" } }],
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: { select: { id: true, name: true } },
          },
        },
      },
    }),
    canManage
      ? prisma.employee.findMany({
          where: employeeWhere,
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: { select: { id: true, name: true } },
          },
        })
      : prisma.employee.findMany({
          where: { id: user.employeeId ?? "" },
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: { select: { id: true, name: true } },
          },
        }),
    canManage
      ? prisma.department.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
      : Promise.resolve([]),
  ]).catch((error: unknown) => {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    const errorCode =
      error && typeof error === "object" && "code" in error && typeof error.code === "string"
        ? error.code
        : undefined;
    console.warn("Reports data is temporarily unavailable.", { errorName, errorCode });
    return null;
  });
  if (!reportData) {
    return (
      <ReportLayout name={user.name} role={user.role}>
        <section role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
          <h2 className="font-semibold">Reports are temporarily unavailable</h2>
          <p className="mt-2 text-sm">The report data could not be loaded from the database. Check the database connection and try again.</p>
          <a href="/reports" className="mt-4 inline-flex rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">
            Try again
          </a>
        </section>
      </ReportLayout>
    );
  }
  const [records, employees, departments] = reportData;

  const counts = {
    [AttendanceStatus.PRESENT]: 0,
    [AttendanceStatus.LATE]: 0,
    [AttendanceStatus.ABSENT]: 0,
  };
  const summaries = new Map<string, {
    id: string;
    code: string;
    name: string;
    department: string;
    present: number;
    late: number;
    absent: number;
  }>();

  for (const employee of employees) {
    summaries.set(employee.id, {
      id: employee.id,
      code: employee.employeeCode,
      name: `${employee.firstName} ${employee.lastName}`,
      department: employee.department.name,
      present: 0,
      late: 0,
      absent: 0,
    });
  }
  for (const record of records) {
    counts[record.status] += 1;
    const summary = summaries.get(record.employeeId);
    if (summary) {
      if (record.status === AttendanceStatus.PRESENT) summary.present += 1;
      if (record.status === AttendanceStatus.LATE) summary.late += 1;
      if (record.status === AttendanceStatus.ABSENT) summary.absent += 1;
    }
  }
  return (
    <ReportLayout name={user.name} role={user.role}>
      <ReportFiltersForm
        filters={resolved.filters}
        employees={employees.map((employee) => ({
          id: employee.id,
          label: `${employee.employeeCode} — ${employee.firstName} ${employee.lastName}`,
        }))}
        departments={departments}
        canManage={canManage}
      />

      <section aria-label="Filtered attendance totals" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TotalCard label="Attendance records" value={records.length} tone="slate" />
        <TotalCard label="Present" value={counts.PRESENT} tone="green" />
        <TotalCard label="Late" value={counts.LATE} tone="amber" />
        <TotalCard label="Absent" value={counts.ABSENT} tone="red" />
      </section>

      <section aria-labelledby="employee-summary-heading" className="mt-6 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 id="employee-summary-heading" className="text-base font-bold text-ink">Employee attendance summaries</h2>
          <p className="mt-1 text-xs text-slate-500">Totals include every record matching the selected report filters.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead className="bg-slate-50/80">
              <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th scope="col" className="px-5 py-3.5 sm:px-6">Employee</th>
                <th scope="col" className="px-4 py-3.5">Department</th>
                <th scope="col" className="px-4 py-3.5">Present</th>
                <th scope="col" className="px-4 py-3.5">Late</th>
                <th scope="col" className="px-4 py-3.5">Absent</th>
                <th scope="col" className="px-4 py-3.5">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...summaries.values()].map((summary) => (
                <tr key={summary.id}>
                  <td className="px-5 py-3.5 text-sm font-medium text-ink sm:px-6">{summary.code} · {summary.name}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">{summary.department || "—"}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">{summary.present}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">{summary.late}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">{summary.absent}</td>
                  <td className="px-4 py-3.5 text-sm font-semibold text-ink">{summary.present + summary.late + summary.absent}</td>
                </tr>
              ))}
              {summaries.size === 0 && (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">No employee summaries for these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="attendance-detail-heading" className="mt-6 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card print:break-before-page">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 id="attendance-detail-heading" className="text-base font-bold text-ink">Attendance details</h2>
            <p className="mt-1 text-xs text-slate-500">{resolved.filters.from} to {resolved.filters.to}</p>
          </div>
          <a href={csvExportUrl(resolved.filters.from, resolved.filters.to, resolved.filters.employeeId, resolved.filters.departmentId)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand print:hidden">
            Export CSV
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-slate-50/80">
              <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th scope="col" className="px-5 py-3.5 sm:px-6">Date</th>
                <th scope="col" className="px-4 py-3.5">Employee code</th>
                <th scope="col" className="px-4 py-3.5">Employee name</th>
                <th scope="col" className="px-4 py-3.5">Department</th>
                <th scope="col" className="px-4 py-3.5">Status</th>
                <th scope="col" className="px-4 py-3.5">Check in</th>
                <th scope="col" className="px-4 py-3.5">Check out</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((record) => (
                <tr key={record.id}>
                  <td className="whitespace-nowrap px-5 py-3.5 text-sm text-slate-600 sm:px-6">{record.attendanceDate.toISOString().slice(0, 10)}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm font-medium text-ink">{record.employee.employeeCode}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{record.employee.firstName} {record.employee.lastName}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{record.employee.department.name}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{record.status}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{record.checkIn.toISOString()}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{record.checkOut?.toISOString() ?? "—"}</td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center"><p className="text-sm font-semibold text-slate-700">No attendance records match</p><p className="mt-1 text-xs text-slate-500">Change the date range or selected filters.</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </ReportLayout>
  );
}

function ReportLayout({ name, role, children }: { name: string; role: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:pl-[260px]">
      <div className="print:hidden"><Sidebar activePage="Reports" /></div>
      <header className="flex min-h-[76px] items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-9">
        <div><p className="text-xs font-medium text-slate-400">Pages / Reports</p><h1 className="mt-1 text-xl font-bold tracking-tight text-ink sm:text-2xl">Reports</h1></div>
        <div className="text-right"><p className="text-sm font-semibold text-ink">{name}</p><p className="text-xs text-slate-500">{role}</p></div>
      </header>
      <main className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 sm:py-8 lg:px-9 print:max-w-none print:p-0">{children}</main>
    </div>
  );
}

function ReportFiltersForm({
  filters,
  employees,
  departments,
  canManage,
}: {
  filters: { from: string; to: string; employeeId: string; departmentId: string };
  employees: Array<{ id: string; label: string }>;
  departments: Array<{ id: string; name: string }>;
  canManage: boolean;
}) {
  return (
    <form method="get" className="grid gap-4 rounded-xl border border-slate-200/80 bg-white p-5 shadow-card sm:grid-cols-2 lg:grid-cols-5 lg:items-end print:hidden">
      <div><label htmlFor="report-from" className="mb-1.5 block text-sm font-medium text-slate-700">From</label><input id="report-from" name="from" type="date" required defaultValue={filters.from} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" /></div>
      <div><label htmlFor="report-to" className="mb-1.5 block text-sm font-medium text-slate-700">To</label><input id="report-to" name="to" type="date" required defaultValue={filters.to} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" /></div>
      {canManage && <>
        <div><label htmlFor="report-employee" className="mb-1.5 block text-sm font-medium text-slate-700">Employee</label><select id="report-employee" name="employeeId" defaultValue={filters.employeeId} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"><option value="">All employees</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.label}</option>)}</select></div>
        <div><label htmlFor="report-department" className="mb-1.5 block text-sm font-medium text-slate-700">Department</label><select id="report-department" name="departmentId" defaultValue={filters.departmentId} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"><option value="">All departments</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></div>
      </>}
      <div><button type="submit" className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand">Apply filters</button></div>
    </form>
  );
}

function TotalCard({ label, value, tone }: { label: string; value: number; tone: "slate" | "green" | "amber" | "red" }) {
  const styles = { slate: "text-ink", green: "text-emerald-700", amber: "text-amber-700", red: "text-rose-700" };
  return <article className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card"><p className="text-sm font-medium text-slate-500">{label}</p><p className={`mt-2 text-3xl font-bold ${styles[tone]}`}>{value}</p></article>;
}
