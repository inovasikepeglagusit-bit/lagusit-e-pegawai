// ── Kop surat: dibuat dari pengaturan Super Admin (model, tulisan, gaya, logo); dipakai laporan dan register nomor surat saat dicetak ──
const KOP_NAMA = { klasik: 'Klasik (logo kiri, teks tengah)', 'dua-logo': 'Dua logo (kiri dan kanan)', 'rata-kiri': 'Rata kiri', tengah: 'Logo di atas', modern: 'Modern (garis aksen)', minimalis: 'Minimalis (tanpa logo)' };
/** HTML kop dari hasil getKop (k.cfg, k.logoKiri, k.logoKanan). Hanya memakai gaya sebaris agar sama di layar dan di kertas. */
function kopHtml(k) {
  if (!k) return '';
  const c = k.cfg, z = c.logoUkuran, kiri = k.logoKiri || (c.pakaiLogoApp && TP.logo ? TP.logo : ''), kanan = k.logoKanan || '';
  const img = s => s ? `<img src="${esc(s)}" alt="" style="width:${z}px;height:${z}px;object-fit:contain;flex:none">` : `<span style="width:${z}px;flex:none"></span>`;
  const T = (al) => `<div style="flex:1;min-width:0;text-align:${al};line-height:1.25">${c.baris.filter(b => b.teks).map(b => `<div style="font-size:${b.ukuran}pt;font-weight:${b.tebal ? 800 : 500};${b.kapital ? 'text-transform:uppercase;' : ''}">${esc(b.teks)}</div>`).join('')}</div>`;
  const gr = { ganda: '4px double ' + c.warnaGaris, tebal: '3px solid ' + c.warnaGaris, tipis: '1px solid ' + c.warnaGaris, tanpa: 'none' }[c.garis];
  let h;
  switch (c.model) {
    case 'dua-logo': h = `${img(kiri)}${T('center')}${img(kanan)}`; break;
    case 'rata-kiri': h = `${kiri ? img(kiri) : ''}${T('left')}`; break;
    case 'tengah': h = `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px">${kiri ? img(kiri) : ''}${T('center').replace('flex:1;', 'width:100%;')}</div>`; break;
    case 'modern': h = `<span style="width:7px;align-self:stretch;background:${c.warnaGaris};border-radius:4px;flex:none"></span>${T('left')}${kiri ? img(kiri) : ''}`; break;
    case 'minimalis': h = T('center'); break;
    default: h = `${img(kiri)}${T('center')}<span style="width:${z}px;flex:none"></span>`;
  }
  return `<div class="kopx" style="display:flex;align-items:center;gap:14px;font-family:'${c.font}',serif;color:${c.warnaTeks};padding-bottom:10px;margin-bottom:14px;${c.model === 'modern' ? '' : 'border-bottom:' + gr + ';'}">${h}</div>${c.model === 'modern' && c.garis !== 'tanpa' ? `<div style="height:0;border-top:${gr};margin:-6px 0 14px"></div>` : ''}`;
}
async function muatKop() { if (S.kop) return S.kop; const r = await call('getKop'); if (r) S.kop = r.data; return S.kop; }

