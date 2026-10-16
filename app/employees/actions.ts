"use server";

import { EmploymentStatus, Prisma, UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Employee, EmploymentStatus as UiEmploymentStatus } from "@/lib/employees-mock-data";

type EmployeeInput = Omit<Employee, "id"> & { id: string };
type ActionResult = { ok: true } | { ok: false; message: string };
type ValidatedInput = {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phoneNumber: string;
  location: string | null;
  jobTitle: string;
  employmentStatus: EmploymentStatus;
  hireDate: Date | null;
  departmentId: string;
};

const statusMap: Record<UiEmploymentStatus, EmploymentStatus> = {
  Active: EmploymentStatus.ACTIVE,
  "On Leave": EmploymentStatus.ON_LEAVE,
  Inactive: EmploymentStatus.INACTIVE,
};

async function requireRole(allowed: UserRole[]) {
  const session = await getServerSession(authOptions);
  if (!session || !allowed.includes(session.user.role)) return null;
  return session;
}

function validateInput(input: EmployeeInput): ValidatedInput | null {
  if (!input || typeof input !== "object") return null;
  if (
    typeof input.id !== "string" ||
    typeof input.fullName !== "string" ||
    typeof input.jobTitle !== "string" ||
    typeof input.phoneNumber !== "string" ||
    typeof input.location !== "string" ||
    typeof input.email !== "string" ||
    typeof input.departmentId !== "string" ||
    typeof input.employmentStatus !== "string" ||
    typeof input.startDate !== "string"
  ) return null;
  const employeeCode = input.id?.trim().toUpperCase();
  const fullName = input.fullName?.trim().replace(/\s+/g, " ");
  const jobTitle = input.jobTitle?.trim();
  const phoneNumber = input.phoneNumber?.trim();
  const location = input.location.trim();
  const email = input.email?.trim().toLowerCase() || null;
  const departmentId = input.departmentId?.trim();

  if (
    !employeeCode || !/^[A-Z0-9-]{3,20}$/.test(employeeCode) ||
    !fullName || fullName.length > 100 ||
    !jobTitle || jobTitle.length > 100 ||
    !phoneNumber || phoneNumber.length > 20 ||
    !/^\+?[0-9][0-9\s()-]{6,19}$/.test(phoneNumber) ||
    location.length > 80 ||
    !departmentId || departmentId.length > 100 ||
    (email && (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) ||
    !Object.prototype.hasOwnProperty.call(statusMap, input.employmentStatus)
  ) return null;

  const nameParts = fullName.split(" ");
  if (nameParts.length < 2) return null;

  let hireDate: Date | null = null;
  if (input.startDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startDate)) return null;
    hireDate = new Date(`${input.startDate}T00:00:00.000Z`);
    if (Number.isNaN(hireDate.getTime()) || hireDate.toISOString().slice(0, 10) !== input.startDate) return null;
  }

  return {
    employeeCode,
    firstName: nameParts[0],
    lastName: nameParts.slice(1).join(" "),
    email,
    phoneNumber,
    location: location || null,
    jobTitle,
    employmentStatus: statusMap[input.employmentStatus],
    hireDate,
    departmentId,
  };
}

function safeDatabaseError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return "An employee with this ID or email already exists.";
    if (error.code === "P2003") return "The selected department is unavailable.";
    if (error.code === "P2025") return "This employee no longer exists.";
  }
  return "Unable to save the employee. Check the details and try again.";
}

export async function createEmployee(input: EmployeeInput): Promise<ActionResult> {
  if (!(await requireRole(["ADMIN", "HR"]))) {
    return { ok: false, message: "You are not authorized to create employees." };
  }
  const data = validateInput(input);
  if (!data) return { ok: false, message: "Enter valid employee details." };

  try {
    await prisma.employee.create({ data });
    revalidatePath("/employees");
    revalidatePath("/departments");
    return { ok: true };
  } catch (error) {
    console.error("Employee create failed:", error);
    return { ok: false, message: safeDatabaseError(error) };
  }
}

export async function updateEmployee(
  currentCode: string,
  input: EmployeeInput,
): Promise<ActionResult> {
  if (!(await requireRole(["ADMIN", "HR"]))) {
    return { ok: false, message: "You are not authorized to update employees." };
  }
  if (!/^[A-Za-z0-9-]{3,20}$/.test(currentCode)) {
    return { ok: false, message: "Invalid employee ID." };
  }
  const data = validateInput(input);
  if (!data || data.employeeCode !== currentCode.toUpperCase()) {
    return { ok: false, message: "Enter valid employee details." };
  }

  try {
    await prisma.employee.update({
      where: { employeeCode: currentCode.toUpperCase() },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        location: data.location,
        jobTitle: data.jobTitle,
        employmentStatus: data.employmentStatus,
        hireDate: data.hireDate,
        departmentId: data.departmentId,
      },
    });
    revalidatePath("/employees");
    revalidatePath("/departments");
    revalidatePath(`/employees/${encodeURIComponent(currentCode)}`);
    return { ok: true };
  } catch (error) {
    console.error("Employee update failed:", error);
    return { ok: false, message: safeDatabaseError(error) };
  }
}

export async function deleteEmployee(employeeCode: string): Promise<ActionResult> {
  if (!(await requireRole(["ADMIN"]))) {
    return { ok: false, message: "Only an administrator can delete employees." };
  }
  if (!/^[A-Za-z0-9-]{3,20}$/.test(employeeCode)) {
    return { ok: false, message: "Invalid employee ID." };
  }

  try {
    const attendance = await prisma.attendance.count({
      where: { employee: { employeeCode: employeeCode.toUpperCase() } },
    });
    if (attendance > 0) {
      return { ok: false, message: "This employee has attendance history and cannot be deleted." };
    }
    await prisma.employee.delete({ where: { employeeCode: employeeCode.toUpperCase() } });
    revalidatePath("/employees");
    revalidatePath("/departments");
    return { ok: true };
  } catch (error) {
    console.error("Employee delete failed:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { ok: false, message: "This employee no longer exists." };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return { ok: false, message: "This employee has related records and cannot be deleted." };
    }
    return { ok: false, message: "Unable to delete this employee. Please try again." };
  }
}
