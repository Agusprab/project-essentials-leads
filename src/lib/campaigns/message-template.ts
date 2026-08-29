export type CampaignTemplateLead = {
  businessName: string;
  category: string | null;
  address: string | null;
  website: string | null;
  websiteDomain: string | null;
  phoneNormalized: string;
  emails: string[];
  reviewRating: number | null;
  reviewCount: number | null;
  latitude: number | null;
  longitude: number | null;
  mapsUrl: string | null;
};

export const campaignTemplateTokens = [
  {
    token: "businessName",
    label: "Nama bisnis",
  },
  {
    token: "category",
    label: "Kategori",
  },
  {
    token: "address",
    label: "Alamat",
  },
  {
    token: "website",
    label: "Website",
  },
  {
    token: "websiteDomain",
    label: "Domain",
  },
  {
    token: "email",
    label: "Email pertama",
  },
  {
    token: "phone",
    label: "Nomor WA",
  },
  {
    token: "rating",
    label: "Rating",
  },
  {
    token: "reviewCount",
    label: "Jumlah review",
  },
  {
    token: "latitude",
    label: "Latitude",
  },
  {
    token: "longitude",
    label: "Longitude",
  },
  {
    token: "mapsUrl",
    label: "Google Maps",
  },
] as const;

const tokenGetters: Record<string, (lead: CampaignTemplateLead) => string> = {
  businessName: (lead) => lead.businessName,
  category: (lead) => lead.category ?? "",
  address: (lead) => lead.address ?? "",
  website: (lead) => lead.website ?? "",
  websiteDomain: (lead) => lead.websiteDomain ?? "",
  email: (lead) => lead.emails[0] ?? "",
  phone: (lead) => lead.phoneNormalized,
  rating: (lead) => lead.reviewRating?.toString() ?? "",
  reviewCount: (lead) => lead.reviewCount?.toString() ?? "",
  latitude: (lead) => lead.latitude?.toString() ?? "",
  longitude: (lead) => lead.longitude?.toString() ?? "",
  mapsUrl: (lead) => lead.mapsUrl ?? "",
};

const supportedTokenPattern = new RegExp(
  `\\{(${campaignTemplateTokens.map((item) => item.token).join("|")})\\}`,
  "g",
);

export function renderCampaignMessage(
  template: string,
  lead: CampaignTemplateLead,
): string {
  return template.replace(supportedTokenPattern, (_, key) =>
    tokenGetters[key]?.(lead) ?? "",
  );
}
