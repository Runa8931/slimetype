// ============================================================
//  成長記録
//  練習 1 回ごとの 打鍵/分・正確率を グラフに して、速さの のびが 見えるように する
//  下の キーボードは キーごとの ミスの わりあい (赤いほど 苦手)
//  記録は Save.data.history (practice.js が 足す) と missKeys / hitKeys
// ============================================================

const GROWTH_ROWS = ['1234567890-', 'qwertyuiop', 'asdfghjkl;', 'zxcvbnm,./'];

Screens.growth = {
  enter() {
    this.lang = Save.data.settings.lang;
    $('#btn-growth-back').onclick = () => App.show('home');
    this.render();
  },

  list() { return (Save.data.history || []).filter(h => h.lang === this.lang); },

  render() {
    const all = this.list();
    const avg = (a, f) => a.length ? a.reduce((s, h) => s + f(h), 0) / a.length : 0;
    const first = all.slice(0, 10), last = all.slice(-10);
    const best = all.reduce((m, h) => Math.max(m, h.kpm), 0);
    const up = all.length >= 11 ? Math.round(avg(last, h => h.kpm) - avg(first, h => h.kpm)) : null;
    const langName = this.lang === 'en' ? 'English' : '日本語';
    $('#growth-desc').innerHTML = `練習の記録（${langName}）　・　<kbd>L</kbd> で言語を切りかえ　・　記録は練習を最後までやるたびに増える`;
    const stat = (label, val, sub) => `<div class="gr-stat"><span>${label}</span><b>${val}</b>${sub ? `<small>${sub}</small>` : ''}</div>`;
    $('#growth-stats').innerHTML = [
      stat('練習した回数', all.length + '回'),
      stat('最高の打鍵/分', best || '—'),
      stat('最近10回の平均', all.length ? Math.round(avg(last, h => h.kpm)) : '—', all.length ? `正確率 ${(avg(last, h => h.acc) * 100).toFixed(1)}%` : ''),
      stat('最初の10回から', up === null ? '—' : `${up >= 0 ? '+' : ''}${up}`, up === null ? '11回以上で表示' : '打鍵/分の伸び'),
    ].join('');
    $('#growth-chart').innerHTML = this.chart(all.slice(-60));
    $('#growth-kb').innerHTML = this.keyboard();
  },

  // 打鍵/分 (青い 線) と 正確率 (金色の 線) の グラフ
  chart(list) {
    if (list.length < 2) return '<div class="gr-empty">練習を2回以上最後までやると、ここにグラフが出ます</div>';
    const W = 720, H = 220, L = 44, R = 44, T = 14, B = 26;
    const maxK = Math.max(100, Math.ceil(Math.max(...list.map(h => h.kpm)) / 50) * 50);
    const x = i => L + (W - L - R) * (list.length === 1 ? 0.5 : i / (list.length - 1));
    const yK = v => T + (H - T - B) * (1 - v / maxK);
    const accMin = 0.8, yA = v => T + (H - T - B) * (1 - (Math.max(accMin, v) - accMin) / (1 - accMin));
    const grid = [0, 0.25, 0.5, 0.75, 1].map(f => {
      const y = T + (H - T - B) * (1 - f);
      return `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" class="gr-grid"/>
        <text x="${L - 6}" y="${y + 4}" text-anchor="end" class="gr-axis">${Math.round(maxK * f)}</text>
        <text x="${W - R + 6}" y="${y + 4}" class="gr-axis acc">${Math.round((accMin + (1 - accMin) * f) * 100)}%</text>`;
    }).join('');
    const path = (f, y) => list.map((h, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(f(h)).toFixed(1)}`).join(' ');
    const dots = list.map((h, i) => `<circle cx="${x(i).toFixed(1)}" cy="${yK(h.kpm).toFixed(1)}" r="3.5" class="gr-dot"><title>${new Date(h.t).toLocaleDateString('ja-JP')}　${h.kpm}打鍵/分・正確率${(h.acc * 100).toFixed(1)}%・${(DIFFS[h.diff] || {}).name || ''}</title></circle>`).join('');
    const d0 = new Date(list[0].t).toLocaleDateString('ja-JP'), d1 = new Date(list[list.length - 1].t).toLocaleDateString('ja-JP');
    return `<svg viewBox="0 0 ${W} ${H}" class="gr-svg" role="img" aria-label="打鍵/分と正確率の推移">
      ${grid}
      <path d="${path(h => h.acc, yA)}" class="gr-line acc"/>
      <path d="${path(h => h.kpm, yK)}" class="gr-line kpm"/>
      ${dots}
      <text x="${L}" y="${H - 6}" class="gr-axis">${d0}</text>
      <text x="${W - R}" y="${H - 6}" text-anchor="end" class="gr-axis">${d1}</text>
    </svg>
    <div class="gr-legend"><span class="kpm">● 打鍵/分（左の目もり）</span><span class="acc">● 正確率（右の目もり）</span><small>最近の${list.length}回</small></div>`;
  },

  // キーごとの ミスの わりあい
  keyboard() {
    const miss = Save.data.keyMiss || {}, hit = Save.data.hitKeys || {};
    const rate = k => { const m = miss[k] || 0, h = hit[k] || 0; return m + h >= 5 ? m / (m + h) : null; };
    const rates = GROWTH_ROWS.join('').split('').map(rate).filter(r => r !== null);
    const top = Math.max(0.05, ...rates);
    const rows = GROWTH_ROWS.map((row, ri) => `<div class="gr-krow" style="margin-left:${ri * 18}px">${row.split('').map(k => {
      const r = rate(k);
      const f = r === null ? 0 : Math.min(1, r / top);
      const tip = r === null ? 'まだ記録が少ない' : `ミス ${(r * 100).toFixed(1)}%（${miss[k] || 0}回）`;
      return `<div class="gr-key ${r === null ? 'none' : ''}" style="--f:${f.toFixed(2)}" title="${tip}"><b>${k === ';' ? ';' : k.toUpperCase()}</b><small>${r === null ? '' : (r * 100).toFixed(1) + '%'}</small></div>`;
    }).join('')}</div>`).join('');
    const worst = GROWTH_ROWS.join('').split('').map(k => [k, rate(k)]).filter(([, r]) => r !== null).sort((a, b) => b[1] - a[1]).slice(0, 3);
    return `${rows}<div class="gr-legend">${worst.length ? `苦手なキー: ${worst.map(([k, r]) => `<kbd>${k.toUpperCase()}</kbd> ${(r * 100).toFixed(1)}%`).join('　')}` : '練習やバトルで打つと、キーごとのミスの割合が出ます'}<small>赤いほどミスが多い</small></div>`;
  },

  onKey(e) {
    if (e.key === 'Escape') App.show('home');
    if (e.key.toLowerCase() === 'l') { this.lang = this.lang === 'en' ? 'ja' : 'en'; SFX.select(); this.render(); }
  },
};
