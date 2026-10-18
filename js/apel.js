// ── Apel Staf & Apel Regu (satu kode, dua jenis) ──
const AP = {
  staf: { sesi: ['Pagi', 'Sore'], f: [['Pembina', 'Pembina apel', 'i'], ['JabatanPembina', 'Jabatan pembina', 'i'], ['Amanat', 'Amanat (satu poin per baris)', 'a']] },
  regu: { sesi: ['Pagi', 'Siang', 'Malam'], f: [['Catatan', 'Catatan serah terima', 'a'], ['Kondisi', 'Kondisi pengamanan', 'a'], ['Informasi', 'Informasi penting untuk regu berikutnya', 'a']] }
};
RENDER.apel = () => apelPage('staf');
RENDER.regu = () => apelPage('regu');
async function apelPage(j) {
  S.aj = j; const r = await call('daftarApel', j); if (!r) return; const w = canWrite(), g = j === 'regu';
  $('app-container').innerHTML = `${w ? `<div class="card-x mb-3"><form class="toolbar mb-0" onsubmit="bukaUI(event)"><div><label class="lbl" for="at">Tanggal</label><input id="at" type="date" class="form-control" value="${today()}" required></div><div><label class="lbl" for="as">Sesi</label><select id="as" class="form-select">${AP[j].sesi.map(s => `<option>${s}</option>`).join('')}</select></div>${g ? `<div><label class="lbl" for="ar">Regu</label><select id="ar" class="form-select">${REGU.map(s => `<option>${s}</option>`).join('')}</select></div>` : ''}<button class="btn-x align-self-end" type="submit"><i class="bi bi-clipboard-check"></i> Buka / lanjutkan</button></form></div>` : ''}<div id="apelEd"></div>
  <div class="card-x"><h3 class="h6">Riwayat apel ${g ? 'serah terima regu' : 'staf'}</h3>${r.data.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Tanggal</th><th>Sesi</th>${g ? '<th>Regu</th>' : '<th>Pembina</th>'}<th>Hadir</th><th>Status</th><th></th></tr></thead><tbody>${r.data.map(a => `<tr><td class="nw">${esc(a.Tanggal)}</td><td>${esc(a.Sesi)}</td><td>${esc(g ? a.Regu : a.Pembina) || '–'}</td><td>${a.Hadir + a.Terlambat}/${a.Wajib} (${a.Wajib ? Math.round((a.Hadir + a.Terlambat) * 100 / a.Wajib) : 0}%)</td><td><span class="badge-x ${a.Status === 'Selesai' ? 'ok' : 'wait'}">${esc(a.Status)}</span></td><td><button class="btn-o" onclick="muatApel('${a.ID}')">${w ? 'Buka' : 'Lihat'}</button></td></tr>`).join('')}</tbody></table></div>` : kosong('belum ada apel dicatat.')}</div>`;
}
async function bukaUI(e) { e.preventDefault(); const b = e.target.querySelector('[type=submit]'); busy(b, true); const r = await call('bukaApel', S.aj, $('at').value, $('as').value, S.aj === 'regu' ? $('ar').value : ''); busy(b, false); if (r) editor(r); }
async function muatApel(id) { const r = await call('ambilApel', S.aj, id); if (r) editor(r); }
function editor(r) {
  const a = r.data.apel, H = r.data.hadir, w = r.data.ubah === true, dis = w ? '' : 'disabled'; S.ed = { a, H };
  const fld = ([k, l, t]) => t === 'i' ? `<div class="col-md-6"><label class="lbl" for="f_${k}">${l}</label><input id="f_${k}" class="form-control" value="${esc(a[k])}" ${dis}></div>` : `<div class="col-12"><label class="lbl" for="f_${k}">${l}</label><textarea id="f_${k}" rows="3" class="form-control" ${dis}>${esc(a[k])}</textarea></div>`;
  $('apelEd').innerHTML = `<div class="card-x mb-3"><div class="d-flex flex-wrap align-items-center gap-2 mb-3"><h3 class="h6 mb-0">Apel ${esc(a.Sesi)} · ${esc(a.Tanggal)}${a.Regu ? ' · ' + esc(a.Regu) : ''}</h3><span class="badge-x ${a.Status === 'Selesai' ? 'ok' : 'wait'}">${esc(a.Status)}</span></div>
  ${w ? '' : '<p class="muted small">Hanya lihat: Anda bukan operator yang ditugaskan untuk apel ini pada tanggal tersebut.</p>'}<div class="row g-3 mb-3">${AP[S.aj].f.map(fld).join('')}</div>
  <div class="table-wrap"><table class="table"><thead><tr><th>Nama</th><th>Jabatan</th><th>Status</th><th>Keterangan</th></tr></thead><tbody>${H.map((h, i) => `<tr><td>${esc(h.Nama)}</td><td>${esc(h.Jabatan)}</td><td><select class="form-select" data-i="${i}" aria-label="Status ${esc(h.Nama)}" ${dis}>${SH.map(s => `<option ${h.Status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></td><td><input class="form-control" data-k="${i}" aria-label="Keterangan ${esc(h.Nama)}" value="${esc(h.Keterangan)}" ${dis}></td></tr>`).join('')}</tbody></table></div>
  <div class="mt-4"><h4 class="h6">Dokumentasi foto <span class="muted">(${r.data.foto.length}/6)</span></h4><div id="fg" class="fgrid">${r.data.foto.length ? r.data.foto.map(f => `<div class="ft"><img id="im_${f.ID}" alt="${esc(f.Keterangan || f.Nama)}" onclick="lihatFoto('${f.ID}')"><small class="muted">${esc(f.Keterangan)}</small>${w ? `<a href="javascript:void(0)" onclick="hapusFotoUI('${f.ID}')">hapus</a>` : ''}</div>`).join('') : '<span class="muted">Belum ada foto.</span>'}</div>${w && r.data.foto.length < 6 ? '<div class="d-flex flex-wrap gap-2 align-items-end mt-3"><div class="flex-grow-1"><label class="lbl" for="fk">Keterangan foto (opsional)</label><input id="fk" class="form-control"></div><label class="btn-o" for="ff" style="cursor:pointer"><i class="bi bi-image"></i> Pilih foto</label><input id="ff" type="file" accept="image/*" hidden onchange="unggahUI(this)"><label class="btn-x" for="fc" style="cursor:pointer"><i class="bi bi-camera"></i> Ambil foto</label><input id="fc" type="file" accept="image/*" capture="environment" hidden onchange="unggahUI(this)"></div>' : ''}</div>
  ${w ? '<div class="d-flex flex-wrap gap-2 justify-content-end mt-3"><button class="btn-o" onclick="semuaHadir()">Semua hadir</button><button class="btn-o" onclick="simpanUI(false)">Simpan draf</button><button class="btn-x" onclick="simpanUI(true)">Simpan dan selesaikan</button></div>' : ''}</div>`;
  $('apelEd').scrollIntoView({ behavior: 'smooth' }); muatFoto(r.data.foto);
}
const semuaHadir = () => document.querySelectorAll('[data-i]').forEach(s => s.value = 'Hadir');
function simpanUI(selesai) {
  const a = S.ed.a, j = S.aj, go = async al => {
    const d = { rows: S.ed.H.map((h, i) => ({ PegawaiID: h.PegawaiID, Status: document.querySelector(`[data-i="${i}"]`).value, Keterangan: document.querySelector(`[data-k="${i}"]`).value })), selesai, alasan: al || '', UpdatedAt: a.UpdatedAt };
    AP[j].f.forEach(([k]) => d[k] = $('f_' + k).value);
    const r = await call('simpanApel', j, a.ID, d);
    if (r) { toast(r.message); await apelPage(j); muatApel(a.ID); }
  };
  a.Status === 'Selesai' ? askReason('Alasan koreksi apel', go) : go();
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
function hapusFotoUI(id) { askReason('Hapus foto apel', async a => { const r = await call('hapusFoto', S.aj, id, a); if (r) { toast(r.message); muatApel(S.ed.a.ID); } }); }

(window.MOD = window.MOD || []).push('Apel');
