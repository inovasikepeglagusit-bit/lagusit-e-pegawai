// ── Kehadiran Saya: rekap, grafik, kalender, dan riwayat kehadiran apel milik pegawai yang sedang masuk ──
const STB = s => `<span class="stb" style="--c:${GF_HADIR[s] || '#64748B'}">${esc(s)}</span>`;
const NAMA_HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const geserBln = (ym, n) => { const d = new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7) - 1 + n, 1)); return d.toISOString().slice(0, 7); };
const jmlHari = ym => new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7), 0)).getUTCDate();
function khKalender(d) {
  const per = {}; d.riwayat.forEach(h => (per[h.Tanggal] = per[h.Tanggal] || []).push(h));
  const awal = new Date(Date.UTC(+d.bulan.slice(0, 4), +d.bulan.slice(5, 7) - 1, 1)).getUTCDay(); let h = NAMA_HARI.map(x => `<b>${x}</b>`).join('') + '<i></i>'.repeat(awal);
  for (let i = 1; i <= jmlHari(d.bulan); i++) {
    const t = d.bulan + '-' + String(i).padStart(2, '0'), L = per[t] || [], tip = L.map(x => (x.Jenis === 'regu' ? x.Regu + ' ' : 'Apel ') + x.Sesi + ': ' + x.Status + (x.Keterangan ? ' (' + x.Keterangan + ')' : '')).join('; ');
    h += `<div class="kd${t === today() ? ' ini' : ''}${L.length ? ' ada' : ''}" ${tip ? `title="${esc(tip)}" tabindex="0" aria-label="${i}: ${esc(tip)}"` : ''}><span>${i}</span><em>${L.map(x => `<u style="background:${GF_HADIR[x.Status] || '#64748B'}"></u>`).join('')}</em></div>`;
  }
  return `<div class="kcal" role="group" aria-label="Kalender kehadiran ${blLabel(d.bulan)}">${h}</div><div class="stk-l kleg">${STATUS_X.map(s => `<span><i class="sw" style="background:${GF_HADIR[s]}"></i>${s}</span>`).join('')}</div>`;
}
RENDER.kehadiran = async () => {
  const r = await call('getKehadiranSaya', S.khb || ''); if (!r) return; const d = r.data, c = $('app-container');
  if (!d.tertaut) { c.innerHTML = `<div class="card-x"><h3 class="jd">Kehadiran Saya</h3><p class="muted mb-0">Akun Anda belum terhubung dengan data pegawai. Pastikan email akun sama dengan email di data pegawai, atau minta Super Admin menautkannya.</p></div>`; return; }
  S.khb = d.bulan; const R = d.ringkas, n = R.status, hadir = n.Hadir + n.Terlambat, lain = n.Izin + n.Sakit + n['Dinas Luar'] + n['Tidak Hadir'];
  const trend = d.tren.filter(x => x.v != null).map(x => ({ l: blLabel(x.k), t: blLabel(x.k), v: x.v }));
  const th = d.tahun.status, don = STATUS_X.map(s => ({ l: s, v: th[s], c: GF_HADIR[s] })).filter(x => x.v);
  const ket = Object.keys(R.ket).sort((a, b) => R.ket[b] - R.ket[a]);
  c.innerHTML = `<div class="kh">
  <section class="card-x kh-head"><div class="grow"><b>${esc(d.pegawai.Nama)}</b><small class="muted d-block">${esc([d.pegawai.NIP, d.pegawai.Unit, d.pegawai.Jabatan].filter(Boolean).join(' · '))}</small></div>
    <div class="kh-nav"><button type="button" class="btn-o" onclick="khGanti(-1)" ${d.bulan <= d.awal ? 'disabled' : ''} aria-label="Bulan sebelumnya"><i class="bi bi-chevron-left"></i></button><b>${blLabel(d.bulan)}</b><button type="button" class="btn-o" onclick="khGanti(1)" ${d.bulan >= d.sekarang ? 'disabled' : ''} aria-label="Bulan berikutnya"><i class="bi bi-chevron-right"></i></button></div></section>
  ${d.suratMenunggu ? `<div class="card-x ket-w"><i class="bi bi-hourglass-split"></i> ${d.suratMenunggu} surat Anda masih menunggu verifikasi. <a href="javascript:void(0)" onclick="navigateTo('absen')">Lihat</a></div>` : ''}
  <div class="grid4">${statRing('Persentase kehadiran', R.pct == null ? '–' : gfPct(R.pct), R.jumlah ? 'dari ' + R.jumlah + ' apel ' + blLabel(d.bulan) : 'Belum ada apel selesai', R.pct == null ? 0 : R.pct, 't-green')}
    ${statK('Hadir tepat waktu', n.Hadir, 'Apel diikuti tepat waktu', 'bi-person-check', 't-green')}${statK('Terlambat', n.Terlambat, hadir ? 'Tetap tercatat hadir' : 'Tidak ada', 'bi-alarm', 't-amber')}
    ${statK('Tidak mengikuti', lain, [n.Izin && n.Izin + ' izin/cuti', n.Sakit && n.Sakit + ' sakit', n['Dinas Luar'] && n['Dinas Luar'] + ' dinas luar', n['Tidak Hadir'] && n['Tidak Hadir'] + ' alpa'].filter(Boolean).join(' · ') || 'Tidak ada', 'bi-calendar-x', lain ? 't-red' : 't-blue')}</div>
  <div class="grid2">
    <section class="card-x"><div class="sec-h"><h3 class="jd">Tren 6 bulan</h3></div>${trend.length ? gfDaftar('gfSaya', trend.length > 1 ? 'garis' : 'batang', trend, 'Persentase kehadiran per bulan') : kosong('belum ada apel yang diselesaikan.')}</section>
    <section class="card-x"><div class="sec-h"><h3 class="jd">Komposisi ${d.bulan.slice(0, 4)}</h3></div>${don.length ? gfDonat('gfSayaD', don, [String(d.tahun.jumlah), 'apel']) : kosong('belum ada apel yang diselesaikan.')}</section>
  </div>
  <div class="grid2">
    <section class="card-x"><div class="sec-h"><h3 class="jd">Kalender kehadiran</h3></div>${khKalender(d)}</section>
    <section class="card-x"><div class="sec-h"><h3 class="jd">Rincian bulan ini</h3></div>${R.jumlah ? gfTumpuk(STATUS_X.map(s => ({ l: s, v: n[s], c: GF_HADIR[s] }))) : kosong('belum ada apel yang diselesaikan.')}
      ${ket.length ? `<h4 class="h6 mt-3">Keterangan</h4><div class="kchips">${ket.map(k => `<span class="kchip">${esc(k)} <b>${R.ket[k]}</b></span>`).join('')}</div>` : ''}</section>
  </div>
  <section class="card-x"><div class="sec-h"><h3 class="jd">Riwayat ${blLabel(d.bulan)}</h3><span class="muted small">${d.riwayat.length} catatan</span></div>
    ${d.riwayat.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Tanggal</th><th>Apel</th><th>Status</th><th>Keterangan</th><th>Catatan</th></tr></thead><tbody>${d.riwayat.map(h => `<tr><td>${tglIndo(h.Tanggal)}</td><td>${h.Jenis === 'regu' ? esc(h.Regu) + ' · ' : 'Apel staf · '}${esc(h.Sesi)}</td><td>${STB(h.Status)}</td><td>${esc(h.Keterangan) || '–'}${h.Sumber === 'Surat' ? ' <i class="bi bi-envelope-check" title="Dari surat yang sudah diverifikasi"></i>' : ''}</td><td>${esc(h.Catatan) || '–'}</td></tr>`).join('')}</tbody></table></div>` : kosong('tidak ada apel yang diselesaikan pada bulan ini.')}</section></div>`;
  gfPasang();
};
function khGanti(n) { S.khb = geserBln(S.khb || today().slice(0, 7), n); RENDER.kehadiran(); }
(window.MOD = window.MOD || []).push('Kehadiran');
