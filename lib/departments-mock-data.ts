export type DepartmentStatus = "Active" | "Inactive";

export type Department = {
  id: string;
  name: string;
  code: string;
  head: string;
  employeeCount: number;
  status: DepartmentStatus;
};

// In-memory seed data for the UI; this is not persisted between page sessions.
export const mockDepartments: Department[] = [
  {
    id: "department-operations",
    name: "Operations",
    code: "OPS",
    head: "Abel Tesfaye",
    employeeCount: 64,
    status: "Active",
  },
  {
    id: "department-finance",
    name: "Finance",
    code: "FIN",
    head: "Hana Bekele",
    employeeCount: 28,
    status: "Active",
  },
  {
    id: "department-human-resources",
    name: "Human Resources",
    code: "HR",
    head: "Mekdes Alemu",
    employeeCount: 16,
    status: "Active",
  },
  {
    id: "department-sales",
    name: "Sales & Marketing",
    code: "SLS",
    head: "Dawit Girma",
    employeeCount: 52,
    status: "Active",
  },
  {
    id: "department-procurement",
    name: "Procurement",
    code: "PRC",
    head: "Rahel Tadesse",
    employeeCount: 31,
    status: "Active",
  },
  {
    id: "department-logistics",
    name: "Logistics",
    code: "LOG",
    head: "Samuel Bekele",
    employeeCount: 39,
    status: "Active",
  },
  {
    id: "department-information-technology",
    name: "Information Technology",
    code: "IT",
    head: "Liya Worku",
    employeeCount: 18,
    status: "Inactive",
  },
];
