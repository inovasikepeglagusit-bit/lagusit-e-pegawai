/** Modul tambahan: navigasi (menu bawah HP), pencarian global, dashboard berbasis data apel, Apel Staf. */
Object.assign(TITLES, { apel: 'Apel Staf', regu: 'Apel Regu', master: 'Master Data & Pengaturan', absen: 'Cuti & Izin', nilai: 'Penilaian Kinerja', kgb: 'KGB & Pangkat', kalender: 'Kalender & Pengumuman', laporan: 'Laporan', monitoring: 'Monitoring' });
Object.assign(ICONS, { apel: 'bi-people', regu: 'bi-shield-check', master: 'bi-database-gear', absen: 'bi-calendar-x', nilai: 'bi-award', kgb: 'bi-graph-up-arrow', kalender: 'bi-calendar3', laporan: 'bi-file-earmark-bar-graph', monitoring: 'bi-eye' });
const REGU = ['Rupam A', 'Rupam B', 'Rupam C', 'Rupam D'];
const SH = ['Hadir', 'Terlambat', 'Izin', 'Sakit', 'Dinas Luar', 'Tidak Hadir'];
const canWrite = () => S.user.roles.some(r => r === 'Super Admin' || r === 'Operator');
function bukaMenu(m, tab) { if (tab) S.tab = tab; return navigateTo(m); } // buka menu, opsional langsung ke tab tertentu
const tglIndo = t => t ? new Date(t + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const KATA = { dashboard: 'beranda utama ringkasan', pegawai: 'data pegawai nip jabatan karyawan', apel: 'apel staf kehadiran absensi hadir', regu: 'apel regu penjagaan rupam jaga', absen: 'cuti izin sakit surat ketidakhadiran', master: 'master data pengaturan akun unit operator persetujuan tampilan warna logo', nilai: 'penilaian kinerja skp teladan', kgb: 'kgb gaji berkala pangkat kenaikan', kalender: 'kalender agenda pengumuman jadwal', laporan: 'laporan rekap cetak unduh', monitoring: 'monitoring pantau', audit: 'riwayat aktivitas log jejak', profil: 'profil saya pasfoto data diri' };
const TILE = { master: 'Master Data', kalender: 'Kalender', laporan: 'Laporan', nilai: 'Penilaian', kgb: 'KGB & Pangkat', audit: 'Riwayat', apel: 'Apel Staf', regu: 'Apel Regu', absen: 'Cuti & Izin', monitoring: 'Monitoring', profil: 'Profil Saya' };
async function cariGlobal(v) {
  if (!S.menu.includes('pegawai')) return toast('Pencarian pegawai hanya untuk Super Admin dan Pimpinan.', 'warning');
  await navigateTo('pegawai'); $('q').value = v; drawPegawai();
}
// Kotak cari: menu yang cocok, ditambah pencarian pegawai bila akunnya berhak
function cariUI(v) {
  const q = String(v || '').trim().toLowerCase(), box = $('gsr'); if (!box || !S.user) return;
  let L = S.menu.filter(m => !q || (TITLES[m] + ' ' + (KATA[m] || '')).toLowerCase().includes(q)).slice(0, q ? 8 : 6).map(m => ({ ic: ICONS[m], t: TITLES[m], s: m === S.page ? 'Sedang dibuka' : 'Menu', f: () => navigateTo(m) }));
  if (q.length >= 2 && S.menu.includes('pegawai')) L.push({ ic: 'bi-search', t: 'Cari pegawai “' + v.trim() + '”', s: 'Nama, NIP, jabatan', f: () => cariGlobal(v.trim()) });
  S.cr = L; S.crI = L.length ? 0 : -1;
  box.hidden = false; $('gs').setAttribute('aria-expanded', 'true');
  box.innerHTML = L.length ? L.map((x, i) => `<button type="button" role="option" class="${i === 0 ? 'sel' : ''}" onmousedown="event.preventDefault()" onclick="cariPilih(${i})"><i class="bi ${x.ic}"></i><span>${esc(x.t)}</span><small>${esc(x.s)}</small></button>`).join('') : '<div class="kosong">Tidak ada menu yang cocok.</div>';
}
function tutupCari() { const b = $('gsr'); if (b) { b.hidden = true; $('gs').setAttribute('aria-expanded', 'false'); } }
function cariPilih(i) { const x = (S.cr || [])[i]; tutupCari(); if (x) { $('gs').value = ''; x.f(); } }
function cariKey(e) {
  const n = (S.cr || []).length;
  if (e.key === 'Escape') { tutupCari(); return; }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!n) return; S.crI = (S.crI + (e.key === 'ArrowDown' ? 1 : n - 1)) % n; document.querySelectorAll('#gsr button').forEach((b, i) => b.classList.toggle('sel', i === S.crI)); return; }
  if (e.key === 'Enter') { e.preventDefault(); if (n) cariPilih(Math.max(0, S.crI)); }
}
document.addEventListener('click', e => { if (!e.target.closest('.search-wrap')) tutupCari(); });

