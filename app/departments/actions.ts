"use server";

import { DepartmentStatus as PrismaDepartmentStatus, Prisma, UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Department } from "@/lib/departments-mock-data";

type DepartmentInput = Omit<Department, "id" | "employeeCount">;
type ActionResult = { ok: true } | { ok: false; message: string };

async function requireManager() {
  const session = await getServerSession(authOptions);
  const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.HR];
  if (!session || !allowedRoles.includes(session.user.role)) return null;
  return session;
}

function validateInput(input: DepartmentInput) {
  if (
    !input ||
    typeof input.name !== "string" ||
    typeof input.code !== "string" ||
    typeof input.head !== "string" ||
    typeof input.status !== "string"
  ) return null;

  const name = input.name.trim().replace(/\s+/g, " ");
  const code = input.code.trim().toUpperCase();
  const head = input.head.trim().replace(/\s+/g, " ");
  if (!name || name.length > 80 || !/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(code) || code.length < 2 || code.length > 10 ||
    !head || head.length > 80 || !["Active", "Inactive"].includes(input.status)) return null;

  return {
    name,
    code,
    head,
    status: input.status === "Active" ? PrismaDepartmentStatus.ACTIVE : PrismaDepartmentStatus.INACTIVE,
  };
}

function databaseError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return "A department with this name or code already exists.";
    if (error.code === "P2025") return "This department no longer exists.";
    if (error.code === "P2003") return "This department is assigned to employees and cannot be deleted.";
  }
  return "Unable to save the department. Please check the details and try again.";
}

export async function createDepartment(input: DepartmentInput): Promise<ActionResult> {
  if (!(await requireManager())) return { ok: false, message: "You are not authorized to manage departments." };
  const data = validateInput(input);
  if (!data) return { ok: false, message: "Enter valid department details." };
  try {
    await prisma.department.create({ data });
    revalidatePath("/departments");
    revalidatePath("/employees");
    return { ok: true };
  } catch (error) {
    console.error("Department create failed:", error);
    return { ok: false, message: databaseError(error) };
  }
}

export async function updateDepartment(id: string, input: DepartmentInput): Promise<ActionResult> {
  if (!(await requireManager())) return { ok: false, message: "You are not authorized to manage departments." };
  if (typeof id !== "string" || id.length > 100) return { ok: false, message: "Invalid department." };
  const data = validateInput(input);
  if (!data) return { ok: false, message: "Enter valid department details." };
  try {
    await prisma.department.update({ where: { id }, data });
    revalidatePath("/departments");
    revalidatePath("/employees");
    return { ok: true };
  } catch (error) {
    console.error("Department update failed:", error);
    return { ok: false, message: databaseError(error) };
  }
}

export async function deleteDepartment(id: string): Promise<ActionResult> {
  if (!(await requireManager())) return { ok: false, message: "You are not authorized to manage departments." };
  if (typeof id !== "string" || id.length > 100) return { ok: false, message: "Invalid department." };
  try {
    const employees = await prisma.employee.count({ where: { departmentId: id } });
    if (employees > 0) {
      return { ok: false, message: "This department has employees. Move them to another department before deleting it." };
    }
    await prisma.department.delete({ where: { id } });
    revalidatePath("/departments");
    revalidatePath("/employees");
    return { ok: true };
  } catch (error) {
    console.error("Department delete failed:", error);
    return { ok: false, message: databaseError(error) };
  }
}
