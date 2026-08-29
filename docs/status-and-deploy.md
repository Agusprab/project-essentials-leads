# Status Implementasi dan Catatan Deploy

## Ringkasan

Lead Dashboard saat ini sudah menjadi aplikasi admin tunggal untuk mengelola scraping Google Maps lewat Gosom API, menyimpan lead ke database sendiri, membersihkan data kontak, dan menyiapkan campaign WhatsApp lewat Evolution API.

Scope aplikasi tetap fokus:

- satu admin
- satu dashboard lead
- integrasi Gosom API
- integrasi Evolution API
- import CSV hasil scraping
- cleaning dan deduplikasi lead
- draft campaign dan pengiriman lewat queue

Fitur CRM umum seperti multi-user, billing, Chatwoot, n8n, AI agent, dan multi-tenant belum ditambahkan agar MVP tetap ringan.

## Yang Sudah Dibuat

### Fondasi Aplikasi

- Next.js App Router dengan struktur `src/`.
- Layout dashboard dengan sidebar dan top bar.
- Halaman login terpisah dari layout dashboard.
- Proteksi halaman dashboard memakai cookie session `httpOnly`.
- Konfigurasi auth dari environment:
  - `DASHBOARD_AUTH_EMAIL`
  - `DASHBOARD_AUTH_PASSWORD`
  - `DASHBOARD_AUTH_SECRET` opsional tetapi disarankan untuk production.

### Dashboard

- Halaman overview membaca metrik dari database.
- Metrik yang tersedia:
  - total scraping jobs
  - job berjalan
  - total leads
  - lead dengan nomor mobile
  - lead duplikat atau tidak lengkap
  - lead siap campaign

### Scraping Jobs

- Halaman daftar job Gosom.
- Create job scraping dari dashboard.
- Form create job server-side ke Gosom API, bukan dari browser langsung.
- Preset kota scraping diperluas menjadi daftar kota besar dan strategis Indonesia.
- Field kota bisa dicari dan dipilih lewat input searchable.
- Latitude dan longitude otomatis terisi dari preset kota.
- Opsi custom koordinat tetap tersedia.
- Download CSV lewat route internal aplikasi.
- Delete job dari Gosom.
- Sinkronisasi job Gosom ke tabel `scrape_jobs` secara idempotent memakai `external_job_id`.
- Respons list Gosom kosong seperti `{}`, body kosong, atau `204` sekarang dianggap sebagai daftar kosong, bukan error.

### Leads

- Import CSV hasil job selesai.
- Parsing CSV server-side.
- Cleaning deterministic untuk:
  - trim field
  - empty string menjadi `null`
  - normalisasi nomor Indonesia
  - klasifikasi mobile/landline
  - normalisasi email
  - normalisasi website dan domain
  - status cleaning
  - status kelayakan WhatsApp
- Raw data sumber tetap disimpan di `raw_data`.
- Import lead memakai transaction.
- Import idempotent per job memakai `source_row_key`.
- Duplikat ditandai, bukan diam-diam dibuang.
- Halaman Leads mendukung search, filter, pagination, detail lead, delete single, dan delete bulk.

### Campaign WhatsApp

- Tabel `campaigns` dan `campaign_recipients`.
- Halaman daftar campaign.
- Halaman buat draft campaign.
- Kandidat campaign hanya dari lead `clean` dan WhatsApp `eligible`.
- Filter kandidat campaign berdasarkan search, job, kategori, lokasi, website, dan histori campaign.
- Admin bisa memilih recipient spesifik dengan checkbox.
- Template pesan mendukung token data lead.
- Campaign mendukung:
  - teks saja
  - gambar dengan caption
  - delay tetap
  - delay custom
  - delay random
- Detail campaign menampilkan recipient, status, attempt, waktu, dan error singkat.
- Approval campaign eksplisit sebelum masuk queue.
- Cancel campaign.
- Retry recipient gagal.
- Worker BullMQ untuk pengiriman background.
- Payload Evolution API memakai format flat untuk `sendText` sesuai Evolution API v2.3.7.
- API key Evolution tetap server-side.

### Settings

- Halaman status koneksi:
  - PostgreSQL
  - Redis
  - Gosom API
  - Evolution API
- Nilai credential dan secret tidak ditampilkan mentah.
- Form test kirim WhatsApp ke nomor sendiri.

### Stabilitas yang Baru Diperbaiki

- Tanggal terakhir campaign di form campaign dibuat aman untuk boundary Server Component ke Client Component.
- Input custom delay campaign dibuat tetap controlled saat user menghapus isi field sementara.
- Server Action login dilewatkan oleh Proxy khusus untuk submit `/login`, agar Next.js tidak menerima respons action yang rusak.
- List job Gosom kosong setelah delete tidak lagi dianggap error.
- Searchable city preset sudah menggantikan dropdown kota biasa.

## Environment yang Wajib

Contoh `.env.local` untuk development:

```env
DATABASE_URL=postgres://lead_dashboard:lead_dashboard_dev_password@127.0.0.1:5433/lead_dashboard
REDIS_URL=redis://127.0.0.1:6380
GOSOM_API_URL=http://192.168.1.2:8085
EVOLUTION_API_URL=http://192.168.1.2:8086
EVOLUTION_INSTANCE=google-maps-sender
EVOLUTION_API_KEY=isi_api_key
DASHBOARD_AUTH_EMAIL=admin@example.com
DASHBOARD_AUTH_PASSWORD=ganti_password_ini
DASHBOARD_AUTH_SECRET=isi_random_panjang
WHATSAPP_TEST_NUMBER=6281234567890
```

Jangan commit `.env.local`, API key, password database, file CSV hasil scraping, atau data session WhatsApp.

## Verifikasi Lokal

Perintah yang terakhir digunakan untuk validasi:

```bash
npm run lint
npm test
npm run build
npm run db:generate
```

Untuk worker campaign:

```bash
npm run worker:campaigns
```

## Masukan Deploy ke VPS

Target production yang paling praktis adalah Docker Compose di Ubuntu VPS.

### 1. Siapkan Service

Minimal service production:

- `app`: Next.js dashboard
- `worker`: proses `npm run worker:campaigns`
- `postgres`: database dashboard sendiri
- `redis`: queue BullMQ

Gosom API dan Evolution API boleh berjalan di server yang sama atau server lain, tetapi URL-nya tetap harus lewat environment variable.

### 2. Gunakan Environment Production

Di VPS, siapkan file env production, misalnya `.env.production` atau env file Compose:

```env
NODE_ENV=production
DATABASE_URL=postgres://user:password@postgres:5432/lead_dashboard
REDIS_URL=redis://redis:6379
GOSOM_API_URL=http://host.docker.internal:8085
EVOLUTION_API_URL=http://host.docker.internal:8086
EVOLUTION_INSTANCE=google-maps-sender
EVOLUTION_API_KEY=isi_api_key_production
DASHBOARD_AUTH_EMAIL=admin@domain.com
DASHBOARD_AUTH_PASSWORD=password_panjang
DASHBOARD_AUTH_SECRET=random_32_karakter_atau_lebih
WHATSAPP_TEST_NUMBER=628xxxxxxxxxx
```

Untuk production, gunakan password database dan `DASHBOARD_AUTH_SECRET` yang kuat. Jangan pakai password development.

### 3. Jalankan Migrasi Database

Setelah image app siap dan `DATABASE_URL` mengarah ke database production, jalankan:

```bash
npm run db:migrate
```

Jalankan migrasi hanya ke database yang sudah dipastikan benar.

### 4. Jalankan App dan Worker Terpisah

App Next.js dan worker campaign sebaiknya menjadi container/proses berbeda:

```bash
npm run start
npm run worker:campaigns
```

Alasannya, proses web melayani dashboard, sedangkan worker memproses antrean WhatsApp. Jika worker bermasalah, dashboard tidak harus ikut mati.

### 5. Reverse Proxy dan HTTPS

Server memakai Nginx Proxy Manager. Dengan `compose.prod.yaml`, dashboard dipublish ke host pada port `3004`.

Konfigurasi Proxy Host:

```text
Scheme:       http
Forward Host: 192.168.1.2
Forward Port: 3004
Websockets:   aktif
```

Rekomendasi:

- expose dashboard hanya lewat HTTPS
- pasang domain seperti `leads.domain.com`
- jangan expose PostgreSQL dan Redis ke internet
- jika Gosom/Evolution satu server tetapi beda Compose, pakai `host.docker.internal` dengan host gateway
- jika beda server, batasi akses dengan firewall/VPN

### 6. Backup

Backup yang penting:

- PostgreSQL dashboard
- data volume Redis jika antrean pending masih penting
- konfigurasi Evolution API dan session WhatsApp

CSV scraping tidak perlu disimpan permanen di repo. Data pentingnya sudah masuk database saat import.

Gambar campaign saat ini disimpan sebagai base64 di PostgreSQL, bukan di folder upload lokal. Karena itu app dan worker belum membutuhkan shared volume media.

### 7. Monitoring Minimal

Pantau:

- log app Next.js
- log worker campaign
- status Redis
- ukuran database PostgreSQL
- jumlah recipient `failed`
- koneksi Evolution instance

Untuk MVP, log Docker Compose sudah cukup. Setelah traffic meningkat, baru pertimbangkan monitoring yang lebih lengkap.

## Catatan Lanjutan

Sebelum masuk production serius, pekerjaan berikut layak diprioritaskan:

- membuat `Dockerfile` production untuk Next.js app
- menambahkan service `app` dan `worker` ke `compose.yaml`
- menambahkan dokumentasi backup/restore PostgreSQL
- menambahkan rate limit atau guard tambahan untuk endpoint login
- menambahkan halaman audit import agar duplikat dan hasil cleaning lebih mudah diperiksa
- menambahkan test end-to-end ringan untuk login, create job form, dan campaign draft