// ── Komponen dashboard ──
const statK = (l, v, s, i, t) => `<div class="card-x stat ${t}"><div class="stat-ic"><i class="bi ${i}"></i></div><div class="muted pe-5">${l}</div><div class="stat-v">${v}</div><div class="sub">${s}</div></div>`;
const stat = (l, v, s, i, t) => `<div class="col-6 col-xl-3">${statK(l, v, s, i, t)}</div>`;
const statRing = (l, v, s, pct, t) => `<div class="card-x stat ring-s ${t}">${gfCincin(pct)}<div class="muted">${l}</div><div class="stat-v">${v}</div><div class="sub">${s}</div></div>`;
const auditTable = rows => rows.length ? `<div class="table-wrap"><table class="table table-sm"><thead><tr><th>Waktu</th><th>Pelaku</th><th>Aktivitas</th><th>Detail</th></tr></thead><tbody>${rows.map(a => `<tr><td class="nw">${esc(a.Waktu)}</td><td>${esc(a.Pelaku)}</td><td>${esc(a.Aksi)} · ${esc(a.Modul)}</td><td>${esc(a.Detail)}${a.Alasan ? ' <em>(Alasan: ' + esc(a.Alasan) + ')</em>' : ''}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted mb-0">Belum tersedia: belum ada aktivitas tercatat.</p>';
const kosong = t => `<p class="muted mb-0 py-4 text-center">Belum tersedia: ${t}</p>`;
const heroHtml = () => `<section class="hero2 o2" aria-label="Banner ${esc(TP.nama)}"><div class="himg" data-gbr="hero"><img alt="" decoding="async"></div><div class="hbody"><p class="eyebrow">${esc(TP.instansi)}</p><h2>${esc(TP.nama)}</h2><p class="tag">${esc(TP.slogan)}</p><ul class="poin">${String(TP.heroPoin).split(',').map(x => x.trim()).filter(Boolean).slice(0, 6).map(x => `<li>${esc(x)}</li>`).join('')}</ul><button class="btn-hero" onclick="tampilInfo()">Lihat Panduan dan Informasi <i class="bi bi-arrow-right"></i></button></div></section>`;
const tilesHtml = bd => `<nav class="tiles o3" aria-label="Menu cepat">${S.menu.filter(m => m !== 'dashboard').map((m, i) => `<button type="button" class="tile tn${i % 6}" onclick="navigateTo('${m}')"><span class="ti"><i class="bi ${ICONS[m]}"></i></span><span>${esc(TILE[m] || TITLES[m])}</span>${bd[m] ? `<span class="tb" aria-label="${bd[m]} perlu perhatian">${bd[m] > 99 ? '99+' : bd[m]}</span>` : ''}</button>`).join('')}</nav>`;
const greetHtml = () => `<div class="greet o1"><span class="av">${$('userAv').innerHTML}</span><div><small>Selamat Datang,</small><b>${esc(S.user.nama)}</b><small>${esc($('userRole').textContent)}</small></div></div>`;
const jamHtml = () => `<section class="jam o4" aria-label="Waktu"><div class="tgl" id="jTgl"></div><div class="wkt"><span id="jWkt">--:--</span><small id="jZona"></small></div><q>${esc(TP.motto)}</q></section>`;
function mulaiJam() {
  clearInterval(S.jam); const w = $('jWkt'); if (!w) return; const off = -new Date().getTimezoneOffset() / 60;
  $('jZona').textContent = off === 7 ? 'WIB' : off === 8 ? 'WITA' : off === 9 ? 'WIT' : 'UTC' + (off >= 0 ? '+' : '') + off;
  const fT = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }), fD = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const t = () => { const el = $('jWkt'); if (!el) { clearInterval(S.jam); return; } const n = new Date(); el.textContent = fT.format(n).replace('.', ':'); $('jTgl').textContent = fD.format(n); };
  t(); S.jam = setInterval(() => { if (!document.hidden) t(); }, 5000);
}
const notifHtml = () => `<section class="card-x o7"><div class="sec-h"><h3 class="jd">Notifikasi Terbaru</h3><button class="lnk" onclick="bukaNotif()">Lihat Semua</button></div><div id="nfList"></div></section>`;
function isiNotifKartu() {
  const b = $('nfList'); if (!b) return; const L = (S.notif || []).slice(0, 4);
  b.innerHTML = L.length ? L.map((n, i) => `<button type="button" class="nf" onclick="notifBuka(${i})"><span class="ni ${n.Level === 'danger' ? 'danger' : n.Level === 'info' ? 'info' : 'warn'}"><i class="bi bi-${n.Level === 'danger' ? 'exclamation-octagon' : n.Level === 'info' ? 'megaphone' : 'exclamation-triangle'}"></i></span><span class="nt"><b>${esc(n.Judul)}${n.Baru ? ' <span class="badge-x wait">Baru</span>' : ''}</b><small>${esc(n.Isi)}</small></span><i class="bi bi-chevron-right"></i></button>`).join('') : '<div class="ket-ok py-2"><i class="bi bi-check-circle-fill"></i><span>Tidak ada pengingat saat ini.</span></div>';
}
function notifBuka(i) { const n = (S.notif || [])[i]; if (n && S.menu.includes(n.Menu)) bukaMenu(n.Menu, n.Tab || ''); else bukaNotif(); }
const infoKartu = () => `<section class="o10"><div class="sec-h"><h3 class="jd">Informasi</h3><button class="lnk" onclick="tampilInfo()">Lihat Semua</button></div><button type="button" class="info-card" onclick="tampilInfo()"><span class="gi" data-gbr="info"><img alt="" loading="lazy" decoding="async"></span><span class="ib"><b>${esc(TP.infoJudul)}</b><span class="go"><i class="bi bi-arrow-right"></i></span></span></button></section>`;
const kartuAgenda = a => { const n = new Date(); return `<section class="card-x o11"><div class="sec-h"><h3 class="jd">Jadwal &amp; Agenda</h3>${S.menu.includes('kalender') ? '<button class="lnk" onclick="navigateTo(\'kalender\')">Lihat Semua</button>' : ''}</div><div class="ag"><div class="dt"><b>${n.getDate()}</b><small>${n.toLocaleDateString('id-ID', { month: 'short' })}</small></div><div class="ev">${a.daftar.length ? a.daftar.slice(0, 4).map(x => `<div class="e1"><b>${esc(x.Judul)}</b><small>${tglIndo(x.Tanggal)}${x.Waktu ? ' · ' + esc(x.Waktu) : ''}${x.Lokasi ? ' · ' + esc(x.Lokasi) : ''}</small></div>`).join('') : '<p class="muted mb-0">Belum tersedia: belum ada agenda mendatang.</p>'}</div></div><p class="small muted mb-0 mt-2">Agenda berlangsung hari ini: <b>${a.hariIni}</b></p></section>`; };
const blLabel = k => new Date(k + '-01T00:00:00').toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
function gantiGrafik(m) {
  const b = $('gfBody'); if (!b || !S.gd) return; const g = S.gd[m] || [];
  document.querySelectorAll('.gtabs button').forEach(x => x.classList.toggle('on', x.dataset.m === m));
  if (!g.length) { b.innerHTML = kosong('belum ada apel yang diselesaikan.'); return; }
  const v = g.map(x => x.v), rata = Math.round(v.reduce((a, c) => a + c, 0) / v.length * 10) / 10, sel = v.length > 1 ? Math.round((v[v.length - 1] - v[v.length - 2]) * 10) / 10 : null;
  b.innerHTML = `<div class="gkpi"><div><small>Rata-rata</small><b>${gfPct(rata)}</b></div><div><small>Tertinggi</small><b>${gfPct(Math.max(...v))}</b></div><div><small>Terendah</small><b>${gfPct(Math.min(...v))}</b></div>${sel == null ? '' : `<div><small>Dibanding sebelumnya</small><b style="color:${sel >= 0 ? 'var(--ok)' : 'var(--bad)'}">${sel > 0 ? '+' : ''}${String(sel).replace('.', ',')} poin</b></div>`}</div>` + gfDaftar('gfK', m === 'hari' ? 'garis' : 'batang', g, m === 'hari' ? 'Kehadiran apel terakhir' : 'Kehadiran apel per bulan');
  gfPasang();
}
const kartuGrafik = A => { S.gd = { hari: A.hari.filter(x => x.v != null).map(x => ({ l: x.k.slice(8) + '/' + x.k.slice(5, 7), t: tglIndo(x.k), v: x.v })), bulan: A.bulan.filter(x => x.v != null).map(x => ({ l: blLabel(x.k), t: blLabel(x.k), v: x.v })) }; return `<section class="card-x o8"><div class="sec-h"><h3 class="jd">Kehadiran Apel</h3><div class="gtabs" role="group" aria-label="Rentang grafik"><button type="button" data-m="hari" class="on" onclick="gantiGrafik('hari')">7 apel</button><button type="button" data-m="bulan" onclick="gantiGrafik('bulan')">6 bulan</button></div></div><div id="gfBody"></div></section>`; };

