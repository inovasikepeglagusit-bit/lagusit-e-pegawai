// ── Laporan: tarik rekap, unduh Excel (CSV) atau cetak / simpan PDF ──
RENDER.laporan = async () => {
  const m = await call('getLaporanMeta'); if (!m) return; S.lm = m.data;
  $('app-container').innerHTML = `<div class="card-x mb-3 no-print"><form class="toolbar mb-0" onsubmit="tarikLaporan(event)"><div><label class="lbl" for="lj">Jenis laporan</label><select id="lj" class="form-select" onchange="ubahLap()">${m.data.jenis.map(j => `<option value="${j.k}">${esc(j.judul)}</option>`).join('')}</select></div><div id="lr" class="d-flex gap-2 flex-wrap"></div><button class="btn-x align-self-end" type="submit"><i class="bi bi-search"></i> Tampilkan</button></form></div><div id="lh"></div>`;
  ubahLap();
};
function ubahLap() {
  const j = S.lm.jenis.find(x => x.k === $('lj').value), t = today();
  $('lr').innerHTML = j.param === 'rentang' ? `<div><label class="lbl" for="l1">Dari tanggal</label><input id="l1" type="date" class="form-control" value="${t.slice(0, 8)}01" required></div><div><label class="lbl" for="l2">Sampai tanggal</label><input id="l2" type="date" class="form-control" value="${t}" required></div>` : j.param === 'periode' ? (S.lm.periode.length ? `<div><label class="lbl" for="lp">Periode penilaian</label><select id="lp" class="form-select">${S.lm.periode.map(p => `<option value="${p.ID}">${esc(p.Nama)}</option>`).join('')}</select></div>` : '<span class="muted align-self-end">Belum ada periode penilaian.</span>') : '';
}
async function tarikLaporan(e) {
  e.preventDefault(); const b = e.target.querySelector('[type=submit]'); busy(b, true);
  const j = $('lj').value, p = { Dari: $('l1') && $('l1').value, Sampai: $('l2') && $('l2').value, PeriodeID: $('lp') && $('lp').value };
  const r = await call('getLaporan', j, p); busy(b, false); if (!r) return; const L = S.lap = r.data;
  $('lh').innerHTML = `<div class="card-x"><div class="kop print-only"><b>LAGUSIT e-PEGAWAI · LAPAS GUNUNGSITOLI</b><div>${esc(L.judul)}${L.rentang ? ' · ' + esc(L.rentang) : ''}</div></div><div class="d-flex flex-wrap align-items-center gap-2 mb-2"><div class="flex-grow-1"><h3 class="h6 mb-0">${esc(L.judul)}</h3><div class="muted small">${esc(L.rentang)}${L.rentang ? ' · ' : ''}Dibuat ${esc(L.dibuat)} · ${L.baris.length} baris</div></div><div class="no-print d-flex gap-2"><button class="btn-o" onclick="unduhCsv()"><i class="bi bi-file-earmark-excel"></i> Unduh Excel (CSV)</button><button class="btn-x" onclick="window.print()"><i class="bi bi-printer"></i> Cetak / simpan PDF</button></div></div>${L.catatan ? `<p class="muted small">${esc(L.catatan)}</p>` : ''}${L.baris.length ? `<div class="table-wrap"><table class="table table-sm"><thead><tr>${L.kolom.map(k => `<th>${esc(k)}</th>`).join('')}</tr></thead><tbody>${L.baris.map(r => `<tr>${r.map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : kosong('tidak ada data pada kriteria ini.')}</div>`;
}
function unduhCsv() {
  const L = S.lap, q = v => '"' + (typeof v === 'string' && /^[=+\-@]/.test(v) ? "'" + v : String(v == null ? '' : v)).replace(/"/g, '""') + '"';
  const teks = 'sep=;\r\n' + [L.kolom].concat(L.baris).map(r => r.map(q).join(';')).join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + teks], { type: 'text/csv;charset=utf-8' })); a.download = L.berkas + '.csv';
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

// ── Monitoring ──
RENDER.monitoring = async () => {
  const r = await call('getMonitoring'); if (!r) return; const d = r.data, bt = (m, l) => S.menu.includes(m) ? `<button class="btn-o" onclick="navigateTo('${m}')">${l}</button>` : '';
  const dd = s => s.slice(8) + '/' + s.slice(5, 7), pct = (a, b) => b ? Math.round(a * 100 / b) : 0;
  let h = '';
  if (d.akun) h += `<div class="row g-3 mb-3">${stat('Akun menunggu persetujuan', d.akun.menunggu, 'Super Admin', 'bi-person-check', 't-red')}${stat('Data pegawai belum lengkap', d.akun.kurang, 'NIP atau email kosong', 'bi-exclamation-triangle', 't-amber')}${stat('Ruang tanpa operator', d.akun.tanpaOp.length, d.akun.tanpaOp.join(', ') || 'Semua terisi', 'bi-person-gear', 't-blue')}</div>`;
  if (d.apel) h += `<div class="card-x mb-3"><div class="d-flex flex-wrap align-items-center gap-2 mb-2"><h3 class="h6 mb-0 flex-grow-1">Kepatuhan apel 7 hari terakhir</h3><span class="muted small">Hijau: selesai · Kuning: masih draf · –: belum ada catatan</span></div>${d.apel.ruang.length ? `<div class="table-wrap"><div class="mx"><span></span>${d.apel.hari.map(x => `<span class="c muted">${dd(x)}</span>`).join('')}${d.apel.ruang.map(rg => `<b class="small">${esc(rg.Ruang)}</b>${rg.Hari.map(x => `<span class="c ${x.Draf ? 'wt' : x.Selesai ? 'ok' : ''}">${x.Draf ? x.Draf + ' draf' : x.Selesai ? x.Selesai + ' selesai' : '–'}</span>`).join('')}`).join('')}</div></div>` : '<p class="muted mb-0">Belum ada ruang yang ditugaskan kepada Anda.</p>'}
    <div class="mt-3 small"><b>${d.apel.tanpaFoto}</b> apel selesai (7 hari) belum memiliki foto dokumentasi.</div>
    ${d.apel.drafLama.length ? `<h4 class="h6 mt-3">Draf apel lama yang belum diselesaikan</h4><div class="table-wrap"><table class="table table-sm"><thead><tr><th>Tanggal</th><th>Ruang</th><th>Sesi</th><th>Operator saat itu</th></tr></thead><tbody>${d.apel.drafLama.map(x => `<tr><td class="nw">${esc(x.Tanggal)}</td><td>${esc(x.Ruang)}</td><td>${esc(x.Sesi)}</td><td>${esc(x.Operator)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted small mt-3 mb-0">Tidak ada draf apel lama.</p>'}<div class="mt-2 d-flex gap-2">${bt('apel', 'Apel Staf')}${bt('regu', 'Apel Regu')}</div></div>`;
  if (d.penilaian) h += `<div class="card-x mb-3"><h3 class="h6">Progres penilaian kinerja (periode terbuka)</h3>${d.penilaian.length ? d.penilaian.map(p => `<div class="mb-3"><b>${esc(p.Periode)}</b> <span class="muted small">ditutup ${esc(p.Sampai)}</span><div class="bar my-1" aria-hidden="true"><i style="width:${pct(p.Disahkan, p.Ditugaskan)}%"></i></div><div class="small">${p.Ditugaskan} ditugaskan · ${p.Diisi} sudah dinilai · ${p.Disahkan} disahkan</div>${p.Penilai.map(x => `<div class="small muted">${esc(x.Nama)}: ${x.Dinilai}/${x.Ditugaskan} dinilai</div>`).join('')}</div>`).join('') : '<p class="muted mb-0">Tidak ada periode penilaian yang terbuka.</p>'}${bt('nilai', 'Buka Penilaian Kinerja')}</div>`;
  if (d.kehadiran) h += `<div class="card-x mb-3"><h3 class="h6">Kehadiran apel staf 30 hari terakhir <span class="muted">(${d.kehadiran.apel} apel selesai)</span></h3>${d.kehadiran.daftar.length ? `<div class="table-wrap"><table class="table table-sm"><thead><tr><th>Pegawai</th><th>Unit</th><th>Apel</th><th>Hadir</th><th>Tidak hadir</th></tr></thead><tbody>${d.kehadiran.daftar.map(x => `<tr><td>${esc(x.Nama)}</td><td>${esc(x.Unit)}</td><td>${x.Apel}</td><td>${x.Hadir}%</td><td>${x.TidakHadir}</td></tr>`).join('')}</tbody></table></div><p class="muted small mb-0">Menampilkan 10 pegawai dengan kehadiran terendah. Data ini rekap, bukan penilaian.</p>` : kosong('belum ada apel staf yang diselesaikan.')}</div>`;
  if (d.kgb !== undefined) h += `<div class="card-x mb-3"><h3 class="h6">KGB dan kenaikan pangkat perlu perhatian</h3>${d.kgb === null ? '<p class="muted mb-0">Parameter belum diatur oleh Super Admin.</p>' : d.kgb.length ? `<div class="table-wrap"><table class="table table-sm"><thead><tr><th>Pegawai</th><th>Jenis</th><th>Jadwal</th><th>Sisa</th><th>Status</th></tr></thead><tbody>${d.kgb.map(x => `<tr><td>${esc(x.Nama)}</td><td>${x.Jenis}</td><td class="nw">${esc(x.Jadwal)}</td><td>${x.Sisa < 0 ? Math.abs(x.Sisa) + ' hari terlambat' : x.Sisa + ' hari'}</td><td><span class="badge-x ${KB[x.Status]}">${x.Status}</span></td></tr>`).join('')}</tbody></table></div>` : '<p class="muted mb-0">Tidak ada jadwal yang mendekati atau terlambat.</p>'}${bt('kgb', 'Buka KGB & Pangkat')}</div>`;
  $('app-container').innerHTML = h || `<div class="card-x">${kosong('tidak ada data pemantauan untuk peran Anda.')}</div>`;
};

// ── Profil Saya: data terverifikasi, pengajuan perubahan, berkas ──
RENDER.profil = async () => { const r = await call('getProfilLengkap'); if (!r) return; S.pf = r.data; if (r.data.opsi) S.opsi = r.data.opsi; $('app-container').innerHTML = profilHtml(S.pf, true); };
async function profilPeg(id) { const r = await call('getProfilLengkap', id); if (!r) return; openModal('Profil: ' + (r.data.pegawai ? r.data.pegawai.Nama : ''), profilHtml(r.data, false)); }
function profilHtml(d, utama) {
  const p = d.pegawai;
  if (!p) return `<div class="card-x"><dl class="dl"><dt>Nama akun</dt><dd>${esc(d.akun.nama)}</dd><dt>Email</dt><dd>${esc(d.akun.email)}</dd><dt>Peran</dt><dd>${esc(d.akun.roles.join(', '))}</dd></dl><p class="muted mt-3 mb-0">Belum tersedia: email akun ini belum tertaut ke data pegawai. Hubungi Super Admin.</p></div>`;
  const tunggu = d.pengajuan.find(x => x.Status === 'Menunggu'), st = { Disetujui: 'ok', Ditolak: 'off', Menunggu: 'wait', Dibatalkan: 'off' };
  const nilai = k => k.Tipe === 'Berkas' ? (d.berkas[k.ID] ? `${esc(d.berkas[k.ID].Nama)} <a href="javascript:void(0)" onclick="lihatBerkas('${d.berkas[k.ID].ID}')">lihat</a>` : '<span class="muted">Belum ada</span>') : (esc(d.nilai[k.ID]) || '<span class="muted">Belum diisi</span>');
  return `<div class="card-x mb-3"><div class="d-flex flex-wrap align-items-center gap-2 mb-3"><h3 class="h6 mb-0 flex-grow-1">Data kepegawaian <span class="badge-x ok">Terverifikasi</span></h3>${utama && d.saya && !tunggu ? '<button class="btn-x" onclick="formProfil()"><i class="bi bi-pencil-square"></i> Ubah profil / lengkapi berkas</button>' : ''}${utama && tunggu ? `<button class="btn-o danger" onclick="batalAjuUI('${tunggu.ID}')">Batalkan pengajuan</button>` : ''}</div>
  ${tunggu ? '<div class="todo"><i class="bi bi-hourglass-split"></i><div><b>Pengajuan menunggu verifikasi Super Admin</b><small>Data di bawah belum berubah sampai pengajuan disetujui.</small></div></div>' : ''}
  <dl class="dl">${[['Nama', 'Nama'], ['NIP', 'NIP'], ['Pangkat', 'Pangkat'], ['Golongan', 'Golongan'], ['Jabatan', 'Jabatan'], ['Unit kerja', 'Unit'], ['Status', 'StatusKepegawaian'], ['TMT', 'TMT'], ['Email', 'Email']].map(([l, k]) => `<dt>${l}</dt><dd>${esc(p[k]) || 'Belum tersedia'}</dd>`).join('')}</dl></div>
  <div class="card-x mb-3"><h3 class="h6">Kelengkapan data dan berkas</h3>${d.kolom.length ? `<dl class="dl">${d.kolom.map(k => `<dt>${esc(k.Nama)}${k.Wajib === true ? ' *' : ''}</dt><dd>${nilai(k)}</dd>`).join('')}</dl>` : '<p class="muted mb-0">Belum tersedia: Super Admin belum menambahkan kolom isian.</p>'}</div>
  <div class="card-x"><h3 class="h6">Riwayat pengajuan</h3>${d.pengajuan.length ? d.pengajuan.map(x => `<div class="todo"><div><span class="badge-x ${st[x.Status]}">${esc(x.Status)}</span> <small class="d-inline">${new Date(Number(x.Diajukan)).toLocaleString('id-ID')}</small>${ringkasPengajuan(x)}${x.Alasan ? `<small>Catatan Super Admin: ${esc(x.Alasan)}</small>` : ''}</div></div>`).join('') : '<p class="muted mb-0">Belum ada pengajuan.</p>'}</div>`;
}
async function batalAjuUI(id) { const r = await call('batalkanPengajuan', id); if (r) { toast(r.message); RENDER.profil(); muatNotif(); } }
function formProfil() {
  const d = S.pf, p = d.pegawai; S.pfb = {};
  const fk = k => { const v = d.nilai[k.ID] || '', id = 'pk_' + k.ID;
    if (k.Tipe === 'Berkas') return `<div class="col-md-6"><label class="lbl" for="${id}">${esc(k.Nama)}${k.Wajib === true ? ' *' : ''}</label><div class="muted small mb-1">${d.berkas[k.ID] ? 'Berkas saat ini: ' + esc(d.berkas[k.ID].Nama) : 'Belum ada berkas'}</div><input id="${id}" type="file" accept="application/pdf,image/*" class="form-control" onchange="pilihBerkas(this,'${k.ID}')"><div id="bs_${k.ID}" class="small muted mt-1">PDF atau gambar, maks. 5 MB.</div></div>`;
    if (k.Tipe === 'Pilihan') return `<div class="col-md-6"><label class="lbl" for="${id}">${esc(k.Nama)}${k.Wajib === true ? ' *' : ''}</label><select id="${id}" class="form-select"><option value="">Pilih...</option>${String(k.Opsi).split('|').map(o => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></div>`;
    return `<div class="col-md-6"><label class="lbl" for="${id}">${esc(k.Nama)}${k.Wajib === true ? ' *' : ''}</label><input id="${id}" type="${k.Tipe === 'Angka' ? 'number' : k.Tipe === 'Tanggal' ? 'date' : 'text'}" class="form-control" value="${esc(v)}"></div>`; };
  openModal('Ubah profil', `<form onsubmit="ajukanUI(event)"><div class="todo"><i class="bi bi-shield-check"></i><div><b>Semua perubahan diverifikasi Super Admin</b><small>Data baru baru berlaku setelah pengajuan Anda disetujui.</small></div></div><h4 class="h6 mt-3">Data kepegawaian</h4><div class="row g-3">${['Nama', 'Golongan', 'Pangkat', 'Jabatan', 'Unit', 'TMT'].filter(f => d.dasar.includes(f)).map(f => f === 'Golongan' ? `<div class="col-md-6"><label class="lbl" for="d_Golongan">Golongan</label><select id="d_Golongan" class="form-select" onchange="pgBerubah('d_Golongan','d_Pangkat','${esc(p.StatusKepegawaian)}')"></select></div>` : f === 'Pangkat' ? '<div class="col-md-6"><label class="lbl" for="d_Pangkat">Pangkat</label><select id="d_Pangkat" class="form-select"></select></div>' : `<div class="col-md-6"><label class="lbl" for="d_${f}">${f}</label><input id="d_${f}" type="${f === 'TMT' ? 'date' : 'text'}" class="form-control" value="${esc(p[f])}"></div>`).join('')}</div>${d.kolom.length ? `<h4 class="h6 mt-4">Kelengkapan data dan berkas</h4><div class="row g-3">${d.kolom.map(fk).join('')}</div>` : ''}<div class="text-end mt-4"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">Kirim untuk diverifikasi</button></div></form>`);
  rakitPG('d_Golongan', 'd_Pangkat', p.StatusKepegawaian || '', p.Golongan || '', p.Pangkat || '');
}
function bacaB64(f) { return new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = () => no(new Error('Gagal membaca berkas.')); r.readAsDataURL(f); }); }
async function pilihBerkas(inp, kid) {
  const f = inp.files[0]; if (!f) return; const st = $('bs_' + kid);
  try {
    if (f.size > 20 * 1024 * 1024) throw new Error('Berkas terlalu besar.');
    const b64 = /^image\//.test(f.type) ? await kompres(f) : f.type === 'application/pdf' ? await bacaB64(f) : null; if (!b64) throw new Error('Berkas harus PDF atau gambar.');
    st.textContent = 'Mengunggah...'; const r = await call('unggahBerkas', kid, f.name, b64);
    if (r) { S.pfb[kid] = r.data.ID; st.textContent = 'Terunggah: ' + r.data.Nama; } else { st.textContent = 'Gagal diunggah.'; inp.value = ''; }
  } catch (e) { toast(e.message, 'danger'); inp.value = ''; st.textContent = 'Gagal: ' + e.message; }
}
async function ajukanUI(e) {
  e.preventDefault(); const d = S.pf, b = e.target.querySelector('[type=submit]'), dasar = {}, kolom = {};
  d.dasar.forEach(f => { const e = $('d_' + f); if (e && !e.disabled) dasar[f] = e.value; });
  d.kolom.forEach(k => { if (k.Tipe === 'Berkas') { if (S.pfb[k.ID]) kolom[k.ID] = { berkasId: S.pfb[k.ID] }; } else kolom[k.ID] = { nilai: $('pk_' + k.ID).value }; });
  busy(b, true); const r = await call('ajukanProfil', { dasar, kolom }); busy(b, false);
  if (r) { closeModal(); toast(r.message); RENDER.profil(); muatNotif(); }
}
async function lihatBerkas(id) {
  const r = await call('lihatBerkas', id); if (!r) return; const x = r.data;
  if (x.mime === 'application/pdf') { const bin = atob(x.data), a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); const l = document.createElement('a'); l.href = URL.createObjectURL(new Blob([a], { type: x.mime })); l.download = x.nama.endsWith('.pdf') ? x.nama : x.nama + '.pdf'; document.body.appendChild(l); l.click(); l.remove(); toast('Berkas PDF diunduh.'); }
  else openModal('Berkas: ' + x.nama, `<img class="w-100" alt="Berkas" src="data:${x.mime};base64,${x.data}">`);
}

(window.MOD = window.MOD || []).push('Lapor');
