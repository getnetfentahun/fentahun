import { DepartmentStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import DepartmentsManagement from "@/components/departments-management";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Department } from "@/lib/departments-mock-data";

export default async function DepartmentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "HR") notFound();

  const records = await prisma.department.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { employees: true } } },
  });

  const departments: Array<Department & { employeeCount: number }> = records.map((record) => ({
    id: record.id,
    name: record.name,
    code: record.code,
    head: record.head,
    employeeCount: record._count.employees,
    status: record.status === DepartmentStatus.ACTIVE ? "Active" : "Inactive",
  }));

  return (
    <div className="min-h-screen lg:pl-[260px]">
      <Sidebar activePage="Departments" />
      <DepartmentsManagement initialDepartments={departments} />
    </div>
  );
}
