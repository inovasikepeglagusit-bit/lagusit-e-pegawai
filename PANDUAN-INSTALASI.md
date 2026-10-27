# Panduan Migrasi LAGUSIT e-PEGAWAI
**Backend tetap di Google Apps Script (GAS) · Frontend pindah ke GitHub Pages**

Data pegawai, foto, dan berkas tetap di Google Spreadsheet dan Google Drive Anda. Yang pindah hanya tampilan (halaman web) ke GitHub Pages. Alamat baru aplikasi: `https://USERNAME-GITHUB.github.io/lagusit-e-pegawai/`

## Isi paket
- **Backend (disajikan terpisah):** semua berkas `.gs`: `Kode.gs`, `Modul_Apel.gs`, `Modul_Master.gs`, `Modul_Profil.gs`, `Modul_Kgb.gs`, `Modul_Laporan.gs`, serta dua berkas **baru** `Modul_Absen.gs` dan `Modul_Tampilan.gs`. Berkas `Modul_Foto.gs`, `Modul_Kalender.gs`, `Modul_Monitoring.gs`, `Modul_Nilai.gs` tidak berubah. `appsscript.json` opsional.
- **Frontend (ZIP):** folder `lagusit-e-pegawai` berisi `index.html`, `css/style.css`, `js/config.js`, `js/app.js`, `js/grafik.js` (baru), `js/inti.js`, `js/apel.js`, `js/master.js`, `js/absen.js` (baru), folder `img/` (baru: gambar halaman depan), `js/nilai.js`, `js/kgb.js`, `js/lapor.js`, `README.md`, dan panduan ini.

---
## PERBARUI KE TAMPILAN BARU (Tahap 16)
Untuk yang sudah memasang Tahap 15. Data tidak hilang.
1. **Cadangan** proyek Apps Script dan spreadsheet seperti biasa.
2. **Backend:** ganti isi **empat** berkas dengan yang baru: `Kode`, `Modul_Apel`, `Modul_Tampilan` (tidak ada berkas baru yang perlu dibuat). Simpan (Ctrl+S), lalu **Deploy → Manage deployments → pensil → New version → Deploy**. Tahap ini menambah fungsi gambar dashboard; folder Drive `Aset Tampilan` dibuat otomatis saat gambar pertama diganti.
3. **Frontend:** timpa `index.html`, `css/style.css`, seluruh `js/*.js` (ada berkas baru `js/grafik.js`), dan salin folder `img` (kini ada tambahan `hero-gedung.jpg` dan `info-gedung.jpg`). **Jangan menimpa `js/config.js`.** Lalu `git add -A`, `git commit -m "Tahap 16"`, `git push`, tunggu 1-2 menit, Ctrl+F5.
4. **Atur tampilan:** Master Data ▸ **Tampilan**: ubah judul banner, kata kunci, kutipan, warna (kini ada "Warna sorotan"), dan di bagian **Gambar dashboard** ganti gambar banner serta kartu Informasi. Gambar diperkecil otomatis di peramban dan langsung berlaku untuk semua pengguna.
5. **Warna bawaan berubah** (biru tua dan biru sorotan). Jika Anda sudah pernah menyimpan warna sendiri, warna itu tetap dipakai.
6. Grafik dibuat sendiri tanpa pustaka luar (Chart.js dilepas), jadi dashboard lebih ringan di HP. Perangkat hemat memori atau mode hemat data otomatis memakai animasi lebih sedikit.

