// ── Nota Dinas & SK: penyusun yang ditunjuk Super Admin menyusun dokumen berstruktur; nomor dari register Nomor Surat; pengesahan lewat menu Pengesahan ──
Object.assign(TITLES, { dokumen: 'Nota Dinas & SK' }); Object.assign(ICONS, { dokumen: 'bi-file-earmark-text' });
Object.assign(KATA, { dokumen: 'nota dinas sk surat keputusan panitia upacara apel lampiran petugas penomoran surat pengesahan' }); Object.assign(TILE, { dokumen: 'Nota Dinas & SK' });
const DK_STAT = { 'Draf': 'wait', 'Bernomor': 'wait', 'Menunggu pengesahan': 'wait', 'Disahkan': 'ok', 'Ditolak': 'no', 'Dicabut': 'no', 'Dibatalkan': 'no' };
const DK_TEMPLATE = { // hanya judul kolom; isi diisi penyusun
  'Penanggung jawab dan kegiatan': ['No', 'Penanggung Jawab', 'Kegiatan', 'Jadwal', 'Keterangan'],
  'Susunan tim / panitia': ['No', 'Kedudukan dalam Tim', 'Nama', 'Jabatan'],
  'Daftar pegawai': ['No', 'Nama', 'NIP', 'Jabatan'],
  'Tabel kosong (atur sendiri)': ['No', 'Kolom 2', 'Kolom 3']
};
const dkTgl = s => s ? tglIndo(s) : '';
const dkHari = s => s ? HARI_PANJANG[new Date(s + 'T00:00:00').getDay()] + ', ' + tglIndo(s) : '';
const dkBaris = (v) => String(v || '').split('\n').map(x => x.trim()).filter(Boolean);

