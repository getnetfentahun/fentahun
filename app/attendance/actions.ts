"use server";

import { AttendanceStatus, Prisma, UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type AttendanceInput = {
  employeeId: string;
  date: string;
  status: AttendanceStatus;
};

type ActionResult = { ok: true } | { ok: false; message: string };

async function getManager() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  return user && (user.role === UserRole.ADMIN || user.role === UserRole.HR)
    ? user
    : null;
}

function validateInput(value: unknown): AttendanceInput | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  if (
    typeof input.employeeId !== "string" ||
    !input.employeeId.trim() ||
    input.employeeId.length > 100 ||
    typeof input.date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(input.date) ||
    typeof input.status !== "string" ||
    !Object.values(AttendanceStatus).includes(input.status as AttendanceStatus)
  ) return null;

  const date = new Date(`${input.date}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== input.date) return null;

  return {
    employeeId: input.employeeId.trim(),
    date: input.date,
    status: input.status as AttendanceStatus,
  };
}

function safeErrorMessage(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return "Attendance is already recorded for this employee on that date.";
    if (error.code === "P2003") return "Choose an existing employee.";
    if (error.code === "P2025") return "This attendance record no longer exists.";
  }
  return "Unable to save the attendance record. Please try again.";
}

function logDatabaseError(error: unknown, operation: string) {
  const detail =
    error instanceof Prisma.PrismaClientKnownRequestError
      ? error.code
      : error instanceof Error
        ? error.name
        : "UnknownError";
  console.error(`Attendance ${operation} failed (${detail}).`);
}

export async function createAttendance(value: unknown): Promise<ActionResult> {
  if (!(await getManager())) return { ok: false, message: "You are not authorized to manage attendance." };
  const input = validateInput(value);
  if (!input) return { ok: false, message: "Enter a valid employee, date, and attendance status." };

  try {
    await prisma.attendance.create({
      data: {
        employeeId: input.employeeId,
        attendanceDate: new Date(`${input.date}T00:00:00.000Z`),
        status: input.status,
      },
    });
    revalidatePath("/attendance");
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    logDatabaseError(error, "create");
    return { ok: false, message: safeErrorMessage(error) };
  }
}

export async function updateAttendance(id: string, value: unknown): Promise<ActionResult> {
  if (!(await getManager())) return { ok: false, message: "You are not authorized to manage attendance." };
  if (typeof id !== "string" || !id || id.length > 100) {
    return { ok: false, message: "Invalid attendance record." };
  }
  const input = validateInput(value);
  if (!input) return { ok: false, message: "Enter a valid employee, date, and attendance status." };

  try {
    await prisma.attendance.update({
      where: { id },
      data: {
        employeeId: input.employeeId,
        attendanceDate: new Date(`${input.date}T00:00:00.000Z`),
        status: input.status,
      },
    });
    revalidatePath("/attendance");
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    logDatabaseError(error, "update");
    return { ok: false, message: safeErrorMessage(error) };
  }
}

export async function deleteAttendance(id: string): Promise<ActionResult> {
  if (!(await getManager())) return { ok: false, message: "You are not authorized to manage attendance." };
  if (typeof id !== "string" || !id || id.length > 100) {
    return { ok: false, message: "Invalid attendance record." };
  }
  try {
    await prisma.attendance.delete({ where: { id } });
    revalidatePath("/attendance");
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    logDatabaseError(error, "delete");
    return { ok: false, message: safeErrorMessage(error) };
  }
}
