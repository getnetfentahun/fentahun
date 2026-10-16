export type ReportFilters = {
  from: string;
  to: string;
  employeeId: string;
  departmentId: string;
};

export function canManageReports(role: string): boolean {
  return role === "ADMIN" || role === "HR";
}

export function canEditSystemSettings(role: string): boolean {
  return role === "ADMIN";
}

export function authorizedEmployeeFilter(
  role: string,
  employeeId: string | null,
  requestedEmployeeId: string,
): string {
  return canManageReports(role) ? requestedEmployeeId : (employeeId ?? "");
}

export function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function validateReportFilters(
  filters: ReportFilters,
): string | null {
  if (!isValidDateOnly(filters.from) || !isValidDateOnly(filters.to)) {
    return "Choose a valid start date and end date.";
  }
  if (filters.from > filters.to) return "The start date must be on or before the end date.";
  if (filters.employeeId.length > 100 || filters.departmentId.length > 100) {
    return "The selected report filter is invalid.";
  }
  return null;
}

export function escapeCsvCell(value: string): string {
  const safeValue = /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replace(/"/g, '""')}"`;
}

export function dateInTimezone(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function subtractDateDays(date: string, days: number): string {
  const result = new Date(`${date}T00:00:00.000Z`);
  result.setUTCDate(result.getUTCDate() - days);
  return result.toISOString().slice(0, 10);
}
