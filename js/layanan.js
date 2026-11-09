// ── Layanan Surat: pegawai mengajukan surat keterangan/izin; operator surat memeriksa, nomor otomatis, cetak; Super Admin mengelola template ──
Object.assign(TITLES, { layanan: 'Layanan Surat' }); Object.assign(ICONS, { layanan: 'bi-file-earmark-text' });
const LY_ST = { Diajukan: 'wait', 'Siap Cetak': 'ok', Selesai: 'ok', Ditolak: 'off', Dibatalkan: 'off' };
const LS_CSS = `.ls{font-family:'Times New Roman',serif;font-size:12pt;line-height:1.5;color:#000}.ls p{margin:0 0 10px;text-align:justify}.ls .c{text-align:center}.ls .r{text-align:right}.ls table.t{border-collapse:collapse;margin:0 0 10px 18px}.ls table.t td{padding:1px 4px;vertical-align:top}.ls table.t td:first-child{width:170px}.ls table.t td:nth-child(2){width:12px}.ls .li{margin-left:18px;text-align:justify}.ls .ttd{width:260px;margin:18px 0 0 auto;text-align:center;break-inside:avoid}.ls .ttd .sp{height:70px}`;
/** Mengubah isi template menjadi HTML: baris kosong = paragraf; "::c"/"::r" rata tengah/kanan; **tebal**; "|Label|Nilai" = baris data; [ttd] = blok tanda tangan. */
const lyRte = isi => /^<!--rte-->/.test(String(isi || ''));
function suratRender(isi, n) {
  if (lyRte(isi)) { // template hasil editor Word (HTML): penanda {kode} diganti nilai, paragraf [ttd] menjadi blok tanda tangan pejabat
    const v = k => esc(n[k] === undefined ? '{' + k + '}' : n[k]), ttd = `<div class="ttd"><div>${v('tempat_tanggal')}</div><div>${v('pejabat_jabatan')},</div><div class="sp"></div><div><b><u>${v('pejabat_nama')}</u></b></div>${n.pejabat_nip && n.pejabat_nip !== '-' ? `<div>NIP. ${v('pejabat_nip')}</div>` : ''}</div>`;
    const h = RTE.bersih(String(isi).slice(9)).replace(/<(p|div)[^>]*>\s*\[ttd\]\s*<\/\1>/gi, '\u0001').replace(/\{(\w+)\}/g, (m, k) => n[k] !== undefined ? esc(n[k]) : m).replace(/\u0001/g, ttd);
    return `<div class="ls rt-ly">${h}</div>`;
  }
  const isiNilai = t => esc(String(t)).replace(/\{(\w+)\}/g, (m, k) => n[k] !== undefined ? esc(n[k]) : m).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  const blok = String(isi || '').replace(/\r/g, '').split(/\n{2,}/).map(b => {
    const L = b.split('\n').filter(x => x.trim() !== ''); if (!L.length) return '';
    if (L.length === 1 && L[0].trim() === '[ttd]') return `<div class="ttd"><div>${isiNilai('{tempat_tanggal}')}</div><div>${isiNilai('{pejabat_jabatan}')},</div><div class="sp"></div><div><b><u>${isiNilai('{pejabat_nama}')}</u></b></div>${n.pejabat_nip && n.pejabat_nip !== '-' ? `<div>NIP. ${isiNilai('{pejabat_nip}')}</div>` : ''}</div>`;
    return L.map(l => l.startsWith('|') ? l : '').some(Boolean) || L.some(l => l.startsWith('::')) || L.some(l => /^\d+\.\s/.test(l)) ? L.map((l, i) => { // campuran: tiap baris diproses sendiri
      if (l.startsWith('::c ')) return `<p class="c">${isiNilai(l.slice(4))}</p>`; if (l.startsWith('::r ')) return `<p class="r">${isiNilai(l.slice(4))}</p>`;
      if (l.startsWith('|')) { if (i > 0 && L[i - 1].startsWith('|')) return ''; const rows = []; for (let k = i; k < L.length && L[k].startsWith('|'); k++) { const p = L[k].split('|'); rows.push(`<tr><td>${isiNilai(p[1] || '')}</td><td>:</td><td>${isiNilai(p.slice(2).join('|'))}</td></tr>`); } return `<table class="t">${rows.join('')}</table>`; }
      if (/^\d+\.\s/.test(l)) return `<p class="li">${isiNilai(l)}</p>`; return `<p>${isiNilai(l)}</p>`; }).join('') : `<p>${L.map(isiNilai).join('<br>')}</p>`;
  });
  return `<div class="ls">${blok.join('')}</div>`;
}
const lyTgl = ms => ms ? new Date(Number(ms)).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
RENDER.layanan = async () => {
  const r = await call('getLayanan', S.lyf || {}); if (!r) return; S.ly = r.data; const d = S.ly, tab = d.operator && S.lyTab === 'antrean' ? 'antrean' : 'saya'; S.lyTab = tab;
  $('app-container').innerHTML = `${d.operator ? `<div class="mtabs mb-3" role="tablist" aria-label="Layanan surat"><button type="button" role="tab" class="mtab ${tab === 'saya' ? 'on' : ''}" onclick="S.lyTab='saya';RENDER.layanan()"><i class="bi bi-person"></i> Permintaan Saya</button><button type="button" role="tab" class="mtab ${tab === 'antrean' ? 'on' : ''}" onclick="S.lyTab='antrean';RENDER.layanan()"><i class="bi bi-inboxes"></i> Antrean Operator${d.hitung.Diajukan ? `<span class="cnt">${d.hitung.Diajukan}</span>` : ''}</button></div>` : ''}${tab === 'antrean' ? lyAntrean() : lySaya()}`;
};
function lySaya() {
  const d = S.ly;
  const kartu = d.jenis.map(j => `<button type="button" class="ly-k" onclick="lyAjukan('${j.ID}')"><i class="bi ${j.Kategori === 'Izin' ? 'bi-check2-square' : 'bi-patch-check'}"></i><span><b>${esc(j.Nama)}</b><small>${esc(j.Deskripsi || j.Kategori)}</small></span></button>`).join('');
  const L = d.saya.map(x => `<tr><td><b>${esc(x.Jenis)}</b><small class="d-block muted">${esc(x.Keperluan)}</small></td><td class="nw">${lyTgl(x.Diajukan)}</td><td><span class="badge-x ${LY_ST[x.Status] || 'off'}">${esc(x.Status === 'Selesai' ? 'Dapat diambil' : x.Status)}</span>${x.Status === 'Ditolak' && x.Alasan ? `<small class="d-block muted">${esc(x.Alasan)}</small>` : ''}</td><td class="nw">${esc(x.Nomor || '–')}</td><td class="text-end">${x.Status === 'Diajukan' ? `<button class="btn-o danger" onclick="lyBatal('${x.ID}')">Batalkan</button>` : ''}</td></tr>`).join('');
  return `<section class="card-x mb-3"><h3 class="jd mb-1">Ajukan surat</h3><p class="muted small">Pilih jenis surat. Operator surat akan memeriksa, memberi nomor, lalu mencetaknya untuk ditandatangani pejabat. Anda mendapat email pada setiap perkembangan.${d.admin ? ' Template surat diatur di <a href="javascript:void(0)" onclick="bukaMenu(\'master\',\'layanan\')">Master Data ▸ Layanan Surat</a>.' : ''}</p>${d.pegawaiTertaut ? (kartu ? `<div class="ly-grid">${kartu}</div>` : '<p class="muted mb-0">Belum ada jenis surat yang tersedia.</p>') : '<p class="text-danger mb-0">Akun Anda belum tertaut ke data pegawai aktif, sehingga belum dapat mengajukan surat. Hubungi Super Admin.</p>'}</section>
  <section class="card-x"><h3 class="jd mb-2">Permintaan saya</h3>${L ? `<div class="table-wrap"><table class="table"><thead><tr><th>Surat</th><th>Diajukan</th><th>Status</th><th>Nomor</th><th></th></tr></thead><tbody>${L}</tbody></table></div>` : '<p class="muted mb-0">Belum ada permintaan.</p>'}</section>`;
}
function lyAjukan(id) {
  const j = S.ly.jenis.find(x => x.ID === id);
  openModal(j.Nama, `<form onsubmit="lyKirim(event,'${id}')"><p class="muted small">${esc(j.Deskripsi || '')}</p><div class="row g-3"><div class="col-12"><label class="lbl" for="lk0">Keperluan *</label><input id="lk0" class="form-control" maxlength="200" required placeholder="Contoh: pengajuan kredit bank / kelengkapan berkas beasiswa"></div>
  ${j.Isian.map((f, i) => `<div class="col-12"><label class="lbl" for="lk${i + 1}">${esc(f.label)}${f.wajib ? ' *' : ''}</label><input id="lk${i + 1}" class="form-control" ${f.tipe === 'tanggal' ? 'type="date"' : f.tipe === 'angka' ? 'inputmode="decimal"' : ''} maxlength="150" ${f.wajib ? 'required' : ''}></div>`).join('')}</div><p class="muted small mt-3 mb-0">Data nama, NIP, pangkat, dan jabatan diambil otomatis dari data pegawai Anda.</p><div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">Kirim permintaan</button></div></form>`);
}
async function lyKirim(e, id) {
  e.preventDefault(); const j = S.ly.jenis.find(x => x.ID === id), b = e.target.querySelector('[type=submit]'), isian = {}; j.Isian.forEach((f, i) => isian[f.kunci] = $('lk' + (i + 1)).value);
  busy(b, true); const r = await call('ajukanLayanan', { JenisID: id, Keperluan: $('lk0').value, Isian: isian }); busy(b, false); if (r) { closeModal(); toast(r.message); RENDER.layanan(); muatNotif(); }
}
async function lyBatal(id) { const r = await call('batalkanLayanan', id); if (r) { toast(r.message); RENDER.layanan(); } }

