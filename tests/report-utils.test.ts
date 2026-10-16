import assert from "node:assert/strict";
import test from "node:test";
import {
  authorizedEmployeeFilter,
  canEditSystemSettings,
  canManageReports,
  dateInTimezone,
  escapeCsvCell,
  isValidDateOnly,
  subtractDateDays,
  validateReportFilters,
} from "../lib/report-utils.ts";

test("report and settings roles are enforced", () => {
  assert.equal(canManageReports("ADMIN"), true);
  assert.equal(canManageReports("HR"), true);
  assert.equal(canManageReports("EMPLOYEE"), false);
  assert.equal(canEditSystemSettings("ADMIN"), true);
  assert.equal(canEditSystemSettings("HR"), false);
  assert.equal(canEditSystemSettings("EMPLOYEE"), false);
});

test("employee report scope cannot be overridden by a requested employee id", () => {
  assert.equal(authorizedEmployeeFilter("EMPLOYEE", "employee-own", "employee-other"), "employee-own");
  assert.equal(authorizedEmployeeFilter("HR", null, "employee-other"), "employee-other");
});

test("validates date-only values including leap days", () => {
  assert.equal(isValidDateOnly("2024-02-29"), true);
  assert.equal(isValidDateOnly("2025-02-29"), false);
  assert.equal(isValidDateOnly("2025-13-01"), false);
});

test("rejects reversed report ranges and overlong IDs", () => {
  assert.match(validateReportFilters({
    from: "2025-02-02",
    to: "2025-02-01",
    employeeId: "",
    departmentId: "",
  }) ?? "", /on or before/);
  assert.match(validateReportFilters({
    from: "2025-02-01",
    to: "2025-02-02",
    employeeId: "x".repeat(101),
    departmentId: "",
  }) ?? "", /invalid/);
});

test("timezone and default report-window calculations use date-only values", () => {
  assert.equal(dateInTimezone(new Date("2025-01-01T22:30:00.000Z"), "Africa/Addis_Ababa"), "2025-01-02");
  assert.equal(subtractDateDays("2025-03-01", 1), "2025-02-28");
});

test("CSV fields are quoted and spreadsheet formulas are neutralized", () => {
  assert.equal(escapeCsvCell("Smith, Jane"), '"Smith, Jane"');
  assert.equal(escapeCsvCell('A "quoted" name'), '"A ""quoted"" name"');
  assert.equal(escapeCsvCell("=HYPERLINK(\"x\")"), "\"'=HYPERLINK(\"\"x\"\")\"");
  assert.equal(escapeCsvCell("  -cmd"), '"\'  -cmd"');
});
