/** LAGUSIT e-PEGAWAI — Frontend SPA. Token hanya di memori (bukan URL); URL tidak pernah berubah. */
const S = { token: null, user: null, menu: [], pegawai: [], akun: [] };
const PEN_KELUAR = ['Out', 'BKO Keluar', 'Didetasir'], PEN_MASUK = ['In', 'BKO Masuk', 'Titipan', 'DPB'], PENUGASAN = PEN_KELUAR.concat(PEN_MASUK), STATUS = ['PNS', 'PPPK', 'CPNS'], ROLES = ['Super Admin', 'Operator', 'Atasan', 'Pimpinan'];
const TITLES = { dashboard: 'Dashboard', pegawai: 'Pegawai', audit: 'Riwayat Aktivitas', profil: 'Profil Saya' };
const ICONS = { dashboard: 'bi-grid-1x2', pegawai: 'bi-person-vcard', audit: 'bi-clock-history', profil: 'bi-person-circle' };
const RENDER = {};
let chart = null, lastChart = null;
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const isAdmin = () => S.user && S.user.roles.includes('Super Admin');

// ── Tampilan yang dapat diatur Super Admin (nama, logo, warna): data dari server, disimpan di peramban agar halaman masuk langsung bermerek ──
const TAMPIL0 = { nama: 'LAGUSIT e-PEGAWAI', sub: 'Sistem Elektronik Kepegawaian', instansi: 'Lapas Gunungsitoli', utama: '#0B2A6B', primer: '#2563EB', aksen: '#D97706', latar: '#F3F6FC', logo: '', slogan: 'Satu Sistem, Semua Layanan Kepegawaian', heroPoin: 'Mudah, Cepat, Transparan, Terintegrasi', motto: 'Disiplin hari ini, untuk masa depan yang lebih baik.', gbrHeroV: '', gbrInfoV: '', animasi: 'ya', infoJudul: 'Tentang LAGUSIT e-PEGAWAI', info: '# Apa itu LAGUSIT e-PEGAWAI\nSistem Elektronik Kepegawaian Lapas Gunungsitoli: aplikasi web untuk mengelola data dan administrasi kepegawaian secara digital, terpusat, dan transparan.\n\n# Tujuan\n- Satu sumber data pegawai yang rapi dan selalu diperbarui\n- Mempermudah pencatatan apel staf dan apel serah terima regu penjagaan beserta foto dokumentasi\n- Memantau jadwal KGB dan kenaikan pangkat agar tidak terlewat\n- Mendukung penilaian kinerja yang objektif dan pemilihan pegawai teladan\n- Memudahkan pengajuan cuti, izin, dan sakit beserta verifikasinya\n- Menyediakan laporan dan rekap yang siap dicetak atau diunduh\n\n# Siapa yang memakai\nSeluruh pegawai dengan hak akses sesuai perannya: Super Admin, Operator, Atasan, Pimpinan, dan Pegawai. Setiap orang hanya melihat data yang menjadi haknya.\n\n# Keamanan dan privasi\n- Masuk memakai email dan kata sandi pribadi; pendaftaran akun disetujui Super Admin\n- Perubahan data profil diverifikasi Super Admin sebelum berlaku\n- Setiap aktivitas penting tercatat di riwayat aktivitas\n\n# Bantuan\nHubungi Super Admin Bidang Kepegawaian Lapas Gunungsitoli bila mengalami kendala.' };
let TP = Object.assign({}, TAMPIL0);
const FAV0 = document.getElementById('favicon') ? document.getElementById('favicon').href : '';
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
const rgbHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
const campur = (a, b, t) => { const x = hexRgb(a), y = hexRgb(b); return rgbHex(x.map((v, i) => v + (y[i] - v) * t)); };
const lumHex = h => { const c = hexRgb(h).map(v => v / 255).map(v => v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4)); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const kontrasHex = (a, b) => { const x = lumHex(a), y = lumHex(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
function gelapkan(h, k) { let c = h; for (let i = 0; i < 40 && kontrasHex(c, '#FFFFFF') < k; i++) c = campur(c, '#000000', .08); return c; }
const inisial = n => n === TAMPIL0.nama ? 'LG' : String(n).split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const brandHtml = () => (TP.logo ? `<img class="auth-logo" src="${esc(TP.logo)}" alt="">` : '') + esc(TP.nama);
function terapkanTampilan(t) {
  TP = Object.assign({}, TAMPIL0, t || {});
  const WARNA = ['utama', 'primer', 'aksen', 'latar']; WARNA.forEach(k => { if (!/^#[0-9A-Fa-f]{6}$/.test(TP[k])) TP[k] = TAMPIL0[k]; });
  const std = WARNA.every(k => TP[k] === TAMPIL0[k]), akBawaan = TP.aksen === TAMPIL0.aksen;
  const goldd = akBawaan ? '#B45309' : gelapkan(TP.aksen, 4.5), amber = akBawaan ? '#F59E0B' : campur(TP.aksen, '#FFFFFF', .15), amberL = akBawaan ? '#FBBF24' : campur(TP.aksen, '#FFFFFF', .38);
  $('tema').textContent = std ? '' : `:root{--navy:${TP.utama};--navy2:${campur(TP.utama, '#FFFFFF', .12)};--primer:${TP.primer};--prim-s:${TP.primer};--gold:${TP.aksen};--goldd:${goldd};--amber:${amber};--amber-l:${amberL}}[data-theme=dark]{--primer:${campur(TP.primer, '#FFFFFF', .32)}}:root:not([data-theme=dark]){--bg:${TP.latar}}`;
  const lg = TP.logo, bl = $('brandLogo'), bm = $('brandMark');
  if (bl) { bl.hidden = !lg; if (lg) bl.src = lg; else bl.removeAttribute('src'); }
  if (bm) { bm.hidden = !!lg; bm.textContent = inisial(TP.nama); }
  if ($('brandName')) { $('brandName').textContent = TP.nama; $('brandSub').textContent = TP.sub; }
  if ($('sideIns')) { $('sideIns').textContent = TP.instansi; $('sideMotto').textContent = TP.motto; }
  if ($('mLogo')) $('mLogo').innerHTML = lg ? `<img src="${esc(lg)}" alt="">` : esc(inisial(TP.nama));
  if (typeof setHead === 'function' && S.user) setHead(S.page); else { if ($('mName')) $('mName').textContent = TP.nama; if ($('mIns')) $('mIns').textContent = TP.instansi; }
  document.title = TP.nama; const fv = $('favicon'); if (fv && FAV0) fv.href = lg || FAV0;
  document.querySelectorAll('.auth-brand').forEach(e => e.innerHTML = brandHtml());
}
// ── Gambar dashboard (banner gedung, kartu informasi): bawaan di folder img, atau gambar kustom Super Admin dari server (disimpan di perangkat per versi) ──
const GBR = { hero: { def: 'img/hero-gedung.jpg', kv: 'gbrHeroV' }, info: { def: 'img/info-gedung.jpg', kv: 'gbrInfoV' } }, GBRM = {};
function gbrCache(k) { // alamat gambar bila sudah tersedia di perangkat; '' bila gambar kustom belum diunduh
  const v = TP[GBR[k].kv]; if (!v) return GBR[k].def; if (GBRM[k] && GBRM[k].v === v) return GBRM[k].url;
  try { const c = JSON.parse(localStorage.getItem('gbr_' + k) || 'null'); if (c && c.v === v) { GBRM[k] = c; return c.url; } } catch (e) {} return '';
}
async function gbrMuat(k) {
  const u = gbrCache(k); if (u) return u;
  try { const r = await api('getAset', k); if (r && r.success && r.data) { GBRM[k] = { v: r.data.v, url: r.data.data }; try { localStorage.setItem('gbr_' + k, JSON.stringify(GBRM[k])); } catch (e) {} return r.data.data; } } catch (e) {}
  return GBR[k].def;
}
function gbrPasang(root) { // isi <img> di dalam setiap [data-gbr]; tampil halus setelah gambar siap
  (root || document).querySelectorAll('[data-gbr]').forEach(async w => {
    const k = w.dataset.gbr, im = w.querySelector('img'); if (!im || !GBR[k]) return; const u = gbrCache(k) || await gbrMuat(k); if (!w.isConnected) return;
    im.onload = () => w.classList.add('ok'); im.src = u; if (im.complete && im.naturalWidth) w.classList.add('ok');
  });
}
function simpanCacheTampilan(t) { try { localStorage.setItem('tampilan', JSON.stringify(t)); } catch (e) {} }
async function muatTampilan() {
  try { const c = JSON.parse(localStorage.getItem('tampilan') || 'null'); if (c) terapkanTampilan(c); } catch (e) {}
  try { const r = await api('getTampilan'); if (r && r.success) { terapkanTampilan(r.data); simpanCacheTampilan(r.data); } } catch (e) {}
}

// ── Komunikasi server ──
async function api(fn, ...args) { // satu-satunya pintu komunikasi ke server Apps Script
  if (typeof GAS_URL === 'undefined' || !GAS_URL || /GANTI/.test(GAS_URL)) throw new Error('Alamat server belum diisi di js/config.js');
  const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 90000);
  try {
    const r = await fetch(GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ fn: fn, args: args }), signal: ctl.signal }); // text/plain menghindari preflight CORS
    if (!r.ok) throw new Error('Server menjawab kode ' + r.status);
    return await r.json();
  } catch (e) {
    throw new Error(e.name === 'AbortError' ? 'Server terlalu lama menjawab. Coba lagi.' : /Failed to fetch|NetworkError|Load failed/.test(e.message) ? 'Tidak dapat terhubung ke server. Periksa koneksi internet.' : e.message);
  } finally { clearTimeout(tm); }
}

// ── UI umum ──
function toast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = 'toast align-items-center border-0 text-bg-' + (type === 'danger' ? 'danger' : type === 'warning' ? 'warning' : 'success');
  t.setAttribute('role', 'alert');
  t.innerHTML = `<div class="d-flex"><div class="toast-body">${esc(msg)}</div><button class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Tutup"></button></div>`;
  $('toasts').appendChild(t);
  t.addEventListener('hidden.bs.toast', () => t.remove());
  new bootstrap.Toast(t, { delay: 4500 }).show();
}
function busy(b, on) {
  if (!b) return;
  if (on) { b.dataset.t = b.innerHTML; b.disabled = true; b.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Memproses...'; }
  else { b.disabled = false; b.innerHTML = b.dataset.t; }
}
const loading = () => $('app-container').innerHTML = S.page === 'dashboard'
  ? `<div class="dash" aria-busy="true"><div class="col"><div class="sk" style="height:236px;border-radius:24px"></div><div class="tiles">${'<div class="sk" style="height:104px"></div>'.repeat(6)}</div><div class="grid4">${'<div class="sk" style="height:104px"></div>'.repeat(4)}</div><div class="sk" style="height:300px"></div></div><div class="col"><div class="sk" style="height:140px"></div><div class="sk" style="height:250px"></div></div></div>`
  : '<div aria-busy="true"><div class="sk" style="height:84px"></div><div class="sk mt-3" style="height:320px"></div></div>';
// Bilah kemajuan di tepi atas: tampil selama ada permintaan ke server (pengingat latar belakang tidak dihitung)
const PROG = { n: 0, t: 0 };
function progMulai() { const p = $('prog'); if (!p || PROG.n++) return; const i = p.firstElementChild; clearTimeout(PROG.t); i.style.transition = 'none'; i.style.width = '0'; p.classList.add('on'); void i.offsetWidth; i.style.transition = 'width 9s cubic-bezier(.1,.7,.2,1)'; i.style.width = '86%'; }
function progSelesai() { const p = $('prog'); if (!p) return; PROG.n = Math.max(0, PROG.n - 1); if (PROG.n) return; const i = p.firstElementChild; i.style.transition = 'width .2s ease-out'; i.style.width = '100%'; PROG.t = setTimeout(() => p.classList.remove('on'), 260); }
// Perangkat sederhana atau hemat data: kurangi animasi agar tetap ringan
(function () { try { const c = navigator.connection || {}; if ((navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) || c.saveData || /(^|-)2g$/.test(c.effectiveType || '')) document.documentElement.classList.add('lite'); } catch (e) {} })();
// Berkas hasil unduhan server ({mime,nama,data}): PDF diunduh, gambar ditampilkan
function tampilBerkas(x) {
  if (x.mime === 'application/pdf') { const bin = atob(x.data), a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); const l = document.createElement('a'); l.href = URL.createObjectURL(new Blob([a], { type: x.mime })); l.download = /\.pdf$/i.test(x.nama) ? x.nama : x.nama + '.pdf'; document.body.appendChild(l); l.click(); l.remove(); toast('Berkas PDF diunduh.'); }
  else openModal('Berkas: ' + x.nama, `<img class="w-100" alt="Berkas" src="data:${x.mime};base64,${x.data}">`);
}
function bacaB64(f) { return new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = () => no(new Error('Gagal membaca berkas.')); r.readAsDataURL(f); }); }
/** Mengolah gambar di peramban. mode 'fit': sisi terpanjang <= w. mode 'cover': dipotong tengah menjadi tepat w x h. Mengembalikan data URL. */
function olahGambar(file, w, h, mode, tipe, mutu) {
  return new Promise((ok, no) => {
    const img = new Image(), u = URL.createObjectURL(file);
    img.onload = () => {
      const c = document.createElement('canvas'), g = c.getContext('2d');
      if (mode === 'cover') {
        c.width = w; c.height = h; const k = Math.max(w / img.width, h / img.height), dw = img.width * k, dh = img.height * k;
        if (tipe === 'image/jpeg') { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); } g.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      } else {
        const k = Math.min(1, w / Math.max(img.width, img.height)); c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
        if (tipe === 'image/jpeg') { g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); } g.drawImage(img, 0, 0, c.width, c.height);
      }
      URL.revokeObjectURL(u); ok(c.toDataURL(tipe || 'image/png', mutu || 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(u); no(new Error('Berkas bukan gambar yang valid.')); }; img.src = u;
  });
}
function openModal(t, h) { $('mdlT').textContent = t; $('mdlB').innerHTML = h; bootstrap.Modal.getOrCreateInstance($('mdl')).show(); }
function closeModal() { const m = bootstrap.Modal.getInstance($('mdl')); if (m) m.hide(); }
function setTheme(t) {
  document.documentElement.dataset.theme = t; document.documentElement.dataset.bsTheme = t;
  try { localStorage.setItem('theme', t); } catch (e) {}
  if (chart && lastChart) drawChart(...lastChart);
}
const toggleTheme = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
function toggleSidebar() { $('sidebar').classList.toggle('open'); $('scrim').classList.toggle('show'); }
function closeSidebar() { $('sidebar').classList.remove('open'); $('scrim').classList.remove('show'); }
function askReason(title, cb) {
  window.reasonCb = cb;
  openModal(title, `<form onsubmit="submitReason(event)"><label class="lbl" for="alasan">Alasan *</label><textarea id="alasan" class="form-control" rows="3" required></textarea><div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">Lanjutkan</button></div></form>`);
}
function submitReason(e) { e.preventDefault(); const a = $('alasan').value.trim(); if (!a) return; closeModal(); window.reasonCb(a); }

