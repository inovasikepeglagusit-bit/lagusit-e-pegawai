// ── Penilaian Kinerja ──
const NB = s => s === 'Disahkan' ? 'ok' : s === 'Diisi' ? 'wait' : 'off';
const lihatSemua = () => isAdmin() || S.user.roles.includes('Pimpinan');
RENDER.nilai = async () => {
  const m = await call('getNilaiMeta'); if (!m) return; S.nm = m.data;
  if (!lihatSemua() && !S.user.roles.includes('Atasan')) return nilaiSaya();
  const ak = S.nm.komponen.filter(k => k.Aktif === true), P = S.nm.periode, ad = isAdmin();
  $('app-container').innerHTML = `<div class="card-x mb-3"><div class="toolbar mb-0"><div><label class="lbl" for="pp">Periode penilaian</label><select id="pp" class="form-select" onchange="loadNilai()">${P.map(x => `<option value="${x.ID}">${esc(x.Nama)} (${esc(x.Mulai)} s.d. ${esc(x.Sampai)}) · ${esc(x.Status)}</option>`).join('')}</select></div>${ad ? '<button class="btn-o align-self-end" onclick="formPeriode()">Periode baru</button><button class="btn-o align-self-end" onclick="tutupPeriode()">Buka/tutup periode</button><button class="btn-o align-self-end" onclick="formKomponen()">Atur komponen</button><button class="btn-o align-self-end" onclick="formPenilai()">Atur penilai</button>' : ''}</div>
  <div class="mt-3">${ak.length ? ak.map(k => `<span class="badge-x ${k.Jenis === 'Kehadiran' ? 'wait' : 'ok'} me-1">${esc(k.Nama)} ${k.Bobot}%${k.Jenis === 'Kehadiran' ? ' (otomatis dari apel)' : ''}</span>`).join('') : '<span class="muted">Belum ada komponen aktif' + (ad ? ': klik "Atur komponen".' : '. Hubungi Super Admin.') + '</span>'}</div></div><div id="nl"></div><div id="rk"></div>`;
  P.length ? loadNilai() : $('nl').innerHTML = `<div class="card-x">${kosong('belum ada periode penilaian.')}</div>`;
};
async function loadNilai() {
  const pid = $('pp').value, r = await call('daftarNilai', pid); if (!r) return; const lihat = lihatSemua(), ad = isAdmin();
  $('nl').innerHTML = `<div class="card-x mb-3"><h3 class="h6">Daftar penilaian</h3>${r.data.baris.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Nama</th><th>Jabatan</th><th>Hadir (apel)</th><th>Skor</th><th>Status</th><th></th></tr></thead><tbody>${r.data.baris.map(b => `<tr><td>${esc(b.Nama)}</td><td>${esc(b.Jabatan)}</td><td>${b.Hadir == null ? 'Belum tersedia' : b.Hadir + '%'}</td><td>${b.Skor == null ? '–' : b.Skor}</td><td><span class="badge-x ${NB(b.Status)}">${esc(b.Status)}</span></td><td class="nw"><button class="btn-o" onclick="formNilai('${pid}','${b.PegawaiID}')">${lihat && !ad ? 'Lihat' : 'Nilai'}</button>${lihat && b.Status === 'Diisi' ? ` <button class="btn-x" onclick="sahkanUI('${b.NilaiID}')">Sahkan</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : kosong('belum ada pegawai yang ditugaskan.')}</div>`;
  if (!lihat) return;
  const k = await call('ranking', pid); if (!k) return;
  $('rk').innerHTML = `<div class="card-x"><h3 class="h6">Peringkat pegawai teladan <span class="muted">(hanya penilaian yang sudah disahkan)</span></h3>${k.data.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Nama</th><th>Unit</th><th>Skor</th><th>Hadir</th></tr></thead><tbody>${k.data.map(x => `<tr><td>${x.Peringkat}</td><td>${esc(x.Nama)} ${x.Peringkat === 1 ? '<span class="badge-x wait">Teladan</span>' : ''}</td><td>${esc(x.Unit)}</td><td><b>${x.Skor}</b></td><td>${x.Hadir == null ? '–' : x.Hadir + '%'}</td></tr>`).join('')}</tbody></table></div>` : kosong('belum ada penilaian yang disahkan.')}</div>`;
}
async function sahkanUI(id) { const r = await call('sahkanNilai', id); if (r) { toast(r.message); loadNilai(); } }
async function formNilai(pid, pegId) {
  const r = await call('ambilNilai', pid, pegId); if (!r) return; const d = r.data; S.nf = { pid, pegId, d };
  openModal('Penilaian: ' + d.pegawai.Nama, `<form onsubmit="simpanNilaiUI(event)"><p class="muted">${esc(d.pegawai.Jabatan)} · ${esc(d.pegawai.Unit)} · Periode ${esc(d.periode.Nama)} · <span class="badge-x ${NB(d.status)}">${esc(d.status)}</span></p>
  ${d.komponen.length ? d.komponen.map(k => `<div class="mb-3"><label class="lbl" for="k_${k.ID}">${esc(k.Nama)} <span class="muted">(bobot ${k.Bobot}%)</span></label>${k.Jenis === 'Kehadiran' ? `<div id="k_${k.ID}">${k.Nilai == null ? 'Belum tersedia: belum ada apel (staf atau penjagaan) yang selesai pada periode ini.' : 'Otomatis dari apel: <b>' + k.Nilai + '</b>' + (d.hadirInfo ? ' <span class="muted small">(' + d.hadirInfo.dihitung + ' apel dihitung: staf ' + d.hadirInfo.staf + ', penjagaan ' + d.hadirInfo.regu + ')</span>' : '')}</div>` : `<input id="k_${k.ID}" data-kid="${k.ID}" type="number" min="0" max="100" step="0.01" class="form-control" value="${k.Nilai == null ? '' : k.Nilai}" oninput="hitungSkor()" ${d.ubah ? '' : 'disabled'} required>`}</div>`).join('') : '<p class="muted">Komponen penilaian belum diatur oleh Super Admin.</p>'}
  <label class="lbl" for="kc">Catatan evaluasi</label><textarea id="kc" rows="3" class="form-control mb-3" ${d.ubah ? '' : 'disabled'}>${esc(d.catatan)}</textarea>
  <div class="d-flex justify-content-between align-items-center"><b>Skor akhir: <span id="sk">–</span></b>${d.ubah && d.komponen.length ? '<button class="btn-x" type="submit">Simpan penilaian</button>' : ''}</div></form>`);
  hitungSkor();
}
function hitungSkor() {
  let s = 0, ok = true;
  S.nf.d.komponen.forEach(k => { const i = document.querySelector(`[data-kid="${k.ID}"]`), v = k.Jenis === 'Kehadiran' ? k.Nilai : parseFloat(i && i.value); if (v == null || isNaN(v)) ok = false; else s += v * k.Bobot / 100; });
  $('sk').textContent = ok && S.nf.d.komponen.length ? Math.round(s * 100) / 100 : '–';
}
function simpanNilaiUI(e) {
  e.preventDefault(); const { pid, pegId, d } = S.nf;
  const go = async al => { const nilai = {}; document.querySelectorAll('[data-kid]').forEach(i => nilai[i.dataset.kid] = i.value); const r = await call('simpanNilai', pid, pegId, { nilai, catatan: $('kc').value, alasan: al || '', UpdatedAt: d.updatedAt }); if (r) { closeModal(); toast(r.message); loadNilai(); } };
  d.status === 'Disahkan' ? askReason('Alasan koreksi penilaian yang sudah disahkan', go) : go();
}
const rowK = k => `<tr><td><input class="form-control" value="${esc(k.Nama)}" data-id="${esc(k.ID || '')}" aria-label="Nama komponen" required></td><td style="width:110px"><input type="number" min="0" max="100" step="0.01" class="form-control" value="${esc(k.Bobot)}" aria-label="Bobot" oninput="totalK()" required></td><td><select class="form-select" aria-label="Jenis"><option ${k.Jenis !== 'Kehadiran' ? 'selected' : ''}>Manual</option><option ${k.Jenis === 'Kehadiran' ? 'selected' : ''}>Kehadiran</option></select></td><td><input type="checkbox" ${k.Aktif !== false ? 'checked' : ''} aria-label="Aktif" onchange="totalK()"></td></tr>`;
const addK = () => { $('kb').insertAdjacentHTML('beforeend', rowK({})); totalK(); };
function totalK() { let t = 0; $('kb').querySelectorAll('tr').forEach(r => { const c = r.querySelectorAll('input'); if (c[2].checked) t += parseFloat(c[1].value) || 0; }); $('kt2').textContent = Math.round(t * 100) / 100; }
function formKomponen() {
  openModal('Komponen dan bobot penilaian', `<form onsubmit="simpanKomp(event)"><p class="muted">Jenis "Kehadiran" dihitung otomatis dari apel (staf dan penjagaan) yang selesai pada rentang periode, memakai skor status yang diatur Super Admin di Master Data ▸ Kehadiran. Total bobot komponen aktif harus 100.</p><div class="table-wrap"><table class="table"><thead><tr><th>Nama komponen</th><th>Bobot (%)</th><th>Jenis</th><th>Aktif</th></tr></thead><tbody id="kb">${S.nm.komponen.map(rowK).join('')}</tbody></table></div><div class="d-flex justify-content-between align-items-center mt-3"><button type="button" class="btn-o" onclick="addK()">+ Tambah komponen</button><b>Total aktif: <span id="kt2">0</span>%</b></div><div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">Simpan</button></div></form>`);
  totalK();
}
async function simpanKomp(e) {
  e.preventDefault();
  const arr = [...$('kb').querySelectorAll('tr')].map(r => { const c = r.querySelectorAll('input'); return { ID: c[0].dataset.id || undefined, Nama: c[0].value, Bobot: c[1].value, Jenis: r.querySelector('select').value, Aktif: c[2].checked }; });
  const r = await call('simpanKomponen', arr); if (r) { closeModal(); toast(r.message); RENDER.nilai(); }
}
function formPeriode() {
  openModal('Periode penilaian baru', `<form onsubmit="simpanPer(event)"><label class="lbl" for="pn">Nama periode</label><input id="pn" class="form-control mb-3" placeholder="Contoh: Triwulan IV 2026" required><div class="row g-3"><div class="col-6"><label class="lbl" for="pm">Mulai</label><input id="pm" type="date" class="form-control" required></div><div class="col-6"><label class="lbl" for="ps">Sampai</label><input id="ps" type="date" class="form-control" required></div></div><div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">Simpan</button></div></form>`);
}
async function simpanPer(e) { e.preventDefault(); const r = await call('simpanPeriode', { Nama: $('pn').value, Mulai: $('pm').value, Sampai: $('ps').value }); if (r) { closeModal(); toast(r.message); RENDER.nilai(); } }
async function tutupPeriode() { const p = S.nm.periode.find(x => x.ID === $('pp').value); if (!p) return toast('Pilih periode terlebih dahulu.', 'warning'); const r = await call('simpanPeriode', { ID: p.ID, Status: p.Status === 'Terbuka' ? 'Ditutup' : 'Terbuka' }); if (r) { toast('Status periode diubah.'); RENDER.nilai(); } }
function formPenilai() {
  const pid = $('pp').value; if (!pid) return toast('Buat periode terlebih dahulu.', 'warning');
  if (!S.nm.atasan.length) return toast('Belum ada akun aktif berperan Atasan. Atur peran di Master Data ▸ Akun & Peran.', 'warning');
  openModal('Atur penilai', `<form onsubmit="simpanPenilai(event,'${pid}')"><label class="lbl" for="pe">Atasan / pejabat penilai</label><select id="pe" class="form-select mb-3" onchange="isiPenilai('${pid}')">${S.nm.atasan.map(a => `<option value="${esc(a.Email)}">${esc(a.Nama)} (${esc(a.Email)})</option>`).join('')}</select><label class="lbl" for="pg">Pegawai yang dinilai (tahan Ctrl untuk memilih banyak)</label><select id="pg" multiple size="10" class="form-select">${S.nm.pegawai.map(p => `<option value="${p.ID}">${esc(p.Nama)}</option>`).join('')}</select><div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">Simpan</button></div></form>`);
  isiPenilai(pid);
}
function isiPenilai(pid) { const t = S.nm.tugas.find(x => x.PeriodeID === pid && x.Penilai === $('pe').value), ids = t ? String(t.PegawaiIDs).split(',') : []; [...$('pg').options].forEach(o => o.selected = ids.includes(o.value)); }
async function simpanPenilai(e, pid) { e.preventDefault(); const r = await call('aturPenilai', pid, $('pe').value, [...$('pg').selectedOptions].map(o => o.value)); if (r) { closeModal(); toast(r.message); RENDER.nilai(); } }
async function nilaiSaya() {
  const r = await call('nilaiSaya'); if (!r) return;
  $('app-container').innerHTML = `<div class="card-x"><h3 class="h6">Hasil penilaian kinerja saya</h3>${r.data.length ? r.data.map(x => `<div class="mb-3"><b>${esc(x.Periode)}</b> · Skor <b>${x.Skor}</b><div class="table-wrap"><table class="table table-sm"><tbody>${x.Rincian.map(c => `<tr><td>${esc(c.nama)}</td><td>${c.bobot}%</td><td>${c.nilai}</td></tr>`).join('')}</tbody></table></div>${x.Catatan ? `<p class="muted mb-0">Catatan: ${esc(x.Catatan)}</p>` : ''}</div>`).join('') : kosong('belum ada hasil penilaian yang disahkan.')}</div>`;
}

(window.MOD = window.MOD || []).push('Nilai');
