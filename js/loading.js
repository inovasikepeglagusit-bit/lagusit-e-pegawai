// ── Animasi pemuatan antar menu: maskot petugas mengejar map yang kabur ──
// Hanya muncul bila pemuatan melambat (lewat 0,45 detik) agar menu yang cepat tidak berkedip; pemuatan dari cache tidak memakainya.
// Nama aplikasi, kata kunci, warna, dan font mengikuti pengaturan tampilan; Super Admin dapat mematikannya (Master Data ▸ Tampilan).
const LOAD = (() => {
  const CERITA = { dashboard: 'Maskot menata dashboard agar rapi.', pegawai: 'Maskot mengabsen data pegawai satu per satu.', apel: 'Maskot mengejar daftar hadir apel yang kabur.', regu: 'Maskot memanggil regu jaga ke barisan.', absen: 'Maskot mencari surat izin yang terselip.', master: 'Maskot membuka lemari pengaturan.', nilai: 'Maskot menghitung nilai kinerja dengan teliti.', kgb: 'Maskot memeriksa jadwal KGB agar tidak terlewat.', kalender: 'Maskot membuka agenda hari ini.', laporan: 'Maskot merapikan lembar laporan.', monitoring: 'Maskot meninjau layar pantau.', audit: 'Maskot membuka buku catatan aktivitas.', profil: 'Maskot mencari pasfoto Anda.' };
  let el = null, n = 0, tm = 0, ht = 0, pt = 0, ct = 0, shown = 0, val = 0, idx = 0, menu = '', akhir = false;
  const judul = () => (typeof TITLES !== 'undefined' && TITLES[menu]) || 'halaman';
  const tahap = () => [
    ['Lho, mapnya kabur! 🏃', CERITA[menu] || 'Maskot mengejar berkas yang nakal.', 'Balik sini, map! 📁', 'Membuka ' + judul()],
    ['HOPP! Lewati berkas! 🤸', 'Melompati tumpukan dokumen dengan sigap.', 'Permisiii! 🤭', 'Memeriksa data'],
    ['Dapat juga! 😎', 'Semua berkas kembali rapi dan siap diproses.', 'Ketangkap kamu! 📋', 'Menyiapkan ' + judul()],
    ['Siap, hormat! 🫡', judul() + ' siap digunakan.', 'Laporan aman, Komandan! 🎉', 'Selesai']
  ];
  const q = s => el.querySelector(s);
  function bangun() {
    if (el) return;
    el = document.createElement('div'); el.id = 'lo'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
    el.innerHTML = `<div class="lo-grid"></div><div class="lo-orbit"></div><div class="lo-content"><div class="lo-brand"></div><div class="lo-sub"></div><div class="lo-kicker"></div>
    <div class="lo-scene" aria-hidden="true"><div class="lo-moon"></div><i class="lo-star" style="top:18%;left:19%"></i><i class="lo-star" style="top:31%;left:34%"></i><i class="lo-star" style="top:16%;left:72%"></i><i class="lo-star" style="top:43%;left:84%"></i><div class="lo-cloud"></div><div class="lo-cloud two"></div><div class="lo-hill"></div>
    <div class="lo-bld"><div class="roof"></div><div class="base"></div><div class="lo-win one"></div><div class="lo-win two"></div><div class="door"></div></div>
    <div class="lo-tw left"><div class="lo-hut"></div><div class="lo-legs"></div></div><div class="lo-tw right"><div class="lo-hut"></div><div class="lo-legs"></div></div><div class="lo-fence"></div><div class="lo-ground"></div><div class="lo-path"></div>
    <div class="lo-stack one"></div><div class="lo-stack two"></div><div class="lo-run"></div><div class="lo-bubble"></div>
    <div class="lo-mascot"><div class="lo-head"><div class="lo-hair"></div><div class="lo-eye left"></div><div class="lo-eye right"></div><div class="lo-cheek left"></div><div class="lo-cheek right"></div><div class="lo-smile"></div></div><div class="lo-ear left"></div><div class="lo-ear right"></div><div class="lo-cap"></div>
    <div class="lo-torso"><div class="lo-badge"></div><div class="lo-pocket"></div></div><div class="lo-arm left"><div class="lo-hand"></div></div><div class="lo-arm right"><div class="lo-hand"></div></div><div class="lo-leg"><div class="lo-boot"></div></div><div class="lo-leg right"><div class="lo-boot"></div></div><div class="lo-folder"></div></div></div>
    <div class="lo-status"></div><div class="lo-substatus"></div><div class="lo-prog"><div class="lo-track" role="progressbar" aria-label="Progres pemuatan" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="lo-fill"></div></div><div class="lo-meta"><span class="lo-m"></span><span class="lo-p">0%</span></div></div><div class="lo-foot"></div></div>
    <button type="button" class="lo-skip">Lewati ↗</button>`;
    document.body.appendChild(el); q('.lo-skip').onclick = () => tutup(true);
  }
  function merek() {
    const k = String(TP.nama).trim().split(/\s+/); q('.lo-brand').textContent = k[0]; q('.lo-sub').textContent = k.slice(1).join(' ');
    q('.lo-kicker').textContent = TP.sub || TP.instansi; q('.lo-foot').innerHTML = String(TP.heroPoin).split(',').map(x => x.trim()).filter(Boolean).slice(0, 4).map(x => esc(x)).join(' <b>•</b> ');
  }
  function atur(v) { val = Math.max(0, Math.min(100, v)); q('.lo-fill').style.width = val + '%'; q('.lo-p').textContent = Math.round(val) + '%'; q('.lo-track').setAttribute('aria-valuenow', String(Math.round(val))); }
  function negara(i) { const s = tahap()[i]; q('.lo-status').textContent = s[0]; q('.lo-substatus').textContent = s[1]; q('.lo-bubble').textContent = s[2]; q('.lo-m').textContent = s[3]; q('.lo-mascot').classList.toggle('hormat', i === 3); }
  function jalan() {
    clearInterval(pt); clearInterval(ct); idx = 0; atur(0); negara(0); akhir = false;
    pt = setInterval(() => { if (val < 92) atur(val + (val < 40 ? 3 : val < 75 ? 1.4 : .45)); }, 180);
    ct = setInterval(() => { idx = (idx + 1) % 3; negara(idx); }, 1500);
  }
  function tampil() {
    if (shown || !n) return; bangun(); merek(); shown = Date.now(); jalan(); void el.offsetWidth; el.classList.add('on');
    clearTimeout(ht); ht = setTimeout(() => tutup(true), 40000); // pengaman: tidak pernah menahan layar terlalu lama
  }
  function tutup(paksa) {
    if (!shown) return; clearInterval(pt); clearInterval(ct); clearTimeout(ht); akhir = true; if (paksa) n = 0;
    negara(3); atur(100); const sisa = paksa ? 0 : Math.max(0, 1100 - (Date.now() - shown));
    ht = setTimeout(() => { el.classList.remove('on'); shown = 0; akhir = false; }, sisa + (paksa ? 80 : 380));
  }
  return {
    aktif() { return typeof TP !== 'undefined' && TP.animasi !== 'tidak' && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); },
    mulai(m) {
      menu = m; n++; if (!this.aktif()) return;
      if (shown) { if (akhir) { clearTimeout(ht); shown = Date.now(); jalan(); } else negara(idx); return; }
      clearTimeout(tm); tm = setTimeout(tampil, 450);
    },
    selesai() { n = Math.max(0, n - 1); if (n) return; clearTimeout(tm); if (shown) tutup(false); },
    contoh(lama) { menu = S.page || 'dashboard'; n++; tampil(); setTimeout(() => LOAD.selesai(), lama || 4500); }, // pratinjau untuk Super Admin dan pengujian
    terlihat() { return !!el && el.classList.contains('on'); }
  };
})();
(window.MOD = window.MOD || []).push('Loading');
