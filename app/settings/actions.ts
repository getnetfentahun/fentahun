"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditSystemSettings } from "@/lib/report-utils";

export type SettingsInput = {
  timezone: string;
  reportDefaultDays: number;
};

export type SettingsActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function updateSystemSettings(
  value: unknown,
): Promise<SettingsActionResult> {
  const session = await getServerSession(authOptions);
  if (!session) return { ok: false, message: "Sign in to update settings." };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!user || !canEditSystemSettings(user.role)) {
    return { ok: false, message: "Only an administrator can change system settings." };
  }

  if (!value || typeof value !== "object") {
    return { ok: false, message: "Enter valid settings." };
  }
  const input = value as Record<string, unknown>;
  if (
    typeof input.timezone !== "string" ||
    input.timezone.length > 80 ||
    !Number.isInteger(input.reportDefaultDays) ||
    typeof input.reportDefaultDays !== "number" ||
    input.reportDefaultDays < 1 ||
    input.reportDefaultDays > 365
  ) {
    return {
      ok: false,
      message: "Choose a valid timezone and a report period between 1 and 365 days.",
    };
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: input.timezone });
  } catch {
    return { ok: false, message: "Choose a supported timezone." };
  }

  try {
    await prisma.systemSettings.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        timezone: input.timezone,
        reportDefaultDays: input.reportDefaultDays,
      },
      update: {
        timezone: input.timezone,
        reportDefaultDays: input.reportDefaultDays,
      },
    });
    revalidatePath("/settings");
    revalidatePath("/reports");
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    console.error(
      "System settings update failed:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return { ok: false, message: "Settings could not be saved. Please try again." };
  }
}
