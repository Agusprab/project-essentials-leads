import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { loginAction } from "@/app/login/actions";
import {
  authCookieName,
  getAuthConfig,
  verifyAuthSessionValue,
} from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams;
  const config = getAuthConfig();
  const cookieStore = await cookies();
  const isAuthenticated = await verifyAuthSessionValue(
    cookieStore.get(authCookieName)?.value,
    config,
  );
  const message = getLoginMessage(params.error);

  if (isAuthenticated) {
    redirect("/");
  }

  return (
    <main className="relative grid min-h-screen place-items-center bg-[#F6F8FB] px-4 py-12 text-slate-900 selection:bg-blue-500 selection:text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(37,99,235,0.08),transparent_50%)]" />
      <section className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-7 shadow-lg shadow-slate-200/50">
        <div className="flex items-center gap-3.5 border-b border-slate-100 pb-5">
          <div className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-base font-bold text-white shadow-md shadow-blue-500/25 ring-1 ring-white/20">
            LD
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Admin Gateway
            </h1>
            <p className="text-xs font-medium text-slate-500">Lead Dashboard SaaS Platform</p>
          </div>
        </div>

        {message ? (
          <div
            role="status"
            className={`mt-5 rounded-xl border px-4 py-3 text-xs sm:text-sm font-medium shadow-2xs ${message.className}`}
          >
            {message.text}
          </div>
        ) : null}

        {config.state !== "ready" ? (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800 font-medium">
            ⚠️ Kredensial autentikasi belum dikonfigurasi. Isi <code className="font-mono text-amber-900 bg-amber-100 px-1 py-0.5 rounded">DASHBOARD_AUTH_EMAIL</code> dan <code className="font-mono text-amber-900 bg-amber-100 px-1 py-0.5 rounded">DASHBOARD_AUTH_PASSWORD</code> di <code className="font-mono text-amber-900 bg-amber-100 px-1 py-0.5 rounded">.env.local</code>.
          </div>
        ) : null}

        <form action={loginAction} className="mt-6 space-y-4">
          <label className="block">
            <span className="block text-xs font-semibold text-slate-700">
              Email Administrator
            </span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="admin@example.com"
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </label>

          <label className="block">
            <span className="block text-xs font-semibold text-slate-700">
              Kata Sandi / Password
            </span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </label>

          <button
            type="submit"
            disabled={config.state !== "ready"}
            className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-xs sm:text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 active:bg-blue-800 disabled:pointer-events-none disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
          >
            Masuk ke Ruang Kerja
          </button>
        </form>
      </section>
    </main>
  );
}


function getLoginMessage(
  state: string | string[] | undefined,
): { text: string; className: string } | null {
  const normalizedState = Array.isArray(state) ? state[0] : state;

  if (!normalizedState) {
    return null;
  }

  if (normalizedState === "missing-config") {
    return {
      text: "Login belum dikonfigurasi di environment.",
      className: "border-[#FEDF89] bg-[#FFFAEB] text-[#B45309]",
    };
  }

  if (normalizedState === "invalid") {
    return {
      text: "Email atau password salah.",
      className: "border-[#FECDCA] bg-[#FEF3F2] text-[#B42318]",
    };
  }

  return null;
}
