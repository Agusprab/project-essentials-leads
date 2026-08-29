# Panduan Deploy VPS

## Gambaran Arsitektur

Deployment production yang disiapkan memakai Docker Compose dengan service:

- `app`: Next.js dashboard pada port internal `3000`
- `worker`: BullMQ worker untuk pengiriman campaign WhatsApp
- `migrate`: container sekali jalan untuk migrasi Drizzle
- `postgres`: database dashboard
- `redis`: queue campaign

Gosom API dan Evolution API tidak dibuat ulang di Compose ini. Untuk deployment awal, dashboard mengakses keduanya lewat host gateway Docker:

```text
Container dashboard
-> host Docker
-> port 8085 Gosom
-> port 8086 Evolution
```

## File Deploy

File yang dipakai:

- `Dockerfile`
- `compose.prod.yaml`
- `.dockerignore`
- `.env.production.example`

File `.env.production` harus dibuat di server dari contoh `.env.production.example`. Jangan commit `.env.production`.

## Persiapan VPS

Server saat ini sudah memiliki Docker dan Docker Compose, jadi bagian instalasi dapat dilewati. Jangan install ulang Docker jika tidak ada kebutuhan khusus karena bisa mengubah konfigurasi service lain.

Jika suatu saat memakai VPS kosong, install Docker dan plugin Compose di Ubuntu:

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Clone project ke server. Rekomendasi path:

```bash
git clone <repo-url> /home/ap/lead-dashboard
cd /home/ap/lead-dashboard
```

Jika tetap ingin memakai `/opt`, siapkan ownership dulu:

```bash
sudo mkdir -p /opt/lead-dashboard
sudo chown -R ap:ap /opt/lead-dashboard
git clone <repo-url> /opt/lead-dashboard
cd /opt/lead-dashboard
```

## Environment Production

Buat file env:

```bash
cp .env.production.example .env.production
nano .env.production
```

Minimal isi production:

```env
POSTGRES_DB=lead_dashboard
POSTGRES_USER=lead_dashboard
POSTGRES_PASSWORD=password_database_yang_kuat

DATABASE_URL=postgres://lead_dashboard:password_database_yang_kuat@postgres:5432/lead_dashboard
REDIS_URL=redis://redis:6379

GOSOM_API_URL=http://host.docker.internal:8085
EVOLUTION_API_URL=http://host.docker.internal:8086
EVOLUTION_INSTANCE=google-maps-sender
EVOLUTION_API_KEY=api_key_evolution

DASHBOARD_AUTH_EMAIL=admin@domain.com
DASHBOARD_AUTH_PASSWORD=password_login_yang_kuat
DASHBOARD_AUTH_SECRET=random_panjang_minimal_32_karakter
# Kosongkan untuk auto dari reverse proxy. Isi false jika sementara akses via http://IP:3004.
DASHBOARD_AUTH_COOKIE_SECURE=
WHATSAPP_TEST_NUMBER=628xxxxxxxxxx
```

`compose.prod.yaml` sudah menambahkan `extra_hosts: ["host.docker.internal:host-gateway"]` pada service `app` dan `worker`, sehingga URL di atas bisa dipakai di Linux Docker.

Untuk jangka panjang, opsi yang lebih bersih adalah memasukkan dashboard, Gosom, Evolution, dan Nginx Proxy Manager ke external Docker network yang sama. Untuk deployment pertama, host gateway lebih sedikit mengubah service yang sudah berjalan.

## Build dan Migrasi

Cek config Compose:

```bash
docker compose --env-file .env.production -f compose.prod.yaml config --quiet
```

Build image:

```bash
docker compose --env-file .env.production -f compose.prod.yaml build
```

Jalankan database dan Redis:

```bash
docker compose --env-file .env.production -f compose.prod.yaml up -d postgres redis
```

Jalankan migrasi:

```bash
docker compose --env-file .env.production -f compose.prod.yaml --profile migrate run --rm migrate
```

Jalankan app dan worker:

```bash
docker compose --env-file .env.production -f compose.prod.yaml up -d app worker
```

Cek status:

```bash
docker compose --env-file .env.production -f compose.prod.yaml ps
docker compose --env-file .env.production -f compose.prod.yaml logs -f app worker
```

Dashboard akan dipublish ke host pada port `3004`.

## Reverse Proxy

Server memakai Nginx Proxy Manager. Buat Proxy Host baru:

```text
Scheme:       http
Forward Host: 192.168.1.2
Forward Port: 3004
Websockets:   aktif
```

Aktifkan SSL certificate dari menu Nginx Proxy Manager. Setelah domain bekerja, batasi akses port `3004` dari luar jaringan memakai firewall.

Jika login dites langsung lewat `http://IP-VPS:3004`, browser akan menolak cookie `Secure`. Untuk mode test sementara itu, isi `DASHBOARD_AUTH_COOKIE_SECURE=false` di `.env.production`, lalu restart `app`. Setelah HTTPS via Nginx Proxy Manager aktif, kosongkan kembali atau isi `true`.

Opsi yang lebih bersih adalah menghubungkan container Nginx Proxy Manager dan `app` ke Docker network yang sama, lalu forward langsung ke nama service. Untuk itu perlu cek nama network Compose NPM terlebih dahulu.

## Update Aplikasi

Saat ada perubahan kode:

```bash
cd /opt/lead-dashboard
git pull
docker compose --env-file .env.production -f compose.prod.yaml build
docker compose --env-file .env.production -f compose.prod.yaml --profile migrate run --rm migrate
docker compose --env-file .env.production -f compose.prod.yaml up -d app worker
```

## Backup

Backup PostgreSQL:

```bash
docker compose \
  --env-file .env.production \
  -f compose.prod.yaml \
  exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' \
  > lead-dashboard-backup.sql
```

Restore PostgreSQL:

```bash
docker compose \
  --env-file .env.production \
  -f compose.prod.yaml \
  exec -T postgres \
  sh -c 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"' \
  < lead-dashboard-backup.sql
```

Backup yang paling penting adalah database PostgreSQL. Redis bisa ikut dibackup jika masih ada antrean campaign pending yang penting.

## Media Campaign

Gambar campaign tidak disimpan ke filesystem. Upload gambar maksimal 2 MB dikonversi ke base64 dan disimpan di kolom `campaigns.media_data` PostgreSQL bersama metadata `media_file_name`, `media_mime_type`, dan `media_type`.

Karena app dan worker sama-sama membaca PostgreSQL, tidak diperlukan shared volume media untuk MVP. Konsekuensinya ukuran database akan naik jika banyak campaign bergambar. Jika nanti volume pengiriman besar, penyimpanan media sebaiknya dipindah ke object storage atau volume bersama.

## Catatan Keamanan

- Jangan expose PostgreSQL dan Redis ke internet.
- Dashboard sebaiknya hanya lewat HTTPS.
- Gunakan password admin yang kuat.
- Gunakan `DASHBOARD_AUTH_SECRET` random panjang di production.
- Simpan `.env.production` hanya di server.
- Batasi akses Gosom API dan Evolution API dengan firewall atau network internal.

## Catatan Operasional

- App dan worker dibuat sebagai service terpisah agar pengiriman WhatsApp background tidak mengganggu dashboard.
- Jika campaign tidak terkirim, cek log `worker` lebih dulu.
- Jika daftar job scraping error, cek koneksi dari container `app` ke `GOSOM_API_URL`.
- Jika test WhatsApp gagal, cek `EVOLUTION_API_URL`, `EVOLUTION_INSTANCE`, `EVOLUTION_API_KEY`, dan status koneksi instance Evolution.