## SUDAH PERNAH MEMASANG? Cukup perbarui (Tahap 15)
Bagian ini untuk Anda yang aplikasinya sudah berjalan. Data tidak hilang; kolom dan sheet baru dibuat otomatis saat aplikasi pertama kali dipakai.
1. **Cadangan:** salin proyek Apps Script dan spreadsheet database (lihat "Persiapan" di bawah).
2. **Backend:** di Apps Script, ganti isi `Kode`, `Modul_Apel`, `Modul_Master`, `Modul_Profil`, `Modul_Kgb`, `Modul_Laporan` dengan berkas baru. Tambahkan dua berkas baru: tanda **+** di samping "Files" → **Script**, beri nama persis `Modul_Absen` lalu tempel isi `Modul_Absen.gs`; ulangi untuk `Modul_Tampilan`. Simpan semua (Ctrl+S). Lalu **Deploy → Manage deployments → pensil → New version → Deploy** (alamat `/exec` tetap).
3. **Frontend:** salin berkas baru dari ZIP ke folder repo Anda dan **timpa** `index.html`, `css/style.css`, seluruh `js/*.js` (termasuk `absen.js` yang baru), dan folder **`img`** yang baru (berisi dua gambar halaman depan; folder ini wajib ikut disalin). **Jangan menimpa `js/config.js`**; alamat server Anda ada di sana. Di Command Prompt pada folder itu: `git add .` → `git commit -m "Tahap 15"` → `git push`. Tunggu 1-2 menit, lalu Ctrl+F5.
4. **Cek pertama:** masuk sebagai Super Admin. Menu **Master Data & Pengaturan** kini memuat delapan tab (Persetujuan, Akun & Peran, Unit & Regu, Operator, Profil & Kolom, Kehadiran, Aturan, Tampilan). Menu "Akun & Persetujuan" yang lama sudah digabung ke sana.
5. **Atur sekali (urutan disarankan):** Master Data ▸ **Unit & Regu** (isi daftar unit kerja; daftar ini menjadi satu-satunya pilihan unit di Pegawai dan Profil) → ▸ **Kehadiran** (periksa daftar keterangan izin/cuti/sakit dan skornya) → ▸ **Tampilan** (nama, logo, warna).
6. Yang dibuat otomatis: sheet `Keterangan_Hadir` dan `Surat_Absen`, kolom `Keterangan/Catatan/Sumber/SuratID` pada sheet kehadiran apel, dan folder Drive `Surat Ketidakhadiran` (muncul saat surat pertama diunggah, di dalam folder database Anda).
7. **Halaman depan baru:** saat aplikasi dibuka tampil gambar penuh (gambar desktop di layar lebar, gambar HP di layar tegak) dengan tombol **Geser untuk masuk** dan tombol **Informasi**. Isi Informasi diatur Super Admin di Master Data ▸ Tampilan (bagian "Informasi di halaman depan"); isi bawaan sudah menjelaskan tujuan aplikasi. Gambar halaman depan bersifat tetap; untuk menggantinya, timpa `img/gerbang-desktop.jpg` dan `img/gerbang-mobile.jpg`.
8. **Unit lama:** pegawai yang unit kerjanya belum terdaftar tetap tampil apa adanya. Saat datanya diubah, unit harus dipilih dari daftar resmi, jadi tambahkan dulu unit-unit tersebut di tab Unit & Regu.

## Persiapan (wajib, 5 menit)
1. Di Apps Script: **File → Make a copy** pada proyek yang sekarang berjalan. Salinan ini adalah cadangan jika perlu kembali ke versi lama.
2. Di Google Drive: buka spreadsheet `DB_LAGUSIT_e-PEGAWAI` → **File → Make a copy**.

---
## BAGIAN A: Perbarui backend (Apps Script)
1. Buka proyek Apps Script yang sekarang dipakai aplikasi.
2. Buka berkas `Kode`, hapus seluruh isinya, tempel isi `Kode.gs` yang baru, lalu simpan (Ctrl+S).
3. **Hapus 9 berkas HTML** di proyek: `Index`, `Stylesheet`, `JavaScript`, `JS_Inti`, `JS_Apel`, `JS_Master`, `JS_Nilai`, `JS_Kgb`, `JS_Lapor` (serta `JS_Modul` bila masih ada). Cara: klik titik tiga di samping berkas → Delete. Jangan hapus berkas `.gs`.
4. (Opsional) `appsscript.json`: Project Settings (ikon roda gigi) → centang **Show "appsscript.json" manifest file in editor** → tempel isi `appsscript.json`.
5. **Deploy → Manage deployments** → ikon pensil → **Version: New version** → pastikan **Execute as: Me** dan **Who has access: Anyone** → **Deploy**. Alamat `/exec` tetap sama.
6. **Tes:** buka alamat `/exec` di tab baru. Harus tampil teks seperti ini:
   `{"success":true,"data":{"aplikasi":"LAGUSIT e-PEGAWAI","api":"aktif",...},"message":"LAGUSIT e-PEGAWAI API aktif."}`
   Kalau yang muncul halaman login Google atau pesan galat, periksa lagi "Who has access: Anyone" lalu deploy ulang.
7. Salin alamat `/exec` itu untuk Bagian B.

---
## BAGIAN B: Pasang frontend di GitHub Pages
### B1. Siapkan folder
Ekstrak ZIP. Hasilnya folder `lagusit-e-pegawai`. **Folder inilah yang menjadi repository** (di dalamnya langsung ada `index.html`).

### B2. Isi alamat server
Buka `js/config.js` dengan Notepad. Ganti `GANTI_DENGAN_URL_EXEC_ANDA` dengan alamat `/exec` dari Bagian A (tetap di dalam tanda kutip). Simpan.

