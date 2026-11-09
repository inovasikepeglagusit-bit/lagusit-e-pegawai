// ── Pengesahan / tanda tangan elektronik: kotak masuk pengesahan, cetak ber-QR, dan halaman cek keaslian publik ──
Object.assign(TITLES, { pengesahan: 'Pengesahan Dokumen' }); Object.assign(ICONS, { pengesahan: 'bi-patch-check' });
Object.assign(KATA, { pengesahan: 'pengesahan tanda tangan elektronik ttd barcode qr sahkan dokumen verifikasi keaslian' }); Object.assign(TILE, { pengesahan: 'Pengesahan' });
const TTE_BADGE = { Menunggu: 'wait', Disahkan: 'ok', Ditolak: 'danger', Dicabut: 'danger', Dibatalkan: 'off' };
const tteUrl = kode => location.origin + location.pathname + '?v=' + kode;
const tteTgl = s => s ? tglIndo(s.slice(0, 10)) + ' ' + s.slice(11, 16) + ' WIB' : '';
const tteDekode = b64 => new TextDecoder('utf-8').decode(Uint8Array.from(atob(b64), c => c.charCodeAt(0)));
/** Pertahanan lapis kedua: isi dokumen beku dibersihkan dari skrip, bingkai, formulir, dan penangan peristiwa sebelum ditampilkan atau dicetak. */
function tteBersih(html) {
  const d = new DOMParser().parseFromString('<!doctype html><body>' + html, 'text/html');
  d.querySelectorAll('script,iframe,frame,frameset,object,embed,applet,link,meta,base,form,input,button,textarea,select').forEach(n => n.remove());
  d.querySelectorAll('*').forEach(n => [...n.attributes].forEach(a => { if (/^on/i.test(a.name) || /^\s*(javascript|vbscript|data\s*:\s*text\/html)/i.test(a.value)) n.removeAttribute(a.name); }));
  return d.body.innerHTML;
}
/** Blok pengesahan elektronik yang dicetak pada dokumen yang sudah disahkan. */
function tteBlok(r) {
  const url = tteUrl(r.Kode), qr = QR.svg(url, 86), s = x => `<div>${x}</div>`;
  return `<div style="margin:16px 0 0 auto;width:330px;break-inside:avoid;border:1.5px solid #000;padding:7px 9px;display:flex;gap:9px;align-items:center;font-family:Arial,sans-serif;font-size:9.5px;line-height:1.35;color:#000">
  <div style="flex:none;line-height:0">${qr}</div><div style="text-align:left;min-width:0">
  <div style="font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:.3px">Disahkan secara elektronik</div>
  ${s(esc(r.Jabatan || ''))}<div style="font-weight:700;margin-top:1px">${esc(r.Penandatangan)}</div>${r.NIP ? s('NIP. ' + esc(r.NIP)) : ''}
  ${s(esc(tteTgl(r.Disahkan)))}<div style="margin-top:3px">Kode: <b style="letter-spacing:1px">${esc(r.Kode)}</b></div><div style="word-break:break-all;color:#333">Cek keaslian: ${esc(url)}</div></div></div>`;
}
/** Cetak dokumen yang sudah disahkan: isi beku + blok QR. Tidak dicetak bila keutuhan berkas tidak terjamin. */
async function tteCetak(id) {
  const r = await call('lihatTte', id); if (!r) return; const d = r.data;
  if (d.Status !== 'Disahkan') return toast('Hanya dokumen yang sudah disahkan yang dapat dicetak dengan QR.', 'warning');
  if (!d.Utuh) return toast('Pencetakan dihentikan: ' + d.Sebab, 'danger');
  await cetakBuka(d.Judul + (d.Nomor ? ' ' + d.Nomor : ''), tteBersih(tteDekode(d.Isi)) + tteBlok(d), d.Potret);
}

