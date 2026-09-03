import { z } from "zod";

const evolutionConfigSchema = z.object({
  apiUrl: z.string().url(),
  instance: z.string().min(1),
  apiKey: z.string().min(1),
});

const evolutionSendResponseSchema = z
  .object({
    key: z
      .object({
        id: z.string().optional(),
      })
      .optional(),
    messageId: z.string().optional(),
    id: z.string().optional(),
  })
  .passthrough();

export type EvolutionSendTextInput = {
  number: string;
  text: string;
  delay: number;
};

export type EvolutionMediaType = "image" | "video" | "audio" | "document";

export type EvolutionSendMediaInput = {
  number: string;
  caption: string;
  delay: number;
  fileName: string;
  mimeType: string;
  media: string;
  mediaType: EvolutionMediaType;
};

export type EvolutionSendTextResult =
  | {
      state: "ready";
      messageId: string | null;
    }
  | {
      state: "missing-config" | "error" | "timeout";
      messageId: null;
    };

export type EvolutionSendMediaResult = EvolutionSendTextResult;

export type EvolutionConnectionStateResult =
  | {
      state: "ready";
      connectionState: string | null;
    }
  | {
      state: "missing-config" | "error";
      connectionState: null;
    };

export function buildEvolutionSendTextPayload(input: EvolutionSendTextInput) {
  return {
    number: input.number,
    text: input.text,
    delay: input.delay,
    linkPreview: false,
  };
}

export function buildEvolutionSendMediaPayload(input: EvolutionSendMediaInput) {
  return {
    number: input.number,
    mediatype: input.mediaType,
    mimetype: input.mimeType,
    caption: input.caption,
    media: input.media,
    fileName: input.fileName,
    delay: input.delay,
  };
}

export function buildEvolutionConnectionStateUrl(
  apiUrl: string,
  instance: string,
): string {
  return new URL(
    `/instance/connectionState/${encodeURIComponent(instance)}`,
    apiUrl.replace(/\/$/, ""),
  ).toString();
}

export async function sendEvolutionTextMessage(
  input: EvolutionSendTextInput,
): Promise<EvolutionSendTextResult> {
  const config = evolutionConfigSchema.safeParse({
    apiUrl: process.env.EVOLUTION_API_URL,
    instance: process.env.EVOLUTION_INSTANCE,
    apiKey: process.env.EVOLUTION_API_KEY,
  });

  if (!config.success) {
    return {
      state: "missing-config",
      messageId: null,
    };
  }

  try {
    const response = await fetch(
      `${config.data.apiUrl.replace(/\/$/, "")}/message/sendText/${config.data.instance}`,
      {
        method: "POST",
        headers: {
          apikey: config.data.apiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify(buildEvolutionSendTextPayload(input)),
        cache: "no-store",
        signal: AbortSignal.timeout(30_000),
      },
    );

    if (!response.ok) {
      return {
        state: "error",
        messageId: null,
      };
    }

    const parsed: unknown = await response.json().catch(() => ({}));
    const body = evolutionSendResponseSchema.safeParse(parsed);

    return {
      state: "ready",
      messageId: body.success
        ? body.data.key?.id ?? body.data.messageId ?? body.data.id ?? null
        : null,
    };
  } catch (error) {
    const isTimeout = isAbortError(error);
    console.error("Gagal mengirim pesan Evolution", {
      number: input.number,
      error: error instanceof Error ? error.message : "unknown_error",
    });

    return {
      state: isTimeout ? "timeout" : "error",
      messageId: null,
    };
  }
}

export async function sendEvolutionMediaMessage(
  input: EvolutionSendMediaInput,
): Promise<EvolutionSendMediaResult> {
  const config = evolutionConfigSchema.safeParse({
    apiUrl: process.env.EVOLUTION_API_URL,
    instance: process.env.EVOLUTION_INSTANCE,
    apiKey: process.env.EVOLUTION_API_KEY,
  });

  if (!config.success) {
    return {
      state: "missing-config",
      messageId: null,
    };
  }

  try {
    const response = await fetch(
      `${config.data.apiUrl.replace(/\/$/, "")}/message/sendMedia/${config.data.instance}`,
      {
        method: "POST",
        headers: {
          apikey: config.data.apiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify(buildEvolutionSendMediaPayload(input)),
        cache: "no-store",
        signal: AbortSignal.timeout(120_000),
      },
    );

    if (!response.ok) {
      return {
        state: "error",
        messageId: null,
      };
    }

    const parsed: unknown = await response.json().catch(() => ({}));
    const body = evolutionSendResponseSchema.safeParse(parsed);

    return {
      state: "ready",
      messageId: body.success
        ? body.data.key?.id ?? body.data.messageId ?? body.data.id ?? null
        : null,
    };
  } catch (error) {
    const isTimeout = isAbortError(error);
    console.error("Gagal mengirim media Evolution", {
      number: input.number,
      mediaType: input.mediaType,
      mimeType: input.mimeType,
      error: error instanceof Error ? error.message : "unknown_error",
    });

    return {
      state: isTimeout ? "timeout" : "error",
      messageId: null,
    };
  }
}

function isAbortError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === "AbortError" ||
    error.message.toLowerCase().includes("aborted")
  );
}

export async function getEvolutionConnectionState(): Promise<EvolutionConnectionStateResult> {
  const config = evolutionConfigSchema.safeParse({
    apiUrl: process.env.EVOLUTION_API_URL,
    instance: process.env.EVOLUTION_INSTANCE,
    apiKey: process.env.EVOLUTION_API_KEY,
  });

  if (!config.success) {
    return {
      state: "missing-config",
      connectionState: null,
    };
  }

  try {
    const response = await fetch(
      buildEvolutionConnectionStateUrl(
        config.data.apiUrl,
        config.data.instance,
      ),
      {
        headers: {
          apikey: config.data.apiKey,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!response.ok) {
      return {
        state: "error",
        connectionState: null,
      };
    }

    const payload: unknown = await response.json().catch(() => ({}));
    const parsed = z
      .object({
        instance: z
          .object({
            state: z.string().optional(),
          })
          .optional(),
        state: z.string().optional(),
      })
      .passthrough()
      .safeParse(payload);

    return {
      state: "ready",
      connectionState: parsed.success
        ? parsed.data.instance?.state ?? parsed.data.state ?? null
        : null,
    };
  } catch (error) {
    console.error("Gagal membaca status Evolution", {
      error: error instanceof Error ? error.message : "unknown_error",
    });

    return {
      state: "error",
      connectionState: null,
    };
  }
}
