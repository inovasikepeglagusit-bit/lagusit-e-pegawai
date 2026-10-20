/** LAGUSIT e-PEGAWAI — Frontend SPA. Token hanya di memori (bukan URL); URL tidak pernah berubah. */
const S = { token: null, user: null, menu: [], pegawai: [], akun: [] };
const STATUS = ['PNS', 'PPPK', 'CPNS'], ROLES = ['Super Admin', 'Operator', 'Atasan', 'Pimpinan'];
const TITLES = { dashboard: 'Dashboard', pegawai: 'Pegawai', akun: 'Akun & Persetujuan', audit: 'Riwayat Aktivitas', profil: 'Profil Saya' };
const ICONS = { dashboard: 'bi-grid-1x2', pegawai: 'bi-person-vcard', akun: 'bi-person-check', audit: 'bi-clock-history', profil: 'bi-person-circle' };
const RENDER = {};
let chart = null, lastChart = null;
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const isAdmin = () => S.user && S.user.roles.includes('Super Admin');

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
const loading = () => $('app-container').innerHTML = '<div aria-busy="true"><div class="sk" style="height:110px"></div><div class="row g-3 mt-1"><div class="col-6 col-xl-3"><div class="sk"></div></div><div class="col-6 col-xl-3"><div class="sk"></div></div><div class="col-6 col-xl-3"><div class="sk"></div></div><div class="col-6 col-xl-3"><div class="sk"></div></div></div><div class="sk mt-3" style="height:240px"></div></div>';
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
function logoutLocal() { S.token = null; S.user = null; clearInterval(S.iv); Object.keys(PC).forEach(k => delete PC[k]); if (chart) { chart.destroy(); chart = null; } closeModal(); closeSidebar(); document.body.classList.add('guest'); renderLogin(); }
function expire() { toast('Sesi berakhir. Silakan masuk kembali.', 'warning'); logoutLocal(); }
function doLogoutUI() { api('doLogout', S.token).catch(() => {}); logoutLocal(); }

