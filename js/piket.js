// ── Piket & Petugas Apel: tab di halaman Kalender & Pengumuman ──
const KT_TAB = [['kalender', 'Kalender', 'bi-calendar3'], ['piket', 'Roster Piket', 'bi-moon-stars'], ['petugas', 'Jadwal Apel', 'bi-people'], ['aturan', 'Pengaturan Jadwal', 'bi-sliders2']];
const HARI3 = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'], HARI_PANJANG = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const tglPendek = s => { const d = new Date(s + 'T00:00:00'); return HARI3[d.getDay()] + ', ' + Number(s.slice(8)) + ' ' + NM[Number(s.slice(5, 7)) - 1].slice(0, 3); };
const ktAdmin = () => S.menu.includes('master');
RENDER.kalender = () => {
  const tab = KT_TAB.some(t => t[0] === S.kt && (t[0] !== 'aturan' || ktAdmin())) ? S.kt : 'kalender'; S.kt = tab;
  $('app-container').innerHTML = `<div class="mtabs mb-3" role="tablist" aria-label="Kalender dan piket">${KT_TAB.filter(t => t[0] !== 'aturan' || ktAdmin()).map(t => `<button type="button" role="tab" class="mtab ${t[0] === tab ? 'on' : ''}" aria-selected="${t[0] === tab}" onclick="ktGanti('${t[0]}')"><i class="bi ${t[2]}"></i> ${t[1]}</button>`).join('')}</div><div id="kalBody"></div>`;
  ktIsi();
};
function ktGanti(k) { S.kt = k; RENDER.kalender(); }
function ktIsi() { if (S.kt === 'piket') pkMuat(S.pkb || today().slice(0, 7)); else if (S.kt === 'petugas') ptMuat(S.ptb || today().slice(0, 7)); else if (S.kt === 'aturan') arMuat(); else muatKal(S.kb || today().slice(0, 7), S.kp || today()); }
const bulanNav = (b, fn) => `<div class="d-flex align-items-center gap-2 mb-3"><button class="btn-o" onclick="${fn}('${geser(b, -1)}')" aria-label="Bulan sebelumnya"><i class="bi bi-chevron-left"></i></button><h3 class="h6 mb-0 flex-grow-1 text-center">${NM[Number(b.slice(5)) - 1]} ${b.slice(0, 4)}</h3><button class="btn-o" onclick="${fn}('${geser(b, 1)}')" aria-label="Bulan berikutnya"><i class="bi bi-chevron-right"></i></button></div>`;
const hariBulan = b => { const n = new Date(Number(b.slice(0, 4)), Number(b.slice(5)), 0).getDate(); return Array.from({ length: n }, (_, i) => b + '-' + String(i + 1).padStart(2, '0')); };
function kartuTugas(t) {
  if (!t || (!t.piket.length && !t.petugas.length && !t.lepas)) return '';
  const L = t.piket.slice(0, 4).map(x => `<div class="todo"><i class="bi bi-moon-stars"></i><div><b>${esc(x.Jenis)}</b><small>${tglPendek(x.Tanggal)}</small></div></div>`).concat(t.petugas.slice(0, 4).map(x => `<div class="todo"><i class="bi bi-person-badge"></i><div><b>${esc(x.Peran)}</b><small>${esc(x.Kegiatan)} · ${tglPendek(x.Tanggal)}</small></div></div>`), t.lepas ? [`<div class="todo"><i class="bi bi-cup-hot"></i><div><b>Lepas Piket</b><small>${t.lepas.Tanggal === today() ? 'Hari ini' : 'Besok'} · setelah ${esc(t.lepas.Dari)}</small></div></div>`] : []);
  return `<section class="card-x o8"><div class="sec-h"><h3 class="jd">Tugas Saya</h3>${S.menu.includes('kalender') ? '<button class="lnk" onclick="S.kt=\'piket\';navigateTo(\'kalender\')">Lihat jadwal</button>' : ''}</div>${L.join('')}</section>`;
}