RENDER.dokumen = async () => {
  const f = S.dkf = S.dkf || { jenis: '', status: '', cari: '' };
  const r = await call('getDokumen', f); if (!r) return; S.dkd = r.data; const d = r.data;
  const sts = ['Draf', 'Bernomor', 'Menunggu pengesahan', 'Disahkan', 'Ditolak', 'Dicabut', 'Dibatalkan'];
  $('app-container').innerHTML = `<div class="dk"><section class="card-x mb-3"><div class="d-flex flex-wrap align-items-center gap-2"><div class="grow"><h3 class="jd mb-1">Nota Dinas & Surat Keputusan</h3><p class="muted small mb-0">${d.tulis ? 'Susun Nota Dinas (dapat ditautkan ke kegiatan di Kalender dan dilengkapi lampiran petugas) atau SK dengan lampiran fleksibel. Nomor diambil dari register Nomor Surat; pengesahan lewat menu Pengesahan.' : 'Anda dapat melihat dan mencetak dokumen. Penyusunan dilakukan penyusun yang ditunjuk Super Admin.'}</p></div>
  ${d.tulis ? '<button class="btn-x" onclick="dkBaru(\'Nota Dinas\')"><i class="bi bi-plus-lg"></i> Nota Dinas</button><button class="btn-x" onclick="dkBaru(\'SK\')"><i class="bi bi-plus-lg"></i> SK</button><button class="btn-x" onclick="dkBaru(\'Surat\')"><i class="bi bi-plus-lg"></i> Surat bebas</button>' : ''}${d.admin ? '<button class="btn-o" onclick="dkPetugas()"><i class="bi bi-person-gear"></i> Penyusun</button>' : ''}</div></section>
  <section class="card-x"><div class="row g-2 mb-3"><div class="col-md-3"><select id="dkj" class="form-select" onchange="dkCari()" aria-label="Jenis"><option value="">Semua jenis</option>${d.jenis.map(j => `<option ${f.jenis === j ? 'selected' : ''}>${j}</option>`).join('')}</select></div><div class="col-md-3"><select id="dks" class="form-select" onchange="dkCari()" aria-label="Status"><option value="">Semua status</option>${sts.map(j => `<option ${f.status === j ? 'selected' : ''}>${j}</option>`).join('')}</select></div><div class="col-md-6"><input id="dkq" class="form-control" placeholder="Cari judul, nomor, penyusun..." value="${esc(f.cari || '')}" onkeydown="if(event.key==='Enter')dkCari()" aria-label="Cari"></div></div>
  ${d.daftar.length ? `<div class="table-responsive"><table class="table align-middle"><thead><tr><th>Dokumen</th><th>Nomor</th><th>Status</th><th>Penyusun</th><th></th></tr></thead><tbody>${d.daftar.map((x, i) => `<tr><td><b>${esc(x.Judul)}</b><div class="muted small">${esc(x.Jenis)}${x.Hal && x.Hal !== x.Judul ? ' · ' + esc(x.Hal) : ''}</div></td><td class="nw">${x.Nomor ? esc(x.Nomor) : '<span class="muted">Belum</span>'}</td><td><span class="badge-x ${DK_STAT[x.Status] || 'wait'}">${esc(x.Status)}</span>${x.Penandatangan ? `<div class="muted small">${esc(x.Penandatangan)}</div>` : ''}</td><td class="small">${esc(x.Pembuat)}</td><td class="nw">
  <button class="btn-o sm" onclick="dkPra('${x.ID}')" title="Pratinjau"><i class="bi bi-eye"></i></button><button class="btn-o sm" onclick="dkCetak('${x.ID}')" title="Cetak"><i class="bi bi-printer"></i></button>${x.TteStatus === 'Disahkan' && x.TteID ? `<button class="btn-o sm" onclick="tteCetak('${x.TteID}')" title="Cetak versi sah"><i class="bi bi-patch-check"></i></button>` : ''}
  ${d.tulis && !x.Terkunci && (d.admin || x.PembuatEmail === S.user.email) ? `<button class="btn-o sm" onclick="dkUbah('${x.ID}')" title="Ubah"><i class="bi bi-pencil"></i></button>` : ''}${d.tulis && !x.Nomor && (d.admin || x.PembuatEmail === S.user.email) ? `<button class="btn-o sm" onclick="dkNomor('${x.ID}')" title="Ambil nomor"><i class="bi bi-hash"></i></button>` : ''}
  ${d.tulis && !x.Terkunci && (d.admin || x.PembuatEmail === S.user.email) && (d.admin || !x.Nomor) ? `<button class="btn-o sm" onclick="dkHapus('${x.ID}')" title="Hapus"><i class="bi bi-trash"></i></button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted py-3 mb-0">Belum ada dokumen.</p>'}
  ${d.total > d.daftar.length ? `<p class="muted small mt-2 mb-0">Menampilkan ${d.daftar.length} dari ${d.total}. Persempit dengan pencarian.</p>` : ''}</section></div>`;
};
function dkCari() { Object.assign(S.dkf, { jenis: $('dkj').value, status: $('dks').value, cari: $('dkq').value.trim() }); RENDER.dokumen(); }

// ── Editor ──
function dkBaru(jenis) {
  S.dk = { jenis: jenis, id: '', ua: '', judul: '', tanggal: today(), agenda: '', indeks: '', nomor: '', isi: jenis === 'Surat' ? { html: '', kop: true, kertas: 'A4', margin: 'normal', font: 'Times New Roman', ukuran: 12 } : jenis === 'SK' ? { menimbang: [], mengingat: [], diktum: [{ label: 'KESATU', teks: '' }, { label: 'KEDUA', teks: '' }], tembusan: [], lampiran: [] } : { kepada: [], rincian: [{ k: 'Hari/Tanggal', v: '' }, { k: 'Waktu', v: '' }, { k: 'Tempat', v: '' }, { k: 'Pakaian', v: '' }], paragraf: [], tembusan: [], lampiran: [] } };
  dkEditor();
}
async function dkUbah(id) {
  const r = await call('getDokumenRinci', id); if (!r) return; const x = r.data;
  S.dk = { jenis: x.Jenis, id: x.ID, ua: x.Diubah, judul: x.Judul, tanggal: x.Tanggal, agenda: x.AgendaID || '', indeks: x.IndeksID || '', nomor: x.Nomor || '', isi: x.Isi || {} };
  if (!S.dk.isi.lampiran) S.dk.isi.lampiran = []; dkEditor();
}
const dkIn = (id, l, v, x = '', kls = 'col-md-6') => `<div class="${kls}"><label class="lbl" for="${id}">${l}</label><input id="${id}" class="form-control" value="${esc(v || '')}" ${x}></div>`;
const dkTa = (id, l, v, n = 3, h = '', kls = 'col-12') => `<div class="${kls}"><label class="lbl" for="${id}">${l}</label><textarea id="${id}" class="form-control" rows="${n}">${esc(v || '')}</textarea>${h ? `<div class="muted small">${h}</div>` : ''}</div>`;
function dkEditor() {
  const d = S.dk, I = d.isi, D = S.dkd, nota = d.jenis === 'Nota Dinas';
  const keg = D.kegiatan || [];
  $('app-container').innerHTML = `<div class="dk"><section class="card-x mb-3"><div class="d-flex flex-wrap align-items-center gap-2"><h3 class="jd mb-0 grow">${d.id ? 'Ubah' : 'Susun'} ${esc(d.jenis)}</h3><button class="btn-o" onclick="RENDER.dokumen()"><i class="bi bi-arrow-left"></i> Kembali</button></div></section>
  ${dkBarTpl()}<form class="card-x" onsubmit="dkSimpan(event)"><div class="row g-3">
  ${dkIn('dkt', 'Judul di daftar (pengenal internal) *', d.judul, 'required minlength="5" maxlength="200"', 'col-md-8')}${dkIn('dkg', 'Tanggal dokumen', d.tanggal, 'type="date"', 'col-md-4')}
  <div class="col-md-6"><label class="lbl" for="dki">Indeks surat (untuk penomoran)</label><select id="dki" class="form-select" ${d.nomor ? 'disabled' : ''}><option value="">— pilih saat mengambil nomor —</option>${(D.indeks || []).map(x => `<option value="${x.ID}" ${d.indeks === x.ID ? 'selected' : ''}>${esc(x.Kode)} — ${esc(x.Nama)}</option>`).join('')}</select>${d.nomor ? `<div class="muted small">Nomor: <b>${esc(d.nomor)}</b></div>` : ''}</div>
  ${nota ? `<div class="col-md-6"><label class="lbl" for="dka">Kegiatan di Kalender (opsional)</label><select id="dka" class="form-select" onchange="dkPilihKegiatan()"><option value="">— tidak ditautkan —</option>${keg.map(k => `<option value="${k.ID}" ${d.agenda === k.ID ? 'selected' : ''}>${esc(k.Jenis)} · ${esc(tglIndo(k.Tanggal))} · ${esc(k.Judul)}</option>`).join('')}</select></div>` : ''}
  ${d.jenis === 'Surat' ? dkFormSurat() : ''}
  ${nota ? `${dkTa('dkk', 'Kepada Yth. (satu penerima per baris)', (I.kepada || []).join('\n'), 3)}${dkIn('dkd', 'Dari', I.dari, 'maxlength="200"', 'col-md-6')}${dkIn('dkh', 'Hal *', I.hal, 'maxlength="300"', 'col-md-6')}
  <div class="col-12"><div class="lbl">Isi nota dinas (editor seperti Word)</div><div id="dkrte"></div></div>
  <div class="col-12"><div class="lbl">Rincian kegiatan (Hari/Tanggal, Waktu, Tempat, Pakaian, dst.)</div><div id="dkrin"></div><button type="button" class="btn-o sm mt-1" onclick="dkTambahRin()"><i class="bi bi-plus"></i> Baris rincian</button></div>
  ${dkTa('dkm', 'Tembusan (satu per baris)', (I.tembusan || []).join('\n'), 2)}
  <div class="col-12"><div class="lbl">Lampiran petugas</div><div class="row g-2 mb-2">${dkIn('dkjl', 'Judul lampiran', I.judulLampiran, 'maxlength="200" placeholder="mis. Personil Apel ..."', 'col-md-6')}<div class="col-md-3"><label class="lbl" for="dktp">Tarik dari jadwal tanggal</label><input id="dktp" type="date" class="form-control"></div><div class="col-md-3 d-flex align-items-end"><button type="button" class="btn-o w-100" onclick="dkTarikPetugas()"><i class="bi bi-cloud-download"></i> Tarik petugas</button></div></div><div id="dkpet"></div><button type="button" class="btn-o sm mt-1" onclick="dkTambahPet()"><i class="bi bi-plus"></i> Baris petugas</button></div>`
  
  : d.jenis === 'Surat' ? '' : `${dkIn('dkta', 'Tentang *', I.tentang, 'maxlength="400" placeholder="mis. Panitia Peringatan ..."', 'col-12')}${dkTa('dkmb', 'Menimbang (satu butir per baris: a., b., c. otomatis)', (I.menimbang || []).join('\n'), 4)}${dkTa('dkmg', 'Mengingat (satu butir per baris: 1., 2., 3. otomatis)', (I.mengingat || []).join('\n'), 5)}
  ${dkTa('dkme', 'Kalimat “Menetapkan” (kosongkan agar otomatis: KEPUTUSAN KEPALA … TENTANG …)', I.menetapkan, 2)}<div class="col-12"><div class="lbl">Diktum (KESATU, KEDUA, …)</div><div id="dkdik"></div><button type="button" class="btn-o sm mt-1" onclick="dkTambahDik()"><i class="bi bi-plus"></i> Diktum</button></div>
  ${dkIn('dktm', 'Ditetapkan di', I.tempat, 'maxlength="80"', 'col-md-6')}${dkIn('dktk', 'Pada tanggal', I.tanggalSK, 'type="date"', 'col-md-6')}${dkTa('dkm', 'Tembusan (satu per baris)', (I.tembusan || []).join('\n'), 2)}
  <div class="col-12"><div class="lbl">Lampiran keputusan (dapat lebih dari satu, bebas bentuk)</div><div id="dklam"></div><div class="d-flex flex-wrap gap-2 mt-1">${Object.keys(DK_TEMPLATE).map(k => `<button type="button" class="btn-o sm" onclick="dkTambahLam('${esc(k)}')"><i class="bi bi-table"></i> ${esc(k)}</button>`).join('')}<button type="button" class="btn-o sm" onclick="dkTambahLam('teks')"><i class="bi bi-text-paragraph"></i> Teks bebas</button></div></div>`}
  <div class="col-12 d-flex flex-wrap gap-2"><button class="btn-x" id="dksv"><i class="bi bi-save"></i> Simpan draf</button><button type="button" class="btn-o" onclick="dkPratinjau()"><i class="bi bi-eye"></i> Pratinjau</button><button type="button" class="btn-o" onclick="RENDER.dokumen()">Batal</button></div></div></form></div>`;
  if (d.jenis === 'Surat') dkMountSurat(); else if (nota) { dkMountNota(); dkRin(); dkPet(); } else { dkDik(); dkLam(); }
}
// pembaca isian sederhana → state
function dkKumpul() {
  const d = S.dk, I = d.isi, v = id => ($(id) ? $(id).value : ''), nota = d.jenis === 'Nota Dinas';
  d.judul = v('dkt').trim(); d.tanggal = v('dkg') || d.tanggal; if (!d.nomor) d.indeks = v('dki'); d.agenda = nota ? v('dka') : '';
  if (d.jenis === 'Surat') { I.html = S.dkr ? S.dkr.get() : ''; Object.assign(I, { kop: $('dskop').checked, kopId: $('dskid').value, kopHtml: dkKopTeks(), kertas: v('dskw'), margin: v('dsmg'), font: v('dsfn'), ukuran: Number(v('dsuk')) }); return; }
  I.tembusan = dkBaris(v('dkm'));
  if (nota) { I.kepada = dkBaris(v('dkk')); I.dari = v('dkd').trim(); I.hal = v('dkh').trim(); I.isiHtml = S.dkr ? S.dkr.get() : (I.isiHtml || ''); I.paragraf = []; I.penutup = ''; I.judulLampiran = v('dkjl').trim(); }
  else { I.tentang = v('dkta').trim(); I.menimbang = dkBaris(v('dkmb')); I.mengingat = dkBaris(v('dkmg')); I.menetapkan = v('dkme').trim(); I.tempat = v('dktm').trim(); I.tanggalSK = v('dktk'); }
}
// daftar bergrid
const dkSet = (a, i, k, val) => { S.dk.isi[a][i][k] = val; };
function dkRin() { $('dkrin').innerHTML = S.dk.isi.rincian.map((r, i) => `<div class="row g-2 mb-1"><div class="col-4"><input class="form-control" aria-label="Butir" maxlength="60" value="${esc(r.k)}" oninput="dkSet('rincian',${i},'k',this.value)"></div><div class="col-7"><input class="form-control" aria-label="Isi" maxlength="400" value="${esc(r.v)}" oninput="dkSet('rincian',${i},'v',this.value)"></div><div class="col-1"><button type="button" class="btn-o sm" aria-label="Hapus baris" onclick="dkDel('rincian',${i},dkRin)"><i class="bi bi-x"></i></button></div></div>`).join(''); }
function dkPet() { $('dkpet').innerHTML = S.dk.isi.lampiran.map((r, i) => `<div class="row g-2 mb-1"><div class="col-5"><input class="form-control" aria-label="Peran" maxlength="100" placeholder="Peran" value="${esc(r.peran)}" oninput="dkSet('lampiran',${i},'peran',this.value)"></div><div class="col-6"><input class="form-control" aria-label="Nama" maxlength="200" placeholder="Nama / jabatan" value="${esc(r.nama)}" oninput="dkSet('lampiran',${i},'nama',this.value)"></div><div class="col-1"><button type="button" class="btn-o sm" aria-label="Hapus baris" onclick="dkDel('lampiran',${i},dkPet)"><i class="bi bi-x"></i></button></div></div>`).join('') || '<div class="muted small">Belum ada petugas.</div>'; }
function dkDik() { $('dkdik').innerHTML = S.dk.isi.diktum.map((r, i) => `<div class="row g-2 mb-1"><div class="col-3 col-md-2"><input class="form-control" aria-label="Label" maxlength="40" value="${esc(r.label)}" oninput="dkSet('diktum',${i},'label',this.value)"></div><div class="col-8 col-md-9"><textarea class="form-control" rows="2" aria-label="Isi diktum" oninput="dkSet('diktum',${i},'teks',this.value)">${esc(r.teks)}</textarea></div><div class="col-1"><button type="button" class="btn-o sm" aria-label="Hapus" onclick="dkDel('diktum',${i},dkDik)"><i class="bi bi-x"></i></button></div></div>`).join(''); }
function dkDel(a, i, fn) { dkKumpul(); S.dk.isi[a].splice(i, 1); fn(); }
function dkTambahRin() { dkKumpul(); S.dk.isi.rincian.push({ k: '', v: '' }); dkRin(); }
function dkTambahPet() { dkKumpul(); S.dk.isi.lampiran.push({ peran: '', nama: '' }); dkPet(); }
function dkTambahDik() {
  dkKumpul(); const L = S.dk.isi.diktum, UR = ['KESATU', 'KEDUA', 'KETIGA', 'KEEMPAT', 'KELIMA', 'KEENAM', 'KETUJUH', 'KEDELAPAN', 'KESEMBILAN', 'KESEPULUH'];
  L.push({ label: UR[L.length] || '', teks: '' }); dkDik();
}
// lampiran SK: blok tabel atau teks
function dkLam() {
  const L = S.dk.isi.lampiran; $('dklam').innerHTML = L.map((b, i) => b.tipe === 'teks'
    ? `<div class="card-x mb-2"><div class="d-flex gap-2 mb-2"><input class="form-control" aria-label="Judul lampiran" placeholder="Judul lampiran" maxlength="200" value="${esc(b.judul)}" oninput="dkLamSet(${i},'judul',this.value)"><button type="button" class="btn-o sm" aria-label="Hapus lampiran" onclick="dkLamDel(${i})"><i class="bi bi-trash"></i></button></div><div id="dkrl${i}"></div></div>`
    : `<div class="card-x mb-2"><div class="d-flex gap-2 mb-2"><input class="form-control" aria-label="Judul lampiran" placeholder="Judul lampiran (opsional)" maxlength="200" value="${esc(b.judul)}" oninput="dkLamSet(${i},'judul',this.value)"><button type="button" class="btn-o sm" aria-label="Hapus lampiran" onclick="dkLamDel(${i})"><i class="bi bi-trash"></i></button></div>
    <div class="table-responsive"><table class="table table-sm mb-1"><thead><tr>${b.kolom.map((k, c) => `<th><input class="form-control form-control-sm" aria-label="Judul kolom ${c + 1}" maxlength="80" value="${esc(k)}" oninput="dkKolSet(${i},${c},this.value)"></th>`).join('')}<th></th></tr></thead><tbody>${b.baris.map((r, j) => `<tr>${b.kolom.map((k, c) => `<td><textarea class="form-control form-control-sm" rows="1" aria-label="${esc(k)} baris ${j + 1}" oninput="dkSel(${i},${j},${c},this.value)">${esc(r[c] || '')}</textarea></td>`).join('')}<td><button type="button" class="btn-o sm" aria-label="Hapus baris" onclick="dkBarisDel(${i},${j})"><i class="bi bi-x"></i></button></td></tr>`).join('')}</tbody></table></div>
    <div class="d-flex flex-wrap gap-2"><button type="button" class="btn-o sm" onclick="dkBarisAdd(${i})"><i class="bi bi-plus"></i> Baris</button><button type="button" class="btn-o sm" onclick="dkKolAdd(${i})"><i class="bi bi-layout-sidebar-inset-reverse"></i> Kolom</button>${b.kolom.length > 1 ? `<button type="button" class="btn-o sm" onclick="dkKolDel(${i})">Hapus kolom terakhir</button>` : ''}</div><input class="form-control form-control-sm mt-2" aria-label="Catatan" placeholder="Catatan di bawah tabel (opsional)" maxlength="600" value="${esc(b.catatan || '')}" oninput="dkLamSet(${i},'catatan',this.value)"></div>`).join('') || '<div class="muted small">Belum ada lampiran. Pilih bentuk di bawah — lampiran dapat berbeda untuk tiap jenis SK.</div>';
  dkLamMount();
}
function dkLamMount() { S.dkrl = []; S.dk.isi.lampiran.forEach((b, i) => { if (b.tipe === 'teks' && $('dkrl' + i)) { const h = b.html || (b.teks ? '<p>' + esc(b.teks).replace(/\n/g, '<br>') + '</p>' : ''); S.dkrl[i] = RTE.mount('dkrl' + i, { html: h, minTinggi: '140px', tinggi: '60vh', onUbah: () => { b.html = S.dkrl[i].get(); b.teks = ''; } }); } }); }
function dkTambahLam(k) { dkKumpul(); S.dk.isi.lampiran.push(k === 'teks' ? { tipe: 'teks', judul: '', teks: '', html: '', kolom: [], baris: [], catatan: '' } : { tipe: 'tabel', judul: '', kolom: DK_TEMPLATE[k].slice(), baris: [DK_TEMPLATE[k].map(() => '')], teks: '', catatan: '' }); dkLam(); }
const dkLamSet = (i, k, v) => { S.dk.isi.lampiran[i][k] = v; }, dkKolSet = (i, c, v) => { S.dk.isi.lampiran[i].kolom[c] = v; }, dkSel = (i, j, c, v) => { S.dk.isi.lampiran[i].baris[j][c] = v; };
function dkLamDel(i) { dkKumpul(); S.dk.isi.lampiran.splice(i, 1); dkLam(); }
function dkBarisAdd(i) { const b = S.dk.isi.lampiran[i]; b.baris.push(b.kolom.map(() => '')); dkLam(); }
function dkBarisDel(i, j) { S.dk.isi.lampiran[i].baris.splice(j, 1); dkLam(); }
function dkKolAdd(i) { const b = S.dk.isi.lampiran[i]; if (b.kolom.length >= 8) return toast('Maksimal 8 kolom.', 'warning'); b.kolom.push('Kolom ' + (b.kolom.length + 1)); b.baris.forEach(r => r.push('')); dkLam(); }
function dkKolDel(i) { const b = S.dk.isi.lampiran[i]; b.kolom.pop(); b.baris.forEach(r => r.pop()); dkLam(); }
// tautan ke Kalender
function dkPilihKegiatan() {
  dkKumpul(); const d = S.dk, k = (S.dkd.kegiatan || []).find(x => x.ID === d.agenda); if (!k) return; const I = d.isi, isi = (n) => (I.rincian.find(r => r.k === n) || (I.rincian.push({ k: n, v: '' }), I.rincian[I.rincian.length - 1]));
  if (!I.hal) { I.hal = k.Judul; $('dkh').value = k.Judul; } if (!d.judul) { d.judul = 'Nota Dinas ' + k.Judul; $('dkt').value = d.judul; }
  const hr = isi('Hari/Tanggal'); if (!hr.v) hr.v = dkHari(k.Tanggal) + (k.TanggalAkhir && k.TanggalAkhir !== k.Tanggal ? ' s.d. ' + dkHari(k.TanggalAkhir) : '');
  const wk = isi('Waktu'); if (!wk.v && k.Waktu) wk.v = k.Waktu + ' WIB'; const tp = isi('Tempat'); if (!tp.v && k.Lokasi) tp.v = k.Lokasi;
  $('dktp').value = k.Tanggal; dkRin();
}
async function dkTarikPetugas() {
  const tg = $('dktp').value; if (!tg) return toast('Pilih tanggal kegiatan.', 'warning'); dkKumpul();
  const r = await call('getPetugasTanggal', tg); if (!r) return; toast(r.message, r.data.ada ? 'success' : 'warning'); if (!r.data.ada) return;
  S.dk.isi.lampiran = r.data.petugas.map(p => ({ peran: p.peran, nama: p.nama })); if (!S.dk.isi.judulLampiran) { S.dk.isi.judulLampiran = 'PERSONIL ' + (r.data.petugas[0].kegiatan || 'KEGIATAN').toUpperCase() + ' ' + tglIndo(tg).toUpperCase(); $('dkjl').value = S.dk.isi.judulLampiran; } dkPet();
}
async function dkSimpan(e) {
  e.preventDefault(); dkKumpul(); const d = S.dk, b = $('dksv'); busy(b, true);
  const r = await call('simpanDokumen', { ID: d.id || undefined, UpdatedAt: d.ua || undefined, Jenis: d.jenis, Judul: d.judul, Tanggal: d.tanggal, AgendaID: d.agenda, IndeksID: d.indeks, Isi: d.isi }); busy(b, false);
  if (r) { toast(r.message); RENDER.dokumen(); }
}
async function dkHapus(id) { askReason('Hapus dokumen', async a => { const r = await call('hapusDokumen', id); if (r) { toast(r.message); RENDER.dokumen(); } }); }
function dkNomor(id) {
  const x = S.dkd.daftar.find(y => y.ID === id), D = S.dkd;
  openModal('Ambil nomor surat', `<form onsubmit="dkNomorGo(event,'${id}')"><p class="small muted">Nomor diambil dari register Nomor Surat dan melekat pada dokumen ini. Nomor tidak dapat diganti; bila dokumen batal, batalkan nomornya di menu Nomor Surat.</p>
  <div class="mb-3"><label class="lbl" for="dni">Indeks surat *</label><select id="dni" class="form-select" required><option value="">— pilih —</option>${(D.indeks || []).map(i => `<option value="${i.ID}" ${x.IndeksID === i.ID ? 'selected' : ''}>${esc(i.Kode)} — ${esc(i.Nama)}</option>`).join('')}</select></div>
  ${D.butuhPin ? '<div class="mb-3"><label class="lbl" for="dnp">PIN pengambil nomor *</label><input id="dnp" type="password" inputmode="numeric" class="form-control" autocomplete="off" required></div>' : ''}
  <button class="btn-x" id="dnb">Ambil nomor</button></form>`);
}
async function dkNomorGo(e, id) { e.preventDefault(); const b = $('dnb'); busy(b, true); const r = await call('nomorDokumen', id, $('dni').value, $('dnp') ? $('dnp').value : ''); busy(b, false); if (r) { closeModal(); toast(r.message); RENDER.dokumen(); } }
async function dkPetugas() {
  const r = await call('listAkun'); if (!r) return; const cur = new Set(S.dkd.petugas.map(p => p.Email));
  const L = r.data.akun.filter(a => a.Status === 'Aktif' && String(a.Roles).split(',').some(x => x !== 'Pegawai'));
  openModal('Penyusun Nota Dinas & SK', `<form onsubmit="dkPetugasSimpan(event)"><p class="muted small">Akun yang dicentang dapat menyusun dan mengambil nomor dokumen (akun tersebut juga harus ditunjuk sebagai pengambil nomor di menu Nomor Surat). Super Admin selalu dapat; Pimpinan hanya melihat dan mencetak.</p><div style="max-height:50vh;overflow:auto">${L.map(a => `<label class="d-flex gap-2 py-1"><input type="checkbox" name="dkpt" value="${esc(a.Email)}" ${cur.has(String(a.Email).toLowerCase()) ? 'checked' : ''}> <span>${esc(a.Nama || a.Email)} <span class="muted small">${esc(a.Roles)}</span></span></label>`).join('')}</div><button class="btn-x mt-3" id="dkpb">Simpan</button></form>`);
}
async function dkPetugasSimpan(e) { e.preventDefault(); const b = $('dkpb'); busy(b, true); const r = await call('aturPetugasDokumen', Array.from(document.querySelectorAll('[name=dkpt]:checked')).map(x => x.value)); busy(b, false); if (r) { closeModal(); toast(r.message); RENDER.dokumen(); } }

// ── Pratinjau dokumen (tampilan seperti hasil cetak; belum menjadi dokumen resmi) ──
const PRA_TTD = '<div class="ttd" style="border:1px dashed #888;padding:6px;margin:14px 0 0 auto;width:260px;text-align:center;font-size:10px;color:#555">[ Tempat tanda tangan / blok pengesahan elektronik ber-QR ]</div>';
/** Menampilkan isi dokumen dalam bingkai kertas A4 (iframe tanpa skrip) lengkap dengan kop surat. */
async function pratinjauDok(judul, isi, potret) {
  await muatKop(); const kopStr = kopTerpilihHtml(); const w = potret ? 794 : 1123;
  const css = `body{margin:0;background:#e5e7eb;font-family:'Times New Roman',serif;color:#000}.kertas{box-sizing:border-box;width:${w}px;max-width:100%;margin:12px auto;background:#fff;padding:${potret ? '18mm 20mm' : '12mm'};box-shadow:0 1px 6px rgba(0,0,0,.25);font-size:11px;min-height:${potret ? 1000 : 700}px}h2{text-align:center;font-size:13px;margin:6px 0 10px;line-height:1.35}table{border-collapse:collapse;width:100%}th,td{border:1px solid #000;padding:3px 4px;text-align:center;vertical-align:middle}td.l,th.l{text-align:left}th{background:#eee}.g{background:#ddd;font-weight:bold;text-align:left}.ttd{margin:14px 0 0 auto;width:260px;text-align:center}.sp{height:58px}.cat{margin-top:8px}`;
  openModal('Pratinjau: ' + judul, `<div class="alert alert-info small py-2 mb-2"><i class="bi bi-eye"></i> Pratinjau tampilan cetak. Isinya belum bernomor resmi/disahkan bila belum diproses. Pemisah halaman tampil sebagai garis tebal.</div><iframe title="Pratinjau dokumen" sandbox style="width:100%;height:68vh;border:1px solid #ccc;border-radius:6px;background:#e5e7eb" srcdoc="${esc(`<!doctype html><html lang="id"><head><meta charset="utf-8"><style>${css}</style></head><body><div class="kertas">${kopStr}${String(isi).replace(/<div style="page-break-before:always[^>]*>/g, m => '<hr style="border:0;border-top:4px solid #999;margin:24px -20mm">' + m)}</div></body></html>`)}"></iframe><div class="text-end mt-2"><button class="btn-o" data-bs-dismiss="modal">Tutup</button></div>`);
  const dlg = document.querySelector('#mdl .modal-dialog'); if (dlg) { dlg.classList.add('modal-xl'); $('mdl').addEventListener('hidden.bs.modal', () => dlg.classList.remove('modal-xl'), { once: true }); }
}
function dkIsiDokumen(x) { return dkBangun(x, { ttd: PRA_TTD }); }
const dkBangun = (x, c) => x.Jenis === 'SK' ? dkSK(x, c) : x.Jenis === 'Surat' ? dkSurat(x, c) : dkNota(x, c);
function dkPratinjau() { dkKumpul(); const d = S.dk; if (d.jenis === 'Surat') { window.__kop = { pakai: d.isi.kop !== false, id: d.isi.kopId || '' }; window.__kopS = d.isi.kopHtml || ''; } pratinjauDok(d.jenis + (d.judul ? ' — ' + d.judul : ''), dkIsiDokumen({ Jenis: d.jenis, Isi: d.isi, Nomor: d.nomor, Tanggal: d.tanggal }), true); }
async function dkPra(id) { const r = await call('getDokumenRinci', id); if (r) { dkKopSet(r.data); } if (r) pratinjauDok(r.data.Judul, dkIsiDokumen(r.data), true); }

// ── Cetak / pengesahan ──
const dkAda = (a) => Array.isArray(a) && a.length;
function dkNota(x, c) {
  const I = x.Isi, no = x.Nomor || '…………………………', kop = (I.kepada || []);
  const baris = (a, b) => `<tr><td style="width:70px;vertical-align:top;border:0;text-align:left">${a}</td><td style="width:12px;vertical-align:top;border:0;text-align:left">:</td><td style="border:0;text-align:left">${b}</td></tr>`;
  const T = 'style="border:0;text-align:left;padding:1px 2px"';
  const hdr = `<table style="width:100%;margin-bottom:6px">${baris('Yth.', kop.length > 1 ? '<ol style="margin:0;padding-left:18px">' + kop.map(k => `<li>${esc(k)}</li>`).join('') + '</ol>' : esc(kop[0] || ''))}${baris('Dari', esc(I.dari || ''))}${baris('Hal', esc(I.hal || ''))}${baris('Tanggal', esc(dkTgl(x.Tanggal)))}</table><hr style="border:0;border-top:1.5px solid #000;margin:4px 0 10px">`;
  const isi = I.isiHtml ? rtBlok(I.isiHtml) : (I.paragraf || []).map(p => `<p style="text-align:justify;text-indent:28px;margin:0 0 8px">${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
  const rin = dkAda(I.rincian) ? `<table style="margin:4px 0 8px 28px;width:auto">${I.rincian.map(r => `<tr><td ${T}>${esc(r.k)}</td><td ${T}>:</td><td ${T}>${esc(r.v)}</td></tr>`).join('')}</table>` : '';
  const tm = dkAda(I.tembusan) ? `<div style="margin-top:14px;font-size:11pt"><b>Tembusan:</b><ol style="margin:2px 0;padding-left:20px">${I.tembusan.map(t => `<li>${esc(t)}</li>`).join('')}</ol></div>` : '';
  let h = `<div style="font-size:12pt;line-height:1.4"><div style="text-align:center;font-weight:bold;text-decoration:underline;font-size:13pt">NOTA DINAS</div><div style="text-align:center;margin-bottom:10px">Nomor : ${esc(no)}</div>${hdr}${isi}${rin}${I.isiHtml || !I.penutup ? '' : `<p style="text-align:justify;text-indent:28px;margin:0 0 8px">${esc(I.penutup)}</p>`}${c.ttd}${tm}</div>`;
  if (dkAda(I.lampiran)) h += `<div style="page-break-before:always;font-size:12pt;line-height:1.5"><div style="text-align:center;font-weight:bold;margin-bottom:12px">${esc((I.judulLampiran || 'PERSONIL KEGIATAN').toUpperCase())}</div><table style="width:100%">${I.lampiran.map(r => `<tr><td ${T.replace('"', '"width:34%;')}>${esc(r.peran)}</td><td ${T}>:</td><td ${T}>${esc(r.nama)}</td></tr>`).join('')}</table></div>`;
  return h;
}
function dkSK(x, c) {
  const I = x.Isi, thn = (x.Tanggal || today()).slice(0, 4), no = x.Nomor ? x.Nomor + ' TAHUN ' + thn : '…………………………', ins = String(TP.instansi || '').toUpperCase(), P = 'style="border:0;text-align:left;vertical-align:top;padding:1px 3px"';
  const huruf = i => String.fromCharCode(97 + i) + '.', tentang = String(I.tentang || '').toUpperCase();
  const daftar = (L, f) => `<table style="width:100%">${L.map((t, i) => `<tr><td ${P.replace('"', '"width:26px;')}>${f(i)}</td><td ${P} colspan="1">${esc(t)}</td></tr>`).join('')}</table>`;
  let h = `<div style="font-size:12pt;line-height:1.4"><div style="text-align:center;font-weight:bold">KEPUTUSAN KEPALA ${esc(ins)}<br>NOMOR ${esc(no)}<br><br>TENTANG<br>${esc(tentang)}</div><div style="text-align:center;font-weight:bold;margin:10px 0">KEPALA ${esc(ins)},</div>
  <table style="width:100%"><tr><td ${P.replace('"', '"width:100px;')}>Menimbang</td><td ${P.replace('"', '"width:10px;')}>:</td><td ${P}>${daftar(I.menimbang || [], huruf)}</td></tr><tr><td ${P}>Mengingat</td><td ${P}>:</td><td ${P}>${daftar(I.mengingat || [], i => (i + 1) + '.')}</td></tr></table>
  <div style="text-align:center;font-weight:bold;margin:12px 0">M E M U T U S K A N :</div>
  <table style="width:100%"><tr><td ${P.replace('"', '"width:100px;')}>Menetapkan</td><td ${P.replace('"', '"width:10px;')}>:</td><td ${P}>${esc(I.menetapkan || 'KEPUTUSAN KEPALA ' + ins + ' TENTANG ' + tentang)}</td></tr>${(I.diktum || []).map(d => `<tr><td ${P}>${esc(d.label)}</td><td ${P}>:</td><td ${P}><div style="text-align:justify">${esc(d.teks).replace(/\n/g, '<br>')}</div></td></tr>`).join('')}</table>
  <div style="margin-top:14px;width:260px;margin-left:auto;font-size:11pt">${I.tempat || I.tanggalSK ? 'Ditetapkan di ' + esc(I.tempat || '…') + '<br>pada tanggal ' + esc(I.tanggalSK ? dkTgl(I.tanggalSK) : '…') : ''}</div>${c.ttd}`;
  if (dkAda(I.tembusan)) h += `<div style="margin-top:14px;font-size:11pt"><b>Tembusan:</b><ol style="margin:2px 0;padding-left:20px">${I.tembusan.map(t => `<li>${esc(t)}</li>`).join('')}</ol></div>`;
  h += '</div>';
  (I.lampiran || []).forEach((b, i) => {
    h += `<div style="page-break-before:always;font-size:12pt"><table style="width:100%;margin-bottom:10px"><tr><td ${P.replace('"', '"width:120px;')}>LAMPIRAN${(I.lampiran || []).length > 1 ? ' ' + (i + 1) : ''}</td><td ${P}>KEPUTUSAN KEPALA ${esc(ins)}<br>NOMOR : ${esc(no)}<br>TENTANG : ${esc(tentang)}</td></tr></table>${b.judul ? `<div style="text-align:center;font-weight:bold;margin:8px 0">${esc(b.judul.toUpperCase())}</div>` : ''}`;
    if (b.tipe === 'teks') h += b.html ? rtBlok(b.html) : `<div style="text-align:justify">${esc(b.teks).replace(/\n/g, '<br>')}</div>`;
    else h += `<table style="width:100%;font-size:11pt"><thead><tr>${b.kolom.map(k => `<th>${esc(k)}</th>`).join('')}</tr></thead><tbody>${b.baris.map(r => `<tr>${b.kolom.map((k, c2) => `<td class="l" style="text-align:left;vertical-align:top">${esc(r[c2] || '').replace(/\n/g, '<br>')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    if (b.catatan) h += `<p style="font-size:11pt;margin-top:6px">${esc(b.catatan)}</p>`;
    h += '</div>';
  });
  return h;
}
/** Mengatur pilihan kop sekali-pakai dari setelan surat bebas (nota dan SK memakai pilihan terakhir operator). */
function dkKopSet(x) { window.__kopS = x.Isi.kopHtml || ''; if (x.Jenis === 'Surat') window.__kop = { pakai: x.Isi.kop !== false, id: x.Isi.kopId || '' }; }
async function dkCetak(id) {
  const x = S.dkd.daftar.find(y => y.ID === id); if (!x) return; let opsi;
  if (x.Jenis === 'Surat') { const r = await call('getDokumenRinci', id); if (!r) return; const I = r.data.Isi; opsi = { pakai: I.kop !== false, id: I.kopId || '', sendiri: !!I.kopHtml }; }
  S.dkc = id; cetakForm(x.Jenis === 'SK' ? 'SK' : x.Jenis === 'Surat' ? 'surat' : 'Nota Dinas', 'dkCetakGo', opsi);
}
async function dkCetakGo(e) {
  e.preventDefault(); const id = S.dkc; const c = cetakAmbil(); if (!c) return; const r = await call('getDokumenRinci', id); if (!r) return; const x = r.data;
  if (c.tte && !x.Nomor) return toast('Ambil nomor surat terlebih dahulu sebelum diajukan untuk disahkan.', 'warning');
  if (c.tte && x.Terkunci) return toast('Dokumen ini sudah diajukan atau disahkan.', 'warning');
  window.__kopS = x.Isi.kopHtml || ''; closeModal(); const isi = dkBangun(x, c);
  await cetakAtauTte(c, x.Judul, x.Jenis === 'SK' ? 'Surat Keputusan' : x.Jenis === 'Surat' ? 'Surat' : 'Nota Dinas', true, isi, { Nomor: x.Nomor, Ref: 'dok:' + id, sesudah: async t => { await call('kaitkanTteDokumen', id, t.ID); } });
}

// ── Editor Word: isi nota dinas, surat bebas, dan lampiran teks SK ──
const RT_CSS = '<style>.rt{font-size:12pt;line-height:1.5;text-align:left}.rt p{margin:0 0 8px}.rt td,.rt th{text-align:left;vertical-align:top;padding:3px 5px}.rt table{margin:4px 0}.rt ul,.rt ol{margin:0 0 8px;padding-left:28px}</style>';
const rtBlok = h => RT_CSS + '<div class="rt">' + RTE.bersih(h) + '</div>';
const DK_TOKEN_SURAT = ['nomor', 'tanggal', 'tahun'];
function dkMountNota() { const I = S.dk.isi; const awal = I.isiHtml || ((I.paragraf || []).map(p => '<p style="text-align:justify;text-indent:28px">' + esc(p).replace(/\n/g, '<br>') + '</p>').join('') + (I.penutup ? '<p style="text-align:justify;text-indent:28px">' + esc(I.penutup) + '</p>' : '')); S.dkr = RTE.mount('dkrte', { html: awal, minTinggi: '300px', tinggi: '70vh' }); }
function dkFormSurat() {
  const I = S.dk.isi, sel = (id, L, v) => `<select id="${id}" class="form-select">${L.map(o => `<option ${String(v) === String(o) ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
  return `<div class="col-12"><div class="card-x" style="padding:10px"><div class="row g-2 align-items-end"><div class="col-6 col-md-2"><label class="lbl small" for="dskw">Kertas</label>${sel('dskw', ['A4', 'F4'], I.kertas)}</div><div class="col-6 col-md-2"><label class="lbl small" for="dsmg">Margin</label><select id="dsmg" class="form-select">${[['normal', 'Normal'], ['sempit', 'Sempit'], ['lebar', 'Lebar']].map(o => `<option value="${o[0]}" ${I.margin === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></div><div class="col-6 col-md-3"><label class="lbl small" for="dsfn">Font dasar</label>${sel('dsfn', ['Times New Roman', 'Arial', 'Calibri', 'Cambria', 'Courier New', 'Bookman Old Style'], I.font)}</div><div class="col-6 col-md-2"><label class="lbl small" for="dsuk">Ukuran (pt)</label>${sel('dsuk', [10, 11, 12, 13, 14], I.ukuran)}</div><div class="col-12 col-md-3"><label class="chk"><input type="checkbox" id="dskop" ${I.kop !== false ? 'checked' : ''} onchange="dkKopToggle()"> Cetak dengan kop surat</label></div></div>
  <div class="row g-2 mt-1"><div class="col-12 col-md-6"><label class="lbl small" for="dskid">Kop yang dipakai</label><select id="dskid" class="form-select" onchange="dkKopToggle()"><option value="" ${!I.kopId ? 'selected' : ''}>Kop utama</option>${((S.kop && S.kop.template) || []).map(t => `<option value="${esc(t.ID)}" ${I.kopId === t.ID ? 'selected' : ''}>${esc(t.Nama)}</option>`).join('')}<option value="__sendiri" ${I.kopId === '__sendiri' ? 'selected' : ''}>Kop buatan sendiri (edit seperti Word)</option></select></div></div>
  <div id="dkkw" style="display:${I.kop !== false && I.kopId === '__sendiri' ? 'block' : 'none'}" class="mt-2"><div class="d-flex flex-wrap gap-2 mb-1"><button type="button" class="btn btn-sm btn-outline-secondary" onclick="dkKopIsi()"><i class="bi bi-card-heading"></i> Isi dari kop utama</button><span class="muted small align-self-center">Logo tidak dapat disisipkan di sini; gunakan teks dan garis pemisah. Untuk kop berlogo, buat template kop di Master Data ▸ Kop Surat.</span></div><div id="dkrk"></div></div></div></div></div>
  <div class="col-12"><div class="lbl">Isi surat (editor seperti Word) — penanda <code>{nomor}</code>, <code>{tanggal}</code>, <code>{tahun}</code> terisi saat dicetak; tanda tangan/QR otomatis di akhir surat</div><div id="dkrte"></div></div>`;
}
function dkMountSurat() { S.dkr = RTE.mount('dkrte', { html: S.dk.isi.html || '', token: DK_TOKEN_SURAT, minTinggi: '420px', tinggi: '75vh' }); S.dkk = RTE.mount('dkrk', { html: S.dk.isi.kopHtml || '', minTinggi: '110px', tinggi: '30vh' }); }
function dkKopToggle() { const on = $('dskop').checked; $('dskid').disabled = !on; $('dkkw').style.display = on && $('dskid').value === '__sendiri' ? 'block' : 'none'; if (on && $('dskid').value === '__sendiri' && S.dkk && !dkKopTeks()) dkKopIsi(); }
/** Isi kop buatan sendiri; kosong bila tidak ada teks sama sekali. */
function dkKopTeks() { const h = S.dkk ? S.dkk.get() : ''; return h.replace(/<[^>]*>|&nbsp;|\s/g, '') ? h : ''; }
async function dkKopIsi() {
  const k = await muatKop(); if (!k || !k.cfg) return; const c = k.cfg;
  const h = (c.baris || []).filter(b => b.teks).map(b => `<p style="text-align:center;line-height:1.2"><span style="font-size:${Math.min(Math.max(Math.round(b.ukuran || 12), 8), 24)}pt">${b.tebal ? '<b>' : ''}${esc(b.teks)}${b.tebal ? '</b>' : ''}</span></p>`).join('') + '<hr>';
  S.dkk.set(h);
}
const DK_KERTAS = { A4: '210mm 297mm', F4: '215mm 330mm' }, DK_MARGIN = { normal: '18mm 20mm', sempit: '12mm 15mm', lebar: '25mm 30mm' };
function dkSurat(x, c) {
  const I = x.Isi, tgl = dkTgl(x.Tanggal), thn = (x.Tanggal || today()).slice(0, 4), no = x.Nomor || '…………………………';
  const h = RTE.bersih(I.html).replace(/\{(nomor|tanggal|tahun)\}/g, (m, k) => esc(k === 'nomor' ? no : k === 'tanggal' ? tgl : thn));
  return `<style>@page{size:${DK_KERTAS[I.kertas] || DK_KERTAS.A4};margin:${DK_MARGIN[I.margin] || DK_MARGIN.normal}}font-family:'${I.font || 'Times New Roman'}',serif;font-size:${I.ukuran || 12}pt}</style>${RT_CSS}<div class="rt">${h}</div>${c.ttd}`;
}
// ── Template: dipakai ulang, dibagikan, atau dihapus ──
function dkBarTpl() {
  const d = S.dk; return `<section class="card-x mb-3"><div class="d-flex flex-wrap align-items-center gap-2"><i class="bi bi-collection"></i><b class="me-2">Template ${esc(d.jenis)}</b>${d.id ? '' : '<button type="button" class="btn-o sm" onclick="dkTplPilih()"><i class="bi bi-box-arrow-in-down"></i> Mulai dari template</button>'}<button type="button" class="btn-o sm" onclick="dkTplSimpan()"><i class="bi bi-bookmark-plus"></i> Simpan sebagai template</button><button type="button" class="btn-o sm" onclick="dkTplKelola()"><i class="bi bi-gear"></i> Kelola template</button></div></section>`;
}
async function dkTplDaftar() { const r = await call('getTemplateDok', S.dk.jenis); return r ? r.data : null; }
async function dkTplPilih() {
  const L = await dkTplDaftar(); if (!L) return; S.dkt = L;
  openModal('Mulai dari template ' + S.dk.jenis, L.length ? `<p class="muted small">Isi dokumen saat ini akan diganti isi template. Judul, tanggal, dan nomor tidak berubah.</p><div style="max-height:55vh;overflow:auto">${L.map((x, i) => `<div class="todo"><i class="bi bi-file-earmark-text"></i><div class="grow"><b>${esc(x.Nama)}</b><small>${x.Bersama ? 'Dibagikan' : 'Pribadi'} · ${esc(x.Pembuat)}</small></div><button class="btn-x sm" onclick="dkTplTerapkan(${i})">Pakai</button></div>`).join('')}</div>` : '<p class="muted mb-0">Belum ada template untuk jenis ini. Susun dokumen lalu klik <b>Simpan sebagai template</b>.</p>');
}
function dkTplTerapkan(i) { dkKumpul(); const t = S.dkt[i], d = S.dk; d.isi = JSON.parse(JSON.stringify(t.Isi)); if (!d.isi.lampiran) d.isi.lampiran = []; closeModal(); dkEditor(); toast('Template “' + t.Nama + '” dipakai.'); }
function dkTplSimpan() {
  dkKumpul(); openModal('Simpan sebagai template', `<form onsubmit="dkTplSimpanGo(event)"><p class="muted small">Isi dokumen saat ini (tanpa nomor) disimpan sebagai template ${esc(S.dk.jenis)} yang dapat dipakai ulang.</p><div class="mb-3"><label class="lbl" for="tpn">Nama template *</label><input id="tpn" class="form-control" required minlength="3" maxlength="80"></div><label class="chk mb-3"><input type="checkbox" id="tpb"> Bagikan ke penyusun lain</label><div class="text-end"><button class="btn-x" id="tps">Simpan</button></div></form>`);
}
async function dkTplSimpanGo(e) { e.preventDefault(); const b = $('tps'); busy(b, true); const r = await call('simpanTemplateDok', { Jenis: S.dk.jenis, Nama: $('tpn').value, Isi: S.dk.isi, Bersama: $('tpb').checked }); busy(b, false); if (r) { closeModal(); toast(r.message); } }
async function dkTplKelola() {
  const L = await dkTplDaftar(); if (!L) return; S.dkt = L;
  openModal('Kelola template ' + S.dk.jenis, L.length ? `<div style="max-height:60vh;overflow:auto">${L.map((x, i) => `<div class="todo"><i class="bi bi-file-earmark-text"></i><div class="grow"><b>${esc(x.Nama)}</b><small>${x.Bersama ? 'Dibagikan' : 'Pribadi'} · ${esc(x.Pembuat)}</small></div>${x.Milik || isAdmin() ? `<button class="btn-o sm" onclick="dkTplUbah(${i})" title="Ganti nama / bagikan"><i class="bi bi-pencil"></i></button><button class="btn-o sm" onclick="dkTplHapus('${x.ID}')" title="Hapus"><i class="bi bi-trash"></i></button>` : ''}</div>`).join('')}</div>` : '<p class="muted mb-0">Belum ada template.</p>');
}
function dkTplUbah(i) { const x = S.dkt[i]; openModal('Ubah template', `<form onsubmit="dkTplUbahGo(event,${i})"><div class="mb-3"><label class="lbl" for="tpn">Nama *</label><input id="tpn" class="form-control" required minlength="3" maxlength="80" value="${esc(x.Nama)}"></div><label class="chk mb-3"><input type="checkbox" id="tpb" ${x.Bersama ? 'checked' : ''}> Bagikan ke penyusun lain</label><div class="text-end"><button class="btn-x" id="tps">Simpan</button></div></form>`); }
async function dkTplUbahGo(e, i) { e.preventDefault(); const x = S.dkt[i], r = await call('simpanTemplateDok', { ID: x.ID, Nama: $('tpn').value, Bersama: $('tpb').checked }); if (r) { toast(r.message); dkTplKelola(); } }
async function dkTplHapus(id) { const r = await call('hapusTemplateDok', id); if (r) { toast(r.message); dkTplKelola(); } }
(window.MOD = window.MOD || []).push('Dokumen');
