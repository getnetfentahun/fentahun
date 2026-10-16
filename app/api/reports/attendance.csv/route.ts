import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveReport } from "@/lib/report-data";
import { canManageReports, escapeCsvCell } from "@/lib/report-utils";

function param(params: URLSearchParams, name: string) {
  const values = params.getAll(name);
  return values.length === 1 ? values[0] : undefined;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, employeeId: true },
  });
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!canManageReports(user.role) && user.role !== "EMPLOYEE") {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const params = new URL(request.url).searchParams;
  if (["from", "to", "employeeId", "departmentId"].some((name) => params.getAll(name).length > 1)) {
    return NextResponse.json({ error: "A report filter was supplied more than once." }, { status: 400 });
  }
  const report = await resolveReport(
    { role: user.role, employeeId: user.employeeId },
    {
      from: param(params, "from"),
      to: param(params, "to"),
      employeeId: param(params, "employeeId"),
      departmentId: param(params, "departmentId"),
    },
  );
  if (report.error) return NextResponse.json({ error: report.error }, { status: 400 });

  try {
    const records = await prisma.attendance.findMany({
      where: report.where,
      orderBy: [{ attendanceDate: "asc" }, { employee: { lastName: "asc" } }],
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
    });

    const header = ["Date", "Employee Code", "Employee Name", "Department", "Status", "Check In", "Check Out"];
    const rows = records.map((record) => [
      record.attendanceDate.toISOString().slice(0, 10),
      record.employee.employeeCode,
      `${record.employee.firstName} ${record.employee.lastName}`,
      record.employee.department.name,
      record.status,
      record.checkIn.toISOString(),
      record.checkOut?.toISOString() ?? "",
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map(escapeCsvCell).join(","))
      .join("\r\n");

    return new NextResponse(`\uFEFF${csv}`, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="attendance-report-${report.filters.from}-to-${report.filters.to}.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error(
      "Attendance CSV export failed:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json({ error: "Report export failed. Please try again." }, { status: 500 });
  }
}