// ── Antrean operator ──
function lyAntrean() {
  const d = S.ly, st = d.status, tab = ['Diajukan', 'Siap Cetak', 'Selesai', 'Ditolak'];
  const baris = d.antrean.map(x => `<tr><td><b>${esc(x.Nama)}</b><small class="d-block muted">NIP ${esc(x.NIP)}</small></td><td>${esc(x.Jenis)}<small class="d-block muted">${esc(x.Keperluan)}</small></td><td class="nw">${lyTgl(x.Diajukan)}</td><td class="nw">${esc(x.Nomor || '–')}${x.Dicetak ? `<small class="d-block muted">dicetak ${x.Dicetak}×</small>` : ''}${x.Alasan && st === 'Ditolak' ? `<small class="d-block muted">${esc(x.Alasan)}</small>` : ''}</td><td class="text-end nw">${st === 'Diajukan' ? `<button class="btn-x" onclick="lyPeriksa('${x.ID}')"><i class="bi bi-search"></i> Periksa</button>` : st === 'Siap Cetak' ? `<button class="btn-x" onclick="lyCetak('${x.ID}')"><i class="bi bi-printer"></i> Cetak</button> <button class="btn-o" onclick="lySelesai('${x.ID}')" ${x.Dicetak ? '' : 'disabled title="Cetak dulu"'}>Tandai selesai</button>` : st === 'Selesai' ? `<button class="btn-o" onclick="lyCetak('${x.ID}')"><i class="bi bi-printer"></i> Cetak ulang</button>` : ''}</td></tr>`).join('');
  return `<section class="card-x"><div class="seg mb-2" role="tablist">${tab.map(s => `<button type="button" class="seg-b ${s === st ? 'on' : ''}" onclick="S.lyf={status:'${s}'};RENDER.layanan()">${s}${d.hitung[s] ? ` (${d.hitung[s]})` : ''}</button>`).join('')}</div>
  ${!d.pejabatSiap && d.admin ? '<div class="todo mb-2"><i class="bi bi-exclamation-triangle"></i><div><b>Pejabat penandatangan belum diisi</b><small>Isi di Master Data ▸ Layanan Surat sebelum menyetujui permintaan.</small></div></div>' : ''}
  ${baris ? `<div class="table-wrap"><table class="table"><thead><tr><th>Pemohon</th><th>Surat</th><th>Diajukan</th><th>Nomor</th><th></th></tr></thead><tbody>${baris}</tbody></table></div>` : `<p class="muted mb-0">Tidak ada permintaan ${esc(st.toLowerCase())}.</p>`}</section>`;
}
function lyPeriksa(id) {
  const d = S.ly, x = d.antrean.find(y => y.ID === id), isian = Object.keys(x.Isian).map(k => `<div class="small"><b>${esc(k)}</b>: ${esc(x.Isian[k]) || '–'}</div>`).join('');
  openModal('Periksa permintaan', `<form onsubmit="lySetuju(event,'${id}')"><div class="mb-2"><b>${esc(x.Nama)}</b> · NIP ${esc(x.NIP)}<div class="muted small">${esc(x.Jenis)} · diajukan ${lyTgl(x.Diajukan)}</div></div>${isian ? `<div class="mb-2">${isian}</div>` : ''}
  ${x.Kurang.length ? `<div class="todo mb-2"><i class="bi bi-exclamation-triangle"></i><div><b>Data pegawai belum lengkap: ${esc(x.Kurang.join(', '))}</b><small>Surat akan memuat tanda "-" pada bagian itu. Lengkapi di data pegawai, atau lanjutkan bila memang demikian.</small><label class="chk"><input type="checkbox" id="lyLn"> Tetap lanjutkan</label></div></div>` : ''}
  <div class="row g-3"><div class="col-12"><label class="lbl" for="lyKp">Keperluan (boleh disunting)</label><input id="lyKp" class="form-control" maxlength="200" value="${esc(x.Keperluan)}"></div>
  <div class="col-12"><label class="lbl" for="lyIx">Indeks surat (untuk nomor otomatis) *</label><select id="lyIx" class="form-select" required><option value="">Pilih indeks...</option>${d.indeks.map(i => `<option value="${i.ID}" ${i.ID === x.IndeksID ? 'selected' : ''}>${esc(i.Kode)} — ${esc(i.Nama)}</option>`).join('')}</select></div>
  ${d.pin ? '<div class="col-md-6"><label class="lbl" for="lyPin">PIN pengambil nomor *</label><input id="lyPin" type="password" inputmode="numeric" class="form-control" autocomplete="off"></div>' : ''}
  <div class="col-12" id="lyTolakBox" style="display:none"><label class="lbl" for="lyAl">Alasan penolakan *</label><input id="lyAl" class="form-control" maxlength="200"></div></div>
  <p class="muted small mt-3 mb-0">Menyetujui akan mengambil nomor surat otomatis dari register Nomor Surat.</p><div class="text-end mt-3"><button type="button" class="btn-o danger" onclick="lyTolak('${id}')">Tolak</button> <button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">Setujui &amp; beri nomor</button></div></form>`);
}
async function lySetuju(e, id) {
  e.preventDefault(); const b = e.target.querySelector('[type=submit]'); busy(b, true);
  const r = await call('putuskanLayanan', id, { Aksi: 'setujui', IndeksID: $('lyIx').value, PIN: $('lyPin') ? $('lyPin').value : '', Keperluan: $('lyKp').value, Lanjut: !!($('lyLn') && $('lyLn').checked) }); busy(b, false);
  if (r) { closeModal(); toast(r.message); S.lyf = { status: 'Siap Cetak' }; RENDER.layanan(); muatNotif(); }
}
async function lyTolak(id) {
  const box = $('lyTolakBox'); if (box.style.display === 'none') { box.style.display = ''; $('lyAl').focus(); toast('Isi alasan penolakan lalu tekan Tolak lagi.', 'warning'); return; }
  const r = await call('putuskanLayanan', id, { Aksi: 'tolak', Alasan: $('lyAl').value }); if (r) { closeModal(); toast(r.message); RENDER.layanan(); muatNotif(); }
}
async function lyCetak(id) {
  const r = await call('bukaCetakLayanan', id); if (!r) return; const x = r.data;
  await cetakBuka(x.judul + ' ' + x.nomor, `<style>${LS_CSS}</style>${suratRender(x.isi, x.nilai)}`, true); RENDER.layanan();
}
async function lySelesai(id) { const r = await call('selesaikanLayanan', id); if (r) { toast(r.message); RENDER.layanan(); } }