### B3. Pasang Git dan akun GitHub
1. Unduh dan pasang Git dari https://git-scm.com (terima pilihan bawaan).
2. Buat akun di https://github.com bila belum punya.
3. Buka **Command Prompt**: tekan tombol Windows, ketik `cmd`, lalu tekan Enter (jendela hitam terbuka; ini bukan aplikasi "Git GUI"). Cek Git sudah terpasang dengan mengetik `git --version` lalu Enter. Harus muncul tulisan seperti `git version 2.xx`. Kalau muncul `'git' is not recognized`, tutup jendela itu, selesaikan langkah 1, lalu buka Command Prompt lagi.
4. Di jendela hitam yang sama, ketik dua baris berikut **satu per satu, tekan Enter setelah tiap baris**. Ganti `Nama Anda` dan `email@anda.com` (tanda kutip tetap ada), dan sebaiknya pakai email yang sama dengan akun GitHub Anda:
   ```
   git config --global user.name "Nama Anda"
   git config --global user.email "email@anda.com"
   ```
   Tidak ada tulisan yang muncul berarti berhasil. Untuk memeriksa, ketik `git config --global --list`; nama dan email Anda harus tampil. Langkah ini cukup dilakukan sekali di komputer ini. Anda bisa menempel perintah dengan klik kanan di jendela hitam.

### B4. Buat repository di GitHub
GitHub → tombol **New** → Repository name: `lagusit-e-pegawai` → pilih **Public** → **jangan** centang README/.gitignore/license → **Create repository**.
(Yang tersimpan di repo hanya kode tampilan, tanpa data pegawai. Alamat server memang publik, tetapi semua data tetap butuh login.)

### B5. Unggah (push) pertama kali
1. Buka folder `lagusit-e-pegawai` di File Explorer, klik kotak alamat di atas, ketik `cmd`, tekan Enter. Di jendela hitam ketik `dir`: **harus terlihat `index.html` langsung**. Kalau yang terlihat hanya satu folder lagi, Anda masih di folder yang salah.
2. Ketik satu per satu (ganti `USERNAME` dengan username GitHub Anda):
   ```
   git init
   git add .
   git commit -m "Versi awal LAGUSIT e-PEGAWAI"
   git branch -M main
   git remote add origin https://github.com/USERNAME/lagusit-e-pegawai.git
   git push -u origin main
   ```
3. Bila diminta login: **Username** = username GitHub, **Password** = *Personal Access Token* (bukan kata sandi akun). Cara membuat token: GitHub → foto profil → **Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token (classic)** → centang **repo** → atur masa berlaku → **Generate** → salin token (hanya tampil sekali). Jangan membagikan token dan jangan menyimpannya di dalam folder proyek.

### B6. Aktifkan GitHub Pages
Repo di GitHub → **Settings → Pages** → Source: **Deploy from a branch** → Branch: **main**, folder **/(root)** → **Save**. Tunggu 1-3 menit, lalu buka `https://USERNAME.github.io/lagusit-e-pegawai/`.

### B7. Coba masuk
Masuk dengan akun yang sama seperti sebelumnya (sesi lama tidak berlaku, jadi login ulang). Bagikan alamat baru ke tim.

---
## Memperbarui di kemudian hari
- **Mengubah tampilan:** ubah berkas di folder, lalu di Command Prompt pada folder itu: `git add .` → `git commit -m "catatan perubahan"` → `git push`. Tunggu 1-2 menit lalu tekan Ctrl+F5.
- **Mengubah logika server:** ubah di Apps Script, lalu Deploy → Manage deployments → pensil → New version → Deploy (alamat tetap sama).
- **Jika membuat "New deployment" (alamat /exec berubah):** perbarui `js/config.js` dan push lagi.

## Yang berubah bagi pengguna
- Alamat aplikasi berganti ke alamat GitHub Pages.
- Memuat ulang halaman (refresh) = masuk ulang, sama seperti sebelumnya.
- Unduhan Excel (CSV) dan cetak PDF lebih lancar karena tidak lagi tertanam di halaman Apps Script.
- Kamera: di HP, tombol "Ambil foto" membuka kamera. Di PC tetap membuka pemilih berkas.

## Pita merah di bawah layar
Pita muncul bila ada bagian aplikasi yang tidak termuat. Contoh isi dan artinya:
| Pesan | Penyebab dan solusi |
|---|---|
| Alamat server belum diisi | `js/config.js` belum diisi. Isi lalu push. |
| Berkas belum termuat: js/xxx.js | Berkas itu tidak ikut ter-push atau namanya berbeda. Nama berkas bersifat huruf besar-kecil. Periksa folder `js`, lalu push ulang. |
| Fungsi tidak ditemukan | Salah satu berkas JS terpotong. Salin ulang berkas dari ZIP. |

## Masalah umum
| Gejala | Solusi |
|---|---|
| Halaman GitHub 404 | Settings → Pages: Branch `main` dan folder `/(root)`. Pastikan `index.html` berada di akar repo. Tunggu beberapa menit. |
| "Tidak dapat terhubung ke server" | Alamat di `config.js` salah, atau "Who has access" bukan Anyone, atau belum New version. Tes alamat `/exec` di tab baru (harus tampil teks JSON). |
| `Authentication failed` saat push | Gunakan Personal Access Token sebagai password (langkah B5.3). |
| `remote origin already exists` | Ketik `git remote remove origin`, lalu ulangi perintah `git remote add origin ...`. |
| Perubahan tidak tampil | Tunggu 1-2 menit, lalu Ctrl+F5. |
| Ingin kembali ke versi lama | Pakai salinan proyek Apps Script dari bagian Persiapan, lalu deploy ulang. |

