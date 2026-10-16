import { AttendanceStatus, UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { DashboardMetric } from "@/lib/mock-data";
import { dateInTimezone } from "@/lib/report-utils";

type AttendanceRow = {
  employeeName: string;
  employeeId: string;
  department: string;
  checkIn: string;
  checkOut: string;
  status: "Present" | "Late" | "Absent";
  initials: string;
  avatarColor: string;
};

type IconName =
  | "dashboard"
  | "employees"
  | "departments"
  | "attendance"
  | "reports"
  | "settings"
  | "bell"
  | "plus"
  | "clock"
  | "chart"
  | "users"
  | "check"
  | "x"
  | "calendar";

function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: IconName;
  className?: string;
}) {
  const paths: Record<IconName, React.ReactNode> = {
    dashboard: (
      <>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="3.5" width="7" height="4" rx="1.5" />
        <rect x="13.5" y="10.5" width="7" height="10" rx="1.5" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      </>
    ),
    employees: (
      <>
        <path d="M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-4A4.5 4.5 0 0 0 3 18.5V20" />
        <circle cx="9.5" cy="7.5" r="4" />
        <path d="M17 4a4 4 0 0 1 0 7.75M21 20v-1.5a4.5 4.5 0 0 0-3.5-4.38" />
      </>
    ),
    departments: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M9 20V8h6v12M7 8h.01M17 8h.01M7 12h.01M17 12h.01M7 16h.01M17 16h.01" />
      </>
    ),
    attendance: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </>
    ),
    reports: (
      <>
        <path d="M4 19V5M4 19h17" />
        <path d="m7 15 4-4 3 2 6-7" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="m19.4 15 .1.1a1.8 1.8 0 1 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3 .9v.3a1.8 1.8 0 1 1-3.6 0v-.2a1.8 1.8 0 0 0-3-.9l-.1.1a1.8 1.8 0 1 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-.9-3H3.7a1.8 1.8 0 1 1 0-3.6h.2a1.8 1.8 0 0 0 .9-3l-.1-.1a1.8 1.8 0 1 1 2.5-2.5l.1.1a1.8 1.8 0 0 0 3-.9v-.2a1.8 1.8 0 1 1 3.6 0v.2a1.8 1.8 0 0 0 3 .9l.1-.1a1.8 1.8 0 1 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 .9 3h.2a1.8 1.8 0 1 1 0 3.6h-.2a1.8 1.8 0 0 0-.9 3Z" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    chart: (
      <>
        <path d="M4 19V5M4 19h17" />
        <path d="m7 15 4-4 3 2 6-7" />
      </>
    ),
    users: (
      <>
        <path d="M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-4A4.5 4.5 0 0 0 3 18.5V20" />
        <circle cx="9.5" cy="7.5" r="4" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    x: <path d="m6 6 12 12M18 6 6 18" />,
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function UserProfile({ name, role }: { name: string; role: string }) {
  const initials = name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-semibold leading-5 text-ink">{name}</p>
        <p className="text-xs leading-4 text-slate-500">{role}</p>
      </div>
      <div
        aria-label={`${name} profile`}
        role="img"
        className="grid h-10 w-10 place-items-center rounded-full bg-orange-100 text-sm font-bold text-orange-800 ring-2 ring-white"
      >
        {initials}
      </div>
      <span aria-hidden="true" className="hidden text-xs text-slate-400 sm:block">▾</span>
    </div>
  );
}

function Header({ name, role }: { name: string; role: string }) {
  return (
    <header className="flex min-h-[76px] items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-9">
      <div>
        <p className="text-xs font-medium text-slate-400">Pages / Dashboard</p>
        <h1 id="page-title" className="mt-1 text-xl font-bold tracking-tight text-ink sm:text-2xl">
          Dashboard
        </h1>
      </div>
      <div className="flex items-center gap-4 sm:gap-6">
        <button
          type="button"
          aria-label="Notifications, 3 unread"
          className="relative grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <Icon name="bell" />
          <span className="absolute right-[9px] top-[8px] h-2 w-2 rounded-full border-2 border-white bg-red-500" />
        </button>
        <span className="h-8 w-px bg-slate-200" aria-hidden="true" />
        <UserProfile name={name} role={role} />
      </div>
    </header>
  );
}

const metricIcons: Record<DashboardMetric["tone"], IconName> = {
  green: "users",
  blue: "check",
  red: "x",
  amber: "clock",
};

const metricIconStyles: Record<DashboardMetric["tone"], string> = {
  green: "bg-emerald-50 text-emerald-700",
  blue: "bg-blue-50 text-blue-700",
  red: "bg-rose-50 text-rose-700",
  amber: "bg-amber-50 text-amber-700",
};

function MetricCard({ metric }: { metric: DashboardMetric }) {
  return (
    <article className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{metric.label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-ink">{metric.value}</p>
        </div>
        <span className={`grid h-11 w-11 place-items-center rounded-xl ${metricIconStyles[metric.tone]}`}>
          <Icon name={metricIcons[metric.tone]} className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-500">{metric.detail}</p>
      <p className={`mt-2 text-xs font-medium ${metric.tone === "red" ? "text-rose-600" : metric.tone === "amber" ? "text-amber-700" : "text-emerald-700"}`}>
        {metric.change}
      </p>
    </article>
  );
}

function QuickActions() {
  const actions: { label: string; description: string; icon: IconName; href: string; primary?: boolean }[] = [
    {
      label: "Add Employee",
      description: "Add a new team member",
      icon: "plus",
      href: "/employees",
      primary: true,
    },
    {
      label: "Record Attendance",
      description: "Log an attendance entry",
      icon: "clock",
      href: "/attendance",
    },
    {
      label: "View Reports",
      description: "Explore attendance insights",
      icon: "chart",
      href: "/reports",
    },
  ];

  return (
    <section aria-labelledby="quick-actions-heading">
      <h2 id="quick-actions-heading" className="text-base font-bold text-ink">Quick actions</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={`group flex items-center gap-3 rounded-xl border p-4 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
              action.primary
                ? "border-brand bg-brand text-white hover:bg-emerald-800"
                : "border-slate-200 bg-white text-ink shadow-card hover:border-emerald-200 hover:bg-emerald-50/40"
            }`}
          >
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${
              action.primary ? "bg-white/15 text-white" : "bg-emerald-50 text-brand"
            }`}>
              <Icon name={action.icon} />
            </span>
            <span>
              <span className="block text-sm font-semibold">{action.label}</span>
              <span className={`mt-1 block text-xs ${action.primary ? "text-emerald-100" : "text-slate-500"}`}>
                {action.description}
              </span>
            </span>
            <span aria-hidden="true" className={`ml-auto text-lg transition-transform group-hover:translate-x-0.5 ${action.primary ? "text-white/70" : "text-slate-400"}`}>
              →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: AttendanceRow["status"] }) {
  const styles: Record<AttendanceRow["status"], string> = {
    Present: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
    Late: "bg-amber-50 text-amber-700 ring-amber-600/10",
    Absent: "bg-rose-50 text-rose-700 ring-rose-600/10",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}>
      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${status === "Present" ? "bg-emerald-500" : status === "Late" ? "bg-amber-500" : "bg-rose-500"}`} />
      {status}
    </span>
  );
}

function AttendanceTable({ records }: { records: AttendanceRow[] }) {
  return (
    <section aria-labelledby="attendance-heading" className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
        <div>
          <h2 id="attendance-heading" className="text-base font-bold text-ink">Recent attendance</h2>
          <p className="mt-1 text-xs text-slate-500">Today&apos;s latest employee check-ins</p>
        </div>
        <Link href="/attendance" className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:text-emerald-800">
          View all <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead className="bg-slate-50/80">
            <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th scope="col" className="px-5 py-3.5 sm:px-6">Employee Name</th>
              <th scope="col" className="px-4 py-3.5">Employee ID</th>
              <th scope="col" className="px-4 py-3.5">Department</th>
              <th scope="col" className="px-4 py-3.5">Check In</th>
              <th scope="col" className="px-4 py-3.5">Check Out</th>
              <th scope="col" className="px-4 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((record) => (
              <tr key={`${record.employeeId}-${record.checkIn}`} className="transition-colors hover:bg-slate-50/70">
                <td className="whitespace-nowrap px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <span className={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold ${record.avatarColor}`}>
                      {record.initials}
                    </span>
                    <span className="text-sm font-semibold text-ink">{record.employeeName}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">{record.employeeId}</td>
                <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{record.department}</td>
                <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-slate-700">{record.checkIn}</td>
                <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">{record.checkOut}</td>
                <td className="whitespace-nowrap px-4 py-4"><StatusBadge status={record.status} /></td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                  No attendance has been recorded today.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5 sm:px-6">
        <p className="text-xs text-slate-500">Showing <span className="font-semibold text-slate-700">{records.length}</span> recent records</p>
        <Link href="/attendance" className="text-xs font-semibold text-brand hover:underline">See attendance log</Link>
      </div>
    </section>
  );
}

function formatClock(value: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function dashboardStatus(status: AttendanceStatus): AttendanceRow["status"] {
  switch (status) {
    case AttendanceStatus.PRESENT:
      return "Present";
    case AttendanceStatus.LATE:
      return "Late";
    case AttendanceStatus.ABSENT:
      return "Absent";
  }
}

function DashboardError() {
  return (
    <div role="alert" className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
      Dashboard data is temporarily unavailable. Check the database connection and reload this page.
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  let userName = session.user.name ?? "User";
  let roleLabel = "User";
  let metrics: DashboardMetric[] = [];
  let recentRecords: AttendanceRow[] = [];
  let loadFailed = false;
  let dateLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Addis_Ababa",
    dateStyle: "full",
  }).format(new Date());

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, role: true, employeeId: true },
    });
    if (!user) redirect("/login");
    userName = user.name;
    roleLabel = user.role;
    const systemSettings = await prisma.systemSettings.findUnique({
      where: { id: "singleton" },
      select: { timezone: true },
    });
    const timezone = systemSettings?.timezone ?? "Africa/Addis_Ababa";
    dateLabel = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      dateStyle: "full",
    }).format(new Date());

    if (user.role === UserRole.EMPLOYEE) {
      if (!user.employeeId) redirect("/login");
      const employee = await prisma.employee.findUnique({
        where: { id: user.employeeId },
        select: { employeeCode: true },
      });
      if (!employee) redirect("/login");
      redirect(`/employees/${encodeURIComponent(employee.employeeCode)}`);
    }
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.HR) redirect("/login");

    const today = dateInTimezone(new Date(), timezone);
    const todayDate = new Date(`${today}T00:00:00.000Z`);
    const [totalEmployees, groupedAttendance, todayRecords] = await Promise.all([
      prisma.employee.count(),
      prisma.attendance.groupBy({
        by: ["status"],
        where: { attendanceDate: todayDate },
        _count: { _all: true },
      }),
      prisma.attendance.findMany({
        where: { attendanceDate: todayDate },
        orderBy: { checkIn: "desc" },
        take: 5,
        include: {
          employee: {
            select: {
              employeeCode: true,
              firstName: true,
              lastName: true,
              department: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    const counts: Record<AttendanceStatus, number> = {
      PRESENT: 0,
      LATE: 0,
      ABSENT: 0,
    };
    for (const row of groupedAttendance) counts[row.status] = row._count._all;
    const percent = (count: number) => totalEmployees ? `${Math.round((count / totalEmployees) * 100)}% of employees` : "No employees yet";

    metrics = [
      { label: "Total Employees", value: String(totalEmployees), detail: "Across all departments", change: "Current workforce", tone: "green" },
      { label: "Present Today", value: String(counts.PRESENT), detail: percent(counts.PRESENT), change: "Recorded today", tone: "blue" },
      { label: "Absent Today", value: String(counts.ABSENT), detail: percent(counts.ABSENT), change: "Recorded today", tone: "red" },
      { label: "Late Today", value: String(counts.LATE), detail: percent(counts.LATE), change: "Recorded today", tone: "amber" },
    ];
    recentRecords = todayRecords.map((record) => {
      const employeeName = `${record.employee.firstName} ${record.employee.lastName}`;
      return {
        employeeName,
        employeeId: record.employee.employeeCode,
        department: record.employee.department.name,
        checkIn: formatClock(record.checkIn, timezone),
        checkOut: record.checkOut ? formatClock(record.checkOut, timezone) : "—",
        status: dashboardStatus(record.status),
        initials: employeeName.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase(),
        avatarColor: "bg-emerald-100 text-emerald-800",
      };
    });
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    const errorName = error instanceof Error ? error.name : "UnknownError";
    const errorCode =
      error && typeof error === "object" && "code" in error && typeof error.code === "string"
        ? error.code
        : undefined;
    console.warn("Dashboard data is temporarily unavailable.", { errorName, errorCode });
    loadFailed = true;
  }

  return (
    <div id="dashboard" className="min-h-screen lg:pl-[260px]">
      <Sidebar activePage="Dashboard" />
      <div className="min-h-screen">
        <Header name={userName} role={roleLabel} />
        <main aria-labelledby="page-title" className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 sm:py-8 lg:px-9">
          {loadFailed && <DashboardError />}
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Here&apos;s what&apos;s happening with your team today.</p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Icon name="calendar" className="h-3.5 w-3.5" />
                {dateLabel}
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Office is open
            </span>
          </div>

          <section aria-label="Today's attendance overview" className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
          </section>

          <div className="mt-8">
            <QuickActions />
          </div>

          <div className="mt-8">
            <AttendanceTable records={recentRecords} />
          </div>

          <footer className="py-7 text-center text-xs text-slate-400">
            © 2026 Super Double T General Trading PLC. All rights reserved.
          </footer>
        </main>
      </div>
    </div>
  );
}
