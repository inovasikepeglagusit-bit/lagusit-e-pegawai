// ── Kop surat: dibuat dari pengaturan Super Admin (model, tulisan, gaya, logo); dipakai laporan dan register nomor surat saat dicetak ──
const KOP_NAMA = { klasik: 'Klasik (logo kiri, teks tengah)', 'dua-logo': 'Dua logo (kiri dan kanan)', 'rata-kiri': 'Rata kiri', tengah: 'Logo di atas', modern: 'Modern (garis aksen)', minimalis: 'Minimalis (tanpa logo)' };
/** HTML kop dari k = {cfg, logoKiri, logoKanan} (hasil getKop atau satu template). Hanya memakai gaya sebaris agar sama di layar, kertas, dan dokumen beku. */
const KOP_DEF = { spasiBaris: 1.25, jarakBaris: 0, jarakLogo: 14, padBawah: 10, marBawah: 14, tebalGaris: 0, rata: 'auto' };
function kopGaris(c) {
  const w = Number(c.tebalGaris) || 0, W = { ganda: w ? Math.max(w, 3) : 4, tebal: w || 3, sedang: w || 2, tipis: w || 1, putus: w || 2, titik: w || 2 }[c.garis];
  if (c.garis === 'tanpa' || !W) return 'none'; const g = { ganda: 'double', tebal: 'solid', sedang: 'solid', tipis: 'solid', putus: 'dashed', titik: 'dotted' }[c.garis];
  return W + 'px ' + g + ' ' + c.warnaGaris;
}
function kopHtml(k) {
  if (!k || !k.cfg) return '';
  const c = Object.assign({}, KOP_DEF, k.cfg), z = c.logoUkuran, kiri = k.logoKiri || (c.pakaiLogoApp && TP.logo ? TP.logo : ''), kanan = k.logoKanan || '';
  const img = s => s ? `<img src="${esc(s)}" alt="" style="width:${z}px;height:${z}px;object-fit:contain;flex:none">` : `<span style="width:${z}px;flex:none"></span>`;
  const baris = b => `<div style="font-size:${b.ukuran}pt;font-weight:${b.tebal ? 800 : 500};${b.kapital ? 'text-transform:uppercase;' : ''}${b.miring ? 'font-style:italic;' : ''}${b.garisBawah ? 'text-decoration:underline;' : ''}${b.font ? `font-family:'${esc(b.font)}',serif;` : ''}${b.warna ? 'color:' + esc(b.warna) + ';' : ''}${b.spasiHuruf ? 'letter-spacing:' + Number(b.spasiHuruf) + 'px;' : ''}${b.jarakAtas ? 'margin-top:' + Number(b.jarakAtas) + 'px;' : ''}">${esc(b.teks)}</div>`;
  const T = al => { const a = c.rata && c.rata !== 'auto' ? c.rata : al; return `<div style="flex:1;min-width:0;text-align:${a};line-height:${c.spasiBaris};${c.jarakBaris ? 'display:flex;flex-direction:column;gap:' + c.jarakBaris + 'px;' : ''}">${c.baris.filter(b => b.teks).map(baris).join('')}</div>`; };
  const gr = kopGaris(c);
  let h;
  switch (c.model) {
    case 'dua-logo': h = `${img(kiri)}${T('center')}${img(kanan)}`; break;
    case 'rata-kiri': h = `${kiri ? img(kiri) : ''}${T('left')}`; break;
    case 'tengah': h = `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px">${kiri ? img(kiri) : ''}${T('center').replace('flex:1;', 'width:100%;')}</div>`; break;
    case 'modern': h = `<span style="width:7px;align-self:stretch;background:${c.warnaGaris};border-radius:4px;flex:none"></span>${T('left')}${kiri ? img(kiri) : ''}`; break;
    case 'minimalis': h = T('center'); break;
    default: h = `${img(kiri)}${T('center')}<span style="width:${z}px;flex:none"></span>`;
  }
  return `<div class="kopx" style="display:flex;align-items:center;gap:${c.jarakLogo}px;font-family:'${c.font}',serif;color:${c.warnaTeks};padding-bottom:${c.padBawah}px;margin-bottom:${c.marBawah}px;${c.model === 'modern' ? '' : 'border-bottom:' + gr + ';'}">${h}</div>${c.model === 'modern' && c.garis !== 'tanpa' ? `<div style="height:0;border-top:${gr};margin:-6px 0 ${c.marBawah}px"></div>` : ''}`;
}
async function muatKop(segar) { if (S.kop && !segar) return S.kop; const r = await call('getKop'); if (r) S.kop = r.data; return S.kop; }
/** Kop menurut ID: '' = kop utama, selain itu ID template. Bila template sudah dihapus, kembali ke kop utama. */
function kopById(id) { const k = S.kop; if (!k) return null; if (!id) return k; const t = (k.template || []).find(x => x.ID === id); return t || k; }

