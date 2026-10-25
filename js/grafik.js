// ── Grafik SVG ringan (tanpa pustaka): garis/area, batang, donat, cincin, dan bilah bertumpuk ──
// Warna memakai variabel CSS sehingga mode gelap dan tema Super Admin langsung berlaku tanpa menggambar ulang.
const GF = {}; // id -> konfigurasi grafik garis/batang yang menunggu digambar setelah kerangkanya masuk ke halaman
const GF_PALET = ['#2563EB', '#F59E0B', '#10B981', '#8B5CF6', '#EF4444', '#64748B', '#06B6D4', '#EC4899'];
const GF_HADIR = { 'Hadir': '#16A34A', 'Terlambat': '#F59E0B', 'Izin': '#38BDF8', 'Sakit': '#2563EB', 'Dinas Luar': '#8B5CF6', 'Tidak Hadir': '#EF4444' };
const gfPct = v => String(Math.round(v * 10) / 10).replace('.', ',') + '%';
const gfAria = (judul, pts) => judul + ': ' + pts.map(p => (p.t || p.l) + ' ' + gfPct(p.v)).join(', ');

/** Kerangka grafik garis atau batang; gambar sebenarnya dibuat oleh gfPasang() setelah elemen berada di halaman (butuh lebar nyata). */
function gfDaftar(id, tipe, pts, judul) { GF[id] = { tipe, pts, judul }; return `<div class="gf" id="${id}" role="img" aria-label="${esc(gfAria(judul, pts))}"></div>`; }

