// ── Cuti & Izin: pegawai mengajukan surat cuti/izin/sakit dengan lampiran; Super Admin memverifikasi; apel terisi otomatis ──
const rentangSurat = x => `${tglIndo(x.Mulai)} s.d. ${tglIndo(x.Sampai)} (${x.Hari} hari)`;
const stSurat = s => `<span class="badge-x ${s === 'Disetujui' ? 'ok' : s === 'Menunggu' ? 'wait' : 'off'}">${esc(s)}</span>`;
RENDER.absen = async () => {
  const r = await call('getAbsenMeta'); if (!r) return; const d = S.am = r.data, adm = d.admin;
  const bisa = (d.saya || adm) && d.opsi.length;
  $('app-container').innerHTML = `<div class="card-x mb-3"><div class="rowb"><div class="grow"><h3 class="h6 mb-1">${adm ? 'Surat cuti, izin, dan sakit pegawai' : 'Surat cuti, izin, dan sakit saya'}</h3><p class="muted small mb-0">Ajukan surat beserta lampirannya. Setelah diverifikasi Super Admin, kehadiran apel pada tanggal surat terisi otomatis dan tidak perlu diisi operator.</p></div>${bisa && d.saya ? '<button class="btn-x" onclick="formSurat()"><i class="bi bi-plus-lg"></i> Ajukan surat</button>' : ''}${bisa && adm ? '<button class="btn-o" onclick="formSurat(true)">Catat atas nama pegawai</button>' : ''}</div>
  ${!d.saya && !adm ? '<p class="text-danger small mt-2 mb-0">Akun Anda belum tertaut ke data pegawai. Hubungi Super Admin.</p>' : ''}${!d.opsi.length ? '<p class="text-danger small mt-2 mb-0">Belum ada jenis ketidakhadiran yang dapat diajukan dengan surat. Hubungi Super Admin.</p>' : ''}</div>
  <div class="card-x"><h3 class="h6">Riwayat surat</h3>${d.surat.length ? `<div class="table-wrap"><table class="table"><thead><tr>${adm ? '<th>Pegawai</th>' : ''}<th>Jenis</th><th>Periode</th><th>Status</th><th>Diajukan</th><th></th></tr></thead><tbody>${d.surat.map(x => `<tr>${adm ? `<td>${esc(x.Nama)}</td>` : ''}<td>${esc(x.Jenis)}${x.NoSurat ? `<br><small class="muted">No. ${esc(x.NoSurat)}</small>` : ''}</td><td>${rentangSurat(x)}</td><td>${stSurat(x.Status)}${x.Alasan ? `<br><small class="muted">${esc(x.Alasan)}</small>` : ''}${x.Status === 'Disetujui' && x.Diterapkan ? `<br><small class="muted">${x.Diterapkan} catatan apel terisi</small>` : ''}</td><td class="nw">${waktu(x.Diajukan)}</td><td class="nw">${x.NamaBerkas ? `<button class="btn-o" onclick="lihatSuratUI('${x.ID}')">Lampiran</button>` : ''}${x.Status === 'Menunggu' && !adm ? ` <button class="btn-o danger" onclick="batalSuratUI('${x.ID}')">Batalkan</button>` : ''}${x.Status === 'Menunggu' && adm ? ` <button class="btn-o" onclick="bukaMenu('master','persetujuan')">Putuskan</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : kosong('belum ada surat yang diajukan.')}</div>`;
};
function formSurat(atasNama) {
  const d = S.am, adm = d.admin, min = adm ? '' : ` min="${geserTgl(today(), -d.mundur)}"`;
  openModal(atasNama ? 'Catat surat atas nama pegawai' : 'Ajukan surat', `<form onsubmit="kirimSurat(event,${atasNama ? 'true' : 'false'})"><div class="row g-3">
  ${atasNama ? `<div class="col-12"><label class="lbl" for="sg">Pegawai</label><select id="sg" class="form-select" required><option value="">Pilih pegawai...</option>${d.pegawai.map(p => `<option value="${p.ID}">${esc(p.Nama)} · ${esc(p.NIP)}</option>`).join('')}</select><div class="small muted mt-1">Surat yang dicatat Super Admin langsung disetujui.</div></div>` : ''}
  <div class="col-12"><label class="lbl" for="sj">Jenis</label><select id="sj" class="form-select" required>${d.opsi.map(o => `<option>${esc(o.Nama)}</option>`).join('')}</select></div>
  <div class="col-6"><label class="lbl" for="sm">Tanggal mulai</label><input id="sm" type="date" class="form-control" value="${today()}"${min} required></div>
  <div class="col-6"><label class="lbl" for="ss">Tanggal berakhir</label><input id="ss" type="date" class="form-control" value="${today()}" required></div>
  <div class="col-12"><label class="lbl" for="sn">Nomor surat (opsional)</label><input id="sn" class="form-control" maxlength="60"></div>
  <div class="col-12"><label class="lbl" for="sc">Catatan (opsional)</label><input id="sc" class="form-control" maxlength="200"></div>
  <div class="col-12"><label class="lbl" for="sf">Lampiran surat *</label><input id="sf" type="file" accept="application/pdf,image/*" class="form-control" required><div class="small muted mt-1">PDF atau foto, maksimal 5 MB. Maksimal ${d.maksHari} hari per surat${adm ? '' : `; tanggal mulai paling lama ${d.mundur} hari ke belakang`}.</div></div></div>
  <div class="text-end mt-4"><button type="button" class="btn-o" data-bs-dismiss="modal">Batal</button> <button class="btn-x" type="submit">${atasNama ? 'Catat dan setujui' : 'Kirim untuk diverifikasi'}</button></div></form>`);
}
function geserTgl(t, n) { const x = new Date(t + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); }
async function kirimSurat(e, atasNama) {
  e.preventDefault(); const b = e.target.querySelector('[type=submit]'), f = $('sf').files[0];
  try {
    if (!f) throw new Error('Lampiran surat wajib dilampirkan.');
    if ($('ss').value < $('sm').value) throw new Error('Tanggal berakhir tidak boleh sebelum tanggal mulai.');
    busy(b, true);
    let b64;
    if (/^image\//.test(f.type)) b64 = await kompres(f); else if (f.type === 'application/pdf') { if (f.size > 5 * 1024 * 1024) throw new Error('Ukuran PDF maksimal 5 MB.'); b64 = await bacaB64(f); } else throw new Error('Lampiran harus berupa PDF atau foto.');
    const d = { Jenis: $('sj').value, Mulai: $('sm').value, Sampai: $('ss').value, NoSurat: $('sn').value, Catatan: $('sc').value, nama: f.name, b64 };
    if (atasNama) d.PegawaiID = $('sg').value;
    const r = await call('ajukanSurat', d); busy(b, false);
    if (r) { closeModal(); toast(r.message); RENDER.absen(); muatNotif(); }
  } catch (x) { busy(b, false); toast(x.message, 'danger'); }
}
function batalSuratUI(id) { openModal('Batalkan surat', `<p>Surat yang belum diputuskan akan dibatalkan. Anda dapat mengajukan surat baru setelahnya.</p><div class="text-end mt-3"><button type="button" class="btn-o" data-bs-dismiss="modal">Kembali</button> <button class="btn-x" onclick="batalSuratGo('${id}')">Batalkan surat</button></div>`); }
async function batalSuratGo(id) { const r = await call('batalkanSurat', id); if (r) { closeModal(); toast(r.message); RENDER.absen(); } }

(window.MOD = window.MOD || []).push('Absen');
