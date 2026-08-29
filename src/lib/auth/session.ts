export const authCookieName = "lead_dashboard_session";

export type AuthConfig =
  | {
      state: "ready";
      email: string;
      password: string;
      secret: string;
    }
  | {
      state: "missing-config";
    };

export function getAuthConfig(): AuthConfig {
  const email = process.env.DASHBOARD_AUTH_EMAIL?.trim();
  const password = process.env.DASHBOARD_AUTH_PASSWORD;

  if (!email || !password) {
    return {
      state: "missing-config",
    };
  }

  return {
    state: "ready",
    email,
    password,
    secret:
      process.env.DASHBOARD_AUTH_SECRET ??
      `${email}:${password}:lead-dashboard`,
  };
}

export async function createAuthSessionValue(
  email: string,
  secret: string,
): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();
  const signature = await signSessionPayload(normalizedEmail, secret);

  return `${encodeURIComponent(normalizedEmail)}.${signature}`;
}

export async function verifyAuthSessionValue(
  value: string | undefined,
  config: AuthConfig,
): Promise<boolean> {
  if (!value || config.state !== "ready") {
    return false;
  }

  const separatorIndex = value.lastIndexOf(".");

  if (separatorIndex === -1) {
    return false;
  }

  const encodedEmail = value.slice(0, separatorIndex);
  const signature = value.slice(separatorIndex + 1);

  if (!encodedEmail || !signature) {
    return false;
  }

  const email = decodeURIComponent(encodedEmail);

  if (email !== config.email.toLowerCase()) {
    return false;
  }

  const expectedValue = await createAuthSessionValue(config.email, config.secret);

  return value === expectedValue;
}

async function signSessionPayload(
  payload: string,
  secret: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));

  return toBase64Url(signature);
}

function toBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let value = "";

  for (const byte of bytes) {
    value += String.fromCharCode(byte);
  }

  return btoa(value).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