RENDER.dashboard = async () => {
  const r = await call('getDashboard'); if (!r) return;
  const d = r.data, c = $('app-container'); clearInterval(S.jam);
  const kanan = ex => `<div class="col">${jamHtml()}${notifHtml()}${infoKartu()}${ex}</div>`;
  if (d.terbatas) {
    const ks = d.kgbSaya.map(b => statK(b.Jenis + ' saya', b.Sisa == null ? '–' : Math.abs(b.Sisa) + ' hr', (b.Jadwal ? 'Jadwal ' + b.Jadwal + ' · ' : '') + b.Status, b.Jenis === 'KGB' ? 'bi-graph-up' : 'bi-award', b.Status === 'Terlambat' ? 't-red' : 't-amber')).join('');
    const tn = d.tugasNilai ? statK('Belum dinilai', d.tugasNilai.belum, 'dari ' + d.tugasNilai.total + ' pegawai ditugaskan', 'bi-award', 't-blue') : '';
    const kh = d.kehadiranSaya == null ? '' : statRing('Kehadiran apel saya', d.kehadiranSaya + '%', '30 hari terakhir', d.kehadiranSaya, 't-green');
    const ns = d.nilaiSaya ? statK('Penilaian terakhir', d.nilaiSaya.Skor, esc(d.nilaiSaya.Periode), 'bi-award', 't-purple') : '';
    const angka = tn + kh + ns + ks;
    const ab = d.absenSaya && d.absenSaya.length ? `<section class="card-x o5"><div class="sec-h"><h3 class="jd">Cuti, izin &amp; sakit saya</h3><button class="lnk" onclick="navigateTo('absen')">Kelola surat</button></div>${d.absenSaya.map(x => `<div class="todo"><i class="bi bi-calendar-check"></i><div><b>${esc(x.Jenis)}</b><small>${tglIndo(x.Mulai)} s.d. ${tglIndo(x.Sampai)}</small></div><span class="badge-x ${x.Berjalan ? 'ok' : 'wait'}">${x.Berjalan ? 'Sedang berlaku' : 'Akan datang'}</span></div>`).join('')}</section>` : '';
    const rs = d.ruangSaya ? (d.ruangSaya.length ? `<div class="grid2 o5">${d.ruangSaya.map(r => `<div class="card-x"><h3 class="jd mb-2">${esc(r.Ruang)} · hari ini</h3>${r.Sesi.map(s => `<div class="d-flex justify-content-between mb-1"><span>${s.Sesi}</span><span class="badge-x ${s.Status === 'Selesai' ? 'ok' : s.Status === 'Draf' ? 'wait' : 'off'}">${s.Status}</span></div>`).join('')}${r.DrafLama ? `<div class="sub mt-2">${r.DrafLama} draf apel lama belum selesai</div>` : ''}<button class="btn-x mt-3" onclick="navigateTo('${r.Menu}')">Buka ${esc(r.Menu === 'apel' ? 'Apel Staf' : 'Apel Regu')}</button></div>`).join('')}</div>` : '<div class="card-x o5"><p class="muted mb-0">Anda belum ditugaskan sebagai operator pada ruang mana pun. Hubungi Super Admin.</p></div>') : '';
    const kn = d.kgbN ? `<div class="grid2s o6">${statK('KGB mendekati atau terlambat', d.kgbN.KGB, 'Perlu tindak lanjut', 'bi-graph-up', 't-amber')}${statK('Kenaikan pangkat mendekati atau terlambat', d.kgbN.Pangkat, 'Perlu tindak lanjut', 'bi-award', 't-blue')}</div>` : '';
    const pg = d.pengumuman.length ? `<section class="card-x o12"><h3 class="jd mb-2">Pengumuman</h3>${d.pengumuman.map(p => `<div class="todo"><i class="bi bi-megaphone"></i><div><b>${esc(p.Judul)}</b><small>${esc(p.Deskripsi)}</small><small>Berlaku s.d. ${esc(p.Sampai)}</small></div></div>`).join('')}</section>` : '';
    const bd = {}; if (d.kgbN) bd.kgb = d.kgbN.KGB + d.kgbN.Pangkat; if (d.tugasNilai) bd.nilai = d.tugasNilai.belum;
    c.innerHTML = `<div class="dash"><div class="col">${greetHtml()}${heroHtml()}${tilesHtml(bd)}${rs}${ab}${angka ? `<div class="grid4 o6">${angka}</div>` : ''}${kn}${pg}</div>${kanan(d.agenda ? kartuAgenda(d.agenda) : '')}</div>`;
    gbrPasang(c); mulaiJam(); isiNotifKartu(); return;
  }
  const A = d.apel, T = A.terakhir, R = T && T.rincian, todo = [];
  if (d.menunggu) todo.push(['bi-person-check', d.menunggu + ' akun menunggu persetujuan', 'Buka Master Data ▸ Persetujuan', 'master', 'persetujuan']);
  if (d.surat) todo.push(['bi-envelope-paper', d.surat + ' surat cuti/izin/sakit menunggu verifikasi', 'Periksa lampiran di Master Data ▸ Persetujuan', 'master', 'persetujuan']);
  if (A.draf) todo.push(['bi-clipboard-check', A.draf + ' apel masih berstatus draf', 'Lengkapi absensi dan notula', 'apel']);
  if (d.sah) todo.push(['bi-award', d.sah + ' penilaian menunggu pengesahan', 'Buka Penilaian Kinerja', 'nilai']);
  if (d.kgbN && d.kgbN.KGB + d.kgbN.Pangkat) todo.push(['bi-graph-up-arrow', (d.kgbN.KGB + d.kgbN.Pangkat) + ' jadwal KGB/pangkat perlu perhatian', 'Buka KGB & Pangkat', 'kgb']);
  if (d.tanpaOp && d.tanpaOp.length) todo.push(['bi-person-gear', d.tanpaOp.length + ' ruang belum punya operator', d.tanpaOp.join(', '), 'master']);
  if (d.pengajuan) todo.push(['bi-patch-check', d.pengajuan + ' pengajuan perubahan profil menunggu verifikasi', 'Verifikasi di Master Data ▸ Persetujuan', 'master', 'persetujuan']);
  if (d.kurang) todo.push(['bi-exclamation-triangle', d.kurang + ' pegawai belum lengkap NIP/email', 'Perbarui di menu Pegawai', 'pegawai']);
  const bd = { master: (d.menunggu || 0) + (d.pengajuan || 0) + (d.surat || 0), apel: A.draf, nilai: d.sah || 0, kgb: d.kgbN ? d.kgbN.KGB + d.kgbN.Pangkat : 0 };
  const tgl = T ? tglIndo(T.tanggal) : '';
  const angka = statK('Pegawai aktif', d.total, 'Dari database', 'bi-people', 't-navy')
    + (T ? statRing('Hadir apel terakhir', R.Hadir + R.Terlambat, 'dari ' + T.jumlah + ' · ' + tgl, T.pct == null ? 0 : T.pct, 't-green') : statK('Hadir apel terakhir', '–', 'Belum ada apel selesai', 'bi-person-check', 't-green'))
    + statK('Izin, sakit &amp; dinas luar', T ? R.Izin + R.Sakit + R['Dinas Luar'] : '–', T ? 'Apel ' + tgl : 'Belum ada apel selesai', 'bi-calendar2-check', 't-amber')
    + statK('Tidak hadir', T ? R['Tidak Hadir'] : '–', T ? 'Apel ' + tgl : 'Belum ada apel selesai', 'bi-person-x', 't-red');
  const kt = `<section class="card-x o5"><div class="sec-h"><h3 class="jd">Perlu tindakan saya</h3></div>${todo.length ? todo.map(t => `<div class="todo"><i class="bi ${t[0]}"></i><div><b>${t[1]}</b><small>${t[2]}</small></div>${S.menu.includes(t[3]) ? `<button class="btn-x" onclick="bukaMenu('${t[3]}','${t[4] || ''}')">Buka</button>` : ''}</div>`).join('') : '<div class="ket-ok py-2"><i class="bi bi-check-circle-fill"></i><span>Tidak ada tugas tertunda.</span></div>'}</section>`;
  const ks = Object.keys(d.status).sort((a, b) => d.status[b] - d.status[a]);
  const dn = `<section class="card-x o9"><div class="sec-h"><h3 class="jd">Status Kepegawaian</h3></div>${d.total ? gfDonat('gfD', ks.map((k, i) => ({ l: k, v: d.status[k], c: GF_PALET[i % GF_PALET.length] })), [String(d.total), 'Pegawai']) : kosong('belum ada data pegawai.')}</section>`;
  const rn = `<section class="card-x o9"><div class="sec-h"><h3 class="jd">Rincian Apel Terakhir</h3>${T ? `<span class="muted small">${tgl}</span>` : ''}</div>${T ? gfTumpuk(STATUS_X.map(k => ({ l: k, v: R[k] || 0, c: GF_HADIR[k] }))) : kosong('belum ada apel yang diselesaikan.')}</section>`;
  const kg = d.kgbN ? `<div class="grid2s">${statK('KGB mendekati atau terlambat', d.kgbN.KGB, 'Perlu tindak lanjut', 'bi-graph-up', 't-amber')}${statK('Kenaikan pangkat mendekati atau terlambat', d.kgbN.Pangkat, 'Perlu tindak lanjut', 'bi-award', 't-blue')}</div>` : '';
  const tl = d.teladan ? `<section class="card-x"><h3 class="jd mb-2">Pegawai teladan terkini <span class="muted">· ${esc(d.teladan.Periode)}</span></h3>${d.teladan.daftar.map((x, i) => `<div class="todo"><i class="bi bi-trophy"></i><div><b>${i + 1}. ${esc(x.Nama)}</b><small>${esc(x.Unit)}</small></div><b>${x.Skor}</b></div>`).join('')}</section>` : '';
  const au = d.audit ? `<section class="card-x"><h3 class="jd mb-2">Riwayat aktivitas terbaru</h3>${auditTable(d.audit)}</section>` : '';
  c.innerHTML = `<div class="dash"><div class="col">${greetHtml()}${heroHtml()}${tilesHtml(bd)}${kt}<div class="grid4 o6">${angka}</div>${kartuGrafik(A)}${[kg, tl, au].filter(Boolean).map(x => `<div class="o12">${x}</div>`).join('')}</div>${kanan((d.agenda ? kartuAgenda(d.agenda) : '') + dn + rn)}</div>`;
  gbrPasang(c); gantiGrafik('hari'); mulaiJam(); isiNotifKartu(); gfPasang();
};
const STATUS_X = ['Hadir', 'Terlambat', 'Izin', 'Sakit', 'Dinas Luar', 'Tidak Hadir'];