## Catatan keamanan
- Token sesi hanya disimpan di memori halaman, bukan di penyimpanan browser.
- Alamat server berada di `config.js` yang publik. Itu wajar: semua data dilindungi login dan hak akses di server.
- Server hanya menerima daftar fungsi tertentu (daftar putih). Fungsi internal dan `setupAppEnvironment` tidak bisa dipanggil dari luar.
- Jangan pernah memasukkan token GitHub atau kata sandi ke dalam berkas proyek.


## Tahap 16b — Animasi loading antar menu (maskot)
- Berkas baru: `js/loading.js`; `css/style.css` dan `index.html` ikut diperbarui. Unggah ketiganya (plus `js/inti.js`, `js/app.js`, `js/master.js`), lalu ganti `Modul_Tampilan.gs` di Apps Script dan buat **versi baru** deployment.
- Animasi hanya muncul bila memuat menu lebih dari ±0,45 detik; menu yang cepat atau sudah tersimpan di cache tidak menampilkannya.
- Super Admin dapat mematikannya di **Master Data ▸ Tampilan** (kotak "Animasi loading maskot"), dan mencobanya lewat tombol "Lihat contoh animasi".
- Otomatis nonaktif bila perangkat memilih "kurangi gerakan". Warna, nama aplikasi, dan font mengikuti pengaturan tampilan.


## Tahap 17 — Web lebih cepat dan responsif
**Backend (tempel ulang `Kode.gs`, `Modul_Apel.gs`, `Modul_Master.gs`, lalu buat versi baru deployment):**
- Pembacaan sheet kini disimpan di cache Apps Script lintas-permintaan (bertanda versi). Menu yang dibuka berulang tidak lagi membaca seluruh sheet.
- Setiap penulisan menaikkan versi sehingga data lama tidak pernah dipakai. Bila Anda mengubah data **langsung di Google Sheets**, perubahan terbaca paling lama 5 menit kemudian.
- Pemeriksaan sesi tidak lagi menulis ke cache pada setiap permintaan.

**Frontend (unggah `index.html`, `css/style.css`, `js/inti.js`, `js/app.js` ke GitHub, lalu Ctrl+F5):**
- Data menu yang sudah pernah dibuka tampil seketika, lalu disegarkan diam-diam; halaman digambar ulang hanya bila datanya berubah dan Anda belum mulai mengetik atau mengklik.
- Menyentuh/menunjuk menu di sidebar memanaskan datanya lebih dulu; menu yang biasa Anda pakai dimuat di latar belakang setelah masuk.
- Koneksi ke server disiapkan lebih awal, ketukan di HP tanpa jeda, animasi pindah halaman dipersingkat.


## Tahap 18 — Paket 1: Kehadiran Saya, keterangan fleksibel, banyak operator
**Apps Script:** tempel `Kode.gs`, `Modul_Absen.gs`, `Modul_Apel.gs`, `Modul_Master.gs`, dan **berkas baru `Modul_Kehadiran.gs`** (File ▸ + ▸ Script, beri nama `Modul_Kehadiran`), lalu buat versi baru deployment. Sheet `Keterangan_Hadir` otomatis bertambah kolom `UangMakan` dan `Warna`.
**Frontend:** timpa semua berkas dari ZIP (berkas baru `js/kehadiran.js`), `git add -A`, commit, push, Ctrl+F5.
- Menu **Kehadiran Saya** untuk semua pengguna: persentase, kalender, tren 6 bulan, komposisi, dan riwayat beserta keterangan. Dashboard pegawai memuat kartu ringkasannya.
- **Master Data ▸ Kehadiran**: keterangan kini dapat dipasang pada semua kategori status (termasuk Hadir dan Terlambat, bersifat opsional), dengan aturan uang makan per keterangan dan per status serta warna.
- **Master Data ▸ Operator**: tombol "Tambah operator" menambah operator sejajar (tanpa batas jumlah) pada satu ruang; dapat dicabut kapan saja.

---

## Tahap 18 — Paket 2: Kop Surat Laporan & Nomor Surat

### Backend (Apps Script)
1. Buat **2 file skrip baru**: `Modul_Kop.gs` dan `Modul_Surat.gs` (tempel isinya).
2. **Ganti isi** `Kode.gs`, `Modul_Kalender.gs`, `Modul_Laporan.gs` dengan versi baru.
3. Simpan, lalu **Deploy → Kelola deployment → Edit → Versi baru → Deploy**.
4. Sheet baru (`Surat_Indeks`, `Surat_Nomor`, `Surat_Pengambil`) dibuat otomatis.

