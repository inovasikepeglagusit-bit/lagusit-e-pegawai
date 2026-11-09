// ── SKP (Sasaran Kinerja Pegawai): tab di menu Penilaian Kinerja ──
const SKP_BADGE = { 'Draf': 'wait', 'Diajukan': 'wait', 'Diverifikasi': 'wait', 'Menunggu pengesahan': 'wait', 'Disahkan': 'ok', 'Ditolak': 'no', 'Dicabut': 'no', 'Dibatalkan': 'no' };
const skpNilaiAsli = RENDER.nilai;
RENDER.nilai = async () => {
  S.nt = S.nt || 'periode';
  if (S.nt === 'skp') { await skpHalaman(); return; }
  await skpNilaiAsli(); const ap = $('app-container'); if (ap) ap.insertAdjacentHTML('afterbegin', skpTab());
};
function skpTab() { return `<div class="mtabs mb-3" role="tablist" aria-label="Penilaian Kinerja">${[['periode', 'Penilaian periode', 'bi-clipboard-check'], ['skp', 'SKP', 'bi-bullseye']].map(t => `<button type="button" role="tab" class="mtab ${S.nt === t[0] ? 'on' : ''}" aria-selected="${S.nt === t[0]}" onclick="skpTabGo('${t[0]}')"><i class="bi ${t[2]}"></i> ${t[1]}</button>`).join('')}</div>`; }
function skpTabGo(t) { S.nt = t; S.skm = null; RENDER.nilai(); }
const skpTw = n => ['', 'I (Januari–Maret)', 'II (April–Juni)', 'III (Juli–September)', 'IV (Oktober–Desember)'][n];

