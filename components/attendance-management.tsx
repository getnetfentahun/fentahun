"use client";

import { AttendanceStatus } from "@prisma/client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createAttendance,
  deleteAttendance,
  updateAttendance,
} from "@/app/attendance/actions";

type EmployeeOption = { id: string; employeeCode: string; fullName: string };
type AttendanceRow = {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  date: string;
  status: AttendanceStatus;
};

const statusLabels: Record<AttendanceStatus, string> = {
  PRESENT: "Present",
  LATE: "Late",
  ABSENT: "Absent",
};

const statusStyles: Record<AttendanceStatus, string> = {
  PRESENT: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  LATE: "bg-amber-50 text-amber-700 ring-amber-600/10",
  ABSENT: "bg-rose-50 text-rose-700 ring-rose-600/10",
};

function localDateValue() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export default function AttendanceManagement({
  initialRecords,
  employees,
  canManage,
}: {
  initialRecords: AttendanceRow[];
  employees: EmployeeOption[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [records, setRecords] = useState(initialRecords);
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");
  const [date, setDate] = useState(localDateValue);
  const [status, setStatus] = useState<AttendanceStatus>(AttendanceStatus.PRESENT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => setRecords(initialRecords), [initialRecords]);

  const filteredRecords = useMemo(
    () => records.filter((record) =>
      (employeeFilter === "all" || record.employeeId === employeeFilter) &&
      (!dateFilter || record.date === dateFilter) &&
      (statusFilter === "all" || record.status === statusFilter),
    ),
    [records, employeeFilter, dateFilter, statusFilter],
  );

  function beginEdit(record: AttendanceRow) {
    setEditingId(record.id);
    setEmployeeId(record.employeeId);
    setDate(record.date);
    setStatus(record.status);
    setMessage(null);
  }

  function resetForm() {
    setEditingId(null);
    setEmployeeId(employees[0]?.id ?? "");
    setDate(localDateValue());
    setStatus(AttendanceStatus.PRESENT);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSaving(true);
    try {
      const result = editingId
        ? await updateAttendance(editingId, { employeeId, date, status })
        : await createAttendance({ employeeId, date, status });
      if (!result.ok) {
        setMessage({ kind: "error", text: result.message });
        return;
      }
      setMessage({ kind: "success", text: editingId ? "Attendance updated." : "Attendance recorded." });
      resetForm();
      router.refresh();
    } catch {
      setMessage({ kind: "error", text: "Unable to save attendance. Please try again." });
    } finally {
      setIsSaving(false);
    }
  }

  async function remove(record: AttendanceRow) {
    if (!window.confirm(`Delete attendance for ${record.employeeName} on ${record.date}?`)) return;
    setMessage(null);
    try {
      const result = await deleteAttendance(record.id);
      if (!result.ok) {
        setMessage({ kind: "error", text: result.message });
        return;
      }
      setRecords((current) => current.filter((item) => item.id !== record.id));
      setMessage({ kind: "success", text: "Attendance record deleted." });
      router.refresh();
    } catch {
      setMessage({ kind: "error", text: "Unable to delete attendance. Please try again." });
    }
  }

  return (
    <main aria-labelledby="attendance-title" className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 sm:py-8 lg:px-9">
      <div className="mb-6">
        <h1 id="attendance-title" className="text-2xl font-bold tracking-tight text-ink">Attendance</h1>
        <p className="mt-1 text-sm text-slate-500">
          {canManage ? "Record and manage employee attendance." : "Your attendance records."}
        </p>
      </div>

      {message && (
        <p role={message.kind === "error" ? "alert" : "status"}
          className={`mb-5 rounded-lg px-4 py-3 text-sm ${message.kind === "error" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-800"}`}>
          {message.text}
        </p>
      )}

      {canManage && (
        <section aria-labelledby="attendance-form-title" className="mb-6 rounded-xl border border-slate-200/80 bg-white p-5 shadow-card sm:p-6">
          <h2 id="attendance-form-title" className="text-base font-bold text-ink">
            {editingId ? "Edit attendance" : "Record attendance"}
          </h2>
          {employees.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">Add an employee before recording attendance.</p>
          ) : (
            <form onSubmit={save} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
              <div>
                <label htmlFor="attendance-employee" className="mb-1.5 block text-sm font-medium text-slate-700">Employee</label>
                <select id="attendance-employee" required value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-emerald-100">
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.employeeCode} — {employee.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="attendance-date" className="mb-1.5 block text-sm font-medium text-slate-700">Date</label>
                <input id="attendance-date" type="date" required value={date} onChange={(event) => setDate(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-emerald-100" />
              </div>
              <div>
                <label htmlFor="attendance-status" className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
                <select id="attendance-status" required value={status} onChange={(event) => setStatus(event.target.value as AttendanceStatus)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-emerald-100">
                  {Object.values(AttendanceStatus).map((item) => (
                    <option key={item} value={item}>{statusLabels[item]}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={isSaving}
                  className="flex-1 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-60">
                  {isSaving ? "Saving…" : editingId ? "Save changes" : "Record attendance"}
                </button>
                {editingId && (
                  <button type="button" onClick={resetForm}
                    className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
        </section>
      )}

      <section aria-labelledby="attendance-list-title" className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="attendance-list-title" className="text-base font-bold text-ink">Attendance records</h2>
            <p className="mt-1 text-xs text-slate-500">Filter attendance by employee, date, or status.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[620px]">
            {canManage && (
              <div>
                <label htmlFor="attendance-employee-filter" className="sr-only">Filter by employee</label>
                <select id="attendance-employee-filter" value={employeeFilter} onChange={(event) => setEmployeeFilter(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-ink">
                  <option value="all">All employees</option>
                  {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.employeeCode} — {employee.fullName}</option>)}
                </select>
              </div>
            )}
            <div>
              <label htmlFor="attendance-date-filter" className="sr-only">Filter by date</label>
              <input id="attendance-date-filter" type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-ink" />
            </div>
            <div>
              <label htmlFor="attendance-status-filter" className="sr-only">Filter by status</label>
              <select id="attendance-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-ink">
                <option value="all">All statuses</option>
                {Object.values(AttendanceStatus).map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-slate-50/80">
              <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th scope="col" className="px-5 py-3.5 sm:px-6">Employee code</th>
                <th scope="col" className="px-4 py-3.5">Employee name</th>
                <th scope="col" className="px-4 py-3.5">Date</th>
                <th scope="col" className="px-4 py-3.5">Status</th>
                {canManage && <th scope="col" className="px-4 py-3.5">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/70">
                  <td className="whitespace-nowrap px-5 py-4 text-xs font-semibold tracking-wide text-brand sm:px-6">{record.employeeCode}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-ink">{record.employeeName}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{record.date}</td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[record.status]}`}>
                      {statusLabels[record.status]}
                    </span>
                  </td>
                  {canManage && (
                    <td className="whitespace-nowrap px-4 py-4">
                      <button type="button" onClick={() => beginEdit(record)}
                        className="rounded-md px-2.5 py-2 text-xs font-semibold text-slate-600 hover:bg-emerald-50 hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                        Edit
                      </button>
                      <button type="button" onClick={() => void remove(record)}
                        className="rounded-md px-2.5 py-2 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500">
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 5 : 4} className="px-6 py-12 text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      {records.length === 0 ? "No attendance records yet" : "No matching records"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {records.length === 0 ? "Record attendance to see it listed here." : "Try changing your filters."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-5 py-3.5 text-xs text-slate-500 sm:px-6">
          Showing {filteredRecords.length} of {records.length} records
        </div>
      </section>
    </main>
  );
}
