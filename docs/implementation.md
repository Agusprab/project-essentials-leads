# Implementasi Fondasi Dashboard

## Ringkasan

Fondasi UI sudah dipindahkan ke struktur `src/` agar mengikuti arahan repository dan App Router Next.js:

```text
src/
  app/
    (dashboard)/
      campaigns/
      leads/
      scraping/
      settings/
    login/
  components/
    dashboard/
    layout/
    ui/
  lib/
    dashboard/
  db/
```

Halaman utama sekarang menampilkan dashboard ringkasan berbasis Server Component. Tidak ada `useEffect` karena data dashboard dibaca di server melalui `getDashboardOverview()`.
Route dashboard berada di route group `(dashboard)` agar layout sidebar terpisah dari halaman login.

## Perilaku Saat Ini

- Jika `DATABASE_URL` belum tersedia, dashboard tetap render dan menampilkan pesan konfigurasi.
- Jika database gagal diakses, UI menampilkan state error umum tanpa membocorkan detail internal.
- Semua halaman dashboard dilindungi middleware login. Credential sederhana diambil dari `DASHBOARD_AUTH_EMAIL` dan `DASHBOARD_AUTH_PASSWORD`.
- Session login disimpan sebagai cookie `httpOnly` yang ditandatangani. `DASHBOARD_AUTH_SECRET` bersifat opsional, tetapi direkomendasikan di production.
- Halaman `/login` tidak memakai sidebar dan menyediakan form login sederhana.
- Halaman `/scraping` membaca daftar job dari Gosom API secara server-side melalui `GOSOM_API_URL`.
- Response Gosom divalidasi dengan Zod dan mendukung bentuk array langsung atau envelope `jobs`, `Jobs`, dan `data`.
- Download CSV melewati route internal `/api/gosom/jobs/[id]/download`, sehingga browser tidak memanggil Gosom API langsung.
- Scraping job sekarang bisa dibuat dari form dashboard dan dikirim server-side ke Gosom API.
- Form job baru dipisah ke `/scraping/new`.
- Form job baru menyediakan pilihan kota besar Indonesia yang otomatis mengisi latitude/longitude, serta opsi custom titik lokasi.
- Durasi form job dikirim sebagai detik (`max_time`) agar tidak memicu overflow duration pada Gosom API.
- Scraping job bisa dihapus dari Gosom API; data lokal dengan `external_job_id` yang sama ikut dibersihkan.
- Tombol `Sinkronkan` menjalankan Server Action untuk upsert job Gosom ke tabel `scrape_jobs` berdasarkan `external_job_id`.
- Tombol `Impor` pada job selesai mengunduh CSV server-side, parsing CSV, cleaning field utama, lalu menyimpan lead dalam transaction.
- Alamat JSON dari `complete_address` diformat menjadi teks alamat normal agar detail lead mudah dibaca.
- Import lead idempotent per job menggunakan `source_row_key`; duplikat ditandai dengan `duplicate_of_lead_id` dan `duplicate_reason`.
- Halaman `/leads` membaca database server-side dengan search, filter, dan pagination berbasis query string.
- Filter Leads mendukung job scraping, kategori, lokasi, kondisi website, telepon, cleaning, dan kelayakan WhatsApp.
- Test unit awal tersedia untuk CSV parser, format alamat JSON, normalisasi nomor Indonesia, website, email, dan status kelayakan WhatsApp.
- Lead bisa dihapus per baris dengan konfirmasi browser sebelum form submit.
- Lead bisa dipilih dengan checkbox dan dihapus bulk per halaman.
- Nama lead dan tombol detail membuka halaman `/leads/[id]` untuk melihat field bersih, status, audit duplikat, dan raw data sumber.
- Halaman `/campaigns` sudah aktif untuk melihat draft campaign, jumlah lead eligible, dan ringkasan status recipient.
- Halaman `/campaigns/new` membuat draft campaign dari lead dengan `cleaning_status=clean` dan `whatsapp_status=eligible`, dengan filter kandidat berdasarkan search, job, kategori, lokasi, website, dan histori campaign.
- Form campaign baru dipisah menjadi card pengaturan campaign, delay pengiriman, gambar campaign, filter kandidat, dan daftar kandidat agar alur pembuatan lebih mudah dibaca.
- Campaign baru memakai checkbox select lead sehingga admin bisa memilih penerima spesifik sebelum draft dibuat.
- Campaign recipient tetap unik per campaign dan lead, tetapi nomor WhatsApp yang sama boleh masuk lebih dari sekali jika lead bisnisnya berbeda. Ini memudahkan dummy test dan kasus beberapa cabang/bisnis memakai nomor kontak yang sama.
- Template pesan campaign menyediakan tombol token data lead: `{businessName}`, `{category}`, `{address}`, `{website}`, `{websiteDomain}`, `{email}`, `{phone}`, `{rating}`, `{reviewCount}`, `{latitude}`, `{longitude}`, dan `{mapsUrl}`.
- Campaign baru mendukung upload gambar `image/*` maksimal 2 MB. Jika gambar diisi, worker mengirim media gambar dengan caption dari template pesan.
- Campaign baru mendukung delay tetap dari preset, delay tetap custom dalam detik, dan delay random. Delay random disimpan sebagai rentang detik lalu dihitung ulang per recipient saat worker memproses antrean.
- Detail campaign `/campaigns/[id]` menampilkan template pesan, metrik recipient, dan daftar recipient per lead.
- Detail campaign memiliki tombol approval eksplisit untuk memasukkan recipient ke antrean pengiriman.
- Detail campaign memiliki kontrol `Batalkan campaign` untuk menghentikan recipient yang belum terkirim.
- Detail campaign memiliki kontrol `Retry gagal` untuk memasukkan ulang recipient dengan status gagal ke antrean.
- Detail campaign menampilkan status antrean BullMQ: waiting, active, delayed, dan failed jobs.
- Detail campaign menyediakan filter recipient berdasarkan status dan menampilkan attempt, waktu antre/dicoba/terkirim, serta error singkat.
- Worker mengklaim recipient secara atomik sebelum memanggil Evolution API agar retry atau worker paralel tidak memproses recipient yang sama.
- Pengiriman campaign berjalan lewat BullMQ queue `campaign-send` dan worker `npm run worker:campaigns`.
- Evolution API dipanggil server-side memakai body flat `sendText` untuk teks dan `sendMedia` untuk campaign bergambar pada instance yang dikonfigurasi di env.
- Recipient campaign idempotent melalui job id `campaign-recipient-{recipientId}` dan unique index per campaign/lead.
- Detail lead menampilkan histori campaign dan status pengiriman agar admin tahu apakah lead sudah pernah masuk campaign atau pernah dikirim pesan.
- Halaman `/settings` memvalidasi status PostgreSQL, Redis, Gosom API, dan Evolution API tanpa mengekspos API key atau password.
- Halaman `/settings` menyediakan form test kirim WhatsApp ke nomor sendiri.
- Detail campaign menyediakan test campaign ke nomor sendiri memakai preview pesan recipient pertama bila tersedia.
- Sidebar memakai ikon, top bar disederhanakan, dan tampilan dashboard dipoles agar lebih mudah dipindai.
- Metrik dashboard membaca tabel `scrape_jobs` dan `leads` melalui Drizzle:
  - total scraping jobs
  - job berjalan
  - total leads
  - lead dengan nomor mobile
  - lead duplikat atau tidak lengkap
  - lead siap kampanye

## Batasan

Pengiriman campaign membutuhkan proses worker terpisah dan konfigurasi `REDIS_URL`, `EVOLUTION_API_URL`, `EVOLUTION_INSTANCE`, serta `EVOLUTION_API_KEY`. Nomor default untuk test kirim dapat diisi lewat `WHATSAPP_TEST_NUMBER`.
Login membutuhkan `DASHBOARD_AUTH_EMAIL` dan `DASHBOARD_AUTH_PASSWORD`. Di production, isi juga `DASHBOARD_AUTH_SECRET` dengan string random panjang.
Jika approval campaign menampilkan antrean Redis belum bisa diakses, pastikan service Redis pada `REDIS_URL` sudah aktif lalu restart proses `npm run dev` dan worker agar koneksi lama tidak tertahan.

## Verifikasi

Jalankan:

```bash
npm run lint
npm run test
npm run build
npm run db:generate
```

Untuk menjalankan worker campaign:

```bash
npm run worker:campaigns
```
