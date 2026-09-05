import { inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { appSettings } from "@/db/schema";

const evolutionConfigSchema = z.object({
  apiUrl: z.string().url(),
  instance: z.string().min(1),
  apiKey: z.string().min(1),
});

const settingKeys = {
  apiUrl: "evolution.api_url",
  instance: "evolution.instance",
  apiKey: "evolution.api_key",
} as const;

export type EvolutionConfig = z.infer<typeof evolutionConfigSchema>;

export type EvolutionSettingsFormValues = {
  apiUrl: string;
  instance: string;
  apiKeyConfigured: boolean;
  apiKeySource: "database" | "environment" | "missing";
};

export async function getEvolutionConfig(): Promise<EvolutionConfig | null> {
  const saved = await getSavedEvolutionSettings();
  const parsed = evolutionConfigSchema.safeParse({
    apiUrl: saved.apiUrl ?? process.env.EVOLUTION_API_URL,
    instance: saved.instance ?? process.env.EVOLUTION_INSTANCE,
    apiKey: saved.apiKey ?? process.env.EVOLUTION_API_KEY,
  });

  return parsed.success ? parsed.data : null;
}

export async function getEvolutionSettingsForForm(): Promise<EvolutionSettingsFormValues> {
  const saved = await getSavedEvolutionSettings();
  const apiKey = saved.apiKey ?? process.env.EVOLUTION_API_KEY ?? "";

  return {
    apiUrl: saved.apiUrl ?? process.env.EVOLUTION_API_URL ?? "",
    instance: saved.instance ?? process.env.EVOLUTION_INSTANCE ?? "",
    apiKeyConfigured: apiKey.length > 0,
    apiKeySource: saved.apiKey
      ? "database"
      : process.env.EVOLUTION_API_KEY
        ? "environment"
        : "missing",
  };
}

export async function saveEvolutionSettings(input: {
  apiUrl: string;
  instance: string;
  apiKey?: string;
}): Promise<void> {
  const { db } = await import("@/db");
  const now = new Date();
  const values: (typeof appSettings.$inferInsert)[] = [
    {
      key: settingKeys.apiUrl,
      value: input.apiUrl,
      createdAt: now,
      updatedAt: now,
    },
    {
      key: settingKeys.instance,
      value: input.instance,
      createdAt: now,
      updatedAt: now,
    },
  ];

  if (input.apiKey) {
    values.push({
      key: settingKeys.apiKey,
      value: input.apiKey,
      createdAt: now,
      updatedAt: now,
    });
  }

  await db
    .insert(appSettings)
    .values(values)
    .onConflictDoUpdate({
      target: appSettings.key,
      set: {
        value: sql`excluded.value`,
        updatedAt: now,
      },
    });
}

async function getSavedEvolutionSettings(): Promise<{
  apiUrl: string | null;
  instance: string | null;
  apiKey: string | null;
}> {
  if (!process.env.DATABASE_URL) {
    return {
      apiUrl: null,
      instance: null,
      apiKey: null,
    };
  }

  try {
    const { db } = await import("@/db");
    const rows = await db
      .select({
        key: appSettings.key,
        value: appSettings.value,
      })
      .from(appSettings)
      .where(inArray(appSettings.key, Object.values(settingKeys)));
    const settings = new Map(rows.map((row) => [row.key, row.value]));

    return {
      apiUrl: settings.get(settingKeys.apiUrl) ?? null,
      instance: settings.get(settingKeys.instance) ?? null,
      apiKey: settings.get(settingKeys.apiKey) ?? null,
    };
  } catch (error) {
    console.error("Gagal membaca konfigurasi Evolution tersimpan", {
      error: error instanceof Error ? error.message : "unknown_error",
    });

    return {
      apiUrl: null,
      instance: null,
      apiKey: null,
    };
  }
}
