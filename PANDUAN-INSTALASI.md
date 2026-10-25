# Panduan Migrasi LAGUSIT e-PEGAWAI
**Backend tetap di Google Apps Script (GAS) · Frontend pindah ke GitHub Pages**

Data pegawai, foto, dan berkas tetap di Google Spreadsheet dan Google Drive Anda. Yang pindah hanya tampilan (halaman web) ke GitHub Pages. Alamat baru aplikasi: `https://USERNAME-GITHUB.github.io/lagusit-e-pegawai/`

## Isi paket
- **Backend (disajikan terpisah):** semua berkas `.gs`: `Kode.gs`, `Modul_Apel.gs`, `Modul_Master.gs`, `Modul_Profil.gs`, `Modul_Kgb.gs`, `Modul_Laporan.gs`, serta dua berkas **baru** `Modul_Absen.gs` dan `Modul_Tampilan.gs`. Berkas `Modul_Foto.gs`, `Modul_Kalender.gs`, `Modul_Monitoring.gs`, `Modul_Nilai.gs` tidak berubah. `appsscript.json` opsional.
- **Frontend (ZIP):** folder `lagusit-e-pegawai` berisi `index.html`, `css/style.css`, `js/config.js`, `js/app.js`, `js/inti.js`, `js/apel.js`, `js/master.js`, `js/absen.js` (baru), folder `img/` (baru: gambar halaman depan), `js/nilai.js`, `js/kgb.js`, `js/lapor.js`, `README.md`, dan panduan ini.

---
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
