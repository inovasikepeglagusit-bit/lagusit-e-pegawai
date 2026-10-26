// ── Piket & Petugas Apel: tab di halaman Kalender & Pengumuman ──
const KT_TAB = [['kalender', 'Kalender', 'bi-calendar3'], ['piket', 'Jadwal Piket', 'bi-moon-stars'], ['petugas', 'Petugas Apel', 'bi-people'], ['aturan', 'Aturan Piket', 'bi-sliders2']];
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

// ── Jadwal Piket ──
async function pkMuat(bulan) {
  const r = await call('getPiket', bulan); if (!r) return; S.pkb = bulan; S.pk = r.data; S.pkd = null; pkGambar();
}
function pkPeta() { const m = {}; S.pk.jadwal.forEach(x => { const k = x.Tanggal + '|' + x.JenisID; (m[k] = m[k] || []).push(x.PegawaiID); }); return m; }
function pkGambar() {
  const d = S.pk, op = d.operator, draft = S.pkd, edit = !!draft, asal = pkPeta(), ds = hariBulan(d.bulan), nm = {}; d.pegawai.forEach(p => nm[p.ID] = p.Nama); d.jadwal.forEach(x => nm[x.PegawaiID] = x.Nama);
  const ids = (tgl, j) => (draft || asal)[tgl + '|' + j] || [], piketHari = tgl => d.jenis.flatMap(j => ids(tgl, j.ID));
  const lepas = tgl => { const k = geser_(tgl, -1); return d.jenis.filter(j => j.LepasPiket).flatMap(j => ids(k, j.ID)).filter(id => !piketHari(tgl).includes(id)); };
  const chip = (tgl, j, id) => `<span class="kchip">${esc(nm[id] || '?')}${edit ? ` <a href="javascript:void(0)" onclick="pkHapus('${tgl}','${j}','${id}')" aria-label="Hapus ${esc(nm[id] || '')}">×</a>` : ''}</span>`;
  const sel = (tgl, j) => { const pakai = new Set(piketHari(tgl)); return `<select class="form-select form-select-sm mt-1" onchange="pkTambah('${tgl}','${j}',this)" aria-label="Tambah petugas"><option value="">+ tambah</option>${d.pegawai.filter(p => !pakai.has(p.ID)).map(p => `<option value="${p.ID}">${esc(p.Nama)}</option>`).join('')}</select>`; };
  const baris = ds.map(tgl => { const merah = d.merah[tgl] || (new Date(tgl + 'T00:00:00').getDay() % 6 === 0 ? 'Akhir pekan' : ''), lp = lepas(tgl), ada = d.jenis.some(j => ids(tgl, j.ID).length) || lp.length;
    return `<tr class="${tgl === d.hariIni ? 'tr-now' : ''}"><td class="nw"><b>${tglPendek(tgl)}</b>${merah ? `<small class="d-block muted">${esc(merah)}</small>` : ''}</td>${d.jenis.map(j => `<td><div class="kchips">${ids(tgl, j.ID).map(id => chip(tgl, j.ID, id)).join('')}</div>${edit ? sel(tgl, j.ID) : ''}</td>`).join('')}<td>${lp.length ? lp.map(id => `<span class="kchip lp">${esc(nm[id] || '?')}</span>`).join(' ') : '<span class="muted">–</span>'}</td></tr>`; });
  const sy = d.saya;
  $('kalBody').innerHTML = `<section class="card-x">${bulanNav(d.bulan, 'pkMuat')}<div class="d-flex flex-wrap align-items-center gap-2 mb-2"><div class="grow"><h3 class="jd mb-0">Jadwal piket</h3><div class="muted small">Keesokan harinya pegawai otomatis berstatus <b>${esc(d.lepasKet)}</b> pada apel (dihitung ${esc(d.lepasStatus)}). Pengingat dikirim ke email sesuai tenggat yang diatur Super Admin${d.ingat.length ? ' (H-' + d.ingat.join(', H-') + ')' : ''}.</div></div>
  ${op ? (edit ? '<button class="btn-o" onclick="pkBatal()">Batal</button> <button class="btn-x" onclick="pkSimpan()"><i class="bi bi-check2"></i> Simpan jadwal</button>' : '<button class="btn-x" onclick="pkEdit()"><i class="bi bi-pencil-square"></i> Isi / ubah jadwal</button>') : ''}</div>
  ${sy.piket.length || sy.petugas.length || sy.lepas ? `<div class="todo mb-2"><i class="bi bi-bell"></i><div><b>Tugas Anda</b><small>${[].concat(sy.piket.map(x => esc(x.Jenis) + ' ' + tglPendek(x.Tanggal)), sy.petugas.map(x => esc(x.Peran) + ' ' + tglPendek(x.Tanggal)), sy.lepas ? [esc(d.lepasKet) + ' ' + (sy.lepas.Tanggal === d.hariIni ? 'hari ini' : 'besok')] : []).join(' · ')}</small></div></div>` : ''}
  <div class="table-wrap"><table class="table table-sm"><thead><tr><th>Tanggal</th>${d.jenis.map(j => `<th>${esc(j.Nama)}${j.Jam ? `<small class="d-block muted">${esc(j.Jam)}</small>` : ''}</th>`).join('')}<th>${esc(d.lepasKet)}</th></tr></thead><tbody>${baris.join('')}</tbody></table></div>
  ${op ? '' : '<p class="muted small mt-2 mb-0">Jadwal diisi oleh operator jadwal yang ditunjuk Super Admin.</p>'}</section>`;
}
function geser_(s, n) { return new Date(Date.parse(s + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10); }
function pkEdit() { S.pkd = JSON.parse(JSON.stringify(pkPeta())); pkGambar(); }
function pkBatal() { S.pkd = null; pkGambar(); }
function pkTambah(tgl, j, el) { if (!el.value) return; const k = tgl + '|' + j; (S.pkd[k] = S.pkd[k] || []).push(el.value); pkGambar(); }
function pkHapus(tgl, j, id) { const k = tgl + '|' + j; S.pkd[k] = (S.pkd[k] || []).filter(x => x !== id); pkGambar(); }
async function pkSimpan() {
  const asal = pkPeta(), kunci = new Set(Object.keys(asal).concat(Object.keys(S.pkd))), baris = [];
  kunci.forEach(k => { const a = (asal[k] || []).slice().sort().join(), b = (S.pkd[k] || []).slice().sort().join(); if (a !== b) { const [tgl, j] = k.split('|'); baris.push({ Tanggal: tgl, JenisID: j, PegawaiIDs: S.pkd[k] || [] }); } });
  if (!baris.length) { toast('Tidak ada perubahan.', 'warning'); return; }
  const r = await call('simpanJadwalPiket', { Bulan: S.pkb, Baris: baris }); if (r) { toast(r.message); pkMuat(S.pkb); muatNotif(); }
}

// ── Petugas Apel / Upacara ──
async function ptMuat(bulan) { const r = await call('getPetugasApel', bulan); if (!r) return; S.ptb = bulan; S.pt = r.data; ptGambar(); }
function ptGambar() {
  const d = S.pt, op = d.operator, per = {}; d.daftar.forEach(x => (per[x.Tanggal] = per[x.Tanggal] || []).push(x));
  const tglL = Object.keys(per).sort(), uc = tgl => d.upacara.some(u => u.Tanggal <= tgl && u.TanggalAkhir >= tgl);
  $('kalBody').innerHTML = `<section class="card-x">${bulanNav(d.bulan, 'ptMuat')}<div class="d-flex flex-wrap align-items-center gap-2 mb-2"><div class="grow"><h3 class="jd mb-0">Petugas apel dan upacara</h3><div class="muted small">Pembina, komandan, pembawa acara, pembaca doa, dirigen, dan petugas upacara. Pegawai yang sedang off tidak dilibatkan; petugas dari luar boleh ditambahkan lewat nama dan email.</div></div>
  ${op ? '<button class="btn-o" onclick="ptManual()"><i class="bi bi-plus-lg"></i> Tambah petugas</button> <button class="btn-x" onclick="ptOtomatis()"><i class="bi bi-magic"></i> Buat otomatis</button>' : ''}${d.admin ? ' <button class="btn-o danger" onclick="ptHapusSemua()"><i class="bi bi-trash"></i> Hapus semua</button>' : ''}</div>
  ${tglL.length ? tglL.map(tgl => `<div class="pt-hari"><div class="d-flex align-items-center gap-2 mb-1"><b>${tglPendek(tgl)}</b><span class="badge-x ${per[tgl][0].Kegiatan === 'Upacara' ? 'wait' : 'ok'}">${esc(per[tgl][0].Kegiatan)}</span>${tgl === d.hariIni ? '<span class="badge-x off">Hari ini</span>' : ''}</div><div class="table-wrap"><table class="table table-sm mb-2"><tbody>${per[tgl].map(x => `<tr class="${x.Saya ? 'tr-now' : ''}"><td style="width:42%">${esc(x.Peran)}</td><td><b>${esc(x.Nama)}</b>${x.Jenis ? ` <small class="muted">· ${esc(x.Jenis)}</small>` : ''}${x.Eksternal ? ' <span class="badge-x off">dari luar</span>' : ''}${x.Saya ? ' <span class="badge-x ok">Anda</span>' : ''}${x.Catatan ? `<small class="d-block muted">${esc(x.Catatan)}</small>` : ''}${op && x.Email ? `<small class="d-block muted"><i class="bi bi-envelope"></i> ${esc(x.Email)}</small>` : ''}${op && !x.Email ? '<small class="d-block text-danger">Tanpa email: pengingat tidak dapat dikirim</small>' : ''}</td><td class="nw text-end no-print">${op ? `<a href="javascript:void(0)" onclick="ptManual('${x.ID}')">ubah</a> · <a href="javascript:void(0)" onclick="ptHapus('${x.ID}')">hapus</a>` : ''}</td></tr>`).join('')}</tbody></table></div></div>`).join('') : kosong('belum ada petugas apel pada bulan ini.' + (op ? ' Gunakan "Buat otomatis" atau "Tambah petugas".' : ''))}
  ${d.upacara.length ? `<p class="muted small mt-2 mb-0">Agenda upacara bulan ini: ${d.upacara.map(u => esc(u.Judul) + ' (' + tglPendek(u.Tanggal) + ')').join(', ')}. Pada tanggal itu daftar peran upacara dipakai.</p>` : ''}</section>`;
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
function ptManual(id) {
  const d = S.pt, x = id ? d.daftar.find(y => y.ID === id) : { Tanggal: today().slice(0, 7) === S.ptb ? today() : S.ptb + '-01', Sesi: d.sesi }, luar = x.Eksternal === true;
  openModal(id ? 'Ubah petugas' : 'Tambah petugas', `<form onsubmit="ptSimpan(event,'${id || ''}')"><div class="row g-3">
  <div class="col-md-6"><label class="lbl" for="pm1">Tanggal *</label><input id="pm1" type="date" class="form-control" value="${esc(x.Tanggal)}" required></div>
  <div class="col-md-6"><label class="lbl" for="pm2">Peran *</label><select id="pm2" class="form-select" required><option value="">Pilih peran...</option>${d.peran.map(p => `<option value="${p.ID}" ${x.PeranID === p.ID ? 'selected' : ''}>${esc(p.Nama)}${p.Kegiatan !== 'Keduanya' ? ' (' + p.Kegiatan.toLowerCase() + ')' : ''}</option>`).join('')}</select></div>
  <div class="col-12"><label class="chk me-3"><input type="radio" name="pms" value="p" ${luar ? '' : 'checked'} onchange="ptSumber()"> Pegawai</label><label class="chk"><input type="radio" name="pms" value="l" ${luar ? 'checked' : ''} onchange="ptSumber()"> Orang dari luar</label></div>
  <div class="col-12" id="pmp"><label class="lbl" for="pm3">Pegawai</label><select id="pm3" class="form-select"><option value="">Pilih pegawai...</option>${d.pegawai.map(p => `<option value="${p.ID}" ${x.PegawaiID === p.ID ? 'selected' : ''}>${esc(p.Nama)}${p.Jenis ? ' · ' + esc(p.Jenis) : ''}${p.Unit ? ' · ' + esc(p.Unit) : ''}</option>`).join('')}</select></div>
  <div class="col-md-6 pml"><label class="lbl" for="pm4">Nama petugas *</label><input id="pm4" class="form-control" maxlength="80" value="${esc(luar ? x.Nama : '')}"></div><div class="col-md-6 pml"><label class="lbl" for="pm5">Email (untuk pengingat)</label><input id="pm5" type="email" class="form-control" maxlength="120" value="${esc(luar ? x.Email : '')}" placeholder="nama@contoh.go.id"></div>
  <div class="col-12"><label class="lbl" for="pm6">Catatan</label><input id="pm6" class="form-control" maxlength="200" value="${esc(x.Catatan || '')}"></div></div><div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">Simpan</button></div></form>`);
  ptSumber();
}
function ptSumber() { const l = document.querySelector('[name=pms]:checked').value === 'l'; $('pmp').style.display = l ? 'none' : ''; document.querySelectorAll('.pml').forEach(e => e.style.display = l ? '' : 'none'); }
async function ptSimpan(e, id) {
  e.preventDefault(); const l = document.querySelector('[name=pms]:checked').value === 'l', b = e.target.querySelector('[type=submit]'); busy(b, true);
  const r = await call('simpanPetugas', { ID: id || undefined, Tanggal: $('pm1').value, PeranID: $('pm2').value, PegawaiID: l ? '' : $('pm3').value, Nama: l ? $('pm4').value : '', Email: l ? $('pm5').value : '', Catatan: $('pm6').value }); busy(b, false);
  if (r) { closeModal(); toast(r.message); ptMuat(S.ptb); muatNotif(); }
}
function ptHapus(id) { askReason('Batalkan petugas', async a => { const r = await call('hapusPetugas', id, a); if (r) { toast(r.message); ptMuat(S.ptb); muatNotif(); } }); }

// ── Aturan (Super Admin) ──
async function arMuat() { const r = await call('getAturanPiket'); if (!r) return; S.ar = r.data; S.arOps = S.ar.setting.ops.slice(); S.arR = JSON.parse(JSON.stringify(S.ar.peran)); arGambar(); }
const arJ = j => `<tr><td><input class="form-control" data-f="nama" data-id="${esc(j.ID || '')}" value="${esc(j.Nama || '')}" maxlength="50" aria-label="Nama jenis piket"></td><td><input class="form-control" data-f="jam" value="${esc(j.Jam || '')}" maxlength="60" aria-label="Keterangan jam"></td><td class="text-center"><input type="checkbox" data-f="lepas" ${j.LepasPiket !== false ? 'checked' : ''} aria-label="Lepas piket besok"></td><td class="text-center"><input type="checkbox" data-f="aktif" ${j.Aktif !== false ? 'checked' : ''} aria-label="Aktif"></td></tr>`;
function arGambar() {
  const a = S.ar, s = a.setting, nmA = {}; a.akun.forEach(x => nmA[x.Email] = x.Nama);
  $('kalBody').innerHTML = `<form onsubmit="arSimpan(event)"><section class="card-x mb-3"><h3 class="jd mb-1">Operator jadwal</h3><p class="muted small">Akun yang mengisi jadwal piket dan petugas apel (biasanya sebulan sekali). Super Admin selalu dapat mengisi.</p><div class="kchips mb-2" id="arOps"></div><select id="arOpPilih" class="form-select" style="max-width:360px" onchange="arOpTambah(this)" aria-label="Tambah operator jadwal"><option value="">+ tambah operator jadwal...</option>${a.akun.map(x => `<option value="${esc(x.Email)}">${esc(x.Nama)} · ${esc(x.Email)}</option>`).join('')}</select></section>
  <section class="card-x mb-3"><h3 class="jd mb-1">Jenis piket</h3><p class="muted small">Centang "Lepas piket besok" agar pegawai otomatis berstatus Lepas Piket pada apel keesokan harinya (off).</p><div class="table-wrap"><table class="table"><thead><tr><th>Jenis piket</th><th>Keterangan jam</th><th>Lepas piket besok</th><th>Aktif</th></tr></thead><tbody id="arJ">${a.jenis.map(arJ).join('')}</tbody></table></div><button type="button" class="btn-o" onclick="$('arJ').insertAdjacentHTML('beforeend', arJ({}))">+ Tambah jenis piket</button>
  <div class="row g-3 mt-2"><div class="col-md-6"><label class="lbl" for="arLk">Nama status setelah piket</label><input id="arLk" class="form-control" maxlength="40" value="${esc(s.lepasKet)}"></div><div class="col-md-6"><label class="lbl" for="arLs">Dihitung sebagai kategori</label><select id="arLs" class="form-select">${a.kategori.map(k => `<option ${s.lepasStatus === k ? 'selected' : ''}>${k}</option>`).join('')}</select><small class="muted">Bawaan Hadir. Aturan uang makan khusus dapat diatur di Master Data → Kehadiran.</small></div></div></section>
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
  const jenis = [...$('arJ').querySelectorAll('tr')].map(r => ({ ID: q(r, 'nama').dataset.id || undefined, Nama: q(r, 'nama').value, Jam: q(r, 'jam').value, LepasPiket: q(r, 'lepas').checked, Aktif: q(r, 'aktif').checked })).filter(j => j.Nama.trim() || j.ID);
  const peran = S.arR.map(p => ({ ID: p.ID || undefined, Nama: p.Nama, Kegiatan: p.Kegiatan, Aktif: p.Aktif, aturan: p.aturan.map(x => ({ ID: x.ID || undefined, Hari: x.Hari, Mode: x.Mode, JenisIDs: x.JenisIDs, Unit: x.Unit, PegawaiIDs: x.PegawaiIDs, Rotasi: x.Rotasi, Ganti: x.Ganti, Aktif: x.Aktif })) })).filter(p => p.Nama.trim() || p.ID);
  const setting = { ops: S.arOps, ingatPiket: $('arIp').value, ingatPetugas: $('arIt').value, jam: $('arJm').value, hari: [...document.querySelectorAll('[name=arH]:checked')].map(x => Number(x.value)), sesi: $('arSs').value, jeda: $('arJd').value, lepasKet: $('arLk').value, lepasStatus: $('arLs').value, kabarLangsung: $('arKb').checked };
  busy(btn, true); const r = await call('simpanAturanPiket', { jenis, peran, setting }); busy(btn, false); if (r) { toast(r.message); arMuat(); }
}
async function arPemicu(on) { const r = await call('pasangPengingatOtomatis', on); if (r) { toast(r.message); arMuat(); } }
async function arKirim() { const r = await call('kirimPengingatSekarang'); if (r) toast(r.message); }
(window.MOD = window.MOD || []).push('Piket');