### Frontend (GitHub Pages)
Ganti folder dengan isi ZIP: file baru `js/kop.js`, `js/surat.js`; perubahan di `index.html`, `js/inti.js`, `js/master.js`, `js/lapor.js`, `js/kgb.js`, `css/style.css`. Lalu `git add .`, `git commit -m "Tahap 18 paket 2"`, `git push`.

### Cara pakai
- **Kop surat**: Super Admin → Master Data & Pengaturan → tab **Kop**. Pilih model (6 pilihan), isi hingga 6 baris tulisan (ukuran, tebal, kapital), font, garis, warna, ukuran dan unggah logo kiri/kanan. Pratinjau langsung. Kop otomatis tampil di cetakan Laporan dan Register Nomor Surat.
- **Nomor Surat** (menu hanya tampil untuk Super Admin dan akun pengambil):
  1. Tab *Indeks Surat*: tambah kode indeks dan nama surat.
  2. Tab *Penomoran*: atur jumlah nomor yang dilangkahi per hari (bawaan 5), jumlah digit, dan format (`{NO}/{INDEKS}/{BLR}/{THN}`).
  3. Tab *Pengambil & PIN*: tunjuk akun pengambil dan beri PIN khusus. PIN tampak oleh Super Admin. 5 kali salah → terkunci 15 menit.
  4. Tab *Tanggal Merah*: tanggal merah diambil dari **Kalender** (jenis entri *Libur*). Tanggal merah tertutup kecuali dibuka Super Admin di sini.
  5. Pengambil: pilih indeks, isi keterangan (wajib), masukkan PIN, ambil nomor. Nomor cadangan (hasil langkahan) dipakai Super Admin.
- Data yang diubah langsung di Google Sheets baru tampil maksimal 5 menit (cache server).

---

## Tahap 18 — Paket 3: Rekap Uang Makan (staf dan rupam)

### Backend (Apps Script)
1. Buat **1 file skrip baru**: `Modul_RekapUangMakan.gs`.
2. **Ganti isi** `Modul_Laporan.gs`, `Modul_Absen.gs`, dan `Kode.gs` dengan versi baru.
3. Deploy → Kelola deployment → Edit → **Versi baru** → Deploy.

### Frontend
Ganti folder dengan isi ZIP (berubah: `js/lapor.js`, `js/master.js`), lalu `git add .`, `git commit -m "Tahap 18 paket 3"`, `git push`.

### Cara kerja
- Menu **Laporan** → jenis **Rekap Uang Makan (per pegawai)** atau **Rekap Uang Makan (rincian harian)** (per tanggal).
- Lingkup: seluruh pegawai, seluruh staf, seluruh rupam, satu rupam, per pegawai, per unit kerja/bidang. Rentang tanggal mengikuti **tanggal uang makan**.
- Dibayar atau tidak mengikuti **Master Data → Kehadiran**: aturan per status dan aturan khusus per keterangan. Terlambat bisa dibayar, tidak dibayar, atau dibuat keterangan khusus. Cuti memakai keterangannya sendiri.
- **Staf**: satu hari uang makan per tanggal apel (dua sesi pada hari yang sama dihitung satu hari).
- **Rupam**: apel tidak berubah. Untuk uang makan: Siang (hari 1), Pagi (hari 2), Malam (hari 3), Off (hari 4, tidak dihitung). Apel Malam dihitung pada hari berikutnya; dapat diubah ke hari yang sama di Master Data → Kehadiran → "Siklus uang makan rupam".
- Tanpa nominal rupiah; hanya jumlah hari. Cetak memakai kop surat dari Super Admin; tersedia unduh Excel (CSV).

---

## Tahap 19 — Nomor Surat fleksibel, email status, super operator, urutan menu baru

### Backend (Apps Script) — ganti isi 3 file
`Kode.gs`, `Modul_Surat.gs`, `Modul_Kgb.gs`, lalu Deploy → Kelola deployment → Edit → **Versi baru** → Deploy. Kolom baru (`Format`, `Skop`, `Riwayat`, `Super`) ditambahkan otomatis ke sheet lama.

### Frontend
Ganti folder dengan isi ZIP (berubah: `js/surat.js`, `css/style.css`), lalu `git add .`, `git commit -m "Tahap 19"`, `git push`.