function gfSkala(vals, tipe) { // sumbu persen: garis boleh memotong bagian bawah agar perubahan terlihat; batang selalu dari 0
  const lo = tipe === 'batang' ? 0 : Math.max(0, Math.floor((Math.min(...vals) - 8) / 20) * 20), step = { 0: 25, 20: 20, 40: 15, 60: 10, 80: 10 }[lo], t = [];
  for (let v = lo; v <= 100; v += step) t.push(v);
  return { lo, ticks: t };
}
function gfMono(P) { // kurva mulus yang tidak melampaui titik data (Fritsch–Carlson)
  const n = P.length; if (n < 2) return '';
  const dx = [], m = [], t = [];
  for (let i = 0; i < n - 1; i++) { dx[i] = P[i + 1][0] - P[i][0]; m[i] = (P[i + 1][1] - P[i][1]) / dx[i]; }
  t[0] = m[0]; t[n - 1] = m[n - 2]; for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = t[i + 1] = 0; continue; }
    const a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b; if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
  }
  let d = 'M' + P[0][0].toFixed(1) + ',' + P[0][1].toFixed(1);
  for (let i = 0; i < n - 1; i++) { const h = dx[i] / 3; d += ` C${(P[i][0] + h).toFixed(1)},${(P[i][1] + t[i] * h).toFixed(1)} ${(P[i + 1][0] - h).toFixed(1)},${(P[i + 1][1] - t[i + 1] * h).toFixed(1)} ${P[i + 1][0].toFixed(1)},${P[i + 1][1].toFixed(1)}`; }
  return d;
}
function gfGambar(id) {
  const el = document.getElementById(id), c = GF[id]; if (!el || !c || !c.pts.length) return;
  const W = Math.max(260, Math.round(el.clientWidth || 560)), H = W < 460 ? 200 : 248, m = { l: 40, r: 16, t: 30, b: 30 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
  const P = c.pts, n = P.length, bar = c.tipe === 'batang', { lo, ticks } = gfSkala(P.map(p => p.v), c.tipe);
  const x = i => bar ? m.l + iw * (i + .5) / n : m.l + (n === 1 ? iw / 2 : iw * i / (n - 1)), y = v => m.t + ih * (1 - (v - lo) / (100 - lo)), y0 = m.t + ih;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true"><defs><linearGradient id="${id}a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--primer);stop-opacity:.36"/><stop offset="1" style="stop-color:var(--primer);stop-opacity:0"/></linearGradient><linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--primer)"/><stop offset="1" style="stop-color:var(--primer);stop-opacity:.45"/></linearGradient><linearGradient id="${id}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--amber)"/><stop offset="1" style="stop-color:var(--gold);stop-opacity:.55"/></linearGradient></defs>`;
  ticks.forEach(v => { s += `<line class="gl" x1="${m.l}" x2="${W - m.r}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text class="gt" x="${m.l - 8}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${v}%</text>`; });
  if (bar) {
    const bw = Math.min(46, iw / n * .56);
    s += '<g class="bars">' + P.map((p, i) => { const h = Math.max(3, y0 - y(p.v)), r = Math.min(9, h / 2), bx = x(i) - bw / 2, by = y0 - h; return `<path class="bar-r${i === n - 1 ? ' last' : ''}" data-i="${i}" style="animation-delay:${i * 70}ms" fill="url(#${id}${i === n - 1 ? 'c' : 'b'})" d="M${bx.toFixed(1)},${y0} V${(by + r).toFixed(1)} Q${bx.toFixed(1)},${by.toFixed(1)} ${(bx + r).toFixed(1)},${by.toFixed(1)} H${(bx + bw - r).toFixed(1)} Q${(bx + bw).toFixed(1)},${by.toFixed(1)} ${(bx + bw).toFixed(1)},${(by + r).toFixed(1)} V${y0} Z"/>`; }).join('') + '</g>';
    if (n <= 8) s += P.map((p, i) => `<text class="gv" x="${x(i).toFixed(1)}" y="${(y(p.v) - 7).toFixed(1)}">${String(Math.round(p.v)).replace('.', ',')}</text>`).join('');
  } else {
    const pt = P.map((p, i) => [x(i), y(p.v)]);
    if (n > 1) { const d = gfMono(pt); s += `<path class="area" fill="url(#${id}a)" d="${d} L${pt[n - 1][0].toFixed(1)},${y0} L${pt[0][0].toFixed(1)},${y0} Z"/><path class="line" pathLength="1" d="${d}"/>`; }
    s += `<line class="gg" id="${id}g" x1="0" x2="0" y1="${m.t - 6}" y2="${y0}"/>` + pt.map((q, i) => `<circle class="gd" data-i="${i}" cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="${n > 12 ? 3.5 : 5}"/>`).join('');
  }
  const skip = Math.ceil(n / Math.max(2, Math.floor(iw / 54)));
  s += P.map((p, i) => i % skip === 0 || i === n - 1 ? `<text class="gt" x="${x(i).toFixed(1)}" y="${H - 8}" text-anchor="middle">${esc(p.l)}</text>` : '').join('');
  s += `<rect class="hit" x="${m.l - 10}" y="0" width="${iw + 20}" height="${H}" fill="transparent"/></svg><div class="tip" hidden></div>`;
  el.innerHTML = s;
  const svg = el.querySelector('svg'), tip = el.querySelector('.tip'), g = el.querySelector('.gg'), items = el.querySelectorAll(bar ? '.bar-r' : '.gd');
  const aktif = i => {
    items.forEach((q, k) => q.classList.toggle('act', k === i)); const grp = el.querySelector('.bars'); if (grp) grp.classList.toggle('dim', i >= 0);
    if (i < 0) { tip.hidden = true; if (g) g.style.opacity = 0; return; }
    const p = P[i]; tip.hidden = false; tip.innerHTML = `${esc(p.t || p.l)}: <b>${gfPct(p.v)}</b>`; const sc = svg.getBoundingClientRect().width / W, tw = tip.offsetWidth / 2 + 4; tip.style.left = Math.min(Math.max(x(i) * sc, tw), W * sc - tw) + 'px'; tip.style.top = (y(p.v) * sc) + 'px';
    if (g) { g.setAttribute('x1', x(i)); g.setAttribute('x2', x(i)); g.style.opacity = 1; }
  };
  const dekat = e => { const r = svg.getBoundingClientRect(), px = (e.clientX - r.left) * (W / r.width); let b = 0, bd = 1e9; for (let i = 0; i < n; i++) { const d = Math.abs(x(i) - px); if (d < bd) { bd = d; b = i; } } return b; };
  svg.addEventListener('pointermove', e => aktif(dekat(e))); svg.addEventListener('pointerdown', e => aktif(dekat(e)));
  svg.addEventListener('pointerleave', () => aktif(n - 1));
  aktif(n - 1);
}
function gfPasang() { Object.keys(GF).forEach(id => { if (!document.getElementById(id)) delete GF[id]; else gfGambar(id); }); }
let gfT = 0, gfW = 0;
window.addEventListener('resize', () => { clearTimeout(gfT); gfT = setTimeout(() => { if (window.innerWidth !== gfW) { gfW = window.innerWidth; gfPasang(); } }, 180); });
gfW = window.innerWidth;

/** Donat: segs = [{l,v,c}]. Menyentuh/menyorot irisan atau legenda menampilkan angkanya di tengah. */
function gfDonat(id, segs, pusat) {
  const tot = segs.reduce((a, b) => a + b.v, 0) || 1; let cum = 0;
  const arcs = segs.map((q, i) => { const len = q.v / tot * 100, d = Math.max(0, len - (segs.length > 1 ? .9 : 0)), o = -cum; cum += len; return `<circle class="sg" data-i="${i}" cx="21" cy="21" r="15.9155" pathLength="100" stroke="${q.c}" style="--d:${d.toFixed(2)};--o:${o.toFixed(2)};animation-delay:${i * 90}ms" onpointerenter="gfDon('${id}',${i})" onpointerleave="gfDon('${id}',-1)" onclick="gfDon('${id}',${i})"/>`; }).join('');
  const lg = segs.map((q, i) => `<button type="button" data-i="${i}" onpointerenter="gfDon('${id}',${i})" onpointerleave="gfDon('${id}',-1)" onfocus="gfDon('${id}',${i})" onblur="gfDon('${id}',-1)"><i class="sw" style="background:${q.c}"></i><span>${esc(q.l)}</span><b>${q.v}</b><em>${Math.round(q.v / tot * 100)}%</em></button>`).join('');
  return `<div class="donat" id="${id}" data-tot="${tot}" data-pl="${esc(pusat[1])}" role="img" aria-label="${esc(pusat[1] + ': ' + segs.map(q => q.l + ' ' + q.v).join(', '))}"><div class="dsv"><svg viewBox="0 0 42 42" aria-hidden="true"><circle cx="21" cy="21" r="15.9155" fill="none" stroke="var(--bg)" stroke-width="5.2"/>${arcs}</svg><div class="ctr"><b>${esc(pusat[0])}</b><small>${esc(pusat[1])}</small></div></div><div class="lgd">${lg}</div></div>`;
}
function gfDon(id, i) {
  const el = document.getElementById(id); if (!el) return; const sv = el.querySelector('svg'), segs = el.querySelectorAll('circle.sg'), lg = el.querySelectorAll('.lgd button'), b = el.querySelector('.ctr b'), sm = el.querySelector('.ctr small');
  if (!el.dataset.b0) { el.dataset.b0 = b.textContent; el.dataset.s0 = sm.textContent; }
  sv.classList.toggle('dim', i >= 0); segs.forEach((q, k) => q.classList.toggle('act', k === i)); lg.forEach((q, k) => q.classList.toggle('act', k === i));
  if (i >= 0) { const q = lg[i]; b.textContent = q.querySelector('b').textContent; sm.textContent = q.querySelector('span').textContent; } else { b.textContent = el.dataset.b0; sm.textContent = el.dataset.s0; }
}
/** Cincin persentase kecil untuk kartu angka. */
function gfCincin(pct) { const v = Math.max(0, Math.min(100, Number(pct) || 0)); return `<svg class="ring" viewBox="0 0 48 48" role="img" aria-label="${gfPct(v)}"><circle class="rb" cx="24" cy="24" r="20" pathLength="100"/><circle class="rf" cx="24" cy="24" r="20" pathLength="100" transform="rotate(-90 24 24)" style="--d:${v}"/><text x="24" y="28" text-anchor="middle">${Math.round(v)}%</text></svg>`; }
/** Bilah bertumpuk + legenda untuk komposisi satu hari (mis. kehadiran apel terakhir). */
function gfTumpuk(items) {
  const tot = items.reduce((a, b) => a + b.v, 0);
  if (!tot) return '<p class="muted mb-0 py-3">Belum tersedia: belum ada data kehadiran.</p>';
  return `<div class="stk" role="img" aria-label="${esc(items.map(q => q.l + ' ' + q.v).join(', '))}">${items.filter(q => q.v).map((q, i) => `<i style="width:${q.v / tot * 100}%;background:${q.c};animation-delay:${i * 80}ms" title="${esc(q.l)}: ${q.v}"></i>`).join('')}</div><div class="stk-l">${items.map(q => `<div><i style="background:${q.c}"></i><span>${esc(q.l)}</span><b>${q.v}</b></div>`).join('')}</div>`;
}

(window.MOD = window.MOD || []).push('Grafik');
