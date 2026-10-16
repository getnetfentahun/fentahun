import type { Prisma } from "@prisma/client";
import {
  dateInTimezone,
  authorizedEmployeeFilter,
  canManageReports,
  isValidDateOnly,
  subtractDateDays,
  validateReportFilters,
  type ReportFilters,
} from "@/lib/report-utils";
import { prisma } from "@/lib/prisma";

export type ReportAccess = {
  role: string;
  employeeId: string | null;
};

export type ResolvedReport = {
  filters: ReportFilters;
  error: string | null;
  where: Prisma.AttendanceWhereInput;
  canManage: boolean;
};

export async function resolveReport(
  access: ReportAccess,
  search: { from?: string; to?: string; employeeId?: string; departmentId?: string },
): Promise<ResolvedReport> {
  const settings = await prisma.systemSettings.findUnique({
    where: { id: "singleton" },
    select: { timezone: true, reportDefaultDays: true },
  });
  const timezone = settings?.timezone ?? "Africa/Addis_Ababa";
  const today = dateInTimezone(new Date(), timezone);
  const noDateFilter = search.from === undefined && search.to === undefined;
  const defaultDays = settings?.reportDefaultDays ?? 30;
  const from = noDateFilter ? subtractDateDays(today, defaultDays - 1) : search.from ?? "";
  const to = noDateFilter ? today : search.to ?? "";
  const canManage = canManageReports(access.role);
  const filters: ReportFilters = {
    from,
    to,
    employeeId: authorizedEmployeeFilter(access.role, access.employeeId, search.employeeId ?? ""),
    departmentId: canManage ? (search.departmentId ?? "") : "",
  };

  let error = validateReportFilters(filters);
  if (!canManage && !access.employeeId) {
    error = "Your account is not linked to an employee profile.";
  }

  const where: Prisma.AttendanceWhereInput = {
    attendanceDate: {
      gte: isValidDateOnly(from) ? new Date(`${from}T00:00:00.000Z`) : undefined,
      lte: isValidDateOnly(to) ? new Date(`${to}T00:00:00.000Z`) : undefined,
    },
    ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
    ...(filters.departmentId ? { employee: { departmentId: filters.departmentId } } : {}),
  };

  return { filters, error, where, canManage };
}