### Yang baru
- **Format nomor surat bebas** (Nomor Surat → Penomoran): susun sendiri dengan teks tetap dan penanda `{NO}` (wajib), `{INDEKS}`, `{NAMA}`, `{BLN}`, `{BLR}`, `{THN}`, `{THN2}`, `{TGL}`. Bawaan sekarang `{INDEKS} - {NO}` (contoh `W2.PAS.PK.01 - 123`). Tersedia contoh siap pakai, pilihan mulai ulang nomor per tahun/bulan/tidak pernah, dan **format khusus per indeks** (tab Indeks Surat).
- **Email status**: setiap nomor diambil, dibatalkan, atau cadangan dipakai, rincian lengkap (nomor, status, indeks, perihal, tujuan, riwayat) dikirim ke email pengambil. Pembatalan juga memberi email kepada pemilik nomor dan notifikasi di lonceng aplikasi. Riwayat status tiap nomor dapat dilihat lewat tautan **rincian** di register.
- **Nomor yang dilangkahi (cadangan) disembunyikan** dari pengambil biasa. Hanya Super Admin dan **super operator** (dicentang di tab Pengambil & PIN) yang melihat dan dapat memakai nomor cadangan.
- Register: ringkasan status per chip, filter "Nomor saya saja", indeks terakhir/terseringdipakai diingat.
- **Urutan menu**: Dashboard, Monitoring, Kalender & Pengumuman, Kehadiran Saya, Pegawai, Apel Staf, Apel Regu, KGB & Pangkat, Cuti & Izin, Penilaian Kinerja, Laporan, Nomor Surat, Riwayat Aktivitas, Master Data & Pengaturan, Profil Saya.
- Pastikan akun pengirim email (pemilik skrip) sudah mengizinkan layanan email; bila email gagal terkirim, nomor tetap tercatat.

---

## Tahap 20 — Jadwal Piket, Lepas Piket otomatis, Petugas Apel/Upacara, Pengingat Email

### Backend (Apps Script)
1. Buat **1 file skrip baru**: `Modul_Piket.gs`.
2. **Ganti isi** `Kode.gs`, `Modul_Apel.gs`, `Modul_Kalender.gs`, `Modul_Kgb.gs`, `Modul_Laporan.gs`.
3. Deploy → Kelola deployment → Edit → **Versi baru** → Deploy. Sheet baru (`Piket_Jenis`, `Piket_Jadwal`, `Petugas_Peran`, `Petugas_Apel`, `Pengingat_Log`) dibuat otomatis.
4. **Izin pemicu waktu**: di editor Apps Script, pilih fungsi `kirimPengingatTugas` lalu klik **Jalankan** sekali dan setujui izinnya (sekali saja). Setelah itu Super Admin cukup menekan **Aktifkan pengingat otomatis** di web.

### Frontend
Ganti folder dengan isi ZIP (baru: `js/piket.js`; berubah: `index.html`, `js/kgb.js`, `js/inti.js`, `css/style.css`), lalu `git add .`, `git commit -m "Tahap 20"`, `git push`.

### Cara pakai
Menu **Kalender & Pengumuman** kini punya 4 tab: Kalender, Jadwal Piket, Petugas Apel, Aturan Piket (Super Admin).
1. **Aturan Piket (Super Admin)**: tunjuk *operator jadwal*; atur jenis piket (bawaan Perwira Piket, Piket, Bantuan Jaga Hari Libur) dan apakah keesokan harinya Lepas Piket; atur nama status dan kategorinya (bawaan **Lepas Piket = Hadir**); atur peran petugas (mode Otomatis/Manual/Tetap, batas unit), hari apel, sesi, jeda; atur tenggat pengingat email (contoh `3,1` = H-3 dan H-1) serta jam kirim.
2. **Jadwal Piket (operator jadwal)**: isi per hari dan jenis sekali sebulan lalu Simpan. Pegawai yang dijadwalkan langsung diberi tahu lewat email. Keesokan harinya pada apel pegawai itu otomatis berstatus **Lepas Piket** (keterangan muncul di Apel, Kehadiran Saya, laporan, dan rekap uang makan mengikuti aturan Master Data). Bila piket lagi di hari berikutnya, tidak Lepas Piket.
3. **Petugas Apel**: *Buat otomatis* untuk rentang tanggal (rotasi adil, melewati pegawai yang cuti/izin/sakit/dinas luar/piket/Lepas Piket), atau *Tambah petugas* manual: pegawai atau **orang dari luar** (nama + email). Pada tanggal yang diberi agenda **Upacara** (jenis baru di Kalender) dipakai peran upacara.
4. **Pengingat**: dikirim ke email pegawai atau email petugas luar sesuai tenggat; tidak dikirim ganda. Notifikasi lonceng dan kartu **Tugas Saya** di dashboard juga muncul.
5. **Laporan** baru: *Rekap jadwal piket* dan *Petugas apel dan upacara*.
- Batas kuota email Google berlaku (akun gratis sekitar 100 email/hari); pengiriman dibatasi 80 email per proses.

---

## Tahap 21 — Jenis & Nama Jabatan dinamis, aturan petugas apel per hari, hapus semua petugas

### Backend (Apps Script)
1. Buat **1 file skrip baru**: `Modul_Jabatan.gs` (tanda **+** di panel File → **Skrip** → nama `Modul_Jabatan` → tempel isinya → Ctrl+S).
2. **Ganti isi** file ini (tempel ulang seluruhnya): `Kode.gs`, `Modul_Piket.gs`, `Modul_Apel.gs`.
3. Deploy → Kelola deployment → pensil → **Versi baru** → Deploy. Sheet baru (`Jabatan_Jenis`, `Jabatan_Daftar`, `Petugas_Aturan`) dan kolom `JenisJabatan` pada sheet Pegawai dibuat otomatis. Tidak perlu menjalankan fungsi apa pun lagi.

