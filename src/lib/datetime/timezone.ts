export const appTimeZone = "Asia/Jakarta";

export function createJakartaDateTimeFormatter(
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: appTimeZone,
    ...options,
  });
}
