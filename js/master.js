/** Master Data & Pengaturan: satu pusat untuk semua persetujuan dan pengaturan Super Admin (tab). */
const ROLE_X = ['Super Admin', 'Operator', 'Atasan', 'Pimpinan'];
const MTABS = [
  ['persetujuan', 'Persetujuan', 'bi-patch-check'], ['akun', 'Akun & Peran', 'bi-people'], ['unit', 'Unit & Regu', 'bi-diagram-3'], ['giliran', 'Giliran Jaga', 'bi-arrow-repeat'], ['jabatan', 'Jabatan', 'bi-award'], ['operator', 'Operator', 'bi-person-gear'],
  ['profil', 'Profil & Kolom', 'bi-ui-checks'], ['kehadiran', 'Kehadiran', 'bi-calendar-x'], ['aturan', 'Aturan', 'bi-sliders'], ['tampilan', 'Tampilan', 'bi-palette'], ['kop', 'Kop Surat', 'bi-card-heading'], ['layanan', 'Layanan Surat', 'bi-file-earmark-text']
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
const COCOK_LABEL = { cocok: ['ok', 'Cocok dengan data pegawai'], nama_beda: ['wait', 'Nama berbeda'], email_beda: ['wait', 'Email berbeda'], ragu: ['wait', 'Perlu dicek: data tanpa NIP'], baru: ['off', 'Pegawai baru'], bentrok: ['bad', 'Bentrok data'] };
function cocokHtml(a) {
  const c = a.cocok; if (!c) return ''; const l = COCOK_LABEL[c.status] || ['off', c.status], p = c.pegawai;
  const info = p ? `<div class="small mt-1">Data pegawai: <b>${esc(p.Nama)}</b> · NIP ${esc(p.NIP) || '–'}${p.Unit ? ' · ' + esc(p.Unit) : ''}${p.Jabatan ? ' · ' + esc(p.Jabatan) : ''}${p.Email ? ' · ' + esc(p.Email) : ' · belum ada email'}</div>` : '';
  let aksi = '';
  if (c.status === 'nama_beda' || c.status === 'email_beda') aksi = `<label class="chk small mt-1"><input type="checkbox" id="kf-${a.ID}"> ${c.status === 'nama_beda' ? 'Saya sudah memeriksa: ini orang yang sama' : 'Ganti email di data pegawai dengan email pendaftar'}</label>`;
  else if (c.status === 'ragu') aksi = `<div class="small mt-1">${c.kandidat.map(k => `<label class="chk d-block"><input type="radio" name="kd-${a.ID}" value="${k.ID}"> Gabungkan dengan <b>${esc(k.Nama)}</b>${k.Unit ? ' · ' + esc(k.Unit) : ''}${k.Jabatan ? ' · ' + esc(k.Jabatan) : ''} <span class="muted">(kemiripan ${k.Skor}%)</span></label>`).join('')}<label class="chk d-block"><input type="radio" name="kd-${a.ID}" value="baru"> Bukan salah satunya: buat pegawai baru</label></div>`;
  return `<div class="cocok mt-1"><span class="badge-x ${l[0]}">${l[1]}</span> <span class="small muted">${esc(c.pesan)}</span>${info}${aksi}</div>`;
}
function akunBaruCard() {
  const M = S.akun.filter(a => a.Status === 'Menunggu');
  return `<div class="card-x mb-3"><h3 class="h6">Pendaftaran akun baru <span class="badge-x ${M.length ? 'wait' : 'off'}">${M.length}</span></h3>${M.length ? `<p class="muted small">Pendaftar dicocokkan otomatis dengan data pegawai yang sudah Anda input: <b>NIP</b> sebagai kunci, nama sebagai pemeriksa. Yang cocok langsung ditautkan tanpa data ganda dan datanya terlengkapi; yang meragukan perlu Anda putuskan.</p>` + M.map(a => `<div class="todo align-items-start"><div class="grow"><b>${esc(a.Nama)}</b><small>NIP ${esc(a.NIP) || '–'} · ${esc(a.Email)}</small>${cocokHtml(a)}</div><button class="btn-x" onclick="setujuiAkun('${a.ID}')" ${a.cocok && a.cocok.status === 'bentrok' ? 'disabled' : ''}>Setujui</button><button class="btn-o danger" onclick="tolakAkun('${a.ID}')">Tolak</button></div>`).join('') : '<p class="muted mb-0">Tidak ada pendaftaran yang menunggu.</p>'}</div>`;
}
async function setujuiAkun(id) {
  const a = S.akun.find(x => x.ID === id), c = a && a.cocok, opsi = {};
  if (c && (c.status === 'nama_beda' || c.status === 'email_beda')) { if (!$('kf-' + id).checked) { toast('Centang konfirmasi dulu setelah memeriksa data.', 'warning'); return; } opsi.Konfirmasi = true; }
  if (c && c.status === 'ragu') { const v = document.querySelector(`[name="kd-${id}"]:checked`); if (!v) { toast('Pilih data pegawai yang sama, atau buat pegawai baru.', 'warning'); return; } if (v.value === 'baru') opsi.Baru = true; else opsi.PegawaiID = v.value; }
  const r = await call('ubahAkun', id, 'setujui', [], '', opsi); if (r) { toast(r.message); muatTab(); }
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

// ── Tab Unit & Regu: unit kerja adalah sumber tunggal pilihan unit di Pegawai dan Profil; anggota unit dan regu dipilih banyak sekaligus ──
const SESI_REGU = ['Pagi', 'Siang', 'Malam'];
MT.unit = async () => {
  const [u, g, p] = await Promise.all([call('listUnit'), call('getRegu'), call('listPegawai')]); if (!u || !g || !p) return; S.un = u.data; S.rg = g.data; S.pgm = p.data.filter(x => x.Aktif === true);
  const cur = n => g.data.anggota.filter(a => a.Regu === n && !a.Sampai);
  mb(`<div class="row g-3"><div class="col-lg-5"><div class="card-x"><h3 class="h6">Unit kerja</h3>
  <form class="toolbar" onsubmit="unitUI(event)"><input id="un" class="form-control" placeholder="Nama unit kerja baru" aria-label="Nama unit kerja baru" maxlength="80" required><button class="btn-x" type="submit">Tambah</button></form>
  ${u.data.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Unit</th><th>Pegawai</th><th></th></tr></thead><tbody>${u.data.map(x => `<tr><td>${esc(x.Nama)}${x.Aktif === true ? '' : ' <span class="badge-x off">Nonaktif</span>'}</td><td>${x.Dipakai}</td><td class="text-end nw"><button class="btn-x" onclick="unitAnggota('${x.ID}')"><i class="bi bi-people"></i> Anggota</button> <button class="btn-o" onclick="unitNama('${x.ID}')">Ubah nama</button> <button class="btn-o ${x.Aktif === true ? 'danger' : ''}" onclick="unitAktif('${x.ID}',${x.Aktif === true ? 'false' : 'true'})">${x.Aktif === true ? 'Nonaktifkan' : 'Aktifkan'}</button>${x.Dipakai ? '' : ` <button class="btn-o danger" onclick="unitHapus('${x.ID}')">Hapus</button>`}</td></tr>`).join('')}</tbody></table></div>` : kosong('belum ada unit kerja.')}<p class="muted small mt-3 mb-0">Daftar ini menjadi satu-satunya pilihan unit di formulir Pegawai dan Profil. Tombol <b>Anggota</b> memilih banyak pegawai sekaligus; pegawai dari unit lain otomatis dipindahkan. Mengubah nama unit ikut memperbarui semua pegawai di unit itu.</p></div></div>
  <div class="col-lg-7"><div class="card-x"><div class="d-flex flex-wrap align-items-center gap-2 mb-2"><h3 class="h6 mb-0 grow">Regu penjagaan (Rupam) dan anggota</h3><button class="btn-o" onclick="peranKelola()">Jabatan rupam</button><button class="btn-o" onclick="reguForm('')"><i class="bi bi-plus-lg"></i> Regu baru</button></div>
  ${g.data.regu.map(r => `<div class="mb-3 ${r.Aktif ? '' : 'opacity-50'}"><div class="d-flex flex-wrap align-items-center gap-2"><b>${esc(r.Nama)}</b> <span class="muted">(${cur(r.Nama).length} anggota)</span>${r.Aktif ? '' : '<span class="badge-x off">Nonaktif</span>'}${r.Sesi.map(x => `<span class="badge-x wait">${x}</span>`).join('')}${r.Mode === 'Titipan' ? '<span class="badge-x ok" title="Petugas ikut apel Rupam yang sedang jaga menurut jadwal giliran">Ikut apel Rupam jaga</span>' : ''}<span class="ms-auto nw">${r.Aktif ? `<button class="btn-x" onclick="reguAnggota('${esc(r.Nama)}')"><i class="bi bi-person-plus"></i> Tambah anggota</button> ` : ''}${cur(r.Nama).length ? `<button class="btn-o" onclick="peranAnggota('${esc(r.Nama)}')">Jabatan &amp; urutan</button> ` : ''}<button class="btn-o" onclick="reguForm('${r.ID}')">Atur regu</button></span></div><div class="mt-1">${urutAnggota(cur(r.Nama)).map(a => `<span class="badge-x ok me-1 mb-1">${esc(a.Nama)} · ${esc(peranA(a))} <a href="javascript:void(0)" onclick="keluarUI('${a.ID}')" aria-label="Keluarkan ${esc(a.Nama)}">&times;</a></span>`).join('') || '<span class="muted">Belum ada anggota.</span>'}</div></div>`).join('')}
  <p class="muted small mb-0">Setiap regu punya sesi apel sendiri. Regu bermode <b>Ikut apel Rupam jaga</b> (mis. Rupam Blok Wanita) tidak punya apel sendiri: petugasnya otomatis masuk daftar apel Rupam yang sedang jaga pada sesi tugasnya, menurut tab Giliran Jaga. Jabatan rupam (Karupam, Wadan, P2U, Anggota, dst.) menentukan urutan daftar apel. Regu baru dapat ditambahkan kapan saja. Memindahkan pegawai ke regu lain menutup keanggotaan lama; catatan apel lama tetap menunjukkan regu lamanya. Pegawai berstatus Detaser/BKO tidak dapat dimasukkan ke regu.</p></div></div></div>`);
};

// ── Pemilih banyak pegawai (dipakai anggota unit dan anggota regu): cari, saring, centang, lalu proses sekaligus ──
const PM = { ids: new Set(), daftar: [], go: null };
const pmUnitOpsi = () => '<option value="">Semua unit</option>' + [...new Set(PM.daftar.map(d => d.Unit).filter(Boolean))].sort().map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join('') + '<option value="-">(belum diisi)</option>';
function pmHtml(aksiHtml) {
  return `<div class="pm"><div class="row g-2 mb-2"><div class="col-12 col-md-5"><input id="pmq" class="form-control" placeholder="Cari nama, NIP, atau jabatan" oninput="pmGambar()" aria-label="Cari pegawai"></div><div class="col-6 col-md-4"><select id="pmu" class="form-select" onchange="pmGambar()" aria-label="Saring unit">${pmUnitOpsi()}</select></div><div class="col-6 col-md-3"><select id="pmj" class="form-select" onchange="pmGambar()" aria-label="Saring jenis kelamin"><option value="">Semua</option><option>Laki-laki</option><option>Perempuan</option></select></div></div>
  <div class="d-flex flex-wrap align-items-center gap-2 mb-2"><button type="button" class="btn-o" onclick="pmSemua(true)">Pilih semua yang tampil</button><button type="button" class="btn-o" onclick="pmSemua(false)">Kosongkan pilihan</button><span class="muted small ms-auto" id="pmc" aria-live="polite"></span></div>
  <div id="pmL" class="pm-list" role="group" aria-label="Daftar pegawai"></div>${aksiHtml}</div>`;
}
function pmMulai(daftar, go) { PM.ids = new Set(); PM.daftar = daftar; PM.go = go; }
function pmTampil() { const q = ($('pmq') || {}).value || '', un = ($('pmu') || {}).value || '', jk = ($('pmj') || {}).value || ''; const k = q.toLowerCase();
  return PM.daftar.filter(d => (!k || [d.Nama, d.NIP, d.Jabatan].join(' ').toLowerCase().includes(k)) && (!un || (un === '-' ? !d.Unit : d.Unit === un)) && (!jk || d.JK === jk)); }
function pmGambar() {
  const L = pmTampil(); $('pmL').innerHTML = L.length ? L.map(d => `<label class="pm-i ${d.Kunci ? 'off' : ''}"><input type="checkbox" ${PM.ids.has(d.ID) ? 'checked' : ''} ${d.Kunci ? 'disabled' : ''} onchange="pmToggle('${d.ID}',this.checked)"><span class="grow"><b>${esc(d.Nama)}</b><small class="d-block muted">${esc([d.NIP, d.Jabatan, d.Unit].filter(Boolean).join(' · '))}</small></span>${d.Info ? `<span class="badge-x ${d.Kunci ? 'off' : 'wait'}">${esc(d.Info)}</span>` : ''}</label>`).join('') : '<p class="muted p-3 mb-0">Tidak ada pegawai yang cocok.</p>';
  pmHitung();
}
function pmToggle(id, on) { if (on) PM.ids.add(id); else PM.ids.delete(id); pmHitung(); }
function pmSemua(on) { if (on) pmTampil().forEach(d => { if (!d.Kunci) PM.ids.add(d.ID); }); else PM.ids.clear(); pmGambar(); }
function pmHitung() { const n = PM.ids.size, c = $('pmc'), g = $('pmGo'); if (c) c.textContent = n + ' dipilih · ' + pmTampil().length + ' tampil'; if (g) { g.disabled = !n; g.querySelector('b').textContent = n ? ' (' + n + ')' : ''; } }
async function pmEksekusi(b) { if (!PM.ids.size) return; busy(b, true); const r = await PM.go([...PM.ids]); busy(b, false); if (r) { closeModal(); toast(r.message); const g = (r.data && r.data.gagal) || []; await muatTab(); if (g.length) openModal('Sebagian dilewati', `<p>${g.length} pegawai tidak diproses:</p><ul>${g.map(x => `<li><b>${esc(x.Nama)}</b>: ${esc(x.Alasan)}</li>`).join('')}</ul><div class="text-end"><button class="btn-x" data-bs-dismiss="modal">Tutup</button></div>`); } }
const pmItem = (p, extra) => Object.assign({ ID: p.ID, Nama: p.Nama, NIP: p.NIP, Jabatan: p.Jabatan, Unit: p.Unit, JK: p.JenisKelamin }, extra || {});

// ── Anggota unit kerja ──
function unitAnggota(id, mode) {
  const x = S.un.find(u => u.ID === id); mode = mode || 'tambah'; S.unA = { id: id, mode: mode };
  const D = S.pgm.filter(p => mode === 'tambah' ? p.Unit !== x.Nama : p.Unit === x.Nama).map(p => pmItem(p, mode === 'tambah' && p.Unit ? { Info: 'dari ' + p.Unit } : p.Penugasan ? { Info: p.Penugasan } : {}));
  pmMulai(D, ids => call('aturAnggotaUnit', { Unit: x.Nama, PegawaiIDs: ids, Aksi: mode }));
  const n = S.pgm.filter(p => p.Unit === x.Nama).length;
  openModal('Anggota ' + x.Nama, `<div class="seg sm mb-2"><button type="button" class="seg-b ${mode === 'tambah' ? 'on' : ''}" onclick="unitAnggota('${id}','tambah')">Tambah anggota</button><button type="button" class="seg-b ${mode === 'keluar' ? 'on' : ''}" onclick="unitAnggota('${id}','keluar')">Anggota saat ini (${n})</button></div>
  <p class="muted small">${mode === 'tambah' ? 'Centang pegawai yang akan masuk ke unit ini, lalu tekan tombol di bawah. Pegawai yang masih berada di unit lain akan dipindahkan.' : 'Centang anggota yang akan dikeluarkan dari unit ini (unit pegawai dikosongkan).'}</p>${pmHtml(`<div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button id="pmGo" class="btn-x ${mode === 'keluar' ? 'danger' : ''}" onclick="pmEksekusi(this)" disabled>${mode === 'tambah' ? 'Tambahkan' : 'Keluarkan'}<b></b></button></div>`)}`);
  pmGambar();
}

// ── Anggota regu (banyak sekaligus) dan pengaturan regu ──
function reguAnggota(nama) {
  const aktif = {}; S.rg.anggota.filter(a => !a.Sampai).forEach(a => aktif[a.PegawaiID] = a.Regu);
  const D = S.pgm.map(p => pmItem(p, p.Penugasan ? { Kunci: true, Info: p.Penugasan + ' (tidak dapat masuk regu)' } : aktif[p.ID] === nama ? { Kunci: true, Info: 'sudah anggota' } : aktif[p.ID] ? { Info: 'pindah dari ' + aktif[p.ID] } : {}));
  S.reguT = nama; pmMulai(D, ids => call('aturAnggotaMassal', { Regu: nama, PegawaiIDs: ids, Tanggal: $('pmt').value, Peran: $('pmp').value }));
  openModal('Tambah anggota ' + nama, `<p class="muted small">Centang pegawai yang akan masuk ke ${esc(nama)}. Yang masih berada di regu lain otomatis dipindahkan mulai tanggal berlaku.</p>${pmHtml(`<div class="row g-2 align-items-end mt-2"><div class="col-6 col-md-4"><label class="lbl" for="pmt">Berlaku mulai</label><input id="pmt" type="date" class="form-control" value="${today()}" required></div><div class="col-6 col-md-3"><label class="lbl" for="pmp">Jabatan</label><select id="pmp" class="form-select">${S.rg.peran.filter(p => p.Aktif).map(p => `<option ${p.Nama === S.rg.peranBawaan ? 'selected' : ''}>${esc(p.Nama)}</option>`).join('')}</select></div><div class="col-12 col-md-5 text-end"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button id="pmGo" class="btn-x" onclick="pmEksekusi(this)" disabled>Masukkan<b></b></button></div></div>`)}`);
  pmGambar();
}
function reguForm(id) {
  const r = id ? S.rg.regu.find(x => x.ID === id) : { Nama: '', Sesi: ['Pagi', 'Siang', 'Malam'], Aktif: true, Mode: 'Regu' };
  openModal(id ? 'Atur ' + r.Nama : 'Regu baru', `<form onsubmit="reguSimpan(event,'${id}')"><div class="row g-3"><div class="col-12"><label class="lbl" for="rgN">Nama regu${id ? '' : ' *'}</label><input id="rgN" class="form-control" maxlength="40" value="${esc(r.Nama)}" ${id ? 'disabled' : 'required placeholder="Contoh: Rupam E"'}>${id ? '<small class="muted">Nama tidak dapat diubah karena dipakai pada riwayat apel dan penugasan operator.</small>' : ''}</div>
  <div class="col-12"><label class="lbl" for="rgM">Cara apel</label><select id="rgM" class="form-select"><option value="Regu" ${r.Mode !== 'Titipan' ? 'selected' : ''}>Apel sendiri (punya operator dan daftar apel sendiri)</option><option value="Titipan" ${r.Mode === 'Titipan' ? 'selected' : ''}>Ikut apel Rupam yang sedang jaga (petugas sedikit, mis. Blok Wanita)</option></select></div>
  <div class="col-12"><span class="lbl">Sesi apel</span><div class="d-flex flex-wrap gap-3">${SESI_REGU.map(s => `<label class="chk"><input type="checkbox" name="rgS" value="${s}" ${r.Sesi.includes(s) ? 'checked' : ''}> ${s}</label>`).join('')}</div><small class="muted">Hanya sesi yang dicentang yang dapat dibuka pada Apel Regu untuk regu ini.</small></div>
  ${id ? `<div class="col-12"><label class="chk"><input type="checkbox" id="rgA" ${r.Aktif ? 'checked' : ''}> Regu aktif (tampil pada Apel Regu dan penugasan operator)</label></div>` : ''}</div><div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">Simpan</button></div></form>`);
}
async function reguSimpan(e, id) {
  e.preventDefault(); const b = e.target.querySelector('[type=submit]'); busy(b, true); const d = { Nama: $('rgN').value, Mode: $('rgM').value, Sesi: [...document.querySelectorAll('[name=rgS]:checked')].map(x => x.value) }; if (id) { d.ID = id; d.Aktif = $('rgA').checked; }
  const r = await call('simpanRegu', d); busy(b, false); if (r) { closeModal(); toast(r.message); muatTab(); }
}
async function unitUI(e) { e.preventDefault(); const r = await call('simpanUnit', $('un').value); if (r) { toast(r.message); muatTab(); } }
async function unitAktif(id, aktif) { const r = await call('ubahUnit', id, { Aktif: aktif }); if (r) { toast(r.message); muatTab(); } }
function unitNama(id) {
  const x = S.un.find(u => u.ID === id);
  openModal('Ubah nama unit kerja', `<form onsubmit="unitNamaGo(event,'${id}')"><label class="lbl" for="unn">Nama unit</label><input id="unn" class="form-control" maxlength="80" value="${esc(x.Nama)}" required>${x.Dipakai ? `<p class="muted small mt-2">${x.Dipakai} pegawai di unit ini ikut diperbarui otomatis.</p>` : ''}<div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">Simpan</button></div></form>`);
}
async function unitNamaGo(e, id) { e.preventDefault(); const r = await call('ubahUnit', id, { Nama: $('unn').value }); if (r) { closeModal(); toast(r.message); muatTab(); } }
function keluarUI(id) { openModal('Keluarkan dari regu', `<form onsubmit="keluarGo(event,'${id}')"><label class="lbl" for="kt">Tidak lagi anggota mulai tanggal</label><input id="kt" type="date" class="form-control" value="${today()}" required><div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">Keluarkan</button></div></form>`); }
async function keluarGo(e, id) { e.preventDefault(); const t = $('kt').value; closeModal(); const r = await call('aturAnggota', 'keluar', { ID: id, Tanggal: t }); if (r) { toast(r.message); muatTab(); } }

// ── Tab Operator ──
MT.operator = async () => { const r = await call('getPenugasan'); if (!r) return; S.pn = r.data; mb(panelOperator()); };
// ── Tab Profil & Kolom ──
MT.profil = async () => { const r = await call('getKolom'); if (!r) return; S.kl2 = r.data; mb(panelKolom()); };

// ── Tab Kehadiran: keterangan (izin, cuti, sakit, dll.), aturan uang makan, dan skor status ──
async function simpanGeser(v) { const r = await call('simpanGeserMakan', v); if (r) { S.ket.geserMalam = Number(v); toast(r.message); } }
const makanTeks = (k, mk) => { const v = k.UangMakan || mk[k.Kategori]; return `<span class="badge-x ${v === 'Ya' ? 'ok' : 'off'}">${v === 'Ya' ? 'Dibayar' : 'Tidak dibayar'}</span>${k.UangMakan ? ' <small class="muted">khusus</small>' : ''}`; };
MT.kehadiran = async () => {
  const [r, s] = await Promise.all([call('getKeterangan'), call('getSkorHadir')]); if (!r || !s) return; S.ket = r.data; S.sk = s.data; const mk = r.data.makan;
  mb(`<div class="card-x mb-3"><div class="rowb mb-2"><h3 class="h6 mb-0 grow">Keterangan kehadiran apel</h3><button class="btn-x" onclick="formKeterangan()">Atur keterangan</button></div>
  <p class="muted small">Setiap keterangan masuk ke salah satu <b>kategori status</b> (Hadir, Terlambat, Izin, Sakit, Dinas Luar, Tidak Hadir). Keterangan muncul sebagai pilihan saat operator mengisi apel, dan terbawa ke Kehadiran Saya, laporan, dan rekap uang makan. Keterangan pada kategori Hadir/Terlambat bersifat opsional (misalnya "WFH" atau "Terlambat – izin atasan"). Keterangan bertanda "surat" dapat diajukan pegawai lewat menu Cuti &amp; Izin.</p>
  <div class="table-wrap"><table class="table"><thead><tr><th>Keterangan</th><th>Kategori status</th><th>Uang makan</th><th>Lewat surat</th><th>Status</th></tr></thead><tbody>${S.ket.daftar.map(k => `<tr><td>${k.Warna ? `<i class="sw" style="background:${esc(k.Warna)}"></i> ` : ''}${esc(k.Nama)}</td><td>${STB(k.Kategori)}</td><td>${makanTeks(k, mk)}</td><td>${k.Surat === true ? '<span class="badge-x ok">Ya</span>' : '–'}</td><td>${k.Aktif === true ? '<span class="badge-x ok">Aktif</span>' : '<span class="badge-x off">Nonaktif</span>'}</td></tr>`).join('')}</tbody></table></div>
  <h4 class="h6 mt-3">Aturan dasar uang makan per status</h4><div class="kchips">${S.ket.kategori.map(c => `<span class="kchip">${esc(c)}: <b>${mk[c] === 'Ya' ? 'dibayar' : 'tidak dibayar'}</b></span>`).join('')}</div><p class="muted small mt-2 mb-0">Keterangan dapat diatur khusus (menyimpang dari aturan statusnya). Dipakai pada laporan Rekap Uang Makan (menu Laporan).</p>
  <h4 class="h6 mt-3">Siklus uang makan rupam</h4><p class="muted small mb-2">Apel rupam tidak berubah. Khusus uang makan, siklus dihitung Siang (hari 1), Pagi (hari 2), Malam (hari 3), Off (hari 4). Pilih hari uang makan bagi apel <b>Malam</b>:</p><select id="gm" class="form-select" style="max-width:360px" onchange="simpanGeser(this.value)" aria-label="Hari uang makan apel malam"><option value="1" ${S.ket.geserMalam === 1 ? 'selected' : ''}>Hari berikutnya setelah apel (sesuai siklus)</option><option value="0" ${S.ket.geserMalam === 0 ? 'selected' : ''}>Hari yang sama dengan apel</option></select></div>
  <div class="card-x"><div class="rowb mb-2"><h3 class="h6 mb-0 grow">Skor status kehadiran</h3><button class="btn-x" onclick="formSkor()">Atur skor</button></div>
  <div class="table-wrap"><table class="table"><thead><tr><th>Status</th><th>Skor</th></tr></thead><tbody>${S.sk.status.map(x => `<tr><td>${x}</td><td>${S.sk.skor[x] === null ? 'Dikecualikan dari perhitungan' : S.sk.skor[x]}</td></tr>`).join('')}</tbody></table></div><p class="muted small mb-0">Skor dipakai pada Penilaian Kinerja (komponen Kehadiran) dan persentase di Kehadiran Saya, sama untuk apel staf dan apel penjagaan.</p></div>`);
};
const rowKet = k => { const sr = S.ket.kategoriSurat.includes(k.Kategori); return `<tr><td><input class="form-control" data-f="n" value="${esc(k.Nama)}" data-id="${esc(k.ID || '')}" maxlength="40" aria-label="Nama keterangan"></td><td><select class="form-select" data-f="k" aria-label="Kategori" onchange="ketKat(this)">${S.ket.kategori.map(c => `<option ${c === k.Kategori ? 'selected' : ''}>${c}</option>`).join('')}</select></td><td><select class="form-select" data-f="m" aria-label="Uang makan">${[['', 'Ikuti status'], ['Ya', 'Dibayar'], ['Tidak', 'Tidak dibayar']].map(o => `<option value="${o[0]}" ${o[0] === (k.UangMakan || '') ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></td><td><input type="color" data-f="w" data-kosong="${k.Warna ? '' : '1'}" value="${esc(k.Warna || '#64748B')}" onchange="this.dataset.kosong=''" aria-label="Warna" style="width:42px;height:34px;padding:2px"></td><td class="text-center"><input type="checkbox" data-f="s" ${k.Surat && sr ? 'checked' : ''} ${sr ? '' : 'disabled'} aria-label="Lewat surat"></td><td class="text-center"><input type="checkbox" data-f="a" ${k.Aktif !== false ? 'checked' : ''} aria-label="Aktif"></td></tr>`; };
function ketKat(sel) { const c = sel.closest('tr').querySelector('[data-f=s]'), ok = S.ket.kategoriSurat.includes(sel.value); c.disabled = !ok; if (!ok) c.checked = false; }
function formKeterangan() {
  const mk = S.ket.makan;
  openModal('Keterangan kehadiran apel', `<form onsubmit="simpanKetUI(event)"><p class="muted small">Kategori menentukan status pada apel dan skor kehadiran. "Uang makan" menentukan apakah keterangan itu dibayar pada rekap uang makan (Ikuti status = mengikuti aturan dasar di bawah). Centang "Surat" bila diajukan pegawai dengan lampiran (hanya untuk Izin, Sakit, Dinas Luar, Tidak Hadir). Keterangan yang sudah dipakai tidak dihapus; nonaktifkan saja.</p>
  <h4 class="h6">Aturan dasar uang makan per status</h4><div class="row g-2 mb-3">${S.ket.kategori.map(c => `<div class="col-6 col-md-4"><label class="lbl" for="mk_${c.replace(/\W/g, '')}">${c}</label><select id="mk_${c.replace(/\W/g, '')}" class="form-select" data-st="${c}"><option value="Ya" ${mk[c] === 'Ya' ? 'selected' : ''}>Dibayar</option><option value="Tidak" ${mk[c] === 'Tidak' ? 'selected' : ''}>Tidak dibayar</option></select></div>`).join('')}</div>
  <div class="table-wrap"><table class="table"><thead><tr><th>Nama</th><th>Kategori</th><th>Uang makan</th><th>Warna</th><th>Surat</th><th>Aktif</th></tr></thead><tbody id="kk2">${S.ket.daftar.map(rowKet).join('')}</tbody></table></div><button type="button" class="btn-o" onclick="$('kk2').insertAdjacentHTML('beforeend', rowKet({Nama:'',Kategori:S.ket.kategori[2],Surat:false,Aktif:true}))">+ Tambah keterangan</button><div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">Simpan</button></div></form>`);
}
async function simpanKetUI(e) {
  e.preventDefault(); const q = (r, f) => r.querySelector('[data-f=' + f + ']');
  const arr = [...$('kk2').querySelectorAll('tr')].map(r => ({ ID: q(r, 'n').dataset.id || undefined, Nama: q(r, 'n').value, Kategori: q(r, 'k').value, UangMakan: q(r, 'm').value, Warna: q(r, 'w').dataset.kosong ? '' : q(r, 'w').value, Surat: q(r, 's').checked, Aktif: q(r, 'a').checked })).filter(k => k.Nama.trim() || k.ID);
  const mk = {}; document.querySelectorAll('[data-st]').forEach(x => mk[x.dataset.st] = x.value);
  const r = await call('simpanKeterangan', arr, mk); if (r) { closeModal(); toast(r.message); muatTab(); }
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
  const [r, rp] = await Promise.all([call('getParamKgb'), call('getParamPensiun')]); if (!r || !rp) return; S.pk = r.data; S.pn = rp.data; const P = r.data, PN = rp.data;
  mb(`<div class="card-x"><div class="rowb mb-2"><h3 class="h6 mb-0 grow">Aturan jadwal KGB &amp; kenaikan pangkat</h3><button class="btn-x" onclick="formParam()">Atur parameter</button></div>
  ${P ? `<div class="table-wrap"><table class="table"><tbody><tr><td>Jarak KGB</td><td>${P.kgb_bulan} bulan</td></tr><tr><td>Peringatan KGB</td><td>${P.kgb_hari} hari sebelum jadwal</td></tr><tr><td>Jarak kenaikan pangkat</td><td>${P.pangkat_bulan} bulan</td></tr><tr><td>Peringatan kenaikan pangkat</td><td>${P.pangkat_hari} hari sebelum jadwal</td></tr></tbody></table></div>` : '<p class="muted">Parameter belum diatur, jadwal KGB &amp; pangkat belum dapat dihitung.</p>'}
  <p class="muted small mb-0">Komponen dan bobot Penilaian Kinerja diatur di menu Penilaian Kinerja karena terkait periode penilaian.</p></div>
  <div class="card-x mt-3"><div class="rowb mb-2"><h3 class="h6 mb-0 grow">Pensiun dan ulang tahun</h3><button class="btn-x" onclick="formPensiun()">Atur parameter</button></div>
  ${PN && PN.siap ? `<div class="table-wrap"><table class="table"><tbody><tr><td>Batas usia pensiun</td><td>${PN.usia} tahun (TMT pensiun: tanggal 1 bulan setelah bulan ulang tahun ke-${PN.usia})</td></tr><tr><td>Peringatan pensiun</td><td>${PN.hari} hari sebelum TMT</td></tr><tr><td>Ulang tahun di Kalender</td><td>${PN.ultah === 'ya' ? 'Ditampilkan' : 'Tidak ditampilkan'}</td></tr></tbody></table></div>` : '<p class="muted">Belum diatur: pengingat pensiun dan ulang tahun belum berjalan.</p>'}
  <p class="muted small mb-0">Dihitung dari Tanggal Lahir pada data pegawai (hasil impor CSV atau Profil). Pengingat pensiun hanya terlihat oleh Super Admin dan Pimpinan; ulang tahun menampilkan nama dan jabatan di Kalender bila diaktifkan.</p></div>`);
};
function formParam() {
  const P = S.pk || {}, f = (k, l) => `<div class="col-6"><label class="lbl" for="p_${k}">${l}</label><input id="p_${k}" type="number" min="0" step="1" class="form-control" value="${P[k] ?? ''}" required></div>`;
  openModal('Parameter KGB & Pangkat', `<form onsubmit="simpanParamUI(event)"><p class="muted">Jarak dan masa peringatan mengikuti aturan resmi instansi; periksa kembali sebelum disimpan.</p><div class="row g-3">${f('kgb_bulan', 'Jarak KGB (bulan)')}${f('kgb_hari', 'Peringatan KGB (hari sebelum jadwal)')}${f('pangkat_bulan', 'Jarak kenaikan pangkat (bulan)')}${f('pangkat_hari', 'Peringatan pangkat (hari sebelum jadwal)')}</div><div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">Simpan</button></div></form>`);
}
function formPensiun() {
  const P = S.pn || {}, v = k => P[k] == null ? '' : P[k];
  openModal('Parameter pensiun dan ulang tahun', `<form onsubmit="simpanPensiunUI(event)"><p class="muted">Batas usia pensiun mengikuti ketentuan jabatan di instansi; periksa kembali sebelum disimpan.</p><div class="row g-3"><div class="col-6"><label class="lbl" for="pn_usia">Batas usia pensiun (tahun)</label><input id="pn_usia" type="number" min="45" max="70" step="1" class="form-control" value="${v('usia')}" required></div><div class="col-6"><label class="lbl" for="pn_hari">Peringatan (hari sebelum TMT)</label><input id="pn_hari" type="number" min="0" max="1095" step="1" class="form-control" value="${v('hari')}" required></div><div class="col-12"><label class="lbl" for="pn_ultah">Tampilkan ulang tahun pegawai di Kalender</label><select id="pn_ultah" class="form-select" required><option value="">Pilih...</option><option value="ya" ${P.ultah === 'ya' ? 'selected' : ''}>Ya</option><option value="tidak" ${P.ultah === 'tidak' ? 'selected' : ''}>Tidak</option></select></div></div><div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">Simpan</button></div></form>`);
}
async function simpanPensiunUI(e) { e.preventDefault(); const r = await call('simpanParamPensiun', { pensiun_usia: $('pn_usia').value, pensiun_hari: $('pn_hari').value, ultah_tampil: $('pn_ultah').value }); if (r) { closeModal(); toast(r.message); muatTab(); } }
async function simpanParamUI(e) { e.preventDefault(); const d = {}; ['kgb_bulan', 'kgb_hari', 'pangkat_bulan', 'pangkat_hari'].forEach(k => d[k] = $('p_' + k).value); const r = await call('simpanParam', d); if (r) { closeModal(); toast(r.message); muatTab(); } }

// ── Tab Tampilan: identitas, halaman depan (landing), informasi, dashboard. Terhubung ke landing.html lewat pratinjau langsung ──
const BERG = [ // kelompok teks halaman depan: [id, judul, ikon, lembar yang dibuka di pratinjau, [[kunci, label, petunjuk, baris(0 = satu baris)]]]
  ['hero', 'Judul utama', 'bi-stars', '', [['berKicker', 'Teks kecil di atas judul', '', 0], ['berJudul', 'Judul besar', 'Tampil huruf kapital dan otomatis menyesuaikan lebar layar.', 0], ['berSub', 'Kalimat di atas judul', '', 0], ['berLead', 'Kalimat pembuka', '', 3], ['berTombol', 'Teks tombol masuk', 'Satu-satunya tombol masuk di halaman depan.', 0], ['berPilarLabel', 'Judul daftar fungsi', '', 0], ['berPilar', 'Daftar fungsi', 'Pisahkan dengan koma. Tampil sebagai label di lembar Informasi.', 0]]],
  ['info', 'Lembar Informasi', 'bi-info-circle', 'info', [['berInfoKicker', 'Teks kecil', '', 0], ['berInfoJudul', 'Judul (juga nama menu)', '', 0], ['berInfoLead', 'Kalimat pembuka', '', 3], ['berFitur', 'Kartu layanan', 'Satu baris satu kartu dengan pola Judul | Isi (maksimal 6 baris).', 6], ['berPeranJudul', 'Daftar peran: judul', '', 0], ['berPeranLead', 'Daftar peran: keterangan', '', 0], ['berPeran', 'Peran pengguna', 'Satu baris satu peran dengan pola Judul | Isi (maksimal 4 baris).', 4]]],
  ['peng', 'Lembar Pengumuman', 'bi-megaphone', 'peng', [['berPengKicker', 'Teks kecil', '', 0], ['berPengJudul', 'Judul (juga nama menu)', '', 0], ['berPengLead', 'Keterangan', '', 0]]],
  ['tutup', 'Penutup', 'bi-quote', 'info', [['berKutip', 'Kutipan di bagian bawah lembar Informasi', '', 0]]]];
const TPL_PANE = [['id', 'Identitas & warna', 'bi-palette'], ['depan', 'Halaman depan', 'bi-window-stack'], ['info', 'Informasi', 'bi-info-circle'], ['dash', 'Dashboard', 'bi-speedometer2']];
const tplBerBox = (t, B, k, l, p, r, grp, buka) => { const m = B.batas[k] || 200, v = t[k] === undefined ? '' : t[k], ro = B.usang ? ' disabled' : '', ev = `oninput="tplUbah(this)" onfocus="tplFokus('${buka}')"`;
  return `<div class="${r ? 'col-12' : 'col-md-6'} tpl-f"><div class="rowb"><label class="lbl grow" for="t_${k}">${l}</label><span class="small muted"><span id="n_${k}">${v.length}</span>/${m}</span><button type="button" class="tpl-rs" id="rs_${k}" title="Kembalikan ke teks bawaan" aria-label="Kembalikan ${esc(l)} ke teks bawaan" onclick="tplBawaan('${k}')"><i class="bi bi-arrow-counterclockwise"></i></button></div>${r ? `<textarea id="t_${k}" class="form-control" rows="${r}" maxlength="${m}" data-ber="1" ${ev}${ro}>${esc(v)}</textarea>` : `<input id="t_${k}" class="form-control" maxlength="${m}" value="${esc(v)}" data-ber="1" ${ev}${ro}>`}${p ? `<div class="small muted mt-1">${p}</div>` : ''}</div>`; };
MT.tampilan = async () => {
  const r = await call('getTampilan'); if (!r) return; S.tp = Object.assign({}, r.data); S.tpLogo = undefined;
  let B = null; try { const x = await api('getBerBawaan'); if (x && x.success) B = x.data; } catch (e) {}
  const usang = !B || S.tp.berJudul === undefined; B = Object.assign({ bawaan: {}, batas: {}, daftar: {}, pilihan: {} }, B || {}); B.usang = usang; S.berB = B;
  const t = S.tp, w = (k, l) => `<div><label class="lbl" for="t_${k}">${l}</label><div class="color-in"><input type="color" id="t_${k}" value="${t[k]}" oninput="tplUbah(this)" aria-label="${l}"><code id="h_${k}">${t[k]}</code></div></div>`;
  const tx = (k, l, m, extra = '', col = 'col-md-6') => `<div class="${col}"><label class="lbl" for="t_${k}">${l}</label><input id="t_${k}" class="form-control" maxlength="${m}" value="${esc(t[k])}" oninput="tplUbah(this)" ${extra}></div>`;
  const grup = BERG.map(([id, jd, ik, bk, fs], i) => `<details class="tpl-g" ${i === 0 ? 'open' : ''}><summary><i class="bi ${ik}"></i><span>${jd}</span><small class="muted">${fs.length} kolom</small></summary><div class="row g-3 pt-2">${fs.map(([k, l, p, rw]) => tplBerBox(t, B, k, l, p, rw, id, bk)).join('')}</div></details>`).join('');
  const dk = ['auto', 'siang', 'senja', 'malam'], dl = { auto: 'Otomatis mengikuti jam (siang, senja, malam)', siang: 'Selalu siang', senja: 'Selalu senja', malam: 'Selalu malam' };
  const peril = `<details class="tpl-g"><summary><i class="bi bi-sliders"></i><span>Perilaku halaman depan</span></summary><div class="row g-3 pt-2"><div class="col-md-6"><label class="lbl" for="t_berTema">Tema awal pengunjung</label><select id="t_berTema" class="form-select" onchange="tplUbah(this)" onfocus="tplFokus('')" ${usang ? 'disabled' : ''}>${dk.map(x => `<option value="${x}" ${(t.berTema || 'auto') === x ? 'selected' : ''}>${dl[x]}</option>`).join('')}</select><div class="small muted mt-1">Pengunjung tetap dapat mengganti lewat tombol di pojok kanan atas.</div></div>
    <div class="col-md-6"><span class="lbl">Notifikasi pengumuman</span><label class="chk"><input type="checkbox" id="t_berNotif" onchange="tplUbah(this)" ${t.berNotif === 'tidak' ? '' : 'checked'} ${usang ? 'disabled' : ''}> Munculkan otomatis saat ada pengumuman baru</label></div>
    <div class="col-12 small muted">Pengumuman yang tampil dipilih di menu <a href="javascript:void(0)" onclick="bukaMenu('kalender')">Kalender &amp; Pengumuman</a> dengan mencentang <b>Tampilkan di halaman depan</b>. Pengumuman baru langsung memunculkan notifikasi dan lencana di halaman depan.</div></div></details>`;
  mb(`<div class="card-x tpl"><div class="tpl-top"><div><h3 class="h6 mb-1">Tampilan aplikasi</h3><p class="muted small mb-0">Satu tempat untuk mengatur nama, warna, halaman depan, informasi, dan dashboard. Berlaku untuk semua pengguna setelah disimpan.</p></div><div class="rowb"><a class="btn-o sm" href="landing.html" target="_blank" rel="noopener"><i class="bi bi-box-arrow-up-right"></i> Buka halaman depan</a><button type="button" class="btn-o sm" onclick="resetTemaUI()"><i class="bi bi-arrow-counterclockwise"></i> Kembalikan bawaan</button></div></div>
  ${usang ? `<div class="tpl-warn" role="alert"><i class="bi bi-exclamation-triangle-fill"></i><div><b>Server Apps Script belum diperbarui.</b> Kolom halaman depan dikunci karena server belum mengenalnya, sehingga halaman depan memakai teks bawaan. Tempel <code>Kode.gs</code>, <code>Modul_Tampilan.gs</code>, dan <code>Modul_Kalender.gs</code> terbaru, lalu <b>Terapkan &gt; Kelola deployment &gt; Edit &gt; Versi baru &gt; Terapkan</b>, kemudian muat ulang halaman ini.</div></div>` : ''}
  <div class="seg" role="tablist" aria-label="Bagian pengaturan tampilan">${TPL_PANE.map(([k, l, ik]) => `<button type="button" role="tab" class="seg-b" data-p="${k}" aria-selected="false" onclick="tplPane('${k}')"><i class="bi ${ik}"></i> ${l}</button>`).join('')}</div>
  <form onsubmit="simpanTemaUI(event)" id="tpl_form"><div class="tpl-grid" id="tpl_grid"><div class="tpl-form">
   <section class="tpl-pane" id="tp_id"><div class="row g-3">${tx('nama', 'Nama aplikasi', 40, 'required')}${tx('sub', 'Subjudul', 60)}${tx('instansi', 'Nama instansi', 60)}<div class="col-md-6"><span class="lbl">Logo</span><div class="rowb"><div class="logo-box" id="t_logobox"></div><div class="grow"><input id="t_logo" type="file" accept="image/png,image/jpeg" class="form-control" onchange="pilihLogo(this)" aria-label="Pilih logo"><div class="small muted mt-1">PNG atau JPEG, otomatis diperkecil. <a href="javascript:void(0)" onclick="hapusLogoUI()">Hapus logo</a></div></div></div></div></div>
   <div class="tema-grid mt-3">${w('utama', 'Warna utama (menu samping, banner)')}${w('primer', 'Warna sorotan (menu aktif, tombol, grafik)')}${w('aksen', 'Warna aksen (tombol masuk di halaman depan, penanda)')}${w('latar', 'Warna latar halaman')}</div>
   <div class="prev mt-3" aria-label="Pratinjau warna"><div class="pv-top" id="pv_top"><span id="pv_logo"></span><div><b id="pv_nama"></b><small id="pv_sub"></small></div></div><div class="pv-body" id="pv_body"><span class="pv-btn" id="pv_btn">Tombol contoh</span> <span class="small" id="pv_ins"></span></div></div></section>
   <section class="tpl-pane" id="tp_depan" hidden><p class="muted small">Teks yang dilihat siapa saja sebelum masuk. Nama aplikasi, logo, nama instansi, dan warna aksen dari tab <b>Identitas &amp; warna</b> ikut dipakai. Kolom yang dikosongkan kembali ke teks bawaan. Pratinjau di samping berubah saat Anda mengetik, tetapi baru berlaku untuk pengunjung setelah <b>Simpan</b>.</p>${grup}${peril}</section>
   <section class="tpl-pane" id="tp_info" hidden><p class="muted small mb-2">Isi lembar <b>Informasi</b> di halaman depan (di bawah kartu layanan) dan tombol Informasi di dashboard. Tulisan biasa menjadi paragraf, awali baris dengan <code># </code> untuk judul bagian dan <code>- </code> untuk butir daftar.</p>
   <label class="lbl" for="t_infoJudul">Judul informasi</label><input id="t_infoJudul" class="form-control mb-2" maxlength="60" value="${esc(t.infoJudul)}" oninput="tplUbah(this)" onfocus="tplFokus('info')" required>
   <label class="lbl" for="t_info">Isi informasi</label><textarea id="t_info" class="form-control" rows="14" oninput="tplUbah(this)" onfocus="tplFokus('info')" maxlength="4000" required>${esc(t.info)}</textarea><div class="rowb mt-2"><span class="small muted grow"><span id="t_infoN">0</span>/4000 karakter</span><button type="button" class="btn-o sm" onclick="pratinjauInfo()"><i class="bi bi-eye"></i> Lihat tampilan teks</button></div></section>
   <section class="tpl-pane" id="tp_dash" hidden><p class="muted small">Teks dan gambar banner pada dashboard setelah masuk.</p><div class="row g-3">${tx('slogan', 'Judul banner dashboard', 70, 'required')}${tx('heroPoin', 'Kata kunci banner (pisahkan dengan koma)', 80, 'required')}${tx('motto', 'Kutipan di kartu jam dan menu samping', 140, 'required', 'col-12')}</div>
   <div class="mt-3"><label class="chk"><input type="checkbox" id="t_animasi" onchange="tplUbah(this)" ${t.animasi === 'tidak' ? '' : 'checked'}> Tampilkan animasi loading maskot saat pindah menu <span class="muted small">(hanya muncul bila pemuatan agak lama)</span></label><div><button type="button" class="btn-o sm" onclick="LOAD.contoh()">Lihat contoh animasi</button></div></div>
   <h4 class="h6 mt-4 mb-1">Gambar dashboard</h4><p class="muted small">Banner dan kartu Informasi pada dashboard. Gambar diperkecil otomatis agar ringan di HP dan langsung berlaku setelah disimpan.</p>
   <div class="gbr">${gbrKartu('hero', 'Banner dashboard', 'Gambar lanjut (landscape), perbandingan sekitar 2:1. Bagian kiri tertutup tulisan, jadi letakkan objek utama (mis. gedung) di sisi kanan.')}${gbrKartu('info', 'Kartu Informasi', 'Perbandingan sekitar 16:9. Judul informasi tampil di bagian bawah gambar.')}</div></section>
  </div>
  <aside class="tpl-prev" id="tpl_prev"><details id="tpl_det"><summary><i class="bi bi-eye"></i> Pratinjau langsung halaman depan</summary><div class="tpl-pt"><div class="seg sm" role="group" aria-label="Ukuran pratinjau"><button type="button" class="seg-b on" data-d="pc" onclick="tplUkuran('pc')">Komputer</button><button type="button" class="seg-b" data-d="hp" onclick="tplUkuran('hp')">HP</button></div><select id="tpl_pt" class="form-select form-select-sm" aria-label="Tema pratinjau" onchange="tplKirim()"><option value="">Tema: ikut pengaturan</option><option value="day">Siang</option><option value="dusk">Senja</option><option value="night">Malam</option></select></div><div class="tpl-fr pc" id="tpl_fr"><iframe id="tpl_if" title="Pratinjau halaman depan" loading="lazy"></iframe></div><p class="small muted mt-2 mb-0">Ketuk kolom di kiri untuk melihat bagian terkait.</p></details></aside></div>
  <div id="t_pesan" class="small text-danger mt-2" role="alert"></div>
  <div class="tpl-bar"><span class="tpl-st" id="tpl_st"><i></i><span>Belum ada perubahan</span></span><div class="rowb"><button type="button" class="btn-o" id="tpl_batal" onclick="MT.tampilan()" disabled>Batalkan</button><button class="btn-x" type="submit" id="t_simpan">Simpan tampilan</button></div></div></form></div>`);
  S.gbrBaru = {}; ['hero', 'info'].forEach(gbrIsi); S.tplAwal = JSON.stringify(nilaiTema()); S.tplPane = null;
  const det = $('tpl_det'); det.open = innerWidth >= 992; det.addEventListener('toggle', () => { if (det.open) { tplMuat(); tplSkala(); } }); tplSkala();
  tplPane(S.tplLast || 'id'); tplUbah(null);
};
function tplPane(k) {
  S.tplLast = k; TPL_PANE.forEach(([p]) => { const e = $('tp_' + p); if (e) e.hidden = p !== k; });
  document.querySelectorAll('.seg-b[data-p]').forEach(b => { const on = b.dataset.p === k; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  const g = $('tpl_grid'); if (g) g.classList.toggle('nop', k === 'dash'); tplMuat(); tplSkala(); tplFokus(k === 'info' ? 'info' : '');
}
function tplMuat() { const f = $('tpl_if'), d = $('tpl_det'); if (!f || !d.open || S.tplLast === 'dash' || f.dataset.on) return; f.dataset.on = '1'; f.src = 'landing.html?pratinjau=1'; }
function tplUkuran(d) { const f = $('tpl_fr'); f.className = 'tpl-fr ' + d; document.querySelectorAll('.seg-b[data-d]').forEach(b => b.classList.toggle('on', b.dataset.d === d)); tplSkala(); }
function tplSkala() { // iframe digambar pada ukuran sebenarnya (komputer 1280x800, HP 390x844) lalu diperkecil agar tata letak sama dengan aslinya
  const f = $('tpl_fr'), i = $('tpl_if'); if (!f || !i) return; const hp = f.classList.contains('hp'), [w, h] = hp ? [390, 844] : [1280, 800], k = f.clientWidth / w;
  i.style.width = w + 'px'; i.style.height = h + 'px'; i.style.transform = 'scale(' + k + ')'; f.style.height = Math.round(h * k) + 'px'; }
addEventListener('resize', () => { if ($('tpl_fr')) tplSkala(); });
function tplFokus(bk) { S.tplBuka = bk; tplKirim(); }
let tplTm = 0;
function tplKirim() {
  clearTimeout(tplTm); tplTm = setTimeout(() => {
    const f = $('tpl_if'); if (!f || !f.dataset.on || !f.contentWindow || !S.tplSiap) return; const t = nilaiTema(), pt = $('tpl_pt').value, dk = { auto: 'auto', siang: 'day', senja: 'dusk', malam: 'night' };
    t.logo = S.tpLogo !== undefined ? S.tpLogo : S.tp.logo; Object.keys(t).forEach(k => { if (/^ber/.test(k) && !/^ber(Tema|Notif)$/.test(k) && S.berB.usang) delete t[k]; });
    f.contentWindow.postMessage({ lagusit: 'pratinjau', tampilan: t, tema: pt || dk[t.berTema || 'auto'] || 'auto', buka: S.tplBuka || '' }, location.origin);
  }, 220);
}
addEventListener('message', e => { if (e.origin === location.origin && e.data && e.data.lagusit === 'pratinjau-siap') { S.tplSiap = true; tplKirim(); } });
function tplBawaan(k) { const e = $('t_' + k); if (!e || !S.berB.bawaan[k]) return; e.value = S.berB.bawaan[k]; tplUbah(e); e.focus(); }
function tplUbah(el) {
  if (!$('t_nama')) return; const t = nilaiTema(), B = S.berB;
  if ($('t_info')) $('t_infoN').textContent = $('t_info').value.length;
  if (el && el.dataset && el.dataset.ber) { const n = $('n_' + el.id.slice(2)); if (n) n.textContent = el.value.length; }
  BER.forEach(([k]) => { const rs = $('rs_' + k); if (rs) { rs.disabled = B.usang || !B.bawaan[k] || $('t_' + k).value.trim() === B.bawaan[k]; $('t_' + k).classList.toggle('tpl-ubah', !!B.bawaan[k] && $('t_' + k).value.trim() !== B.bawaan[k]); } });
  const kotor = JSON.stringify(t) !== S.tplAwal || S.tpLogo !== undefined, st = $('tpl_st'); S.tplKotor = kotor; pratinjauTema();
  st.classList.toggle('kotor', kotor); st.lastElementChild.textContent = kotor ? 'Ada perubahan yang belum disimpan' : 'Belum ada perubahan'; $('tpl_batal').disabled = !kotor;
  tplKirim();
}
const BER = BERG.flatMap(g => g[4].map(f => [f[0]]));
const gbrKartu = (k, judul, petunjuk) => `<div class="gbr-k"><h4>${judul}</h4><div class="gbr-pv ${k === 'info' ? 'info' : ''}"><img alt="Pratinjau ${judul}" id="gi_${k}"><span class="bd" id="gb_${k}"></span></div><div class="small muted">${petunjuk}</div><input id="gf_${k}" type="file" accept="image/png,image/jpeg" class="form-control" onchange="pilihGambar('${k}',this)" aria-label="Pilih gambar untuk ${judul}"><div class="gbr-ac"><button type="button" class="btn-x" id="gs_${k}" onclick="simpanGambar('${k}')" disabled>Simpan gambar</button><button type="button" class="btn-o" id="gh_${k}" onclick="hapusGambarUI('${k}')">Kembalikan bawaan</button></div></div>`;
async function gbrIsi(k) { // pratinjau gambar yang sedang dipakai dan status tombolnya
  const im = $('gi_' + k); if (!im) return; const kustom = !!TP[GBR[k].kv];
  $('gb_' + k).textContent = kustom ? 'Gambar kustom' : 'Gambar bawaan'; $('gh_' + k).disabled = !kustom; $('gs_' + k).disabled = true; if ($('gf_' + k)) $('gf_' + k).value = '';
  im.src = gbrCache(k) || await gbrMuat(k);
}
async function pilihGambar(k, inp) {
  const f = inp.files[0]; if (!f) return;
  try {
    if (!/^image\/(png|jpeg)$/.test(f.type)) throw new Error('Gambar harus berformat PNG atau JPEG.');
    const dim = k === 'hero' ? [[1100, 480], [960, 419], [800, 349]] : [[640, 360], [512, 288], [400, 225]]; let u = '';
    for (const [w, h] of dim) { for (const q of [.82, .72, .62, .5]) { u = await olahGambar(f, w, h, 'cover', 'image/jpeg', q); if ((u.length - 23) * .75 <= 580 * 1024) break; } if ((u.length - 23) * .75 <= 580 * 1024) break; }
    if ((u.length - 23) * .75 > 580 * 1024) throw new Error('Gambar terlalu rumit untuk diperkecil. Gunakan gambar lain.');
    S.gbrBaru[k] = u; $('gi_' + k).src = u; $('gb_' + k).textContent = 'Belum disimpan · ' + Math.round((u.length - 23) * .75 / 1024) + ' KB'; $('gs_' + k).disabled = false;
  } catch (e) { toast(e.message, 'danger'); inp.value = ''; }
}
async function simpanGambar(k) {
  const u = S.gbrBaru && S.gbrBaru[k]; if (!u) return; const b = $('gs_' + k); busy(b, true); const r = await call('simpanAset', k, u); busy(b, false);
  if (r) { terapkanTampilan(r.data); simpanCacheTampilan(r.data); const o = { v: r.data[GBR[k].kv], url: u }; GBRM[k] = o; try { localStorage.setItem('gbr_' + k, JSON.stringify(o)); } catch (e) {} delete S.gbrBaru[k]; Object.keys(PC).forEach(x => delete PC[x]); toast(r.message); gbrIsi(k); }
}
function hapusGambarUI(k) { openModal('Kembalikan gambar bawaan', `<p>Gambar kustom dihapus dan dashboard memakai gambar bawaan lagi untuk semua pengguna.</p><div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" onclick="hapusGambarGo('${k}')">Kembalikan</button></div>`); }
async function hapusGambarGo(k) { const r = await call('hapusAset', k); if (r) { closeModal(); terapkanTampilan(r.data); simpanCacheTampilan(r.data); delete GBRM[k]; try { localStorage.removeItem('gbr_' + k); } catch (e) {} Object.keys(PC).forEach(x => delete PC[x]); toast(r.message); gbrIsi(k); } }
function pratinjauInfo() { openModal($('t_infoJudul').value || 'Informasi', `<div class="info-isi">${infoHtml($('t_info').value)}</div>`); }
function nilaiTema() {
  const v = k => { const e = $('t_' + k); return e ? e.value : undefined; }, t = { nama: v('nama').trim(), sub: v('sub').trim(), instansi: v('instansi').trim(), animasi: $('t_animasi').checked ? 'ya' : 'tidak', infoJudul: v('infoJudul').trim(), info: v('info'), slogan: v('slogan').trim(), heroPoin: v('heroPoin').trim(), motto: v('motto').trim(), utama: v('utama').toUpperCase(), primer: v('primer').toUpperCase(), aksen: v('aksen').toUpperCase(), latar: v('latar').toUpperCase() };
  BER.forEach(([k]) => { t[k] = v(k); }); if ($('t_berTema')) { t.berTema = v('berTema'); t.berNotif = $('t_berNotif').checked ? 'ya' : 'tidak'; } return t;
}
function pratinjauTema() {
  if (!$('t_nama')) return; const t = nilaiTema(), lg = S.tpLogo !== undefined ? S.tpLogo : S.tp.logo;
  ['utama', 'primer', 'aksen', 'latar'].forEach(k => $('h_' + k).textContent = t[k]);
  $('pv_top').style.background = t.utama; $('pv_body').style.background = t.latar; $('pv_btn').style.background = t.primer; $('pv_body').style.color = lumHex(t.latar) > .5 ? '#0F172A' : '#fff';
  $('pv_nama').textContent = t.nama || '(nama)'; $('pv_sub').textContent = t.sub; $('pv_ins').textContent = t.instansi;
  $('pv_logo').innerHTML = lg ? `<img src="${esc(lg)}" alt="">` : ''; $('t_logobox').innerHTML = lg ? `<img src="${esc(lg)}" alt="Logo">` : '<i class="bi bi-image muted fs-3"></i>';
  const p = []; if (kontrasHex(t.utama, '#FFFFFF') < 7) p.push('Warna utama terlalu terang untuk tulisan putih.'); if (kontrasHex(t.primer, '#FFFFFF') < 4.5) p.push('Warna sorotan terlalu terang untuk tulisan putih.'); if (kontrasHex(t.aksen, '#FFFFFF') < 3) p.push('Warna aksen terlalu terang untuk tulisan putih.'); if (lumHex(t.latar) < .8) p.push('Warna latar harus terang agar tulisan gelap terbaca.');
  if (t.nama.length < 2 || t.slogan.length < 2 || t.heroPoin.length < 2 || t.motto.length < 2) p.push('Nama aplikasi, judul banner, kata kunci banner, dan kutipan wajib diisi.');
  $('t_pesan').textContent = p.join(' '); $('t_simpan').disabled = p.length > 0 || !S.tplKotor;
}
async function pilihLogo(inp) {
  const f = inp.files[0]; if (!f) return;
  try {
    if (!/^image\/(png|jpeg)$/.test(f.type)) throw new Error('Logo harus berformat PNG atau JPEG.');
    let u = '', ukuran = 192;
    for (; ukuran >= 64; ukuran -= 32) { u = await olahGambar(f, ukuran, ukuran, 'fit', 'image/png'); if (u.length <= 42000) break; }
    if (u.length > 42000) for (ukuran = 192; ukuran >= 64; ukuran -= 32) { u = await olahGambar(f, ukuran, ukuran, 'fit', 'image/jpeg', 0.8); if (u.length <= 42000) break; }
    if (u.length > 42000) throw new Error('Logo terlalu rumit untuk diperkecil. Gunakan gambar yang lebih sederhana.');
    S.tpLogo = u; tplUbah(null);
  } catch (e) { toast(e.message, 'danger'); inp.value = ''; }
}
function hapusLogoUI() { S.tpLogo = ''; const i = $('t_logo'); if (i) i.value = ''; tplUbah(null); }
async function simpanTemaUI(e) {
  e.preventDefault(); const b = $('t_simpan'), d = nilaiTema(); if (S.tpLogo !== undefined) d.logo = S.tpLogo; if (S.berB && S.berB.usang) Object.keys(d).forEach(k => { if (/^ber/.test(k)) delete d[k]; });
  busy(b, true); const r = await call('simpanTampilan', d); busy(b, false);
  if (r) { terapkanTampilan(r.data); simpanCacheTampilan(r.data); Object.keys(PC).forEach(k => delete PC[k]); toast(r.message); MT.tampilan(); }
}
function resetTemaUI() {
  openModal('Kembalikan tampilan bawaan', `<p>Nama, logo, warna, teks banner, informasi, dan gambar dashboard dikembalikan ke bawaan untuk semua pengguna.</p><div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" onclick="resetTemaGo()">Kembalikan</button></div>`);
}
async function resetTemaGo() { const r = await call('resetTampilan'); if (r) { closeModal(); Object.keys(GBRM).forEach(x => delete GBRM[x]); terapkanTampilan(r.data); simpanCacheTampilan(r.data); Object.keys(PC).forEach(k => delete PC[k]); toast(r.message); MT.tampilan(); } }

// ── Penugasan operator (Master Data) ──
function panelOperator() {
  const p = S.pn, tag = s => s.Email ? `<span class="badge-x ${s.Valid ? 'ok' : 'danger'}">${esc(s.Nama)}</span> <span class="muted small">${s.Jenis === 'Pengganti' ? 'pengganti sampai ' + esc(s.Sampai) : 'tetap'}${s.Valid ? '' : ' · akun tidak aktif atau bukan Operator'}</span>` : '<span class="badge-x danger">Belum ada operator</span>';
  return `<div class="card-x mt-3"><div class="d-flex flex-wrap align-items-center gap-2 mb-2"><h3 class="h6 mb-0 flex-grow-1">Penugasan operator</h3><button class="btn-x" onclick="formPenugasan('Tetap')">Tetapkan operator</button><button class="btn-o" onclick="formPenugasan('Tambahan')"><i class="bi bi-person-plus"></i> Tambah operator</button><button class="btn-o" onclick="formPenugasan('Pengganti')">Pengganti sementara (cuti dll.)</button></div>
  <p class="muted small">Operator hanya dapat mengisi apel ruang yang ditugaskan kepadanya. Tiap ruang punya satu operator tetap (atau pengganti sementara yang berakhir otomatis), ditambah <b>operator tambahan</b> sebanyak yang diperlukan; operator tambahan bekerja sejajar dan dapat dicabut kapan saja. Super Admin selalu dapat mengisi apel.</p>
  <div class="table-wrap"><table class="table"><thead><tr><th>Ruang</th><th>Operator hari ini</th><th>Penugasan berjalan dan terjadwal</th></tr></thead><tbody>${p.ruang.map(rg => { const s = p.ringkas.find(x => x.Ruang === rg), L = p.rows.filter(x => x.Ruang === rg).sort((a, b) => a.Mulai.localeCompare(b.Mulai)); return `<tr><td class="nw"><b>${esc(rg)}</b></td><td>${tag(s)}${(s.Tambahan || []).map(n => `<div class="mt-1"><span class="badge-x ok">${esc(n)}</span> <span class="muted small">tambahan</span></div>`).join('')}</td><td>${L.map(x => `<div class="small">${esc(x.NamaOperator)} · ${x.Jenis} · ${esc(x.Mulai)}${x.Sampai ? ' s.d. ' + esc(x.Sampai) : ' dst.'}${x.Alasan ? ' · ' + esc(x.Alasan) : ''}${x.Jenis !== 'Tetap' ? ` <a href="javascript:void(0)" onclick="batalPenugasan('${x.ID}','${x.Jenis}')">${x.Jenis === 'Tambahan' ? 'cabut' : 'batalkan'}</a>` : ''}</div>`).join('') || '<span class="muted small">–</span>'}</td></tr>`; }).join('')}</tbody></table></div></div>`;
}
function formPenugasan(jenis) {
  const p = S.pn; if (!p.operators.length) return toast('Belum ada akun aktif berperan Operator. Atur peran di tab Akun & Peran.', 'warning');
  const pg = jenis === 'Pengganti', tb = jenis === 'Tambahan';
  openModal(pg ? 'Operator pengganti sementara' : tb ? 'Tambah operator' : 'Tetapkan operator', `<form onsubmit="simpanPenugasanUI(event,'${jenis}')"><div class="row g-3"><div class="col-md-6"><label class="lbl" for="pr">Ruang</label><select id="pr" class="form-select">${p.ruang.map(r => `<option>${esc(r)}</option>`).join('')}</select></div><div class="col-md-6"><label class="lbl" for="po">Operator</label><select id="po" class="form-select">${p.operators.map(o => `<option value="${esc(o.Email)}">${esc(o.Nama)}</option>`).join('')}</select></div><div class="col-md-6"><label class="lbl" for="pm">Mulai tanggal</label><input id="pm" type="date" class="form-control" value="${today()}" required></div>${pg ? '<div class="col-md-6"><label class="lbl" for="ps">Sampai tanggal</label><input id="ps" type="date" class="form-control" required></div><div class="col-12"><label class="lbl" for="pa">Alasan (mis. operator tetap cuti) *</label><input id="pa" class="form-control" required></div>' : (tb ? '<div class="col-md-6"><label class="lbl" for="ps">Sampai tanggal (kosongkan bila tidak dibatasi)</label><input id="ps" type="date" class="form-control"></div>' : '') + '<div class="col-12"><label class="lbl" for="pa">Keterangan (opsional)</label><input id="pa" class="form-control"></div>'}</div>${pg ? '' : tb ? '<p class="muted small mt-3 mb-0">Operator tambahan bekerja bersama operator tetap pada ruang yang sama; tidak menggantikan siapa pun.</p>' : '<p class="muted small mt-3 mb-0">Operator tetap sebelumnya otomatis berakhir sehari sebelum tanggal mulai.</p>'}<div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">Simpan</button></div></form>`);
}
async function simpanPenugasanUI(e, jenis) { e.preventDefault(); const r = await call('simpanPenugasan', { Jenis: jenis, Ruang: $('pr').value, Operator: $('po').value, Mulai: $('pm').value, Sampai: $('ps') ? $('ps').value : '', Alasan: $('pa').value }); if (r) { closeModal(); toast(r.message); muatTab(); muatNotif(); } }
function batalPenugasan(id, jenis) { askReason(jenis === 'Tambahan' ? 'Cabut operator tambahan' : 'Batalkan operator pengganti', async a => { const r = await call('batalkanPenugasan', id, a); if (r) { toast(r.message); muatTab(); } }); }

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

// ── Tab Jabatan: jenis jabatan (eselon, JFT, JFU), nama jabatan, dan penetapan per pegawai ──
MT.jabatan = async () => { const r = await call('getJabatan'); if (!r) return; S.jb = r.data; S.jbp = {}; S.jbq = S.jbq || ''; S.jbf = S.jbf || 'belum'; mb(panelJabatan()); jbGambarPeg(); };
const jbRum = k => (S.jb.rumpun.find(x => x.Kode === k) || {}).Nama || k;
const jbOptJenis = (cur, kosong) => (kosong ? `<option value="">${kosong}</option>` : '<option value="">Pilih jenis...</option>') + S.jb.jenis.filter(j => j.Aktif || j.ID === cur).map(j => `<option value="${j.ID}" ${j.ID === cur ? 'selected' : ''}>${esc(j.Nama)}${j.Aktif ? '' : ' (nonaktif)'}</option>`).join('');
const jbBarisJenis = j => `<tr><td><input class="form-control" data-f="nama" data-id="${esc(j.ID || '')}" value="${esc(j.Nama || '')}" maxlength="60" aria-label="Nama jenis jabatan"></td><td><select class="form-select" data-f="rumpun" onchange="jbRumpun(this)" aria-label="Rumpun">${S.jb.rumpun.map(r => `<option value="${r.Kode}" ${(j.Rumpun || 'Struktural') === r.Kode ? 'selected' : ''}>${esc(r.Nama)}</option>`).join('')}</select></td><td style="width:92px"><input type="number" min="1" max="20" class="form-control" data-f="tingkat" value="${esc(j.Tingkat === undefined ? '' : j.Tingkat)}" ${(j.Rumpun || 'Struktural') === 'Struktural' ? '' : 'disabled'} aria-label="Tingkat eselon"></td><td><input class="form-control" data-f="ket" value="${esc(j.Keterangan || '')}" maxlength="100" placeholder="Opsional, misalnya Pimpinan" aria-label="Keterangan"></td><td class="text-center"><input type="checkbox" data-f="aktif" ${j.Aktif !== false ? 'checked' : ''} aria-label="Aktif"></td><td class="nw">${j.ID ? (j.Jumlah || 0) + ' pegawai' : '–'}${j.Dipakai && j.Dipakai.length ? `<small class="d-block muted">dipakai: ${esc(j.Dipakai.join(', '))}</small>` : ''}</td></tr>`;
const jbBarisNama = d => `<tr><td><input class="form-control" data-f="nama" data-id="${esc(d.ID || '')}" value="${esc(d.Nama || '')}" maxlength="120" aria-label="Nama jabatan"></td><td style="width:150px"><select class="form-select" data-f="cocok" aria-label="Cara mencocokkan">${S.jb.cocok.map(c => `<option ${(d.Cocok || 'Persis') === c ? 'selected' : ''}>${c}</option>`).join('')}</select></td><td><select class="form-select" data-f="jenis" aria-label="Jenis jabatan">${jbOptJenis(d.JenisID)}</select></td><td class="text-center"><input type="checkbox" data-f="aktif" ${d.Aktif !== false ? 'checked' : ''} aria-label="Aktif"></td><td class="nw">${d.ID ? (d.Jumlah || 0) + ' pegawai' : '–'}</td></tr>`;
function jbRumpun(el) { const t = el.closest('tr').querySelector('[data-f=tingkat]'); t.disabled = el.value !== 'Struktural'; if (t.disabled) t.value = ''; else if (!t.value) t.value = 1; }
function panelJabatan() {
  const b = S.jb;
  return `<div class="card-x mb-3"><div class="rowb mb-2"><h3 class="h6 mb-0 grow">1. Jenis jabatan</h3></div>
  <p class="muted small">Jenis jabatan dipakai untuk menentukan siapa yang boleh menjadi pembina, komandan, dan petugas apel lainnya. Bawaan: Eselon I sampai V, Jabatan Fungsional Tertentu (JFT), dan Jabatan Fungsional Umum (JFU). Anda dapat menambah jenis lain (misalnya <i>Eselon VI</i> dengan tingkat 6, atau <i>Pelaksana</i>) dan mengubah namanya. Tingkat eselon: Eselon I = 1, II = 2, dan seterusnya; dipakai untuk mengurutkan.</p>
  <div class="table-wrap"><table class="table"><thead><tr><th>Nama jenis jabatan</th><th>Rumpun</th><th>Tingkat</th><th>Keterangan</th><th>Aktif</th><th>Pegawai</th></tr></thead><tbody id="jbJ">${b.jenis.map(jbBarisJenis).join('')}</tbody></table></div>
  <div class="d-flex flex-wrap gap-2"><button type="button" class="btn-o" onclick="$('jbJ').insertAdjacentHTML('beforeend', jbBarisJenis({}))">+ Tambah jenis jabatan</button><button type="button" class="btn-x" onclick="jbSimpanJenis(this)">Simpan jenis jabatan</button></div>
  <p class="muted small mt-2 mb-0">Simpan jenis lebih dulu sebelum memakainya pada daftar nama jabatan di bawah.</p></div>
  <div class="card-x mb-3"><div class="rowb mb-2"><h3 class="h6 mb-0 grow">2. Nama jabatan → jenis jabatan</h3></div>
  <p class="muted small">Pegawai otomatis mengikuti kolom <b>Jabatan</b> di data pegawainya. <b>Persis</b>: nama harus sama. <b>Diawali</b>: berlaku untuk semua jabatan yang diawali tulisan itu, misalnya "Kepala Seksi" → semua "Kepala Seksi …". <b>Mengandung</b>: berlaku bila tulisan ada di mana saja, misalnya "Pembimbing Kemasyarakatan". Bila beberapa aturan cocok, yang paling spesifik dipakai.</p>
  <div class="table-wrap"><table class="table"><thead><tr><th>Nama jabatan</th><th>Pencocokan</th><th>Jenis jabatan</th><th>Aktif</th><th>Pegawai</th></tr></thead><tbody id="jbD">${b.daftar.map(jbBarisNama).join('')}</tbody></table></div>
  ${b.belum.length ? `<div class="mb-2"><div class="lbl">Jabatan pada data pegawai yang belum terpetakan (${b.belum.reduce((n, x) => n + x.Jumlah, 0)} pegawai) — klik untuk menambahkan ke daftar:</div><div class="kchips">${b.belum.map((x, i) => `<button type="button" class="kchip" onclick="jbTambahNama(${i})">${esc(x.Jabatan)} <b>${x.Jumlah}</b></button>`).join('')}</div></div>` : '<p class="muted small">Semua jabatan pada data pegawai sudah terpetakan atau kosong.</p>'}
  <div class="d-flex flex-wrap gap-2"><button type="button" class="btn-o" onclick="$('jbD').insertAdjacentHTML('beforeend', jbBarisNama({}))">+ Tambah nama jabatan</button><button type="button" class="btn-x" onclick="jbSimpanNama(this)">Simpan nama jabatan</button></div></div>
  <div class="card-x"><div class="rowb mb-2"><h3 class="h6 mb-0 grow">3. Penetapan per pegawai</h3></div>
  <p class="muted small">Hasil pemetaan nama jabatan tampil di kolom Jenis. Untuk pengecualian, pilih jenis secara manual; penetapan manual selalu didahulukan.</p>
  <div class="toolbar"><input id="jbQ" class="form-control" placeholder="Cari nama, jabatan, unit" aria-label="Cari pegawai" value="${esc(S.jbq)}" oninput="S.jbq=this.value;jbGambarPeg()"><select id="jbF" class="form-select" aria-label="Filter" onchange="S.jbf=this.value;jbGambarPeg()">${[['belum', 'Belum punya jenis'], ['semua', 'Semua pegawai'], ['manual', 'Ditetapkan manual']].map(o => `<option value="${o[0]}" ${S.jbf === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select><button type="button" class="btn-x ms-auto" onclick="jbSimpanPeg(this)">Simpan penetapan</button></div>
  <div id="jbPeg"></div></div>`;
}
function jbGambarPeg() {
  const b = S.jb, q = S.jbq.toLowerCase(), f = S.jbf, nm = {}; b.jenis.forEach(j => nm[j.ID] = j.Nama);
  const L = b.pegawai.filter(p => (f === 'semua' || (f === 'belum' && !p.JenisID && !(p.ID in S.jbp && S.jbp[p.ID])) || (f === 'manual' && p.Manual)) && [p.Nama, p.Jabatan, p.Unit].join(' ').toLowerCase().includes(q));
  $('jbPeg').innerHTML = L.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Nama</th><th>Jabatan</th><th>Jenis saat ini</th><th>Tetapkan manual</th></tr></thead><tbody>${L.slice(0, 300).map(p => { const v = p.ID in S.jbp ? S.jbp[p.ID] : p.Manual; return `<tr><td>${esc(p.Nama)}<small class="d-block muted">${esc(p.Unit || '')}</small></td><td>${esc(p.Jabatan || '–')}</td><td>${p.JenisID ? `${esc(nm[p.JenisID] || '?')} <span class="badge-x ${p.Sumber === 'Manual' ? 'wait' : 'ok'}">${p.Sumber === 'Manual' ? 'manual' : 'dari nama'}</span>` : '<span class="badge-x off">Belum ada</span>'}</td><td style="min-width:210px"><select class="form-select form-select-sm" onchange="S.jbp['${p.ID}']=this.value" aria-label="Jenis jabatan ${esc(p.Nama)}">${jbOptJenis(v, 'Ikuti nama jabatan')}</select></td></tr>`; }).join('')}</tbody></table></div>${L.length > 300 ? `<p class="muted small">Menampilkan 300 dari ${L.length}. Persempit pencarian.</p>` : ''}` : `<p class="muted text-center py-3 mb-0">${f === 'belum' ? 'Semua pegawai sudah punya jenis jabatan.' : 'Tidak ada pegawai yang cocok.'}</p>`;
}
const jbQ = (r, f) => r.querySelector('[data-f=' + f + ']');
async function jbSimpanJenis(btn) {
  const jenis = [...$('jbJ').querySelectorAll('tr')].map(r => ({ ID: jbQ(r, 'nama').dataset.id || undefined, Nama: jbQ(r, 'nama').value, Rumpun: jbQ(r, 'rumpun').value, Tingkat: jbQ(r, 'tingkat').value, Keterangan: jbQ(r, 'ket').value, Aktif: jbQ(r, 'aktif').checked })).filter(j => j.Nama.trim() || j.ID);
  busy(btn, true); const r = await call('simpanJenisJabatan', { jenis }); busy(btn, false); if (r) { toast(r.message); MT.jabatan(); }
}
async function jbSimpanNama(btn) {
  const daftar = [...$('jbD').querySelectorAll('tr')].map(r => ({ ID: jbQ(r, 'nama').dataset.id || undefined, Nama: jbQ(r, 'nama').value, Cocok: jbQ(r, 'cocok').value, JenisID: jbQ(r, 'jenis').value, Aktif: jbQ(r, 'aktif').checked })).filter(d => d.Nama.trim() || d.ID);
  busy(btn, true); const r = await call('simpanDaftarJabatan', { daftar }); busy(btn, false); if (r) { toast(r.message); MT.jabatan(); }
}
function jbTambahNama(i) { const x = S.jb.belum[i]; $('jbD').insertAdjacentHTML('beforeend', jbBarisNama({ Nama: x.Jabatan, Cocok: 'Persis' })); const r = $('jbD').lastElementChild; r.scrollIntoView({ behavior: 'smooth', block: 'center' }); jbQ(r, 'jenis').focus(); toast('Pilih jenis jabatannya, lalu klik "Simpan nama jabatan".'); }
async function jbSimpanPeg(btn) {
  const baris = Object.keys(S.jbp).filter(id => (S.jbp[id] || '') !== ((S.jb.pegawai.find(p => p.ID === id) || {}).Manual || '')).map(id => ({ PegawaiID: id, JenisID: S.jbp[id] }));
  if (!baris.length) return toast('Tidak ada perubahan.', 'warning');
  busy(btn, true); const r = await call('petakanJabatanPegawai', { Baris: baris }); busy(btn, false); if (r) { toast(r.message); MT.jabatan(); }
}

(window.MOD = window.MOD || []).push('Master');

// ── Jabatan rupam dan urutan anggota ──
const peranA = a => a.Peran || S.rg.peranBawaan;
const urutAnggota = L => { const ix = n => { const i = S.rg.peran.findIndex(p => p.Nama === n); return i < 0 ? 999 : i; }; return L.slice().sort((a, b) => ix(peranA(a)) - ix(peranA(b)) || (Number(a.Urut) || 1e9) - (Number(b.Urut) || 1e9) || String(a.Nama).localeCompare(b.Nama)); };
function peranAnggota(regu) {
  const L = urutAnggota(S.rg.anggota.filter(a => a.Regu === regu && !a.Sampai)), P = S.rg.peran.filter(p => p.Aktif);
  openModal('Jabatan & urutan anggota ' + regu, `<p class="muted small">Daftar apel diurutkan menurut jabatan (urutan jabatan diatur lewat tombol <b>Jabatan rupam</b>), lalu nomor urut di bawah (kosong = mengikuti No. Urut DUK).</p><form onsubmit="peranSimpanAnggota(event,'${esc(regu)}')"><div class="table-wrap"><table class="table"><thead><tr><th>Anggota</th><th>Jabatan</th><th style="width:110px">No. urut</th></tr></thead><tbody>${L.map((a, i) => `<tr><td>${esc(a.Nama)}</td><td><select class="form-select" id="pa_${i}" aria-label="Jabatan ${esc(a.Nama)}">${P.map(p => `<option ${p.Nama === peranA(a) ? 'selected' : ''}>${esc(p.Nama)}</option>`).join('')}</select></td><td><input class="form-control" id="pu_${i}" type="number" min="1" max="999" value="${esc(a.Urut)}" aria-label="No. urut ${esc(a.Nama)}"></td></tr>`).join('')}</tbody></table></div><div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">Simpan</button></div></form>`);
  S.pa = L;
}
async function peranSimpanAnggota(e, regu) {
  e.preventDefault(); const b = e.target.querySelector('[type=submit]'); busy(b, true);
  const r = await call('aturPeranAnggota', { Regu: regu, Baris: S.pa.map((a, i) => ({ ID: a.ID, Peran: $('pa_' + i).value, Urut: $('pu_' + i).value })) }); busy(b, false); if (r) { closeModal(); toast(r.message); muatTab(); }
}
function peranKelola() {
  const P = S.rg.peran;
  openModal('Jabatan rupam', `<p class="muted small">Jabatan di dalam rupam. Urutan angka menentukan urutan tampil di daftar apel. Jabatan bawaan dipakai untuk anggota baru. Mengganti nama otomatis memperbarui anggota yang memegangnya.</p><div class="table-wrap"><table class="table"><thead><tr><th>Jabatan</th><th style="width:90px">Urutan</th><th>Bawaan</th><th>Aktif</th><th></th></tr></thead><tbody>${P.map((p, i) => `<tr><td><input class="form-control" id="pn_${i}" value="${esc(p.Nama)}" maxlength="30" aria-label="Nama jabatan"></td><td><input class="form-control" id="po_${i}" type="number" min="1" max="99" value="${p.Urutan}" aria-label="Urutan"></td><td><input type="radio" name="pbw" id="pb_${i}" ${p.Bawaan ? 'checked' : ''} aria-label="Jabatan bawaan"></td><td><input type="checkbox" id="pk_${i}" ${p.Aktif ? 'checked' : ''} aria-label="Aktif"></td><td><button class="btn-x" onclick="peranSimpan(${i})">Simpan</button></td></tr>`).join('')}<tr><td><input class="form-control" id="pn_n" maxlength="30" placeholder="Jabatan baru, mis. Danton" aria-label="Jabatan baru"></td><td><input class="form-control" id="po_n" type="number" min="1" max="99" value="${P.length + 1}" aria-label="Urutan jabatan baru"></td><td></td><td></td><td><button class="btn-x" onclick="peranSimpan(-1)">Tambah</button></td></tr></tbody></table></div>`);
}
async function peranSimpan(i) {
  const n = i < 0, p = n ? null : S.rg.peran[i]; const d = n ? { Nama: $('pn_n').value, Urutan: $('po_n').value } : { ID: p.ID, Nama: $('pn_' + i).value, Urutan: $('po_' + i).value, Aktif: $('pk_' + i).checked, Bawaan: $('pb_' + i).checked };
  const r = await call('simpanPeran', d); if (r) { toast(r.message); await muatTab(); peranKelola(); }
}

// ── Tab Giliran Jaga: pola giliran Rupam, giliran petugas titipan (Blok Wanita), papan bulanan dan perubahan per hari ──
const SHIFT_C = ['Pagi', 'Siang', 'Malam', 'Libur']; // HARI3 dipakai bersama dari piket.js
const baku = x => { const p = x.split('+').map(v => v.trim().toLowerCase()), ok = ['Pagi', 'Siang', 'Malam', 'Libur'].filter(k => p.includes(k.toLowerCase())); return p.length === ok.length && ok.length && (ok.length === 1 || !ok.includes('Libur')) ? ok.join('+') : x; };
const polaTeks = el => String(el.value || '').split(/[,›>\/]+/).map(x => x.trim()).filter(Boolean).map(baku);
function glOpsi(pid, terpilih) { // pilihan "langkah pola" untuk tiap Rupam/petugas, mengikuti isi kolom pola
  const el = $(pid.pola), P = polaTeks(el); return '<option value="">(belum diatur)</option>' + P.map((s, i) => `<option value="${i}" ${String(terpilih) === String(i) ? 'selected' : ''}>Langkah ${i + 1} · ${esc(s)}</option>`).join('');
}
function glRefresh(kode) { const el = $('gl_pola_' + kode); document.querySelectorAll('[data-gl="' + kode + '"]').forEach(s => { const cur = s.value; s.innerHTML = glOpsi({ pola: 'gl_pola_' + kode }, cur); }); el.setAttribute('aria-invalid', polaTeks(el).some(x => !SHIFT_C.includes(x)) ? 'true' : 'false'); }
MT.giliran = async () => {
  const bulan = S.gb || today().slice(0, 7);
  const [g, rg] = await Promise.all([call('getGiliranBulan', bulan), call('getRegu')]); if (!g || !rg) return; S.gl = g.data; S.rg = rg.data; S.gb = bulan;
  const R = rg.data.regu.filter(r => r.Aktif && r.Mode === 'Regu'), T = rg.data.regu.filter(r => r.Aktif && r.Mode === 'Titipan');
  const pola0 = r => (r && r.Pola && r.Pola.length ? r.Pola : []).join(', ');
  const cur = n => rg.data.anggota.filter(a => a.Regu === n && !a.Sampai);
  const blokR = `<div class="card-x mb-3"><h3 class="h6">Giliran Rupam</h3><p class="muted small">Isi pola yang berputar tiap hari. Satu langkah = satu hari: <code>Pagi</code>, <code>Siang</code>, <code>Malam</code>, <code>Libur</code>, atau gabungan sesi pada hari yang sama dengan tanda +, mis. <code>Pagi+Malam</code> (masuk Pagi lalu kembali Malam). Contoh 4 Rupam: <code>Siang, Pagi+Malam, Libur, Libur</code> (hari 1 Siang, hari 2 Pagi dan Malam, lalu dua hari libur). Kemudian tentukan pada tanggal mulai tiap Rupam berada di langkah yang mana (mis. A langkah 1, B langkah 2, C langkah 3, D langkah 4). Rupam yang berjaga pada suatu sesi menjadi tempat petugas titipan (mis. Blok Wanita) ikut apel.</p>
  ${R.length ? `<form onsubmit="glSimpanRegu(event)"><div class="row g-3"><div class="col-md-7"><label class="lbl" for="gl_pola_r">Pola giliran</label><input id="gl_pola_r" class="form-control" value="${esc(pola0(R.find(r => r.Pola.length)))}" placeholder="Siang, Pagi+Malam, Libur, Libur" oninput="glRefresh('r')" required><button type="button" class="btn-o mt-2" onclick="glContoh()">Isi contoh pola 4 Rupam</button></div><div class="col-md-5"><label class="lbl" for="gl_mulai_r">Tanggal mulai pola</label><input id="gl_mulai_r" type="date" class="form-control" value="${esc((R.find(r => r.PolaMulai) || {}).PolaMulai || today())}" required></div>
  ${R.map((r, i) => `<div class="col-6 col-md-3"><label class="lbl" for="gl_r${i}">${esc(r.Nama)}</label><select id="gl_r${i}" data-gl="r" class="form-select">${'<option value="">(belum diatur)</option>'}</select></div>`).join('')}</div><div class="text-end mt-3"><button class="btn-x" type="submit">Simpan giliran Rupam</button></div></form>` : '<p class="muted mb-0">Belum ada Rupam ber-apel aktif.</p>'}</div>`;
  const blokT = T.map((t, k) => `<div class="card-x mb-3"><h3 class="h6">Giliran petugas ${esc(t.Nama)}</h3><p class="muted small">Sesi yang tersedia: ${t.Sesi.join(', ')} dan Libur. Setiap petugas berputar menurut pola ini; pada sesi tugasnya, ia otomatis ikut apel Rupam yang sedang jaga pada sesi itu dan kehadirannya melekat pada Rupam tersebut. Contoh 3 petugas: <code>Pagi, Siang, Libur</code>.</p>
  ${cur(t.Nama).length ? `<form onsubmit="glSimpanTitipan(event,'${esc(t.Nama)}',${k})"><div class="row g-3"><div class="col-md-7"><label class="lbl" for="gl_pola_t${k}">Pola giliran</label><input id="gl_pola_t${k}" class="form-control" value="${esc(pola0(t))}" placeholder="Pagi, Siang, Libur" oninput="glRefresh('t${k}')" required></div><div class="col-md-5"><label class="lbl" for="gl_mulai_t${k}">Tanggal mulai pola</label><input id="gl_mulai_t${k}" type="date" class="form-control" value="${esc(t.PolaMulai || today())}" required></div>
  ${cur(t.Nama).map((a, i) => `<div class="col-6 col-md-4"><label class="lbl" for="gl_t${k}_${i}">${esc(a.Nama)}</label><select id="gl_t${k}_${i}" data-gl="t${k}" data-id="${a.PegawaiID}" class="form-select"></select></div>`).join('')}</div><div class="text-end mt-3"><button class="btn-x" type="submit">Simpan giliran petugas</button></div></form>` : `<p class="muted mb-0">Belum ada anggota. Tambahkan petugas di tab Unit &amp; Regu.</p>`}</div>`).join('');
  const d = g.data, [y, m] = bulan.split('-').map(Number), geser = o => { const x = new Date(y, m - 1 + o, 1); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0'); };
  const ada = d.hari.some(h => Object.keys(h.R).length || Object.keys(h.O).length);
  const kolR = R.map(r => r.Nama), kolO = d.orang;
  const papan = `<div class="card-x"><div class="d-flex align-items-center gap-2 mb-3"><button class="btn-o" onclick="glBulan('${geser(-1)}')" aria-label="Bulan sebelumnya"><i class="bi bi-chevron-left"></i></button><h3 class="h6 mb-0 grow text-center">Papan giliran ${NM[m - 1]} ${y}</h3><button class="btn-o" onclick="glBulan('${geser(1)}')" aria-label="Bulan berikutnya"><i class="bi bi-chevron-right"></i></button></div>
  ${ada ? `<p class="muted small">Ketuk sel untuk mengubah giliran pada hari itu (tanda * = diubah manual dari pola). Pada petugas titipan, tertulis shift dan Rupam tempat ia ikut apel.</p><div class="table-wrap"><table class="table gl-tab"><thead><tr><th>Tanggal</th>${kolR.map(n => `<th>${esc(n)}</th>`).join('')}${kolO.map(o => `<th>${esc(o.Nama)}<small class="d-block muted fw-normal">${esc(o.Regu)}</small></th>`).join('')}</tr></thead><tbody>${d.hari.map(h => { const dt = new Date(h.Tanggal + 'T00:00:00'); return `<tr class="${h.Tanggal === today() ? 'gl-now' : ''}"><td class="nw">${HARI3[dt.getDay()]} ${Number(h.Tanggal.slice(8))}</td>${kolR.map(n => `<td><button type="button" class="gl-c" onclick="glUbah('${h.Tanggal}','${esc(n)}','')">${shChip((h.R[n] || {}).S, (h.R[n] || {}).U)}</button></td>`).join('')}${kolO.map(o => { const c = h.O[o.PegawaiID]; return `<td>${c ? `<button type="button" class="gl-c" onclick="glUbah('${h.Tanggal}','${esc(o.Regu)}','${o.PegawaiID}')">${shChip(c.S, c.U)}${c.H ? `<small class="d-block muted">→ ${esc(c.H.replace(/Rupam /g, ''))}</small>` : c.S !== 'Libur' ? '<small class="d-block text-danger">belum ada Rupam</small>' : ''}</button>` : '<span class="muted">–</span>'}</td>`; }).join('')}</tr>`; }).join('')}</tbody></table></div>` : kosong('pola giliran belum diatur. Isi pola di atas, lalu papan bulanan terisi otomatis.')}</div>`;
  mb(blokR + blokT + papan);
  R.forEach((r, i) => { const s = $('gl_r' + i); if (s) s.innerHTML = glOpsi({ pola: 'gl_pola_r' }, r.PolaPosisi); });
  T.forEach((t, k) => cur(t.Nama).forEach((a, i) => { const s = $('gl_t' + k + '_' + i); if (s) s.innerHTML = glOpsi({ pola: 'gl_pola_t' + k }, a.PolaPosisi); }));
  S.glR = R; S.glT = T;
};
function glBulan(b) { S.gb = b; MT.giliran(); }
async function glSimpanRegu(e) {
  e.preventDefault(); const b = e.target.querySelector('[type=submit]'); busy(b, true); const Posisi = {}; S.glR.forEach((r, i) => Posisi[r.Nama] = $('gl_r' + i).value);
  const r = await call('simpanGiliranRegu', { Pola: polaTeks($('gl_pola_r')), Mulai: $('gl_mulai_r').value, Posisi: Posisi }); busy(b, false); if (r) { toast(r.message); MT.giliran(); }
}
async function glSimpanTitipan(e, regu, k) {
  e.preventDefault(); const b = e.target.querySelector('[type=submit]'); busy(b, true); const Posisi = {}; document.querySelectorAll('[data-gl="t' + k + '"]').forEach(s => Posisi[s.dataset.id] = s.value);
  const r = await call('simpanGiliranTitipan', { Regu: regu, Pola: polaTeks($('gl_pola_t' + k)), Mulai: $('gl_mulai_t' + k).value, Posisi: Posisi }); busy(b, false); if (r) { toast(r.message); MT.giliran(); }
}
function glUbah(tgl, regu, pid) {
  const h = S.gl.hari.find(x => x.Tanggal === tgl), c = pid ? h.O[pid] : h.R[regu], ub = c && c.U ? S.gl.ubah.find(x => x.ID === c.U) : null, nm = pid ? (S.gl.orang.find(o => o.PegawaiID === pid) || {}).Nama : regu;
  const R = S.gl.regu.find(r => r.Nama === regu), sesi = SHIFT_C.slice(0, 3).filter(s => !R || R.Sesi.includes(s)), opsi = []; for (let m = 1; m < (1 << sesi.length); m++) opsi.push(sesi.filter((_, i) => m & (1 << i)).join('+')); opsi.push('Libur');
  openModal('Ubah giliran ' + nm + ' · ' + tgl, `<form onsubmit="glUbahSimpan(event,'${tgl}','${esc(regu)}','${pid}')"><div class="row g-3"><div class="col-12"><label class="lbl" for="glS">Shift pada tanggal ini</label><select id="glS" class="form-select">${opsi.map(s => `<option value="${s}" ${c && c.S === s ? 'selected' : ''}>${s.replace(/\+/g, ' + ')}</option>`).join('')}</select></div><div class="col-12"><label class="lbl" for="glC">Catatan (opsional)</label><input id="glC" class="form-control" maxlength="100" value="${esc(ub ? ub.Catatan : '')}" placeholder="Mis. tukar jaga"></div></div><div class="d-flex flex-wrap gap-2 justify-content-end mt-3">${ub ? `<button type="button" class="btn-o" onclick="glHapus('${ub.ID}')">Kembali ke pola</button>` : ''}<button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button><button class="btn-x" type="submit">Simpan</button></div></form>`);
}
async function glUbahSimpan(e, tgl, regu, pid) { e.preventDefault(); const r = await call('ubahGiliran', { Tanggal: tgl, Regu: regu, PegawaiID: pid, Shift: $('glS').value, Catatan: $('glC').value }); if (r) { closeModal(); toast(r.message); MT.giliran(); } }
async function glHapus(id) { const r = await call('hapusUbahGiliran', id); if (r) { closeModal(); toast(r.message); MT.giliran(); } }

/** Mengisi kolom pola dengan contoh umum 4 Rupam; posisi awal tiap Rupam diisi berurutan (dapat diubah sebelum disimpan). */
function glContoh() { $('gl_pola_r').value = 'Siang, Pagi+Malam, Libur, Libur'; glRefresh('r'); [...document.querySelectorAll('[data-gl=r]')].forEach((x, i) => { if (!x.value) x.value = String(i % 4); }); }
