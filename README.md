# Andrea Portfolio

Portofolio pribadi yang dibangun dengan **Next.js (React) + TypeScript**, diekspor sebagai situs statis dan dihosting di GitHub Pages. Kontennya diatur lewat CMS lokal yang berjalan di laptop.

## Stack

- **Next.js 16** (App Router, `output: "export"`): `next build` menghasilkan HTML, CSS, dan JS statis di `out/`. Halaman sudah berisi teks lengkap sejak awal, jadi tetap terbaca mesin pencari tanpa server.
- **React 19 + TypeScript**: tiap bagian halaman adalah komponen di `components/`. Bagian yang interaktif (lanyard, menu, video, dialog) adalah client component; sisanya dirender statis saat build.
- **Halaman per proyek** di `/projects/<id>/` (`app/projects/[id]/page.tsx`), dibuat otomatis untuk setiap proyek di konten.
- **Lenis** untuk smooth scroll di desktop (mati jika pengunjung memakai mode kurangi gerakan), dan **suara antarmuka** yang dibuat dengan Web Audio di `lib/sound.ts`: mati secara default, dinyalakan lewat tombol speaker di navbar.
- **CSS biasa** di `app/globals.css`, tanpa framework. Font (Bricolage Grotesque dan Archivo) dimuat lewat `next/font`, jadi diunduh saat build dan disajikan dari situs sendiri.
- **CMS lokal** (Node.js, tanpa dependency) di `cms/` dan `admin/`.

## Menjalankan

Butuh **Node.js 20.9 atau lebih baru**.

```sh
npm install        # sekali saja
npm run cms        # editor konten + preview langsung
npm run dev        # preview saja, tanpa editor
npm run build      # build statis ke out/
npm test           # tes CMS dan render halaman
npm run typecheck  # pemeriksaan TypeScript
```

`npm run cms` membuka dua server:

- Editor: http://127.0.0.1:4174/admin/
- Preview: http://127.0.0.1:4175/ (berubah otomatis setiap kali konten disimpan)
- Hentikan keduanya dengan `Ctrl+C`.
- Jika port terpakai: `CMS_PORT=4176 PREVIEW_PORT=4177 npm run cms`.

CMS harus dibuka dari server ini. Membuka `admin/index.html` langsung tidak menyediakan API untuk menyimpan file.

## Struktur

```text
app/            layout.tsx (font, metadata), page.tsx, projects/[id]/page.tsx, globals.css
components/     Portfolio (susunan halaman), Hero, Lanyard, Nav, Work, Dialog, ...
lib/            content.ts (tipe + validasi konten), media.tsx (helper gambar), hooks.ts, sound.ts
content/        portfolio.json, sumber semua teks dan daftar media
public/         file yang disajikan apa adanya: assets/images, assets/videos, CNAME
cms/            server CMS, penyimpanan, validasi (schema.mjs), tes
admin/          tampilan editor CMS
```

## Mengisi konten

1. Pilih bagian di navigasi CMS.
2. Edit teks, tambah atau hapus item, dan gunakan panah untuk mengubah urutannya.
3. Pilih foto/logo/screenshot dari pustaka media atau unggah gambar PNG, JPG, WebP, atau GIF (maksimal 10 MB).
4. Klik **Simpan perubahan** (atau `Cmd/Ctrl+S`).
5. Klik **Lihat portfolio** untuk memeriksa hasilnya di preview.
6. Commit dan push perubahan lewat Git untuk memperbarui website online.

Urutan proyek di halaman mengikuti urutan daftar proyek, begitu juga tombol proyek sebelum/berikutnya di halaman proyek. Setiap proyek otomatis punya halaman sendiri di `/projects/<id>/`, jadi ID proyek ikut menjadi alamat halamannya. Gambar pertama tiap proyek dipakai sebagai poster video (tampil utuh mengikuti rasionya) dan thumbnail kotak yang muncul saat kursor di atas daftar proyek serta di tombol sebelum/berikutnya. Tombol **Atur posisi** mengatur potongan thumbnail itu; pada foto profil tombol itu mengatur foto di kartu ID (lanyard) di bagian atas, dan pada sertifikat mengatur gambar di kartu. Kartu ID mengambil nama dari profil serta jabatan dan perusahaan dari pengalaman paling atas. Tautan proyek bisa diarahkan ke repositori atau demo masing-masing.

Untuk menampilkan video perkenalan, isi **Video perkenalan** pada item proyek dengan URL HTTPS langsung ke file `.mp4`/`.webm`. Alternatifnya, letakkan file di `public/assets/videos/` dan isi path seperti `assets/videos/nama-proyek.mp4`. CMS belum mengunggah video otomatis; jika memakai file lokal, commit file video bersama perubahan konten. Saat video terisi, video diputar tanpa suara ketika proyeknya terlihat di layar (kecuali pengunjung memakai mode kurangi gerakan atau hemat data), dan tombol **Watch video** membuka halaman proyek dengan video bersuara. Jika video kosong, halaman proyek menampilkan semua gambarnya.

**Simpan bersifat lokal, bukan publish online.** CMS tidak menjalankan perintah Git atau mengirim konten ke layanan lain. Jika konten berubah dari tab/editor lain, penyimpanan ditolak agar tidak menimpa perubahan; salin edit yang ingin dipertahankan sebelum memilih **Batalkan perubahan** untuk memuat versi terbaru.

## File yang berubah saat disimpan

- `content/portfolio.json`: sumber konten utama.
- `public/assets/images/uploads/`: gambar baru yang diunggah.

Commit keduanya jika berubah. File gambar lama tidak dihapus ketika sebuah item dihapus, sehingga referensi lain tetap aman. Unggahan disimpan ke disk saat diunggah, meskipun perubahan form kemudian dibatalkan.

Untuk mengubah layout, edit komponen di `components/`; untuk styling dan animasi CSS, edit `app/globals.css`. `content/portfolio.json` boleh diedit langsung; build memvalidasinya dengan aturan yang sama seperti CMS, jadi isi yang tidak valid menggagalkan build alih-alih tampil rusak.

## Deploy

Setiap push ke `main` menjalankan `.github/workflows/deploy.yml`: install, tes, build, lalu publish folder `out/` ke GitHub Pages. Domain `portfolio-andrea.my.id` ikut terbawa lewat `public/CNAME`.

Syarat satu kali di GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Pemeriksaan

```sh
npm test
```

Pemeriksaan mencakup render halaman dari komponen React, validasi konten, escaping teks, penyimpanan persisten, konflik edit, validasi gambar, serta pembatasan akses API. Tes memakai folder sementara sehingga tidak mengubah konten portfolio.

## Cakupan lokal

Server CMS dan preview hanya mendengarkan di `127.0.0.1`. CMS tidak memiliki login online; jangan mengekspos server ini melalui tunnel atau mengubah binding agar dapat diakses publik. Halaman `/admin/` tidak ikut di-deploy. Tidak ada kredensial layanan yang dibutuhkan.
