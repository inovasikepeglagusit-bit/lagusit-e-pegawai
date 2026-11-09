// ── Editor Dokumen (seperti Word): kotak penyunting kaya tanpa pustaka luar, bekerja luring ──
// RTE.mount(elemen, { html, token:['nomor',...], tinggi, onUbah }) → { get(), set(html), fokus(), sisip(teks) }
// RTE.bersih(html) → HTML aman (daftar putih tag, atribut, dan gaya). Semua isi yang disimpan/dicetak melewati RTE.bersih.
const RTE = (function () {
  const TAG = new Set('p div span b strong i em u s strike sub sup br ul ol li table thead tbody tfoot tr td th hr h1 h2 h3 h4 blockquote'.split(' '));
  const BUANG = new Set('script style iframe object embed link meta base form input button textarea select svg math img video audio canvas template noscript frame frameset applet'.split(' '));
  const GAYA = new Set(['text-align', 'font-size', 'font-family', 'font-weight', 'font-style', 'text-decoration', 'text-decoration-line', 'color', 'line-height', 'margin-left', 'margin-top', 'margin-bottom', 'text-indent', 'padding-left', 'border', 'border-collapse', 'border-top', 'border-bottom', 'border-left', 'border-right', 'width', 'vertical-align', 'page-break-before', 'page-break-inside', 'break-inside', 'background-color']);
  const FONT = { 'Times New Roman': "'Times New Roman',Times,serif", 'Arial': 'Arial,Helvetica,sans-serif', 'Calibri': "Calibri,'Segoe UI',Arial,sans-serif", 'Cambria': 'Cambria,Georgia,serif', 'Courier New': "'Courier New',monospace", 'Bookman Old Style': "'Bookman Old Style',Georgia,serif" };
  const UKURAN = [9, 10, 11, 12, 13, 14, 16, 18, 20, 24];
  const WARNA = [['Hitam', '#000000'], ['Merah', '#c00000'], ['Biru', '#1f3a93'], ['Hijau', '#1e7b34'], ['Abu-abu', '#666666']];
  function gayaBersih(s) {
    return String(s || '').split(';').map(x => { const i = x.indexOf(':'); if (i < 0) return ''; const k = x.slice(0, i).trim().toLowerCase(), v = x.slice(i + 1).trim(); if (!GAYA.has(k) || !v || /url\s*\(|expression|javascript|@import|[<>{}\\]/i.test(v) || v.length > 120) return ''; return k + ':' + v; }).filter(Boolean).join(';');
  }
  function bersihNode(n, out) {
    Array.from(n.childNodes).forEach(c => {
      if (c.nodeType === 3) { out.appendChild(document.createTextNode(c.nodeValue)); return; }
      if (c.nodeType !== 1) return; const t = c.tagName.toLowerCase();
      if (BUANG.has(t)) return;
      if (!TAG.has(t)) { bersihNode(c, out); return; } // tag tak dikenal: isinya dipertahankan
      const e = document.createElement(t === 'strike' ? 's' : t), st = gayaBersih(c.getAttribute('style')); if (st) e.setAttribute('style', st);
      if (t === 'td' || t === 'th') ['colspan', 'rowspan'].forEach(a => { const v = parseInt(c.getAttribute(a), 10); if (v > 1 && v <= 20) e.setAttribute(a, v); });
      bersihNode(c, e); out.appendChild(e);
    });
  }
  function bersih(html) {
    const d = new DOMParser().parseFromString('<!doctype html><body>' + String(html || ''), 'text/html'), o = document.createElement('div'); bersihNode(d.body, o); return o.innerHTML;
  }
  function css() {
    if (document.getElementById('rteCss')) return; const s = document.createElement('style'); s.id = 'rteCss';
    s.textContent = `.rte{border:1px solid var(--bs-border-color,#ccc);border-radius:8px;background:var(--bs-body-bg,#fff)}.rte-bar{display:flex;flex-wrap:wrap;gap:4px;align-items:center;padding:6px;border-bottom:1px solid var(--bs-border-color,#ccc);position:sticky;top:0;z-index:5;background:var(--bs-tertiary-bg,#f3f4f6);border-radius:8px 8px 0 0}.rte-bar .g{display:flex;gap:2px;align-items:center;padding-right:6px;margin-right:2px;border-right:1px solid var(--bs-border-color,#ccc)}.rte-bar .g:last-child{border:0}.rte-bar button{border:1px solid transparent;background:transparent;border-radius:5px;min-width:30px;height:30px;padding:0 6px;color:inherit;cursor:pointer}.rte-bar button:hover{background:rgba(0,0,0,.08)}.rte-bar button:focus-visible{outline:2px solid #2563eb}.rte-bar select{height:30px;font-size:13px;max-width:140px}.rte-meja{background:#d9dce1;padding:14px;overflow:auto;border-radius:0 0 8px 8px}.rte-kertas{background:#fff;color:#000;margin:0 auto;box-shadow:0 1px 6px rgba(0,0,0,.3);box-sizing:border-box;max-width:100%;padding:18mm 20mm;font-family:'Times New Roman',serif;font-size:12pt;line-height:1.5;outline:none;overflow-wrap:anywhere}.rte-kertas p{margin:0 0 8px}.rte-kertas table{border-collapse:collapse;width:100%}.rte-kertas td,.rte-kertas th{border:1px solid #000;padding:3px 5px;vertical-align:top;min-width:24px}.rte-kertas [style*="page-break-before"]{border-top:2px dashed #999;margin:14px 0;height:0;position:relative}.rte-kertas [style*="page-break-before"]:after{content:"pemisah halaman";position:absolute;top:-9px;right:0;background:#fff;color:#888;font:10px Arial;padding:0 4px}.rte-chips{display:flex;flex-wrap:wrap;gap:4px;padding:6px;border-top:1px solid var(--bs-border-color,#ccc);font-size:12px;align-items:center}.rte-chips button{border:1px solid #b6c2d9;background:#eef2fa;color:#1f3a93;border-radius:12px;padding:1px 8px;font-size:12px}`;
    document.head.appendChild(s);
  }
  function mount(host, o) {
    css(); o = o || {}; if (typeof host === 'string') host = document.getElementById(host);
    host.innerHTML = '<div class="rte"><div class="rte-bar" role="toolbar" aria-label="Alat penyunting dokumen"></div><div class="rte-meja"><div class="rte-kertas" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Isi dokumen" spellcheck="true"></div></div></div>';
    const bar = host.querySelector('.rte-bar'), ed = host.querySelector('.rte-kertas'), meja = host.querySelector('.rte-meja'); let sel = null;
    if (o.tinggi) meja.style.maxHeight = o.tinggi; ed.style.minHeight = o.minTinggi || '260px'; if (o.lebar) ed.style.width = o.lebar;
    ed.innerHTML = bersih(o.html || '') || '<p><br></p>';
    const simpanSel = () => { const s = getSelection(); if (s.rangeCount && ed.contains(s.anchorNode)) sel = s.getRangeAt(0).cloneRange(); };
    const pulih = () => { ed.focus(); if (sel) { const s = getSelection(); s.removeAllRanges(); s.addRange(sel); } };
    const ubah = () => { if (o.onUbah) o.onUbah(); };
    ['keyup', 'mouseup', 'blur', 'input'].forEach(ev => ed.addEventListener(ev, simpanSel)); ed.addEventListener('input', ubah);
    ed.addEventListener('paste', e => { e.preventDefault(); const h = e.clipboardData.getData('text/html'), t = e.clipboardData.getData('text/plain'); if (h) document.execCommand('insertHTML', false, bersih(h)); else document.execCommand('insertText', false, t); ubah(); });
    ed.addEventListener('drop', e => e.preventDefault());
    const cmd = (c, v) => { pulih(); document.execCommand('styleWithCSS', false, true); document.execCommand(c, false, v == null ? null : v); simpanSel(); ubah(); };
    const blok = () => { const s = getSelection(); if (!s.rangeCount) return []; const r = s.getRangeAt(0), L = new Set(); ed.querySelectorAll('p,div,li,td,th,h1,h2,h3,h4,blockquote').forEach(b => { try { if (r.intersectsNode(b) && !b.querySelector('p,div,li,td,th,table')) L.add(b); } catch (x) {} });
      if (!L.size) { let n = s.anchorNode; while (n && n !== ed && !(n.nodeType === 1 && /^(P|DIV|LI|TD|TH|H1|H2|H3|H4|BLOCKQUOTE)$/.test(n.tagName))) n = n.parentNode; if (n && n !== ed) L.add(n); } return Array.from(L); };
    const gayaBlok = (fn) => { pulih(); let b = blok(); if (!b.length) { document.execCommand('formatBlock', false, 'p'); b = blok(); } b.forEach(fn); ubah(); };
    const ukuran = (pt) => { pulih(); document.execCommand('styleWithCSS', false, true); document.execCommand('fontSize', false, '7'); ed.querySelectorAll('[style*="xxx-large"],font[size="7"]').forEach(e => { if (e.tagName === 'FONT') { const sp = document.createElement('span'); sp.innerHTML = e.innerHTML; e.replaceWith(sp); sp.style.fontSize = pt + 'pt'; } else e.style.fontSize = pt + 'pt'; }); simpanSel(); ubah(); };
    const sel_ = () => { const s = getSelection(); return s.rangeCount ? s.anchorNode : null; };
    const sel1 = (tag) => { let n = sel_(); while (n && n !== ed) { if (n.nodeType === 1 && n.tagName === tag) return n; n = n.parentNode; } return null; };
    const tabel = (r, c) => { let h = '<table style="border-collapse:collapse;width:100%"><tbody>'; for (let i = 0; i < r; i++) { h += '<tr>'; for (let j = 0; j < c; j++) h += '<td style="border:1px solid #000"><br></td>'; h += '</tr>'; } return h + '</tbody></table><p><br></p>'; };
    const tbl = (aksi) => { pulih(); const td = sel1('TD') || sel1('TH'), tb = sel1('TABLE'); if (!td || !tb) { toast('Letakkan kursor di dalam sel tabel.', 'warning'); return; } const tr = td.parentNode, idx = Array.prototype.indexOf.call(tr.children, td);
      if (aksi === 'baris+') { const n = tr.cloneNode(true); n.querySelectorAll('td,th').forEach(x => { x.innerHTML = '<br>'; }); tr.after(n); }
      if (aksi === 'baris-') { if (tb.rows.length <= 1) tb.remove(); else tr.remove(); }
      if (aksi === 'kolom+') Array.from(tb.rows).forEach(r => { const c = r.cells[idx]; if (c) { const n = c.cloneNode(false); n.innerHTML = '<br>'; c.after(n); } });
      if (aksi === 'kolom-') { if (tr.cells.length <= 1) tb.remove(); else Array.from(tb.rows).forEach(r => { if (r.cells[idx]) r.cells[idx].remove(); }); }
      if (aksi === 'hapus') tb.remove();
      if (aksi === 'garis') { const tanpa = /none|0px/.test(td.style.border || ''); tb.querySelectorAll('td,th').forEach(x => { x.style.border = tanpa ? '1px solid #000' : 'none'; }); }
      ubah(); };
    const B = (isi, judul, fn) => { const b = document.createElement('button'); b.type = 'button'; b.innerHTML = isi; b.title = judul; b.setAttribute('aria-label', judul); b.addEventListener('mousedown', e => e.preventDefault()); b.addEventListener('click', fn); return b; };
    const G = (...x) => { const g = document.createElement('div'); g.className = 'g'; x.forEach(e => g.appendChild(e)); bar.appendChild(g); return g; };
    const S = (judul, opsi, fn) => { const s = document.createElement('select'); s.className = 'form-select form-select-sm'; s.title = judul; s.setAttribute('aria-label', judul); s.style.width = 'auto'; s.innerHTML = '<option value="">' + judul + '</option>' + opsi.map(x => `<option value="${x[0]}">${x[1]}</option>`).join(''); s.addEventListener('change', () => { if (s.value) fn(s.value); s.value = ''; }); return s; };
    G(B('<i class="bi bi-arrow-counterclockwise"></i>', 'Urungkan (Ctrl+Z)', () => cmd('undo')), B('<i class="bi bi-arrow-clockwise"></i>', 'Ulangi (Ctrl+Y)', () => cmd('redo')));
    G(S('Font', Object.keys(FONT).map(f => [f, f]), v => cmd('fontName', FONT[v])), S('Ukuran', UKURAN.map(u => [u, u + ' pt']), v => ukuran(v)));
    G(B('<b>B</b>', 'Tebal (Ctrl+B)', () => cmd('bold')), B('<i>I</i>', 'Miring (Ctrl+I)', () => cmd('italic')), B('<u>U</u>', 'Garis bawah (Ctrl+U)', () => cmd('underline')), B('<s>S</s>', 'Coret', () => cmd('strikeThrough')), S('Warna', WARNA.map(w => [w[1], w[0]]), v => cmd('foreColor', v)));
    G(B('<i class="bi bi-text-left"></i>', 'Rata kiri', () => cmd('justifyLeft')), B('<i class="bi bi-text-center"></i>', 'Rata tengah', () => cmd('justifyCenter')), B('<i class="bi bi-text-right"></i>', 'Rata kanan', () => cmd('justifyRight')), B('<i class="bi bi-justify"></i>', 'Rata kiri-kanan', () => cmd('justifyFull')));
    G(B('<i class="bi bi-list-ul"></i>', 'Daftar poin', () => cmd('insertUnorderedList')), B('<i class="bi bi-list-ol"></i>', 'Daftar bernomor', () => cmd('insertOrderedList')), B('<i class="bi bi-text-indent-left"></i>', 'Geser masuk', () => gayaBlok(b => { b.style.marginLeft = Math.min(((parseInt(b.style.marginLeft, 10) || 0) + 36), 360) + 'px'; })), B('<i class="bi bi-text-indent-right"></i>', 'Geser keluar', () => gayaBlok(b => { b.style.marginLeft = Math.max(((parseInt(b.style.marginLeft, 10) || 0) - 36), 0) + 'px'; })), B('<i class="bi bi-arrow-bar-right"></i>', 'Menjorok baris pertama', () => gayaBlok(b => { b.style.textIndent = b.style.textIndent ? '' : '28px'; })));
    G(S('Spasi', [['1', '1,0'], ['1.15', '1,15'], ['1.5', '1,5'], ['2', '2,0']], v => gayaBlok(b => { b.style.lineHeight = v; })), S('Gaya', [['judul', 'Judul tengah tebal'], ['normal', 'Paragraf biasa'], ['kanan', 'Tempat & tanggal (kanan)']], v => gayaBlok(b => { if (v === 'judul') { b.style.textAlign = 'center'; b.style.fontWeight = 'bold'; } else if (v === 'normal') { b.style.textAlign = ''; b.style.fontWeight = ''; b.style.textIndent = ''; b.style.marginLeft = ''; } else { b.style.textAlign = 'right'; } })));
    const mt = document.createElement('div'); mt.className = 'g'; bar.appendChild(mt);
    const tbtn = B('<i class="bi bi-table"></i> Tabel', 'Sisipkan tabel', () => { const r = Number(prompt_('Jumlah baris', 3)), c = Number(prompt_('Jumlah kolom', 3)); if (!(r >= 1 && r <= 30 && c >= 1 && c <= 10)) return; pulih(); document.execCommand('insertHTML', false, tabel(r, c)); ubah(); });
    function prompt_(l, v) { const x = window.prompt(l + ' (1–' + (l === 'Jumlah kolom' ? 10 : 30) + ')', v); return x == null ? 0 : x; }
    G(tbtn, B('+Baris', 'Tambah baris di bawah', () => tbl('baris+')), B('−Baris', 'Hapus baris', () => tbl('baris-')), B('+Kol', 'Tambah kolom di kanan', () => tbl('kolom+')), B('−Kol', 'Hapus kolom', () => tbl('kolom-')), B('<i class="bi bi-border-outer"></i>', 'Garis tabel ada/tidak', () => tbl('garis')), B('<i class="bi bi-trash"></i>', 'Hapus tabel', () => tbl('hapus')));
    G(B('<i class="bi bi-dash-lg"></i>', 'Garis pemisah', () => cmd('insertHorizontalRule')), B('<i class="bi bi-file-break"></i>', 'Pemisah halaman', () => { pulih(); document.execCommand('insertHTML', false, '<div style="page-break-before:always"></div><p><br></p>'); ubah(); }), B('<i class="bi bi-eraser"></i>', 'Hapus format', () => cmd('removeFormat')));
    mt.remove();
    if (o.token && o.token.length) { const ch = document.createElement('div'); ch.className = 'rte-chips'; ch.innerHTML = '<span class="muted small">Sisipkan penanda:</span>'; o.token.forEach(k => { const b = document.createElement('button'); b.type = 'button'; b.textContent = '{' + k + '}'; b.addEventListener('mousedown', e => e.preventDefault()); b.addEventListener('click', () => { pulih(); document.execCommand('insertText', false, '{' + k + '}'); simpanSel(); ubah(); }); ch.appendChild(b); }); host.querySelector('.rte').appendChild(ch); }
    return {
      get: () => bersih(ed.innerHTML).replace(/^(<p><br><\/p>)+$/, ''), set: h => { ed.innerHTML = bersih(h) || '<p><br></p>'; }, fokus: () => ed.focus(), el: ed,
      sisip: t => { pulih(); document.execCommand('insertText', false, t); simpanSel(); ubah(); }
    };
  }
  return { mount, bersih };
})();
(window.MOD = window.MOD || []).push('Editor');
