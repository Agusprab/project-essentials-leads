import { sql } from "drizzle-orm";

import {
  getEvolutionSettingsForForm,
  type EvolutionSettingsFormValues,
} from "@/lib/evolution/config";
import { getEvolutionConnectionState } from "@/lib/evolution/client";
import { listGosomJobs } from "@/lib/gosom/client";

export type ConnectionStatus = {
  key: string;
  label: string;
  state: "ready" | "missing-config" | "error";
  description: string;
  detail: string;
};

export type SettingsStatus = {
  services: ConnectionStatus[];
  evolutionSettings: EvolutionSettingsFormValues;
  env: {
    name: string;
    status: "configured" | "missing";
    value: string;
  }[];
};

const envNames = [
  "DATABASE_URL",
  "REDIS_URL",
  "GOSOM_API_URL",
  "EVOLUTION_API_URL",
  "EVOLUTION_INSTANCE",
  "EVOLUTION_API_KEY",
  "WHATSAPP_TEST_NUMBER",
] as const;

export async function getSettingsStatus(): Promise<SettingsStatus> {
  const [database, redis, gosom, evolution, evolutionSettings] =
    await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkGosom(),
      checkEvolution(),
      getEvolutionSettingsForForm(),
    ]);

  return {
    services: [database, redis, gosom, evolution],
    evolutionSettings,
    env: envNames.map((name) => ({
      name,
      status: process.env[name] ? "configured" : "missing",
      value: formatEnvValue(name, process.env[name]),
    })),
  };
}

export function formatEnvValue(name: string, value: string | undefined): string {
  if (!value) {
    return "Belum diisi";
  }

  if (name.includes("KEY") || name.includes("PASSWORD")) {
    return "Terisi, disembunyikan";
  }

  if (name.endsWith("_URL")) {
    return formatUrlValue(value);
  }

  return value;
}

function formatUrlValue(value: string): string {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}`;
  } catch {
    return "Terisi, format URL belum valid";
  }
}

async function checkDatabase(): Promise<ConnectionStatus> {
  if (!process.env.DATABASE_URL) {
    return {
      key: "database",
      label: "PostgreSQL",
      state: "missing-config",
      description: "Database utama dashboard.",
      detail: "DATABASE_URL belum diisi.",
    };
  }

  try {
    const { db } = await import("@/db");
    await db.execute(sql`select 1`);

    return {
      key: "database",
      label: "PostgreSQL",
      state: "ready",
      description: "Database utama dashboard.",
      detail: "Koneksi database berhasil.",
    };
  } catch (error) {
    console.error("Gagal cek PostgreSQL", {
      error: error instanceof Error ? error.message : "unknown_error",
    });

    return {
      key: "database",
      label: "PostgreSQL",
      state: "error",
      description: "Database utama dashboard.",
      detail: "Database belum bisa diakses.",
    };
  }
}

async function checkRedis(): Promise<ConnectionStatus> {
  if (!process.env.REDIS_URL) {
    return {
      key: "redis",
      label: "Redis",
      state: "missing-config",
      description: "Antrean worker campaign.",
      detail: "REDIS_URL belum diisi.",
    };
  }

  let redis: import("ioredis").Redis | null = null;

  try {
    const { default: IORedis } = await import("ioredis");
    redis = new IORedis(process.env.REDIS_URL, {
      connectTimeout: 5_000,
      maxRetriesPerRequest: 1,
    });
    const response = await redis.ping();

    return {
      key: "redis",
      label: "Redis",
      state: response === "PONG" ? "ready" : "error",
      description: "Antrean worker campaign.",
      detail: response === "PONG" ? "Redis merespons PONG." : "Redis merespons tidak sesuai.",
    };
  } catch (error) {
    console.error("Gagal cek Redis", {
      error: error instanceof Error ? error.message : "unknown_error",
    });

    return {
      key: "redis",
      label: "Redis",
      state: "error",
      description: "Antrean worker campaign.",
      detail: "Redis belum bisa diakses.",
    };
  } finally {
    redis?.disconnect();
  }
}

async function checkGosom(): Promise<ConnectionStatus> {
  const result = await listGosomJobs();

  if (result.state === "missing-config") {
    return {
      key: "gosom",
      label: "Gosom API",
      state: "missing-config",
      description: "Scraping job Google Maps.",
      detail: "GOSOM_API_URL belum diisi.",
    };
  }

  return {
    key: "gosom",
    label: "Gosom API",
    state: result.state,
    description: "Scraping job Google Maps.",
    detail:
      result.state === "ready"
        ? `${result.jobs.length.toLocaleString("id-ID")} job terbaca.`
        : "Gosom API belum bisa diakses.",
  };
}

async function checkEvolution(): Promise<ConnectionStatus> {
  const result = await getEvolutionConnectionState();

  if (result.state === "missing-config") {
    return {
      key: "evolution",
      label: "Evolution API",
      state: "missing-config",
      description: "Pengiriman pesan WhatsApp.",
      detail: "EVOLUTION_API_URL, EVOLUTION_INSTANCE, atau EVOLUTION_API_KEY belum lengkap.",
    };
  }

  return {
    key: "evolution",
    label: "Evolution API",
    state: result.state,
    description: "Pengiriman pesan WhatsApp.",
    detail:
      result.state === "ready"
        ? `Instance terbaca${result.connectionState ? `: ${result.connectionState}` : "."}`
        : "Evolution API belum bisa diakses.",
  };
}
