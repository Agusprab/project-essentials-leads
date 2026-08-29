import { z } from "zod";

const structuredAddressSchema = z.object({
  street: z.string().optional(),
  borough: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
});

export function formatLeadAddress(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!looksLikeJsonObject(trimmed)) {
    return trimmed;
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);
    const address = structuredAddressSchema.safeParse(parsed);

    if (!address.success) {
      return trimmed;
    }

    const parts = [
      address.data.street,
      address.data.borough,
      address.data.city,
      address.data.state,
      address.data.postal_code,
      address.data.country,
    ]
      .map((part) => part?.trim())
      .filter((part): part is string => Boolean(part));

    return parts.length > 0 ? parts.join(", ") : trimmed;
  } catch {
    return trimmed;
  }
}

function looksLikeJsonObject(value: string): boolean {
  return value.startsWith("{") && value.endsWith("}");
}
