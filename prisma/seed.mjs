import { PrismaClient, EmploymentStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const operations = await prisma.department.upsert({
    where: { code: "DEMO-OPS" },
    update: {},
    create: {
      name: "Example Operations",
      code: "DEMO-OPS",
      description: "Sample department for initial setup",
    },
  });

  const people = await prisma.department.upsert({
    where: { code: "DEMO-PEOPLE" },
    update: {},
    create: {
      name: "Example People",
      code: "DEMO-PEOPLE",
      description: "Sample department for initial setup",
    },
  });

  await prisma.employee.upsert({
    where: { employeeCode: "SDT-DEMO-001" },
    update: {},
    create: {
      employeeCode: "SDT-DEMO-001",
      firstName: "Alex",
      lastName: "Example",
      email: "alex.example001@example.test",
      jobTitle: "Operations Coordinator",
      employmentStatus: EmploymentStatus.ACTIVE,
      departmentId: operations.id,
    },
  });

  await prisma.employee.upsert({
    where: { employeeCode: "SDT-DEMO-002" },
    update: {},
    create: {
      employeeCode: "SDT-DEMO-002",
      firstName: "Jordan",
      lastName: "Sample",
      email: "jordan.sample002@example.test",
      jobTitle: "People Coordinator",
      employmentStatus: EmploymentStatus.ACTIVE,
      departmentId: people.id,
    },
  });

  console.log("Seeded 2 example departments and 2 example employees.");
}

main()
  .catch((error) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
