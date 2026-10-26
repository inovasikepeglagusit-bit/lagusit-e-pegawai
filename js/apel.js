// ── Apel Staf & Apel Regu (satu kode, dua jenis) ──
const AP = {
  staf: { sesi: ['Pagi', 'Sore'], f: [['Pembina', 'Pembina apel', 'i'], ['JabatanPembina', 'Jabatan pembina', 'i'], ['Amanat', 'Amanat (satu poin per baris)', 'a']] },
  regu: { sesi: ['Pagi', 'Siang', 'Malam'], f: [['Catatan', 'Catatan serah terima', 'a'], ['Kondisi', 'Kondisi pengamanan', 'a'], ['Informasi', 'Informasi penting untuk regu berikutnya', 'a']] }
};
RENDER.apel = () => apelPage('staf');
RENDER.regu = () => apelPage('regu');
async function apelPage(j) {
  S.aj = j; const r = await call('daftarApel', j); if (!r) return; const w = canWrite(), g = j === 'regu';
  $('app-container').innerHTML = `${w ? `<div class="card-x mb-3"><form class="toolbar mb-0" onsubmit="bukaUI(event)"><div><label class="lbl" for="at">Tanggal</label><input id="at" type="date" class="form-control" value="${today()}" required></div><div><label class="lbl" for="as">Sesi</label><select id="as" class="form-select">${AP[j].sesi.map(s => `<option>${s}</option>`).join('')}</select></div>${g ? `<div><label class="lbl" for="ar">Regu</label><select id="ar" class="form-select">${REGU.map(s => `<option>${s}</option>`).join('')}</select></div>` : ''}<button class="btn-x align-self-end" type="submit"><i class="bi bi-clipboard-check"></i> Buka / lanjutkan</button></form>${j === 'staf' ? '<p class="muted small mt-2 mb-0">Daftar hanya memuat pegawai yang tidak sedang ditempatkan di regu, tersusun per unit kerja. Penempatan diatur Super Admin di Master Data.</p>' : ''}</div>` : ''}<div id="apelEd"></div>
  <div class="card-x"><h3 class="h6">Riwayat apel ${g ? 'serah terima regu' : 'staf'}</h3>${r.data.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Tanggal</th><th>Sesi</th>${g ? '<th>Regu</th>' : '<th>Pembina</th>'}<th>Hadir</th><th>Status</th><th></th></tr></thead><tbody>${r.data.map(a => `<tr><td class="nw">${esc(a.Tanggal)}</td><td>${esc(a.Sesi)}</td><td>${esc(g ? a.Regu : a.Pembina) || '–'}</td><td>${a.Hadir + a.Terlambat}/${a.Wajib} (${a.Wajib ? Math.round((a.Hadir + a.Terlambat) * 100 / a.Wajib) : 0}%)</td><td><span class="badge-x ${a.Status === 'Selesai' ? 'ok' : 'wait'}">${esc(a.Status)}</span></td><td class="nw"><button class="btn-o" onclick="muatApel('${a.ID}')">${w && (a.Status !== 'Selesai' || isAdmin()) ? 'Buka' : 'Lihat'}</button>${isAdmin() ? ` <button class="btn-o danger" onclick="hapusApelRow('${a.ID}')">Hapus</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : kosong('belum ada apel dicatat.')}</div>`;
}
async function bukaUI(e) { e.preventDefault(); const b = e.target.querySelector('[type=submit]'); busy(b, true); const r = await call('bukaApel', S.aj, $('at').value, $('as').value, S.aj === 'regu' ? $('ar').value : ''); busy(b, false); if (r) editor(r); }
async function muatApel(id) { const r = await call('ambilApel', S.aj, id); if (r) editor(r); }
const TANPA = '(Tanpa unit kerja)', urutUnit = (a, b) => (a === TANPA) - (b === TANPA) || a.localeCompare(b);
const SC = [['Hadir', 'Hadir', 'h'], ['Terlambat', 'Telat', 't'], ['Izin', 'Izin', 'i'], ['Sakit', 'Sakit', 's'], ['Dinas Luar', 'DL', 'd'], ['Tidak Hadir', 'Alpa', 'x']];
function editor(r) {
  const a = r.data.apel, H = r.data.hadir, w = r.data.ubah === true, dis = w ? '' : 'disabled';
  S.ed = { a, H, w, unit: '', q: '', grup: [], ket: r.data.ket || [] };
  const fld = ([k, l, t]) => t === 'i' ? `<div class="col-md-6"><label class="lbl" for="f_${k}">${l}</label><input id="f_${k}" class="form-control" value="${esc(a[k])}" ${dis}></div>` : `<div class="col-12"><label class="lbl" for="f_${k}">${l}</label><textarea id="f_${k}" rows="3" class="form-control" ${dis}>${esc(a[k])}</textarea></div>`;
  const units = [...new Set(H.map(h => h.Unit || TANPA))].sort(urutUnit);
  $('apelEd').innerHTML = `<div class="card-x mb-3"><div class="d-flex flex-wrap align-items-center gap-2 mb-3"><h3 class="h6 mb-0">Apel ${esc(a.Sesi)} · ${esc(a.Tanggal)}${a.Regu ? ' · ' + esc(a.Regu) : ''}</h3><span class="badge-x ${a.Status === 'Selesai' ? 'ok' : 'wait'}">${esc(a.Status)}</span>${isAdmin() ? `<button class="btn-o danger ms-auto" onclick="hapusApelRow('${a.ID}')"><i class="bi bi-trash"></i> Hapus apel</button>` : ''}</div>
  ${a.Status === 'Selesai' && !isAdmin() ? '<p class="muted small">Apel ini sudah selesai dan terkunci. Hanya Super Admin yang dapat mengoreksi atau menghapusnya.</p>' : ''}
  ${w ? '' : '<p class="muted small">Hanya lihat: Anda bukan operator yang ditugaskan untuk apel ini pada tanggal tersebut.</p>'}<div class="row g-3 mb-3">${AP[S.aj].f.map(fld).join('')}</div>
  <h4 class="h6">Daftar kehadiran <span class="muted">(${H.length} orang)</span></h4>
  <div class="toolbar"><select id="ru" class="form-select" aria-label="Pilih unit kerja" onchange="S.ed.unit=this.value;gambarRoster()"><option value="">Semua unit kerja</option>${units.map(u => `<option value="${esc(u)}">${esc(u)} (${H.filter(h => (h.Unit || TANPA) === u).length})</option>`).join('')}</select><input id="rq" class="form-control" placeholder="Cari nama" aria-label="Cari nama" oninput="S.ed.q=this.value;gambarRoster()">${w ? '<button type="button" class="btn-o" onclick="semuaHadir()">Semua hadir</button>' : ''}${w && a.Status === 'Draf' ? '<button type="button" class="btn-o" onclick="sinkronUI()" title="Samakan daftar dengan penempatan regu terbaru">Sinkronkan daftar</button>' : ''}</div>
  <div class="rsum mb-2" id="rsum" aria-live="polite"></div><div id="rost"></div>
  <div class="mt-4"><h4 class="h6">Dokumentasi foto <span class="muted">(${r.data.foto.length}/6)</span></h4><div id="fg" class="fgrid">${r.data.foto.length ? r.data.foto.map(f => `<div class="ft"><img id="im_${f.ID}" alt="${esc(f.Keterangan || f.Nama)}" onclick="lihatFoto('${f.ID}')"><small class="muted">${esc(f.Keterangan)}</small>${w ? `<a href="javascript:void(0)" onclick="hapusFotoUI('${f.ID}')">hapus</a>` : ''}</div>`).join('') : '<span class="muted">Belum ada foto.</span>'}</div>${w && r.data.foto.length < 6 ? '<div class="d-flex flex-wrap gap-2 align-items-end mt-3"><div class="flex-grow-1"><label class="lbl" for="fk">Keterangan foto (opsional)</label><input id="fk" class="form-control"></div><label class="btn-o" for="ff" style="cursor:pointer"><i class="bi bi-image"></i> Pilih foto</label><input id="ff" type="file" accept="image/*" hidden onchange="unggahUI(this)"><label class="btn-x" for="fc" style="cursor:pointer"><i class="bi bi-camera"></i> Ambil foto</label><input id="fc" type="file" accept="image/*" capture="environment" hidden onchange="unggahUI(this)"></div>' : ''}</div>
  ${w ? '<div class="aksi-bar"><button class="btn-o" onclick="simpanUI(false)">Simpan draf</button><button class="btn-x" onclick="simpanUI(true)">Simpan dan selesaikan</button></div>' : ''}</div>`;
  gambarRoster(); $('apelEd').scrollIntoView({ behavior: 'smooth' }); muatFoto(r.data.foto);
}
const kunci = h => h.Sumber === 'Surat' && !isAdmin(); // terisi dari surat yang disetujui: hanya Super Admin yang dapat mengubah
const opsiKet = st => (S.ed.ket || []).filter(k => k.Kategori === st);
function barisRoster(i) {
  const h = S.ed.H[i], w = S.ed.w, kc = kunci(h), off = w && !kc ? '' : 'disabled', st = h.Status, O = opsiKet(st), opsional = st === 'Hadir' || st === 'Terlambat', tanpa = st === 'Hadir' && !O.length, ada = O.some(k => k.Nama === h.Keterangan);
  const ket = tanpa ? '' : `<div class="ketbar">${st === 'Terlambat' && !O.length ? '<span class="muted small align-self-center">Terlambat tidak memerlukan keterangan.</span>' : `<select class="form-select" aria-label="Keterangan ${esc(h.Nama)}" ${off} onchange="S.ed.H[${i}].Keterangan=this.value">${O.length ? `<option value="">${opsional ? 'Keterangan khusus (opsional)' : 'Pilih keterangan...'}</option>` : ''}${O.map(k => `<option ${k.Nama === h.Keterangan ? 'selected' : ''}>${esc(k.Nama)}</option>`).join('')}${h.Keterangan && !ada ? `<option selected>${esc(h.Keterangan)}</option>` : ''}</select>`}<input class="form-control" placeholder="Catatan (opsional)" maxlength="200" aria-label="Catatan ${esc(h.Nama)}" value="${esc(h.Catatan || '')}" ${w ? '' : 'disabled'} oninput="S.ed.H[${i}].Catatan=this.value"></div>`;
  return `<div class="rr ${h.Sumber === 'Surat' ? 'terkunci' : ''}" id="rr_${i}"><div class="rn"><b>${esc(h.Nama)}</b>${h.Sumber === 'Surat' ? `<span class="sbadge" title="${kc ? 'Terisi otomatis dari surat yang disetujui. Hanya Super Admin yang dapat mengubah.' : 'Terisi dari surat. Bila diubah, tautan ke surat dilepas.'}"><i class="bi bi-envelope-check"></i>Surat${kc ? ' · terkunci' : ''}</span>` : ''}<small>${esc(h.Jabatan) || '–'}</small></div><div class="chs" role="group" aria-label="Status ${esc(h.Nama)}">${SC.map(([s, l, c]) => `<button type="button" class="ch c-${c} ${h.Status === s ? 'on' : ''}" aria-pressed="${h.Status === s}" title="${s}" ${off} onclick="pilihStatus(${i},'${s}')">${l}</button>`).join('')}</div>${ket}</div>`;
}
function ringkasApel() { const c = {}; S.ed.H.forEach(h => c[h.Status] = (c[h.Status] || 0) + 1); $('rsum').innerHTML = SC.map(([s]) => c[s] ? `<span>${s} ${c[s]}</span>` : '').join(''); }
function gambarRoster() { // daftar tersusun per unit kerja; saring menurut unit dan nama
  const e = S.ed, q = e.q.trim().toLowerCase(), G = {};
  e.H.forEach((h, i) => { const u = h.Unit || TANPA; if ((!e.unit || u === e.unit) && (!q || (h.Nama + ' ' + (h.Jabatan || '')).toLowerCase().includes(q))) (G[u] = G[u] || []).push(i); });
  e.grup = Object.keys(G).sort(urutUnit);
  $('rost').innerHTML = e.grup.length ? e.grup.map((u, gi) => `<div class="ug"><div class="uh"><b>${esc(u)}</b><span class="muted">${G[u].length} orang</span>${e.w ? `<button type="button" class="btn-o sm" onclick="semuaHadirUnit(${gi})">Semua hadir</button>` : ''}</div>${G[u].map(barisRoster).join('')}</div>`).join('') : '<p class="muted py-3">Tidak ada nama yang cocok.</p>';
  ringkasApel();
}
function pilihStatus(i, s) {
  const h = S.ed.H[i]; if (!S.ed.w || kunci(h)) return; h.Status = s;
  if (s === 'Hadir' || s === 'Terlambat') h.Keterangan = opsiKet(s).some(k => k.Nama === h.Keterangan) ? h.Keterangan : ''; else { const O = opsiKet(s); if (!O.some(k => k.Nama === h.Keterangan)) h.Keterangan = O.length === 1 ? O[0].Nama : ''; } const el = $('rr_' + i); if (el) el.outerHTML = barisRoster(i); ringkasApel(); }
const jadiHadir = h => { if (kunci(h)) return; h.Status = 'Hadir'; h.Keterangan = ''; h.Catatan = ''; };
function semuaHadir() { const e = S.ed; e.H.forEach(h => { if (!e.unit || (h.Unit || TANPA) === e.unit) jadiHadir(h); }); gambarRoster(); }
function semuaHadirUnit(gi) { const u = S.ed.grup[gi]; S.ed.H.forEach(h => { if ((h.Unit || TANPA) === u) jadiHadir(h); }); gambarRoster(); }
function kumpulApel(selesai, al) {
  const d = { rows: S.ed.H.map(h => ({ PegawaiID: h.PegawaiID, Status: h.Status, Keterangan: h.Keterangan || '', Catatan: h.Catatan || '' })), selesai, alasan: al || '', UpdatedAt: S.ed.a.UpdatedAt };
  AP[S.aj].f.forEach(([k]) => d[k] = $('f_' + k).value); return d;
}
function simpanUI(selesai) {
  const a = S.ed.a, j = S.aj, go = async al => { const r = await call('simpanApel', j, a.ID, kumpulApel(selesai, al)); if (r) { toast(r.message); await apelPage(j); muatApel(a.ID); } };
  a.Status === 'Selesai' ? askReason('Alasan koreksi apel', go) : go();
}
async function sinkronUI() { // simpan isian terakhir sebagai draf, lalu samakan daftar dengan penempatan terbaru
  const a = S.ed.a, s1 = await call('simpanApel', S.aj, a.ID, kumpulApel(false, '')); if (!s1) return;
  const r = await call('sinkronApel', S.aj, a.ID); if (r) { toast(r.message); muatApel(a.ID); }
}

// ── Dokumentasi foto apel ──
async function muatFoto(L) { for (const f of L) { const x = await call('ambilFoto', S.aj, f.ID), i = $('im_' + f.ID); if (x && i) i.src = x.data; } }
function lihatFoto(id) { openModal('Foto apel', `<img src="${$('im_' + id).src}" class="w-100" alt="Foto apel">`); }
function kompres(file) {
  return new Promise((ok, no) => {
    const img = new Image(), u = URL.createObjectURL(file);
    img.onload = () => { const s = Math.min(1, 1280 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u); ok(c.toDataURL('image/jpeg', 0.75).split(',')[1]); };
    img.onerror = () => no(new Error('Berkas bukan gambar yang valid.')); img.src = u;
  });
}
async function unggahUI(inp) {
  const f = inp.files[0]; if (!f) return; if (!/^image\//.test(f.type) || f.size > 20 * 1024 * 1024) { inp.value = ''; return toast('Pilih berkas gambar (maksimal 20 MB sebelum diperkecil).', 'danger'); }
  toast('Mengunggah foto...', 'warning');
  try { const b64 = await kompres(f), r = await call('unggahFoto', S.aj, S.ed.a.ID, f.name, b64, $('fk') ? $('fk').value : ''); if (r) { toast(r.message); muatApel(S.ed.a.ID); } } catch (e) { toast(e.message, 'danger'); }
  inp.value = '';
}
function hapusApelRow(id) {
  askReason('Hapus catatan apel (permanen)', async al => {
    const r = await call('hapusApel', S.aj, id, al);
    if (r) { toast(r.message); const e = $('apelEd'); if (e) e.innerHTML = ''; await apelPage(S.aj); }
  });
}
function hapusFotoUI(id) { askReason('Hapus foto apel', async a => { const r = await call('hapusFoto', S.aj, id, a); if (r) { toast(r.message); muatApel(S.ed.a.ID); } }); }

(window.MOD = window.MOD || []).push('Apel');