// ── Master Data ▸ Layanan Surat (Super Admin): penandatangan, jenis surat, editor template ──
MT.layanan = async () => {
  const r = await call('getLayananAdmin'); if (!r) return; S.la = r.data; S.laE = null; mb(laDaftar());
};
function laDaftar() {
  const d = S.la, s = d.setting;
  return `<div class="card-x mb-3"><h3 class="h6">Penandatangan surat</h3><p class="muted small">Dipakai pada penanda <code>{pejabat_nama}</code>, <code>{pejabat_nip}</code>, <code>{pejabat_jabatan}</code>, dan <code>{tempat}</code>. Surat dicetak lalu ditandatangani basah oleh pejabat.</p><form onsubmit="laSimpanSet(event)"><div class="row g-3"><div class="col-md-3"><label class="lbl" for="ls1">Tempat *</label><input id="ls1" class="form-control" maxlength="60" value="${esc(s.tempat)}" placeholder="Kota" required></div><div class="col-md-3"><label class="lbl" for="ls2">Jabatan *</label><input id="ls2" class="form-control" maxlength="80" value="${esc(s.pejabat.jabatan)}" placeholder="KEPALA" required></div><div class="col-md-3"><label class="lbl" for="ls3">Nama pejabat *</label><input id="ls3" class="form-control" maxlength="80" value="${esc(s.pejabat.nama)}" required></div><div class="col-md-3"><label class="lbl" for="ls4">NIP</label><input id="ls4" class="form-control" maxlength="30" value="${esc(s.pejabat.nip)}"></div></div><div class="text-end mt-3"><button class="btn-x" type="submit">Simpan penandatangan</button></div></form></div>
  <div class="card-x"><div class="d-flex flex-wrap align-items-center gap-2 mb-2"><h3 class="h6 mb-0 grow">Jenis surat dan template</h3><button class="btn-x" onclick="laEdit('')"><i class="bi bi-plus-lg"></i> Jenis surat baru</button></div><p class="muted small">Setiap jenis punya template sendiri dengan penanda isian otomatis. Template bawaan disediakan sistem dan dapat diubah kapan saja; yang diubah dapat dikembalikan ke bawaan.</p>
  ${d.jenis.map(j => `<div class="todo"><i class="bi ${j.Kategori === 'Izin' ? 'bi-check2-square' : 'bi-patch-check'}"></i><div><b>${esc(j.Nama)}</b> <span class="badge-x ${j.Aktif ? 'ok' : 'off'}">${j.Aktif ? 'Aktif' : 'Nonaktif'}</span>${j.Diubah ? ' <span class="badge-x wait">Template diubah</span>' : j.IsiBawaan ? ' <span class="badge-x off">Bawaan</span>' : ''}<small>${esc(j.Kategori)}${j.Isian.length ? ' · isian: ' + j.Isian.map(f => esc(f.label)).join(', ') : ''}</small></div><button class="btn-o" onclick="laEdit('${j.ID}')">Ubah template</button></div>`).join('')}</div>`;
}
async function laSimpanSet(e) {
  e.preventDefault(); const r = await call('simpanLayananSetting', { tempat: $('ls1').value, pejabat: { jabatan: $('ls2').value, nama: $('ls3').value, nip: $('ls4').value } }); if (r) { toast(r.message); MT.layanan(); }
}
function laEdit(id) {
  const d = S.la, j = id ? d.jenis.find(x => x.ID === id) : { ID: '', Nama: '', Kategori: 'Keterangan', Deskripsi: '', Isian: [], Isi: '::c **SURAT KETERANGAN**\n::c Nomor: {nomor}\n\nYang bertanda tangan di bawah ini:\n|Nama|{pejabat_nama}\n|NIP|{pejabat_nip}\n|Jabatan|{pejabat_jabatan}\n\nDengan ini menerangkan bahwa:\n|Nama|{nama}\n|NIP|{nip}\n|Pangkat/Golongan|{pangkat_golongan}\n|Jabatan|{jabatan}\n\nSurat keterangan ini dibuat untuk keperluan {keperluan}.\n\nDemikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.\n\n[ttd]', IndeksID: '', Aktif: true, IsiBawaan: '', Diubah: false, Contoh: Object.assign({}, (d.jenis[0] || {}).Contoh) };
  S.laE = JSON.parse(JSON.stringify(j)); laForm();
}
const laToken = () => S.la.token.concat(S.laE.Isian.map(f => f.kunci).filter(Boolean));
function laForm() {
  const d = S.la, j = S.laE;
  mb(`<form onsubmit="laSimpan(event)"><div class="d-flex flex-wrap align-items-center gap-2 mb-3"><button type="button" class="btn-o" onclick="MT.layanan()"><i class="bi bi-arrow-left"></i> Kembali</button><h3 class="h6 mb-0 grow">${j.ID ? 'Ubah template' : 'Jenis surat baru'}</h3></div>
  <div class="row g-3"><div class="col-xl-5"><div class="card-x"><div class="row g-2"><div class="col-12"><label class="lbl" for="le1">Nama jenis surat *</label><input id="le1" class="form-control" maxlength="80" required value="${esc(j.Nama)}"></div><div class="col-6"><label class="lbl" for="le2">Kategori</label><select id="le2" class="form-select">${d.kategori.map(k => `<option ${j.Kategori === k ? 'selected' : ''}>${k}</option>`).join('')}</select></div><div class="col-6"><label class="lbl" for="le3">Indeks surat bawaan</label><select id="le3" class="form-select"><option value="">Dipilih operator</option>${d.indeks.map(i => `<option value="${i.ID}" ${j.IndeksID === i.ID ? 'selected' : ''}>${esc(i.Kode)} — ${esc(i.Nama)}</option>`).join('')}</select></div>
  <div class="col-12"><label class="lbl" for="le4">Deskripsi singkat (tampil bagi pemohon)</label><input id="le4" class="form-control" maxlength="200" value="${esc(j.Deskripsi)}"></div><div class="col-12"><label class="chk"><input type="checkbox" id="le5" ${j.Aktif ? 'checked' : ''}> Tersedia untuk pegawai</label></div></div>
  <h4 class="h6 mt-3">Isian tambahan dari pemohon</h4><p class="muted small">Keperluan selalu ditanyakan. Tambahkan isian lain (mis. nama kampus); kodenya menjadi penanda <code>{kode}</code> pada template.</p><div id="leIsian"></div><button type="button" class="btn-o" onclick="laIsianTambah()">+ Tambah isian</button></div></div>
  <div class="col-xl-7"><div class="card-x"><label class="lbl" for="leIsi">Isi surat ${lyRte(j.Isi) ? '<span class="badge-x ok">Editor Word</span>' : ''}</label><div class="kchips mb-2" aria-label="Sisipkan penanda isian">${laToken().map(k => `<button type="button" class="kchip" onclick="laSisip('{${k}}')">{${k}}</button>`).join('')}<button type="button" class="kchip" onclick="laSisip('[ttd]')">[ttd]</button></div>
  ${lyRte(j.Isi) ? '<div id="leRte"></div><p class="muted small mt-1 mb-2">Atur tampilan seperti di Word. Paragraf yang hanya berisi <code>[ttd]</code> menjadi tanda tangan pejabat. Gunakan tombol penanda untuk data pemohon.</p>' : `<textarea id="leIsi" class="form-control" rows="16" style="font-family:ui-monospace,monospace;font-size:13px" oninput="laPrev()">${esc(j.Isi)}</textarea><div class="mb-2"><button type="button" class="btn-o sm" onclick="laKeWord()"><i class="bi bi-file-earmark-word"></i> Ubah ke editor Word</button> <span class="muted small">(tampilan seperti Word: font, ukuran, tabel, dll.)</span></div><p class="muted small mt-1 mb-2">Baris kosong = paragraf baru · <code>::c </code> rata tengah · <code>::r </code> rata kanan · <code>**tebal**</code> · <code>|Label|Nilai</code> = baris data berpasangan · <code>[ttd]</code> = tanda tangan pejabat. Kop surat memakai pengaturan di tab Kop Surat.</p>`}
  <h4 class="h6">Pratinjau <span class="muted small">(data contoh${d.contohNyata ? ': akun Anda' : ''})</span></h4><div class="ly-kertas" id="lePrev"></div></div></div></div>
  <div class="text-end mt-3">${j.ID && j.IsiBawaan && j.Diubah ? '<button type="button" class="btn-o me-2" onclick="laReset()">Kembalikan template bawaan</button>' : ''}<button class="btn-x" type="submit">Simpan jenis surat</button></div></form>`);
  laIsianGambar(); if (lyRte(j.Isi)) S.ler = RTE.mount('leRte', { html: j.Isi.slice(9), minTinggi: '360px', tinggi: '70vh', onUbah: laPrev }); laPrev();
}
function laIsianGambar() {
  $('leIsian').innerHTML = S.laE.Isian.map((f, i) => `<div class="row g-1 mb-2 align-items-center"><div class="col-4"><input class="form-control form-control-sm" placeholder="kode" maxlength="20" value="${esc(f.kunci)}" onchange="S.laE.Isian[${i}].kunci=this.value.trim().toLowerCase();laForm()" aria-label="Kode isian"></div><div class="col-4"><input class="form-control form-control-sm" placeholder="Label" maxlength="40" value="${esc(f.label)}" onchange="S.laE.Isian[${i}].label=this.value" aria-label="Label isian"></div><div class="col-2"><select class="form-select form-select-sm" onchange="S.laE.Isian[${i}].tipe=this.value" aria-label="Tipe">${S.la.tipe.map(t => `<option ${f.tipe === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div><div class="col-1 text-center"><input type="checkbox" ${f.wajib ? 'checked' : ''} onchange="S.laE.Isian[${i}].wajib=this.checked" aria-label="Wajib"></div><div class="col-1"><a href="javascript:void(0)" onclick="S.laE.Isian.splice(${i},1);laForm()" aria-label="Hapus isian">×</a></div></div>`).join('');
}
function laIsianTambah() { laAmbil(); S.laE.Isian.push({ kunci: '', label: '', tipe: 'teks', wajib: true }); laForm(); }
function laAmbil() { const j = S.laE; j.Nama = $('le1').value; j.Kategori = $('le2').value; j.IndeksID = $('le3').value; j.Deskripsi = $('le4').value; j.Aktif = $('le5').checked; j.Isi = lyRte(j.Isi) && S.ler ? '<!--rte-->' + S.ler.get() : $('leIsi') ? $('leIsi').value : j.Isi; }
function laSisip(t) { if (lyRte(S.laE.Isi) && S.ler) { S.ler.sisip(t); return; } const e = $('leIsi'), a = e.selectionStart, b = e.selectionEnd; e.value = e.value.slice(0, a) + t + e.value.slice(b); e.focus(); e.selectionStart = e.selectionEnd = a + t.length; laPrev(); }
function suratKeHtml(isi) {
  const d = document.createElement('div'); d.innerHTML = suratRender(isi, {});
  d.querySelectorAll('.ttd').forEach(t => { const p = document.createElement('p'); p.textContent = '[ttd]'; t.replaceWith(p); });
  d.querySelectorAll('p.c').forEach(p => { p.style.textAlign = 'center'; p.removeAttribute('class'); }); d.querySelectorAll('p.r').forEach(p => { p.style.textAlign = 'right'; p.removeAttribute('class'); }); d.querySelectorAll('p.li').forEach(p => { p.style.marginLeft = '24px'; p.removeAttribute('class'); });
  d.querySelectorAll('table').forEach(t => { t.querySelectorAll('td').forEach(td => { td.style.border = 'none'; }); });
  d.querySelectorAll('p').forEach(p => { p.style.textAlign = p.style.textAlign || 'justify'; });
  const ls = d.querySelector('.ls'); return RTE.bersih(ls ? ls.innerHTML : d.innerHTML);
}
function laKeWord() { laAmbil(); S.laE.Isi = '<!--rte-->' + suratKeHtml(S.laE.Isi); laForm(); toast('Template kini memakai editor Word. Periksa pratinjau lalu simpan.'); }
function laPrev() {
  const n = Object.assign({}, S.laE.Contoh || (S.la.jenis[0] || {}).Contoh || {}); S.laE.Isian.forEach(f => { if (f.kunci && n[f.kunci] === undefined) n[f.kunci] = '(' + (f.label || f.kunci) + ')'; }); n.keperluan = 'keperluan pemohon'; if (n.nomor === undefined || /…/.test(n.nomor)) n.nomor = '…/…/2026';
  const e = $('lePrev'); if (e) e.innerHTML = `<style>${LS_CSS}</style>` + suratRender((lyRte(S.laE.Isi) && S.ler ? '<!--rte-->' + S.ler.get() : $('leIsi').value), n);
}
async function laSimpan(e) {
  e.preventDefault(); laAmbil(); const j = S.laE; const r = await call('simpanLayananJenis', { ID: j.ID || undefined, Nama: j.Nama, Kategori: j.Kategori, Deskripsi: j.Deskripsi, Isian: j.Isian, Isi: j.Isi, IndeksID: j.IndeksID, Aktif: j.Aktif }); if (r) { toast(r.message); MT.layanan(); }
}
function laReset() { askReason('Kembalikan template bawaan (isi dan isian tambahan kembali seperti semula)', async () => { const r = await call('resetLayananJenis', S.laE.ID); if (r) { toast(r.message); MT.layanan(); } }); }
(window.MOD = window.MOD || []).push('Layanan');