### Frontend
Ganti folder dengan isi ZIP (berubah: `js/master.js`, `js/piket.js`, `js/app.js`, `js/apel.js`, `css/style.css`), lalu:
```
git add .
git commit -m "Tahap 21: jabatan dinamis, aturan petugas apel, hapus semua petugas"
git push
```

### Langkah pemakaian (urutan yang disarankan)
1. **Master Data & Pengaturan → tab Jabatan** (Super Admin)
   - **1. Jenis jabatan**: bawaan *Eselon I–V*, *JFT*, *JFU*. Tambah sendiri bila perlu (mis. *Eselon VI* dengan tingkat 6, *Pelaksana*). Rumpun: Struktural (pakai tingkat eselon), JFT, JFU, atau Lainnya. Klik **Simpan jenis jabatan**.
   - **2. Nama jabatan → jenis**: daftarkan nama jabatan dan jenisnya. Pencocokan **Persis** (nama sama), **Diawali** (mis. "Kepala Seksi" berlaku untuk semua "Kepala Seksi …"), atau **Mengandung** (mis. "Analis"). Bila beberapa aturan cocok, yang paling spesifik menang. Jabatan pada data pegawai yang belum terpetakan muncul sebagai chip: klik untuk menambahkannya, pilih jenis, lalu **Simpan nama jabatan**.
   - **3. Penetapan per pegawai**: periksa hasilnya; untuk pengecualian pilih jenis secara manual (manual selalu didahulukan). Klik **Simpan penetapan**.
   - Jenis jabatan juga dapat dipilih di formulir **Pegawai** (kolom Jabatan menyarankan nama dari daftar).
2. **Kalender & Pengumuman → tab Aturan Piket → Peran petugas apel dan upacara**
   - Klik **Terapkan aturan apel standar** untuk langsung memasang aturan Lapas: *Pembina Apel* Senin Eselon III, Selasa–Jumat Eselon IV, Sabtu Eselon V (bergantian berurutan, satu orang per pekan); *Komandan Apel* Senin–Jumat Eselon V dan Sabtu pegawai yang ditentukan; *Pembawa Acara*, *Pembaca Tri Dharma*, *Dirigen* dari jabatan fungsional (JFT/JFU); *Pembaca Doa* hanya Senin. Hari Sabtu otomatis ikut diaktifkan. Setelah itu pilih pegawai untuk **Komandan Apel hari Sabtu** (aturan Sabtu → mode *Pegawai tertentu*) dan klik **Simpan aturan**.
   - Semuanya bisa diubah: tiap peran punya aturan per hari (centang hari; tanpa centang = setiap hari), cara menentukan (*Otomatis*, *Manual*, *Pegawai tertentu*), jenis jabatan yang boleh (boleh lebih dari satu), batas unit, cara bergilir (*Adil* atau *Berurutan*), dan masa tugas (*ganti tiap hari* atau *satu orang per pekan*). Ringkasan di bawah nama peran menunjukkan aturan dalam kalimat. Satu hari hanya boleh punya satu aturan per peran.
   - Angka di samping jenis jabatan = jumlah pegawai aktif berjenis itu; bila 0 muncul peringatan merah.
3. **Petugas Apel** (operator jadwal / Super Admin)
   - **Buat otomatis → Pratinjau**: lihat dulu siapa yang akan bertugas dan alasan bila ada peran tanpa calon, tanpa menyimpan apa pun. Lalu **Buat petugas**.
   - **Hapus semua** (khusus Super Admin): pilih semua petugas atau hanya yang otomatis, boleh dibatasi rentang tanggal (kosong = seluruh tanggal), lihat jumlahnya, ketik **HAPUS** untuk mengonfirmasi. Petugas berstatus *Batal* (tercatat di Riwayat Aktivitas dan tidak dikirimi pengingat).
4. **Apel Staf**: pada halaman apel tertentu muncul kartu **Petugas hari ini**; tombol **Isi pembina apel** mengisi nama dan jabatan pembina dari petugas. **Laporan → Petugas apel dan upacara** kini memuat kolom Jabatan.

### Aturan yang perlu diketahui
- Pegawai yang sedang cuti/izin/sakit/dinas luar, piket, atau Lepas Piket tidak pernah dipilih. Satu orang tidak merangkap dua peran pada apel yang sama.
- *Berurutan* melanjutkan dari pemegang terakhir peran itu menurut urutan daftar (tingkat jabatan, lalu unit dan nama), jadi urutan tetap terjaga walau dibuat bulan demi bulan.
- Hari libur nasional (agenda jenis *Libur*) dilewati; Sabtu/Minggu ditentukan oleh pilihan "Hari apel" di Aturan Piket.
- Jenis jabatan yang masih dipakai aturan peran tidak dapat dinonaktifkan sebelum aturannya diubah.