// ── Pengingat (bel) ──
function tampilBadge() { const n = (S.notif || []).filter(x => x.Baru).length, b = $('nb'); b.hidden = !n; b.textContent = n > 99 ? '99+' : n; }
function bukaNotif() {
  const L = S.notif || [];
  openModal('Pengingat', L.length ? L.map(n => `<div class="todo"><i class="bi bi-${n.Level === 'danger' ? 'exclamation-octagon' : n.Level === 'info' ? 'megaphone' : 'exclamation-triangle'}"></i><div><b>${esc(n.Judul)}</b>${n.Baru ? ' <span class="badge-x wait">Baru</span>' : ''}<small>${esc(n.Isi)}</small></div>${S.menu.includes(n.Menu) ? `<button class="btn-x" onclick="closeModal();bukaMenu('${n.Menu}','${n.Tab || ''}')">Buka</button>` : ''}</div>`).join('') : '<p class="muted mb-0 py-3">Tidak ada pengingat saat ini.</p>');
  const baru = L.filter(n => n.Baru).map(n => n.Kunci); // tanda baru hilang begitu pengingat dibuka
  if (baru.length) { L.forEach(n => n.Baru = false); tampilBadge(); api('tandaiNotifDibaca', S.token, baru).catch(() => {}); }
}