// ── Tab Kop Surat (Master Data) ──
MT.kop = async () => { const r = await call('getKop'); if (!r) return; S.kop = r.data; S.kopE = JSON.parse(JSON.stringify(r.data)); S.kopE.baru = {}; mb(kopForm()); kopPrev(); };
function kopForm() {
  const k = S.kopE, c = k.cfg, B = c.baris.concat(Array(6).fill(null)).slice(0, 6);
  return `<div class="row g-3"><div class="col-xl-5"><div class="card-x"><h3 class="h6">Kop surat laporan</h3><p class="muted small">Kop ini otomatis muncul di atas laporan dan register nomor surat saat dicetak atau disimpan sebagai PDF. Ubah model, tulisan, gaya, dan logo; pratinjau di sebelah kanan langsung berubah.</p>
  <label class="lbl">Model</label><div class="kmod">${k.model.map(m => `<label class="${c.model === m ? 'on' : ''}"><input type="radio" name="km" value="${m}" ${c.model === m ? 'checked' : ''} onchange="kopUbah()"><span>${esc(KOP_NAMA[m])}</span></label>`).join('')}</div>
  <label class="lbl mt-3">Tulisan (maksimal 6 baris; baris kosong dilewati)</label>${B.map((b, i) => `<div class="kbar"><input class="form-control" data-b="t${i}" maxlength="120" placeholder="Baris ${i + 1}" value="${esc(b ? b.teks : '')}" oninput="kopUbah()" aria-label="Teks baris ${i + 1}"><input type="number" class="form-control" data-b="u${i}" min="8" max="24" value="${b ? b.ukuran : 11}" oninput="kopUbah()" aria-label="Ukuran huruf baris ${i + 1}" title="Ukuran huruf (pt)"><label title="Tebal"><input type="checkbox" data-b="b${i}" ${b && b.tebal ? 'checked' : ''} onchange="kopUbah()"> <b>T</b></label><label title="HURUF KAPITAL"><input type="checkbox" data-b="k${i}" ${b && b.kapital ? 'checked' : ''} onchange="kopUbah()"> Aa</label></div>`).join('')}
  <div class="row g-2 mt-1"><div class="col-6"><label class="lbl" for="kf">Font</label><select id="kf" class="form-select" onchange="kopUbah()">${k.font.map(f => `<option ${c.font === f ? 'selected' : ''}>${f}</option>`).join('')}</select></div><div class="col-6"><label class="lbl" for="kg">Garis bawah</label><select id="kg" class="form-select" onchange="kopUbah()">${k.garis.map(f => `<option ${c.garis === f ? 'selected' : ''}>${f}</option>`).join('')}</select></div>
  <div class="col-6"><label class="lbl" for="kwg">Warna garis</label><input id="kwg" type="color" class="form-control form-control-color" value="${c.warnaGaris}" oninput="kopUbah()"></div><div class="col-6"><label class="lbl" for="kwt">Warna teks</label><input id="kwt" type="color" class="form-control form-control-color" value="${c.warnaTeks}" oninput="kopUbah()"></div>
  <div class="col-12"><label class="lbl" for="kz">Ukuran logo: <span id="kzv">${c.logoUkuran}</span> px</label><input id="kz" type="range" class="form-range" min="30" max="140" step="2" value="${c.logoUkuran}" oninput="kopUbah()"></div></div>
  <h4 class="h6 mt-3">Logo</h4><label class="d-flex align-items-center gap-2 mb-2"><input type="checkbox" id="kpa" ${c.pakaiLogoApp ? 'checked' : ''} onchange="kopUbah()"> Pakai logo aplikasi bila logo kiri tidak diunggah</label>
  <div class="d-flex flex-wrap gap-2 align-items-center mb-1"><b class="small">Kiri</b><input type="file" id="klk" accept="image/png,image/jpeg" class="form-control" style="max-width:230px" onchange="kopLogo('logoKiri',this)"><button type="button" class="btn-o sm" onclick="kopHapusLogo('logoKiri')">Hapus</button></div>
  <div class="d-flex flex-wrap gap-2 align-items-center"><b class="small">Kanan</b><input type="file" id="klr" accept="image/png,image/jpeg" class="form-control" style="max-width:230px" onchange="kopLogo('logoKanan',this)"><button type="button" class="btn-o sm" onclick="kopHapusLogo('logoKanan')">Hapus</button></div>
  <div class="text-end mt-3"><button type="button" class="btn-o" onclick="kopReset()">Kembalikan bawaan</button> <button type="button" class="btn-x" onclick="kopSimpan()">Simpan kop surat</button></div></div></div>
  <div class="col-xl-7"><div class="card-x"><h3 class="h6">Pratinjau (seperti saat dicetak)</h3><div class="kpage" id="kopPrev"></div><p class="muted small mt-2 mb-0">Isi laporan muncul di bawah kop ini.</p></div></div></div>`;
}
function kopBaca() {
  const k = S.kopE, B = []; for (let i = 0; i < 6; i++) { const t = document.querySelector(`[data-b=t${i}]`); if (t) B.push({ teks: t.value, ukuran: Number(document.querySelector(`[data-b=u${i}]`).value) || 11, tebal: document.querySelector(`[data-b=b${i}]`).checked, kapital: document.querySelector(`[data-b=k${i}]`).checked }); }
  const m = document.querySelector('[name=km]:checked');
  return { model: m ? m.value : k.cfg.model, font: $('kf').value, garis: $('kg').value, warnaGaris: $('kwg').value, warnaTeks: $('kwt').value, logoUkuran: Number($('kz').value), pakaiLogoApp: $('kpa').checked, baris: B };
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
async function kopSimpan() {
  const d = { cfg: kopBaca() }; Object.keys(S.kopE.baru).forEach(k => d[k] = S.kopE.baru[k]);
  const r = await call('simpanKop', d); if (r) { S.kop = r.data; S.kopE = JSON.parse(JSON.stringify(r.data)); S.kopE.baru = {}; toast(r.message); mb(kopForm()); kopPrev(); }
}
function kopReset() { openModal('Kembalikan kop bawaan', '<p>Model, tulisan, gaya, dan logo kop surat akan dikembalikan ke bawaan. Lanjutkan?</p><div class="text-end"><button class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" onclick="kopResetGo()">Kembalikan</button></div>'); }
async function kopResetGo() { const r = await call('resetKop'); if (r) { closeModal(); S.kop = r.data; S.kopE = JSON.parse(JSON.stringify(r.data)); S.kopE.baru = {}; toast(r.message); mb(kopForm()); kopPrev(); } }
(window.MOD = window.MOD || []).push('Kop');
