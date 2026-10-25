/** Master Data & Pengaturan: satu pusat untuk semua persetujuan dan pengaturan Super Admin (tab). */
const ROLE_X = ['Super Admin', 'Operator', 'Atasan', 'Pimpinan'];
const MTABS = [
  ['persetujuan', 'Persetujuan', 'bi-patch-check'], ['akun', 'Akun & Peran', 'bi-people'], ['unit', 'Unit & Regu', 'bi-diagram-3'], ['operator', 'Operator', 'bi-person-gear'],
  ['profil', 'Profil & Kolom', 'bi-ui-checks'], ['kehadiran', 'Kehadiran', 'bi-calendar-x'], ['aturan', 'Aturan', 'bi-sliders'], ['tampilan', 'Tampilan', 'bi-palette']
];
const MT = {};
const mb = h => { const b = $('mbody'); if (b) b.innerHTML = h; return !!b; };
const jmlAntrian = () => { const a = S.antrian || {}; return (a.akun || 0) + (a.profil || 0) + (a.surat || 0); };
function barTab() {
  return `<div class="mtabs" role="tablist" aria-label="Master Data dan Pengaturan">${MTABS.map(t => `<button type="button" role="tab" class="mtab ${t[0] === S.mtab ? 'on' : ''}" data-t="${t[0]}" aria-selected="${t[0] === S.mtab}" onclick="gantiTab('${t[0]}')"><i class="bi ${t[2]}"></i>${t[1]}${t[0] === 'persetujuan' && jmlAntrian() ? `<span class="cnt" id="cntP">${jmlAntrian()}</span>` : ''}</button>`).join('')}</div><div id="mbody"></div>`;
}
RENDER.master = async () => {
  const tab = S.tab && MT[S.tab] ? S.tab : S.mtab && MT[S.mtab] ? S.mtab : 'persetujuan'; S.tab = null; S.mtab = tab;
  const a = await call('getAntrian'); if (!a) return; S.antrian = a.data;
  $('app-container').innerHTML = barTab();
  await MT[tab]();
};
async function gantiTab(k) {
  if (!MT[k]) return; S.mtab = k;
  document.querySelectorAll('.mtab').forEach(b => { const on = b.dataset.t === k; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  mb('<p class="muted text-center py-5 mb-0">Memuat...</p>'); await MT[k]();
}
async function muatTab() { // segarkan tab aktif, jumlah antrian, dan bel pengingat setelah ada perubahan
  const a = await call('getAntrian'); if (a) {
    S.antrian = a.data; const p = document.querySelector('.mtab[data-t=persetujuan]'), n = jmlAntrian();
    if (p) { let c = $('cntP'); if (!n && c) c.remove(); else if (n) { if (!c) { c = document.createElement('span'); c.className = 'cnt'; c.id = 'cntP'; p.appendChild(c); } c.textContent = n; } }
  }
  if (MT[S.mtab]) await MT[S.mtab](); muatNotif();
}
const badgeS = s => `<span class="badge-x ${s === 'Disetujui' || s === 'Aktif' ? 'ok' : s === 'Menunggu' ? 'wait' : 'off'}">${esc(s)}</span>`;
const waktu = ms => ms ? new Date(Number(ms)).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
const rentang = x => `${tglIndo(x.Mulai)} s.d. ${tglIndo(x.Sampai)} (${x.Hari} hari)`;

// ── Tab Persetujuan: akun baru, perubahan profil, surat cuti/izin/sakit ──
MT.persetujuan = async () => {
  const [r, pj, sr] = await Promise.all([call('listAkun'), call('daftarPengajuan'), call('daftarSurat')]); if (!r || !pj || !sr) return;
  S.akun = r.data.akun; S.ta = r.data.tanpaAkun; S.pj = pj.data; S.sr = sr.data;
  mb(akunBaruCard() + suratCard() + pengajuanCard());
};
function akunBaruCard() {
  const M = S.akun.filter(a => a.Status === 'Menunggu');
  return `<div class="card-x mb-3"><h3 class="h6">Pendaftaran akun baru <span class="badge-x ${M.length ? 'wait' : 'off'}">${M.length}</span></h3>${M.length ? `<p class="muted small">Setelah disetujui, pendaftar otomatis tercatat sebagai pegawai dan dapat masuk. Pastikan nama dan NIP sudah benar.</p>` + M.map(a => `<div class="todo"><div><b>${esc(a.Nama)}</b><small>NIP ${esc(a.NIP) || '–'} · ${esc(a.Email)}</small></div><button class="btn-x" onclick="aksiAkun('${a.ID}','setujui')">Setujui</button><button class="btn-o danger" onclick="tolakAkun('${a.ID}')">Tolak</button></div>`).join('') : '<p class="muted mb-0">Tidak ada pendaftaran yang menunggu.</p>'}</div>`;
}
function suratCard() {
  const M = S.sr.menunggu, T = S.sr.terbaru;
  const lampir = x => x.NamaBerkas ? ` <a href="javascript:void(0)" onclick="lihatSuratUI('${x.ID}')"><i class="bi bi-paperclip"></i> lihat lampiran</a>` : '';
  return `<div class="card-x mb-3"><h3 class="h6">Surat cuti, izin, dan sakit <span class="badge-x ${M.length ? 'wait' : 'off'}">${M.length}</span></h3>${M.length ? `<p class="muted small">Periksa lampiran lebih dulu. Setelah disetujui, kehadiran apel pegawai pada rentang tanggal surat terisi otomatis dan hanya Super Admin yang dapat mengubahnya.</p>` + M.map(x => `<div class="todo"><div><b>${esc(x.Nama)}</b> <span class="badge-x wait">${esc(x.Jenis)}</span><small>NIP ${esc(x.NIP) || '–'} · ${rentang(x)}</small><small>${x.NoSurat ? 'No. surat ' + esc(x.NoSurat) + ' · ' : ''}Diajukan ${waktu(x.Diajukan)}${lampir(x)}</small>${x.Catatan ? `<small>Catatan: ${esc(x.Catatan)}</small>` : ''}<small>${x.Terdampak ? x.Terdampak + ' catatan apel pada rentang ini akan terisi otomatis.' : 'Belum ada apel pada rentang ini; apel yang dibuka kemudian akan terisi otomatis.'}</small></div><button class="btn-x" onclick="putusSurat('${x.ID}',true)">Setujui</button><button class="btn-o danger" onclick="tolakSurat('${x.ID}')">Tolak</button></div>`).join('') : '<p class="muted mb-0">Tidak ada surat yang menunggu verifikasi.</p>'}${T.length ? `<details class="mt-3"><summary class="muted small">Keputusan terbaru (${T.length})</summary>${T.map(x => `<div class="small mt-2">${badgeS(x.Status)} ${esc(x.Nama)} · ${esc(x.Jenis)} · ${rentang(x)}${x.Alasan ? ' · ' + esc(x.Alasan) : ''}${lampir(x)}${x.Status === 'Disetujui' ? ` <a href="javascript:void(0)" class="text-danger" onclick="cabutSuratUI('${x.ID}')">cabut</a>` : ''}</div>`).join('')}</details>` : ''}</div>`;
}
async function putusSurat(id, setuju, alasan) { const r = await call('putuskanSurat', id, setuju, alasan || ''); if (r) { toast(r.message); muatTab(); } }
function tolakSurat(id) { askReason('Tolak surat', a => putusSurat(id, false, a)); }
function cabutSuratUI(id) { askReason('Cabut persetujuan surat (kehadiran yang terisi dari surat ini dikembalikan menjadi Hadir)', async a => { const r = await call('cabutSurat', id, a); if (r) { toast(r.message); muatTab(); } }); }
async function lihatSuratUI(id) { const r = await call('lihatSurat', id); if (r) tampilBerkas(r.data); }
function ringkasPengajuan(x) {
  const d = x.Data, a = Object.keys(d.dasar).map(f => `<div class="small"><b>${f}</b>: ${esc(d.dasar[f].lama) || '–'} → <b>${esc(d.dasar[f].baru) || '–'}</b></div>`), k = Object.keys(d.kolom).map(id => { const c = d.kolom[id]; return `<div class="small"><b>${esc(c.nama)}</b>: ${esc(c.lama) || '–'} → <b>${esc(c.baru) || '–'}</b>${c.tipe === 'Berkas' && c.berkasId ? ` <a href="javascript:void(0)" onclick="lihatBerkas('${c.berkasId}')">lihat berkas</a>` : ''}</div>`; });
  if (d.foto) k.push(`<div class="small"><b>Pasfoto</b>: ${d.foto.lama ? 'mengganti foto lama' : 'foto baru'} <a href="javascript:void(0)" onclick="lihatBerkas('${d.foto.berkasId}')">lihat foto</a></div>`);
  return a.concat(k).join('');
}
function pengajuanCard() {
  const M = S.pj.menunggu, T = S.pj.terbaru;
  return `<div class="card-x mb-3"><h3 class="h6">Perubahan profil pegawai <span class="badge-x ${M.length ? 'wait' : 'off'}">${M.length}</span></h3>${M.length ? M.map(x => `<div class="todo"><div><b>${esc(x.Nama)}</b><small>Diajukan ${waktu(x.Diajukan)}</small>${ringkasPengajuan(x)}</div><button class="btn-x" onclick="putusUI('${x.ID}',true)">Setujui</button><button class="btn-o danger" onclick="tolakPengajuan('${x.ID}')">Tolak</button></div>`).join('') : '<p class="muted mb-0">Tidak ada pengajuan yang menunggu. Perubahan profil pegawai baru berlaku setelah Anda menyetujuinya.</p>'}${T.length ? `<details class="mt-3"><summary class="muted small">Keputusan terbaru (${T.length})</summary>${T.map(x => `<div class="small mt-2">${badgeS(x.Status)} ${esc(x.Nama)}${x.Alasan ? ' · ' + esc(x.Alasan) : ''}</div>`).join('')}</details>` : ''}</div>`;
}
async function putusUI(id, setuju, alasan) { const r = await call('putuskanPengajuan', id, setuju, alasan || ''); if (r) { toast(r.message); muatTab(); } }
function tolakPengajuan(id) { askReason('Tolak pengajuan perubahan profil', a => putusUI(id, false, a)); }

// ── Tab Akun & Peran ──
async function aksiAkun(id, aksi, roles, alasan) { const r = await call('ubahAkun', id, aksi, roles || [], alasan || ''); if (r) { toast(r.message); muatTab(); } }
function tolakAkun(id) { askReason('Tolak pendaftaran akun', a => aksiAkun(id, 'tolak', [], a)); }
function resetPw(id) { askReason('Reset kata sandi (kata sandi sementara dikirim ke email pengguna)', async a => { const r = await call('resetPassword', id, a); if (r) toast(r.message); }); }
function formPeran(id) {
  const a = S.akun.find(x => x.ID === id), cur = String(a.Roles).split(',');
  openModal('Peran: ' + a.Nama, `<form onsubmit="savePeran(event,'${id}')"><p class="muted">Semua akun otomatis berperan Pegawai.</p>${ROLES.map(r => `<label class="chk d-block"><input type="checkbox" name="r" value="${r}" ${cur.includes(r) ? 'checked' : ''}> ${r}</label>`).join('')}<div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">Simpan</button></div></form>`);
}
function savePeran(e, id) { e.preventDefault(); const r = [...e.target.querySelectorAll('[name=r]:checked')].map(x => x.value); closeModal(); aksiAkun(id, 'peran', r); }
MT.akun = async () => {
  const r = await call('listAkun'); if (!r) return; S.akun = r.data.akun; S.ta = r.data.tanpaAkun;
  const aksi = a => a.Status === 'Menunggu' ? `<button class="btn-o" onclick="gantiTab('persetujuan')">Putuskan di Persetujuan</button>` : a.Status === 'Aktif' ? `<button class="btn-o" onclick="formPeran('${a.ID}')">Peran</button> <button class="btn-o" onclick="resetPw('${a.ID}')">Reset kata sandi</button> <button class="btn-o danger" onclick="nonaktifAkun('${a.ID}')">Nonaktifkan</button>` : `<button class="btn-o" onclick="aksiAkun('${a.ID}','aktifkan')">Aktifkan kembali</button>`;
  mb(`<div class="card-x mb-3"><h3 class="h6">Akun pengguna</h3><div class="table-wrap"><table class="table"><thead><tr><th>Nama</th><th>NIP</th><th>Email</th><th>Peran</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${S.akun.map(a => `<tr><td>${esc(a.Nama)}</td><td class="nw">${esc(a.NIP) || '–'}</td><td>${esc(a.Email)}</td><td>${esc(String(a.Roles).replace(/,/g, ', '))}</td><td>${badgeS(a.Status)}</td><td class="nw">${aksi(a)}${a.Email === S.user.email ? '' : ` <button class="btn-o danger" onclick="hapusAkunUI('${a.ID}')">Hapus</button>`}</td></tr>`).join('')}</tbody></table></div><p class="muted small mb-0">Pengguna yang lupa kata sandi dapat memakai "Lupa kata sandi" di halaman masuk (kode dikirim ke email). Reset oleh Super Admin mengirim kata sandi sementara ke email pengguna dan wajib diganti saat masuk.</p></div>`
    + `<div class="card-x"><h3 class="h6">Pegawai belum punya akun</h3>${S.ta.length ? `<p class="muted small">Data pegawai yang diisi manual belum otomatis punya akun. Buatkan akun agar pegawai dapat masuk; kata sandi sementara dikirim ke email pegawai.</p><div class="table-wrap"><table class="table"><thead><tr><th>Nama</th><th>NIP</th><th>Email</th><th></th></tr></thead><tbody>${S.ta.map(p => `<tr><td>${esc(p.Nama)}</td><td class="nw">${esc(p.NIP)}</td><td>${esc(p.Email) || '–'}</td><td><button class="btn-x" onclick="formBuatAkun('${p.ID}')">Buat akun</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="muted mb-0">Semua pegawai aktif sudah memiliki akun.</p>'}</div>`);
};
function hapusAkunUI(id) {
  const a = S.akun.find(x => x.ID === id);
  openModal('Hapus akun: ' + a.Nama, `<form onsubmit="hapusAkunGo(event,'${id}')"><div class="todo"><i class="bi bi-exclamation-octagon"></i><div><b>Penghapusan bersifat permanen</b><small>Akun ${esc(a.Email)} tidak dapat masuk lagi. Data kepegawaian, riwayat aktivitas, dan hasil penilaian tidak ikut terhapus. Untuk menutup akses sementara, gunakan Nonaktifkan.</small></div></div><label class="lbl mt-3" for="ha">Alasan penghapusan *</label><textarea id="ha" rows="2" class="form-control mb-2" required></textarea><label class="chk"><input type="checkbox" id="hc" required> Saya mengerti akun ini akan dihapus permanen</label><div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">Hapus akun</button></div></form>`);
}
async function hapusAkunGo(e, id) { e.preventDefault(); const b = e.target.querySelector('[type=submit]'); busy(b, true); const r = await call('hapusAkun', id, $('ha').value); busy(b, false); if (r) { closeModal(); toast(r.message); muatTab(); } }
function nonaktifAkun(id) { askReason('Nonaktifkan akun', a => aksiAkun(id, 'nonaktif', [], a)); }
function formBuatAkun(pid) {
  const p = S.ta.find(x => x.ID === pid);
  openModal('Buat akun: ' + p.Nama, `<form onsubmit="buatAkunUI(event,'${pid}')"><label class="lbl" for="ba">Email pegawai (menjadi ID masuk)</label><input id="ba" type="email" class="form-control mb-3" value="${esc(p.Email)}" required><span class="lbl">Peran tambahan (semua akun otomatis Pegawai)</span>${ROLE_X.map(r => `<label class="chk me-3"><input type="checkbox" name="br" value="${r}"> ${r}</label>`).join('')}<p class="muted small mt-2">Kata sandi sementara dikirim ke email tersebut dan wajib diganti saat masuk pertama.</p><div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">Buat akun</button></div></form>`);
}
async function buatAkunUI(e, pid) { e.preventDefault(); const b = e.target.querySelector('[type=submit]'); busy(b, true); const r = await call('buatAkun', pid, $('ba').value, [...document.querySelectorAll('[name=br]:checked')].map(x => x.value)); busy(b, false); if (r) { closeModal(); toast(r.message); muatTab(); } }

// ── Tab Unit & Regu: unit kerja adalah sumber tunggal pilihan unit di Pegawai dan Profil ──
MT.unit = async () => {
  const [u, g] = await Promise.all([call('listUnit'), call('getRegu')]); if (!u || !g) return; S.un = u.data;
  const cur = n => g.data.anggota.filter(a => a.Regu === n && !a.Sampai);
  mb(`<div class="row g-3"><div class="col-lg-5"><div class="card-x"><h3 class="h6">Unit kerja</h3>
  <form class="toolbar" onsubmit="unitUI(event)"><input id="un" class="form-control" placeholder="Nama unit kerja baru" aria-label="Nama unit kerja baru" maxlength="80" required><button class="btn-x" type="submit">Tambah</button></form>
  ${u.data.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Unit</th><th>Pegawai</th><th></th></tr></thead><tbody>${u.data.map(x => `<tr><td>${esc(x.Nama)}${x.Aktif === true ? '' : ' <span class="badge-x off">Nonaktif</span>'}</td><td>${x.Dipakai}</td><td class="text-end nw"><button class="btn-o" onclick="unitNama('${x.ID}')">Ubah nama</button> <button class="btn-o ${x.Aktif === true ? 'danger' : ''}" onclick="unitAktif('${x.ID}',${x.Aktif === true ? 'false' : 'true'})">${x.Aktif === true ? 'Nonaktifkan' : 'Aktifkan'}</button>${x.Dipakai ? '' : ` <button class="btn-o danger" onclick="unitHapus('${x.ID}')">Hapus</button>`}</td></tr>`).join('')}</tbody></table></div>` : kosong('belum ada unit kerja.')}<p class="muted small mt-3 mb-0">Daftar ini menjadi satu-satunya pilihan unit di formulir Pegawai dan Profil. Mengubah nama unit ikut memperbarui semua pegawai di unit itu. Unit yang masih dipakai pegawai hanya dapat dinonaktifkan.</p></div></div>
  <div class="col-lg-7"><div class="card-x"><h3 class="h6">Regu penjagaan dan anggota</h3>
  <form class="toolbar" onsubmit="anggotaUI(event)"><select id="mr" class="form-select" aria-label="Regu">${REGU.map(n => `<option>${n}</option>`).join('')}</select><select id="mp" class="form-select" style="max-width:240px" aria-label="Pegawai" required><option value="">Pilih pegawai...</option>${g.data.pegawai.map(p => `<option value="${p.ID}">${esc(p.Nama)}</option>`).join('')}</select><input id="mt" type="date" class="form-control" style="max-width:170px" value="${today()}" aria-label="Berlaku mulai" required><button class="btn-x" type="submit">Masukkan</button></form>
  ${REGU.map(n => `<div class="mb-3"><b>${n}</b> <span class="muted">(${cur(n).length} anggota)</span><div class="mt-1">${cur(n).map(a => `<span class="badge-x ok me-1 mb-1">${esc(a.Nama)} · sejak ${esc(a.Mulai)} <a href="javascript:void(0)" onclick="keluarUI('${a.ID}')" aria-label="Keluarkan ${esc(a.Nama)}">&times;</a></span>`).join('') || '<span class="muted">Belum ada anggota.</span>'}</div></div>`).join('')}
  <p class="muted small mb-0">Memindahkan pegawai ke regu lain menutup keanggotaan lama; catatan apel lama tetap menunjukkan regu lamanya.</p></div></div></div>`);
};
async function unitUI(e) { e.preventDefault(); const r = await call('simpanUnit', $('un').value); if (r) { toast(r.message); muatTab(); } }
async function unitAktif(id, aktif) { const r = await call('ubahUnit', id, { Aktif: aktif }); if (r) { toast(r.message); muatTab(); } }
function unitNama(id) {
  const x = S.un.find(u => u.ID === id);
  openModal('Ubah nama unit kerja', `<form onsubmit="unitNamaGo(event,'${id}')"><label class="lbl" for="unn">Nama unit</label><input id="unn" class="form-control" maxlength="80" value="${esc(x.Nama)}" required>${x.Dipakai ? `<p class="muted small mt-2">${x.Dipakai} pegawai di unit ini ikut diperbarui otomatis.</p>` : ''}<div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">Simpan</button></div></form>`);
}
async function unitNamaGo(e, id) { e.preventDefault(); const r = await call('ubahUnit', id, { Nama: $('unn').value }); if (r) { closeModal(); toast(r.message); muatTab(); } }
async function anggotaUI(e) { e.preventDefault(); const r = await call('aturAnggota', 'tambah', { Regu: $('mr').value, PegawaiID: $('mp').value, Tanggal: $('mt').value }); if (r) { toast(r.message); muatTab(); } }
function keluarUI(id) { openModal('Keluarkan dari regu', `<form onsubmit="keluarGo(event,'${id}')"><label class="lbl" for="kt">Tidak lagi anggota mulai tanggal</label><input id="kt" type="date" class="form-control" value="${today()}" required><div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">Keluarkan</button></div></form>`); }
async function keluarGo(e, id) { e.preventDefault(); const t = $('kt').value; closeModal(); const r = await call('aturAnggota', 'keluar', { ID: id, Tanggal: t }); if (r) { toast(r.message); muatTab(); } }

// ── Tab Operator ──
MT.operator = async () => { const r = await call('getPenugasan'); if (!r) return; S.pn = r.data; mb(panelOperator()); };
// ── Tab Profil & Kolom ──
MT.profil = async () => { const r = await call('getKolom'); if (!r) return; S.kl2 = r.data; mb(panelKolom()); };

// ── Tab Kehadiran: keterangan (izin, cuti, sakit, dll.) dan skor status ──
MT.kehadiran = async () => {
  const [r, s] = await Promise.all([call('getKeterangan'), call('getSkorHadir')]); if (!r || !s) return; S.ket = r.data; S.sk = s.data;
  mb(`<div class="card-x mb-3"><div class="rowb mb-2"><h3 class="h6 mb-0 grow">Keterangan ketidakhadiran apel</h3><button class="btn-x" onclick="formKeterangan()">Atur keterangan</button></div>
  <p class="muted small">Keterangan ini muncul sebagai pilihan saat operator mengisi apel dan saat pegawai mengajukan surat. Setiap keterangan masuk ke salah satu kategori status agar penilaian kehadiran tetap konsisten. Keterangan bertanda "perlu surat" dapat diajukan pegawai lewat menu Cuti &amp; Izin.</p>
  <div class="table-wrap"><table class="table"><thead><tr><th>Keterangan</th><th>Kategori status</th><th>Lewat surat</th><th>Status</th></tr></thead><tbody>${S.ket.daftar.map(k => `<tr><td>${esc(k.Nama)}</td><td>${esc(k.Kategori)}</td><td>${k.Surat === true ? '<span class="badge-x ok">Ya</span>' : '–'}</td><td>${k.Aktif === true ? '<span class="badge-x ok">Aktif</span>' : '<span class="badge-x off">Nonaktif</span>'}</td></tr>`).join('')}</tbody></table></div></div>
  <div class="card-x"><div class="rowb mb-2"><h3 class="h6 mb-0 grow">Skor status kehadiran</h3><button class="btn-x" onclick="formSkor()">Atur skor</button></div>
  <div class="table-wrap"><table class="table"><thead><tr><th>Status</th><th>Skor</th></tr></thead><tbody>${S.sk.status.map(x => `<tr><td>${x}</td><td>${S.sk.skor[x] === null ? 'Dikecualikan dari perhitungan' : S.sk.skor[x]}</td></tr>`).join('')}</tbody></table></div><p class="muted small mb-0">Skor dipakai pada Penilaian Kinerja (komponen Kehadiran), sama untuk apel staf dan apel penjagaan.</p></div>`);
};
const rowKet = k => `<tr><td><input class="form-control" value="${esc(k.Nama)}" data-id="${esc(k.ID || '')}" maxlength="40" aria-label="Nama keterangan"></td><td><select class="form-select" aria-label="Kategori">${S.ket.kategori.map(c => `<option ${c === k.Kategori ? 'selected' : ''}>${c}</option>`).join('')}</select></td><td class="text-center"><input type="checkbox" ${k.Surat ? 'checked' : ''} aria-label="Lewat surat"></td><td class="text-center"><input type="checkbox" ${k.Aktif !== false ? 'checked' : ''} aria-label="Aktif"></td></tr>`;
function formKeterangan() {
  openModal('Keterangan ketidakhadiran apel', `<form onsubmit="simpanKetUI(event)"><p class="muted small">Kategori menentukan status pada apel dan skor kehadiran: Izin, Sakit, Dinas Luar, atau Tidak Hadir. Centang "Surat" bila keterangan itu diajukan pegawai dengan lampiran. Keterangan yang sudah dipakai tidak dihapus; nonaktifkan saja.</p><div class="table-wrap"><table class="table"><thead><tr><th>Nama</th><th>Kategori</th><th>Surat</th><th>Aktif</th></tr></thead><tbody id="kk2">${S.ket.daftar.map(rowKet).join('')}</tbody></table></div><button type="button" class="btn-o" onclick="$('kk2').insertAdjacentHTML('beforeend', rowKet({Nama:'',Kategori:S.ket.kategori[0],Surat:false,Aktif:true}))">+ Tambah keterangan</button><div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">Simpan</button></div></form>`);
}
async function simpanKetUI(e) {
  e.preventDefault();
  const arr = [...$('kk2').querySelectorAll('tr')].map(r => { const c = r.querySelectorAll('input'); return { ID: c[0].dataset.id || undefined, Nama: c[0].value, Kategori: r.querySelector('select').value, Surat: c[1].checked, Aktif: c[2].checked }; }).filter(k => k.Nama.trim() || k.ID);
  const r = await call('simpanKeterangan', arr); if (r) { closeModal(); toast(r.message); muatTab(); }
}
async function formSkor() {
  const d = S.sk;
  openModal('Skor status kehadiran', `<form onsubmit="simpanSkorUI(event)"><p class="muted small">Berlaku sama untuk apel staf dan apel penjagaan agar penilaian kehadiran seimbang. Isi skor 0 sampai 100, atau centang "Dikecualikan" agar status itu tidak dihitung sebagai apel yang wajib diikuti (misalnya cuti resmi atau dinas luar). Skor kehadiran = rata-rata skor semua apel yang wajib diikuti pegawai.</p><div class="table-wrap"><table class="table"><thead><tr><th>Status</th><th>Skor</th><th>Dikecualikan</th></tr></thead><tbody>${d.status.map((s, i) => `<tr><td>${s}</td><td style="width:120px"><input type="number" min="0" max="100" step="1" class="form-control" data-s="${i}" value="${d.skor[s] === null ? '' : d.skor[s]}" ${d.skor[s] === null ? 'disabled' : ''} aria-label="Skor ${s}"></td><td><input type="checkbox" data-x="${i}" ${d.skor[s] === null ? 'checked' : ''} ${s === 'Hadir' ? 'disabled' : ''} aria-label="Dikecualikan ${s}" onchange="this.closest('tr').querySelector('[data-s]').disabled=this.checked"></td></tr>`).join('')}</tbody></table></div><p class="muted small">Bawaan: Hadir 100, Terlambat 100, lainnya 0. Perubahan berlaku untuk penilaian yang disimpan sesudahnya; penilaian yang sudah disahkan tidak berubah.</p><div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">Simpan</button></div></form>`);
}
async function simpanSkorUI(e) {
  e.preventDefault(); const o = {};
  S.sk.status.forEach((s, i) => { const x = document.querySelector(`[data-x="${i}"]`), v = document.querySelector(`[data-s="${i}"]`); o[s] = x.checked ? null : v.value; });
  const r = await call('simpanSkorHadir', o); if (r) { closeModal(); toast(r.message); muatTab(); }
}

// ── Tab Aturan: parameter KGB & pangkat ──
MT.aturan = async () => {
  const r = await call('getParamKgb'); if (!r) return; S.pk = r.data; const P = r.data;
  mb(`<div class="card-x"><div class="rowb mb-2"><h3 class="h6 mb-0 grow">Aturan jadwal KGB &amp; kenaikan pangkat</h3><button class="btn-x" onclick="formParam()">Atur parameter</button></div>
  ${P ? `<div class="table-wrap"><table class="table"><tbody><tr><td>Jarak KGB</td><td>${P.kgb_bulan} bulan</td></tr><tr><td>Peringatan KGB</td><td>${P.kgb_hari} hari sebelum jadwal</td></tr><tr><td>Jarak kenaikan pangkat</td><td>${P.pangkat_bulan} bulan</td></tr><tr><td>Peringatan kenaikan pangkat</td><td>${P.pangkat_hari} hari sebelum jadwal</td></tr></tbody></table></div>` : '<p class="muted">Parameter belum diatur, jadwal KGB &amp; pangkat belum dapat dihitung.</p>'}
  <p class="muted small mb-0">Komponen dan bobot Penilaian Kinerja diatur di menu Penilaian Kinerja karena terkait periode penilaian.</p></div>`);
};
function formParam() {
  const P = S.pk || {}, f = (k, l) => `<div class="col-6"><label class="lbl" for="p_${k}">${l}</label><input id="p_${k}" type="number" min="0" step="1" class="form-control" value="${P[k] ?? ''}" required></div>`;
  openModal('Parameter KGB & Pangkat', `<form onsubmit="simpanParamUI(event)"><p class="muted">Jarak dan masa peringatan mengikuti aturan resmi instansi; periksa kembali sebelum disimpan.</p><div class="row g-3">${f('kgb_bulan', 'Jarak KGB (bulan)')}${f('kgb_hari', 'Peringatan KGB (hari sebelum jadwal)')}${f('pangkat_bulan', 'Jarak kenaikan pangkat (bulan)')}${f('pangkat_hari', 'Peringatan pangkat (hari sebelum jadwal)')}</div><div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">Simpan</button></div></form>`);
}
async function simpanParamUI(e) { e.preventDefault(); const d = {}; ['kgb_bulan', 'kgb_hari', 'pangkat_bulan', 'pangkat_hari'].forEach(k => d[k] = $('p_' + k).value); const r = await call('simpanParam', d); if (r) { closeModal(); toast(r.message); muatTab(); } }

// ── Tab Tampilan: nama, logo, dan warna aplikasi ──
MT.tampilan = async () => {
  const r = await call('getTampilan'); if (!r) return; S.tp = Object.assign({}, r.data); S.tpLogo = undefined;
  const t = S.tp, w = (k, l) => `<div><label class="lbl" for="t_${k}">${l}</label><div class="color-in"><input type="color" id="t_${k}" value="${t[k]}" oninput="pratinjauTema()" aria-label="${l}"><code id="h_${k}">${t[k]}</code></div></div>`;
  mb(`<div class="card-x"><h3 class="h6">Tampilan aplikasi</h3><p class="muted small">Nama, logo, dan warna berlaku untuk semua pengguna, termasuk halaman masuk. Warna yang membuat tulisan sulit dibaca akan ditolak.</p>
  <form onsubmit="simpanTemaUI(event)"><div class="row g-3"><div class="col-md-6"><label class="lbl" for="t_nama">Nama aplikasi</label><input id="t_nama" class="form-control" maxlength="40" value="${esc(t.nama)}" oninput="pratinjauTema()" required></div><div class="col-md-6"><label class="lbl" for="t_sub">Subjudul</label><input id="t_sub" class="form-control" maxlength="60" value="${esc(t.sub)}" oninput="pratinjauTema()"></div><div class="col-md-6"><label class="lbl" for="t_instansi">Nama instansi</label><input id="t_instansi" class="form-control" maxlength="60" value="${esc(t.instansi)}" oninput="pratinjauTema()"></div>
  <div class="col-md-6"><span class="lbl">Logo</span><div class="rowb"><div class="logo-box" id="t_logobox"></div><div class="grow"><input id="t_logo" type="file" accept="image/png,image/jpeg" class="form-control" onchange="pilihLogo(this)" aria-label="Pilih logo"><div class="small muted mt-1">PNG atau JPEG, otomatis diperkecil. <a href="javascript:void(0)" onclick="hapusLogoUI()">Hapus logo</a></div></div></div></div></div>
  <div class="col-12 mt-3"><h4 class="h6 mb-1">Informasi di halaman depan</h4><p class="muted small mb-2">Muncul saat pengguna menekan tombol Informasi di halaman depan. Tulisan biasa menjadi paragraf, awali baris dengan <code># </code> untuk judul bagian dan <code>- </code> untuk butir daftar.</p>
  <label class="lbl" for="t_infoJudul">Judul informasi</label><input id="t_infoJudul" class="form-control mb-2" maxlength="60" value="${esc(t.infoJudul)}" required>
  <label class="lbl" for="t_info">Isi informasi</label><textarea id="t_info" class="form-control" rows="12" oninput="pratinjauTema()" maxlength="4000" required>${esc(t.info)}</textarea>
  <div class="rowb mt-2"><span class="small muted grow"><span id="t_infoN">0</span>/4000 karakter</span><button type="button" class="btn-o" onclick="pratinjauInfo()"><i class="bi bi-eye"></i> Lihat pratinjau</button></div></div>
  <div class="tema-grid mt-3">${w('utama', 'Warna utama (menu, judul)')}${w('aksen', 'Warna aksen (tombol, penanda)')}${w('latar', 'Warna latar halaman')}</div>
  <div class="prev mt-3" aria-label="Pratinjau"><div class="pv-top" id="pv_top"><span id="pv_logo"></span><div><b id="pv_nama"></b><small id="pv_sub"></small></div></div><div class="pv-body" id="pv_body"><span class="pv-btn" id="pv_btn">Tombol contoh</span> <span class="small" id="pv_ins"></span></div></div>
  <div id="t_pesan" class="small text-danger mt-2" role="alert"></div>
  <div class="d-flex flex-wrap gap-2 justify-content-end mt-3"><button type="button" class="btn-o" onclick="resetTemaUI()">Kembalikan bawaan</button><button class="btn-x" type="submit" id="t_simpan">Simpan tampilan</button></div></form></div>`);
  pratinjauTema();
};
function pratinjauInfo() { openModal($('t_infoJudul').value || 'Informasi', `<div class="info-isi">${infoHtml($('t_info').value)}</div>`); }
function nilaiTema() { const t = { nama: $('t_nama').value.trim(), sub: $('t_sub').value.trim(), instansi: $('t_instansi').value.trim(), infoJudul: $('t_infoJudul').value.trim(), info: $('t_info').value, utama: $('t_utama').value.toUpperCase(), aksen: $('t_aksen').value.toUpperCase(), latar: $('t_latar').value.toUpperCase() }; return t; }
function pratinjauTema() {
  if (!$('t_nama')) return; $('t_infoN').textContent = $('t_info').value.length; const t = nilaiTema(), lg = S.tpLogo !== undefined ? S.tpLogo : S.tp.logo;
  ['utama', 'aksen', 'latar'].forEach(k => $('h_' + k).textContent = t[k]);
  $('pv_top').style.background = t.utama; $('pv_body').style.background = t.latar; $('pv_btn').style.background = t.aksen; $('pv_body').style.color = lumHex(t.latar) > .5 ? '#0F172A' : '#fff';
  $('pv_nama').textContent = t.nama || '(nama)'; $('pv_sub').textContent = t.sub; $('pv_ins').textContent = t.instansi;
  $('pv_logo').innerHTML = lg ? `<img src="${esc(lg)}" alt="">` : ''; $('t_logobox').innerHTML = lg ? `<img src="${esc(lg)}" alt="Logo">` : '<i class="bi bi-image muted fs-3"></i>';
  const p = []; if (kontrasHex(t.utama, '#FFFFFF') < 7) p.push('Warna utama terlalu terang untuk tulisan putih.'); if (kontrasHex(t.aksen, '#FFFFFF') < 3) p.push('Warna aksen terlalu terang untuk tulisan putih.'); if (lumHex(t.latar) < .8) p.push('Warna latar harus terang agar tulisan gelap terbaca.');
  $('t_pesan').textContent = p.join(' '); $('t_simpan').disabled = p.length > 0 || t.nama.length < 2;
}
async function pilihLogo(inp) {
  const f = inp.files[0]; if (!f) return;
  try {
    if (!/^image\/(png|jpeg)$/.test(f.type)) throw new Error('Logo harus berformat PNG atau JPEG.');
    let u = '', ukuran = 192;
    for (; ukuran >= 64; ukuran -= 32) { u = await olahGambar(f, ukuran, ukuran, 'fit', 'image/png'); if (u.length <= 42000) break; }
    if (u.length > 42000) for (ukuran = 192; ukuran >= 64; ukuran -= 32) { u = await olahGambar(f, ukuran, ukuran, 'fit', 'image/jpeg', 0.8); if (u.length <= 42000) break; }
    if (u.length > 42000) throw new Error('Logo terlalu rumit untuk diperkecil. Gunakan gambar yang lebih sederhana.');
    S.tpLogo = u; pratinjauTema();
  } catch (e) { toast(e.message, 'danger'); inp.value = ''; }
}
function hapusLogoUI() { S.tpLogo = ''; const i = $('t_logo'); if (i) i.value = ''; pratinjauTema(); }
async function simpanTemaUI(e) {
  e.preventDefault(); const b = $('t_simpan'), d = nilaiTema(); if (S.tpLogo !== undefined) d.logo = S.tpLogo;
  busy(b, true); const r = await call('simpanTampilan', d); busy(b, false);
  if (r) { terapkanTampilan(r.data); simpanCacheTampilan(r.data); Object.keys(PC).forEach(k => delete PC[k]); toast(r.message); MT.tampilan(); }
}
function resetTemaUI() {
  openModal('Kembalikan tampilan bawaan', `<p>Nama, logo, dan warna aplikasi dikembalikan ke bawaan untuk semua pengguna.</p><div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" onclick="resetTemaGo()">Kembalikan</button></div>`);
}
async function resetTemaGo() { const r = await call('resetTampilan'); if (r) { closeModal(); terapkanTampilan(r.data); simpanCacheTampilan(r.data); Object.keys(PC).forEach(k => delete PC[k]); toast(r.message); MT.tampilan(); } }

// ── Penugasan operator (Master Data) ──
function panelOperator() {
  const p = S.pn, tag = s => s.Email ? `<span class="badge-x ${s.Valid ? 'ok' : 'danger'}">${esc(s.Nama)}</span> <span class="muted small">${s.Jenis === 'Pengganti' ? 'pengganti sampai ' + esc(s.Sampai) : 'tetap'}${s.Valid ? '' : ' · akun tidak aktif atau bukan Operator'}</span>` : '<span class="badge-x danger">Belum ada operator</span>';
  return `<div class="card-x mt-3"><div class="d-flex flex-wrap align-items-center gap-2 mb-2"><h3 class="h6 mb-0 flex-grow-1">Penugasan operator (satu operator per ruang)</h3><button class="btn-x" onclick="formPenugasan('Tetap')">Tetapkan operator</button><button class="btn-o" onclick="formPenugasan('Pengganti')">Pengganti sementara (cuti dll.)</button></div>
  <p class="muted small">Operator hanya dapat mengisi apel ruang yang ditugaskan kepadanya. Pengganti sementara berakhir otomatis pada tanggal selesai, lalu operator tetap bertugas kembali. Super Admin selalu dapat mengisi apel.</p>
  <div class="table-wrap"><table class="table"><thead><tr><th>Ruang</th><th>Operator hari ini</th><th>Penugasan berjalan dan terjadwal</th></tr></thead><tbody>${p.ruang.map(rg => { const s = p.ringkas.find(x => x.Ruang === rg), L = p.rows.filter(x => x.Ruang === rg).sort((a, b) => a.Mulai.localeCompare(b.Mulai)); return `<tr><td class="nw"><b>${esc(rg)}</b></td><td>${tag(s)}</td><td>${L.map(x => `<div class="small">${esc(x.NamaOperator)} · ${x.Jenis} · ${esc(x.Mulai)}${x.Sampai ? ' s.d. ' + esc(x.Sampai) : ' dst.'}${x.Alasan ? ' · ' + esc(x.Alasan) : ''}${x.Jenis === 'Pengganti' ? ` <a href="javascript:void(0)" onclick="batalPenugasan('${x.ID}')">batalkan</a>` : ''}</div>`).join('') || '<span class="muted small">–</span>'}</td></tr>`; }).join('')}</tbody></table></div></div>`;
}
function formPenugasan(jenis) {
  const p = S.pn; if (!p.operators.length) return toast('Belum ada akun aktif berperan Operator. Atur peran di tab Akun & Peran.', 'warning');
  const pg = jenis === 'Pengganti';
  openModal(pg ? 'Operator pengganti sementara' : 'Tetapkan operator', `<form onsubmit="simpanPenugasanUI(event,'${jenis}')"><div class="row g-3"><div class="col-md-6"><label class="lbl" for="pr">Ruang</label><select id="pr" class="form-select">${p.ruang.map(r => `<option>${esc(r)}</option>`).join('')}</select></div><div class="col-md-6"><label class="lbl" for="po">Operator</label><select id="po" class="form-select">${p.operators.map(o => `<option value="${esc(o.Email)}">${esc(o.Nama)}</option>`).join('')}</select></div><div class="col-md-6"><label class="lbl" for="pm">Mulai tanggal</label><input id="pm" type="date" class="form-control" value="${today()}" required></div>${pg ? '<div class="col-md-6"><label class="lbl" for="ps">Sampai tanggal</label><input id="ps" type="date" class="form-control" required></div><div class="col-12"><label class="lbl" for="pa">Alasan (mis. operator tetap cuti) *</label><input id="pa" class="form-control" required></div>' : '<div class="col-12"><label class="lbl" for="pa">Keterangan (opsional)</label><input id="pa" class="form-control"></div>'}</div>${pg ? '' : '<p class="muted small mt-3 mb-0">Operator tetap sebelumnya otomatis berakhir sehari sebelum tanggal mulai.</p>'}<div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">Simpan</button></div></form>`);
}
async function simpanPenugasanUI(e, jenis) { e.preventDefault(); const r = await call('simpanPenugasan', { Jenis: jenis, Ruang: $('pr').value, Operator: $('po').value, Mulai: $('pm').value, Sampai: $('ps') ? $('ps').value : '', Alasan: $('pa').value }); if (r) { closeModal(); toast(r.message); muatTab(); muatNotif(); } }
function batalPenugasan(id) { askReason('Batalkan operator pengganti', async a => { const r = await call('batalkanPenugasan', id, a); if (r) { toast(r.message); muatTab(); } }); }

// ── Master Data: hapus unit, kolom profil ──
function unitHapus(id) { askReason('Hapus unit kerja permanen', async a => { const r = await call('hapusUnit', id, a); if (r) { toast(r.message); muatTab(); } }); }
function panelKolom() {
  const K = S.kl2.filter(k => k.Aktif === true);
  return `<div class="card-x mt-3"><div class="d-flex flex-wrap align-items-center gap-2 mb-2"><h3 class="h6 mb-0 flex-grow-1">Kolom profil yang diisi pegawai</h3><button class="btn-x" onclick="formKolom()">Atur kolom</button></div><p class="muted small">Kolom yang Anda tambahkan muncul di menu Profil Saya semua pegawai. Isian dan berkas pegawai baru berlaku setelah Anda verifikasi di Master Data ▸ Akun & Peran.</p>${K.length ? K.map(k => `<span class="badge-x ${k.Tipe === 'Berkas' ? 'wait' : 'ok'} me-1 mb-1">${esc(k.Nama)} · ${k.Tipe}${k.Wajib === true ? ' · wajib' : ''}</span>`).join('') : '<span class="muted small">Belum ada kolom. Contoh: Nomor HP (Teks), KTP (Berkas), Golongan darah (Pilihan).</span>'}</div>`;
}
const rowKol = k => `<tr><td><input class="form-control" value="${esc(k.Nama)}" data-id="${esc(k.ID || '')}" aria-label="Nama kolom"></td><td><select class="form-select" aria-label="Tipe">${['Teks', 'Angka', 'Tanggal', 'Pilihan', 'Berkas'].map(t => `<option ${k.Tipe === t ? 'selected' : ''}>${t}</option>`).join('')}</select></td><td><input class="form-control" value="${esc(k.Opsi)}" placeholder="A|B|AB|O" aria-label="Opsi pilihan"></td><td><input type="checkbox" ${k.Wajib === true ? 'checked' : ''} aria-label="Wajib"></td><td><input type="checkbox" ${k.Aktif !== false ? 'checked' : ''} aria-label="Aktif"></td></tr>`;
function formKolom() {
  openModal('Kolom profil pegawai', `<form onsubmit="simpanKolomUI(event)"><p class="muted small">Tipe Pilihan: tulis opsi dipisah tanda | (contoh A|B|AB|O). Tipe tidak dapat diubah setelah kolom berisi data; nonaktifkan lalu buat kolom baru.</p><div class="table-wrap"><table class="table"><thead><tr><th>Nama kolom</th><th>Tipe</th><th>Opsi</th><th>Wajib</th><th>Aktif</th></tr></thead><tbody id="kk">${S.kl2.map(rowKol).join('')}</tbody></table></div><button type="button" class="btn-o" onclick="$('kk').insertAdjacentHTML('beforeend', rowKol({}))">+ Tambah kolom</button><div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">Simpan</button></div></form>`);
}
async function simpanKolomUI(e) {
  e.preventDefault();
  const arr = [...$('kk').querySelectorAll('tr')].map(r => { const i = r.querySelectorAll('input'); return { ID: i[0].dataset.id || undefined, Nama: i[0].value, Tipe: r.querySelector('select').value, Opsi: i[1].value, Wajib: i[2].checked, Aktif: i[3].checked }; }).filter(k => k.Nama.trim() || k.ID);
  const r = await call('simpanKolom', arr); if (r) { closeModal(); toast(r.message); muatTab(); }
}


(window.MOD = window.MOD || []).push('Master');
