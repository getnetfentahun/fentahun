"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createDepartment,
  deleteDepartment as deleteDepartmentAction,
  updateDepartment,
} from "@/app/departments/actions";
import {
  type Department,
  type DepartmentStatus,
} from "@/lib/departments-mock-data";

type DepartmentFormValues = Omit<Department, "id" | "employeeCount">;
type DepartmentRecord = Department & { employeeCount: number };

const emptyForm: DepartmentFormValues = {
  name: "",
  code: "",
  head: "",
  status: "Active",
};

function NotificationIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 5 4 4M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4Z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4h8v2m3 0-.9 14H5.9L5 6m4 4v6m6-6v6" />
    </svg>
  );
}

function DepartmentModal({
  department,
  departments,
  onClose,
  onSave,
}: {
  department: DepartmentRecord | null;
  departments: DepartmentRecord[];
  onClose: () => void;
  onSave: (values: DepartmentFormValues) => Promise<string | null>;
}) {
  const [values, setValues] = useState<DepartmentFormValues>(
    department
      ? {
          name: department.name,
          code: department.code,
          head: department.head,
          status: department.status,
        }
      : emptyForm,
  );
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = values.name.trim();
    const normalizedCode = values.code.trim().toUpperCase();
    const normalizedHead = values.head.trim();

    if (!normalizedName || !normalizedCode || !normalizedHead) {
      setFormError("Department name, code, and department head are required.");
      return;
    }

    const duplicate = departments.some(
      (item) =>
        item.id !== department?.id &&
        (item.name.toLocaleLowerCase() === normalizedName.toLocaleLowerCase() ||
          item.code.toLocaleLowerCase() === normalizedCode.toLocaleLowerCase()),
    );

    if (duplicate) {
      setFormError("A department with this name or code already exists.");
      return;
    }

    setFormError("");
    setIsSaving(true);
    try {
      const error = await onSave({
        ...values,
        name: normalizedName,
        code: normalizedCode,
        head: normalizedHead,
      });
      if (error) setFormError(error);
    } catch {
      setFormError("Unable to save the department right now. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="department-form-title"
        className="my-auto w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="department-form-title" className="text-lg font-bold text-ink">
              {department ? "Edit department" : "Add department"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Enter the department details below.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close department form"
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <span aria-hidden="true" className="text-xl leading-none">×</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="department-name" className="mb-1.5 block text-sm font-medium text-slate-700">
                Department name <span className="text-rose-600" aria-hidden="true">*</span>
              </label>
              <input
                id="department-name"
                name="name"
                required
                maxLength={80}
                autoFocus
                value={values.name}
                onChange={(event) => setValues({ ...values, name: event.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-emerald-100"
                placeholder="e.g. Customer Support"
              />
            </div>
            <div>
              <label htmlFor="department-code" className="mb-1.5 block text-sm font-medium text-slate-700">
                Department code <span className="text-rose-600" aria-hidden="true">*</span>
              </label>
              <input
                id="department-code"
                name="code"
                required
                minLength={2}
                maxLength={10}
                pattern="[A-Za-z0-9]+(-[A-Za-z0-9]+)*"
                title="Use 2–10 letters, numbers, or hyphens."
                value={values.code}
                onChange={(event) => setValues({ ...values, code: event.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm uppercase text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-emerald-100"
                placeholder="e.g. CUS"
              />
            </div>
            <div>
              <label htmlFor="department-head" className="mb-1.5 block text-sm font-medium text-slate-700">
                Department head <span className="text-rose-600" aria-hidden="true">*</span>
              </label>
              <input
                id="department-head"
                name="head"
                required
                maxLength={80}
                value={values.head}
                onChange={(event) => setValues({ ...values, head: event.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-emerald-100"
                placeholder="e.g. Meron Kebede"
              />
            </div>
            <div>
              <label htmlFor="department-employees" className="mb-1.5 block text-sm font-medium text-slate-700">
                Number of employees
              </label>
              <input
                id="department-employees"
                name="employeeCount"
                type="number"
                min={0}
                step={1}
                value={department?.employeeCount ?? 0}
                readOnly
                aria-describedby="department-employees-help"
                className="w-full cursor-not-allowed rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-600 outline-none"
              />
              <p id="department-employees-help" className="mt-1 text-xs text-slate-500">
                Automatically counted from employees assigned to this department.
              </p>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="department-status" className="mb-1.5 block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                id="department-status"
                name="status"
                value={values.status}
                onChange={(event) =>
                  setValues({ ...values, status: event.target.value as DepartmentStatus })
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-emerald-100"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {formError && (
            <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {formError}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              {isSaving ? "Saving…" : department ? "Save changes" : "Add department"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: DepartmentStatus }) {
  const style =
    status === "Active"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-600/10"
      : "bg-slate-100 text-slate-600 ring-slate-500/10";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style}`}>
      <span
        aria-hidden="true"
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${status === "Active" ? "bg-emerald-500" : "bg-slate-400"}`}
      />
      {status}
    </span>
  );
}

function PageHeader() {
  return (
    <header className="flex min-h-[76px] items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-9">
      <div>
        <p className="text-xs font-medium text-slate-400">Pages / Departments</p>
        <h1 id="page-title" className="mt-1 text-xl font-bold tracking-tight text-ink sm:text-2xl">
          Departments
        </h1>
      </div>
      <div className="flex items-center gap-4 sm:gap-6">
        <button
          type="button"
          aria-label="Notifications, 3 unread"
          className="relative grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <NotificationIcon />
          <span className="absolute right-[9px] top-[8px] h-2 w-2 rounded-full border-2 border-white bg-red-500" />
        </button>
        <span className="h-8 w-px bg-slate-200" aria-hidden="true" />
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold leading-5 text-ink">Meron Kebede</p>
            <p className="text-xs leading-4 text-slate-500">HR Administrator</p>
          </div>
          <div
            aria-label="Meron Kebede profile"
            role="img"
            className="grid h-10 w-10 place-items-center rounded-full bg-orange-100 text-sm font-bold text-orange-800 ring-2 ring-white"
          >
            MK
          </div>
        </div>
      </div>
    </header>
  );
}

export default function DepartmentsManagement({
  initialDepartments,
}: {
  initialDepartments: DepartmentRecord[];
}) {
  const router = useRouter();
  const [departments, setDepartments] = useState<DepartmentRecord[]>(initialDepartments);
  const [search, setSearch] = useState("");
  const [editingDepartment, setEditingDepartment] = useState<DepartmentRecord | null>(null);
  const [isAddingDepartment, setIsAddingDepartment] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => setDepartments(initialDepartments), [initialDepartments]);

  const filteredDepartments = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return departments;
    return departments.filter(
      (department) =>
        department.name.toLocaleLowerCase().includes(query) ||
        department.code.toLocaleLowerCase().includes(query),
    );
  }, [departments, search]);

  async function saveDepartment(values: DepartmentFormValues): Promise<string | null> {
    const result = editingDepartment
      ? await updateDepartment(editingDepartment.id, values)
      : await createDepartment(values);
    if (!result.ok) return result.message;
    setEditingDepartment(null);
    setIsAddingDepartment(false);
    router.refresh();
    return null;
  }

  async function deleteDepartment(department: DepartmentRecord) {
    const confirmed = window.confirm(
      `Delete ${department.name} (${department.code})?`,
    );
    if (!confirmed) return;
    setActionError("");
    const result = await deleteDepartmentAction(department.id);
    if (!result.ok) {
      setActionError(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="min-h-screen">
      <div className="min-h-screen">
        <PageHeader />
        <main aria-labelledby="page-title" className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 sm:py-8 lg:px-9">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">
                Organize your teams and manage department details.
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {departments.length} departments <span aria-hidden="true">·</span>{" "}
                {departments.filter((department) => department.status === "Active").length} active
              </p>
            </div>
            {actionError && (
              <p role="alert" className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {actionError}
              </p>
            )}
            <button
              type="button"
              onClick={() => setIsAddingDepartment(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              <PlusIcon />
              Add Department
            </button>
          </div>

          <section aria-labelledby="department-list-heading" className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h2 id="department-list-heading" className="text-base font-bold text-ink">
                  All departments
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Review and manage your company departments
                </p>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <label htmlFor="department-search" className="sr-only">
                  Search departments by name or code
                </label>
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <SearchIcon />
                </span>
                <input
                  id="department-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name or code..."
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left">
                <thead className="bg-slate-50/80">
                  <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th scope="col" className="px-5 py-3.5 sm:px-6">Department Name</th>
                    <th scope="col" className="px-4 py-3.5">Department Code</th>
                    <th scope="col" className="px-4 py-3.5">Department Head</th>
                    <th scope="col" className="px-4 py-3.5">Employees</th>
                    <th scope="col" className="px-4 py-3.5">Status</th>
                    <th scope="col" className="px-4 py-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDepartments.map((department) => (
                    <tr key={department.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-5 py-4 sm:px-6">
                        <span className="text-sm font-semibold text-ink">{department.name}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold tracking-wide text-slate-600">
                          {department.code}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{department.head}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{department.employeeCount}</td>
                      <td className="whitespace-nowrap px-4 py-4"><StatusBadge status={department.status} /></td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingDepartment(department)}
                            aria-label={`Edit ${department.name}`}
                            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-semibold text-slate-600 hover:bg-emerald-50 hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                          >
                            <EditIcon />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteDepartment(department)}
                            aria-label={`Delete ${department.name}`}
                            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                          >
                            <DeleteIcon />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredDepartments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <p className="text-sm font-semibold text-slate-700">No departments found</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {search
                            ? "Try another department name or code."
                            : "Add a department to get started."}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-3.5 sm:px-6">
              <p className="text-xs text-slate-500">
                Showing <span className="font-semibold text-slate-700">{filteredDepartments.length}</span>{" "}
                of <span className="font-semibold text-slate-700">{departments.length}</span> departments
              </p>
              <p className="text-xs text-slate-400">Database-backed · changes are saved</p>
            </div>
          </section>

          <footer className="py-7 text-center text-xs text-slate-400">
            © 2026 Super Double T General Trading PLC. All rights reserved.
          </footer>
        </main>
      </div>

      {(isAddingDepartment || editingDepartment) && (
        <DepartmentModal
          key={editingDepartment?.id ?? "new-department"}
          department={editingDepartment}
          departments={departments}
          onClose={() => {
            setIsAddingDepartment(false);
            setEditingDepartment(null);
          }}
          onSave={saveDepartment}
        />
      )}
    </div>
  );
}