async function skpHalaman() {
  const m = S.skm || (await call('getSkpMeta')); if (!m) return; if (m.data) S.skm = m.data; const M = S.skm;
  const f = S.skf = S.skf || { tahun: M.tahun, triwulan: M.triwulan, peran: '', status: '', cari: '' };
  const r = await call('daftarSkp', f); if (!r) return; const d = r.data;
  $('app-container').innerHTML = `${skpTab()}<div class="sk"><section class="card-x mb-3"><div class="d-flex flex-wrap align-items-center gap-2"><div class="grow"><h3 class="jd mb-1">Sasaran Kinerja Pegawai (SKP)</h3><p class="muted small mb-0">Uraian SKP diisi per jabatan oleh Super Admin. Saat ditarik per triwulan, uraian jabatan pegawai disalin otomatis. Alur: pegawai mengisi realisasi → ajukan → Pejabat Penilai memverifikasi → disahkan elektronik.${d.perluVerifikasi ? ` <b>${d.perluVerifikasi} SKP menunggu verifikasi Anda.</b>` : ''}</p></div>
  <button class="btn-x" onclick="skpTarikForm()"><i class="bi bi-download"></i> ${M.admin ? 'Tarik SKP' : 'Tarik SKP saya'}</button>${M.admin ? '<button class="btn-o" onclick="skpUraian()"><i class="bi bi-list-task"></i> Uraian per jabatan</button>' : ''}</div></section>
  <section class="card-x"><div class="row g-2 mb-3"><div class="col-6 col-md-2"><input id="skt" type="number" class="form-control" min="2020" max="2100" value="${esc(f.tahun || '')}" aria-label="Tahun" placeholder="Tahun"></div><div class="col-6 col-md-2"><select id="skw" class="form-select" aria-label="Triwulan"><option value="">Semua TW</option>${[1, 2, 3, 4].map(n => `<option value="${n}" ${Number(f.triwulan) === n ? 'selected' : ''}>Triwulan ${n}</option>`).join('')}</select></div><div class="col-6 col-md-2"><select id="skr" class="form-select" aria-label="Peran"><option value="">Semua</option><option value="saya" ${f.peran === 'saya' ? 'selected' : ''}>SKP saya</option><option value="penilai" ${f.peran === 'penilai' ? 'selected' : ''}>Saya penilai</option></select></div><div class="col-6 col-md-2"><select id="sks" class="form-select" aria-label="Status"><option value="">Semua status</option>${Object.keys(SKP_BADGE).map(s => `<option ${f.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div><div class="col-md-4"><input id="skq" class="form-control" placeholder="Cari nama, jabatan, NIP..." value="${esc(f.cari || '')}" onkeydown="if(event.key==='Enter')skpCari()" aria-label="Cari"></div></div>
  <div class="mb-2"><button class="btn-x sm" onclick="skpCari()"><i class="bi bi-funnel"></i> Terapkan</button></div>
  ${d.daftar.length ? `<div class="table-responsive"><table class="table align-middle"><thead><tr><th>Pegawai</th><th>Periode</th><th>Pejabat Penilai</th><th>Status</th><th></th></tr></thead><tbody>${d.daftar.map(x => `<tr><td><b>${esc(x.Nama)}</b><div class="muted small">${esc(x.Jabatan)}</div></td><td class="nw">TW ${x.Triwulan} · ${x.Tahun}</td><td class="small">${esc(x.PenilaiNama)}</td><td><span class="badge-x ${SKP_BADGE[x.Status] || 'wait'}">${esc(x.Status)}</span></td><td class="nw"><button class="btn-o sm" onclick="skpBuka('${x.ID}')"><i class="bi bi-folder2-open"></i> Buka</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="muted py-3 mb-0">Belum ada SKP pada filter ini.</p>'}
  ${d.total > d.daftar.length ? `<p class="muted small mt-2 mb-0">Menampilkan ${d.daftar.length} dari ${d.total}.</p>` : ''}</section></div>`;
}
function skpCari() { Object.assign(S.skf, { tahun: $('skt').value, triwulan: $('skw').value, peran: $('skr').value, status: $('sks').value, cari: $('skq').value.trim() }); skpHalaman(); }

// ── Penarikan ──
function skpTarikForm() {
  const M = S.skm, adm = M.admin;
  if (!adm && !M.punyaData) return toast('Akun Anda belum terhubung ke data pegawai.', 'warning');
  openModal('Tarik SKP', `<form onsubmit="skpTarikGo(event)"><div class="row g-3">
  <div class="col-6"><label class="lbl" for="tkt">Tahun</label><input id="tkt" type="number" class="form-control" min="2020" max="2100" required value="${M.tahun}"></div><div class="col-6"><label class="lbl" for="tkw">Triwulan</label><select id="tkw" class="form-select">${[1, 2, 3, 4].map(n => `<option value="${n}" ${M.triwulan === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
  <div class="col-12"><label class="lbl" for="tkp">Pejabat Penilai (atasan langsung) *</label><select id="tkp" class="form-select" required><option value="">— pilih —</option>${M.penilai.map(p => `<option value="${esc(p.Email)}">${esc(p.Nama)}</option>`).join('')}</select><div class="muted small">Pejabat Penilai memverifikasi dan menandatangani SKP.</div></div>
  ${adm ? `<div class="col-12"><label class="lbl">Pegawai</label><label class="d-flex gap-2"><input type="radio" name="tkm" value="semua" checked onchange="skpTarikMode()"> Semua pegawai aktif yang uraian jabatannya sudah diisi</label><label class="d-flex gap-2"><input type="radio" name="tkm" value="pilih" onchange="skpTarikMode()"> Pilih per orang</label>
  <label class="d-flex gap-2 mt-2" id="tkkw"><input type="checkbox" id="tkk"> <span>Sertakan pegawai berstatus penugasan <b>Keluar</b> (Out / BKO Keluar / Didetasir)<br><span class="muted small">Tidak dicentang: mereka dilewati pada penarikan massal. Memilih per orang tetap membuatkan SKP-nya.</span></span></label>
  <div id="tkpw" hidden style="max-height:34vh;overflow:auto" class="mt-2">${M.pegawai.map(p => `<label class="d-flex gap-2 py-1"><input type="checkbox" name="tkpg" value="${p.ID}"> <span>${esc(p.Nama)} <span class="muted small">${esc(p.Jabatan || '(jabatan kosong)')}${p.Keluar ? ' · <b>Keluar</b>' : ''}${p.Uraian ? '' : ' · uraian belum diisi'}</span></span></label>`).join('')}</div></div>` : `<div class="col-12 muted small">SKP ditarik untuk Anda sendiri sesuai jabatan Anda${M.uraianSaya ? '' : ' — <b>uraian untuk jabatan Anda belum diisi Super Admin</b>'}.</div>`}
  <div class="col-12"><button class="btn-x" id="tkb">Tarik</button></div></div></form>`);
}
function skpTarikMode() { const pilih = document.querySelector('[name=tkm]:checked').value === 'pilih'; $('tkpw').hidden = !pilih; $('tkkw').hidden = pilih; }
async function skpTarikGo(e) {
  e.preventDefault(); const b = $('tkb'), M = S.skm, pilih = M.admin && document.querySelector('[name=tkm]:checked').value === 'pilih';
  const ids = pilih ? [...document.querySelectorAll('[name=tkpg]:checked')].map(x => x.value) : undefined; if (pilih && !ids.length) return toast('Pilih sedikitnya satu pegawai.', 'warning');
  busy(b, true); const r = await call('tarikSkp', { Tahun: $('tkt').value, Triwulan: $('tkw').value, Penilai: $('tkp').value, PegawaiIDs: ids, SertakanKeluar: M.admin && !pilih ? $('tkk').checked : false }); busy(b, false);
  if (!r) return; closeModal(); toast(r.message, r.data.dibuat ? 'success' : 'warning'); S.skf = Object.assign(S.skf || {}, { tahun: $('tkt') ? S.skf.tahun : S.skf.tahun });
  if (r.data.lewat.length) openModal('SKP yang dilewati', `<p class="small muted">Tidak dibuat:</p><ul class="small">${r.data.lewat.slice(0, 80).map(x => `<li><b>${esc(x.Nama)}</b> — ${esc(x.Sebab)}</li>`).join('')}</ul>`);
  skpHalaman();
}

// ── Uraian per jabatan (Super Admin) ──
async function skpUraian() {
  const r = await call('getUraianSkp'); if (!r) return; S.sku = r.data; const d = r.data;
  $('app-container').innerHTML = `${skpTab()}<section class="card-x mb-3"><div class="d-flex flex-wrap gap-2 align-items-center"><h3 class="jd mb-0 grow">Uraian SKP per jabatan</h3><button class="btn-o" onclick="skpHalaman()"><i class="bi bi-arrow-left"></i> Kembali</button><button class="btn-x" onclick="skpUraianForm()"><i class="bi bi-plus-lg"></i> Uraian jabatan</button></div><p class="muted small mt-2 mb-0">Isi manual rencana hasil kerja tiap jabatan. SKP yang sudah ditarik tidak ikut berubah bila uraian diubah.</p></section>
  <section class="card-x"><div class="table-responsive"><table class="table align-middle"><thead><tr><th>Jabatan</th><th>Pegawai</th><th>Uraian</th><th></th></tr></thead><tbody>${d.jabatan.map(j => { const u = d.uraian.find(x => x.Jabatan.toLowerCase().replace(/\s+/g, ' ') === j.Jabatan.toLowerCase().replace(/\s+/g, ' ')); return `<tr><td><b>${esc(j.Jabatan)}</b></td><td>${j.Pegawai}</td><td>${u ? `<span class="badge-x ok">${u.Isi.utama.length} utama · ${u.Isi.tambahan.length} tambahan</span>` : '<span class="badge-x no">Belum diisi</span>'}</td><td class="nw">${u ? `<button class="btn-o sm" onclick="skpUraianForm('${u.ID}')"><i class="bi bi-pencil"></i> Ubah</button><button class="btn-o sm" onclick="skpUraianHapus('${u.ID}')"><i class="bi bi-trash"></i></button>` : `<button class="btn-x sm" onclick="skpUraianForm('','${esc(j.Jabatan).replace(/'/g, '&#39;')}')"><i class="bi bi-plus"></i> Isi</button>`}</td></tr>`; }).join('') || '<tr><td colspan="4" class="muted">Belum ada data jabatan pegawai.</td></tr>'}</tbody></table></div>
  ${d.uraian.filter(u => !d.jabatan.some(j => j.Jabatan.toLowerCase().replace(/\s+/g, ' ') === u.Jabatan.toLowerCase().replace(/\s+/g, ' '))).length ? '<p class="muted small mt-2 mb-0">Ada uraian untuk jabatan yang saat ini tidak dipegang pegawai aktif; tetap tersimpan.</p>' : ''}</section>`;
}
const skpKol = [['rhkAtasan', 'RHK pimpinan yang diintervensi'], ['rhk', 'Rencana hasil kerja'], ['aspek', 'Aspek'], ['indikator', 'Indikator kinerja individu'], ['target', 'Target']];
function skpUraianForm(id, jabatan) {
  const u = id ? S.sku.uraian.find(x => x.ID === id) : null;
  S.sue = { id: id || '', jabatan: u ? u.Jabatan : (jabatan || ''), isi: u ? JSON.parse(JSON.stringify(u.Isi)) : { utama: [{ rhkAtasan: '', rhk: '', aspek: '', indikator: '', target: '' }], tambahan: [], ekspektasi: '', dukungan: '', skema: '', konsekuensi: '' } };
  $('app-container').innerHTML = `${skpTab()}<form class="card-x" onsubmit="skpUraianSimpan(event)"><div class="d-flex flex-wrap gap-2 align-items-center mb-3"><h3 class="jd mb-0 grow">${id ? 'Ubah' : 'Isi'} uraian SKP</h3><button type="button" class="btn-o" onclick="skpUraian()"><i class="bi bi-arrow-left"></i> Kembali</button></div>
  <div class="row g-3"><div class="col-12"><label class="lbl" for="ujb">Jabatan *</label><input id="ujb" class="form-control" list="ujbl" required maxlength="150" value="${esc(S.sue.jabatan)}" ${id ? 'readonly' : ''}><datalist id="ujbl">${S.sku.jabatan.filter(j => !j.Ada).map(j => `<option value="${esc(j.Jabatan)}">`).join('')}</datalist><div class="muted small">Tulis persis seperti di Data Pegawai agar pegawai berjabatan itu otomatis terhubung.</div></div>
  <div class="col-12"><div class="lbl">A. Kinerja utama</div><div id="uut"></div><button type="button" class="btn-o sm mt-1" onclick="skpUBaris('utama')"><i class="bi bi-plus"></i> Baris</button></div>
  <div class="col-12"><div class="lbl">B. Kinerja tambahan</div><div id="uta"></div><button type="button" class="btn-o sm mt-1" onclick="skpUBaris('tambahan')"><i class="bi bi-plus"></i> Baris</button></div>
  ${[['uek', 'Ekspektasi khusus pimpinan (perilaku kerja)', 'ekspektasi'], ['udu', 'Dukungan sumber daya', 'dukungan'], ['usk', 'Skema pertanggungjawaban', 'skema'], ['uko', 'Konsekuensi', 'konsekuensi']].map(x => `<div class="col-md-6"><label class="lbl" for="${x[0]}">${x[1]}</label><textarea id="${x[0]}" class="form-control" rows="3">${esc(S.sue.isi[x[2]] || '')}</textarea></div>`).join('')}
  <div class="col-12"><button class="btn-x" id="usb"><i class="bi bi-save"></i> Simpan uraian</button></div></div></form>`;
  skpURender();
}
function skpURender() { ['utama', 'tambahan'].forEach(k => { $(k === 'utama' ? 'uut' : 'uta').innerHTML = S.sue.isi[k].map((r, i) => `<div class="card-x mb-2"><div class="row g-2">${skpKol.map(c => `<div class="${c[0] === 'target' || c[0] === 'aspek' ? 'col-md-6' : 'col-12'}"><label class="lbl small">${c[1]}</label><textarea class="form-control form-control-sm" rows="${c[0] === 'aspek' || c[0] === 'target' ? 1 : 2}" maxlength="600" oninput="S.sue.isi['${k}'][${i}]['${c[0]}']=this.value">${esc(r[c[0]] || '')}</textarea></div>`).join('')}</div><button type="button" class="btn-o sm mt-2" onclick="skpUHapus('${k}',${i})"><i class="bi bi-x"></i> Hapus baris</button></div>`).join('') || '<div class="muted small">Belum ada baris.</div>'; }); }
function skpUKumpul() { const v = id => $(id).value; Object.assign(S.sue.isi, { ekspektasi: v('uek'), dukungan: v('udu'), skema: v('usk'), konsekuensi: v('uko') }); S.sue.jabatan = v('ujb'); }
function skpUBaris(k) { skpUKumpul(); S.sue.isi[k].push({ rhkAtasan: '', rhk: '', aspek: '', indikator: '', target: '' }); skpURender(); }
function skpUHapus(k, i) { skpUKumpul(); S.sue.isi[k].splice(i, 1); skpURender(); }
async function skpUraianSimpan(e) { e.preventDefault(); skpUKumpul(); const b = $('usb'); busy(b, true); const r = await call('simpanUraianSkp', { ID: S.sue.id || undefined, Jabatan: S.sue.jabatan, Isi: S.sue.isi }); busy(b, false); if (r) { toast(r.message); S.skm = null; skpUraian(); } }
function skpUraianHapus(id) { askReason('Hapus uraian SKP', async a => { const r = await call('hapusUraianSkp', id); if (r) { toast(r.message); skpUraian(); } }); }

// ── Detail SKP ──
async function skpBuka(id) {
  const r = await call('getSkp', id); if (!r) return; const x = S.sk = r.data, I = x.Isi, H = I.hasil || {};
  const tabel = (k, jud) => I[k].length ? `<div class="lbl mt-3">${jud}</div><div class="table-responsive"><table class="table table-sm align-top"><thead><tr><th>No</th><th>RHK pimpinan yang diintervensi</th><th>Rencana hasil kerja</th><th>Aspek</th><th>Indikator kinerja individu</th><th>Target</th><th style="min-width:220px">Realisasi (berdasarkan bukti dukung)</th></tr></thead><tbody>${I[k].map((r, i) => `<tr><td>${i + 1}</td><td class="small">${esc(r.rhkAtasan)}</td><td class="small">${esc(r.rhk)}</td><td class="small">${esc(r.aspek)}</td><td class="small">${esc(r.indikator)}</td><td class="small">${esc(r.target)}</td><td>${x.bolehIsi ? `<textarea class="form-control form-control-sm skr" data-k="${k}" data-i="${i}" rows="2" maxlength="500" placeholder="mis. 78% berdasarkan Buku Laporan Jaga">${esc(r.realisasi || '')}</textarea>` : `<span class="small">${esc(r.realisasi || '—')}</span>`}</td></tr>`).join('')}</tbody></table></div>` : '';
  const sel = (id, L, v) => `<select id="${id}" class="form-select"><option value="">— pilih —</option>${L.map(o => `<option ${v === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
  const btn = [];
  if (x.bolehIsi) btn.push('<button class="btn-x" onclick="skpSimpan()"><i class="bi bi-save"></i> Simpan</button>');
  if (x.bolehAjukan) btn.push('<button class="btn-o" onclick="skpAjukan()"><i class="bi bi-send"></i> Ajukan ke Pejabat Penilai</button>');
  if (x.bolehHasil) btn.push('<button class="btn-x" onclick="skpVerifikasi()"><i class="bi bi-check2-square"></i> Verifikasi</button>');
  if (x.bolehKembalikan) btn.push('<button class="btn-o" onclick="skpKembalikan()"><i class="bi bi-arrow-counterclockwise"></i> Kembalikan</button>');
  if (x.bolehTte) btn.push('<button class="btn-x" onclick="skpTte()"><i class="bi bi-patch-check"></i> Ajukan pengesahan elektronik</button>');
  btn.push('<button class="btn-o" onclick="skpCetak()"><i class="bi bi-printer"></i> Cetak</button>'); if (x.TteStatus === 'Disahkan' || x.Status === 'Disahkan') btn.push(`<button class="btn-o" onclick="tteCetak('${x.TteID}')"><i class="bi bi-patch-check"></i> Cetak versi sah</button>`);
  if (x.bolehHapus) btn.push('<button class="btn-o" onclick="skpHapus()"><i class="bi bi-trash"></i> Hapus</button>');
  $('app-container').innerHTML = `${skpTab()}<section class="card-x mb-3"><div class="d-flex flex-wrap gap-2 align-items-center"><div class="grow"><h3 class="jd mb-1">SKP Triwulan ${x.Triwulan} · ${x.Tahun}</h3><div class="small"><b>${esc(x.Pegawai.Nama)}</b> · ${esc(x.Pegawai.Jabatan)} <span class="badge-x ${SKP_BADGE[x.Status] || 'wait'}">${esc(x.Status)}</span></div><div class="muted small">Pejabat Penilai: ${esc(x.PenilaiNama)}</div></div><button class="btn-o" onclick="skpHalaman()"><i class="bi bi-arrow-left"></i> Kembali</button></div>
  ${I.dikembalikan && x.Dasar === 'Draf' ? `<div class="alert alert-warning mt-3 mb-0 small"><b>Dikembalikan oleh ${esc(I.dikembalikan.oleh)}:</b> ${esc(I.dikembalikan.catatan)}</div>` : ''}</section>
  <section class="card-x mb-3">${tabel('utama', 'A. Kinerja utama')}${tabel('tambahan', 'B. Kinerja tambahan')}
  <div class="lbl mt-3">Perilaku kerja</div><div class="small">${x.perilaku.map(p => `<span class="badge-x wait me-1 mb-1">${esc(p)}</span>`).join('')}</div>${I.ekspektasi ? `<div class="small mt-2"><b>Ekspektasi khusus pimpinan:</b><br>${esc(I.ekspektasi).replace(/\n/g, '<br>')}</div>` : ''}
  <div class="lbl mt-3" >Umpan balik triwulan</div>${x.bolehIsi ? `<textarea id="skub" class="form-control" rows="3" maxlength="1500">${esc(I.umpanBalik || '')}</textarea>` : `<div class="small">${esc(I.umpanBalik || '—').replace(/\n/g, '<br>')}</div>`}</section>
  <section class="card-x mb-3"><div class="lbl">Hasil evaluasi</div>${x.bolehHasil ? `<div class="row g-3"><div class="col-md-4"><label class="lbl small" for="skh1">Rating hasil kerja</label>${sel('skh1', x.rating, H.ratingHasil)}</div><div class="col-md-4"><label class="lbl small" for="skh2">Rating perilaku kerja</label>${sel('skh2', x.rating, H.ratingPerilaku)}</div><div class="col-md-4"><label class="lbl small" for="skh3">Predikat kinerja</label>${sel('skh3', x.predikat, H.predikat)}</div><div class="col-md-6"><label class="lbl small" for="skh4">Capaian kinerja organisasi</label><input id="skh4" class="form-control" maxlength="100" value="${esc(H.capaianOrganisasi || '')}"></div><div class="col-md-6"><label class="lbl small" for="skh5">Pola distribusi</label><input id="skh5" class="form-control" maxlength="100" value="${esc(H.pola || '')}"></div><div class="col-12"><label class="lbl small" for="skh6">Catatan / rekomendasi</label><textarea id="skh6" class="form-control" rows="3" maxlength="1500">${esc(H.catatan || '')}</textarea></div></div>` : (H.predikat ? `<table class="table table-sm"><tbody><tr><td>Rating hasil kerja</td><td>${esc(H.ratingHasil)}</td></tr><tr><td>Rating perilaku kerja</td><td>${esc(H.ratingPerilaku)}</td></tr><tr><td>Predikat kinerja</td><td><b>${esc(H.predikat)}</b></td></tr>${H.capaianOrganisasi ? `<tr><td>Capaian kinerja organisasi</td><td>${esc(H.capaianOrganisasi)}</td></tr>` : ''}${H.pola ? `<tr><td>Pola distribusi</td><td>${esc(H.pola)}</td></tr>` : ''}${H.catatan ? `<tr><td>Catatan / rekomendasi</td><td>${esc(H.catatan)}</td></tr>` : ''}</tbody></table>` : '<div class="muted small">Belum diverifikasi Pejabat Penilai.</div>')}</section>
  <div class="d-flex flex-wrap gap-2">${btn.join('')}</div>`;
}
function skpIsian() { return { utama: [...document.querySelectorAll('.skr[data-k=utama]')].map(t => ({ realisasi: t.value })), tambahan: [...document.querySelectorAll('.skr[data-k=tambahan]')].map(t => ({ realisasi: t.value })), umpanBalik: $('skub') ? $('skub').value : undefined }; }
async function skpSimpan(diam) { const r = await call('isiSkp', S.sk.ID, skpIsian(), S.sk.UpdatedAt); if (r) { if (!diam) { toast(r.message); await skpBuka(S.sk.ID); } return true; } return false; }
async function skpAjukan() { if (S.sk.bolehIsi && !(await skpSimpan(true))) return; const r = await call('ajukanSkp', S.sk.ID); if (r) { toast(r.message); skpBuka(S.sk.ID); } }
async function skpVerifikasi() {
  if (S.sk.bolehIsi && !(await skpSimpan(true))) return; const v = id => $(id).value;
  const r = await call('verifikasiSkp', S.sk.ID, { ratingHasil: v('skh1'), ratingPerilaku: v('skh2'), predikat: v('skh3'), capaianOrganisasi: v('skh4'), pola: v('skh5'), catatan: v('skh6') }); if (r) { toast(r.message); skpBuka(S.sk.ID); }
}
function skpKembalikan() { askReason('Kembalikan SKP ke pegawai', async a => { const r = await call('kembalikanSkp', S.sk.ID, a); if (r) { toast(r.message); skpBuka(S.sk.ID); } }); }
function skpHapus() { askReason('Hapus SKP', async a => { const r = await call('hapusSkp', S.sk.ID); if (r) { toast(r.message); skpHalaman(); } }); }

// ── Cetak & pengesahan ──
const skpH = (s) => esc(s || '').replace(/\n/g, '<br>');
function skpDokumen(x, c) {
  const I = x.Isi, H = I.hasil || {}, P = x.Pegawai, J = x.PenilaiData, L = 'class="l" style="text-align:left;vertical-align:top"';
  const rowsK = (k) => I[k].length ? I[k].map((r, i) => `<tr><td>${i + 1}</td><td ${L}>${skpH(r.rhkAtasan)}</td><td ${L}>${skpH(r.rhk)}</td><td ${L}>${skpH(r.aspek)}</td><td ${L}>${skpH(r.indikator)}</td><td ${L}>${skpH(r.target)}</td></tr>`).join('') : '<tr><td colspan="6">—</td></tr>';
  const rek = (k) => I[k].map((r, i) => `<tr><td>${i + 1}</td><td ${L}>${skpH(r.rhk)}</td><td ${L}>${skpH(r.indikator)}</td><td ${L}>${skpH(r.target)}</td><td ${L}>${skpH(r.realisasi)}</td></tr>`).join('');
  const orang = (a) => `<table style="width:100%;font-size:10.5px"><tbody>${[['Nama', a.Nama], ['NIP', a.NIP], ['Pangkat/Gol. Ruang', a.Pangkat], ['Jabatan', a.Jabatan], ['Unit Kerja', a.Unit || (TP.instansi || '')]].map(r => `<tr><td class="l" style="width:34%;text-align:left">${r[0]}</td><td class="l" style="text-align:left">${esc(r[1] || '')}</td></tr>`).join('')}</tbody></table>`;
  return `<h2>SASARAN KINERJA PEGAWAI<br>PERIODE PENILAIAN: TRIWULAN ${x.Triwulan} TAHUN ${x.Tahun}</h2>
  <table style="margin-bottom:8px"><thead><tr><th style="width:50%">PEGAWAI YANG DINILAI</th><th>PEJABAT PENILAI KINERJA</th></tr></thead><tbody><tr><td>${orang(P)}</td><td>${orang(J)}</td></tr></tbody></table>
  <table><thead><tr><th colspan="6" class="l" style="text-align:left">HASIL KERJA</th></tr><tr><th style="width:4%">No</th><th>Rencana Hasil Kerja Pimpinan yang Diintervensi</th><th>Rencana Hasil Kerja</th><th>Aspek</th><th>Indikator Kinerja Individu</th><th>Target</th></tr></thead><tbody><tr><td colspan="6" class="g">A. Kinerja Utama</td></tr>${rowsK('utama')}<tr><td colspan="6" class="g">B. Kinerja Tambahan</td></tr>${rowsK('tambahan')}</tbody></table>
  <table style="margin-top:8px"><thead><tr><th colspan="2" class="l" style="text-align:left">PERILAKU KERJA</th></tr></thead><tbody>${x.perilaku.map(p => `<tr><td ${L} style="width:30%"><b>${esc(p)}</b></td><td ${L}></td></tr>`).join('')}<tr><td ${L}><b>Ekspektasi Khusus Pimpinan</b></td><td ${L}>${skpH(I.ekspektasi)}</td></tr></tbody></table>
  ${I.dukungan || I.skema || I.konsekuensi ? `<table style="margin-top:8px"><tbody>${[['Dukungan Sumber Daya', I.dukungan], ['Skema Pertanggungjawaban', I.skema], ['Konsekuensi', I.konsekuensi]].filter(r => r[1]).map(r => `<tr><td ${L} style="width:30%"><b>${r[0]}</b></td><td ${L}>${skpH(r[1])}</td></tr>`).join('')}</tbody></table>` : ''}
  <div style="page-break-before:always"></div><h2>REKAMAN UMPAN BALIK BERKELANJUTAN<br>TRIWULAN ${x.Triwulan} TAHUN ${x.Tahun}</h2>
  <table><thead><tr><th style="width:4%">No</th><th>Rencana Hasil Kerja</th><th>Indikator Kinerja Individu</th><th>Target</th><th>Realisasi Berdasarkan Bukti Dukung</th></tr></thead><tbody><tr><td colspan="5" class="g">A. Kinerja Utama</td></tr>${rek('utama')}${I.tambahan.length ? `<tr><td colspan="5" class="g">B. Kinerja Tambahan</td></tr>${rek('tambahan')}` : ''}</tbody></table>
  ${I.umpanBalik ? `<p style="margin-top:6px"><b>Umpan balik:</b><br>${skpH(I.umpanBalik)}</p>` : ''}
  ${H.predikat ? `<h2 style="margin-top:14px">HASIL EVALUASI KINERJA</h2><table><tbody>${[['Rating hasil kerja', H.ratingHasil], ['Rating perilaku kerja', H.ratingPerilaku], ['Predikat kinerja', H.predikat], ['Capaian kinerja organisasi', H.capaianOrganisasi], ['Pola distribusi', H.pola], ['Catatan / rekomendasi', H.catatan]].filter(r => r[1]).map(r => `<tr><td ${L} style="width:34%"><b>${r[0]}</b></td><td ${L}>${skpH(r[1])}</td></tr>`).join('')}</tbody></table>` : ''}
  ${c.ttd}`;
}
function skpCetak() { cetakForm('SKP', 'skpCetakGo'); }
async function skpCetakGo(e) {
  e.preventDefault(); const c = cetakAmbil(); if (!c) return; const x = S.sk;
  if (c.tte) return toast('Pengesahan elektronik SKP diajukan lewat tombol “Ajukan pengesahan elektronik” setelah diverifikasi.', 'warning');
  closeModal(); cetakBuka('SKP ' + x.Pegawai.Nama + ' TW' + x.Triwulan + ' ' + x.Tahun, skpDokumen(x, c), false);
}
async function skpTte() {
  const x = S.sk; if (!(await skpSimpan(true))) return; const r2 = await call('getSkp', x.ID); if (!r2) return; S.sk = r2.data;
  await cetakAtauTte({ tte: x.Penilai, ttd: '' }, 'SKP ' + x.Pegawai.Nama + ' TW' + x.Triwulan + ' ' + x.Tahun, 'SKP', false, skpDokumen(S.sk, { ttd: '' }), { Nomor: '', Ref: 'skp:' + x.ID, sesudah: async t => { await call('kaitkanTteSkp', x.ID, t.ID); } });
}
(window.MOD = window.MOD || []).push('Skp');
