"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement, ReactNode, SVGProps } from "react";
import {
  CampaignIcon,
  DashboardIcon,
  LeadsIcon,
  SearchMapIcon,
  SettingsIcon,
} from "@/components/ui/icons";
import { logoutAction } from "@/app/login/actions";

type NavigationItem = {
  href: string;
  label: string;
  icon: (props: SVGProps<SVGSVGElement>) => ReactElement;
  disabled?: boolean;
};

const navigationItems: NavigationItem[] = [
  { href: "/", label: "Dashboard Overview", icon: DashboardIcon },
  { href: "/scraping", label: "Scraping Jobs", icon: SearchMapIcon },
  { href: "/leads", label: "Lead Database", icon: LeadsIcon },
  { href: "/campaigns", label: "Kampanye WhatsApp", icon: CampaignIcon },
  { href: "/settings", label: "Pengaturan & API", icon: SettingsIcon },
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#0F172A] selection:bg-blue-500 selection:text-white">
      <div className="flex min-h-screen">
        {/* Sidebar Desktop */}
        <aside className="hidden w-[260px] shrink-0 flex-col justify-between border-r border-[#1E293B] bg-[#0F172A] px-4 py-5 text-white lg:flex">
          <div className="space-y-6">
            {/* App Brand Logo */}
            <Link
              href="/"
              className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-white/5"
            >
              <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-bold text-white shadow-md shadow-blue-500/20 ring-1 ring-white/20">
                LD
              </div>
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold tracking-tight text-white">
                  Lead Dashboard
                </span>
                <span className="block truncate text-xs font-medium text-[#94A3B8]">
                  Admin Panel v1.0
                </span>
              </div>
            </Link>

            {/* Navigation Menu */}
            <nav aria-label="Navigasi utama" className="space-y-1">
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
                Menu Utama
              </p>
              {navigationItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <NavLink key={item.href} item={item} isActive={isActive} />
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer Widget */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 backdrop-blur">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-xs font-medium text-slate-300">
                Sistem Aktif
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Gosom & Evolution API Siap
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header Bar */}
          <header className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-white/80 px-4 py-3.5 backdrop-blur-md sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Mobile Icon Badge */}
                <div className="grid size-9 place-items-center rounded-lg bg-blue-600 text-xs font-bold text-white shadow-sm lg:hidden">
                  LD
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[#0F172A]">
                    Ruang Kerja Admin
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    Kelola scraping, pembersihan lead, dan pengiriman pesan
                  </p>
                </div>
              </div>

              {/* Admin Actions / Logout */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
                  <span className="size-2 rounded-full bg-blue-500"></span>
                  <span className="font-medium text-slate-700">Administrator</span>
                </div>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3.5 text-xs font-semibold text-[#334155] shadow-xs transition hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100"
                  >
                    <span>Keluar</span>
                  </button>
                </form>
              </div>
            </div>
          </header>

          {/* Navigation Mobile Horizontal Bar */}
          <div className="flex overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 text-xs lg:hidden">
            <div className="flex min-w-full space-x-2">
              {navigationItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`whitespace-nowrap rounded-md px-3 py-1.5 font-medium transition ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Main Workspace Body */}
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

function NavLink({
  item,
  isActive,
}: {
  item: NavigationItem;
  isActive: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.disabled ? "#" : item.href}
      aria-disabled={item.disabled ? "true" : undefined}
      className={`group flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
        isActive
          ? "bg-blue-600/15 text-blue-400 font-semibold shadow-xs ring-1 ring-blue-500/30"
          : "text-[#94A3B8] hover:bg-white/5 hover:text-white"
      } aria-disabled:pointer-events-none aria-disabled:opacity-40`}
    >
      <span
        className={`grid size-7 place-items-center rounded-md transition-colors ${
          isActive
            ? "bg-blue-600 text-white shadow-xs"
            : "bg-white/5 text-[#94A3B8] group-hover:bg-white/10 group-hover:text-white"
        }`}
      >
        <Icon className="size-4" />
      </span>
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

