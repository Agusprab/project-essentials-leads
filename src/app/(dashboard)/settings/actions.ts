"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { sendTestTextMessage } from "@/lib/evolution/test-send";

const testTextSchema = z.object({
  number: z.string().trim().regex(/^62\d{8,15}$/),
  text: z.string().trim().min(1).max(1200),
});

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
