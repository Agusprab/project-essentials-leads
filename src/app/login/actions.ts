"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  authCookieName,
  createAuthSessionValue,
  getAuthConfig,
} from "@/lib/auth/session";

const sessionMaxAgeSeconds = 60 * 60 * 24 * 7;

export async function loginAction(formData: FormData) {
  const config = getAuthConfig();

  if (config.state !== "ready") {
    redirect("/login?error=missing-config");
  }

  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();

  if (email !== config.email.toLowerCase() || password !== config.password) {
    redirect("/login?error=invalid");
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: authCookieName,
    value: await createAuthSessionValue(config.email, config.secret),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionMaxAgeSeconds,
  });

  redirect("/");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(authCookieName);

  redirect("/login");
}
