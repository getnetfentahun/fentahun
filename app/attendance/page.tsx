import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import AttendanceManagement from "@/components/attendance-management";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AttendancePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, employeeId: true },
  });
  if (!user) redirect("/login");
  if (user.role === "EMPLOYEE" && !user.employeeId) notFound();
  if (user.role !== "ADMIN" && user.role !== "HR" && user.role !== "EMPLOYEE") notFound();

  const canManage = user.role === "ADMIN" || user.role === "HR";
  const [attendance, employeeRecords] = await Promise.all([
    prisma.attendance.findMany({
      where: canManage ? undefined : { employeeId: user.employeeId! },
      orderBy: [{ attendanceDate: "desc" }, { createdAt: "desc" }],
      take: 500,
      include: {
        employee: {
          select: { id: true, employeeCode: true, firstName: true, lastName: true },
        },
      },
    }),
    canManage
      ? prisma.employee.findMany({
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
          select: { id: true, employeeCode: true, firstName: true, lastName: true },
        })
      : prisma.employee.findMany({
          where: { id: user.employeeId! },
          select: { id: true, employeeCode: true, firstName: true, lastName: true },
        }),
  ]);

  const records = attendance.map((record) => ({
    id: record.id,
    employeeId: record.employeeId,
    employeeCode: record.employee.employeeCode,
    employeeName: `${record.employee.firstName} ${record.employee.lastName}`,
    date: record.attendanceDate.toISOString().slice(0, 10),
    status: record.status,
  }));
  const employees = employeeRecords.map((employee) => ({
    id: employee.id,
    employeeCode: employee.employeeCode,
    fullName: `${employee.firstName} ${employee.lastName}`,
  }));

  return (
    <div className="min-h-screen lg:pl-[260px]">
      <Sidebar activePage="Attendance" />
      <header className="flex min-h-[76px] items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-9">
        <div>
          <p className="text-xs font-medium text-slate-400">Pages / Attendance</p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-ink sm:text-2xl">Attendance</h1>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-ink">{session.user.name ?? "User"}</p>
          <p className="text-xs text-slate-500">{user.role}</p>
        </div>
      </header>
      <AttendanceManagement
        key={records.map((record) => record.id + record.date + record.status).join("|")}
        initialRecords={records}
        employees={employees}
        canManage={canManage}
      />
    </div>
  );
}
