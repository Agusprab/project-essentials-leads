"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { campaigns } from "@/db/schema";
import { approveCampaign } from "@/lib/campaigns/approve-campaign";
import {
  cancelCampaign,
  retryFailedCampaignRecipients,
} from "@/lib/campaigns/control-campaign";
import { createCampaignDraft } from "@/lib/campaigns/create-campaign";
import { getCampaign } from "@/lib/campaigns/get-campaign";
import {
  sendTestMediaMessage,
  sendTestTextMessage,
} from "@/lib/evolution/test-send";
import type { EvolutionMediaType } from "@/lib/evolution/client";

const createCampaignSchema = z.object({
  name: z.string().trim().min(3).max(120),
  messageTemplate: z.string().trim().min(10).max(1200),
  recipientLimit: z.coerce.number().int().min(1).max(500),
  delayMs: z.coerce.number().int().min(1000).max(30000),
  delayMode: z.enum(["fixed", "random"]),
  delayMinMs: z.coerce.number().int().min(1).max(30),
  delayMaxMs: z.coerce.number().int().min(1).max(60),
  leadIds: z.array(z.string().uuid()).min(1).max(500),
});

const maxCampaignMediaSize = 10 * 1024 * 1024;
const maxCampaignMediaBase64Length = Math.ceil(maxCampaignMediaSize * 1.37);

const persistedMediaSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(120),
  mediaType: z.enum(["image", "video", "audio", "document"]),
  data: z.string().min(1).max(maxCampaignMediaBase64Length),
});

const deleteCampaignSchema = z.object({
  campaignId: z.string().uuid(),
});

const approveCampaignSchema = z.object({
  campaignId: z.string().uuid(),
});

const campaignControlSchema = z.object({
  campaignId: z.string().uuid(),
});

const testCampaignSchema = z.object({
  campaignId: z.string().uuid(),
  number: z.string().trim().regex(/^62\d{8,15}$/),
});

type CampaignMediaParseResult =
  | {
      state: "ready";
      media: {
        type: EvolutionMediaType;
        fileName: string;
        mimeType: string;
        data: string;
      } | null;
    }
  | {
      state: "invalid";
      media: null;
    };

export async function createCampaignAction(formData: FormData) {
  const parsed = createCampaignSchema.safeParse({
    name: formData.get("name"),
    messageTemplate: formData.get("messageTemplate"),
    recipientLimit: formData.get("recipientLimit"),
    delayMs: formData.get("delayMs"),
    delayMode: formData.get("delayMode"),
    delayMinMs: formData.get("delayMinMs"),
    delayMaxMs: formData.get("delayMaxMs"),
    leadIds: formData.getAll("leadIds"),
  });

  const media = await parseCampaignMedia(formData);

  if (!parsed.success || media.state === "invalid") {
    redirect("/campaigns/new?create=invalid");
  }

  const delayMinMs =
    parsed.data.delayMode === "fixed"
      ? parsed.data.delayMs
      : parsed.data.delayMinMs * 1000;
  const delayMaxMs =
    parsed.data.delayMode === "fixed"
      ? parsed.data.delayMs
      : parsed.data.delayMaxMs * 1000;

  if (delayMinMs > delayMaxMs) {
    redirect("/campaigns/new?create=invalid-delay");
  }

  const result = await createCampaignDraft({
    ...parsed.data,
    delayMinMs,
    delayMaxMs,
    media: media.media,
  });

  if (result.state === "ready") {
    revalidatePath("/");
    revalidatePath("/campaigns");
    redirect(`/campaigns/${result.campaignId}?create=ready&count=${result.recipientCount}`);
  }

  redirect(`/campaigns/new?create=${result.state}`);
}

async function parseCampaignMedia(
  formData: FormData,
): Promise<CampaignMediaParseResult> {
  const value = formData.get("image");

  if (!(value instanceof File) || value.size === 0) {
    return parsePersistedCampaignMedia(formData);
  }

  if (value.size > maxCampaignMediaSize) {
    return {
      state: "invalid",
      media: null,
    };
  }

  const buffer = Buffer.from(await value.arrayBuffer());

  return {
    state: "ready",
    media: {
      type: resolveEvolutionMediaType(value.type),
      fileName: value.name || "campaign-attachment",
      mimeType: value.type || "application/octet-stream",
      data: buffer.toString("base64"),
    },
  };
}

function parsePersistedCampaignMedia(
  formData: FormData,
): CampaignMediaParseResult {
  const parsed = persistedMediaSchema.safeParse({
    fileName: formData.get("persistedMediaFileName"),
    mimeType: formData.get("persistedMediaMimeType"),
    mediaType: formData.get("persistedMediaType"),
    data: formData.get("persistedMediaData"),
  });

  if (!parsed.success) {
    return {
      state: "ready",
      media: null,
    };
  }

  const mediaSize = Buffer.byteLength(parsed.data.data, "base64");

  if (mediaSize > maxCampaignMediaSize) {
    return {
      state: "invalid",
      media: null,
    };
  }

  return {
    state: "ready",
    media: {
      type: parsed.data.mediaType,
      fileName: parsed.data.fileName,
      mimeType: parsed.data.mimeType,
      data: parsed.data.data,
    },
  };
}

