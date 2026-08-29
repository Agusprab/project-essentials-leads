import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function DashboardIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h4A1.5 1.5 0 0 1 11 5.5v5A1.5 1.5 0 0 1 9.5 12h-4A1.5 1.5 0 0 1 4 10.5v-5ZM13 5.5A1.5 1.5 0 0 1 14.5 4h4A1.5 1.5 0 0 1 20 5.5v2A1.5 1.5 0 0 1 18.5 9h-4A1.5 1.5 0 0 1 13 7.5v-2ZM13 13.5a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5h-4a1.5 1.5 0 0 1-1.5-1.5v-5ZM4 16.5A1.5 1.5 0 0 1 5.5 15h4a1.5 1.5 0 0 1 1.5 1.5v2A1.5 1.5 0 0 1 9.5 20h-4A1.5 1.5 0 0 1 4 18.5v-2Z" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function SearchMapIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M9.5 18.5 4 20.5v-14l5.5-2 5 2 5.5-2v8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 4.5v14M14.5 6.5v4.25M18.25 18.25l2.25 2.25M19.5 15.5a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LeadsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M8 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM3.5 20v-1.25A4.75 4.75 0 0 1 8.25 14h1.5a4.75 4.75 0 0 1 4.75 4.75V20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M16.5 11.5h4M16.5 15.5h4M16.5 7.5h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function CampaignIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M4 12h3l9-5v10l-9-5H4ZM7 12v5a2 2 0 0 0 2 2h1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 9.5a3.5 3.5 0 0 1 0 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M18.25 13.25c.07-.4.07-.8 0-1.25l2-1.55-2-3.45-2.5 1a7 7 0 0 0-1.1-.65L14.25 4h-4.5l-.4 3.35c-.4.18-.77.4-1.1.65l-2.5-1-2 3.45 2 1.55a6.7 6.7 0 0 0 0 1.25l-2 1.55 2 3.45 2.5-1c.33.25.7.47 1.1.65l.4 3.35h4.5l.4-3.35c.4-.18.77-.4 1.1-.65l2.5 1 2-3.45-2-1.55Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M20 12a8 8 0 0 1-13.66 5.66L4 15M4 12A8 8 0 0 1 17.66 6.34L20 9M4 15v4h4M20 9V5h-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M5 7h14M10 11v6M14 11v6M8 7l.5 13h7L16 7M9.5 7l.75-3h3.5L14.5 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 4v10M8 10l4 4 4-4M5 20h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M20.5 3.5 10.75 13.25M20.5 3.5l-6.25 17-3.5-7.25-7.25-3.5 17-6.25Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
