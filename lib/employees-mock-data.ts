export type EmploymentStatus = "Active" | "On Leave" | "Inactive";

export type Employee = {
  id: string;
  fullName: string;
  departmentId: string;
  jobTitle: string;
  phoneNumber: string;
  email: string;
  employmentStatus: EmploymentStatus;
  startDate: string;
  location: string;
};

// In-memory sample records for the employee UI; changes are not persisted.
export const mockEmployees: Employee[] = [
  {
    id: "SDT-1042",
    fullName: "Abel Tesfaye",
    departmentId: "department-operations",
    jobTitle: "Operations Manager",
    phoneNumber: "+251 911 234 567",
    email: "abel.tesfaye@sdt.example",
    employmentStatus: "Active",
    startDate: "2020-03-16",
    location: "Addis Ababa",
  },
  {
    id: "SDT-1087",
    fullName: "Hana Bekele",
    departmentId: "department-finance",
    jobTitle: "Senior Accountant",
    phoneNumber: "+251 912 345 678",
    email: "hana.bekele@sdt.example",
    employmentStatus: "Active",
    startDate: "2021-06-01",
    location: "Addis Ababa",
  },
  {
    id: "SDT-0963",
    fullName: "Mekdes Alemu",
    departmentId: "department-human-resources",
    jobTitle: "HR Officer",
    phoneNumber: "+251 913 456 789",
    email: "mekdes.alemu@sdt.example",
    employmentStatus: "Active",
    startDate: "2019-11-04",
    location: "Addis Ababa",
  },
  {
    id: "SDT-1125",
    fullName: "Dawit Girma",
    departmentId: "department-sales",
    jobTitle: "Sales Representative",
    phoneNumber: "+251 914 567 890",
    email: "dawit.girma@sdt.example",
    employmentStatus: "Active",
    startDate: "2022-02-14",
    location: "Adama",
  },
  {
    id: "SDT-1018",
    fullName: "Rahel Tadesse",
    departmentId: "department-procurement",
    jobTitle: "Procurement Specialist",
    phoneNumber: "+251 915 678 901",
    email: "rahel.tadesse@sdt.example",
    employmentStatus: "On Leave",
    startDate: "2020-08-24",
    location: "Addis Ababa",
  },
  {
    id: "SDT-1104",
    fullName: "Samuel Bekele",
    departmentId: "department-logistics",
    jobTitle: "Logistics Coordinator",
    phoneNumber: "+251 916 789 012",
    email: "samuel.bekele@sdt.example",
    employmentStatus: "Active",
    startDate: "2021-09-13",
    location: "Dire Dawa",
  },
  {
    id: "SDT-1156",
    fullName: "Liya Worku",
    departmentId: "department-information-technology",
    jobTitle: "IT Support Specialist",
    phoneNumber: "+251 917 890 123",
    email: "liya.worku@sdt.example",
    employmentStatus: "Inactive",
    startDate: "2023-01-09",
    location: "Addis Ababa",
  },
  {
    id: "SDT-1189",
    fullName: "Yonas Mekonnen",
    departmentId: "department-operations",
    jobTitle: "Warehouse Supervisor",
    phoneNumber: "+251 918 901 234",
    email: "yonas.mekonnen@sdt.example",
    employmentStatus: "Active",
    startDate: "2023-07-03",
    location: "Hawassa",
  },
  {
    id: "SDT-1203",
    fullName: "Sara Getachew",
    departmentId: "department-sales",
    jobTitle: "Key Account Officer",
    phoneNumber: "+251 919 012 345",
    email: "sara.getachew@sdt.example",
    employmentStatus: "On Leave",
    startDate: "2024-04-15",
    location: "Addis Ababa",
  },
  {
    id: "SDT-1221",
    fullName: "Biruk Assefa",
    departmentId: "department-finance",
    jobTitle: "Payroll Accountant",
    phoneNumber: "+251 910 123 456",
    email: "biruk.assefa@sdt.example",
    employmentStatus: "Active",
    startDate: "2024-09-02",
    location: "Addis Ababa",
  },
];
