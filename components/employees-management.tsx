"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createEmployee, deleteEmployee, updateEmployee } from "@/app/employees/actions";
import {
  type Employee,
  type EmploymentStatus,
} from "@/lib/employees-mock-data";

type EmployeeDepartment = { id: string; name: string; status: "Active" | "Inactive" };
type EmployeeFormValues = Omit<Employee, "id"> & { id: string };
type StatusFilter = "All statuses" | EmploymentStatus;

const emptyForm: EmployeeFormValues = {
  id: "",
  fullName: "",
  departmentId: "",
  jobTitle: "",
  phoneNumber: "",
  email: "",
  employmentStatus: "Active",
  startDate: "",
  location: "",
};

const fieldClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-emerald-100";

function EmployeeFormModal({
  employee,
  employees,
  departments,
  onClose,
  onSave,
}: {
  employee: Employee | null;
  employees: Employee[];
  departments: EmployeeDepartment[];
  onClose: () => void;
  onSave: (values: EmployeeFormValues) => Promise<string | null>;
}) {
  const [values, setValues] = useState<EmployeeFormValues>(
    employee
      ? { ...employee }
      : { ...emptyForm, departmentId: departments.find((item) => item.status === "Active")?.id ?? "" },
  );
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = values.id.trim().toUpperCase();
    const fullName = values.fullName.trim();
    const jobTitle = values.jobTitle.trim();
    const phoneNumber = values.phoneNumber.trim();
    const email = values.email.trim();

    if (!id || !fullName || !jobTitle || !phoneNumber || !values.departmentId) {
      setFormError("Complete all required fields before saving.");
      return;
    }

    if (!/^[A-Z0-9-]{3,20}$/.test(id)) {
      setFormError("Employee ID must be 3–20 characters using letters, numbers, or hyphens.");
      return;
    }

    if (!/^\+?[0-9][0-9\s()-]{6,19}$/.test(phoneNumber)) {
      setFormError("Enter a valid phone number with at least 7 digits.");
      return;
    }

    const duplicateId = employees.some(
      (item) => item.id.toLocaleLowerCase() === id.toLocaleLowerCase() && item.id !== employee?.id,
    );
    if (duplicateId) {
      setFormError("This employee ID is already in use.");
      return;
    }

    setFormError("");
    setIsSaving(true);
    try {
      const error = await onSave({
        ...values,
        id,
        fullName,
        jobTitle,
        phoneNumber,
        email,
        location: values.location.trim(),
      });
      if (error) setFormError(error);
    } catch {
      setFormError("Unable to save the employee right now. Please try again.");
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
        aria-labelledby="employee-form-title"
        className="my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="employee-form-title" className="text-lg font-bold text-ink">
              {employee ? "Edit employee" : "Add employee"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">Enter the employee details below.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close employee form"
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <span aria-hidden="true" className="text-xl leading-none">×</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="employee-id" className="mb-1.5 block text-sm font-medium text-slate-700">
                Employee ID <span className="text-rose-600" aria-hidden="true">*</span>
              </label>
              <input
                id="employee-id"
                required
                maxLength={20}
                autoFocus
                readOnly={Boolean(employee)}
                value={values.id}
                onChange={(event) => setValues({ ...values, id: event.target.value })}
                className={`${fieldClass} read-only:cursor-not-allowed read-only:bg-slate-50`}
                placeholder="e.g. SDT-1234"
              />
              {employee && <p className="mt-1 text-xs text-slate-400">Employee ID cannot be changed.</p>}
            </div>
            <div>
              <label htmlFor="employee-name" className="mb-1.5 block text-sm font-medium text-slate-700">
                Full name <span className="text-rose-600" aria-hidden="true">*</span>
              </label>
              <input
                id="employee-name"
                required
                maxLength={100}
                value={values.fullName}
                onChange={(event) => setValues({ ...values, fullName: event.target.value })}
                className={fieldClass}
                placeholder="Employee full name"
              />
            </div>
            <div>
              <label htmlFor="employee-department" className="mb-1.5 block text-sm font-medium text-slate-700">
                Department <span className="text-rose-600" aria-hidden="true">*</span>
              </label>
              <select
                id="employee-department"
                required
                size={departments.length > 6 ? 6 : undefined}
                value={values.departmentId}
                onChange={(event) => setValues({ ...values, departmentId: event.target.value })}
                className={`${fieldClass} bg-white`}
              >
                {departments.map((department) => (
                  <option
                    key={department.id}
                    value={department.id}
                    disabled={department.status !== "Active" && department.id !== employee?.departmentId}
                  >
                    {department.name}{department.status !== "Active" ? " (Inactive)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="employee-title" className="mb-1.5 block text-sm font-medium text-slate-700">
                Job title <span className="text-rose-600" aria-hidden="true">*</span>
              </label>
              <input
                id="employee-title"
                required
                maxLength={100}
                value={values.jobTitle}
                onChange={(event) => setValues({ ...values, jobTitle: event.target.value })}
                className={fieldClass}
                placeholder="e.g. Operations Manager"
              />
            </div>
            <div>
              <label htmlFor="employee-phone" className="mb-1.5 block text-sm font-medium text-slate-700">
                Phone number <span className="text-rose-600" aria-hidden="true">*</span>
              </label>
              <input
                id="employee-phone"
                type="tel"
                required
                maxLength={20}
                value={values.phoneNumber}
                onChange={(event) => setValues({ ...values, phoneNumber: event.target.value })}
                className={fieldClass}
                placeholder="+251 911 234 567"
              />
            </div>
            <div>
              <label htmlFor="employee-status" className="mb-1.5 block text-sm font-medium text-slate-700">
                Employment status
              </label>
              <select
                id="employee-status"
                value={values.employmentStatus}
                onChange={(event) =>
                  setValues({ ...values, employmentStatus: event.target.value as EmploymentStatus })
                }
                className={`${fieldClass} bg-white`}
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label htmlFor="employee-email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Email address
              </label>
              <input
                id="employee-email"
                type="email"
                maxLength={120}
                value={values.email}
                onChange={(event) => setValues({ ...values, email: event.target.value })}
                className={fieldClass}
                placeholder="name@company.com"
              />
            </div>
            <div>
              <label htmlFor="employee-start-date" className="mb-1.5 block text-sm font-medium text-slate-700">
                Start date
              </label>
              <input
                id="employee-start-date"
                type="date"
                value={values.startDate}
                onChange={(event) => setValues({ ...values, startDate: event.target.value })}
                className={fieldClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="employee-location" className="mb-1.5 block text-sm font-medium text-slate-700">
                Work location
              </label>
              <input
                id="employee-location"
                maxLength={80}
                value={values.location}
                onChange={(event) => setValues({ ...values, location: event.target.value })}
                className={fieldClass}
                placeholder="e.g. Addis Ababa"
              />
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
              {isSaving ? "Saving…" : employee ? "Save changes" : "Add employee"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function EmploymentBadge({ status }: { status: EmploymentStatus }) {
  const styles: Record<EmploymentStatus, string> = {
    Active: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
    "On Leave": "bg-amber-50 text-amber-700 ring-amber-600/10",
    Inactive: "bg-slate-100 text-slate-600 ring-slate-500/10",
  };
  const dotStyles: Record<EmploymentStatus, string> = {
    Active: "bg-emerald-500",
    "On Leave": "bg-amber-500",
    Inactive: "bg-slate-400",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}>
      <span aria-hidden="true" className={`mr-1.5 h-1.5 w-1.5 rounded-full ${dotStyles[status]}`} />
      {status}
    </span>
  );
}

function PageHeader() {
  return (
    <header className="flex min-h-[76px] items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-9">
      <div>
        <p className="text-xs font-medium text-slate-400">Pages / Employees</p>
        <h1 id="page-title" className="mt-1 text-xl font-bold tracking-tight text-ink sm:text-2xl">
          Employees
        </h1>
      </div>
      <div className="flex items-center gap-4 sm:gap-6">
        <button
          type="button"
          aria-label="Notifications, 3 unread"
          className="relative grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
          </svg>
          <span className="absolute right-[9px] top-[8px] h-2 w-2 rounded-full border-2 border-white bg-red-500" />
        </button>
        <span className="h-8 w-px bg-slate-200" aria-hidden="true" />
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold leading-5 text-ink">Meron Kebede</p>
            <p className="text-xs leading-4 text-slate-500">HR Administrator</p>
          </div>
          <div aria-label="Meron Kebede profile" role="img" className="grid h-10 w-10 place-items-center rounded-full bg-orange-100 text-sm font-bold text-orange-800 ring-2 ring-white">
            MK
          </div>
        </div>
      </div>
    </header>
  );
}

export default function EmployeesPage({
  employees: initialEmployees,
  departments,
  canDelete,
}: {
  employees: Employee[];
  departments: EmployeeDepartment[];
  canDelete: boolean;
}) {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All departments");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All statuses");
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => setEmployees(initialEmployees), [initialEmployees]);

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return employees.filter((employee) => {
      const matchesSearch =
        employee.fullName.toLocaleLowerCase().includes(query) ||
        employee.id.toLocaleLowerCase().includes(query);
      const matchesDepartment =
        departmentFilter === "All departments" || employee.departmentId === departmentFilter;
      const matchesStatus =
        statusFilter === "All statuses" || employee.employmentStatus === statusFilter;
      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [employees, search, departmentFilter, statusFilter]);

  async function saveEmployee(values: EmployeeFormValues): Promise<string | null> {
    const result = editingEmployee
      ? await updateEmployee(editingEmployee.id, values)
      : await createEmployee(values);
    if (!result.ok) return result.message;
    setEditingEmployee(null);
    setIsAddingEmployee(false);
    router.refresh();
    return null;
  }

  async function handleDeleteEmployee(employee: Employee) {
    const confirmed = window.confirm(
      `Delete ${employee.fullName} (${employee.id}) permanently? Employees with attendance history cannot be deleted.`,
    );
    if (!confirmed) return;
    setActionError("");
    const result = await deleteEmployee(employee.id);
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
              <p className="text-sm text-slate-500">Manage employee records across your departments.</p>
              <p className="mt-2 text-xs text-slate-500">
                {employees.length} employees <span aria-hidden="true">·</span>{" "}
                {employees.filter((employee) => employee.employmentStatus === "Active").length} active
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingEmployee(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Employee
            </button>
          </div>
          {actionError && (
            <p role="alert" className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {actionError}
            </p>
          )}

          <section aria-labelledby="employee-list-heading" className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 id="employee-list-heading" className="text-base font-bold text-ink">All employees</h2>
                  <p className="mt-1 text-xs text-slate-500">Search and filter your employee directory</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[490px]">
                  <div className="relative">
                    <label htmlFor="employee-search" className="sr-only">Search by employee name or ID</label>
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                      <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <circle cx="11" cy="11" r="7" />
                        <path d="m20 20-4-4" />
                      </svg>
                    </span>
                    <input
                      id="employee-search"
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search name or ID..."
                      className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="department-filter" className="sr-only">Filter by department</label>
                      <select
                        id="department-filter"
                        value={departmentFilter}
                        onChange={(event) => setDepartmentFilter(event.target.value)}
                        className={`${fieldClass} bg-white`}
                      >
                        <option>All departments</option>
                        {departments.map((department) => (
                          <option key={department.id} value={department.id}>{department.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="status-filter" className="sr-only">Filter by employment status</label>
                      <select
                        id="status-filter"
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                        className={`${fieldClass} bg-white`}
                      >
                        <option>All statuses</option>
                        <option value="Active">Active</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] text-left">
                <thead className="bg-slate-50/80">
                  <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th scope="col" className="px-5 py-3.5 sm:px-6">Employee ID</th>
                    <th scope="col" className="px-4 py-3.5">Full Name</th>
                    <th scope="col" className="px-4 py-3.5">Department</th>
                    <th scope="col" className="px-4 py-3.5">Job Title</th>
                    <th scope="col" className="px-4 py-3.5">Phone Number</th>
                    <th scope="col" className="px-4 py-3.5">Employment Status</th>
                    <th scope="col" className="px-4 py-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.map((employee) => {
                    const department = departments.find((item) => item.id === employee.departmentId);
                    return (
                      <tr key={employee.id} className="transition-colors hover:bg-slate-50/70">
                        <td className="whitespace-nowrap px-5 py-4 sm:px-6">
                          <Link href={`/employees/${encodeURIComponent(employee.id)}`} className="text-xs font-semibold tracking-wide text-brand hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                            {employee.id}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <Link href={`/employees/${encodeURIComponent(employee.id)}`} className="text-sm font-semibold text-ink hover:text-brand hover:underline">
                            {employee.fullName}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{department?.name ?? "Unassigned"}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{employee.jobTitle}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{employee.phoneNumber}</td>
                        <td className="whitespace-nowrap px-4 py-4"><EmploymentBadge status={employee.employmentStatus} /></td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingEmployee(employee)}
                              aria-label={`Edit ${employee.fullName}`}
                              className="rounded-md px-2.5 py-2 text-xs font-semibold text-slate-600 hover:bg-emerald-50 hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                            >
                              Edit
                            </button>
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => void handleDeleteEmployee(employee)}
                                aria-label={`Delete ${employee.fullName}`}
                                className="rounded-md px-2.5 py-2 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <p className="text-sm font-semibold text-slate-700">No employees found</p>
                        <p className="mt-1 text-xs text-slate-500">Try changing your search or filters.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-3.5 sm:px-6">
              <p className="text-xs text-slate-500">
                Showing <span className="font-semibold text-slate-700">{filteredEmployees.length}</span> of{" "}
                <span className="font-semibold text-slate-700">{employees.length}</span> employees
              </p>
              <p className="text-xs text-slate-400">Database-backed · changes are saved</p>
            </div>
          </section>

          <footer className="py-7 text-center text-xs text-slate-400">
            © 2026 Super Double T General Trading PLC. All rights reserved.
          </footer>
        </main>
      </div>
      {(isAddingEmployee || editingEmployee) && (
        <EmployeeFormModal
          key={editingEmployee?.id ?? "new-employee"}
          employee={editingEmployee}
          employees={employees}
          departments={departments}
          onClose={() => {
            setIsAddingEmployee(false);
            setEditingEmployee(null);
          }}
          onSave={saveEmployee}
        />
      )}
    </div>
  );
}