// ── Pilihan kop saat mencetak: pakai kop atau tidak, dan kop mana ──
const kopSimpanPil = () => { try { return JSON.parse(localStorage.getItem('lagusit_kop') || '{}'); } catch (e) { return {}; } };
/** Pilihan terakhir operator; bawaan: pakai kop utama. */
function kopPil() { const p = kopSimpanPil(); return { pakai: p.pakai !== false, id: p.id || '' }; }
/** Kontrol pilihan kop untuk dialog cetak. opsi: {pakai, id, sendiri:true} untuk surat yang punya kop buatan sendiri. */
function kopPilihUi(opsi) {
  opsi = opsi || {}; const p = Object.assign(kopPil(), opsi.pakai === undefined ? {} : { pakai: opsi.pakai }, opsi.id === undefined ? {} : { id: opsi.id }), T = (S.kop && S.kop.template) || [];
  return `<div class="mb-3" id="kpbox"><div class="lbl">Kop surat</div><label class="d-flex gap-2 align-items-center mb-1"><input type="checkbox" id="kpPakai" ${p.pakai ? 'checked' : ''} onchange="kopPilihTampil()"> <span>Cetak dengan kop surat</span></label><select id="kpId" class="form-select" aria-label="Pilih kop surat" ${p.pakai ? '' : 'disabled'}><option value="" ${!p.id ? 'selected' : ''}>Kop utama</option>${T.map(t => `<option value="${esc(t.ID)}" ${p.id === t.ID ? 'selected' : ''}>${esc(t.Nama)}</option>`).join('')}${opsi.sendiri ? `<option value="__sendiri" ${p.id === '__sendiri' ? 'selected' : ''}>Kop buatan sendiri (surat ini)</option>` : ''}</select></div>`;
}
function kopPilihTampil() { const s = $('kpId'); if (s) s.disabled = !$('kpPakai').checked; }
/** Membaca kontrol pada dialog cetak, mengingatnya, lalu menyimpannya untuk dipakai satu kali oleh cetakBuka / pratinjauDok. */
function kopPilihBaca() {
  const c = $('kpPakai'); if (!c) { window.__kop = null; return; }
  const p = { pakai: c.checked, id: $('kpId').value }; window.__kop = p;
  if (p.id !== '__sendiri') { try { localStorage.setItem('lagusit_kop', JSON.stringify(p)); } catch (e) {} }
}
/** HTML kop sesuai pilihan yang sedang berlaku (dialog cetak bila ada, selain itu pilihan terakhir). Pilihan sekali-pakai dihabiskan di sini. */
function kopTerpilihHtml(opsi) {
  const p = window.__kop || kopPil(); window.__kop = null; if (opsi && opsi.tanpaKop) return ''; if (!p.pakai) return '';
  if (p.id === '__sendiri') return window.__kopS ? RTE.bersih(window.__kopS) : kopHtml(kopById(''));
  return kopHtml(kopById(p.id));
}
/** Kop untuk laporan di layar (dicetak lewat Ctrl+P): mengikuti pilihan terakhir; selektor ada di bilah alat laporan. */
function kopLapHtml() { const p = kopPil(); return p.pakai ? kopHtml(kopById(p.id)) : ''; }
function kopLayarUi() {
  const p = kopPil(), T = (S.kop && S.kop.template) || [];
  return `<select class="form-select form-select-sm no-print" style="width:auto;max-width:210px" aria-label="Kop surat pada cetakan" onchange="kopLayarGanti(this.value)"><option value="-" ${!p.pakai ? 'selected' : ''}>Tanpa kop surat</option><option value="" ${p.pakai && !p.id ? 'selected' : ''}>Kop utama</option>${T.map(t => `<option value="${esc(t.ID)}" ${p.pakai && p.id === t.ID ? 'selected' : ''}>${esc(t.Nama)}</option>`).join('')}</select>`;
}
function kopLayarGanti(v) { try { localStorage.setItem('lagusit_kop', JSON.stringify(v === '-' ? { pakai: false, id: kopPil().id } : { pakai: true, id: v })); } catch (e) {} document.querySelectorAll('.kop-lap').forEach(e => e.innerHTML = kopLapHtml()); }

