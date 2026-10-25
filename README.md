# LAGUSIT e-PEGAWAI (Frontend)
Sistem Elektronik Kepegawaian Lapas Gunungsitoli. Frontend statis (HTML, CSS, JavaScript) untuk GitHub Pages. Backend: Google Apps Script (REST API JSON).

## Struktur
- `index.html`: halaman tunggal aplikasi
- `css/style.css`: gaya tampilan
- `img/`: gambar halaman depan (`gerbang-desktop.jpg`, `gerbang-mobile.jpg`)
- `js/config.js`: **alamat Web App Apps Script (wajib diisi)**
- `js/app.js`: inti aplikasi dan komunikasi ke server (`api()`)
- `js/inti.js`, `apel.js`, `master.js`, `absen.js`, `nilai.js`, `kgb.js`, `lapor.js`: modul menu
- Pengaturan tampilan (nama, logo, warna) diatur Super Admin di Master Data ▸ Tampilan; tidak perlu mengubah berkas.

Panduan pemasangan lengkap: `PANDUAN-INSTALASI.md`.
