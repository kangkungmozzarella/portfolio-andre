# Andrea Portfolio

Portofolio statis dengan CMS lokal. Desain tetap memakai HTML/CSS/JavaScript; CMS berjalan di laptop dan menghasilkan `index.html` yang siap dipublish.

## Membuka CMS

Butuh **Node.js 20 atau lebih baru**. Tidak perlu `npm install`.

```sh
npm run cms
```

- Editor: http://127.0.0.1:4174/admin/
- Portfolio: http://127.0.0.1:4174/
- Hentikan server dengan `Ctrl+C`.
- Jika port terpakai: `CMS_PORT=4175 npm run cms`.

CMS harus dibuka dari server ini. Live Server dan membuka `admin/index.html` langsung tidak menyediakan API untuk menyimpan file.

## Mengisi konten

1. Pilih bagian di navigasi CMS.
2. Edit teks, tambah atau hapus item, dan gunakan panah untuk mengubah urutannya.
3. Pilih foto/logo/screenshot dari pustaka media atau unggah gambar PNG, JPG, WebP, atau GIF (maksimal 10 MB).
4. Klik **Simpan perubahan** (atau `Cmd/Ctrl+S`).
5. Klik **Lihat portfolio** untuk memeriksa hasil tersimpan.
6. Commit dan push perubahan lewat Git seperti biasa untuk memperbarui website online.

Proyek pertama tampil sebagai karya utama. Gambar pertama dalam galeri menjadi sampul. Jumlah proyek pada navigasi mengikuti jumlah item secara otomatis. Tautan proyek bisa diarahkan ke repositori atau demo masing-masing.

**Simpan bersifat lokal, bukan publish online.** CMS tidak menjalankan perintah Git atau mengirim konten ke layanan lain. Jika konten berubah dari tab/editor lain, penyimpanan ditolak agar tidak menimpa perubahan; salin edit yang ingin dipertahankan sebelum memilih **Batalkan perubahan** untuk memuat versi terbaru.

## File yang berubah saat disimpan

- `content/portfolio.json`: sumber konten utama.
- `index.html`: halaman statis yang dihasilkan otomatis.
- `assets/images/uploads/`: gambar baru yang diunggah.

Commit ketiganya jika berubah. File gambar lama tidak dihapus ketika sebuah item dihapus, sehingga referensi lain tetap aman. Unggahan disimpan ke disk saat diunggah, meskipun perubahan form kemudian dibatalkan.

Jangan mengedit konten langsung di `index.html`, karena penyimpanan CMS akan menghasilkan ulang file tersebut. Untuk mengubah layout, edit `cms/render.mjs`; untuk styling/animasi, edit `assets/css/main.css` dan `assets/js/main.js`.

## Menghasilkan ulang halaman

```sh
npm run build
```

Gunakan setelah mengubah renderer atau mengedit JSON secara manual. Pengunjung website tetap menerima HTML statis lengkap; tidak memerlukan Node.js, login, atau CMS untuk melihat portfolio.

## Pemeriksaan

```sh
npm test
```

Pemeriksaan mencakup validasi konten, escaping HTML, penyimpanan persisten, konflik edit, validasi gambar, serta pembatasan akses API. Tes memakai folder sementara sehingga tidak mengubah konten portfolio.

## Cakupan lokal

Server hanya mendengarkan di `127.0.0.1`. CMS tidak memiliki login online; jangan mengekspos server ini melalui tunnel atau mengubah binding agar dapat diakses publik. Halaman `/admin/` pada hosting statis tidak dapat menyimpan konten tanpa server lokal. Tidak ada kredensial layanan yang dibutuhkan.
