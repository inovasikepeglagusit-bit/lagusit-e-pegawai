/** Modul tambahan: navigasi (menu bawah HP), pencarian global, dashboard berbasis data apel, Apel Staf. */
Object.assign(TITLES, { apel: 'Apel Staf', regu: 'Apel Regu', master: 'Master Data', nilai: 'Penilaian Kinerja', kgb: 'KGB & Pangkat', kalender: 'Kalender & Pengumuman', laporan: 'Laporan', monitoring: 'Monitoring' });
Object.assign(ICONS, { apel: 'bi-people', regu: 'bi-shield-check', master: 'bi-database', nilai: 'bi-award', kgb: 'bi-graph-up-arrow', kalender: 'bi-calendar3', laporan: 'bi-file-earmark-bar-graph', monitoring: 'bi-eye' });
const REGU = ['Rupam A', 'Rupam B', 'Rupam C', 'Rupam D'];
const SH = ['Hadir', 'Terlambat', 'Izin', 'Sakit', 'Dinas Luar', 'Tidak Hadir'];
const canWrite = () => S.user.roles.some(r => r === 'Super Admin' || r === 'Operator');
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const CH = {};
function mk(id, cfg) { if (CH[id]) CH[id].destroy(); CH[id] = new Chart($(id), cfg); }
async function cariGlobal(v) {
  if (!S.menu.includes('pegawai')) return toast('Pencarian pegawai hanya untuk Super Admin dan Pimpinan.', 'warning');
  await navigateTo('pegawai'); $('q').value = v; drawPegawai();
}
const stat = (l, v, s, i, t) => `<div class="col-6 col-xl-3"><div class="card-x stat"><div class="stat-ic ${t}"><i class="bi ${i}"></i></div><div class="muted pe-5">${l}</div><div class="stat-v">${v}</div><div class="sub">${s}</div></div></div>`;
const auditTable = rows => rows.length ? `<div class="table-wrap"><table class="table table-sm"><thead><tr><th>Waktu</th><th>Pelaku</th><th>Aktivitas</th><th>Detail</th></tr></thead><tbody>${rows.map(a => `<tr><td class="nw">${esc(a.Waktu)}</td><td>${esc(a.Pelaku)}</td><td>${esc(a.Aksi)} · ${esc(a.Modul)}</td><td>${esc(a.Detail)}${a.Alasan ? ' <em>(Alasan: ' + esc(a.Alasan) + ')</em>' : ''}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted mb-0">Belum tersedia: belum ada aktivitas tercatat.</p>';
const kosong = t => `<p class="muted mb-0 py-4 text-center">Belum tersedia: ${t}</p>`;
RENDER.dashboard = async () => {
  const r = await call('getDashboard'); if (!r) return;
  const d = r.data, c = $('app-container'), tgl = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  Object.keys(CH).forEach(k => { CH[k].destroy(); delete CH[k]; });
  const hero = `<div class="hero"><div><p class="eyebrow">Dashboard utama • Lapas Gunungsitoli</p><h2>Selamat datang, ${esc(S.user.nama)}</h2><p><i class="bi bi-calendar3"></i> ${tgl}</p></div><span class="chip">${esc($('userRole').textContent)}</span></div>`;
  if (d.terbatas) {
    const ks = d.kgbSaya.map(b => stat(b.Jenis + ' saya', b.Sisa == null ? '–' : Math.abs(b.Sisa) + ' hr', (b.Jadwal ? 'Jadwal ' + b.Jadwal + ' · ' : '') + b.Status, b.Jenis === 'KGB' ? 'bi-graph-up' : 'bi-award', b.Status === 'Terlambat' ? 't-red' : 't-amber')).join('');
    const tn = d.tugasNilai ? stat('Belum dinilai', d.tugasNilai.belum, 'dari ' + d.tugasNilai.total + ' pegawai ditugaskan', 'bi-award', 't-blue') : '';
    const kh = d.kehadiranSaya == null ? '' : stat('Kehadiran apel saya', d.kehadiranSaya + '%', '30 hari terakhir', 'bi-person-check', 't-navy');
    const ns = d.nilaiSaya ? stat('Penilaian terakhir', d.nilaiSaya.Skor, esc(d.nilaiSaya.Periode), 'bi-award', 't-amber') : '';
    const rs = d.ruangSaya ? (d.ruangSaya.length ? `<div class="row g-3 mb-3">${d.ruangSaya.map(r => `<div class="col-md-6 col-xl-4"><div class="card-x"><h3 class="h6">${esc(r.Ruang)} · hari ini</h3>${r.Sesi.map(s => `<div class="d-flex justify-content-between mb-1"><span>${s.Sesi}</span><span class="badge-x ${s.Status === 'Selesai' ? 'ok' : s.Status === 'Draf' ? 'wait' : 'off'}">${s.Status}</span></div>`).join('')}${r.DrafLama ? `<div class="sub mt-2">${r.DrafLama} draf apel lama belum selesai</div>` : ''}<button class="btn-x mt-3" onclick="navigateTo('${r.Menu}')">Buka ${esc(r.Menu === 'apel' ? 'Apel Staf' : 'Apel Regu')}</button></div></div>`).join('')}</div>` : '<div class="card-x mb-3"><p class="muted mb-0">Anda belum ditugaskan sebagai operator pada ruang mana pun. Hubungi Super Admin.</p></div>') : '';
    const kn = d.kgbN ? `<div class="row g-3 mb-3">${stat('KGB mendekati atau terlambat', d.kgbN.KGB, 'Perlu tindak lanjut', 'bi-graph-up', 't-amber')}${stat('Kenaikan pangkat mendekati atau terlambat', d.kgbN.Pangkat, 'Perlu tindak lanjut', 'bi-award', 't-blue')}</div>` : '';
    const pg = d.pengumuman.length ? `<div class="card-x mb-3"><h3 class="h6">Pengumuman</h3>${d.pengumuman.map(p => `<div class="todo"><i class="bi bi-megaphone"></i><div><b>${esc(p.Judul)}</b><small>${esc(p.Deskripsi)}</small><small>Berlaku s.d. ${esc(p.Sampai)}</small></div></div>`).join('')}</div>` : '';
    c.innerHTML = hero + rs + `<div class="row g-3 mb-3">${tn}${kh}${ns}${ks}</div>` + kn + pg + kartuAgenda(d.agenda); return;
  }
  const A = d.apel, ks = Object.keys(d.status), todo = [];
  if (d.menunggu) todo.push(['bi-person-check', d.menunggu + ' akun menunggu persetujuan', 'Buka Akun & Persetujuan', 'akun']);
  if (A.draf) todo.push(['bi-clipboard-check', A.draf + ' apel masih berstatus draf', 'Lengkapi absensi dan notula', 'apel']);
  if (d.sah) todo.push(['bi-award', d.sah + ' penilaian menunggu pengesahan', 'Buka Penilaian Kinerja', 'nilai']);
  if (d.kgbN && d.kgbN.KGB + d.kgbN.Pangkat) todo.push(['bi-graph-up-arrow', (d.kgbN.KGB + d.kgbN.Pangkat) + ' jadwal KGB/pangkat perlu perhatian', 'Buka KGB & Pangkat', 'kgb']);
  const ag = d.agenda ? kartuAgenda(d.agenda) : '';
  const kg = d.kgbN ? `<div class="row g-3 mb-3">${stat('KGB mendekati atau terlambat', d.kgbN.KGB, 'Perlu tindak lanjut', 'bi-graph-up', 't-amber')}${stat('Kenaikan pangkat mendekati atau terlambat', d.kgbN.Pangkat, 'Perlu tindak lanjut', 'bi-award', 't-blue')}</div>` : '';
  if (d.tanpaOp && d.tanpaOp.length) todo.push(['bi-person-gear', d.tanpaOp.length + ' ruang belum punya operator', d.tanpaOp.join(', '), 'master']);
  const tl = d.teladan ? `<div class="card-x mb-3"><h3 class="h6">Pegawai teladan terkini <span class="muted">· ${esc(d.teladan.Periode)}</span></h3>${d.teladan.daftar.map((x, i) => `<div class="todo"><i class="bi bi-trophy"></i><div><b>${i + 1}. ${esc(x.Nama)}</b><small>${esc(x.Unit)}</small></div><b>${x.Skor}</b></div>`).join('')}</div>` : '';
  if (d.pengajuan) todo.push(['bi-patch-check', d.pengajuan + ' pengajuan perubahan profil menunggu verifikasi', 'Verifikasi di Akun & Persetujuan', 'akun']);
  if (d.kurang) todo.push(['bi-exclamation-triangle', d.kurang + ' pegawai belum lengkap NIP/email', 'Perbarui di menu Pegawai', 'pegawai']);
  c.innerHTML = hero + `<div class="row g-3 mb-3">${stat('Pegawai aktif', d.total, 'Dari database', 'bi-person-vcard', 't-navy')}${stat('Rata-rata hadir (7 apel terakhir)', A.rata == null ? '–' : A.rata + '%', A.rata == null ? 'Belum ada apel selesai' : 'Hadir + terlambat', 'bi-graph-up-arrow', 't-amber')}${stat('Apel belum selesai', A.draf, 'Status draf', 'bi-clipboard-check', 't-blue')}${d.menunggu != null ? stat('Akun menunggu', d.menunggu, 'Perlu persetujuan', 'bi-person-check', 't-red') : stat('Data perlu dilengkapi', d.kurang, 'NIP atau email kosong', 'bi-exclamation-triangle', 't-red')}</div>${kg}${ag}${tl}
  <div class="row g-3 mb-3"><div class="col-lg-8"><div class="card-x"><h3 class="h6">Tren kehadiran apel per bulan (%)</h3>${A.bulan.length ? '<canvas id="c1" height="110"></canvas>' : kosong('belum ada apel yang diselesaikan.')}</div></div>
  <div class="col-lg-4"><div class="card-x"><h3 class="h6">Status kepegawaian</h3>${d.total ? '<canvas id="c3" height="220"></canvas>' : kosong('belum ada data pegawai.')}</div></div></div>
  <div class="row g-3 mb-3"><div class="col-lg-7"><div class="card-x"><h3 class="h6">Kehadiran 7 apel terakhir (%)</h3>${A.hari.length ? '<canvas id="c2" height="120"></canvas>' : kosong('belum ada apel yang diselesaikan.')}</div></div>
  <div class="col-lg-5"><div class="card-x"><h3 class="h6">Perlu tindakan saya</h3>${todo.length ? todo.map(t => `<div class="todo"><i class="bi ${t[0]}"></i><div><b>${t[1]}</b><small>${t[2]}</small></div>${S.menu.includes(t[3]) ? `<button class="btn-x" onclick="navigateTo('${t[3]}')">Buka</button>` : ''}</div>`).join('') : '<p class="muted mb-0 py-3">Tidak ada tugas tertunda.</p>'}</div></div></div>
  ${d.audit ? `<div class="card-x"><h3 class="h6">Riwayat aktivitas terbaru</h3>${auditTable(d.audit)}</div>` : ''}`;
  const dk = document.documentElement.dataset.theme === 'dark', cs = getComputedStyle(document.documentElement), tx = cs.getPropertyValue('--muted').trim(), gr = cs.getPropertyValue('--line').trim(), ink = dk ? '#E2E8F0' : '#0F172A';
  const sc = { y: { min: 0, max: 100, ticks: { color: tx, callback: v => v + '%' }, grid: { color: gr } }, x: { ticks: { color: tx }, grid: { display: false } } };
  const bl = k => new Date(k + '-01T00:00:00').toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
  if (A.bulan.length) mk('c1', { type: 'line', data: { labels: A.bulan.map(x => bl(x.k)), datasets: [{ data: A.bulan.map(x => x.v), borderColor: '#D97706', backgroundColor: 'rgba(217,119,6,.14)', fill: true, tension: .35, pointBackgroundColor: '#D97706', pointRadius: 4 }] }, options: { plugins: { legend: { display: false } }, scales: sc } });
  if (A.hari.length) mk('c2', { type: 'bar', data: { labels: A.hari.map(x => x.k.slice(8) + '/' + x.k.slice(5, 7)), datasets: [{ data: A.hari.map(x => x.v), borderRadius: 6, backgroundColor: A.hari.map((x, i) => i === A.hari.length - 1 ? '#F59E0B' : ink) }] }, options: { plugins: { legend: { display: false } }, scales: sc } });
  if (d.total) mk('c3', { type: 'doughnut', data: { labels: ks.map(k => k + ' (' + d.status[k] + ')'), datasets: [{ data: ks.map(k => d.status[k]), borderColor: cs.getPropertyValue('--card').trim(), borderWidth: 2, backgroundColor: [ink, '#D97706', '#94A3B8', '#F59E0B', '#64748B'] }] }, options: { cutout: '68%', plugins: { legend: { position: 'bottom', labels: { color: ink } } } } });
};