// ── Integrasi pada formulir cetak (jadwal apel, roster piket, dst.) ──
function tteModeUbah() {
  const t = document.querySelector('[name=czm]:checked').value === 'tte';
  $('czman').hidden = t; $('czt').hidden = !t; $('czb').innerHTML = t ? '<i class="bi bi-send"></i> Ajukan pengesahan' : '<i class="bi bi-printer"></i> Cetak'; if (t && !$('czs').dataset.ok) tteMuatPenandatangan();
}
async function tteMuatPenandatangan() {
  const e = $('czs'); if (!e) return; const r = await call('getPenandatangan'); if (!r || !$('czs')) return;
  let ing = ''; try { ing = localStorage.getItem('lagusit_tte_pj') || ''; } catch (x) {}
  e.innerHTML = r.data.length ? '<option value="">Pilih pejabat penandatangan...</option>' + r.data.map(p => `<option value="${esc(p.Email)}" ${p.Email === ing ? 'selected' : ''}>${esc(p.Nama)}${p.Jabatan ? ' — ' + esc(p.Jabatan) : ''}</option>`).join('') : '<option value="">Belum ada akun pejabat (Pimpinan/Atasan)</option>'; e.dataset.ok = '1';
}
/** Cetak biasa (kolom tanda tangan manual) atau ajukan pengesahan elektronik: dokumen dibekukan lalu menunggu pejabat di menu Pengesahan. */
async function cetakAtauTte(c, judul, jenis, potret, isi) {
  if (!c.tte) return cetakBuka(judul, isi, potret);
  const r = await call('ajukanTte', { Jenis: jenis, Judul: judul, Penandatangan: c.tte, Html: isi, Potret: !!potret });
  if (r) { toast(r.message); if (S.menu.includes('pengesahan')) { S.tf = { arah: 'keluar', status: '', cari: '' }; delete PC.pengesahan; navigateTo('pengesahan'); } }
}

