import { createInterface } from "node:readline/promises";
import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

function readHidden(prompt) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
      reject(new Error("Run this command in an interactive terminal to enter the password safely."));
      return;
    }
    process.stdout.write(prompt);
    let value = "";
    const onData = (chunk) => {
      for (const character of chunk.toString()) {
        if (character === "\u0003") {
          cleanup();
          reject(new Error("Password entry cancelled."));
          return;
        }
        if (character === "\r" || character === "\n") {
          process.stdout.write("\n");
          cleanup();
          resolve(value);
          return;
        }
        if (character === "\u0008" || character === "\u007f") {
          value = value.slice(0, -1);
        } else if (character >= " ") {
          value += character;
        }
      }
    };
    const cleanup = () => {
      process.stdin.off("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
    };
    process.stdin.setEncoding("utf8");
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", onData);
  });
}

async function main() {
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  const email = (await prompt.question("Account email: ")).trim().toLowerCase();
  const name = (await prompt.question("Display name: ")).trim();
  const roleText = (await prompt.question("Role (ADMIN, HR, EMPLOYEE): ")).trim().toUpperCase();
  const employeeCode = (await prompt.question("Employee code (required for EMPLOYEE, otherwise blank): "))
    .trim()
    .toUpperCase();
  prompt.close();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120 || !name || name.length > 100) {
    throw new Error("Enter a valid email and display name.");
  }
  const role = Object.values(UserRole).find((value) => value === roleText);
  if (!role) {
    throw new Error("Choose ADMIN, HR, or EMPLOYEE.");
  }
  if (role === UserRole.EMPLOYEE && !employeeCode) {
    throw new Error("An employee code is required for an EMPLOYEE account.");
  }

  const password = await readHidden("Password (at least 12 characters; input hidden): ");
  if (password.length < 12 || password.length > 200) {
    throw new Error("Password must contain 12–200 characters.");
  }

  const employee = employeeCode
    ? await prisma.employee.findUnique({ where: { employeeCode }, select: { id: true } })
    : null;
  if (employeeCode && !employee) throw new Error("The employee code was not found.");

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role,
      employeeId: employee?.id,
    },
  });
  console.log(`Created ${role} account.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Unable to create the account.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