// ── Pengingat (bel) ──
function tampilBadge() { const n = (S.notif || []).filter(x => x.Baru).length, b = $('nb'); b.hidden = !n; b.textContent = n > 99 ? '99+' : n; }
function bukaNotif() {
  const L = S.notif || [];
  openModal('Pengingat', L.length ? L.map(n => `<div class="todo"><i class="bi bi-${n.Level === 'danger' ? 'exclamation-octagon' : n.Level === 'info' ? 'megaphone' : 'exclamation-triangle'}"></i><div><b>${esc(n.Judul)}</b>${n.Baru ? ' <span class="badge-x wait">Baru</span>' : ''}<small>${esc(n.Isi)}</small></div>${S.menu.includes(n.Menu) ? `<button class="btn-x" onclick="closeModal();navigateTo('${n.Menu}')">Buka</button>` : ''}</div>`).join('') : '<p class="muted mb-0 py-3">Tidak ada pengingat saat ini.</p>');
  const baru = L.filter(n => n.Baru).map(n => n.Kunci); // tanda baru hilang begitu pengingat dibuka
  if (baru.length) { L.forEach(n => n.Baru = false); tampilBadge(); api('tandaiNotifDibaca', S.token, baru).catch(() => {}); }
}

// ── Navigasi cepat: halaman tersimpan tampil dulu lalu disegarkan; hasil halaman lama tidak menimpa halaman baru ──
const PC = {};
async function call(fn, ...a) {
  const my = S.cur;
  try {
    const r = await api(fn, S.token, ...a);
    if (my !== S.cur && /^(get(?!Notif)|list|daftar|ambil)/.test(fn)) return null; // halaman sudah berganti
    if (!r.success) { if (r.message === 'SESI_HABIS') expire(); else toast(r.message, 'danger'); return null; }
    return r;
  } catch (e) { toast('Gagal menghubungi server: ' + e.message, 'danger'); return null; }
}
async function navigateTo(p) {
  if (!S.menu.includes(p)) return;
  Object.keys(CH).forEach(k => { CH[k].destroy(); delete CH[k]; }); if (chart) { chart.destroy(); chart = null; }
  S.page = p; const id = S.cur = (S.cur || 0) + 1;
  $('pageTitle').textContent = TITLES[p]; document.querySelectorAll('[data-p]').forEach(n => n.classList.toggle('active', n.dataset.p === p)); closeSidebar();
  PC[p] ? $('app-container').innerHTML = PC[p] : loading();
  await RENDER[p]();
  if (id === S.cur && p !== 'dashboard') PC[p] = $('app-container').innerHTML;
}
function bangunNav() {
  const b = (m, c) => `<button ${c} data-p="${m}" onclick="navigateTo('${m}')"><i class="bi ${ICONS[m]}"></i><span>${c ? TITLES[m] : TITLES[m].split(' ')[0]}</span></button>`;
  $('nav').innerHTML = S.menu.map(m => b(m, 'class="nav-item"')).join('');
  $('bnav').innerHTML = S.menu.slice(0, 4).map(m => b(m, '')).join('') + '<button onclick="toggleSidebar()"><i class="bi bi-list"></i><span>Lainnya</span></button>';
  document.querySelectorAll('[data-p]').forEach(n => n.classList.toggle('active', n.dataset.p === S.page));
}
function start(d) {
  S.token = d.token; S.user = d.user; S.menu = d.menu; S.page = null; document.body.classList.remove('guest');
  $('userName').textContent = d.user.nama; $('userRole').textContent = d.user.roles.filter(r => r !== 'Pegawai')[0] || 'Pegawai';
  bangunNav(); clearInterval(S.iv);
  if (d.user.wajibGanti) renderGanti(); else { navigateTo('dashboard'); muatNotif(); S.iv = setInterval(muatNotif, 300000); }
}
async function muatNotif() { // memuat pengingat dan menyegarkan menu bila hak akses berubah
  const r = await call('getNotif'); if (!r || !S.user) return; S.notif = r.data.n; tampilBadge();
  if (!S.user.wajibGanti && JSON.stringify(r.data.menu) !== JSON.stringify(S.menu)) { S.menu = r.data.menu; bangunNav(); if (S.page && !S.menu.includes(S.page)) navigateTo('dashboard'); }
}

(window.MOD = window.MOD || []).push('Inti');