// ── Tab Kop Surat (Master Data): kop utama dan beberapa template kop ──
MT.kop = async () => { const r = await call('getKop'); if (!r) return; S.kop = r.data; kopMuatEdit(S.kopT || ''); mb(kopForm()); kopPrev(); };
/** Memuat salinan kop yang akan diedit: '' = kop utama, selain itu ID template. */
function kopMuatEdit(id) {
  const k = S.kop, t = id ? k.template.find(x => x.ID === id) : null; if (id && !t) id = '';
  S.kopT = id; const src = t || k;
  S.kopE = { cfg: JSON.parse(JSON.stringify(src.cfg)), logoKiri: src.logoKiri || '', logoKanan: src.logoKanan || '', baru: {}, model: k.model, font: k.font, garis: k.garis, rata: k.rata, barisMaks: k.barisMaks };
  S.kopE.cfg = Object.assign({}, KOP_DEF, S.kopE.cfg);
}
function kopPilihEdit(id) { kopMuatEdit(id); mb(kopForm()); kopPrev(); }
const KOP_RATA_NAMA = { auto: 'Ikut model', left: 'Rata kiri', center: 'Tengah', right: 'Rata kanan' }, KOP_GARIS_NAMA = { ganda: 'Ganda', tebal: 'Tebal', sedang: 'Sedang', tipis: 'Tipis', putus: 'Putus-putus', titik: 'Titik-titik', tanpa: 'Tanpa garis' };
function kopForm() {
  const k = S.kopE, c = k.cfg, n = k.barisMaks || 8, B = c.baris.concat(Array(n).fill(null)).slice(0, n), T = S.kop.template || [], sel = S.kopT || '';
  const num = (id, lab, v, mn, mx, st, sat) => `<div class="col-6 col-md-4"><label class="lbl" for="${id}">${lab}${sat ? ' (' + sat + ')' : ''}</label><input id="${id}" type="number" class="form-control" min="${mn}" max="${mx}" step="${st || 1}" value="${v}" oninput="kopUbah()"></div>`;
  const fontOpsi = (v, kosong) => (kosong ? `<option value="" ${!v ? 'selected' : ''}>${kosong}</option>` : '') + k.font.map(f => `<option ${v === f ? 'selected' : ''}>${f}</option>`).join('');
  return `<div class="card-x mb-3"><div class="row g-2 align-items-end"><div class="col-md-5"><label class="lbl" for="kopT">Yang sedang diedit</label><select id="kopT" class="form-select" onchange="kopPilihEdit(this.value)"><option value="" ${!sel ? 'selected' : ''}>Kop utama (bawaan semua cetakan)</option>${T.map(t => `<option value="${esc(t.ID)}" ${sel === t.ID ? 'selected' : ''}>Template: ${esc(t.Nama)}</option>`).join('')}</select></div>
  <div class="col-md-7 d-flex flex-wrap gap-2 justify-content-md-end"><button type="button" class="btn-o" onclick="kopTplBaru()"><i class="bi bi-plus-lg"></i> Simpan sebagai template baru</button>${sel ? '<button type="button" class="btn-o" onclick="kopTplNama()"><i class="bi bi-pencil"></i> Ubah nama</button><button type="button" class="btn-o" onclick="kopJadikanUtama()"><i class="bi bi-star"></i> Jadikan kop utama</button><button type="button" class="btn-o danger" onclick="kopTplHapus()"><i class="bi bi-trash"></i> Hapus</button>' : ''}</div></div>
  <p class="muted small mt-2 mb-0">Kop utama dipakai bila operator tidak memilih kop lain. Buat beberapa <b>template kop</b> (mis. kop kantor, kop bidang, kop tanpa logo); operator memilih template yang dipakai di jendela cetak setiap dokumen (maksimal ${S.kop.templateMaks || 12} template, ${T.length} terpakai).</p></div>
  <div class="row g-3"><div class="col-xl-6"><div class="card-x"><h3 class="h6">${sel ? 'Template: ' + esc((T.find(x => x.ID === sel) || {}).Nama || '') : 'Kop utama'}</h3>
  <label class="lbl">Model</label><div class="kmod">${k.model.map(m => `<label class="${c.model === m ? 'on' : ''}"><input type="radio" name="km" value="${m}" ${c.model === m ? 'checked' : ''} onchange="kopUbah()"><span>${esc(KOP_NAMA[m])}</span></label>`).join('')}</div>
  <label class="lbl mt-3">Tulisan (maksimal ${n} baris; baris kosong dilewati). Buka “Atur lebih rinci” untuk font, warna, dan jarak tiap baris.</label>${B.map((b, i) => `<div class="kbar"><input class="form-control" data-b="t${i}" maxlength="140" placeholder="Baris ${i + 1}" value="${esc(b ? b.teks : '')}" oninput="kopUbah()" aria-label="Teks baris ${i + 1}"><input type="number" class="form-control" data-b="u${i}" min="8" max="40" value="${b ? b.ukuran : 11}" oninput="kopUbah()" aria-label="Ukuran huruf baris ${i + 1}" title="Ukuran huruf (pt)"><label title="Tebal"><input type="checkbox" data-b="b${i}" ${b && b.tebal ? 'checked' : ''} onchange="kopUbah()"> <b>T</b></label><label title="HURUF KAPITAL"><input type="checkbox" data-b="k${i}" ${b && b.kapital ? 'checked' : ''} onchange="kopUbah()"> Aa</label><label title="Miring"><input type="checkbox" data-b="i${i}" ${b && b.miring ? 'checked' : ''} onchange="kopUbah()"> <i>M</i></label><label title="Garis bawah"><input type="checkbox" data-b="g${i}" ${b && b.garisBawah ? 'checked' : ''} onchange="kopUbah()"> <u>G</u></label></div>
  <details class="kdet mb-1"><summary class="muted small">Atur lebih rinci baris ${i + 1}</summary><div class="row g-2 mt-0 mb-2"><div class="col-12 col-md-5"><label class="lbl small" for="kf${i}">Font baris ini</label><select id="kf${i}" data-b="f${i}" class="form-select form-select-sm" onchange="kopUbah()">${fontOpsi(b ? b.font : '', 'Ikut font kop')}</select></div><div class="col-4 col-md-2"><label class="lbl small" for="kw${i}">Warna</label><input id="kw${i}" data-b="w${i}" type="color" class="form-control form-control-color form-control-sm" value="${b && b.warna ? b.warna : c.warnaTeks}" oninput="this.dataset.set=1;kopUbah()" data-set="${b && b.warna ? 1 : ''}"></div><div class="col-4 col-md-2"><label class="lbl small" for="ks${i}">Jarak huruf</label><input id="ks${i}" data-b="s${i}" type="number" class="form-control form-control-sm" min="0" max="8" step="0.5" value="${b ? b.spasiHuruf || 0 : 0}" oninput="kopUbah()"></div><div class="col-4 col-md-3"><label class="lbl small" for="ka${i}">Jarak atas (px)</label><input id="ka${i}" data-b="a${i}" type="number" class="form-control form-control-sm" min="0" max="30" value="${b ? b.jarakAtas || 0 : 0}" oninput="kopUbah()"></div></div></details>`).join('')}
  <h4 class="h6 mt-3">Tampilan umum</h4><div class="row g-2"><div class="col-6 col-md-4"><label class="lbl" for="kf">Font dasar</label><select id="kf" class="form-select" onchange="kopUbah()">${fontOpsi(c.font)}</select></div><div class="col-6 col-md-4"><label class="lbl" for="kra">Perataan teks</label><select id="kra" class="form-select" onchange="kopUbah()">${(k.rata || ['auto', 'left', 'center', 'right']).map(f => `<option value="${f}" ${c.rata === f ? 'selected' : ''}>${KOP_RATA_NAMA[f]}</option>`).join('')}</select></div><div class="col-6 col-md-4"><label class="lbl" for="kg">Garis bawah</label><select id="kg" class="form-select" onchange="kopUbah()">${k.garis.map(f => `<option value="${f}" ${c.garis === f ? 'selected' : ''}>${KOP_GARIS_NAMA[f] || f}</option>`).join('')}</select></div>
  ${num('ktg', 'Tebal garis', c.tebalGaris, 0, 8, 1, '0 = bawaan gaya')}<div class="col-6 col-md-4"><label class="lbl" for="kwg">Warna garis</label><input id="kwg" type="color" class="form-control form-control-color" value="${c.warnaGaris}" oninput="kopUbah()"></div><div class="col-6 col-md-4"><label class="lbl" for="kwt">Warna teks</label><input id="kwt" type="color" class="form-control form-control-color" value="${c.warnaTeks}" oninput="kopUbah()"></div></div>
  <h4 class="h6 mt-3">Jarak dan spasi</h4><div class="row g-2">${num('ksb', 'Spasi antarbaris', c.spasiBaris, 0.9, 2.5, 0.05, 'kali tinggi huruf')}${num('kjb', 'Jarak antarbaris', c.jarakBaris, 0, 20, 1, 'px')}${num('kjl', 'Jarak logo ke teks', c.jarakLogo, 0, 60, 1, 'px')}${num('kpb', 'Jarak teks ke garis', c.padBawah, 0, 40, 1, 'px')}${num('kmb', 'Jarak kop ke isi surat', c.marBawah, 0, 60, 1, 'px')}
  <div class="col-12"><label class="lbl" for="kz">Ukuran logo: <span id="kzv">${c.logoUkuran}</span> px</label><input id="kz" type="range" class="form-range" min="30" max="160" step="2" value="${c.logoUkuran}" oninput="kopUbah()"></div></div>
  <h4 class="h6 mt-3">Logo</h4><label class="d-flex align-items-center gap-2 mb-2"><input type="checkbox" id="kpa" ${c.pakaiLogoApp ? 'checked' : ''} onchange="kopUbah()"> Pakai logo aplikasi bila logo kiri tidak diunggah</label>
  <div class="d-flex flex-wrap gap-2 align-items-center mb-1"><b class="small">Kiri</b><input type="file" id="klk" accept="image/png,image/jpeg" class="form-control" style="max-width:230px" onchange="kopLogo('logoKiri',this)"><button type="button" class="btn-o sm" onclick="kopHapusLogo('logoKiri')">Hapus</button></div>
  <div class="d-flex flex-wrap gap-2 align-items-center"><b class="small">Kanan</b><input type="file" id="klr" accept="image/png,image/jpeg" class="form-control" style="max-width:230px" onchange="kopLogo('logoKanan',this)"><button type="button" class="btn-o sm" onclick="kopHapusLogo('logoKanan')">Hapus</button></div>
  <div class="text-end mt-3">${sel ? '' : '<button type="button" class="btn-o" onclick="kopReset()">Kembalikan bawaan</button> '}<button type="button" class="btn-x" onclick="kopSimpan()">${sel ? 'Simpan perubahan template' : 'Simpan kop utama'}</button></div></div></div>
  <div class="col-xl-6"><div class="card-x kpin"><h3 class="h6">Pratinjau (seperti saat dicetak)</h3><div class="kpage" id="kopPrev"></div><p class="muted small mt-2 mb-0">Isi dokumen muncul di bawah kop ini.</p></div></div></div>`;
}
function kopBaca() {
  const k = S.kopE, B = [], n = k.barisMaks || 8, g = (a, i) => document.querySelector(`[data-b=${a}${i}]`);
  for (let i = 0; i < n; i++) { const t = g('t', i); if (!t) continue; const w = g('w', i);
    B.push({ teks: t.value, ukuran: Number(g('u', i).value) || 11, tebal: g('b', i).checked, kapital: g('k', i).checked, miring: g('i', i).checked, garisBawah: g('g', i).checked, font: g('f', i).value, warna: w.dataset.set ? w.value : '', spasiHuruf: Number(g('s', i).value) || 0, jarakAtas: Number(g('a', i).value) || 0 }); }
  const m = document.querySelector('[name=km]:checked'), nv = (id, d) => { const v = $(id).value; return v === '' || isNaN(Number(v)) ? d : Number(v); };
  return { model: m ? m.value : k.cfg.model, font: $('kf').value, rata: $('kra').value, garis: $('kg').value, tebalGaris: nv('ktg', 0), warnaGaris: $('kwg').value, warnaTeks: $('kwt').value, logoUkuran: Number($('kz').value), pakaiLogoApp: $('kpa').checked, spasiBaris: nv('ksb', 1.25), jarakBaris: nv('kjb', 0), jarakLogo: nv('kjl', 14), padBawah: nv('kpb', 10), marBawah: nv('kmb', 14), baris: B };
}
function kopUbah() {
  S.kopE.cfg = kopBaca(); $('kzv').textContent = S.kopE.cfg.logoUkuran; document.querySelectorAll('.kmod label').forEach(l => l.classList.toggle('on', l.querySelector('input').checked)); kopPrev();
}
function kopPrev() { const e = $('kopPrev'); if (e) e.innerHTML = kopHtml(S.kopE) + '<div class="kisi"><i></i><i></i><i style="width:70%"></i></div>'; }
async function kopLogo(sisi, inp) {
  const f = inp.files[0]; if (!f) return; if (f.size > 3 * 1024 * 1024) { inp.value = ''; return toast('Berkas logo maksimal 3 MB.', 'warning'); }
  try { let u = '', z = 200; for (; z >= 64; z -= 32) { u = await olahGambar(f, z, z, 'fit', 'image/png'); if (u.length <= 42000) break; } if (u.length > 42000) throw new Error('Logo terlalu rumit. Gunakan gambar yang lebih sederhana.'); S.kopE.baru[sisi] = u; S.kopE[sisi] = u; kopPrev(); } catch (e) { toast(e.message, 'danger'); } inp.value = '';
}
function kopHapusLogo(sisi) { S.kopE.baru[sisi] = ''; S.kopE[sisi] = ''; kopPrev(); }
function kopSetelahSimpan(r, pilih) { S.kop = r.data; kopMuatEdit(pilih === undefined ? S.kopT : pilih); toast(r.message); mb(kopForm()); kopPrev(); }
async function kopSimpan() {
  S.kopE.cfg = kopBaca();
  if (S.kopT) { const t = S.kop.template.find(x => x.ID === S.kopT); const r = await call('simpanKopTemplate', { ID: S.kopT, Nama: t.Nama, cfg: S.kopE.cfg, logoKiri: S.kopE.logoKiri, logoKanan: S.kopE.logoKanan }); if (r) kopSetelahSimpan(r, S.kopT); return; }
  const d = { cfg: S.kopE.cfg }; Object.keys(S.kopE.baru).forEach(k => d[k] = S.kopE.baru[k]);
  const r = await call('simpanKop', d); if (r) kopSetelahSimpan(r, '');
}
function kopTplBaru() {
  S.kopE.cfg = kopBaca(); openModal('Simpan sebagai template kop', `<form onsubmit="kopTplBaruGo(event)"><p class="muted small">Template menyimpan semua setelan dan logo yang sedang tampil di editor.</p><label class="lbl" for="ktn">Nama template</label><input id="ktn" class="form-control" required minlength="3" maxlength="60" placeholder="mis. Kop Bidang Kepegawaian"><div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">Simpan template</button></div></form>`);
}
async function kopTplBaruGo(e) {
  e.preventDefault(); const b = e.target.querySelector('[type=submit]'); busy(b, true);
  const r = await call('simpanKopTemplate', { Nama: $('ktn').value, cfg: S.kopE.cfg, logoKiri: S.kopE.logoKiri, logoKanan: S.kopE.logoKanan }); busy(b, false); if (r) { closeModal(); kopSetelahSimpan(r, r.data.dipilih); }
}
function kopTplNama() {
  const t = S.kop.template.find(x => x.ID === S.kopT); if (!t) return;
  openModal('Ubah nama template kop', `<form onsubmit="kopTplNamaGo(event)"><label class="lbl" for="ktn">Nama template</label><input id="ktn" class="form-control" required minlength="3" maxlength="60" value="${esc(t.Nama)}"><div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">Simpan</button></div></form>`);
}
async function kopTplNamaGo(e) {
  e.preventDefault(); const b = e.target.querySelector('[type=submit]'); busy(b, true); S.kopE.cfg = kopBaca();
  const r = await call('simpanKopTemplate', { ID: S.kopT, Nama: $('ktn').value, cfg: S.kopE.cfg, logoKiri: S.kopE.logoKiri, logoKanan: S.kopE.logoKanan }); busy(b, false); if (r) { closeModal(); kopSetelahSimpan(r, S.kopT); }
}
function kopTplHapus() {
  const t = S.kop.template.find(x => x.ID === S.kopT); if (!t) return;
  openModal('Hapus template kop', `<p>Hapus template <b>${esc(t.Nama)}</b>? Dokumen yang sudah dicetak atau disahkan tidak berubah. Cetakan berikutnya yang memakai template ini otomatis memakai kop utama.</p><div class="text-end"><button class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x danger" onclick="kopTplHapusGo()">Hapus</button></div>`);
}
async function kopTplHapusGo() { const r = await call('hapusKopTemplate', S.kopT); if (r) { closeModal(); kopSetelahSimpan(r, ''); } }
function kopJadikanUtama() {
  const t = S.kop.template.find(x => x.ID === S.kopT); if (!t) return;
  openModal('Jadikan kop utama', `<p>Kop utama akan diganti dengan isi template <b>${esc(t.Nama)}</b> (termasuk logonya). Template ini tetap tersimpan. Lanjutkan?</p><div class="text-end"><button class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" onclick="kopJadikanUtamaGo()">Jadikan kop utama</button></div>`);
}
async function kopJadikanUtamaGo() {
  const t = S.kop.template.find(x => x.ID === S.kopT); const r = await call('simpanKop', { cfg: t.cfg, logoKiri: t.logoKiri || '', logoKanan: t.logoKanan || '' }); if (r) { closeModal(); kopSetelahSimpan(r, ''); }
}
function kopReset() { openModal('Kembalikan kop bawaan', '<p>Model, tulisan, gaya, dan logo <b>kop utama</b> akan dikembalikan ke bawaan. Template kop tidak berubah. Lanjutkan?</p><div class="text-end"><button class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" onclick="kopResetGo()">Kembalikan</button></div>'); }
async function kopResetGo() { const r = await call('resetKop'); if (r) { closeModal(); kopSetelahSimpan(r, ''); } }
(window.MOD = window.MOD || []).push('Kop');
