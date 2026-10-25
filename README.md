# LAGUSIT e-PEGAWAI (Frontend)
Sistem Elektronik Kepegawaian Lapas Gunungsitoli. Frontend statis (HTML, CSS, JavaScript) untuk GitHub Pages. Backend: Google Apps Script (REST API JSON).

## Struktur
- `index.html`: halaman tunggal aplikasi
- `css/style.css`: gaya tampilan
- `img/`: gambar halaman depan (`gerbang-*.jpg`) dan gambar bawaan dashboard (`hero-gedung.jpg`, `info-gedung.jpg`); keduanya terakhir dapat diganti Super Admin tanpa mengubah berkas
- `js/config.js`: **alamat Web App Apps Script (wajib diisi)**
- `js/app.js`: inti aplikasi dan komunikasi ke server (`api()`)
- `js/grafik.js`: grafik SVG ringan (garis, batang, donat, cincin)
- `js/inti.js`, `apel.js`, `master.js`, `absen.js`, `nilai.js`, `kgb.js`, `lapor.js`: modul menu
- Pengaturan tampilan (nama, logo, warna) diatur Super Admin di Master Data ▸ Tampilan; tidak perlu mengubah berkas.

Panduan pemasangan lengkap: `PANDUAN-INSTALASI.md`.


## Tahap 16b — Animasi loading antar menu (maskot)
- Berkas baru: `js/loading.js`; `css/style.css` dan `index.html` ikut diperbarui. Unggah ketiganya (plus `js/inti.js`, `js/app.js`, `js/master.js`), lalu ganti `Modul_Tampilan.gs` di Apps Script dan buat **versi baru** deployment.
- Animasi hanya muncul bila memuat menu lebih dari ±0,45 detik; menu yang cepat atau sudah tersimpan di cache tidak menampilkannya.
- Super Admin dapat mematikannya di **Master Data ▸ Tampilan** (kotak "Animasi loading maskot"), dan mencobanya lewat tombol "Lihat contoh animasi".
- Otomatis nonaktif bila perangkat memilih "kurangi gerakan". Warna, nama aplikasi, dan font mengikuti pengaturan tampilan.
