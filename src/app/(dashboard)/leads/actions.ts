"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { leads } from "@/db/schema";

const deleteLeadSchema = z.object({
  leadId: z.string().uuid(),
});

const bulkDeleteLeadsSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1).max(100),
});

export async function deleteLeadAction(formData: FormData) {
  const parsed = deleteLeadSchema.safeParse({
    leadId: formData.get("leadId"),
  });

  if (!parsed.success) {
    redirect("/leads?delete=invalid");
  }

  if (!process.env.DATABASE_URL) {
    redirect("/leads?delete=missing-config");
  }

  try {
    const { db } = await import("@/db");
    await db.delete(leads).where(eq(leads.id, parsed.data.leadId));
  } catch (error) {
    console.error("Gagal menghapus lead", {
      leadId: parsed.data.leadId,
      error: error instanceof Error ? error.message : "unknown_error",
    });

    redirect("/leads?delete=error");
  }

  revalidatePath("/");
  revalidatePath("/leads");
  redirect("/leads?delete=ready");
}

export async function bulkDeleteLeadsAction(formData: FormData) {
  const parsed = bulkDeleteLeadsSchema.safeParse({
    leadIds: formData.getAll("leadIds"),
  });

  if (!parsed.success) {
    redirect("/leads?delete=bulk-invalid");
  }

  if (!process.env.DATABASE_URL) {
    redirect("/leads?delete=missing-config");
  }

  try {
    const { db } = await import("@/db");
    await db.delete(leads).where(inArray(leads.id, parsed.data.leadIds));
  } catch (error) {
    console.error("Gagal menghapus bulk lead", {
      count: parsed.data.leadIds.length,
      error: error instanceof Error ? error.message : "unknown_error",
    });

    redirect("/leads?delete=error");
  }

  revalidatePath("/");
  revalidatePath("/leads");
  redirect(`/leads?delete=bulk-ready&count=${parsed.data.leadIds.length}`);
}