// ── Menu Pengesahan ──
const TTE_TAB = [['masuk', 'Perlu saya sahkan', 'bi-inbox'], ['keluar', 'Saya ajukan', 'bi-send'], ['', 'Semua riwayat', 'bi-clock-history']];
RENDER.pengesahan = async () => {
  const f = S.tf = S.tf || { arah: '', status: '', cari: '' }; if (S.tf.arah === undefined) S.tf.arah = '';
  const r = await call('daftarTte', Object.assign({}, f, f.arah === 'masuk' && !f.status ? { status: 'Menunggu' } : {})); if (!r) return; S.tl = r.data;
  const d = r.data, tab = f.arah || '';
  $('app-container').innerHTML = `<div class="tt"><section class="card-x mb-3"><div class="d-flex flex-wrap align-items-center gap-3"><div class="grow"><h3 class="jd mb-1">Pengesahan elektronik</h3><p class="muted small mb-0">Dokumen yang dicetak dari menu lain (jadwal apel, roster piket, nota dinas, SK, SKP) dapat diajukan untuk disahkan pejabat. Setelah disahkan, dokumen dibekukan dan dicetak dengan QR yang dapat diperiksa siapa pun tanpa login.</p></div>${d.menunggu ? `<span class="badge-x wait">${d.menunggu} menunggu Anda</span>` : ''}</div></section>
  <div class="mtabs mb-3" role="tablist" aria-label="Pengesahan">${TTE_TAB.map(t => `<button type="button" role="tab" class="mtab ${t[0] === tab ? 'on' : ''}" aria-selected="${t[0] === tab}" onclick="tteTab('${t[0]}')"><i class="bi ${t[2]}"></i> ${t[1]}${t[0] === 'masuk' && d.menunggu ? ` <span class="badge-x wait">${d.menunggu}</span>` : ''}</button>`).join('')}</div>
  <section class="card-x"><div class="row g-2 mb-3"><div class="col-md-6"><input id="ttq" class="form-control" placeholder="Cari judul, nomor, kode, nama..." value="${esc(f.cari || '')}" onkeydown="if(event.key==='Enter')tteCari()" aria-label="Cari"></div><div class="col-md-4"><select id="tts" class="form-select" onchange="tteCari()" aria-label="Status"><option value="">Semua status</option>${['Menunggu', 'Disahkan', 'Ditolak', 'Dicabut', 'Dibatalkan'].map(s => `<option ${f.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div><div class="col-md-2"><button class="btn-o w-100" onclick="tteCari()"><i class="bi bi-search"></i> Cari</button></div></div>
  ${d.daftar.length ? `<div class="table-responsive"><table class="table align-middle"><thead><tr><th>Dokumen</th><th>Penandatangan</th><th>Diajukan</th><th>Status</th><th></th></tr></thead><tbody>${d.daftar.map(x => `<tr><td><b>${esc(x.Judul)}</b><div class="muted small">${esc(x.Jenis)}${x.Nomor ? ' · ' + esc(x.Nomor) : ''} · ${esc(x.Kode)}</div></td><td>${esc(x.Penandatangan)}<div class="muted small">${esc(x.Jabatan || '')}</div></td><td>${esc(tteTgl(x.Diminta))}<div class="muted small">oleh ${esc(x.Pemohon)}</div></td><td><span class="badge-x ${TTE_BADGE[x.Status]}">${x.Status}</span>${x.Disahkan ? `<div class="muted small">${esc(tteTgl(x.Disahkan))}</div>` : ''}${x.Alasan ? `<div class="muted small">${esc(x.Alasan)}</div>` : ''}</td><td class="nw"><button class="btn-o sm" onclick="tteLihat('${x.ID}')"><i class="bi bi-eye"></i> Buka</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="muted text-center py-4 mb-0">Belum ada dokumen pada tampilan ini.</p>'}</section></div>`;
};
function tteTab(a) { S.tf = { arah: a, status: '', cari: '' }; RENDER.pengesahan(); }
function tteCari() { S.tf.cari = $('ttq').value.trim(); S.tf.status = $('tts').value; RENDER.pengesahan(); }
async function tteLihat(id) {
  const r = await call('lihatTte', id); if (!r) return; const d = r.data, me = S.user.email, sah = d.PenandatanganEmail === me, super_ = S.user.roles.includes('Super Admin'), html = tteBersih(tteDekode(d.Isi));
  const btn = [];
  if (sah && d.Status === 'Menunggu') btn.push(`<button class="btn-x" onclick="tteSahkanForm('${id}')"><i class="bi bi-patch-check"></i> Sahkan</button>`, `<button class="btn-o" onclick="tteTolak('${id}')">Tolak</button>`);
  if (d.Status === 'Disahkan') btn.push(`<button class="btn-x" onclick="tteCetak('${id}')"><i class="bi bi-printer"></i> Cetak ber-QR</button>`, `<a class="btn-o" href="${esc(tteUrl(d.Kode))}" target="_blank" rel="noopener">Cek keaslian</a>`);
  if (d.Status === 'Disahkan' && (sah || super_)) btn.push(`<button class="btn-o" onclick="tteCabut('${id}')">Cabut pengesahan</button>`);
  if (d.Status === 'Menunggu' && (d.PemohonEmail === me || super_)) btn.push(`<button class="btn-o" onclick="tteBatal('${id}')">Batalkan pengajuan</button>`);
  openModal(d.Judul, `<div class="d-flex flex-wrap gap-2 align-items-center mb-2"><span class="badge-x ${TTE_BADGE[d.Status]}">${d.Status}</span><span class="muted small">${esc(d.Jenis)}${d.Nomor ? ' · ' + esc(d.Nomor) : ''} · Kode ${esc(d.Kode)}</span></div>${d.Utuh ? '' : `<div class="alert alert-danger py-2">Keutuhan dokumen tidak terjamin: ${esc(d.Sebab)}</div>`}
  <iframe sandbox="" title="Isi dokumen" style="width:100%;height:55vh;border:1px solid var(--line);border-radius:10px;background:#fff" srcdoc="${esc(`<style>body{font-family:'Times New Roman',serif;font-size:11px;margin:10px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #000;padding:3px 4px;text-align:center}td.l{text-align:left}.g{background:#ddd;font-weight:bold;text-align:left}.m{background:#fecaca}h2{text-align:center;font-size:13px}</style>` + html)}"></iframe>
  <div class="muted small mt-2">Diajukan oleh ${esc(d.Pemohon)} · ${esc(tteTgl(d.Diminta))} · Penandatangan: ${esc(d.Penandatangan)}${d.Jabatan ? ' (' + esc(d.Jabatan) + ')' : ''}<br>Sidik dokumen (SHA-256): <code style="word-break:break-all">${esc(d.Sidik)}</code></div><div class="d-flex flex-wrap gap-2 justify-content-end mt-3">${btn.join('')}</div>`);
}
function tteSahkanForm(id) {
  openModal('Sahkan dokumen', `<form onsubmit="tteSahkan(event,'${id}')"><p>Dengan memasukkan kata sandi Anda, dokumen ini <b>disahkan secara elektronik atas nama Anda</b>. Isinya dibekukan dan tidak dapat diubah; QR pada cetakannya dapat diperiksa siapa pun.</p><label class="lbl" for="tpw">Kata sandi akun Anda *</label><input id="tpw" type="password" class="form-control" autocomplete="current-password" required><div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit"><i class="bi bi-patch-check"></i> Sahkan sekarang</button></div></form>`);
  setTimeout(() => { const e = $('tpw'); if (e) e.focus(); }, 300);
}
async function tteSahkan(e, id) { e.preventDefault(); const b = e.submitter; busy(b, true); const r = await call('sahkanTte', id, $('tpw').value); busy(b, false); if (r) { closeModal(); toast(r.message); RENDER.pengesahan(); } }
function tteTolak(id) { askReason('Tolak pengesahan', async a => { const r = await call('tolakTte', id, a); if (r) { toast(r.message); RENDER.pengesahan(); } }); }
function tteCabut(id) { askReason('Cabut pengesahan', async a => { const r = await call('cabutTte', id, a); if (r) { toast(r.message); RENDER.pengesahan(); } }); }
async function tteBatal(id) { const r = await call('batalkanTte', id); if (r) { closeModal(); toast(r.message); RENDER.pengesahan(); } }

// ── Halaman cek keaslian PUBLIK (dibuka dari QR: ?v=KODE), tanpa login ──
function tteCekAwal() { const m = location.search.match(/[?&]v=([A-Za-z0-9]{6,20})(&|$)/); if (!m) return false; tteHalamanCek(m[1].toUpperCase()); return true; }
async function tteHalamanCek(kode) {
  const w = document.createElement('div'); w.id = 'tteV'; w.style.cssText = 'position:fixed;inset:0;z-index:4000;overflow:auto;background:var(--bg);color:var(--text);padding:20px 14px'; document.body.appendChild(w);
  const kartu = h => `<div style="max-width:560px;margin:0 auto"><div class="card-x" style="padding:22px">${h}<div class="text-center mt-3"><a class="btn-o" href="${esc(location.pathname)}">Buka aplikasi LAGUSIT e-PEGAWAI</a></div></div><p class="muted small text-center mt-3">Pengesahan elektronik ini adalah pengesahan internal aplikasi LAGUSIT e-PEGAWAI (kode, sidik SHA-256, dan segel server), bukan tanda tangan elektronik tersertifikasi.</p></div>`;
  w.innerHTML = kartu('<div class="text-center py-4"><span class="spinner-border"></span><p class="muted mt-2 mb-0">Memeriksa keaslian dokumen...</p></div>');
  let r; try { r = await api('cekTte', kode); } catch (e) { r = { success: false, message: e.message }; }
  if (!r.success) return void (w.innerHTML = kartu(`<h2 class="h5 text-center">Pemeriksaan gagal</h2><p class="text-center mb-0">${esc(r.message)}</p>`));
  const d = r.data; if (!d.ditemukan) return void (w.innerHTML = kartu(`<div class="text-center"><div style="font-size:48px;color:#B91C1C"><i class="bi bi-x-octagon"></i></div><h2 class="h5">Dokumen tidak ditemukan</h2><p class="mb-0">Kode <b>${esc(kode)}</b> tidak terdaftar atau dokumennya belum disahkan. Periksa kembali kode pada cetakan.</p></div>`));
  const T = { SAH: ['#166534', 'bi-patch-check-fill', 'DOKUMEN SAH'], DICABUT: ['#B91C1C', 'bi-slash-circle-fill', 'PENGESAHAN DICABUT'], 'TIDAK VALID': ['#B91C1C', 'bi-exclamation-octagon-fill', 'TIDAK VALID'] }[d.status];
  const baris = (k, v) => v ? `<tr><th style="width:38%;font-weight:600;color:var(--muted)">${k}</th><td>${esc(v)}</td></tr>` : '';
  w.innerHTML = kartu(`<div class="text-center mb-3"><div style="font-size:54px;color:${T[0]}"><i class="bi ${T[1]}"></i></div><h2 class="h4" style="color:${T[0]};font-weight:800">${T[2]}</h2>${d.sebab ? `<p class="mb-0">${esc(d.sebab)}</p>` : ''}</div>
  <table class="table table-sm mb-0"><tbody>${baris('Instansi', d.Instansi)}${baris('Jenis dokumen', d.Jenis)}${baris('Judul', d.Judul)}${baris('Nomor', d.Nomor)}${baris('Disahkan oleh', d.Penandatangan)}${baris('Jabatan', d.Jabatan)}${baris('NIP', d.NIP)}${baris('Waktu pengesahan', tteTgl(d.Disahkan))}${baris('Kode verifikasi', d.Kode)}<tr><th style="font-weight:600;color:var(--muted)">Sidik SHA-256</th><td><code style="word-break:break-all;font-size:11px">${esc(d.Sidik)}</code></td></tr></tbody></table>`);
}
(window.MOD = window.MOD || []).push('Tte');