// ── Halaman akun ──
const authCard = (t, s, b) => `<div class="auth"><div class="card-x auth-card"><div class="auth-brand">LAGUSIT e-PEGAWAI</div><h2 class="h4">${t}</h2><p class="muted">${s}</p>${b}</div></div>`;
function renderLogin() {
  $('app-container').innerHTML = authCard('Masuk', 'Gunakan email aktif sebagai ID pengguna.', `<form onsubmit="doLoginUI(event)">
    <label class="lbl" for="em">Email</label><input id="em" name="email" type="email" class="form-control mb-3" required autocomplete="username">
    <label class="lbl" for="pw">Kata sandi</label><input id="pw" name="password" type="password" class="form-control mb-3" required autocomplete="current-password">
    <button class="btn-x w-100" type="submit">Masuk</button></form>
    <p class="mt-3 mb-0 text-center">Belum punya akun? <a href="javascript:void(0)" onclick="renderDaftar()">Daftar</a></p>`);
}
function renderDaftar() {
  $('app-container').innerHTML = authCard('Daftar akun', 'Akun baru dapat dipakai setelah disetujui Super Admin.', `<form onsubmit="doDaftarUI(event)">
    <label class="lbl" for="dn">Nama lengkap</label><input id="dn" name="nama" class="form-control mb-3" required>
    <label class="lbl" for="de">Email aktif</label><input id="de" name="email" type="email" class="form-control mb-3" required autocomplete="username">
    <label class="lbl" for="dp">Kata sandi (min. 8 karakter)</label><input id="dp" name="password" type="password" minlength="8" class="form-control mb-3" required autocomplete="new-password">
    <label class="lbl" for="dq">Ulangi kata sandi</label><input id="dq" name="ulang" type="password" class="form-control mb-3" required autocomplete="new-password">
    <button class="btn-x w-100" type="submit">Kirim pendaftaran</button></form>
    <p class="mt-3 mb-0 text-center"><a href="javascript:void(0)" onclick="renderLogin()">Kembali ke halaman masuk</a></p>`);
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
  try { const r = await api('doDaftar', { nama: f.nama.value, email: f.email.value, password: f.password.value }); toast(r.message, r.success ? 'success' : 'danger'); if (r.success) renderLogin(); }
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
  const [r, ru, op] = await Promise.all([call('listPegawai'), call('listUnit'), call('getOpsiKepegawaian')]); if (!r) return; S.pegawai = r.data; S.units = ru ? ru.data : []; if (op) S.opsi = op.data;
  $('app-container').innerHTML = `<div class="card-x"><div class="toolbar">
    <input id="q" class="form-control" placeholder="Cari nama, NIP, jabatan, unit" aria-label="Cari pegawai" oninput="drawPegawai()">
    <select id="fs" class="form-select" aria-label="Filter status" onchange="drawPegawai()"><option value="">Semua status</option>${STATUS.map(s => `<option>${s}</option>`).join('')}</select>
    <label class="chk"><input type="checkbox" id="fa" onchange="drawPegawai()"> Tampilkan nonaktif</label>
    ${isAdmin() ? '<button class="btn-x ms-auto" onclick="formPegawai()"><i class="bi bi-plus-lg"></i> Tambah pegawai</button>' : ''}</div><div id="pl"></div></div>`;
  drawPegawai();
};
function drawPegawai() {
  const q = $('q').value.toLowerCase(), fs = $('fs').value, fa = $('fa').checked;
  const L = S.pegawai.filter(p => (fa || p.Aktif === true) && (!fs || p.StatusKepegawaian === fs) && [p.Nama, p.NIP, p.Jabatan, p.Unit].join(' ').toLowerCase().includes(q));
  $('pl').innerHTML = L.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Nama</th><th>NIP</th><th>Pangkat/Gol.</th><th>Jabatan</th><th>Unit</th><th>Status</th>${isAdmin() ? '<th>Aksi</th>' : ''}</tr></thead><tbody>${L.map(p => `<tr><td>${esc(p.Nama)}</td><td class="nw">${esc(p.NIP)}</td><td>${esc(p.Pangkat)} ${esc(p.Golongan)}</td><td>${esc(p.Jabatan)}</td><td>${esc(p.Unit)}</td><td><span class="badge-x ${p.Aktif === true ? 'ok' : 'off'}">${p.Aktif === true ? esc(p.StatusKepegawaian || 'Aktif') : 'Nonaktif'}</span></td>${isAdmin() ? `<td class="nw"><button class="btn-o" onclick="formPegawai('${p.ID}')">Ubah</button> <button class="btn-o" onclick="profilPeg('${p.ID}')">Profil</button>${p.Aktif === true ? ` <button class="btn-o danger" onclick="formNonaktif('${p.ID}')">Nonaktifkan</button>` : ''}</td>` : ''}</tr>`).join('')}</tbody></table></div>` : '<p class="muted mb-0 py-3">Belum tersedia: tidak ada data yang cocok.</p>';
}
function formPegawai(id) {
  const p = S.pegawai.find(x => x.ID === id) || {};
  const f = (k, l, t = 'text', req) => `<div class="col-md-6"><label class="lbl" for="f${k}">${l}${req ? ' *' : ''}</label><input id="f${k}" name="${k}" type="${t}" class="form-control" value="${esc(p[k])}" ${req ? 'required' : ''}></div>`;
  openModal(id ? 'Ubah pegawai' : 'Tambah pegawai', `<form onsubmit="savePegawai(event)"><input type="hidden" name="ID" value="${esc(p.ID)}"><input type="hidden" name="UpdatedAt" value="${esc(p.UpdatedAt)}">
    <div class="row g-3">${f('Nama', 'Nama lengkap', 'text', 1)}${f('NIP', 'NIP', 'text', 1)}<div class="col-md-6"><label class="lbl" for="fGol">Golongan</label><select id="fGol" name="Golongan" class="form-select" onchange="pgBerubah('fGol','fPangkat',$('fSt').value)"></select></div><div class="col-md-6"><label class="lbl" for="fPangkat">Pangkat</label><select id="fPangkat" name="Pangkat" class="form-select"></select></div>${f('Jabatan', 'Jabatan')}<div class="col-md-6"><label class="lbl" for="fUnit">Unit kerja</label><input id="fUnit" name="Unit" list="ul" class="form-control" value="${esc(p.Unit)}"><datalist id="ul">${(S.units || []).filter(x => x.Aktif === true).map(x => `<option value="${esc(x.Nama)}">`).join('')}</datalist></div>
    <div class="col-md-6"><label class="lbl" for="fSt">Status kepegawaian</label><select id="fSt" name="StatusKepegawaian" class="form-select" onchange="rakitPG('fGol','fPangkat',this.value)"><option value="">Pilih...</option>${STATUS.map(s => `<option ${p.StatusKepegawaian === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
    ${f('TMT', 'TMT', 'date')}${f('Email', 'Email aktif', 'email')}</div>
    <div class="text-end mt-4"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">Simpan</button></div></form>`);
  rakitPG('fGol', 'fPangkat', p.StatusKepegawaian || '', p.Golongan || '', p.Pangkat || '');
}
async function savePegawai(e) {
  e.preventDefault(); const b = e.target.querySelector('[type=submit]'); busy(b, true);
  const d = Object.fromEntries(new FormData(e.target)); if (!d.ID) delete d.ID; if (!d.UpdatedAt) delete d.UpdatedAt;
  const r = await call('simpanPegawai', d); busy(b, false);
  if (r) { closeModal(); toast(r.message); RENDER.pegawai(); }
}
function formNonaktif(id) { askReason('Nonaktifkan pegawai', async a => { const r = await call('nonaktifkanPegawai', id, a); if (r) { toast(r.message); RENDER.pegawai(); } }); }

// ── Akun & persetujuan (Super Admin) ──
async function aksiAkun(id, aksi, roles, alasan) { const r = await call('ubahAkun', id, aksi, roles || [], alasan || ''); if (r) { toast(r.message); RENDER.akun(); } }
function tolakAkun(id) { askReason('Tolak pendaftaran akun', a => aksiAkun(id, 'tolak', [], a)); }
function resetPw(id) { askReason('Reset kata sandi (dikirim ke email pengguna)', async a => { const r = await call('resetPassword', id, a); if (r) toast(r.message); }); }
function formPeran(id) {
  const a = S.akun.find(x => x.ID === id), cur = String(a.Roles).split(',');
  openModal('Peran: ' + a.Nama, `<form onsubmit="savePeran(event,'${id}')"><p class="muted">Semua akun otomatis berperan Pegawai.</p>${ROLES.map(r => `<label class="chk d-block"><input type="checkbox" name="r" value="${r}" ${cur.includes(r) ? 'checked' : ''}> ${r}</label>`).join('')}<div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">Simpan</button></div></form>`);
}
function savePeran(e, id) { e.preventDefault(); const r = [...e.target.querySelectorAll('[name=r]:checked')].map(x => x.value); closeModal(); aksiAkun(id, 'peran', r); }

// ── Riwayat aktivitas & profil ──
RENDER.audit = async () => { const r = await call('getAudit'); if (r) $('app-container').innerHTML = `<div class="card-x">${auditTable(r.data)}</div>`; };

document.addEventListener('DOMContentLoaded', () => {
  let t = 'light'; try { t = localStorage.getItem('theme') || 'light'; } catch (e) {}
  setTheme(t); $('boot').remove(); renderLogin();
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