// ── Sesi & navigasi SPA ──
function logoutLocal(gerbang) { S.token = null; S.user = null; clearInterval(S.iv); clearInterval(S.jam); Object.keys(PC).forEach(k => delete PC[k]); if (typeof dcBersih === 'function') { dcBersih(); Object.keys(PETA).forEach(k => delete PETA[k]); try { localStorage.removeItem('lg_peta'); } catch (e) {} } if (chart) { chart.destroy(); chart = null; } closeModal(); closeSidebar(); document.body.classList.add('guest'); renderLogin(); if (gerbang === true) tampilGerbang(); }
function expire() { toast('Sesi berakhir. Silakan masuk kembali.', 'warning'); logoutLocal(); }
function doLogoutUI() { api('doLogout', S.token).catch(() => {}); logoutLocal(true); }

// ── Informasi aplikasi: teks sederhana (# judul bagian, - butir, baris biasa = paragraf) ditampilkan aman tanpa HTML mentah ──
function infoHtml(t) {
  const o = []; let ul = false;
  String(t || '').split('\n').forEach(l => {
    l = l.trimEnd();
    if (/^- /.test(l)) { if (!ul) { o.push('<ul class="info-ul">'); ul = true; } o.push('<li>' + esc(l.slice(2)) + '</li>'); return; }
    if (ul) { o.push('</ul>'); ul = false; }
    if (/^# /.test(l)) o.push('<h4 class="info-h">' + esc(l.slice(2)) + '</h4>'); else if (l.trim()) o.push('<p>' + esc(l) + '</p>');
  });
  if (ul) o.push('</ul>'); return o.join('');
}
function tampilInfo() { openModal(TP.infoJudul || 'Informasi', `<div class="info-isi">${infoHtml(TP.info)}</div>`); }

// ── Gerbang depan: landing "Pelayaran" (landing.html) dimuat penuh layar di atas halaman masuk ──
// Landing berada di iframe agar gaya dan skripnya terpisah dari aplikasi. Tombol "Masuk" di landing mengirim pesan ke sini.
function tampilGerbang() {
  const lama = $('gerbang'); if (lama) lama.remove();
  const g = document.createElement('div'); g.id = 'gerbang'; g.className = 'lp';
  g.innerHTML = '<iframe src="landing.html" title="Halaman depan LAGUSIT e-PEGAWAI"></iframe>';
  document.body.appendChild(g); document.body.classList.add('guest');
  const tutup = () => { removeEventListener('message', onMsg); if (!g.isConnected) return; g.classList.add('keluar'); setTimeout(() => { g.remove(); const em = $('em'); if (em) em.focus(); }, 480); };
  function onMsg(e) { if (e.origin === location.origin && e.data && e.data.lagusit === 'masuk') tutup(); }
  addEventListener('message', onMsg);
}

// ── Halaman akun ──
const authCard = (t, s, b) => `<div class="auth"><div class="card-x auth-card"><div class="auth-brand">${brandHtml()}</div><h2 class="h4">${t}</h2><p class="muted">${s}</p>${b}</div></div>`;
function renderLogin() {
  $('app-container').innerHTML = authCard('Masuk', 'Gunakan email aktif sebagai ID pengguna.', `<form onsubmit="doLoginUI(event)">
    <label class="lbl" for="em">Email</label><input id="em" name="email" type="email" class="form-control mb-3" required autocomplete="username">
    <label class="lbl" for="pw">Kata sandi</label><input id="pw" name="password" type="password" class="form-control mb-3" required autocomplete="current-password">
    <button class="btn-x w-100" type="submit">Masuk</button></form>
    <p class="mt-3 mb-1 text-center"><a href="javascript:void(0)" onclick="renderLupa()">Lupa kata sandi?</a></p>
    <p class="mb-0 text-center">Belum punya akun? <a href="javascript:void(0)" onclick="renderDaftar()">Daftar</a></p>`);
}
function renderDaftar() {
  $('app-container').innerHTML = authCard('Daftar akun', 'Akun baru dapat dipakai setelah disetujui Super Admin.', `<form onsubmit="doDaftarUI(event)">
    <label class="lbl" for="dn">Nama lengkap *</label><input id="dn" name="nama" class="form-control mb-3" minlength="3" maxlength="100" required autocomplete="name">
    <label class="lbl" for="dnip">NIP * <span class="muted">(angka saja, 8–20 digit)</span></label><input id="dnip" name="nip" class="form-control mb-3" inputmode="numeric" pattern="[0-9]{8,20}" title="NIP berupa 8 sampai 20 digit angka" required>
    <label class="lbl" for="de">Email aktif *</label><input id="de" name="email" type="email" class="form-control mb-3" required autocomplete="username">
    <label class="lbl" for="dp">Kata sandi (min. 8 karakter)</label><input id="dp" name="password" type="password" minlength="8" class="form-control mb-3" required autocomplete="new-password">
    <label class="lbl" for="dq">Ulangi kata sandi</label><input id="dq" name="ulang" type="password" class="form-control mb-3" required autocomplete="new-password">
    <button class="btn-x w-100" type="submit">Kirim pendaftaran</button></form>
    <p class="mt-3 mb-0 text-center"><a href="javascript:void(0)" onclick="renderLogin()">Kembali ke halaman masuk</a></p>`);
}
function renderLupa() {
  $('app-container').innerHTML = authCard('Lupa kata sandi', 'Masukkan email akun Anda. Kode atur ulang dikirim ke email tersebut.', `<form onsubmit="lupaMintaUI(event)">
    <label class="lbl" for="le">Email akun</label><input id="le" name="email" type="email" class="form-control mb-3" required autocomplete="username">
    <button class="btn-x w-100" type="submit">Kirim kode</button></form>
    <p class="mt-3 mb-1 text-center"><a href="javascript:void(0)" onclick="renderReset('')">Saya sudah punya kode</a></p>
    <p class="mb-0 text-center"><a href="javascript:void(0)" onclick="renderLogin()">Kembali ke halaman masuk</a></p>`);
}
function renderReset(em) {
  $('app-container').innerHTML = authCard('Atur kata sandi baru', 'Masukkan kode dari email (berlaku 30 menit, sekali pakai).', `<form onsubmit="lupaResetUI(event)">
    <label class="lbl" for="re">Email akun</label><input id="re" name="email" type="email" class="form-control mb-3" value="${esc(em)}" required autocomplete="username">
    <label class="lbl" for="rk">Kode</label><input id="rk" name="kode" class="form-control mb-3" required autocomplete="one-time-code" style="text-transform:uppercase">
    <label class="lbl" for="rb">Kata sandi baru (min. 8 karakter)</label><input id="rb" name="baru" type="password" minlength="8" class="form-control mb-3" required autocomplete="new-password">
    <label class="lbl" for="ru">Ulangi kata sandi baru</label><input id="ru" name="ulang" type="password" class="form-control mb-3" required autocomplete="new-password">
    <button class="btn-x w-100" type="submit">Simpan kata sandi</button></form>
    <p class="mt-3 mb-0 text-center"><a href="javascript:void(0)" onclick="renderLogin()">Kembali ke halaman masuk</a></p>`);
}
async function lupaMintaUI(e) {
  e.preventDefault(); const f = e.target, b = f.querySelector('[type=submit]'); busy(b, true);
  try { const r = await api('mintaKodeReset', f.email.value.trim()); toast(r.message, r.success ? 'success' : 'danger'); if (r.success) renderReset(f.email.value.trim()); }
  catch (x) { toast('Gagal menghubungi server: ' + x.message, 'danger'); }
  busy(b, false);
}
async function lupaResetUI(e) {
  e.preventDefault(); const f = e.target;
  if (f.baru.value !== f.ulang.value) return toast('Pengulangan kata sandi tidak sama.', 'danger');
  const b = f.querySelector('[type=submit]'); busy(b, true);
  try { const r = await api('resetDenganKode', f.email.value.trim(), f.kode.value.trim(), f.baru.value); toast(r.message, r.success ? 'success' : 'danger'); if (r.success) renderLogin(); }
  catch (x) { toast('Gagal menghubungi server: ' + x.message, 'danger'); }
  busy(b, false);
}
function renderGanti() {
  $('pageTitle').textContent = 'Ganti kata sandi';
  $('app-container').innerHTML = authCard('Ganti kata sandi', 'Anda memakai kata sandi sementara. Buat kata sandi baru untuk melanjutkan.', `<form onsubmit="doGantiUI(event)">
    <label class="lbl" for="gl">Kata sandi saat ini</label><input id="gl" name="lama" type="password" class="form-control mb-3" required autocomplete="current-password">
    <label class="lbl" for="gb">Kata sandi baru (min. 8 karakter)</label><input id="gb" name="baru" type="password" minlength="8" class="form-control mb-3" required autocomplete="new-password">
    <label class="lbl" for="gu">Ulangi kata sandi baru</label><input id="gu" name="ulang" type="password" class="form-control mb-3" required autocomplete="new-password">
    <button class="btn-x w-100" type="submit">Simpan kata sandi</button></form>`);
}
async function doLoginUI(e) {
  e.preventDefault(); const b = e.target.querySelector('[type=submit]'); busy(b, true);
  try { const r = await api('doLogin', e.target.email.value, e.target.password.value); r.success ? start(r.data) : toast(r.message, 'danger'); }
  catch (x) { toast('Gagal menghubungi server: ' + x.message, 'danger'); }
  busy(b, false);
}
async function doDaftarUI(e) {
  e.preventDefault(); const f = e.target;
  if (f.password.value !== f.ulang.value) return toast('Pengulangan kata sandi tidak sama.', 'danger');
  const b = f.querySelector('[type=submit]'); busy(b, true);
  try { const r = await api('doDaftar', { nama: f.nama.value.trim(), nip: f.nip.value.trim(), email: f.email.value.trim(), password: f.password.value }); toast(r.message, r.success ? 'success' : 'danger'); if (r.success) renderLogin(); }
  catch (x) { toast('Gagal menghubungi server: ' + x.message, 'danger'); }
  busy(b, false);
}
async function doGantiUI(e) {
  e.preventDefault(); const f = e.target;
  if (f.baru.value !== f.ulang.value) return toast('Pengulangan kata sandi tidak sama.', 'danger');
  const b = f.querySelector('[type=submit]'); busy(b, true);
  const r = await call('gantiPassword', f.lama.value, f.baru.value); busy(b, false);
  if (r) { toast(r.message); S.user.wajibGanti = false; navigateTo('dashboard'); muatNotif(); clearInterval(S.iv); S.iv = setInterval(muatNotif, 300000); }
}

// ── Pegawai ──
RENDER.pegawai = async () => {
  const [r, ru, op, jj] = await Promise.all([call('listPegawai'), call('listUnit'), call('getOpsiKepegawaian'), call('getJenisJabatan')]); if (!r) return; S.pegawai = r.data; S.units = ru ? ru.data : []; if (op) S.opsi = op.data; S.jj = jj ? jj.data : { jenis: [], nama: [] };
  $('app-container').innerHTML = `<div class="card-x"><div class="toolbar">
    <input id="q" class="form-control" placeholder="Cari nama, NIP, jabatan, unit" aria-label="Cari pegawai" oninput="drawPegawai()">
    <select id="fs" class="form-select" aria-label="Filter status" onchange="drawPegawai()"><option value="">Semua status</option>${STATUS.map(s => `<option>${s}</option>`).join('')}</select>
    <select id="fp" class="form-select" aria-label="Filter penugasan" onchange="drawPegawai()"><option value="">Semua penugasan</option><option value="-">Pegawai induk (bertugas di Lapas)</option><option value="K">Semua Pegawai Keluar</option><option value="M">Semua Pegawai Masuk</option>${PENUGASAN.map(s => `<option>${s}</option>`).join('')}</select>
    <label class="chk"><input type="checkbox" id="fa" onchange="drawPegawai()"> Tampilkan nonaktif</label>
    ${isAdmin() ? '<button class="btn-o ms-auto" onclick="formImpor()"><i class="bi bi-file-earmark-arrow-up"></i> Impor DUK</button> <button class="btn-x" onclick="formPegawai()"><i class="bi bi-plus-lg"></i> Tambah pegawai</button>' : ''}</div><div id="tm"></div><div id="pfl"></div><p id="pc" class="small muted mb-2" aria-live="polite"></p><div id="pl"></div></div>`;
  S.pf = S.pf || {}; panelFilter(); drawPegawai(); muatTugasMasuk();
};
async function muatTugasMasuk() {
  const r = await call('getTugasMasuk'); if (!r || !$('tm')) return; const d = r.data;
  $('tm').innerHTML = `<div class="border rounded p-3 mb-3"><b><i class="bi bi-arrow-left-right"></i> Penugasan antar unit</b> · Pegawai Keluar aktif: <b>${d.keluar}</b> (tidak dilibatkan dalam kegiatan harian) · Pegawai Masuk aktif: <b>${d.masuk}</b>, dilibatkan <b>${d.masukLibat}</b>.<br><span class="small">Pegawai Masuk (${PEN_MASUK.join(', ')}) <b>${d.terlibat ? 'dilibatkan' : 'tidak dilibatkan'}</b> dalam apel, regu, piket, dan petugas apel secara umum${isAdmin() ? '; pengecualian per pegawai diatur di formulir Ubah.' : '.'} Rekap kehadirannya dapat ditarik tersendiri di menu Laporan (pilih Kelompok pegawai ▸ Pegawai Masuk).</span>${isAdmin() ? ` <button class="btn-o ms-2" onclick="ubahTugasMasuk(${!d.terlibat})">${d.terlibat ? 'Jangan libatkan Pegawai Masuk' : 'Libatkan Pegawai Masuk'}</button>` : ''}</div>`;
}
async function ubahTugasMasuk(v) { const r = await call('simpanTugasMasuk', v); if (r) { toast(r.message); RENDER.pegawai(); } }
const akunBadge = p => p.Akun ? `<span class="badge-x ${p.Akun === 'Aktif' ? 'ok' : p.Akun === 'Menunggu' ? 'wait' : 'off'}">${esc(p.Akun)}</span>` : '<span class="badge-x off">Belum ada</span>';
function unitOpsi(cur) { // sumber tunggal: unit kerja yang diatur Super Admin di Master Data
  const A = (S.units || []).filter(x => x.Aktif === true).map(x => x.Nama).sort((a, b) => a.localeCompare(b));
  return '<option value="">Pilih unit kerja...</option>' + A.map(n => `<option value="${esc(n)}" ${n === cur ? 'selected' : ''}>${esc(n)}</option>`).join('') + (cur && !A.includes(cur) ? `<option value="${esc(cur)}" selected>${esc(cur)} (tidak terdaftar)</option>` : '');
}
function drawPegawai() {
  const q = $('q').value.toLowerCase(), fs = $('fs').value, fa = $('fa').checked, fp = $('fp').value;
  const L = urutPegawai(S.pegawai.filter(p => (fa || p.Aktif === true) && (!fs || p.StatusKepegawaian === fs) && (!fp || (fp === '-' ? !p.Penugasan : fp === 'K' ? p.Arah === 'Keluar' : fp === 'M' ? p.Arah === 'Masuk' : p.Penugasan === fp)) && [p.Nama, p.NIP, p.Jabatan, p.Unit].join(' ').toLowerCase().includes(q) && lolosFilter(p)));
  const jk = k => L.filter(p => p.JenisKelamin === k).length; $('pc').innerHTML = `Menampilkan <b>${L.length}</b> dari ${S.pegawai.filter(p => fa || p.Aktif === true).length} pegawai${L.some(p => p.JenisKelamin) ? ` · Laki-laki ${jk('Laki-laki')} · Perempuan ${jk('Perempuan')}` : ''}`;
  $('pl').innerHTML = L.length ? `<div class="table-wrap"><table class="table"><thead><tr><th class="nw">No.</th><th>Nama</th><th>NIP</th><th>Pangkat/Gol.</th><th>Jabatan</th><th>Unit</th><th>Status</th><th>Akun</th>${isAdmin() ? '<th>Aksi</th>' : ''}</tr></thead><tbody>${L.map(p => `<tr><td class="nw muted">${esc(p.Urutan)}</td><td>${esc(p.Nama)}</td><td class="nw">${esc(p.NIP)}</td><td>${esc(p.Pangkat)} ${esc(p.Golongan)}</td><td>${esc(p.Jabatan)}${p.JenisNama ? `<small class="d-block muted">${esc(p.JenisNama)}</small>` : ''}</td><td>${esc(p.Unit)}</td><td><span class="badge-x ${p.Aktif === true ? 'ok' : 'off'}">${p.Aktif === true ? esc(p.StatusKepegawaian || 'Aktif') : 'Nonaktif'}</span>${p.Penugasan ? ` <span class="badge-x wait" title="${esc((p.Arah === 'Masuk' ? 'Dari: ' : 'Ke: ') + (p.PenugasanKet || '-'))}">${esc(p.Penugasan)}</span><small class="d-block muted">${p.Arah === 'Masuk' ? 'Masuk' : 'Keluar'} · ${p.Libat ? 'ikut kegiatan harian' : 'tidak ikut kegiatan harian'}</small>` : ''}</td><td>${akunBadge(p)}</td>${isAdmin() ? `<td class="nw"><button class="btn-o" onclick="formPegawai('${p.ID}')">Ubah</button> <button class="btn-o" onclick="profilPeg('${p.ID}')">Profil</button>${p.Aktif === true ? ` <button class="btn-o danger" onclick="formNonaktif('${p.ID}')">Nonaktifkan</button>` : ` <button class="btn-o danger" onclick="formHapusPeg('${p.ID}')"><i class="bi bi-trash"></i> Hapus permanen</button>`}</td>` : ''}</tr>`).join('')}</tbody></table></div>` : '<p class="muted mb-0 py-3">Belum tersedia: tidak ada data yang cocok.</p>';
}
function pnBerubah() { const v = $('fPn').value; $('fPnK').disabled = !v; $('bTl').hidden = !PEN_MASUK.includes(v); $('lPnK').textContent = PEN_MASUK.includes(v) ? 'Unit asal penugasan' : PEN_KELUAR.includes(v) ? 'Unit tujuan penugasan' : 'Unit asal / tujuan penugasan'; }
function formPegawai(id) {
  const p = S.pegawai.find(x => x.ID === id) || {};
  const f = (k, l, t = 'text', req) => `<div class="col-md-6"><label class="lbl" for="f${k}">${l}${req ? ' *' : ''}</label><input id="f${k}" name="${k}" type="${t}" class="form-control" value="${esc(p[k])}" ${req ? 'required' : ''}></div>`;
  openModal(id ? 'Ubah pegawai' : 'Tambah pegawai', `<form onsubmit="savePegawai(event)"><input type="hidden" name="ID" value="${esc(p.ID)}"><input type="hidden" name="UpdatedAt" value="${esc(p.UpdatedAt)}">
    <div class="row g-3">${f('Nama', 'Nama lengkap', 'text', 1)}${f('NIP', 'NIP', 'text', 1)}<div class="col-md-6"><label class="lbl" for="fJK">Jenis kelamin</label><select id="fJK" name="JenisKelamin" class="form-select"><option value="">Belum diisi</option>${['Laki-laki', 'Perempuan'].map(x => `<option ${p.JenisKelamin === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div><div class="col-md-6"><label class="lbl" for="fUrutan">No. urut (sesuai DUK)</label><input id="fUrutan" name="Urutan" type="number" min="1" max="9999" class="form-control" value="${esc(p.Urutan)}"><small class="muted">Menentukan urutan di daftar pegawai, apel, piket, dan laporan.</small></div><div class="col-md-6"><label class="lbl" for="fGol">Golongan</label><select id="fGol" name="Golongan" class="form-select" onchange="pgBerubah('fGol','fPangkat',$('fSt').value)"></select></div><div class="col-md-6"><label class="lbl" for="fPangkat">Pangkat</label><select id="fPangkat" name="Pangkat" class="form-select"></select></div><div class="col-md-6"><label class="lbl" for="fJabatan">Jabatan</label><input id="fJabatan" name="Jabatan" class="form-control" list="jbNama" value="${esc(p.Jabatan)}"><datalist id="jbNama">${((S.jj || {}).nama || []).map(n => `<option value="${esc(n)}">`).join('')}</datalist></div><div class="col-md-6"><label class="lbl" for="fJenis">Jenis jabatan</label><select id="fJenis" name="JenisJabatan" class="form-select"><option value="">Otomatis (ikuti nama jabatan)</option>${((S.jj || {}).jenis || []).map(j => `<option value="${j.ID}" ${p.JenisJabatan === j.ID ? 'selected' : ''}>${esc(j.Nama)}</option>`).join('')}</select><div class="small muted mt-1">${p.JenisNama ? 'Saat ini: ' + esc(p.JenisNama) + (p.JenisSumber === 'Manual' ? ' (manual)' : ' (dari nama jabatan)') + '. ' : ''}Atur daftar di Master Data ▸ Jabatan.</div></div><div class="col-md-6"><label class="lbl" for="fUnit">Unit kerja</label><select id="fUnit" name="Unit" class="form-select">${unitOpsi(p.Unit)}</select>${(S.units || []).some(x => x.Aktif === true) ? '<div class="small muted mt-1">Pilihan mengikuti Master Data ▸ Unit &amp; Regu.</div>' : '<div class="small text-danger mt-1">Belum ada unit kerja aktif. Tambahkan dulu di Master Data ▸ Unit &amp; Regu.</div>'}</div>
    <div class="col-md-6"><label class="lbl" for="fSt">Status kepegawaian</label><select id="fSt" name="StatusKepegawaian" class="form-select" onchange="rakitPG('fGol','fPangkat',this.value)"><option value="">Pilih...</option>${STATUS.map(s => `<option ${p.StatusKepegawaian === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
    ${f('TMT', 'TMT', 'date')}${f('Email', 'Email aktif', 'email')}
    <div class="col-md-6"><label class="lbl" for="fPn">Penugasan</label><select id="fPn" name="Penugasan" class="form-select" onchange="pnBerubah()"><option value="">Pegawai induk (bertugas di Lapas)</option><optgroup label="Pegawai Keluar (ditugaskan ke unit lain)">${PEN_KELUAR.map(s => `<option ${p.Penugasan === s ? 'selected' : ''}>${s}</option>`).join('')}</optgroup><optgroup label="Pegawai Masuk (dari unit lain ke sini)">${PEN_MASUK.map(s => `<option ${p.Penugasan === s ? 'selected' : ''}>${s}</option>`).join('')}</optgroup></select><small class="muted">Pegawai Keluar tidak ikut apel, regu, piket, dan jadwal petugas. Pegawai Masuk ikut bila diizinkan Super Admin.</small></div><div class="col-md-6"><label class="lbl" for="fPnK" id="lPnK">Unit asal / tujuan penugasan</label><input id="fPnK" name="PenugasanKet" class="form-control" maxlength="120" value="${esc(p.PenugasanKet)}" ${p.Penugasan ? '' : 'disabled'} placeholder="Contoh: Lapas Nusakambangan"></div><div class="col-md-6" id="bTl" ${p.Arah === 'Masuk' ? '' : 'hidden'}><label class="lbl" for="fTl">Keterlibatan kegiatan harian</label><select id="fTl" name="Terlibat" class="form-select"><option value="">Ikut pengaturan umum</option><option value="Ya" ${p.Terlibat === 'Ya' ? 'selected' : ''}>Dilibatkan</option><option value="Tidak" ${p.Terlibat === 'Tidak' ? 'selected' : ''}>Tidak dilibatkan</option></select></div></div></div>
    <div class="text-end mt-4"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">Simpan</button></div></form>`);
  rakitPG('fGol', 'fPangkat', p.StatusKepegawaian || '', p.Golongan || '', p.Pangkat || ''); pnBerubah();
}
async function savePegawai(e) {
  e.preventDefault(); const b = e.target.querySelector('[type=submit]'); busy(b, true);
  const d = Object.fromEntries(new FormData(e.target)); if (!d.ID) delete d.ID; if (!d.UpdatedAt) delete d.UpdatedAt; if (!d.PenugasanKet) d.PenugasanKet = '';
  const r = await call('simpanPegawai', d); busy(b, false);
  if (r) { closeModal(); toast(r.message); RENDER.pegawai(); }
}
function formHapusPeg(id) { askReason('Hapus permanen pegawai nonaktif (tidak dapat dikembalikan)', async a => { const r = await call('hapusPegawai', id, a); if (r) { toast(r.message); RENDER.pegawai(); } }); }
function formNonaktif(id) { askReason('Nonaktifkan pegawai', async a => { const r = await call('nonaktifkanPegawai', id, a); if (r) { toast(r.message); RENDER.pegawai(); } }); }

// ── Riwayat aktivitas & profil ──
RENDER.audit = async () => { const r = await call('getAudit'); if (r) $('app-container').innerHTML = `<div class="card-x">${auditTable(r.data)}</div>`; };

document.addEventListener('DOMContentLoaded', () => {
  let t = 'light'; try { t = localStorage.getItem('theme') || 'light'; } catch (e) {}
  muatTampilan(); setTheme(t); $('boot').remove(); renderLogin(); tampilGerbang();
});

// ── Pilihan pangkat dan golongan: golongan dibatasi menurut status; memilih golongan PNS mengisi pangkat yang sesuai ──
function rakitPG(ig, ip, status, g0, p0) {
  const O = S.opsi; if (!O) return; const G = $(ig), P = $(ip), pppk = status === 'PPPK';
  const g = g0 !== undefined ? g0 : G.value, p = p0 !== undefined ? p0 : P.value, ada = new Set();
  const opt = (v, l, sel) => `<option value="${esc(v)}" ${sel ? 'selected' : ''}>${esc(l)}</option>`;
  let h = '<option value="">Pilih golongan...</option>';
  if (!pppk) h += '<optgroup label="PNS dan CPNS (golongan ruang)">' + O.pns.map(x => { ada.add(x.gol); return opt(x.gol, x.gol + ' (' + x.pangkat + ')', x.gol === g); }).join('') + '</optgroup>';
  if (pppk || !status) h += '<optgroup label="PPPK">' + O.pppk.map(x => { ada.add(x); return opt(x, 'Golongan ' + x, x === g); }).join('') + '</optgroup>';
  if (g && !ada.has(g)) h += opt(g, g + ' (data lama)', true);
  G.innerHTML = h;
  const nama = O.pns.map(x => x.pangkat);
  P.innerHTML = '<option value="">' + (pppk ? 'Tidak ada (PPPK tidak memiliki pangkat)' : 'Pilih pangkat...') + '</option>' + (pppk ? '' : nama.map(n => opt(n, n, n === p)).join('') + (p && !nama.includes(p) ? opt(p, p + ' (data lama)', true) : ''));
  P.disabled = pppk;
}
function pgBerubah(ig, ip, status) { const x = S.opsi.pns.find(y => y.gol === $(ig).value); if (x && status !== 'PPPK') $(ip).value = x.pangkat; }

// ── Tabel menjadi kartu di layar HP: setiap sel diberi label kolom (CSS memakai atribut data-l) ──
function labelTables() {
  document.querySelectorAll('#app-container table.table, #mdlB table.table').forEach(t => {
    if (t.dataset.tc || t.closest('#lh') || t.closest('.mx')) return;
    const h = [...t.querySelectorAll('thead th')].map(x => x.textContent.trim()); if (h.length < 2 || h.length > 8) return;
    t.querySelectorAll('tbody tr').forEach(tr => [...tr.children].forEach((td, i) => { td.dataset.l = h[i] || ''; }));
    t.classList.add('tc'); t.dataset.tc = '1';
  });
}
['app-container', 'mdlB'].forEach(id => { const el = document.getElementById(id); if (el && window.MutationObserver) new MutationObserver(labelTables).observe(el, { childList: true, subtree: true }); });

// ── Impor Pegawai (DUK) dari berkas CSV: pratinjau dulu, baru simpan ──
const IMPOR_KOLOM = { 'jenis kelamin': 'JenisKelamin', 'unit': 'Unit', 'unit kerja': 'Unit', 'tmt golongan berikutnya': 'TMTGol', 'tmt golongan': 'TMTGol', 'tmt kgb berikutnya': 'TMTKgb', 'tmt kgb': 'TMTKgb', 'no urut': 'Urutan', 'urutan': 'Urutan', 'no': 'Urutan', 'nip': 'NIP', 'nama': 'Nama', 'jabatan': 'Jabatan', 'pangkat': 'Pangkat', 'golongan': 'Golongan', 'status kepegawaian': 'StatusKepegawaian', 'status': 'StatusKepegawaian', 'tmt pegawai': 'TMT', 'tmt': 'TMT', 'tanggal lahir': 'TglLahir', 'agama': 'Agama', 'pendidikan terakhir': 'Pendidikan', 'pendidikan': 'Pendidikan', 'tmt pangkat': 'TMTPangkat', 'tmt jabatan': 'TMTJabatan', 'penugasan': 'Penugasan', 'jenis jabatan': 'JenisJabatan' };
const IMPOR_CONTOH = 'No Urut,NIP,Nama,Jenis Kelamin,Jabatan,Unit,Golongan,Pangkat,Status Kepegawaian,TMT Pegawai,Tanggal Lahir,Agama,Pendidikan Terakhir,TMT Pangkat,TMT Jabatan,TMT Golongan Berikutnya,TMT KGB Berikutnya,Penugasan,Jenis Jabatan\n';
function csvUrai(teks) { // CSV bertanda kutip; pemisah koma atau titik koma (menyesuaikan pengaturan regional Excel)
  teks = String(teks).replace(/^﻿/, ''); const awal = teks.split('\n')[0], sep = (awal.match(/;/g) || []).length > (awal.match(/,/g) || []).length ? ';' : ',';
  const R = []; let b = [], c = '', q = false;
  for (let i = 0; i < teks.length; i++) { const ch = teks[i];
    if (q) { if (ch === '"') { if (teks[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; }
    else if (ch === '"') q = true; else if (ch === sep) { b.push(c); c = ''; } else if (ch === '\n') { b.push(c); R.push(b); b = []; c = ''; } else if (ch !== '\r') c += ch; }
  if (c !== '' || b.length) { b.push(c); R.push(b); } return R.filter(r => r.some(x => String(x).trim() !== ''));
}
function formImpor() {
  S.imp = null;
  openModal('Impor Pegawai (DUK)', `<p class="muted small">Unggah berkas CSV berisi data pegawai. NIP dipakai sebagai kunci: NIP yang sudah ada diperbarui (tidak digandakan), NIP baru ditambahkan. Email tidak diubah; pegawai mengisinya saat mendaftar dan akunnya otomatis tertaut ke data ini setelah disetujui Super Admin.</p>
  <div class="mb-3"><label class="lbl" for="impF">Berkas CSV</label><input id="impF" type="file" accept=".csv,text/csv" class="form-control" onchange="imporBaca(this)"><small class="muted">Kolom: No Urut, NIP, Nama, Jenis Kelamin (L/P), Jabatan, Unit (harus terdaftar di Master Data), Golongan, Pangkat, Status Kepegawaian, TMT Pegawai, Tanggal Lahir, Agama, Pendidikan Terakhir, TMT Pangkat, TMT Jabatan, TMT Golongan Berikutnya, TMT KGB Berikutnya, Penugasan. Tanggal berformat TTTT-BB-HH. <a href="javascript:void(0)" onclick="imporContoh()">Unduh templat kosong</a></small></div><div id="impHasil" aria-live="polite"></div>`);
}
function imporContoh() { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + IMPOR_CONTOH], { type: 'text/csv' })); a.download = 'templat-impor-pegawai.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
async function imporBaca(inp) {
  const f = inp.files[0]; if (!f) return; const h = $('impHasil');
  if (f.size > 2 * 1024 * 1024) { h.innerHTML = '<p class="text-danger">Berkas terlalu besar (maks. 2 MB).</p>'; return; }
  const R = csvUrai(await f.text()); if (R.length < 2) { h.innerHTML = '<p class="text-danger">Berkas kosong atau tidak memiliki baris data.</p>'; return; }
  const kol = R[0].map(x => IMPOR_KOLOM[String(x).trim().toLowerCase()] || ''); if (!kol.includes('NIP') || !kol.includes('Nama')) { h.innerHTML = '<p class="text-danger">Judul kolom tidak dikenali. Pastikan baris pertama memuat minimal NIP dan Nama (lihat templat).</p>'; return; }
  S.imp = R.slice(1).map(r => { const o = {}; kol.forEach((k, i) => { if (k) o[k] = String(r[i] === undefined ? '' : r[i]).trim(); }); return o; });
  h.innerHTML = '<p class="muted">Memeriksa…</p>'; const r = await call('imporPegawai', { Baris: S.imp, Simulasi: true }); if (!r) { h.innerHTML = ''; return; } imporTampil(r.data);
}
function imporTampil(d) {
  const n = d.ringkasan, ST = { tambah: 'ok', ubah: 'wait', sama: 'off', galat: 'off' }, L = d.baris.filter(x => x.status === 'galat' || x.catatan.length), jml = n.tambah + n.ubah, final = !d.simulasi;
  $('impHasil').innerHTML = `<div class="kchips mb-2"><span class="kchip">Ditambah <b>${n.tambah}</b></span><span class="kchip">Diperbarui <b>${n.ubah}</b></span><span class="kchip">Sama <b>${n.sama}</b></span><span class="kchip ${n.galat ? 'lp' : ''}">Bermasalah <b>${n.galat}</b></span></div>
  ${d.kolomBaru && d.kolomBaru.length ? `<p class="small muted">Kolom Profil yang akan dibuat: ${d.kolomBaru.map(esc).join(', ')}.</p>` : ''}
  ${L.length ? `<div class="table-wrap" style="max-height:260px;overflow:auto"><table class="table"><thead><tr><th>Baris</th><th>Nama</th><th>Keterangan</th></tr></thead><tbody>${L.slice(0, 80).map(x => `<tr><td>${x.no}</td><td>${esc(x.Nama)}<small class="d-block muted">${esc(x.NIP)}</small></td><td>${x.galat ? `<span class="badge-x off">Dilewati</span> ${esc(x.galat)}` : esc(x.catatan.join('; '))}</td></tr>`).join('')}</tbody></table></div>` : '<p class="small muted">Tidak ada catatan; semua baris valid.</p>'}
  ${final ? '<div class="text-end mt-3"><button class="btn-x" onclick="closeModal();RENDER.pegawai()">Selesai</button></div>' : `<div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" onclick="imporSimpan(this)" ${jml || n.sama ? '' : 'disabled'}>Impor sekarang</button></div>`}`;
}
async function imporSimpan(b) { busy(b, true); const r = await call('imporPegawai', { Baris: S.imp, Simulasi: false }); busy(b, false); if (r) { toast(r.message); imporTampil(r.data); } }

// ── Filter lanjutan daftar pegawai: jenis jabatan, unit/bidang, jenis kelamin, golongan, TMT KGB, TMT Golongan; urutan bawaan = No. Urut DUK ──
const PF_TGL = [['kosong', 'Belum diisi'], ['lewat', 'Sudah jatuh tempo'], ['3', '≤ 3 bulan ke depan'], ['6', '≤ 6 bulan ke depan'], ['12', '≤ 12 bulan ke depan']];
const pfOpsi = (arr, cur, semua) => `<option value="">${semua}</option>` + arr.map(x => `<option value="${esc(x[0])}" ${String(cur) === String(x[0]) ? 'selected' : ''}>${esc(x[1])}</option>`).join('');
function panelFilter() {
  const P = S.pegawai, F = S.pf, uniq = f => [...new Set(P.map(f).filter(Boolean))], gol = uniq(p => p.Golongan).sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));
  const tgl = (k, lbl) => `<div class="col-6 col-lg-3"><label class="lbl" for="pf_${k}">${lbl}</label><select id="pf_${k}" class="form-select" onchange="pfUbah()">${pfOpsi(PF_TGL, F[k], 'Semua')}</select></div><div class="col-12 col-lg-3"><label class="lbl" for="pf_${k}d">${lbl}: rentang</label><div class="d-flex gap-1"><input id="pf_${k}d" type="date" class="form-control" value="${esc(F[k + 'd'] || '')}" onchange="pfUbah()" aria-label="${lbl} dari"><input id="pf_${k}s" type="date" class="form-control" value="${esc(F[k + 's'] || '')}" onchange="pfUbah()" aria-label="${lbl} sampai"></div></div>`;
  $('pfl').innerHTML = `<details class="pf mb-2" ${Object.values(F).some(Boolean) ? 'open' : ''}><summary class="btn-o d-inline-block" style="cursor:pointer"><i class="bi bi-funnel"></i> Filter lanjutan${Object.values(F).some(Boolean) ? ' (aktif)' : ''}</summary>
  <div class="row g-2 mt-1">
    <div class="col-6 col-lg-3"><label class="lbl" for="pf_jenis">Jenis jabatan</label><select id="pf_jenis" class="form-select" onchange="pfUbah()">${pfOpsi(uniq(p => p.JenisNama).sort().map(x => [x, x]).concat([['-', '(belum dikelompokkan)']]), F.jenis, 'Semua')}</select></div>
    <div class="col-6 col-lg-3"><label class="lbl" for="pf_unit">Unit kerja / bidang</label><select id="pf_unit" class="form-select" onchange="pfUbah()">${pfOpsi(uniq(p => p.Unit).sort().map(x => [x, x]).concat([['-', '(belum diisi)']]), F.unit, 'Semua')}</select></div>
    <div class="col-6 col-lg-3"><label class="lbl" for="pf_jk">Jenis kelamin</label><select id="pf_jk" class="form-select" onchange="pfUbah()">${pfOpsi([['Laki-laki', 'Laki-laki'], ['Perempuan', 'Perempuan'], ['-', '(belum diisi)']], F.jk, 'Semua')}</select></div>
    <div class="col-6 col-lg-3"><label class="lbl" for="pf_gol">Pangkat / golongan</label><select id="pf_gol" class="form-select" onchange="pfUbah()">${pfOpsi(['I', 'II', 'III', 'IV'].filter(g => gol.some(x => x.startsWith(g + '/'))).map(g => ['G' + g, 'Seluruh golongan ' + g]).concat(gol.map(g => [g, g])), F.gol, 'Semua')}</select></div>
    ${tgl('kgb', 'TMT KGB berikutnya')}${tgl('tg', 'TMT golongan berikutnya')}
    <div class="col-6 col-lg-3"><label class="lbl" for="pf_urut">Urutkan</label><select id="pf_urut" class="form-select" onchange="pfUbah()">${pfOpsi([['nama', 'Nama (A–Z)'], ['kgb', 'TMT KGB terdekat'], ['tg', 'TMT golongan terdekat']], F.urut, 'No. urut (sesuai DUK)')}</select></div>
    <div class="col-6 col-lg-3 d-flex align-items-end"><button type="button" class="btn-o" onclick="S.pf={};panelFilter();drawPegawai()">Atur ulang filter</button></div>
  </div></details>`;
}
function pfUbah() {
  const g = id => ($('pf_' + id) || {}).value || ''; S.pf = { jenis: g('jenis'), unit: g('unit'), jk: g('jk'), gol: g('gol'), kgb: g('kgb'), kgbd: g('kgbd'), kgbs: g('kgbs'), tg: g('tg'), tgd: g('tgd'), tgs: g('tgs'), urut: g('urut') };
  const a = $('pfl').querySelector('summary'); if (a) a.innerHTML = '<i class="bi bi-funnel"></i> Filter lanjutan' + (Object.values(S.pf).some(Boolean) ? ' (aktif)' : ''); drawPegawai();
}
function pfTgl(v, k) { // v = tanggal TTTT-BB-HH atau kosong; k = kunci filter (kgb | tg)
  const F = S.pf, m = F[k], d = F[k + 'd'], s = F[k + 's']; if (!m && !d && !s) return true;
  if (d || s) return !!v && (!d || v >= d) && (!s || v <= s);
  if (m === 'kosong') return !v; if (!v) return false; const t = today();
  if (m === 'lewat') return v <= t; const b = new Date(t + 'T00:00:00'); b.setMonth(b.getMonth() + Number(m)); return v > t && v <= b.toISOString().slice(0, 10);
}
function lolosFilter(p) {
  const F = S.pf || {}, pr = p.Profil || {};
  if (F.jenis && (F.jenis === '-' ? p.JenisNama : p.JenisNama !== F.jenis)) return false;
  if (F.unit && (F.unit === '-' ? p.Unit : p.Unit !== F.unit)) return false;
  if (F.jk && (F.jk === '-' ? p.JenisKelamin : p.JenisKelamin !== F.jk)) return false;
  if (F.gol && (F.gol.startsWith('G') ? !String(p.Golongan).startsWith(F.gol.slice(1) + '/') : p.Golongan !== F.gol)) return false;
  return pfTgl(pr.TMTKgb, 'kgb') && pfTgl(pr.TMTGol, 'tg');
}
function urutPegawai(L) {
  const u = (S.pf || {}).urut, n = p => Number(p.Urutan) >= 1 ? Number(p.Urutan) : 1e9, tg = (p, k) => (p.Profil || {})[k] || '9999';
  if (u === 'nama') return L.slice().sort((a, b) => String(a.Nama).localeCompare(b.Nama, 'id'));
  if (u === 'kgb') return L.slice().sort((a, b) => tg(a, 'TMTKgb').localeCompare(tg(b, 'TMTKgb')) || n(a) - n(b));
  if (u === 'tg') return L.slice().sort((a, b) => tg(a, 'TMTGol').localeCompare(tg(b, 'TMTGol')) || n(a) - n(b));
  return L.slice().sort((a, b) => n(a) - n(b));
}
