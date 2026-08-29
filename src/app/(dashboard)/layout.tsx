import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import {
  authCookieName,
  getAuthConfig,
  verifyAuthSessionValue,
} from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const isAuthenticated = await verifyAuthSessionValue(
    cookieStore.get(authCookieName)?.value,
    getAuthConfig(),
  );

  if (!isAuthenticated) {
    redirect("/login");
  }

  return <AppShell>{children}</AppShell>;
}