// ── Roster Piket (format roster Lapas: baris pegawai × kolom tanggal) ──
const HURUF_HARI = ['M', 'S', 'S', 'R', 'K', 'J', 'S'];
async function pkMuat(bulan) {
  const r = await call('getPiket', bulan); if (!r) return; S.pkb = bulan; S.pk = r.data; S.pkd = null; S.pkm = null; if (!S.pkv) S.pkv = 'Malam'; pkGambar();
}
function pkPeta() { const sel = {}, ses = {}; S.pk.jadwal.forEach(x => { const k = x.Tanggal + '|' + x.JenisID; (sel[k] = sel[k] || []).push(x.PegawaiID); if (x.Sesi) ses[k + '|' + x.PegawaiID] = x.Sesi; }); return { sel, ses }; }
const pkNama = id => { const d = S.pk; return ((d.pegawai.find(p => p.ID === id) || d.jadwal.find(x => x.PegawaiID === id) || {}).Nama) || '?'; };
const pkUrut = id => { const d = S.pk, p = d.pegawai.find(x => x.ID === id) || d.jadwal.find(x => x.PegawaiID === id) || {}, n = Number(p.Urutan); return n >= 1 ? n : 1e9; };
/** Anggota roster per jenis: yang punya tugas bulan ini (atau ada di draft) ditambah yang ditambahkan operator. */
function pkAnggota(jid) {
  const cur = S.pkd || pkPeta(), ids = []; const add = id => { if (id && !ids.includes(id)) ids.push(id); };
  (S.pkm && S.pkm[jid] || []).forEach(add); Object.keys(cur.sel).forEach(k => { if (k.split('|')[1] === jid) cur.sel[k].forEach(add); });
  if (!(S.pkm && S.pkm[jid])) ids.sort((a, b) => pkUrut(a) - pkUrut(b) || pkNama(a).localeCompare(pkNama(b))); // menurut No. urut yang diatur Super Admin (sama dengan daftar pegawai), tanpa nomor di paling bawah
  return ids;
}
function pkLepasHari(tgl, cur) { // pegawai yang Lepas Piket pada tanggal itu menurut draft/roster saat ini
  const d = S.pk, k = geser_(tgl, -1), pakai = new Set(); d.jenis.forEach(j => ((cur.sel[tgl + '|' + j.ID]) || []).forEach(id => pakai.add(id)));
  return new Set(d.jenis.filter(j => j.LepasPiket).flatMap(j => cur.sel[k + '|' + j.ID] || []).filter(id => !pakai.has(id)));
}
function pkKolom(tgl) { const w = new Date(tgl + 'T00:00:00').getDay(), libur = S.pk.libur.includes(tgl); return `<th class="rk-h ${libur ? 'rk-m' : ''} ${tgl === S.pk.hariIni ? 'rk-now' : ''}" title="${esc(tglPendek(tgl))}"><b>${Number(tgl.slice(8))}</b><small>${HURUF_HARI[w]}</small></th>`; }
function pkKode(j, sesi) { return j.Sesi ? (sesi === 'Pagi' ? 'P' : sesi === 'Sore' ? 'S' : '') : j.Kelompok === 'Libur' ? '✓' : 'M'; }
function pkSel(tgl, jid, id) { const k = tgl + '|' + jid, ada = (S.pkd.sel[k] || []).includes(id), j = S.pk.jenis.find(x => x.ID === jid); if (!ada) { (S.pkd.sel[k] = S.pkd.sel[k] || []).push(id); if (j.Sesi) S.pkd.ses[k + '|' + id] = 'Pagi'; } else if (j.Sesi && S.pkd.ses[k + '|' + id] === 'Pagi') S.pkd.ses[k + '|' + id] = 'Sore'; else { S.pkd.sel[k] = S.pkd.sel[k].filter(x => x !== id); delete S.pkd.ses[k + '|' + id]; } pkGambar(); }
function pkTabel(kel) {
  const d = S.pk, edit = !!S.pkd, cur = S.pkd || pkPeta(), J = d.jenis.filter(j => j.Kelompok === kel), tgls = kel === 'Libur' ? d.libur : hariBulan(d.bulan), huruf = 'ABCDEFG';
  if (!J.length) return '<p class="muted small">Belum ada jenis piket untuk kelompok ini. Super Admin dapat menambahkannya di Pengaturan Jadwal.</p>';
  if (kel === 'Libur' && !tgls.length) return '<p class="muted small">Tidak ada hari libur (Minggu / tanggal merah) pada bulan ini.</p>';
  const baris = J.map((j, gi) => {
    const ids = pkAnggota(j.ID); if (!edit && !ids.length) return '';
    const sisa = d.pegawai.filter(p => !ids.includes(p.ID));
    const rows = ids.map((id, i) => `<tr class="${d.jadwal.some(x => x.PegawaiID === id && x.Saya) ? 'tr-now' : ''}"><td class="rk-n">${i + 1}</td><td class="rk-nm">${esc(pkNama(id))}${edit ? ` <span class="rk-ctl"><a href="javascript:void(0)" onclick="pkGeser('${j.ID}','${id}',-1)" aria-label="Naik">▲</a><a href="javascript:void(0)" onclick="pkGeser('${j.ID}','${id}',1)" aria-label="Turun">▼</a><a href="javascript:void(0)" onclick="pkKeluar('${j.ID}','${id}')" aria-label="Keluarkan dari roster">×</a></span>` : ''}</td>${tgls.map(t => {
      const k = t + '|' + j.ID, ada = (cur.sel[k] || []).includes(id), sesi = cur.ses[k + '|' + id] || '', lp = !ada && pkLepasHari(t, cur).has(id);
      const isi = ada ? `<b class="rk-c rk-${j.Sesi ? sesi === 'Sore' ? 's' : 'p' : 'm'}">${pkKode(j, sesi)}</b>` : lp ? '<span class="rk-l" title="Lepas piket">L</span>' : '';
      return `<td class="rk-x">${edit ? `<button type="button" class="rk-b" onclick="pkSel('${t}','${j.ID}','${id}')" aria-label="${esc(pkNama(id))} ${tglPendek(t)}">${isi || '·'}</button>` : isi}</td>`; }).join('')}</tr>`).join('');
    return `<tr class="rk-g"><td colspan="${tgls.length + 2}"><b>${huruf[gi]}. ${esc(j.Nama.toUpperCase())}</b>${j.Jam ? ` <small class="muted">${esc(j.Jam)}</small>` : ''}${j.LepasPiket ? '' : ' <small class="muted">· tetap hadir keesokan harinya</small>'}${edit ? ` <select class="form-select form-select-sm d-inline-block w-auto ms-2" onchange="pkAnggotaTambah('${j.ID}',this)" aria-label="Tambah anggota ${esc(j.Nama)}"><option value="">+ anggota</option>${sisa.map(p => `<option value="${p.ID}">${esc(p.Nama)}</option>`).join('')}</select>` : ''}</td></tr>${rows}`;
  }).join('');
  if (!baris.trim()) return '<p class="muted small">Belum ada jadwal pada bulan ini.</p>';
  return `<div class="table-wrap rk-wrap"><table class="rk"><thead><tr><th class="rk-n">No</th><th class="rk-nm">Nama petugas</th>${tgls.map(pkKolom).join('')}</tr></thead><tbody>${baris}</tbody></table></div>`;
}
function pkGambar() {
  const d = S.pk, op = d.operator, edit = !!S.pkd, pub = d.pub, kel = S.pkv === 'Libur' ? 'Libur' : 'Malam', sy = d.saya;
  const st = pub ? (pub.belum || pub.dibatalkan ? `<span class="badge-x wait">${pub.belum + pub.dibatalkan} perubahan belum dipublikasikan</span>` : pub.total ? `<span class="badge-x ok">Terpublikasi${pub.terakhir ? ' · ' + new Date(pub.terakhir).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}</span>` : '') : '';
  $('kalBody').innerHTML = `<section class="card-x">${bulanNav(d.bulan, 'pkMuat')}<div class="d-flex flex-wrap align-items-center gap-2 mb-2"><div class="grow"><h3 class="jd mb-0">Roster piket ${st}</h3><div class="muted small"><b>M</b> piket malam · <b>✓</b> bertugas hari libur · <b>P</b>/<b>S</b> bantuan jaga pagi/sore · <b>L</b> ${esc(d.lepasKet)} (otomatis keesokan harinya, kecuali Perwira Piket yang tetap hadir). Pegawai yang L tidak dipilih sebagai petugas apel.</div></div>
  ${op ? (edit ? '<button class="btn-o" onclick="pkBatal()">Batal</button> <button class="btn-x" onclick="pkSimpan()"><i class="bi bi-check2"></i> Simpan roster</button>' : '<button class="btn-o" onclick="pkCetak()"><i class="bi bi-printer"></i> Cetak</button> <button class="btn-o" onclick="pkEdit()"><i class="bi bi-pencil-square"></i> Isi / ubah roster</button> <button class="btn-x" onclick="publikasi(\'piket\')" ' + (pub && !pub.belum && !pub.dibatalkan ? 'disabled' : '') + '><i class="bi bi-send"></i> Publikasikan</button>') : '<button class="btn-o" onclick="pkCetak()"><i class="bi bi-printer"></i> Cetak</button>'}</div>
  ${sy.piket.length || sy.petugas.length || sy.lepas ? `<div class="todo mb-2"><i class="bi bi-bell"></i><div><b>Tugas Anda</b><small>${[].concat(sy.piket.map(x => esc(x.Jenis) + ' ' + tglPendek(x.Tanggal)), sy.petugas.map(x => esc(x.Peran) + ' ' + tglPendek(x.Tanggal)), sy.lepas ? [esc(d.lepasKet) + ' ' + (sy.lepas.Tanggal === d.hariIni ? 'hari ini' : 'besok')] : []).join(' · ')}</small></div></div>` : ''}
  <div class="seg mb-2" role="tablist"><button type="button" class="seg-b ${kel === 'Malam' ? 'on' : ''}" onclick="S.pkv='Malam';pkGambar()">Piket malam</button><button type="button" class="seg-b ${kel === 'Libur' ? 'on' : ''}" onclick="S.pkv='Libur';pkGambar()">Hari libur</button>${edit && kel === 'Malam' ? ' <button type="button" class="btn-o ms-2" onclick="pkGilir()"><i class="bi bi-arrow-repeat"></i> Susun bergilir</button>' : ''}${edit ? ' <button type="button" class="btn-o" onclick="pkSalinAnggota()"><i class="bi bi-copy"></i> Anggota bulan lalu</button>' : ''}</div>
  ${pkTabel(kel)}${op ? '' : '<p class="muted small mt-2 mb-0">Roster diisi oleh operator jadwal yang ditunjuk Super Admin.</p>'}</section>`;
}
function geser_(s, n) { return new Date(Date.parse(s + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10); }
function pkEdit() { S.pkd = JSON.parse(JSON.stringify(pkPeta())); S.pkm = {}; S.pk.jenis.forEach(j => S.pkm[j.ID] = pkAnggota(j.ID)); pkGambar(); }
function pkBatal() { S.pkd = null; S.pkm = null; pkGambar(); }
function pkAnggotaTambah(jid, el) { if (!el.value) return; (S.pkm[jid] = S.pkm[jid] || []).push(el.value); pkGambar(); }
function pkKeluar(jid, id) { Object.keys(S.pkd.sel).forEach(k => { if (k.split('|')[1] === jid) { S.pkd.sel[k] = S.pkd.sel[k].filter(x => x !== id); delete S.pkd.ses[k + '|' + id]; } }); S.pkm[jid] = (S.pkm[jid] || []).filter(x => x !== id); pkGambar(); }
function pkGeser(jid, id, n) { const a = S.pkm[jid], i = a.indexOf(id), j = i + n; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; pkGambar(); }
async function pkSalinAnggota() {
  const r = await call('getPiket', geser(S.pkb, -1)); if (!r) return; let n = 0;
  r.data.jenis.forEach(jl => { const j = S.pk.jenis.find(x => x.Nama === jl.Nama); if (!j) return; const ids = []; r.data.jadwal.filter(x => x.JenisID === jl.ID).forEach(x => { if (!ids.includes(x.PegawaiID)) ids.push(x.PegawaiID); });
    ids.forEach(id => { if (S.pk.pegawai.some(p => p.ID === id) && !pkAnggota(j.ID).includes(id)) { (S.pkm[j.ID] = S.pkm[j.ID] || []).push(id); n++; } }); });
  pkGambar(); toast(n ? n + ' anggota disalin dari bulan lalu.' : 'Tidak ada anggota baru untuk disalin.', n ? undefined : 'warning');
}
function pkGilir() {
  const J = S.pk.jenis.filter(j => j.Kelompok === 'Malam');
  openModal('Susun bergilir', `<form onsubmit="pkGilirGo(event)"><p class="muted small">Anggota roster ditugaskan satu orang tiap malam secara berurutan sesuai daftar (A, B, C, lalu kembali ke A). Tugas jenis ini mulai tanggal yang dipilih akan diganti.</p><div class="row g-3"><div class="col-md-6"><label class="lbl" for="pg1">Jenis piket</label><select id="pg1" class="form-select" onchange="pkGilirAwal()">${J.map(j => `<option value="${j.ID}">${esc(j.Nama)}</option>`).join('')}</select></div>
  <div class="col-md-6"><label class="lbl" for="pg2">Mulai tanggal</label><input id="pg2" type="date" class="form-control" min="${S.pkb}-01" max="${S.pkb}-${String(hariBulan(S.pkb).length).padStart(2, '0')}" value="${S.pkb}-01" required></div><div class="col-12"><label class="lbl" for="pg3">Orang pertama pada tanggal itu</label><select id="pg3" class="form-select"></select></div></div><div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">Susun</button></div></form>`);
  pkGilirAwal();
}
function pkGilirAwal() { const ids = pkAnggota($('pg1').value); $('pg3').innerHTML = ids.length ? ids.map(id => `<option value="${id}">${esc(pkNama(id))}</option>`).join('') : '<option value="">Tambahkan anggota dulu</option>'; }
function pkGilirGo(e) {
  e.preventDefault(); const jid = $('pg1').value, ids = pkAnggota(jid), awal = $('pg2').value, i0 = ids.indexOf($('pg3').value);
  if (!ids.length || i0 < 0) { toast('Tambahkan anggota roster dulu.', 'warning'); return; }
  S.pkm[jid] = ids; hariBulan(S.pkb).forEach(t => { if (t >= awal) { const k = t + '|' + jid, n = Math.round((Date.parse(t) - Date.parse(awal)) / 864e5); S.pkd.sel[k] = [ids[(i0 + n) % ids.length]]; } });
  closeModal(); pkGambar(); toast('Roster bergilir disusun. Periksa lalu simpan.');
}
async function pkSimpan() {
  const asal = pkPeta(), kunci = new Set(Object.keys(asal.sel).concat(Object.keys(S.pkd.sel))), baris = [];
  kunci.forEach(k => { const a = (asal.sel[k] || []).slice().sort().map(id => id + ':' + (asal.ses[k + '|' + id] || '')).join(), b = (S.pkd.sel[k] || []).slice().sort().map(id => id + ':' + (S.pkd.ses[k + '|' + id] || '')).join(); if (a !== b) { const [tgl, j] = k.split('|'), ids = S.pkd.sel[k] || [], sesi = {}; ids.forEach(id => { const v = S.pkd.ses[k + '|' + id]; if (v) sesi[id] = v; }); baris.push({ Tanggal: tgl, JenisID: j, PegawaiIDs: ids, Sesi: sesi }); } });
  if (!baris.length) { toast('Tidak ada perubahan.', 'warning'); return; }
  const r = await call('simpanJadwalPiket', { Bulan: S.pkb, Baris: baris }); if (r) { toast(r.message); pkMuat(S.pkb); muatNotif(); }
}
async function publikasi(jenis) {
  const bulan = jenis === 'piket' ? S.pkb : S.ptb, p = (jenis === 'piket' ? S.pk : S.pt).pub;
  openModal('Publikasikan jadwal', `<p class="small">Email berisi seluruh tugas bulan ${NM[Number(bulan.slice(5)) - 1]} ${bulan.slice(0, 4)} akan dikirim ke <b>setiap pegawai / petugas yang tugasnya baru, berubah, atau dibatalkan</b> sejak publikasi terakhir (${p.belum} tugas baru/berubah, ${p.dibatalkan} dibatalkan). Pengingat otomatis H-n hanya berlaku untuk jadwal yang sudah dipublikasikan.</p><div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" onclick="publikasiGo('${jenis}',this)"><i class="bi bi-send"></i> Kirim email</button></div>`);
}
async function publikasiGo(jenis, b) {
  busy(b, true); const r = await call('publikasikanJadwal', { Jenis: jenis, Bulan: jenis === 'piket' ? S.pkb : S.ptb }); busy(b, false); if (!r) return; closeModal(); toast(r.message, r.data.tanpaEmail.length ? 'warning' : undefined); jenis === 'piket' ? pkMuat(S.pkb) : ptMuat(S.ptb);
}

// ── Jadwal Apel (tabel: tanggal × peran, mengikuti format jadwal petugas apel) ──
async function ptMuat(bulan) { const r = await call('getPetugasApel', bulan); if (!r) return; S.ptb = bulan; S.pt = r.data; S.ptd = null; ptGambar(); }
const ptKolom = () => { const d = S.pt, pakai = new Set(); Object.keys(d.grid.aktif).forEach(t => d.grid.aktif[t].forEach(id => pakai.add(id))); return d.peran.filter(p => pakai.has(p.ID)); };
function ptNilai(tgl, pid) { // nilai sel: draft bila ada, kalau tidak data tersimpan
  const k = tgl + '|' + pid; if (S.ptd && S.ptd[k]) return S.ptd[k];
  const x = S.pt.daftar.find(y => y.Tanggal === tgl && y.PeranID === pid); return x ? { PegawaiID: x.PegawaiID || '', Nama: x.Nama, Email: x.Email || '', Jabatan: x.Jabatan || '', Saya: x.Saya } : { PegawaiID: '', Nama: '', Email: '' };
}
function ptSelHtml(tgl, p) {
  const d = S.pt, v = ptNilai(tgl, p.ID), off = d.grid.off[tgl] || {}, dipakai = new Set(ptKolom().filter(q => q.ID !== p.ID).map(q => ptNilai(tgl, q.ID).PegawaiID).filter(Boolean));
  const luar = !v.PegawaiID && v.Nama;
  return `<select class="form-select form-select-sm" onchange="ptPilih('${tgl}','${p.ID}',this)" aria-label="${esc(p.Nama)} ${tglPendek(tgl)}"><option value="">—</option>${luar ? `<option value="__ada" selected>${esc(v.Nama)} (luar)</option>` : ''}${d.pegawai.map(g => { const a = off[g.ID], bentrok = dipakai.has(g.ID); return `<option value="${g.ID}" ${v.PegawaiID === g.ID ? 'selected' : ''} ${(a || bentrok) && v.PegawaiID !== g.ID ? 'disabled' : ''}>${esc(g.Nama)}${a ? ' — OFF: ' + esc(a) : bentrok ? ' — peran lain' : ''}</option>`; }).join('')}<option value="__luar">Orang dari luar…</option></select>`;
}
function ptGambar() {
  const d = S.pt, op = d.operator, edit = !!S.ptd, kol = ptKolom(), g = d.grid, pub = d.pub;
  const st = pub ? (pub.belum || pub.dibatalkan ? `<span class="badge-x wait">${pub.belum + pub.dibatalkan} perubahan belum dipublikasikan</span>` : pub.total ? `<span class="badge-x ok">Terpublikasi${pub.terakhir ? ' · ' + new Date(pub.terakhir).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}</span>` : '') : '';
  const tampil = (tgl, p) => { if (!g.aktif[tgl].includes(p.ID)) return '<span class="muted">—</span>'; const v = ptNilai(tgl, p.ID); return v.Nama ? `<b>${esc(v.Nama)}</b>${v.Saya ? ' <span class="badge-x ok">Anda</span>' : ''}${!v.PegawaiID ? ' <small class="muted">luar</small>' : ''}` : '<span class="muted">kosong</span>'; };
  const baris = g.hari.map((tgl, i) => `<tr class="${tgl === d.hariIni ? 'tr-now' : ''}"><td class="nw">${i + 1}</td><td class="nw"><b>${tglPendek(tgl)}</b>${d.upacara.some(u => u.Tanggal <= tgl && u.TanggalAkhir >= tgl) ? '<small class="d-block"><span class="badge-x wait">Upacara</span></small>' : ''}${edit && g.off[tgl] ? `<small class="d-block muted">${Object.keys(g.off[tgl]).length} OFF</small>` : ''}</td>${kol.map(p => `<td class="pt-c">${edit && g.aktif[tgl].includes(p.ID) ? ptSelHtml(tgl, p) : tampil(tgl, p)}</td>`).join('')}</tr>`).join('');
  $('kalBody').innerHTML = `<section class="card-x">${bulanNav(d.bulan, 'ptMuat')}<div class="d-flex flex-wrap align-items-center gap-2 mb-2"><div class="grow"><h3 class="jd mb-0">Jadwal petugas apel ${st}</h3><div class="muted small">Isi langsung pada tabel. Pegawai yang sedang OFF (cuti/izin/sakit/dinas, ${esc(d.lepasKet || 'Lepas Piket')}, jaga hari libur) tidak dapat dipilih. Setelah diperiksa, tekan <b>Publikasikan</b> agar email terkirim ke petugas.</div></div>
  ${op ? (edit ? '<button class="btn-o" onclick="ptBatal()">Batal</button> <button class="btn-x" onclick="ptSimpanGrid()"><i class="bi bi-check2"></i> Simpan jadwal</button>' : '<button class="btn-o" onclick="ptCetak()"><i class="bi bi-printer"></i> Cetak</button> <button class="btn-o" onclick="ptOtomatis()"><i class="bi bi-magic"></i> Isi otomatis</button> <button class="btn-o" onclick="ptEdit()"><i class="bi bi-pencil-square"></i> Isi / ubah jadwal</button> <button class="btn-x" onclick="publikasi(\'apel\')" ' + (pub && !pub.belum && !pub.dibatalkan ? 'disabled' : '') + '><i class="bi bi-send"></i> Publikasikan</button>' + (d.admin ? ' <button class="btn-o danger" onclick="ptHapusSemua()" aria-label="Hapus semua"><i class="bi bi-trash"></i></button>' : '')) : '<button class="btn-o" onclick="ptCetak()"><i class="bi bi-printer"></i> Cetak</button>'}</div>
  ${g.hari.length ? `<div class="table-wrap"><table class="table table-sm pt-grid"><thead><tr><th>No</th><th>Hari / tanggal</th>${kol.map(p => `<th>${esc(p.Nama)}</th>`).join('')}</tr></thead><tbody>${baris}</tbody></table></div>` : '<p class="muted">Tidak ada hari apel pada bulan ini. Hari apel diatur Super Admin di Pengaturan Jadwal.</p>'}
  <p class="muted small mt-2 mb-0">Petugas yang berhalangan menghubungi Sub Bagian Tata Usaha H-1 dan mencari petugas pengganti.</p></section>`;
}
function ptEdit() { S.ptd = {}; ptGambar(); }
function ptBatal() { S.ptd = null; ptGambar(); }
function ptPilih(tgl, pid, el) {
  const k = tgl + '|' + pid, v = el.value;
  if (v === '__luar') { el.value = ''; ptLuar(tgl, pid); return; }
  if (v === '__ada') return;
  const g = S.pt.pegawai.find(x => x.ID === v); S.ptd[k] = v ? { PegawaiID: v, Nama: g ? g.Nama : '', Email: '' } : { PegawaiID: '', Nama: '', Email: '' }; ptGambar();
}
function ptLuar(tgl, pid) {
  const v = ptNilai(tgl, pid);
  openModal('Petugas dari luar', `<form onsubmit="ptLuarGo(event,'${tgl}','${pid}')"><div class="row g-3"><div class="col-12"><label class="lbl" for="pl1">Nama petugas *</label><input id="pl1" class="form-control" maxlength="80" required value="${esc(v.PegawaiID ? '' : v.Nama)}"></div><div class="col-12"><label class="lbl" for="pl2">Email (untuk pemberitahuan)</label><input id="pl2" type="email" class="form-control" maxlength="120" value="${esc(v.PegawaiID ? '' : v.Email || '')}" placeholder="nama@contoh.go.id"></div></div><div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">Pakai</button></div></form>`);
}
function ptLuarGo(e, tgl, pid) { e.preventDefault(); S.ptd[tgl + '|' + pid] = { PegawaiID: '', Nama: $('pl1').value.trim(), Email: $('pl2').value.trim() }; closeModal(); ptGambar(); }
async function ptSimpanGrid() {
  const sel = Object.keys(S.ptd).map(k => { const [tgl, pid] = k.split('|'), v = S.ptd[k]; return { Tanggal: tgl, PeranID: pid, PegawaiID: v.PegawaiID, Nama: v.PegawaiID ? '' : v.Nama, Email: v.PegawaiID ? '' : v.Email }; });
  if (!sel.length) { toast('Tidak ada perubahan.', 'warning'); return; }
  const r = await call('simpanGridApel', { Bulan: S.ptb, Sel: sel }); if (r) { toast(r.message); ptMuat(S.ptb); muatNotif(); }
}

// ── Cetak jadwal (kertas A4 mendatar, kop surat dari Master Data) ──
const cetakIngat = () => { try { return JSON.parse(localStorage.getItem('lagusit_cetak') || '{}'); } catch (e) { return {}; } };
function cetakForm(judul, fn) {
  const c = cetakIngat();
  openModal('Cetak ' + judul, `<form onsubmit="${fn}(event)"><div class="row g-3"><div class="col-md-6"><label class="lbl" for="cz1">Tempat penandatanganan</label><input id="cz1" class="form-control" maxlength="60" value="${esc(c.tempat || '')}" placeholder="Kota"></div><div class="col-md-6"><label class="lbl" for="cz2">Tanggal</label><input id="cz2" type="date" class="form-control" value="${today()}"></div>
  <div class="col-md-6"><label class="lbl" for="cz3">Jabatan penandatangan</label><input id="cz3" class="form-control" maxlength="60" value="${esc(c.jabatan || 'KEPALA')}"></div><div class="col-md-6"><label class="lbl" for="cz4">Nama pejabat</label><input id="cz4" class="form-control" maxlength="80" value="${esc(c.nama || '')}"></div><div class="col-12"><label class="lbl" for="cz5">NIP (opsional)</label><input id="cz5" class="form-control" maxlength="30" value="${esc(c.nip || '')}"></div></div><div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit"><i class="bi bi-printer"></i> Cetak</button></div></form>`);
}
function cetakAmbil() {
  const c = { tempat: $('cz1').value.trim(), tgl: $('cz2').value, jabatan: $('cz3').value.trim(), nama: $('cz4').value.trim(), nip: $('cz5').value.trim() };
  try { localStorage.setItem('lagusit_cetak', JSON.stringify({ tempat: c.tempat, jabatan: c.jabatan, nama: c.nama, nip: c.nip })); } catch (e) {}
  const t = c.tgl ? Number(c.tgl.slice(8)) + ' ' + NM[Number(c.tgl.slice(5, 7)) - 1] + ' ' + c.tgl.slice(0, 4) : '';
  return Object.assign(c, { ttd: `<div class="ttd"><div>${esc(c.tempat ? c.tempat + ', ' : '')}${esc(t)}</div><div>${esc(c.jabatan.toUpperCase())}</div><div class="sp"></div><b>${esc(c.nama.toUpperCase())}</b>${c.nip ? `<div>NIP. ${esc(c.nip)}</div>` : ''}</div>` });
}
async function cetakBuka(judul, isi, potret) {
  const kop = await muatKop(), w = window.open('', '_blank'); if (!w) { toast('Pop-up diblokir peramban. Izinkan pop-up untuk mencetak.', 'warning'); return; }
  w.document.write(`<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${esc(judul)}</title><style>@page{size:A4 ${potret ? 'portrait' : 'landscape'};margin:${potret ? '18mm 20mm' : '12mm'}}body{font-family:'Times New Roman',serif;color:#000;font-size:11px;margin:0}h2{text-align:center;font-size:13px;margin:6px 0 10px;line-height:1.35}table{border-collapse:collapse;width:100%}th,td{border:1px solid #000;padding:3px 4px;text-align:center;vertical-align:middle}td.l,th.l{text-align:left}th{background:#eee;-webkit-print-color-adjust:exact;print-color-adjust:exact}tr{break-inside:avoid}.ttd{margin:14px 0 0 auto;width:260px;text-align:center;break-inside:avoid}.sp{height:58px}.cat{margin-top:8px}.g{background:#ddd;font-weight:bold;text-align:left}.m{background:#fecaca}.kopx{break-inside:avoid;-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body>${kopHtml(kop)}${isi}<script>onload=()=>setTimeout(()=>print(),300)<\/script></body></html>`); w.document.close();
}
function ptCetak() { cetakForm('jadwal petugas apel', 'ptCetakGo'); }
async function ptCetakGo(e) {
  e.preventDefault(); const c = cetakAmbil(), d = S.pt, kol = ptKolom(), b = S.ptb; closeModal();
  const baris = d.grid.hari.map((tgl, i) => `<tr><td>${i + 1}</td><td>${esc(HARI_PANJANG[new Date(tgl + 'T00:00:00').getDay()])}, ${Number(tgl.slice(8))} ${NM[Number(tgl.slice(5, 7)) - 1]} ${tgl.slice(0, 4)}</td>${kol.map(p => { if (!d.grid.aktif[tgl].includes(p.ID)) return '<td>—</td>'; const v = ptNilai(tgl, p.ID); return `<td>${esc(p.Nama === 'Pembina Apel' && v.Jabatan ? v.Jabatan.toUpperCase() : v.Nama || '')}</td>`; }).join('')}</tr>`).join('');
  await cetakBuka('Jadwal petugas apel ' + b, `<h2>JADWAL PETUGAS APEL PEGAWAI ${esc((TP.instansi || '').toUpperCase())}<br>BULAN ${esc(NM[Number(b.slice(5)) - 1].toUpperCase())} TAHUN ${b.slice(0, 4)}</h2><table><thead><tr><th>No</th><th>Hari / Tanggal</th>${kol.map(p => `<th>${esc(p.Nama)}</th>`).join('')}</tr></thead><tbody>${baris}</tbody></table><p class="cat"><b>Catatan :</b><br>Petugas yang berhalangan jadwal apel menghubungi Sub Bagian Tata Usaha H-1 dan mencari petugas pengganti</p>${c.ttd}`);
}
function pkCetak() { cetakForm('roster piket', 'pkCetakGo'); }
async function pkCetakGo(e) {
  e.preventDefault(); const c = cetakAmbil(), d = S.pk, cur = S.pkd || pkPeta(), b = d.bulan; closeModal();
  const tabel = kel => { const J = d.jenis.filter(j => j.Kelompok === kel), tg = kel === 'Libur' ? d.libur : hariBulan(b); if (!tg.length) return '';
    const isi = J.map((j, gi) => { const ids = pkAnggota(j.ID); if (!ids.length) return ''; return `<tr><td class="g" colspan="${tg.length + 3}">${'ABCDEFG'[gi]}. ${esc(j.Nama.toUpperCase())}</td></tr>` + ids.map((id, i) => `<tr><td>${i + 1}</td><td class="l">${esc(pkNama(id))}</td><td>${esc((d.pegawai.find(p => p.ID === id) || {}).Jabatan || '')}</td>${tg.map(t => { const k = t + '|' + j.ID, ada = (cur.sel[k] || []).includes(id); return `<td class="${d.libur.includes(t) ? 'm' : ''}">${ada ? pkKode(j, cur.ses[k + '|' + id]) : ''}</td>`; }).join('')}</tr>`).join(''); }).join('');
    return isi ? `<table><thead><tr><th>No</th><th>Nama petugas</th><th>Jabatan</th>${tg.map(t => `<th class="${d.libur.includes(t) ? 'm' : ''}">${kel === 'Libur' ? t.slice(8) + '-' + t.slice(5, 7) : Number(t.slice(8))}</th>`).join('')}</tr></thead><tbody>${isi}</tbody></table>` : ''; };
  await cetakBuka('Roster piket ' + b, `<h2>DAFTAR NAMA PETUGAS PERWIRA PIKET, PIKET DAN PEMBANTU JAGA<br>${esc((TP.instansi || '').toUpperCase())} BULAN ${esc(NM[Number(b.slice(5)) - 1].toUpperCase())} ${b.slice(0, 4)}</h2>${tabel('Malam')}<p class="cat">M : Piket malam · P : Pagi · S : Sore · ✓ : Bertugas · Keesokan harinya petugas piket dan bantuan jaga ${esc(d.lepasKet)}; Perwira Piket tetap hadir.</p>${tabel('Libur') ? `<h2 style="margin-top:16px">DAFTAR NAMA PETUGAS PERWIRA PIKET, PIKET DAN PEMBANTU JAGA PADA HARI LIBUR</h2>${tabel('Libur')}` : ''}${c.ttd}`);
}

function ptOtomatis() {
  const b = S.ptb, n = hariBulan(b).length;
  openModal('Buat petugas otomatis', `<form onsubmit="ptOtomatisGo(event)"><p class="muted small">Petugas dipilih menurut aturan peran yang diatur Super Admin (per hari dan jenis jabatan; bergilir adil atau berurutan). Pegawai yang cuti, izin, sakit, dinas luar, piket, atau Lepas Piket tidak dilibatkan. Peran bermode Manual dikosongkan untuk Anda isi. Gunakan <b>Pratinjau</b> untuk melihat hasilnya dulu tanpa menyimpan.</p><div class="row g-3"><div class="col-6"><label class="lbl" for="po1">Dari tanggal</label><input id="po1" type="date" class="form-control" value="${b}-01" required></div><div class="col-6"><label class="lbl" for="po2">Sampai tanggal</label><input id="po2" type="date" class="form-control" value="${b}-${String(n).padStart(2, '0')}" required></div><div class="col-12"><label class="chk"><input id="po3" type="checkbox"> Ganti petugas otomatis yang sudah ada pada rentang ini (petugas manual tidak diubah)</label></div></div><div id="poHasil" class="mt-3"></div><div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button type="button" class="btn-o" onclick="ptPratinjau(this)"><i class="bi bi-eye"></i> Pratinjau</button> <button class="btn-x" type="submit">Buat petugas</button></div></form>`);
}
async function ptPratinjau(b) {
  busy(b, true); const r = await call('buatPetugasOtomatis', { Dari: $('po1').value, Sampai: $('po2').value, Timpa: $('po3').checked, Pratinjau: true }); busy(b, false); if (!r) return; const x = r.data;
  $('poHasil').innerHTML = `<div class="card-x"><div class="fw-semibold mb-1">${esc(r.message)}</div>${x.daftar.length ? `<div class="table-wrap" style="max-height:260px;overflow:auto"><table class="table table-sm mb-2"><thead><tr><th>Tanggal</th><th>Peran</th><th>Petugas</th></tr></thead><tbody>${x.daftar.map(d => `<tr><td class="nw">${tglPendek(d.Tanggal)}</td><td>${esc(d.Peran)}</td><td>${esc(d.Nama)}${d.Jenis ? `<small class="d-block muted">${esc(d.Jenis)}</small>` : ''}</td></tr>`).join('')}</tbody></table></div>` : ''}${x.kosong.length ? `<div class="small text-danger"><b>Perlu perhatian:</b><ul class="mb-0">${x.kosong.map(k => `<li>${esc(k)}</li>`).join('')}</ul></div>` : ''}</div>`;
}
function ptHapusSemua() {
  openModal('Hapus semua petugas apel', `<form onsubmit="ptHapusGo(event)"><p class="small">Petugas yang dihapus tidak tampil lagi di jadwal, kalender, laporan, dan tidak dikirimi pengingat. Tindakan tercatat di Riwayat Aktivitas. Kosongkan tanggal untuk menghapus pada <b>seluruh tanggal</b>.</p>
  <div class="row g-3"><div class="col-12"><label class="lbl" for="hs1">Yang dihapus</label><select id="hs1" class="form-select" onchange="ptHitung()"><option value="semua">Semua petugas (otomatis dan manual)</option><option value="otomatis">Hanya petugas yang dibuat otomatis</option></select></div>
  <div class="col-6"><label class="lbl" for="hs2">Dari tanggal (opsional)</label><input id="hs2" type="date" class="form-control" onchange="ptHitung()"></div><div class="col-6"><label class="lbl" for="hs3">Sampai tanggal (opsional)</label><input id="hs3" type="date" class="form-control" onchange="ptHitung()"></div>
  <div class="col-12"><div id="hsN" class="fw-semibold" aria-live="polite">Menghitung...</div></div>
  <div class="col-12"><label class="lbl" for="hs4">Alasan (opsional)</label><input id="hs4" class="form-control" maxlength="200"></div>
  <div class="col-12"><label class="lbl" for="hs5">Ketik <b>HAPUS</b> untuk mengonfirmasi</label><input id="hs5" class="form-control" autocomplete="off" oninput="$('hsGo').disabled = this.value.trim().toUpperCase() !== 'HAPUS'"></div></div>
  <div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button id="hsGo" class="btn-x danger" type="submit" disabled>Hapus</button></div></form>`);
  ptHitung();
}
async function ptHitung() {
  const r = await call('hapusSemuaPetugas', { Hitung: true, Cakupan: $('hs1').value, Dari: $('hs2').value, Sampai: $('hs3').value }); if (!r || !$('hsN')) return;
  $('hsN').textContent = r.data.jumlah ? r.data.jumlah + ' petugas akan dihapus (' + r.data.otomatis + ' otomatis, ' + r.data.manual + ' manual).' : 'Tidak ada petugas yang cocok.';
}
async function ptHapusGo(e) {
  e.preventDefault(); const b = $('hsGo'); busy(b, true); const r = await call('hapusSemuaPetugas', { Cakupan: $('hs1').value, Dari: $('hs2').value, Sampai: $('hs3').value, Alasan: $('hs4').value, Konfirmasi: $('hs5').value }); busy(b, false);
  if (r) { closeModal(); toast(r.message); ptMuat(S.ptb); muatNotif(); }
}
async function ptOtomatisGo(e) {
  e.preventDefault(); const b = e.target.querySelector('[type=submit]'); busy(b, true); const r = await call('buatPetugasOtomatis', { Dari: $('po1').value, Sampai: $('po2').value, Timpa: $('po3').checked }); busy(b, false);
  if (r) { closeModal(); toast(r.message, r.data.kosong.length ? 'warning' : undefined); if (r.data.kosong.length) setTimeout(() => toast('Perlu diisi manual: ' + r.data.kosong.slice(0, 4).join('; ') + (r.data.kosong.length > 4 ? ', dll.' : ''), 'warning'), 600); ptMuat(S.ptb); muatNotif(); }
}
// ── Aturan (Super Admin) ──
async function arMuat() { const r = await call('getAturanPiket'); if (!r) return; S.ar = r.data; S.arOps = S.ar.setting.ops.slice(); S.arR = JSON.parse(JSON.stringify(S.ar.peran)); arGambar(); }
const arJ = j => `<tr><td><input class="form-control" data-f="nama" data-id="${esc(j.ID || '')}" value="${esc(j.Nama || '')}" maxlength="50" aria-label="Nama jenis piket"></td><td><input class="form-control" data-f="jam" value="${esc(j.Jam || '')}" maxlength="60" aria-label="Keterangan jam"></td><td><select class="form-select" data-f="kel" aria-label="Kelompok"><option value="Malam" ${j.Kelompok !== 'Libur' ? 'selected' : ''}>Setiap malam (tetap jalan di hari libur)</option><option value="Libur" ${j.Kelompok === 'Libur' ? 'selected' : ''}>Hanya hari libur</option></select></td><td class="text-center"><input type="checkbox" data-f="sesi" ${j.Sesi ? 'checked' : ''} aria-label="Pakai sesi pagi atau sore"></td><td class="text-center"><input type="checkbox" data-f="lepas" ${j.LepasPiket !== false ? 'checked' : ''} aria-label="Lepas piket besok"></td><td class="text-center"><input type="checkbox" data-f="aktif" ${j.Aktif !== false ? 'checked' : ''} aria-label="Aktif"></td></tr>`;
function arGambar() {
  const a = S.ar, s = a.setting, nmA = {}; a.akun.forEach(x => nmA[x.Email] = x.Nama);
  $('kalBody').innerHTML = `<form onsubmit="arSimpan(event)"><section class="card-x mb-3"><h3 class="jd mb-1">Operator jadwal</h3><p class="muted small">Akun yang mengisi jadwal piket dan petugas apel (biasanya sebulan sekali). Super Admin selalu dapat mengisi.</p><div class="kchips mb-2" id="arOps"></div><select id="arOpPilih" class="form-select" style="max-width:360px" onchange="arOpTambah(this)" aria-label="Tambah operator jadwal"><option value="">+ tambah operator jadwal...</option>${a.akun.map(x => `<option value="${esc(x.Email)}">${esc(x.Nama)} · ${esc(x.Email)}</option>`).join('')}</select></section>
  <section class="card-x mb-3"><h3 class="jd mb-1">Jenis piket</h3><p class="muted small">Kelompok <b>Setiap malam</b> tidak mengenal hari libur: piket tetap berjalan setiap tanggal, termasuk Minggu dan tanggal merah. Kelompok <b>Hanya hari libur</b> hanya dapat diisi pada hari libur mingguan (di bawah) atau tanggal merah yang ditetapkan Super Admin di Kalender. Centang "Lepas piket besok" agar pegawai otomatis berstatus Lepas Piket pada apel keesokan harinya (OFF); kosongkan untuk Perwira Piket yang tetap hadir.</p><div class="table-wrap"><table class="table"><thead><tr><th>Jenis piket</th><th>Keterangan jam</th><th>Kelompok</th><th>Sesi pagi/sore</th><th>Lepas piket besok</th><th>Aktif</th></tr></thead><tbody id="arJ">${a.jenis.map(arJ).join('')}</tbody></table></div><button type="button" class="btn-o" onclick="$('arJ').insertAdjacentHTML('beforeend', arJ({}))">+ Tambah jenis piket</button>
  <div class="row g-3 mt-2"><div class="col-12"><span class="lbl">Hari libur mingguan (untuk jenis "Hanya hari libur")</span>${[1, 2, 3, 4, 5, 6, 0].map(h => `<label class="chk me-3"><input type="checkbox" name="arLm" value="${h}" ${(s.liburMingguan || []).includes(h) ? 'checked' : ''}> ${HARI_PANJANG[h]}</label>`).join('')}<small class="muted d-block">Tanggal merah / libur nasional ditetapkan Super Admin di menu Kalender (jenis Libur) dan otomatis ikut dipakai di sini.</small></div><div class="col-md-6"><label class="lbl" for="arLk">Nama status setelah piket</label><input id="arLk" class="form-control" maxlength="40" value="${esc(s.lepasKet)}"></div><div class="col-md-6"><label class="lbl" for="arLs">Dihitung sebagai kategori</label><select id="arLs" class="form-select">${a.kategori.map(k => `<option ${s.lepasStatus === k ? 'selected' : ''}>${k}</option>`).join('')}</select><small class="muted">Bawaan Hadir. Aturan uang makan khusus dapat diatur di Master Data → Kehadiran.</small></div></div></section>
  <section class="card-x mb-3"><div class="d-flex flex-wrap align-items-center gap-2 mb-1"><h3 class="jd mb-0 grow">Peran petugas apel dan upacara</h3><button type="button" class="btn-o" onclick="arStandar()"><i class="bi bi-magic"></i> Terapkan aturan apel standar</button></div>
  <p class="muted small">Setiap peran punya satu atau beberapa <b>aturan per hari</b>. Contoh: Pembina Apel hari Senin dari <i>Eselon III</i>, Selasa–Jumat dari <i>Eselon IV</i>, Sabtu dari <i>Eselon V</i> bergantian berurutan tiap pekan. <b>Otomatis</b>: sistem memilih dari jenis jabatan yang dicentang (kosong = semua pegawai). <b>Manual</b>: diisi operator. <b>Pegawai tertentu</b>: hanya dari daftar yang Anda pilih. Pegawai yang off tidak pernah dipilih. Daftar jenis jabatan diatur di Master Data ▸ Jabatan${a.tanpaJenis ? ` (<b>${a.tanpaJenis}</b> pegawai aktif belum punya jenis jabatan)` : ''}.</p>
  <div id="arPeran"></div><button type="button" class="btn-o" onclick="arPeranTambah()">+ Tambah peran</button>
  <div class="row g-3 mt-2"><div class="col-12"><span class="lbl">Hari apel (untuk petugas otomatis)</span>${[1, 2, 3, 4, 5, 6, 0].map(h => `<label class="chk me-3"><input type="checkbox" name="arH" value="${h}" ${s.hari.includes(h) ? 'checked' : ''}> ${HARI_PANJANG[h]}</label>`).join('')}</div><div class="col-md-4"><label class="lbl" for="arSs">Sesi apel</label><select id="arSs" class="form-select">${['Pagi', 'Sore'].map(k => `<option ${s.sesi === k ? 'selected' : ''}>${k}</option>`).join('')}</select></div><div class="col-md-4"><label class="lbl" for="arJd">Jeda antar tugas (hari)</label><input id="arJd" type="number" min="0" max="60" class="form-control" value="${s.jeda}"><small class="muted">Orang yang baru bertugas didahulukan terakhir.</small></div></div></section>
  <section class="card-x mb-3"><h3 class="jd mb-1">Pengingat email</h3><p class="muted small">Pengingat dikirim ke email pegawai (atau email petugas dari luar) pada hari-hari sebelum tugas. Isi beberapa tenggat dipisah koma, misalnya <code>3,1</code> artinya H-3 dan H-1.</p><div class="row g-3"><div class="col-md-4"><label class="lbl" for="arIp">Tenggat pengingat piket (hari)</label><input id="arIp" class="form-control" value="${esc(s.ingatPiket)}" required></div><div class="col-md-4"><label class="lbl" for="arIt">Tenggat pengingat petugas apel (hari)</label><input id="arIt" class="form-control" value="${esc(s.ingatPetugas)}" required></div><div class="col-md-4"><label class="lbl" for="arJm">Jam kirim harian (0–23, WIB)</label><input id="arJm" type="number" min="0" max="23" class="form-control" value="${s.jam}" required></div><div class="col-12"><label class="chk"><input id="arKb" type="checkbox" ${s.kabarLangsung ? 'checked' : ''}> Kirim email langsung saat seseorang dijadwalkan (satu email per orang)</label></div></div>
  <div class="d-flex flex-wrap align-items-center gap-2 mt-3"><span class="badge-x ${a.pemicu ? 'ok' : 'off'}">${a.pemicu ? 'Pengingat otomatis aktif' : 'Pengingat otomatis belum aktif'}</span><button type="button" class="btn-o" onclick="arPemicu(${!a.pemicu})">${a.pemicu ? 'Matikan' : 'Aktifkan pengingat otomatis'}</button><button type="button" class="btn-o" onclick="arKirim()">Kirim pengingat sekarang</button></div><p class="muted small mt-2 mb-0">Setelah mengubah jam kirim, simpan lalu aktifkan ulang pengingat. Kuota email Google terbatas per hari, jadi pengiriman dibatasi 80 email per proses.</p></section>
  <div class="text-end"><button class="btn-x" type="submit">Simpan aturan</button></div></form>`;
  arOpsGambar(); arPeranGambar();
}
// ── Editor peran dan aturan per hari ──
const HARI_URUT = [1, 2, 3, 4, 5, 6, 0], nmPeg = id => (S.ar.pegawai.find(g => g.ID === id) || {}).Nama || '?', nmJenis = id => (S.ar.jenisJabatan.find(j => j.ID === id) || {}).Nama || '?';
function hariTeks(h) {
  if (!h.length) return 'Setiap hari';
  const s = HARI_URUT.filter(x => h.includes(x)), out = []; let i = 0;
  while (i < s.length) { let k = i; while (k + 1 < s.length && HARI_URUT.indexOf(s[k + 1]) === HARI_URUT.indexOf(s[k]) + 1) k++; out.push(k === i ? HARI_PANJANG[s[i]] : k === i + 1 ? HARI_PANJANG[s[i]] + ', ' + HARI_PANJANG[s[k]] : HARI_PANJANG[s[i]] + '–' + HARI_PANJANG[s[k]]); i = k + 1; }
  return out.join(', ');
}
function aturanTeks(a) {
  const isi = a.Mode === 'Manual' ? 'diisi operator' : a.Mode === 'Tetap' ? (a.PegawaiIDs.length ? a.PegawaiIDs.map(nmPeg).join(' / ') + (a.PegawaiIDs.length > 1 ? ' (bergilir)' : '') : 'pegawai belum dipilih') : (a.JenisIDs.length ? a.JenisIDs.map(nmJenis).join(' / ') : 'semua pegawai') + (a.Unit ? ', unit ' + a.Unit : '') + ' · ' + (a.Rotasi === 'Urut' ? 'berurutan' : 'bergilir adil') + (a.Ganti === 'Mingguan' ? ', satu orang per pekan' : '');
  return hariTeks(a.Hari) + ': ' + isi;
}
const arRingkas = i => { const p = S.arR[i], e = $('arS' + i); if (e) e.innerHTML = p.aturan.filter(a => a.Aktif).map(a => `<li>${esc(aturanTeks(a))}</li>`).join('') || '<li class="muted">Belum ada aturan aktif: peran ini tidak dibuat otomatis.</li>'; };
function aturanHtml(i, j, a) {
  const J = S.ar.jenisJabatan, M = [['Otomatis', 'Otomatis (sistem memilih)'], ['Manual', 'Manual (diisi operator)'], ['Tetap', 'Pegawai tertentu']], oto = a.Mode === 'Otomatis', tetap = a.Mode === 'Tetap';
  const kosongJ = oto && a.JenisIDs.length && a.JenisIDs.every(id => !(J.find(x => x.ID === id) || {}).Jumlah);
  return `<div class="ar-rule"><div class="d-flex flex-wrap align-items-center gap-1 mb-2"><span class="lbl mb-0 me-1">Hari:</span>${HARI_URUT.map(h => `<label class="chk me-2"><input type="checkbox" ${a.Hari.includes(h) ? 'checked' : ''} onchange="arHari(${i},${j},${h},this.checked)"> ${HARI3[h]}</label>`).join('')}<span class="muted small">${a.Hari.length ? '' : '(tanpa centang = setiap hari)'}</span><label class="chk ms-auto"><input type="checkbox" ${a.Aktif ? 'checked' : ''} onchange="arSet(${i},${j},'Aktif',this.checked)"> Aktif</label><a href="javascript:void(0)" class="ms-2" onclick="arAturanHapus(${i},${j})" aria-label="Hapus aturan">hapus aturan</a></div>
  <div class="row g-2"><div class="col-md-4"><label class="lbl">Cara menentukan</label><select class="form-select" onchange="arSet(${i},${j},'Mode',this.value,true)">${M.map(m => `<option value="${m[0]}" ${a.Mode === m[0] ? 'selected' : ''}>${m[1]}</option>`).join('')}</select></div>
  ${oto ? `<div class="col-md-8"><span class="lbl">Jenis jabatan yang boleh</span><div>${J.length ? J.map(x => `<label class="chk me-3"><input type="checkbox" ${a.JenisIDs.includes(x.ID) ? 'checked' : ''} onchange="arJenis(${i},${j},'${x.ID}',this.checked)"> ${esc(x.Nama)} <small class="muted">(${x.Jumlah})</small></label>`).join('') : '<span class="muted small">Belum ada jenis jabatan.</span>'}</div>${kosongJ ? '<small class="text-danger d-block">Belum ada pegawai berjenis ini. Petakan jabatan di Master Data ▸ Jabatan.</small>' : ''}</div>
  <div class="col-md-6"><label class="lbl">Batasi unit kerja (opsional)</label><input class="form-control" value="${esc(a.Unit)}" maxlength="200" placeholder="Pisahkan dengan koma" onchange="arSet(${i},${j},'Unit',this.value)"></div>` : ''}
  ${tetap ? `<div class="col-md-8"><span class="lbl">Pegawai yang ditentukan</span><div class="kchips mb-1">${a.PegawaiIDs.map(id => `<span class="kchip">${esc(nmPeg(id))} <a href="javascript:void(0)" onclick="arPegHapus(${i},${j},'${id}')" aria-label="Hapus">×</a></span>`).join('') || '<span class="text-danger small">Belum ada pegawai dipilih.</span>'}</div><select class="form-select" style="max-width:380px" onchange="arPegTambah(${i},${j},this)" aria-label="Tambah pegawai"><option value="">+ tambah pegawai...</option>${S.ar.pegawai.filter(g => !a.PegawaiIDs.includes(g.ID)).map(g => `<option value="${g.ID}">${esc(g.Nama)}${g.Jenis ? ' · ' + esc(g.Jenis) : ''}</option>`).join('')}</select></div>` : ''}
  ${a.Mode !== 'Manual' ? `<div class="col-md-3"><label class="lbl">Cara bergilir</label><select class="form-select" onchange="arSet(${i},${j},'Rotasi',this.value)"><option value="Adil" ${a.Rotasi === 'Adil' ? 'selected' : ''}>Adil (paling jarang dulu)</option><option value="Urut" ${a.Rotasi === 'Urut' ? 'selected' : ''}>Berurutan (daftar urut)</option></select></div><div class="col-md-3"><label class="lbl">Masa tugas</label><select class="form-select" onchange="arSet(${i},${j},'Ganti',this.value)"><option value="Harian" ${a.Ganti === 'Harian' ? 'selected' : ''}>Ganti orang tiap hari</option><option value="Mingguan" ${a.Ganti === 'Mingguan' ? 'selected' : ''}>Satu orang per pekan</option></select></div>` : ''}</div></div>`;
}
function arPeranGambar() {
  $('arPeran').innerHTML = S.arR.map((p, i) => `<div class="ar-peran ${p.Aktif ? '' : 'ar-off'}"><div class="row g-2 align-items-end"><div class="col-md-5"><label class="lbl">Nama peran</label><input class="form-control" value="${esc(p.Nama)}" maxlength="80" oninput="S.arR[${i}].Nama=this.value" aria-label="Nama peran"></div>
  <div class="col-6 col-md-3"><label class="lbl">Kegiatan</label><select class="form-select" onchange="S.arR[${i}].Kegiatan=this.value" aria-label="Kegiatan">${['Apel', 'Upacara', 'Keduanya'].map(k => `<option ${p.Kegiatan === k || (!p.Kegiatan && k === 'Apel') ? 'selected' : ''}>${k}</option>`).join('')}</select></div>
  <div class="col-6 col-md-2"><label class="chk"><input type="checkbox" ${p.Aktif ? 'checked' : ''} onchange="S.arR[${i}].Aktif=this.checked;arPeranGambar()"> Aktif</label></div><div class="col-md-2 text-md-end"><button type="button" class="btn-o" onclick="arAturanTambah(${i})">+ Aturan hari</button></div></div>
  <ul class="ar-ring" id="arS${i}"></ul>${p.aturan.map((a, j) => aturanHtml(i, j, a)).join('')}</div>`).join('');
  S.arR.forEach((p, i) => arRingkas(i));
}
const aturanBaru = () => ({ ID: '', Hari: [], Mode: 'Otomatis', JenisIDs: [], Unit: '', PegawaiIDs: [], Rotasi: 'Adil', Ganti: 'Harian', Aktif: true });
function arPeranTambah() { S.arR.push({ ID: '', Nama: '', Kegiatan: 'Apel', Aktif: true, aturan: [Object.assign(aturanBaru(), { Mode: 'Manual' })] }); arPeranGambar(); }
function arAturanTambah(i) { S.arR[i].aturan.push(aturanBaru()); arPeranGambar(); }
function arAturanHapus(i, j) { S.arR[i].aturan.splice(j, 1); arPeranGambar(); }
function arSet(i, j, k, v, gambar) { S.arR[i].aturan[j][k] = v; if (gambar) arPeranGambar(); else arRingkas(i); }
function arHari(i, j, h, on) { const a = S.arR[i].aturan[j]; a.Hari = on ? a.Hari.concat([h]) : a.Hari.filter(x => x !== h); arPeranGambar(); }
function arJenis(i, j, id, on) { const a = S.arR[i].aturan[j]; a.JenisIDs = on ? a.JenisIDs.concat([id]) : a.JenisIDs.filter(x => x !== id); arPeranGambar(); }
function arPegTambah(i, j, el) { if (el.value) S.arR[i].aturan[j].PegawaiIDs.push(el.value); arPeranGambar(); }
function arPegHapus(i, j, id) { const a = S.arR[i].aturan[j]; a.PegawaiIDs = a.PegawaiIDs.filter(x => x !== id); arPeranGambar(); }
function arStandar() {
  openModal('Terapkan aturan apel standar', `<p class="small">Aturan berikut akan <b>menggantikan</b> aturan peran-peran yang disebut (peran lain tidak diubah). Setelah itu semuanya tetap bisa Anda ubah.</p><ul class="small"><li><b>Pembina Apel</b>: Senin Eselon III · Selasa–Jumat Eselon IV · Sabtu Eselon V, masing-masing bergantian berurutan (Sabtu: satu orang per pekan)</li><li><b>Komandan Apel</b>: Senin–Jumat Eselon V · Sabtu pegawai yang Anda tentukan</li><li><b>Pembawa Acara</b>, <b>Pembaca Tri Dharma Petugas Pemasyarakatan</b>, <b>Dirigen</b>: jabatan fungsional (JFT dan JFU), bergilir adil</li><li><b>Pembaca Doa</b>: hari Senin saja, jabatan fungsional</li></ul><p class="small muted">Hari Sabtu ikut diaktifkan untuk petugas otomatis. Perubahan di halaman ini yang belum disimpan akan hilang.</p><div class="text-end"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="button" onclick="arStandarGo(this)">Terapkan</button></div>`);
}
async function arStandarGo(b) {
  busy(b, true); const r = await call('terapkanAturanApelStandar'); busy(b, false); if (!r) return; closeModal(); toast(r.message); await arMuat();
  if (r.data.peringatan.length) openModal('Perlu dilengkapi', `<p class="small">Aturan sudah diterapkan. Agar petugas dapat dibuat, lengkapi hal berikut:</p><ul class="small">${r.data.peringatan.map(x => `<li>${esc(x)}</li>`).join('')}</ul><div class="text-end"><button type="button" class="btn-x" data-bs-dismiss="modal">Mengerti</button></div>`);
}
function arOpsGambar() { const nm = {}; S.ar.akun.forEach(x => nm[x.Email] = x.Nama); $('arOps').innerHTML = S.arOps.length ? S.arOps.map(e => `<span class="kchip">${esc(nm[e] || e)} <a href="javascript:void(0)" onclick="arOpHapus('${esc(e)}')" aria-label="Hapus">×</a></span>`).join('') : '<span class="muted small">Belum ada operator jadwal selain Super Admin.</span>'; }
function arOpTambah(el) { if (el.value && !S.arOps.includes(el.value)) S.arOps.push(el.value); el.value = ''; arOpsGambar(); }
function arOpHapus(e) { S.arOps = S.arOps.filter(x => x !== e); arOpsGambar(); }
async function arSimpan(e) {
  e.preventDefault(); const q = (r, f) => r.querySelector('[data-f=' + f + ']'), btn = e.target.querySelector('[type=submit]');
  const jenis = [...$('arJ').querySelectorAll('tr')].map(r => ({ ID: q(r, 'nama').dataset.id || undefined, Nama: q(r, 'nama').value, Jam: q(r, 'jam').value, LepasPiket: q(r, 'lepas').checked, Kelompok: q(r, 'kel').value, Sesi: q(r, 'sesi').checked, Aktif: q(r, 'aktif').checked })).filter(j => j.Nama.trim() || j.ID);
  const peran = S.arR.map(p => ({ ID: p.ID || undefined, Nama: p.Nama, Kegiatan: p.Kegiatan, Aktif: p.Aktif, aturan: p.aturan.map(x => ({ ID: x.ID || undefined, Hari: x.Hari, Mode: x.Mode, JenisIDs: x.JenisIDs, Unit: x.Unit, PegawaiIDs: x.PegawaiIDs, Rotasi: x.Rotasi, Ganti: x.Ganti, Aktif: x.Aktif })) })).filter(p => p.Nama.trim() || p.ID);
  const setting = { ops: S.arOps, ingatPiket: $('arIp').value, ingatPetugas: $('arIt').value, jam: $('arJm').value, hari: [...document.querySelectorAll('[name=arH]:checked')].map(x => Number(x.value)), sesi: $('arSs').value, jeda: $('arJd').value, lepasKet: $('arLk').value, lepasStatus: $('arLs').value, kabarLangsung: $('arKb').checked, liburMingguan: [...document.querySelectorAll('[name=arLm]:checked')].map(x => Number(x.value)) };
  busy(btn, true); const r = await call('simpanAturanPiket', { jenis, peran, setting }); busy(btn, false); if (r) { toast(r.message); arMuat(); }
}
async function arPemicu(on) { const r = await call('pasangPengingatOtomatis', on); if (r) { toast(r.message); arMuat(); } }
async function arKirim() { const r = await call('kirimPengingatSekarang'); if (r) toast(r.message); }
(window.MOD = window.MOD || []).push('Piket');