export async function deleteCampaignAction(formData: FormData) {
  const parsed = deleteCampaignSchema.safeParse({
    campaignId: formData.get("campaignId"),
  });

  if (!parsed.success) {
    redirect("/campaigns?delete=invalid");
  }

  if (!process.env.DATABASE_URL) {
    redirect("/campaigns?delete=missing-config");
  }

  try {
    const { db } = await import("@/db");
    await db
      .delete(campaigns)
      .where(eq(campaigns.id, parsed.data.campaignId));
  } catch (error) {
    console.error("Gagal menghapus campaign", {
      campaignId: parsed.data.campaignId,
      error: error instanceof Error ? error.message : "unknown_error",
    });

    redirect("/campaigns?delete=error");
  }

  revalidatePath("/");
  revalidatePath("/campaigns");
  redirect("/campaigns?delete=ready");
}

export async function approveCampaignAction(formData: FormData) {
  const parsed = approveCampaignSchema.safeParse({
    campaignId: formData.get("campaignId"),
  });

  if (!parsed.success) {
    redirect("/campaigns?approve=invalid");
  }

  const result = await approveCampaign(parsed.data.campaignId);

  revalidatePath("/");
  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${parsed.data.campaignId}`);
  redirect(
    `/campaigns/${parsed.data.campaignId}?approve=${result.state}&count=${result.queuedCount}`,
  );
}

export async function cancelCampaignAction(formData: FormData) {
  const parsed = campaignControlSchema.safeParse({
    campaignId: formData.get("campaignId"),
  });

  if (!parsed.success) {
    redirect("/campaigns?control=invalid");
  }

  const result = await cancelCampaign(parsed.data.campaignId);

  revalidatePath("/");
  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${parsed.data.campaignId}`);
  redirect(
    `/campaigns/${parsed.data.campaignId}?control=cancel-${result.state}&count=${result.affectedCount}`,
  );
}

export async function retryFailedCampaignRecipientsAction(formData: FormData) {
  const parsed = campaignControlSchema.safeParse({
    campaignId: formData.get("campaignId"),
  });

  if (!parsed.success) {
    redirect("/campaigns?control=invalid");
  }

  const result = await retryFailedCampaignRecipients(parsed.data.campaignId);

  revalidatePath("/");
  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${parsed.data.campaignId}`);
  redirect(
    `/campaigns/${parsed.data.campaignId}?control=retry-${result.state}&count=${result.affectedCount}`,
  );
}

export async function testCampaignAction(formData: FormData) {
  const parsed = testCampaignSchema.safeParse({
    campaignId: formData.get("campaignId"),
    number: formData.get("number"),
  });

  if (!parsed.success) {
    redirect("/campaigns?test=invalid");
  }

  const campaign = await getCampaign(parsed.data.campaignId);

  if (campaign.state !== "ready") {
    redirect(`/campaigns/${parsed.data.campaignId}?test=${campaign.state}`);
  }

  const text = `[TEST CAMPAIGN]\n${
    campaign.campaign.recipients[0]?.messageText ??
    campaign.campaign.messageTemplate
  }`;
  const media = await getCampaignMedia(parsed.data.campaignId);
  const mediaType = parseEvolutionMediaType(media?.mediaType ?? null);
  const result =
    mediaType && media?.mediaFileName && media.mediaMimeType && media.mediaData
      ? await sendTestMediaMessage({
        number: parsed.data.number,
        caption: text,
        fileName: media.mediaFileName,
        mimeType: media.mediaMimeType,
        media: media.mediaData,
        mediaType,
      })
      : await sendTestTextMessage({
        number: parsed.data.number,
        text,
      });

  revalidatePath(`/campaigns/${parsed.data.campaignId}`);
  redirect(`/campaigns/${parsed.data.campaignId}?test=${result.state}`);
}

async function getCampaignMedia(campaignId: string): Promise<{
  mediaType: string | null;
  mediaFileName: string | null;
  mediaMimeType: string | null;
  mediaData: string | null;
} | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { db } = await import("@/db");
  const [campaign] = await db
    .select({
      mediaType: campaigns.mediaType,
      mediaFileName: campaigns.mediaFileName,
      mediaMimeType: campaigns.mediaMimeType,
      mediaData: campaigns.mediaData,
    })
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  return campaign ?? null;
}

function resolveEvolutionMediaType(mimeType: string): EvolutionMediaType {
  if (mimeType === "image/gif") {
    return "document";
  }

  if (mimeType === "image/jpeg" || mimeType === "image/png" || mimeType === "image/webp") {
    return "image";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  if (mimeType.startsWith("audio/")) {
    return "audio";
  }

  return "document";
}

function parseEvolutionMediaType(value: string | null): EvolutionMediaType | null {
  if (
    value === "image" ||
    value === "video" ||
    value === "audio" ||
    value === "document"
  ) {
    return value;
  }

  return null;
}
