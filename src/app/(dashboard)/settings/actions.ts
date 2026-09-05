"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { saveEvolutionSettings } from "@/lib/evolution/config";
import { sendTestTextMessage } from "@/lib/evolution/test-send";

const testTextSchema = z.object({
  number: z.string().trim().regex(/^62\d{8,15}$/),
  text: z.string().trim().min(1).max(1200),
});

const evolutionSettingsSchema = z.object({
  apiUrl: z.string().trim().url().max(240),
  instance: z.string().trim().min(1).max(120),
  apiKey: z.string().trim().max(240).optional(),
});

export async function saveEvolutionSettingsAction(formData: FormData) {
  const parsed = evolutionSettingsSchema.safeParse({
    apiUrl: formData.get("apiUrl"),
    instance: formData.get("instance"),
    apiKey: formData.get("apiKey") || undefined,
  });

  if (!parsed.success) {
    redirect("/settings?evolution=invalid");
  }

  try {
    await saveEvolutionSettings(parsed.data);
  } catch (error) {
    console.error("Gagal menyimpan konfigurasi Evolution", {
      error: error instanceof Error ? error.message : "unknown_error",
    });

    redirect("/settings?evolution=error");
  }

  revalidatePath("/settings");
  redirect("/settings?evolution=ready");
}

export async function testEvolutionTextAction(formData: FormData) {
  const parsed = testTextSchema.safeParse({
    number: formData.get("number"),
    text: formData.get("text"),
  });

  if (!parsed.success) {
    redirect("/settings?test=invalid");
  }

  const result = await sendTestTextMessage(parsed.data);

  revalidatePath("/settings");
  redirect(`/settings?test=${result.state}`);
}
