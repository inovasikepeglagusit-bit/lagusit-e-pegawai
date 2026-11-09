// ── Link Berita & Publikasi: operator yang ditunjuk Super Admin mencatat tautan; laporan dapat ditarik, dicetak, atau diunduh kapan saja ──
Object.assign(TITLES, { berita: 'Link Berita & Publikasi' }); Object.assign(ICONS, { berita: 'bi-link-45deg' });
Object.assign(KATA, { berita: 'link berita publikasi media sosial instagram facebook tiktok youtube twitter website pemberitaan laporan humas' }); Object.assign(TILE, { berita: 'Link Berita' });
const BR_IKON = { Instagram: 'bi-instagram', Facebook: 'bi-facebook', X: 'bi-twitter-x', TikTok: 'bi-tiktok', YouTube: 'bi-youtube', Website: 'bi-globe2', 'Berita Eksternal': 'bi-newspaper', Lainnya: 'bi-link-45deg' };
/** Sama dengan pengenal platform di server; hanya untuk pratinjau, server tetap menentukan. */
function brPlatform(u) {
  const h = ((String(u).match(/^https?:\/\/([^\/?#:]+)/i) || [, ''])[1] || '').toLowerCase().replace(/^(www|m|mobile|web|vt|vm)\./, ''), dom = (...L) => L.some(d => h === d || h.endsWith('.' + d));
  if (!h) return ''; if (dom('instagram.com', 'instagr.am')) return 'Instagram'; if (dom('facebook.com', 'fb.com', 'fb.watch', 'fb.me')) return 'Facebook'; if (dom('x.com', 'twitter.com', 't.co')) return 'X'; if (dom('tiktok.com')) return 'TikTok'; if (dom('youtube.com', 'youtu.be')) return 'YouTube'; return 'Berita Eksternal';
}
const brAman = u => /^https?:\/\//i.test(u) ? u : '#';
const brAwalBulan = (d = new Date()) => { const t = new Date(d.getFullYear(), d.getMonth(), 1); return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-01'; };
const brHariTerakhir = (y, m) => y + '-' + String(m).padStart(2, '0') + '-' + String(new Date(y, m, 0).getDate()).padStart(2, '0');
function brPeriodeTeks(f) { return f.dari || f.sampai ? (f.dari ? tglIndo(f.dari) : 'awal') + ' s.d. ' + (f.sampai ? tglIndo(f.sampai) : 'sekarang') : 'Seluruh periode'; }
RENDER.berita = async () => {
  const f = S.bf = S.bf || { dari: brAwalBulan(), sampai: '', platform: '', kegiatan: '', cari: '' };
  const r = await call('getBerita', f); if (!r) return; S.bd = r.data; const d = r.data;
  $('app-container').innerHTML = `<div class="br"><section class="card-x mb-3"><div class="d-flex flex-wrap align-items-center gap-2"><div class="grow"><h3 class="jd mb-1">Link berita & publikasi</h3><p class="muted small mb-0">${d.tulis ? 'Catat tautan publikasi kegiatan (media sosial, website, berita eksternal) untuk bahan pelaporan.' : 'Anda dapat melihat dan mencetak laporan. Pencatatan dilakukan petugas yang ditunjuk Super Admin.'}</p></div>
  ${d.tulis ? '<button class="btn-x" onclick="brForm()"><i class="bi bi-plus-lg"></i> Tambah tautan</button>' : ''}<button class="btn-o" onclick="brCetak()"><i class="bi bi-printer"></i> Cetak laporan</button><button class="btn-o" onclick="brCsv()"><i class="bi bi-filetype-csv"></i> Unduh CSV</button>${d.admin ? '<button class="btn-o" onclick="brPetugas()"><i class="bi bi-person-gear"></i> Petugas</button>' : ''}</div></section>
  <div class="row g-2 mb-3"><div class="col-6 col-md-3 col-xl"><button class="card-x w-100 text-start brk ${f.platform ? '' : 'on'}" onclick="brPf('')"><div class="muted small">Semua platform</div><b style="font-size:24px">${d.total}</b></button></div>${d.platform.map(p => `<div class="col-6 col-md-3 col-xl"><button class="card-x w-100 text-start brk ${f.platform === p ? 'on' : ''}" onclick="brPf('${p}')"><div class="muted small"><i class="bi ${BR_IKON[p]}"></i> ${p}</div><b style="font-size:24px">${d.perPlatform[p] || 0}</b></button></div>`).join('')}</div>
  <section class="card-x"><div class="row g-2 mb-2"><div class="col-6 col-md-3"><label class="lbl small" for="brd">Dari tanggal</label><input id="brd" type="date" class="form-control" value="${esc(f.dari || '')}"></div><div class="col-6 col-md-3"><label class="lbl small" for="brs">Sampai tanggal</label><input id="brs" type="date" class="form-control" value="${esc(f.sampai || '')}"></div>
  <div class="col-md-3"><label class="lbl small" for="brg">Kegiatan</label><select id="brg" class="form-select"><option value="">Semua kegiatan</option>${d.kegiatan.map(k => `<option ${f.kegiatan === k ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select></div><div class="col-md-3"><label class="lbl small" for="brq">Cari</label><input id="brq" class="form-control" value="${esc(f.cari || '')}" placeholder="judul, tautan, akun..." onkeydown="if(event.key==='Enter')brCari()"></div></div>
  <div class="d-flex flex-wrap gap-2 mb-3"><button class="btn-x sm" onclick="brCari()"><i class="bi bi-funnel"></i> Terapkan</button>${[['Bulan ini', 'bulan'], ['Bulan lalu', 'lalu'], ['Triwulan ini', 'tw'], ['Tahun ini', 'tahun'], ['Semua', 'semua']].map(x => `<button class="btn-o sm" onclick="brPra('${x[1]}')">${x[0]}</button>`).join('')}<span class="muted small align-self-center ms-auto">${d.total} tautan · ${esc(brPeriodeTeks(f))}${d.terpotong ? ' · 1.000 teratas ditampilkan' : ''}</span></div>
  ${d.daftar.length ? `<div class="table-responsive"><table class="table align-middle"><thead><tr><th>Tanggal</th><th>Platform</th><th>Judul / keterangan</th><th>Kegiatan</th><th>Dicatat oleh</th><th></th></tr></thead><tbody>${d.daftar.map((x, i) => `<tr><td class="nw">${esc(tglIndo(x.Tanggal))}</td><td class="nw"><i class="bi ${BR_IKON[x.Platform] || 'bi-link-45deg'}"></i> ${esc(x.Platform)}</td><td><a href="${esc(brAman(x.URL))}" target="_blank" rel="noopener noreferrer"><b>${esc(x.Judul)}</b></a>${x.Akun ? `<div class="muted small">${esc(x.Akun)}</div>` : ''}<div class="muted small" style="word-break:break-all">${esc(x.URL)}</div>${x.Catatan ? `<div class="small">${esc(x.Catatan)}</div>` : ''}</td><td>${esc(x.Kegiatan)}</td><td class="nw">${esc(x.Pembuat)}</td><td class="nw">${d.tulis && (d.admin || x.Milik) ? `<button class="btn-o sm" onclick="brForm(${i})" aria-label="Ubah"><i class="bi bi-pencil"></i></button> <button class="btn-o sm" onclick="brHapus(${i})" aria-label="Hapus"><i class="bi bi-trash"></i></button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted text-center py-4 mb-0">Belum ada tautan pada periode dan penyaring ini.</p>'}</section></div>`;
};
function brPf(p) { S.bf.platform = p; RENDER.berita(); }
function brCari() { Object.assign(S.bf, { dari: $('brd').value, sampai: $('brs').value, kegiatan: $('brg').value, cari: $('brq').value.trim() }); RENDER.berita(); }
function brPra(k) {
  const n = new Date(), y = n.getFullYear(), m = n.getMonth() + 1, p = String(m).padStart(2, '0');
  const P = { bulan: [y + '-' + p + '-01', ''], lalu: m === 1 ? [(y - 1) + '-12-01', (y - 1) + '-12-31'] : [y + '-' + String(m - 1).padStart(2, '0') + '-01', brHariTerakhir(y, m - 1)], tw: (() => { const a = Math.floor((m - 1) / 3) * 3 + 1; return [y + '-' + String(a).padStart(2, '0') + '-01', brHariTerakhir(y, a + 2)]; })(), tahun: [y + '-01-01', y + '-12-31'], semua: ['', ''] }[k];
  Object.assign(S.bf, { dari: P[0], sampai: P[1] }); RENDER.berita();
}
function brForm(i) {
  const x = i === undefined ? {} : S.bd.daftar[i], d = S.bd;
  openModal(x.ID ? 'Ubah tautan' : 'Tambah tautan', `<form onsubmit="brSimpan(event,'${x.ID || ''}')"><div class="row g-3">
  <div class="col-md-4"><label class="lbl" for="bft">Tanggal publikasi *</label><input id="bft" type="date" class="form-control" required value="${esc(x.Tanggal || today())}"></div>
  <div class="col-md-8"><label class="lbl" for="bfu">Tautan (URL) *</label><input id="bfu" type="url" class="form-control" required maxlength="500" placeholder="https://..." value="${esc(x.URL || '')}" oninput="brDeteksi()"><div class="muted small mt-1" id="bfd"></div></div>
  <div class="col-md-5"><label class="lbl" for="bfp">Platform</label><select id="bfp" class="form-select"><option value="">Otomatis dari tautan</option>${d.platform.map(p => `<option ${x.Platform === p ? 'selected' : ''}>${p}</option>`).join('')}</select></div>
  <div class="col-md-7"><label class="lbl" for="bfa">Akun / sumber (opsional)</label><input id="bfa" class="form-control" maxlength="100" value="${esc(x.Akun || '')}" placeholder="mis. @lapasgunungsitoli, antaranews.com"></div>
  <div class="col-12"><label class="lbl" for="bfj">Judul / keterangan singkat *</label><input id="bfj" class="form-control" required minlength="3" maxlength="200" value="${esc(x.Judul || '')}"></div>
  <div class="col-md-6"><label class="lbl" for="bfk">Kegiatan (opsional)</label><input id="bfk" class="form-control" list="bfkl" maxlength="120" value="${esc(x.Kegiatan || '')}" placeholder="Dipakai untuk mengelompokkan laporan"><datalist id="bfkl">${d.kegiatan.map(k => `<option value="${esc(k)}">`).join('')}</datalist></div>
  <div class="col-md-6"><label class="lbl" for="bfc">Catatan (opsional)</label><input id="bfc" class="form-control" maxlength="300" value="${esc(x.Catatan || '')}"></div></div>
  <div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">Simpan</button></div></form>`); brDeteksi();
}
function brDeteksi() { const e = $('bfd'); if (!e) return; const p = brPlatform($('bfu').value.trim()); e.innerHTML = p ? `Terdeteksi: <b><i class="bi ${BR_IKON[p]}"></i> ${p}</b>` : ''; }
async function brSimpan(e, id) {
  e.preventDefault(); const b = e.submitter; busy(b, true);
  const r = await call('simpanBerita', { ID: id || undefined, Tanggal: $('bft').value, URL: $('bfu').value.trim(), Platform: $('bfp').value, Akun: $('bfa').value, Judul: $('bfj').value, Kegiatan: $('bfk').value, Catatan: $('bfc').value }); busy(b, false);
  if (r) { closeModal(); toast(r.message); RENDER.berita(); }
}
function brHapus(i) { const x = S.bd.daftar[i]; openModal('Hapus tautan', `<p>Hapus tautan <b>${esc(x.Judul)}</b> (${esc(x.Platform)}) dari daftar? Tindakan ini tidak bisa dibatalkan.</p><div class="text-end"><button class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" onclick="brHapusGo('${x.ID}')">Hapus</button></div>`); }
async function brHapusGo(id) { const r = await call('hapusBerita', id); if (r) { closeModal(); toast(r.message); RENDER.berita(); } }

// ── Laporan: cetak (kop surat, bisa disahkan elektronik) dan CSV ──
function brCetak() { if (!S.bd.daftar.length) return toast('Tidak ada tautan pada periode ini.', 'warning'); cetakForm('laporan link berita', 'brCetakGo'); }
async function brCetakGo(e) {
  e.preventDefault(); const c = cetakAmbil(); if (!c) return; closeModal(); const d = S.bd, f = S.bf, per = d.platform.filter(p => d.perPlatform[p]);
  const judul = 'Laporan link berita ' + brPeriodeTeks(f);
  await cetakAtauTte(c, judul, 'Laporan Link Berita', true, `<h2>LAPORAN PUBLIKASI DAN PEMBERITAAN<br>${esc((TP.instansi || '').toUpperCase())}<br>PERIODE: ${esc(brPeriodeTeks(f).toUpperCase())}</h2>
  <p style="margin:6px 0 4px"><b>Rekap per platform</b>${f.kegiatan ? ' · Kegiatan: ' + esc(f.kegiatan) : ''}</p><table><thead><tr><th>Platform</th><th>Jumlah tautan</th></tr></thead><tbody>${per.map(p => `<tr><td class="l">${esc(p)}</td><td>${d.perPlatform[p]}</td></tr>`).join('')}<tr><td class="l"><b>Total</b></td><td><b>${d.total}</b></td></tr></tbody></table>
  <p style="margin:10px 0 4px"><b>Daftar tautan</b></p><table><thead><tr><th>No</th><th>Tanggal</th><th>Platform</th><th>Judul / keterangan</th><th>Tautan</th></tr></thead><tbody>${d.daftar.map((x, i) => `<tr><td>${i + 1}</td><td>${esc(tglIndo(x.Tanggal))}</td><td>${esc(x.Platform)}</td><td class="l">${esc(x.Judul)}${x.Kegiatan ? `<br><i>${esc(x.Kegiatan)}</i>` : ''}</td><td class="l" style="word-break:break-all;font-size:9px">${esc(x.URL)}</td></tr>`).join('')}</tbody></table>${d.terpotong ? '<p>Catatan: hanya 1.000 tautan teratas yang dimuat. Persempit periode untuk laporan lengkap.</p>' : ''}${c.ttd}`);
}
function brCsv() {
  const L = S.bd.daftar; if (!L.length) return toast('Tidak ada tautan pada periode ini.', 'warning');
  const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""').replace(/^([=+\-@\t\r])/, "'$1") + '"'; // cegah rumus pada Excel
  const csv = '﻿' + [['No', 'Tanggal', 'Platform', 'Judul', 'Tautan', 'Akun/Sumber', 'Kegiatan', 'Catatan', 'Dicatat oleh']].concat(L.map((x, i) => [i + 1, x.Tanggal, x.Platform, x.Judul, x.URL, x.Akun, x.Kegiatan, x.Catatan, x.Pembuat])).map(r => r.map(q).join(',')).join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = 'link-berita-' + today() + '.csv'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

// ── Penunjukan petugas (Super Admin) ──
async function brPetugas() {
  const r = await call('listAkun'); if (!r) return; const cur = new Set(S.bd.petugas.map(p => p.Email));
  const L = r.data.akun.filter(a => a.Status === 'Aktif' && String(a.Roles).split(',').some(x => ['Operator', 'Atasan', 'Pimpinan'].includes(x)));
  openModal('Petugas Link Berita', `<form onsubmit="brPetugasSimpan(event)"><p class="muted small">Akun yang dicentang dapat mencatat tautan. Super Admin selalu dapat; Pimpinan hanya melihat dan mencetak. Petugas hanya dapat mengubah atau menghapus tautan yang ia catat sendiri.</p>${L.length ? `<div class="d-flex flex-column gap-1" style="max-height:50vh;overflow:auto">${L.map((a, i) => `<label class="d-flex gap-2 align-items-center"><input type="checkbox" data-em="${esc(a.Email)}" ${cur.has(String(a.Email).toLowerCase()) ? 'checked' : ''}> <span>${esc(a.Nama)} <span class="muted small">· ${esc(a.Email)} · ${esc(a.Roles)}</span></span></label>`).join('')}</div>` : '<p class="muted">Belum ada akun Operator, Atasan, atau Pimpinan yang aktif.</p>'}<div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">Simpan</button></div></form>`);
}
async function brPetugasSimpan(e) {
  e.preventDefault(); const b = e.submitter, em = [...document.querySelectorAll('#mdlB [data-em]:checked')].map(x => x.dataset.em); busy(b, true);
  const r = await call('aturPetugasBerita', em); busy(b, false); if (r) { closeModal(); toast(r.message); RENDER.berita(); }
}
(window.MOD = window.MOD || []).push('Berita');
