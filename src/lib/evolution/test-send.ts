import {
  sendEvolutionImageMessage,
  sendEvolutionTextMessage,
} from "@/lib/evolution/client";

export type TestSendResult =
  | {
      state: "ready";
      messageId: string | null;
    }
  | {
      state: "missing-config" | "error";
      messageId: null;
    };

export async function sendTestTextMessage(input: {
  number: string;
  text: string;
  delay?: number;
}): Promise<TestSendResult> {
  return sendEvolutionTextMessage({
    number: input.number,
    text: input.text,
    delay: input.delay ?? 1000,
  });
}

export async function sendTestImageMessage(input: {
  number: string;
  caption: string;
  fileName: string;
  mimeType: string;
  media: string;
  delay?: number;
}): Promise<TestSendResult> {
  return sendEvolutionImageMessage({
    number: input.number,
    caption: input.caption,
    fileName: input.fileName,
    mimeType: input.mimeType,
    media: input.media,
    delay: input.delay ?? 1000,
  });
}

export function getDefaultTestNumber(): string {
  return process.env.WHATSAPP_TEST_NUMBER ?? "";
}
