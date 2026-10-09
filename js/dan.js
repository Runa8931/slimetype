// ============================================================
//  段位認定 (タイピングの 検定)
//  10級 → 1級 → 初段 → 十段。30 秒 打って「打鍵/分」と「正確率」の 両方が 条件を こえたら 合格
//  キャラの レベルは 関係 ない (自分の うでまえ そのものが 上がっていく)。1 つずつ 順に 受ける
//  試験は practice.js の 練習画面を つかう (App.show('practice', { exam: 段の 番号 }))
//  記録: Save.data.dan = { rank: 合格した いちばん 上の 番号 (-1 = まだ), best: { 番号: { kpm, acc } }, tries }
// ============================================================

const DAN_SECS = 30; // 2026-10-07 に 60 秒 → 30 秒 (ユーザーの 希望)
// pools: お題の 山 (words.js / words3.js の 難易度)
const DAN_RANKS = [
  ['10級', 60, 0.85, ['easy']], ['9級', 80, 0.86, ['easy', 'normal']], ['8級', 100, 0.87, ['normal']],
  ['7級', 120, 0.88, ['normal']], ['6級', 140, 0.89, ['normal']], ['5級', 160, 0.90, ['normal', 'hard']],
  ['4級', 180, 0.91, ['normal', 'hard']], ['3級', 200, 0.92, ['hard']], ['2級', 220, 0.93, ['hard']],
  ['1級', 240, 0.94, ['hard', 'long']],
  // 段は 2026-10-09 に「十段 460 は きびしすぎる」と 言われ、十段を 400 に して なだらかに した
  ['初段', 250, 0.95, ['hard', 'long']], ['二段', 265, 0.95, ['hard', 'long']], ['三段', 280, 0.96, ['long']],
  ['四段', 295, 0.96, ['long']], ['五段', 310, 0.97, ['long', 'symbol']], ['六段', 325, 0.97, ['long', 'symbol']],
  ['七段', 340, 0.975, ['long', 'symbol']], ['八段', 355, 0.98, ['long', 'symbol']], ['九段', 375, 0.98, ['long', 'symbol']],
  ['十段', 400, 0.985, ['long', 'symbol']],
].map(([name, kpm, acc, pools], i) => ({ i, name, kpm, acc, pools, coins: 100 + i * 50 }));

function danData() {
  const d = Save.data.dan = Save.data.dan || { rank: -1, best: {}, tries: 0 };
  d.best = d.best || {};
  return d;
}
function danRank() { return danData().rank; }
function danName(i = danRank()) { return i >= 0 ? DAN_RANKS[i].name : 'なし'; }

// 試験が おわった (practice.js の finish から よぶ)。合格なら 段位を 上げて ごほうび
function danResult(i, kpm, acc) {
  const d = danData(), r = DAN_RANKS[i];
  d.tries = (d.tries || 0) + 1;
  const pass = kpm >= r.kpm && acc >= r.acc;
  const b = d.best[i];
  if (!b || kpm * acc > b.kpm * b.acc) d.best[i] = { kpm, acc: Math.round(acc * 1000) / 1000 };
  let coins = 0;
  if (pass && i > d.rank) { d.rank = i; coins = grantCoins(r.coins); }
  Save.save();
  return { i, kpm, acc, pass, coins };
}