---

## Tahap 22 — Halaman depan publik (beranda.html) dengan pengumuman dari Super Admin

### Yang baru
- **`beranda.html`**: landing page bergaya ilustrasi senja dengan paralaks berlapis dan tiga adegan bertema Pemasyarakatan (fajar di gerbang lapas dengan petugas dan menara jaga, apel pagi di tepi laut, malam siaga dengan lampu sorot dan petugas patroli). Tidak ada logo, nama, atau tulisan yang tertanam di gambar, dan **semua kata-kata dapat diatur Super Admin**.
- **Pengumuman publik**: pengumuman yang diberi tanda **Tampilkan di halaman depan** muncul otomatis di beranda selama masa berlakunya. Agenda, upacara, dan libur tidak pernah tampil di publik.
- Tombol **Masuk** di beranda mengarah ke `index.html` (gerbang aplikasi, login email dan kata sandi).

### Backend (Apps Script)
Tempel ulang **semua** berkas ini secara utuh, simpan, lalu **Deploy → Manage deployments → Edit (ikon pensil) → Version: New version → Deploy** (URL /exec tetap):
`Kode.gs`, `Modul_Tampilan.gs`, `Modul_Kalender.gs`.
Kolom baru **Publik** pada sheet *Agenda* ditambahkan otomatis oleh sistem; tidak perlu mengubah sheet secara manual.

### Frontend
Berkas baru/berubah: `beranda.html` (baru), `js/kgb.js`, `js/master.js`.
```
git add .
git commit -m "Tahap 22: halaman depan publik dengan pengumuman dari Super Admin"
git push
```
Halaman terbuka di `https://<akun>.github.io/lagusit-e-pegawai/beranda.html`.

### Cara pakai
1. **Mengatur kata-kata**: Master Data & Pengaturan → tab **Tampilan** → bagian **Halaman depan (beranda)**. Dapat diubah: teks kecil, judul besar, kalimat miring, kalimat pembuka, teks tombol, daftar fungsi, kartu layanan (satu baris satu kartu, pola `Judul | Isi`, maksimal 6), daftar peran (maksimal 4), judul bagian Pengumuman, dan kutipan penutup. Kolom yang dikosongkan kembali ke teks bawaan. Nama aplikasi, subjudul, instansi, logo (opsional), dan warna aksen yang sudah ada ikut dipakai.
2. **Menayangkan pengumuman**: Kalender & Pengumuman → **Tambah** → Jenis *Pengumuman* → isi judul, tanggal mulai, **berlaku sampai**, deskripsi (opsional waktu dan lokasi) → centang **Tampilkan di halaman depan** → Simpan. Pengumuman hilang dari beranda otomatis setelah tanggal berlaku habis atau bila dibatalkan.
3. Beranda menyimpan hasil selama 60 detik di server agar hemat kuota; perubahan biasanya terlihat dalam satu menit.

### Aturan yang perlu diketahui
- Pengumuman bertanda publik **dapat dibaca siapa saja tanpa login**. Hanya judul, isi, tanggal, waktu, dan lokasi yang keluar; jangan menulis data pribadi atau rahasia.
- Bila alamat server belum diisi di `js/config.js`, beranda tetap tampil dengan teks bawaan dan keterangan "Belum ada pengumuman".
- Animasi otomatis berhenti bila perangkat meminta pengurangan gerakan.

### Tahap 22d — Landing "Pelayaran" menggantikan gerbang depan aplikasi
- Layar awal "Geser untuk masuk" diganti landing Pelayaran (`landing.html`). Landing dimuat penuh layar di atas halaman masuk, di dalam iframe, jadi gaya dan skripnya tidak bercampur dengan aplikasi. Tombol **Masuk ke Sistem** (di hero, menu atas, dan lembar Informasi) menutup landing dan membuka form login. Setelah **Keluar**, landing tampil lagi.
- `index.html` tetap aplikasi; alamat utama situs tidak berubah.
- Menu **Informasi** di landing menampilkan teks Informasi aplikasi dari Pengaturan Tampilan (judul dan isi `# judul / - butir`) di bagian bawah, jadi tidak ada isi ganda.
- `landing.html` juga bisa dibuka langsung; tombol Masuknya mengarah ke `index.html`.
- Berkas yang berubah: `landing.html` (baru), `js/app.js`, `css/style.css`. Gambar `img/gerbang-*.jpg` tidak lagi dipakai (boleh dibiarkan).
- `beranda.html` dan `beranda-gerbang.html` adalah desain alternatif; tidak dipakai kecuali Anda ingin menggantinya (salin isinya ke `landing.html`).
