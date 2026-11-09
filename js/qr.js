// ── Pembuat kode QR mandiri (tanpa pustaka luar, bekerja luring): mode byte, koreksi galat M, versi 1–10 ──
const QR = (function () {
  const EC = { // versi: [kata kode ECC per blok, blok grup 1, data/blok grup 1, blok grup 2, data/blok grup 2]
    1: [10, 1, 16, 0, 0], 2: [16, 1, 28, 0, 0], 3: [26, 1, 44, 0, 0], 4: [18, 2, 32, 0, 0], 5: [24, 2, 43, 0, 0], 6: [16, 4, 27, 0, 0], 7: [18, 4, 31, 0, 0], 8: [22, 2, 38, 2, 39], 9: [22, 3, 36, 2, 37], 10: [26, 4, 43, 1, 44]
  };
  const ALIGN = { 1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50] };
  const EXP = new Array(512), LOG = new Array(256);
  (function () { let x = 1; for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; } for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]; })();
  const mul = (a, b) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);
  function generator(n) { let g = [1]; for (let i = 0; i < n; i++) { const h = new Array(g.length + 1).fill(0); for (let j = 0; j < g.length; j++) { h[j] ^= g[j]; h[j + 1] ^= mul(g[j], EXP[i]); } g = h; } return g; }
  function eccOf(data, n) { const g = generator(n), r = new Array(n).fill(0); data.forEach(d => { const f = d ^ r.shift(); r.push(0); if (f) for (let i = 0; i < n; i++) r[i] ^= mul(g[i + 1], f); }); return r; }
  const kapasitas = v => { const e = EC[v]; return e[1] * e[2] + e[3] * e[4]; };
  function utf8(s) { return Array.from(unescape(encodeURIComponent(s)), c => c.charCodeAt(0)); }
  function bitsData(bytes, v) {
    const bits = [], put = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); }, cap = kapasitas(v) * 8;
    put(4, 4); put(bytes.length, v < 10 ? 8 : 16); bytes.forEach(b => put(b, 8));
    put(0, Math.min(4, cap - bits.length)); while (bits.length % 8) bits.push(0);
    for (let p = 0xEC; bits.length < cap; p ^= 0xEC ^ 0x11) put(p, 8);
    const out = []; for (let i = 0; i < bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8).join(''), 2)); return out;
  }
  function susun(data, v) { // pecah ke blok, hitung ECC, sisipkan
    const e = EC[v], blok = []; let k = 0;
    for (let g = 0; g < 2; g++) for (let b = 0; b < e[1 + g * 2]; b++) { const n = e[2 + g * 2]; blok.push(data.slice(k, k + n)); k += n; }
    const ecc = blok.map(b => eccOf(b, e[0])), maks = Math.max(...blok.map(b => b.length)), out = [];
    for (let i = 0; i < maks; i++) blok.forEach(b => { if (i < b.length) out.push(b[i]); });
    for (let i = 0; i < e[0]; i++) ecc.forEach(b => out.push(b[i]));
    return out;
  }
  function bch(val, gen, bitsGen) { let r = val; const top = x => 31 - Math.clz32(x); while (top(r) >= top(gen)) r ^= gen << (top(r) - top(gen)); return r; }
  const MASK = [(r, c) => (r + c) % 2 === 0, (r) => r % 2 === 0, (r, c) => c % 3 === 0, (r, c) => (r + c) % 3 === 0, (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0, (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0, (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0, (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0];
  function matriks(kata, v, mask) {
    const n = 17 + 4 * v, M = Array.from({ length: n }, () => new Array(n).fill(false)), F = Array.from({ length: n }, () => new Array(n).fill(false));
    const set = (r, c, val) => { if (r >= 0 && r < n && c >= 0 && c < n) { M[r][c] = val; F[r][c] = true; } };
    const finder = (r, c) => { for (let i = -1; i <= 7; i++) for (let j = -1; j <= 7; j++) { const d = Math.max(Math.abs(i - 3), Math.abs(j - 3)); set(r + i, c + j, d !== 2 && d !== 4 && !(i < 0 || j < 0 || i > 6 || j > 6) ? true : false); } };
    finder(0, 0); finder(0, n - 7); finder(n - 7, 0);
    for (let i = 8; i < n - 8; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    const A = ALIGN[v]; A.forEach((r, i) => A.forEach((c, j) => { if ((i === 0 && j === 0) || (i === 0 && j === A.length - 1) || (i === A.length - 1 && j === 0)) return; for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) set(r + a, c + b, Math.max(Math.abs(a), Math.abs(b)) !== 1); }));
    // area format dan versi dipesan dulu
    const cadang = (r, c) => { if (!F[r][c]) set(r, c, false); }; for (let i = 0; i < 9; i++) { cadang(8, i); cadang(i, 8); } for (let i = 0; i < 8; i++) { cadang(8, n - 1 - i); cadang(n - 1 - i, 8); } set(n - 8, 8, true);
    if (v >= 7) { const vi = (v << 12) | bch(v << 12, 0x1F25); for (let i = 0; i < 18; i++) { const b = ((vi >> i) & 1) === 1, a = n - 11 + (i % 3), c = Math.floor(i / 3); set(a, c, b); set(c, a, b); } }
    // data zig-zag
    const bit = []; kata.forEach(b => { for (let i = 7; i >= 0; i--) bit.push((b >> i) & 1); });
    let k = 0, naik = true; for (let c = n - 1; c > 0; c -= 2) { if (c === 6) c--; for (let t = 0; t < n; t++) { const r = naik ? n - 1 - t : t; for (let d = 0; d < 2; d++) { const cc = c - d; if (!F[r][cc]) { M[r][cc] = k < bit.length ? bit[k] === 1 : false; k++; } } } naik = !naik; }
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!F[r][c] && MASK[mask](r, c)) M[r][c] = !M[r][c];
    // informasi format (ECC M = 00)
    const fd = ((0 << 3) | mask), fb = ((fd << 10) | bch(fd << 10, 0x537)) ^ 0x5412, g = i => ((fb >> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) M[i][8] = g(i); M[7][8] = g(6); M[8][8] = g(7); M[8][7] = g(8); for (let i = 9; i < 15; i++) M[8][14 - i] = g(i);
    for (let i = 0; i < 8; i++) M[8][n - 1 - i] = g(i); for (let i = 8; i < 15; i++) M[n - 15 + i][8] = g(i); M[n - 8][8] = true;
    return M;
  }
  function penalti(M) {
    const n = M.length; let p = 0;
    for (let pass = 0; pass < 2; pass++) { for (let a = 0; a < n; a++) { let run = 1; for (let b = 1; b < n; b++) { const x = pass ? M[b][a] : M[a][b], y = pass ? M[b - 1][a] : M[a][b - 1]; if (x === y) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1; } } }
    for (let r = 0; r < n - 1; r++) for (let c = 0; c < n - 1; c++) if (M[r][c] === M[r][c + 1] && M[r][c] === M[r + 1][c] && M[r][c] === M[r + 1][c + 1]) p += 3;
    const pola = [true, false, true, true, true, false, true, false, false, false, false], cek = (get) => { for (let a = 0; a < n; a++) for (let b = 0; b <= n - 11; b++) { let k1 = true, k2 = true; for (let i = 0; i < 11; i++) { const x = get(a, b + i); if (x !== pola[i]) k1 = false; if (x !== pola[10 - i]) k2 = false; } if (k1) p += 40; if (k2) p += 40; } };
    cek((a, b) => M[a][b]); cek((a, b) => M[b][a]);
    let gelap = 0; M.forEach(r => r.forEach(x => { if (x) gelap++; })); p += Math.floor(Math.abs(gelap * 20 - n * n * 10) / (n * n)) * 10; return p;
  }
  /** Matriks QR (array 2D boolean) untuk teks. */
  function buat(teks) {
    const bytes = utf8(String(teks)); let v = 1; while (v <= 10 && kapasitas(v) < bytes.length + 2 + (v < 10 ? 0 : 1)) v++;
    if (v > 10) throw new Error('Teks QR terlalu panjang.');
    const kata = susun(bitsData(bytes, v), v); let best = null, bp = 1e9;
    for (let m = 0; m < 8; m++) { const M = matriks(kata, v, m), p = penalti(M); if (p < bp) { bp = p; best = M; } }
    return best;
  }
  /** SVG QR hitam putih; zona tenang 4 modul. */
  function svg(teks, px) {
    const M = buat(teks), n = M.length, q = 4, d = []; M.forEach((r, y) => { let x = 0; while (x < n) { if (r[x]) { let w = 1; while (x + w < n && r[x + w]) w++; d.push('M' + (x + q) + ' ' + (y + q) + 'h' + w + 'v1h-' + w + 'z'); x += w; } else x++; } });
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n + 2 * q} ${n + 2 * q}" width="${px}" height="${px}" shape-rendering="crispEdges" role="img" aria-label="Kode QR verifikasi"><rect width="100%" height="100%" fill="#fff"/><path d="${d.join('')}" fill="#000"/></svg>`;
  }
  return { buat, svg };
})();
(window.MOD = window.MOD || []).push('Qr');