Screens.dan = {
  enter(arg) {
    $('#btn-dan-back').onclick = () => App.show(this.from || 'challenge');
    this.result = arg && arg.result || null;
    this.render();
    if (this.result) {
      const r = this.result;
      if (r.pass) { SFX.win(); checkAchievements(null).forEach((a, k) => setTimeout(() => toast(`🏅 称号「${a.name}」を手に入れた！（🪙+${ACH_COINS}）`, 2600), 1200 + k * 2800)); }
      else SFX.miss();
    }
  },

  render() {
    dojoDeco($('#scr-dan'), '段位認定', '一打入魂');
    const d = danData(), next = Math.min(d.rank + 1, DAN_RANKS.length - 1), done = d.rank >= DAN_RANKS.length - 1;
    const r = this.result;
    const head = r ? `<div class="dan-result ${r.pass ? 'pass' : 'fail'}">
        <div class="dan-res-title">${r.pass ? `🎉 ${DAN_RANKS[r.i].name} 合格！` : `${DAN_RANKS[r.i].name} 不合格…`}</div>
        <div>打鍵/分 <b class="${r.kpm >= DAN_RANKS[r.i].kpm ? 'ok' : 'ng'}">${r.kpm}</b> / ${DAN_RANKS[r.i].kpm}　正確率 <b class="${r.acc >= DAN_RANKS[r.i].acc ? 'ok' : 'ng'}">${(r.acc * 100).toFixed(1)}%</b> / ${(DAN_RANKS[r.i].acc * 100).toFixed(1)}%${r.coins ? `　🪙 +${r.coins}` : ''}</div></div>` : '';
    $('#dan-desc').innerHTML = `今の段位 <b class="dan-now">${danName()}</b>　・　${DAN_SECS}秒打って、打鍵/分と正確率の両方が条件をこえたら合格。キャラのレベルは関係なし${head}`;
    $('#dan-list').innerHTML = DAN_RANKS.map(x => {
      const st = x.i <= d.rank ? 'passed' : x.i === next && !done ? 'next' : 'locked';
      const b = d.best[x.i];
      const pools = [...new Set(x.pools.map(p => ({ easy: '短い単語', normal: '言葉', hard: '文', long: '長文', symbol: '記号・数字' }[p])))].join('・');
      return `<div class="dan-row ${st} ${x.i >= 10 ? 'dan' : ''}">
        <div class="dan-name">${x.name}</div>
        <div class="dan-cond">打鍵/分 <b>${x.kpm}</b>　正確率 <b>${(x.acc * 100).toFixed(1)}%</b><small>${pools}</small></div>
        <div class="dan-best">${b ? `自己ベスト ${b.kpm}・${(b.acc * 100).toFixed(1)}%` : ''}</div>
        <div class="dan-st">${st === 'passed' ? '✔ 合格' : st === 'next' ? '<span class="dan-go"><kbd>Space</kbd> 受ける</span>' : '🔒'}</div></div>`;
    }).join('');
    const nextRow = $('#dan-list .dan-row.next');
    if (nextRow) { nextRow.onclick = () => this.start(); nextRow.scrollIntoView({ block: 'center' }); }
  },

  start() {
    const d = danData();
    if (d.rank >= DAN_RANKS.length - 1) { toast('十段まで合格しています。おめでとう！', 2400); return; }
    SFX.select();
    App.show('practice', { exam: d.rank + 1 });
  },

  onKey(e) {
    if (e.key === 'Escape') App.show(this.from || 'challenge');
    if (e.key === ' ' || e.key === 'Enter') this.start();
  },
};

// ---------------- 道場の かざり・幕 ----------------
// 左右の 掛け軸 (たて書き)。screen の 中に 1 つだけ 置く
function dojoDeco(screen, left, right) {
  let el = screen.querySelector('.dojo-deco');
  if (!el) { el = document.createElement('div'); el.className = 'dojo-deco'; screen.prepend(el); }
  el.innerHTML = `<div class="kakejiku l"><div class="kj-paper"><span>${left}</span><i class="kj-seal">印</i></div></div>
    <div class="kakejiku r"><div class="kj-paper"><span>${right}</span></div></div>`;
}
// 試験が 始まる ときの 幕 (歌舞伎の 定式幕: 黒・柿色・萌葱色)。名前を 見せてから 横に ひらく
function danCurtain(rank) {
  document.querySelectorAll('.dan-curtain').forEach(x => x.remove());
  const el = document.createElement('div');
  el.className = 'dan-curtain';
  el.innerHTML = `<div class="dc-cloth"></div><div class="dc-label"><small>段位認定</small><b>${rank.name}</b><small>${DAN_SECS}秒・打鍵/分 ${rank.kpm}・正確率 ${(rank.acc * 100).toFixed(1)}%</small></div>`;
  document.body.appendChild(el);
  // 拍子木 (カン・カン) → 幕が ひらく
  SFX.tone(1900, 0.06, { type: 'square', vol: 0.05 }); SFX.tone(2100, 0.06, { type: 'square', vol: 0.05, delay: 0.28 });
  setTimeout(() => { el.classList.add('open'); SFX.noise(0.9, { vol: 0.05, filter: 900, sweep: 300 }); }, 1100);
  setTimeout(() => el.remove(), 2300);
  return 2000; // この あいだは Space を うけつけない
}