// ── Navigasi cepat: halaman tersimpan tampil dulu lalu disegarkan; hasil halaman lama tidak menimpa halaman baru ──
const PC = {};
async function call(fn, ...a) {
  const my = S.cur, senyap = /^(getNotif|fotoProfil|tandaiNotif)/.test(fn); if (!senyap) progMulai();
  try {
    const r = await api(fn, S.token, ...a);
    if (my !== S.cur && /^(get(?!Notif)|list|daftar|ambil)/.test(fn)) return null; // halaman sudah berganti
    if (!r.success) { if (r.message === 'SESI_HABIS') expire(); else toast(r.message, 'danger'); return null; }
    return r;
  } catch (e) { toast('Gagal menghubungi server: ' + e.message, 'danger'); return null; }
  finally { if (!senyap) progSelesai(); }
}
async function navigateTo(p) {
  if (!S.menu.includes(p)) return;
  if (chart) { chart.destroy(); chart = null; } clearInterval(S.jam); tutupCari();
  const baru = S.page !== p; S.page = p; const id = S.cur = (S.cur || 0) + 1;
  setHead(p); document.querySelectorAll('[data-p]').forEach(n => n.classList.toggle('active', n.dataset.p === p)); closeSidebar();
  const ada = !!PC[p]; ada ? $('app-container').innerHTML = PC[p] : loading(); if (baru) animasiHalaman();
  const lo = !ada; if (lo) LOAD.mulai(p);
  try { await RENDER[p](); } finally { if (lo) LOAD.selesai(); }
  if (id === S.cur && !ada && baru) animasiHalaman();
  if (id === S.cur && p !== 'dashboard') PC[p] = $('app-container').innerHTML;
}
function animasiHalaman() { const a = $('app-container'); a.classList.remove('pg-in'); void a.offsetWidth; a.classList.add('pg-in'); }
/** Kepala halaman: di dashboard menyapa pengguna, di menu lain menampilkan judul menu (HP: nama aplikasi kecil, judul besar). */
function setHead(p) {
  if (!S.user) return; const dash = !p || p === 'dashboard';
  $('tbKecil').textContent = dash ? 'Selamat Datang,' : S.user.nama; $('pageTitle').textContent = dash ? S.user.nama : TITLES[p]; $('userRole').hidden = !dash;
  $('mIns').textContent = dash ? TP.instansi : TP.nama; $('mName').textContent = dash ? TP.nama : TITLES[p]; document.body.dataset.p = p || 'dashboard';
}
function bangunNav() {
  const PENDEK = { apel: 'Apel Staf', regu: 'Apel Regu', absen: 'Cuti', master: 'Master', nilai: 'Nilai', kgb: 'KGB', kalender: 'Kalender', monitoring: 'Monitor', audit: 'Riwayat' };
  const b = (m, c) => `<button ${c} data-p="${m}" onclick="navigateTo('${m}')"><i class="bi ${ICONS[m]}"></i><span>${c ? TITLES[m] : (PENDEK[m] || TITLES[m].split(' ')[0])}</span></button>`;
  $('nav').innerHTML = S.menu.map(m => b(m, 'class="nav-item"')).join('');
  $('bnav').innerHTML = S.menu.slice(0, 4).map(m => b(m, '')).join('') + '<button onclick="toggleSidebar()"><i class="bi bi-list"></i><span>Lainnya</span></button>';
  document.querySelectorAll('[data-p]').forEach(n => n.classList.toggle('active', n.dataset.p === S.page));
}
function start(d) {
  S.token = d.token; S.user = d.user; S.menu = d.menu; S.page = null; document.body.classList.remove('guest');
  $('userName').textContent = d.user.nama; $('userRole').textContent = d.user.roles.filter(r => r !== 'Pegawai')[0] || 'Pegawai'; setHead('dashboard');
  $('userAv').innerHTML = '<i class="bi bi-person-fill"></i>'; muatAvatar();
  bangunNav(); clearInterval(S.iv);
  if (d.user.wajibGanti) renderGanti(); else { navigateTo('dashboard'); muatNotif(); S.iv = setInterval(muatNotif, 300000); }
}
async function muatAvatar() { // pasfoto terpasang tampil di header; jika belum ada, ikon bawaan
  const r = await call('fotoProfil', ''); if (r && r.data.data && S.user && $('userAv')) $('userAv').innerHTML = `<img alt="" src="${esc(r.data.data)}">`;
}
async function muatNotif() { // memuat pengingat dan menyegarkan menu bila hak akses berubah
  const r = await call('getNotif'); if (!r || !S.user) return; S.notif = r.data.n; tampilBadge(); isiNotifKartu();
  if (!S.user.wajibGanti && JSON.stringify(r.data.menu) !== JSON.stringify(S.menu)) { S.menu = r.data.menu; bangunNav(); if (S.page && !S.menu.includes(S.page)) navigateTo('dashboard'); }
}

(window.MOD = window.MOD || []).push('Inti');
