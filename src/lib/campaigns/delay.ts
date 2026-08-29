export type CampaignDelayConfig = {
  delayMs: number;
  delayMode: string;
  delayMinMs: number;
  delayMaxMs: number;
};

export function resolveCampaignDelayMs(config: CampaignDelayConfig): number {
  if (config.delayMode !== "random") {
    return config.delayMs;
  }

  const min = Math.min(config.delayMinMs, config.delayMaxMs);
  const max = Math.max(config.delayMinMs, config.delayMaxMs);

  return Math.floor(Math.random() * (max - min + 1)) + min;
}
