import { EmploymentStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import EmployeesManagement from "@/components/employees-management";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Employee, EmploymentStatus as EmployeeStatus } from "@/lib/employees-mock-data";

export default async function EmployeesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  if (session.user.role === "EMPLOYEE") {
    if (!session.user.employeeId) notFound();
    const ownEmployee = await prisma.employee.findUnique({
      where: { id: session.user.employeeId },
      select: { employeeCode: true },
    });
    if (!ownEmployee) notFound();
    redirect(`/employees/${encodeURIComponent(ownEmployee.employeeCode)}`);
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "HR") notFound();

  const [records, departments] = await Promise.all([
    prisma.employee.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.department.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, status: true },
    }),
  ]);

  const employees: Employee[] = records.map((record) => ({
    id: record.employeeCode,
    fullName: `${record.firstName} ${record.lastName}`,
    departmentId: record.departmentId,
    jobTitle: record.jobTitle,
    phoneNumber: record.phoneNumber ?? "",
    location: record.location ?? "",
    email: record.email ?? "",
    employmentStatus: statusFromDatabase(record.employmentStatus),
    startDate: record.hireDate?.toISOString().slice(0, 10) ?? "",
  }));

  return (
    <div className="min-h-screen lg:pl-[260px]">
      <Sidebar activePage="Employees" />
      <EmployeesManagement
        employees={employees}
        departments={departments.map((department) => ({
          ...department,
          status: department.status === "ACTIVE" ? "Active" : "Inactive",
        }))}
        canDelete={session.user.role === "ADMIN"}
      />
    </div>
  );
}

function statusFromDatabase(status: EmploymentStatus): EmployeeStatus {
  switch (status) {
    case EmploymentStatus.ACTIVE:
      return "Active";
    case EmploymentStatus.ON_LEAVE:
      return "On Leave";
    case EmploymentStatus.INACTIVE:
      return "Inactive";
  }
}
