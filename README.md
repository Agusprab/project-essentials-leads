# Lead Dashboard

Dashboard admin tunggal untuk pekerjaan scraping Gosom, normalisasi lead, dan kesiapan kampanye WhatsApp melalui Evolution API.

Dokumentasi implementasi fondasi UI ada di [docs/implementation.md](docs/implementation.md).

## Environment

Minimal env untuk menjalankan dashboard:

```bash
DATABASE_URL=postgres://...
REDIS_URL=redis://127.0.0.1:6380
GOSOM_API_URL=https://...
EVOLUTION_API_URL=https://...
EVOLUTION_INSTANCE=...
EVOLUTION_API_KEY=...
DASHBOARD_AUTH_EMAIL=admin@example.com
DASHBOARD_AUTH_PASSWORD=change-this-password
```

Opsional:

```bash
WHATSAPP_TEST_NUMBER=6281234567890
DASHBOARD_AUTH_SECRET=isi-random-panjang-untuk-sign-cookie
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Jalankan worker campaign di terminal terpisah saat ingin memproses antrean WhatsApp:

```bash
npm run worker:campaigns
```

Halaman dashboard dilindungi login. Credential diambil dari `DASHBOARD_AUTH_EMAIL` dan `DASHBOARD_AUTH_PASSWORD`.

## Dokumentasi

Lihat [docs/implementation.md](docs/implementation.md) untuk ringkasan fitur dan verifikasi.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
