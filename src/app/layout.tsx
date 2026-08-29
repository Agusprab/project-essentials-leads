import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Lead Dashboard",
  description: "Dashboard admin untuk scraping, lead, dan kampanye WhatsApp.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <body>{children}</body>
    </html>
  );
}
