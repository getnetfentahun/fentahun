export type AttendanceStatus = "Present" | "Late" | "Absent";

export type AttendanceRecord = {
  employeeName: string;
  employeeId: string;
  department: string;
  checkIn: string;
  checkOut: string;
  status: AttendanceStatus;
  initials: string;
  avatarColor: string;
};

export type DashboardMetric = {
  label: string;
  value: string;
  detail: string;
  change: string;
  tone: "green" | "red" | "amber" | "blue";
};

// Replace this module with an API/data-access layer when the backend is ready.
export const dashboardMetrics: DashboardMetric[] = [
  {
    label: "Total Employees",
    value: "248",
    detail: "Across all departments",
    change: "+12 this month",
    tone: "green",
  },
  {
    label: "Present Today",
    value: "216",
    detail: "87% of total workforce",
    change: "+4.8% vs. yesterday",
    tone: "blue",
  },
  {
    label: "Absent Today",
    value: "18",
    detail: "7% of total workforce",
    change: "3 on approved leave",
    tone: "red",
  },
  {
    label: "Late Today",
    value: "14",
    detail: "5.6% of total workforce",
    change: "2 fewer than yesterday",
    tone: "amber",
  },
];

export const recentAttendance: AttendanceRecord[] = [
  {
    employeeName: "Abel Tesfaye",
    employeeId: "SDT-1042",
    department: "Operations",
    checkIn: "08:02 AM",
    checkOut: "—",
    status: "Present",
    initials: "AT",
    avatarColor: "bg-emerald-100 text-emerald-800",
  },
  {
    employeeName: "Hana Bekele",
    employeeId: "SDT-1087",
    department: "Finance",
    checkIn: "08:17 AM",
    checkOut: "—",
    status: "Late",
    initials: "HB",
    avatarColor: "bg-violet-100 text-violet-800",
  },
  {
    employeeName: "Mekdes Alemu",
    employeeId: "SDT-0963",
    department: "Human Resources",
    checkIn: "07:54 AM",
    checkOut: "—",
    status: "Present",
    initials: "MA",
    avatarColor: "bg-amber-100 text-amber-800",
  },
  {
    employeeName: "Dawit Girma",
    employeeId: "SDT-1125",
    department: "Sales",
    checkIn: "08:26 AM",
    checkOut: "—",
    status: "Late",
    initials: "DG",
    avatarColor: "bg-sky-100 text-sky-800",
  },
  {
    employeeName: "Rahel Tadesse",
    employeeId: "SDT-1018",
    department: "Procurement",
    checkIn: "07:48 AM",
    checkOut: "—",
    status: "Present",
    initials: "RT",
    avatarColor: "bg-rose-100 text-rose-800",
  },
];
