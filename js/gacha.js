// ============================================================
//  コイン・ガチャ・きせかえ
//  ・れんしゅう / バトル / サバイバル / しょうごう で コインが もらえる
//  ・ガチャから出るもの: キャラ・色ちがい・ぼうし・打つときのエフェクト
//  ・キャラが かぶると せんざいかくせい (★1〜★4)、そのあとは かけら
//  ・ほかのものが かぶると かけら。かけらは こうかんじょで 好きなものと こうかん
// ============================================================

const GACHA_COST = 100;
const GACHA_COST10 = 1000;
const START_COINS = 1000; // はじめて ガチャが 入ったときの プレゼント

const RARITY = {
  N: { name: 'N', color: '#adb5bd', shard: 1, price: 10 },
  R: { name: 'R', color: '#4dabf7', shard: 2, price: 25 },
  SR: { name: 'SR', color: '#cc5de8', shard: 5, price: 60 },
  SSR: { name: 'SSR', color: '#ffd43b', shard: 15, price: 150 },
};

// ガチャの確率: まず キャラ枠か アイテム枠かを きめ、アイテムは レア度で きめる
const GACHA_RATES = { newChar: 0.03, starterChar: 0.17 };
const ITEM_RATES = [['SSR', 0.03], ['SR', 0.12], ['R', 0.33], ['N', 0.52]];
// かくせいが おわったキャラが かぶったときの かけら / こうかんに ひつような かけら
const CHAR_SHARD = { gacha: 30, starter: 12 };
const CHAR_PRICE = { gacha: 200, starter: 80 };

const KIND_NAME = { char: 'キャラ', color: 'いろ', hat: 'ぼうし', fx: 'エフェクト' };

const GACHA_ITEMS = [
  // ---- 色ちがい (どのキャラにも ぬれる) ----
  { id: 'c_sakura', kind: 'color', rarity: 'N', name: 'さくらいろ', colors: { main: '#ffa8c5', light: '#fff0f6', dark: '#c2255c', accent: '#ffffff' } },
  { id: 'c_mint', kind: 'color', rarity: 'N', name: 'ミントいろ', colors: { main: '#63e6be', light: '#e6fcf5', dark: '#087f5b', accent: '#ffffff' } },
  { id: 'c_lemon', kind: 'color', rarity: 'N', name: 'レモンいろ', colors: { main: '#ffe066', light: '#fff9db', dark: '#e67700', accent: '#ffffff' } },
  { id: 'c_lavender', kind: 'color', rarity: 'N', name: 'ラベンダー', colors: { main: '#b197fc', light: '#f3f0ff', dark: '#6741d9', accent: '#ffdeeb' } },
  { id: 'c_sunset', kind: 'color', rarity: 'R', name: 'ゆうやけいろ', colors: { main: '#ff8787', light: '#ffe8cc', dark: '#c92a2a', accent: '#ffd43b' } },
  { id: 'c_deepsea', kind: 'color', rarity: 'R', name: 'しんかいいろ', colors: { main: '#1971c2', light: '#74c0fc', dark: '#0b2545', accent: '#63e6be' } },
  { id: 'c_choco', kind: 'color', rarity: 'R', name: 'チョコいろ', colors: { main: '#8d5524', light: '#e0b089', dark: '#4a2511', accent: '#ffc9de' } },
  { id: 'c_snow', kind: 'color', rarity: 'R', name: 'ゆきいろ', colors: { main: '#e7f5ff', light: '#ffffff', dark: '#74c0fc', accent: '#a5d8ff' } },
  { id: 'c_silver', kind: 'color', rarity: 'SR', name: 'ぎんいろ', colors: { main: '#ced4da', light: '#ffffff', dark: '#495057', accent: '#e9ecef' } },
  { id: 'c_midnight', kind: 'color', rarity: 'SR', name: 'まよなかいろ', colors: { main: '#343a40', light: '#868e96', dark: '#000000', accent: '#00f5d4' } },
  { id: 'c_gold', kind: 'color', rarity: 'SSR', name: 'きんいろ', colors: { main: '#fcc419', light: '#fff9db', dark: '#b8860b', accent: '#ffffff' } },
  { id: 'c_rainbow', kind: 'color', rarity: 'SSR', name: 'にじいろ', rainbow: true, colors: { main: '#ffe066', light: '#ffffff', dark: '#5f3dc4', accent: '#ffffff' } },
  // ---- ぼうし・アクセサリー ----
  { id: 'h_ribbon', kind: 'hat', rarity: 'N', name: 'リボン' },
  { id: 'h_hachimaki', kind: 'hat', rarity: 'N', name: 'はちまき' },
  { id: 'h_beret', kind: 'hat', rarity: 'N', name: 'ベレーぼう' },
  { id: 'h_sprout', kind: 'hat', rarity: 'N', name: 'ふたば' },
  { id: 'h_witch', kind: 'hat', rarity: 'R', name: 'まほうのぼうし' },
  { id: 'h_straw', kind: 'hat', rarity: 'R', name: 'むぎわらぼうし' },
  { id: 'h_cat', kind: 'hat', rarity: 'R', name: 'ねこみみ' },
  { id: 'h_shades', kind: 'hat', rarity: 'R', name: 'サングラス' },
  { id: 'h_tiara', kind: 'hat', rarity: 'SR', name: 'ティアラ' },
  { id: 'h_pirate', kind: 'hat', rarity: 'SR', name: 'かいぞくぼうし' },
  { id: 'h_starcrown', kind: 'hat', rarity: 'SSR', name: 'ほしのかんむり' },
  { id: 'h_kabuto', kind: 'hat', rarity: 'SSR', name: 'でんせつのかぶと' },
  // ---- 打つときのエフェクト ----
  { id: 'f_kira', kind: 'fx', rarity: 'N', name: 'きらきら', icon: '✨', shape: 'star', colors: ['#fff3bf', '#ffffff', '#ffd43b'], size: 5 },
  { id: 'f_bubble', kind: 'fx', rarity: 'N', name: 'あわ', icon: '🫧', shape: 'circle', colors: ['#a5d8ff', '#e7f5ff', '#74c0fc'], size: 5, gravity: -0.06 },
  { id: 'f_heart', kind: 'fx', rarity: 'R', name: 'ハート', icon: '💗', shape: 'heart', colors: ['#ff6b9d', '#ffa8c5', '#ff8787'], size: 7 },
  { id: 'f_snow', kind: 'fx', rarity: 'R', name: 'ゆき', icon: '❄️', shape: 'snow', colors: ['#ffffff', '#d0ebff', '#a5d8ff'], size: 6, gravity: 0.04 },
  { id: 'f_note', kind: 'fx', rarity: 'R', name: 'おんぷ', icon: '🎵', shape: 'text', text: '♪', colors: ['#ffd43b', '#69db7c', '#4dabf7', '#f783ac'], size: 7, gravity: -0.04 },
  { id: 'f_flame', kind: 'fx', rarity: 'SR', name: 'ほのお', icon: '🔥', shape: 'circle', colors: ['#ff922b', '#ffd43b', '#ff6b6b'], size: 6, gravity: -0.12 },
  { id: 'f_sakura', kind: 'fx', rarity: 'SR', name: 'さくらふぶき', icon: '🌸', shape: 'petal', colors: ['#ffc9de', '#ffa8c5', '#fff0f6'], size: 6, gravity: 0.03 },
  { id: 'f_rainbow', kind: 'fx', rarity: 'SSR', name: 'にじのほし', icon: '🌈', shape: 'star', colors: RAINBOW, size: 7 },
  { id: 'f_thunder', kind: 'fx', rarity: 'SSR', name: 'いなずま', icon: '⚡', shape: 'star', colors: ['#fff27a', '#ffffff', '#74c0fc'], size: 6, bolt: true },
];

// ★4 に なったときの ごほうび: そのキャラ専用の いろ (ガチャでは 出ない)
const AWAKEN_COLORS = {
  purun: { name: 'すいしょう', colors: { main: '#99e9f2', light: '#ffffff', dark: '#0b7285', accent: '#ffd43b' } },
  piriri: { name: 'しろいいなずま', colors: { main: '#f8f9fa', light: '#ffffff', dark: '#f08c00', accent: '#74c0fc' } },
  gotsun: { name: 'ひすい', colors: { main: '#38d9a9', light: '#e6fcf5', dark: '#087f5b', accent: '#ffd43b' } },
  homura: { name: 'あおいほのお', colors: { main: '#4dabf7', light: '#e7f5ff', dark: '#1864ab', accent: '#ffffff' } },
  moririn: { name: 'もみじ', colors: { main: '#ff922b', light: '#fff4e6', dark: '#a63c06', accent: '#ffd43b' } },
  kagemaru: { name: 'しろいかげ', colors: { main: '#f1f3f5', light: '#ffffff', dark: '#343a40', accent: '#e03131' } },
  ryumaru: { name: 'せいりゅう', colors: { main: '#20c997', light: '#c3fae8', dark: '#054d3b', accent: '#ffd43b' } },
  kirari: { name: 'よぞら', colors: { main: '#364fc7', light: '#dbe4ff', dark: '#0b1a5c', accent: '#ffe066' } },
};
for (const [id, a] of Object.entries(AWAKEN_COLORS)) {
  GACHA_ITEMS.push({ id: 'aw_' + id, kind: 'color', rarity: 'SSR', name: a.name, colors: a.colors, only: id, special: true });
}

// キャラも ガチャの なかみとして あつかう
const CHAR_ITEMS = Object.keys(CHARACTERS).map(id => ({
  id: 'ch_' + id, kind: 'char', char: id, rarity: CHARACTERS[id].gacha ? 'SSR' : 'SR', name: CHARACTERS[id].names[0],
}));
const ITEM_BY_ID = Object.fromEntries([...GACHA_ITEMS, ...CHAR_ITEMS].map(it => [it.id, it]));
// ガチャから出る アイテム (★4 の ごほうびは のぞく)
const POOL_ITEMS = GACHA_ITEMS.filter(it => !it.special);

// ---------------- セーブデータの 読み書き ----------------
function gachaData() {
  const g = Save.data.gacha = Save.data.gacha || {};
  g.items = g.items || {}; g.chars = g.chars || {}; g.awaken = g.awaken || {};
  g.shards = g.shards || 0; g.pulls = g.pulls || 0; g.ssr = g.ssr || 0;
  return g;
}
function hasItem(id) { return !!gachaData().items[id]; }
function wearOf(id) {
  Save.data.wear = Save.data.wear || {};
  return (Save.data.wear[id] = Save.data.wear[id] || { color: null, hat: null, fx: null });
}

// キャラが いま きているもの → slimeSVG に わたす形
function slimeLook(id) {
  const w = wearOf(id);
  const col = w.color && hasItem(w.color) ? ITEM_BY_ID[w.color] : null;
  return {
    colors: col ? col.colors : null,
    rainbow: col ? !!col.rainbow : false,
    hat: w.hat && hasItem(w.hat) ? w.hat.slice(2) : null,
    stars: awakenOf(id),
  };
}

function grantCoins(n) {
  n = Math.max(0, Math.round(n));
  Save.data.coins = (Save.data.coins || 0) + n;
  Save.save();
  return n;
}

// ★ の 表示
function starText(n) { return n > 0 ? '★'.repeat(n) + '☆'.repeat(AWAKEN_MAX - n) : ''; }

// ---------------- ガチャを 引く ----------------
function rollOne(minSR = false) {
  for (;;) {
    const r = Math.random();
    let it;
    if (r < GACHA_RATES.newChar) it = pick(CHAR_ITEMS.filter(c => CHARACTERS[c.char].gacha));
    else if (r < GACHA_RATES.newChar + GACHA_RATES.starterChar) it = pick(CHAR_ITEMS.filter(c => !CHARACTERS[c.char].gacha));
    else {
      let q = Math.random(), rar = 'N';
      for (const [k, p] of ITEM_RATES) { if (q < p) { rar = k; break; } q -= p; }
      it = pick(POOL_ITEMS.filter(x => x.rarity === rar));
    }
    if (!minSR || it.rarity === 'SR' || it.rarity === 'SSR') return it;
  }
}
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

// 手に入れたものを セーブに 反映し、どうなったかを 返す
function receive(it) {
  const g = gachaData();
  if (it.rarity === 'SSR') g.ssr++;
  if (it.kind === 'char') {
    const id = it.char;
    if (!hasChar(id)) { g.chars[id] = true; return { it, kind: 'new' }; }
    const aw = awakenOf(id);
    if (aw < AWAKEN_MAX) {
      g.awaken[id] = aw + 1;
      if (aw + 1 === AWAKEN_MAX) g.items['aw_' + id] = Date.now();
      return { it, kind: 'awaken', stars: aw + 1 };
    }
    const n = CHAR_SHARD[CHARACTERS[id].gacha ? 'gacha' : 'starter'];
    g.shards += n;
    return { it, kind: 'shard', n };
  }
  if (!g.items[it.id]) { g.items[it.id] = Date.now(); return { it, kind: 'new' }; }
  const n = RARITY[it.rarity].shard;
  g.shards += n;
  return { it, kind: 'shard', n };
}

function pullGacha(times) {
  const cost = times === 10 ? GACHA_COST10 : GACHA_COST * times;
  if ((Save.data.coins || 0) < cost) return null;
  Save.data.coins -= cost;
  const g = gachaData();
  const list = [];
  for (let i = 0; i < times; i++) {
    // 10 回 引くと さいごの 1 回は SR 以上が かくてい
    const guarantee = times === 10 && i === 9 && !list.some(x => x.rarity === 'SR' || x.rarity === 'SSR');
    list.push(rollOne(guarantee));
  }
  g.pulls += times;
  const res = list.map(receive);
  Save.save();
  return res;
}

// いちばん レアなもの
function bestRarity(res) {
  return ['SSR', 'SR', 'R', 'N'].find(k => res.some(r => r.it.rarity === k));
}

// 演出で つかう 大きな ガチャ機 (ハンドルと 玉は うごかす)
const GACHA_MACHINE_SVG = `<svg viewBox="0 0 160 190" xmlns="http://www.w3.org/2000/svg">
  <rect x="30" y="112" width="100" height="70" rx="12" fill="#e03131" stroke="#7a1414" stroke-width="4"/>
  <circle cx="80" cy="66" r="58" fill="rgba(255,255,255,.18)" stroke="#dee2e6" stroke-width="5"/>
  <g class="gs-balls"><circle cx="56" cy="78" r="14" fill="#4dabf7"/><circle cx="92" cy="86" r="14" fill="#ffd43b"/><circle cx="72" cy="48" r="14" fill="#f783ac"/>
  <circle cx="104" cy="54" r="13" fill="#69db7c"/><circle cx="60" cy="104" r="12" fill="#cc5de8"/><circle cx="100" cy="106" r="11" fill="#ff922b"/></g>
  <path d="M44,40 C54,24 70,18 84,18" stroke="#fff" stroke-width="5" fill="none" opacity=".6" stroke-linecap="round"/>
  <g class="gs-handle"><circle cx="80" cy="146" r="16" fill="#ffd43b" stroke="#7a1414" stroke-width="4"/><rect x="74" y="136" width="12" height="20" rx="3" fill="#7a1414"/></g>
  <rect x="46" y="168" width="68" height="8" rx="4" fill="#7a1414"/>
</svg>`;

// 集めた数 (ガチャで 出るもの ぜんぶ)
function collectCount() {
  const all = [...POOL_ITEMS.map(it => hasItem(it.id)), ...Object.keys(CHARACTERS).filter(id => CHARACTERS[id].gacha).map(hasChar)];
  return { have: all.filter(Boolean).length, total: all.length };
}

// ---------------- 絵 ----------------
function itemIcon(it, charId = Save.data.active) {
  const st = 0;
  if (it.kind === 'char') return `<div class="sprite">${slimeSVG(it.char, st, {})}</div>`;
  if (it.kind === 'color') return `<div class="sprite">${slimeSVG(it.only || charId, st, { colors: it.colors, rainbow: !!it.rainbow })}</div>`;
  if (it.kind === 'hat') return `<div class="sprite">${slimeSVG(charId, st, { hat: it.id.slice(2) })}</div>`;
  return `<div class="fx-icon" style="--fc:${it.colors[0]}">${it.icon}</div>`;
}

// 打つときのエフェクト (れんしゅう・バトル共通)。big = お題を 打ち切ったとき
function keyFx(root, big = false) {
  const w = wearOf(Save.data.active);
  if (!w.fx || !hasItem(w.fx)) return;
  const f = ITEM_BY_ID[w.fx];
  const el = root.querySelector('.tp-roma .next') || root.querySelector('.tp-roma');
  if (!el) return;
  const p = FX.center(el);
  FX.burst(p.x, p.y, { colors: f.colors, shape: f.shape, text: f.text, count: big ? 18 : 4, speed: big ? 6 : 3, size: f.size, gravity: f.gravity ?? 0.12, life: big ? 44 : 30 });
  if (f.bolt && big) FX.bolt(p.x + 30, p.y - 120, p.x, p.y, '#fff27a', 10);
}

// ---------------- ガチャの 画面 ----------------
Screens.gacha = {
  enter() {
    this.tab = 'result';
    this.last = null;
    this.busy = false;
    this.confirm = null;
    $('#gc-one').onclick = () => this.pull(1);
    $('#gc-ten').onclick = () => this.pull(10);
    document.querySelectorAll('#gc-tabs button').forEach(b => { b.onclick = () => this.setTab(b.dataset.v); });
    $('#btn-gacha-back').onclick = () => App.show('home');
    this.render();
  },

  setTab(t) { this.tab = t; this.confirm = null; SFX.select(); this.render(); },

  render() {
    const g = gachaData();
    const coins = Save.data.coins || 0;
    const cc = collectCount();
    $('#gc-coins').textContent = coins;
    $('#gc-shards').textContent = g.shards;
    $('#gc-collect').textContent = `${cc.have}/${cc.total}`;
    $('#gc-one').disabled = coins < GACHA_COST;
    $('#gc-ten').disabled = coins < GACHA_COST10;
    document.querySelectorAll('#gc-tabs button').forEach(b => b.classList.toggle('on', b.dataset.v === this.tab));
    const box = $('#gc-panel');
    if (this.tab === 'result') box.innerHTML = this.resultHtml();
    if (this.tab === 'shop') box.innerHTML = this.shopHtml();
    if (this.tab === 'list') box.innerHTML = this.listHtml();
    box.querySelectorAll('[data-buy]').forEach(b => { b.onclick = () => this.buy(b.dataset.buy); });
  },

  resultHtml() {
    if (!this.last) {
      return `<div class="gc-empty">
        <p>コインで ガチャを 引こう！</p>
        <p class="gc-help">キャラが かぶると <b>せんざいかくせい</b> (★1〜★4) で 少し強くなる。<br>
        ★4 の あとや、ほかのものが かぶると <b>かけら 💎</b> に なる。<br>かけらは <b>こうかんじょ</b> で 好きなものと こうかんできる。</p>
        <p class="gc-help">コインは れんしゅう・バトル・サバイバル・しょうごう で もらえるよ</p></div>`;
    }
    return `<div class="gc-results ${this.last.length > 1 ? 'ten' : 'one'}">${this.last.map((r, i) => {
      const it = r.it;
      const tag = r.kind === 'new' ? '<span class="gc-new">NEW!</span>'
        : r.kind === 'awaken' ? `<span class="gc-aw">かくせい ${starText(r.stars)}</span>`
          : `<span class="gc-shard">💎 +${r.n}</span>`;
      return `<div class="gc-card r-${it.rarity}" style="--rc:${RARITY[it.rarity].color};animation-delay:${i * 0.12}s">
        <span class="gc-rar">${it.rarity}</span>
        ${itemIcon(it)}
        <div class="gc-name">${it.name}</div>
        <div class="gc-kind">${KIND_NAME[it.kind]}</div>
        ${tag}</div>`;
    }).join('')}</div>`;
  },

  // かけらの こうかんじょ
  shopHtml() {
    const g = gachaData();
    const chars = Object.keys(CHARACTERS).map(id => {
      const gacha = !!CHARACTERS[id].gacha;
      const price = CHAR_PRICE[gacha ? 'gacha' : 'starter'];
      const aw = awakenOf(id);
      const full = hasChar(id) && aw >= AWAKEN_MAX;
      const what = !hasChar(id) ? 'なかまにする' : full ? 'かくせい MAX' : `かくせい ★${aw + 1} にする`;
      return this.shopRow(CHAR_ITEMS.find(c => c.char === id), price, full, what);
    }).join('');
    const items = POOL_ITEMS.filter(it => !hasItem(it.id))
      .sort((a, b) => Object.keys(RARITY).indexOf(b.rarity) - Object.keys(RARITY).indexOf(a.rarity))
      .map(it => this.shopRow(it, RARITY[it.rarity].price, false, 'てにいれる')).join('');
    return `<div class="gc-shop-head">もっている かけら <b>💎 ${g.shards}</b>　・　ボタンを 2 回 おすと こうかん</div>
      <h4>キャラ</h4><div class="gc-shop">${chars}</div>
      <h4>まだ もっていない アイテム</h4><div class="gc-shop">${items || '<p class="gc-help">ぜんぶ あつめた！ すごい！</p>'}</div>`;
  },

  shopRow(it, price, disabled, what) {
    const g = gachaData();
    const can = !disabled && g.shards >= price;
    const asking = this.confirm === it.id;
    return `<div class="gc-row r-${it.rarity}" style="--rc:${RARITY[it.rarity].color}">
      ${itemIcon(it)}
      <div class="gc-row-body"><div class="gc-name">${it.name} <span class="gc-rar-s">${it.rarity}</span></div><div class="gc-kind">${KIND_NAME[it.kind]}・${what}</div></div>
      <button class="gc-buy ${asking ? 'ask' : ''}" data-buy="${it.id}" ${can ? '' : 'disabled'}>${disabled ? '—' : asking ? 'こうかんする？' : `💎 ${price}`}</button></div>`;
  },

  buy(id) {
    const it = ITEM_BY_ID[id];
    if (this.confirm !== id) { this.confirm = id; SFX.select(); this.render(); return; }
    const price = it.kind === 'char' ? CHAR_PRICE[CHARACTERS[it.char].gacha ? 'gacha' : 'starter'] : RARITY[it.rarity].price;
    const g = gachaData();
    if (g.shards < price) return;
    g.shards -= price;
    const r = receive(it);
    Save.save();
    this.confirm = null;
    SFX.levelup();
    toast(r.kind === 'awaken' ? `${it.name} が かくせい ${starText(r.stars)} に なった！` : `${it.name} を てにいれた！`);
    this.afterGet([r]);
    this.render();
  },

  // ラインナップ (ガチャずかん)
  listHtml() {
    const rate = (k, p) => `<span class="gc-rate" style="--rc:${RARITY[k].color}">${k} ${(p * 100).toFixed(1)}%</span>`;
    const itemShare = 1 - GACHA_RATES.newChar - GACHA_RATES.starterChar;
    const sec = (kind, list) => `<h4>${KIND_NAME[kind]}</h4><div class="gc-list">${list.map(it => {
      const own = it.kind === 'char' ? hasChar(it.char) : hasItem(it.id);
      return `<div class="gc-cell ${own ? 'own' : 'none'}" style="--rc:${RARITY[it.rarity].color}" title="${own ? it.name : '？？？'}">
        <span class="gc-rar-s">${it.rarity}</span>${own ? itemIcon(it) : '<div class="gc-q">？</div>'}<div class="gc-name">${own ? it.name : '？？？'}</div>
        ${it.kind === 'char' && hasChar(it.char) && awakenOf(it.char) ? `<div class="gc-stars">${starText(awakenOf(it.char))}</div>` : ''}</div>`;
    }).join('')}</div>`;
    return `<div class="gc-rates">
        <div>キャラ: ガチャ限定 ${(GACHA_RATES.newChar * 100).toFixed(0)}% ・ いつものキャラ ${(GACHA_RATES.starterChar * 100).toFixed(0)}%</div>
        <div>アイテム: ${ITEM_RATES.map(([k, p]) => rate(k, p * itemShare)).join(' ')}</div>
        <div class="gc-help">10 回 引くと SR 以上が 1 つ かくてい</div></div>
      ${sec('char', CHAR_ITEMS)}${sec('color', POOL_ITEMS.filter(i => i.kind === 'color'))}${sec('hat', POOL_ITEMS.filter(i => i.kind === 'hat'))}${sec('fx', POOL_ITEMS.filter(i => i.kind === 'fx'))}`;
  },

  async pull(times) {
    if (this.busy) return;
    const res = pullGacha(times);
    if (!res) { toast('コインが たりないよ'); return; }
    this.busy = true;
    this.tab = 'result';
    this.last = null;
    this.render();
    await this.show(res);
    this.last = res;
    this.render();
    const best = bestRarity(res);
    if (best === 'SSR') setTimeout(() => FX.confetti(), 200);
    else if (best === 'SR') SFX.levelup();
    else SFX.word();
    this.afterGet(res);
    this.busy = false;
  },

  // ---------------- 回すときの 演出 ----------------
  // Space / Enter で とばせる
  wait(ms) {
    return new Promise(r => {
      if (this.skip) return r();
      const t = setTimeout(r, ms);
      this._skipNow = () => { clearTimeout(t); r(); };
    });
  },

  async show(res) {
    const best = bestRarity(res);
    const stage = $('#gc-stage');
    this.skip = false;
    // SSR のときは さいしょ ちがう色の カプセルで 出して、とちゅうで 金色に かわる
    const fake = best === 'SSR' ? (Math.random() < 0.5 ? 'SR' : 'R') : best;
    stage.innerHTML = `
      <div class="gs-rays"></div>
      <div class="gs-machine">${GACHA_MACHINE_SVG}</div>
      <div class="gs-cap" style="--cap:${RARITY[fake].color}"><div class="gs-top"></div><div class="gs-bottom"></div><div class="gs-shine"></div></div>
      <div class="gs-text"></div>
      <div class="gs-skip"><kbd>Space</kbd> で とばす</div>`;
    stage.className = 'gc-stage show';
    const cls = c => { stage.className = 'gc-stage show ' + c; };

    // 1. ガチャ機が 大きくなって 出てくる
    SFX.tone(300, 0.3, { type: 'sine', vol: 0.05, slide: 700 });
    await this.wait(550);
    // 2. ハンドルを ガチャガチャ まわす
    cls('turning');
    for (let i = 0; i < 6 && !this.skip; i++) {
      SFX.tone(700 + i * 40, 0.04, { vol: 0.04 }); SFX.noise(0.05, { vol: 0.05, filter: 2500, delay: 0.08 });
      await this.wait(200);
    }
    // 3. カプセルが ころがり出て、まんなかで 大きくなる
    cls('drop');
    SFX.tone(500, 0.15, { type: 'triangle', vol: 0.05, slide: 200 });
    await this.wait(650);
    cls('drop center');
    await this.wait(700);

    if (best === 'SSR' && !this.skip) {
      // 4. SSR: いちど とまって ぶるぶる → 暗くなって 金色に かわる
      cls('drop center hold');
      SFX.tone(120, 1.2, { type: 'sawtooth', vol: 0.04, slide: 400 });
      await this.wait(1300);
      cls('drop center hold dark');
      await this.wait(500);
      stage.querySelector('.gs-cap').style.setProperty('--cap', RARITY.SSR.color);
      cls('drop center ssr');
      replayAnim(document.body, 'flash-white', 400);
      SFX.thunder();
      setTimeout(() => SFX.win(), 250);
      stage.querySelector('.gs-text').innerHTML = '<b>SSR</b><span>かくてい！</span>';
      const c = FX.center(stage.querySelector('.gs-cap'));
      FX.burst(c.x, c.y, { colors: [...RAINBOW, '#fff'], count: 90, shape: 'star', size: 8, speed: 11 });
      FX.ring(c.x, c.y, '#ffd43b', 260, 40, 10);
      await this.wait(1900);
    } else if (best === 'SR' && !this.skip) {
      cls('drop center sr');
      SFX.charge();
      await this.wait(700);
    } else {
      await this.wait(250);
    }

    // 5. カプセルが ひらく
    cls(`drop center open ${best === 'SSR' ? 'ssr' : ''}`);
    SFX.tone(1320, 0.12, { vol: 0.05 }); SFX.tone(1760, 0.18, { vol: 0.05, delay: 0.08 });
    const c = FX.center(stage.querySelector('.gs-cap'));
    FX.burst(c.x, c.y, { colors: [RARITY[best].color, '#fff'], count: best === 'SSR' ? 60 : 30, shape: 'star', size: 7, speed: 8 });
    await this.wait(450);
    stage.className = 'gc-stage';
    stage.innerHTML = '';
    this._skipNow = null;
  },

  // 新しい なかま・★4・しょうごうを 知らせる
  afterGet(res) {
    res.forEach((r, i) => {
      if (r.it.kind === 'char' && r.kind === 'new') setTimeout(() => toast(`🎉 ${r.it.name} が なかまに なった！「スライムをかえる」で えらべるよ`, 3200), 900 + i * 200);
      if (r.kind === 'awaken' && r.stars === AWAKEN_MAX) setTimeout(() => toast(`🌟 ${r.it.name} が かくせい MAX！ 専用の いろ「${AWAKEN_COLORS[r.it.char].name}」を てにいれた`, 3400), 900 + i * 200);
    });
    checkAchievements(null).forEach((a, i) => setTimeout(() => toast(`🏅 しょうごう「${a.name}」を 手に入れた！ (🪙+${ACH_COINS})`, 2600), 1800 + i * 2800));
    this.render();
  },

  onKey(e) {
    // 演出中は Space / Enter で とばす
    if (this.busy) {
      if ((e.key === ' ' || e.key === 'Enter') && !this.skip) { this.skip = true; if (this._skipNow) this._skipNow(); }
      return;
    }
    if (e.key === '1') this.pull(1);
    if (e.key === '2') this.pull(10);
    if (e.key === '3') this.setTab('result');
    if (e.key === '4') this.setTab('shop');
    if (e.key === '5') this.setTab('list');
    if (e.key === 'Escape') App.show('home');
  },
};

// ---------------- きせかえの 画面 ----------------
Screens.wardrobe = {
  enter() {
    this.char = Save.data.active;
    this.tab = this.tab || 'color';
    document.querySelectorAll('#wd-tabs button').forEach(b => { b.onclick = () => { this.tab = b.dataset.v; SFX.select(); this.render(); }; });
    $('#btn-wd-back').onclick = () => App.show('home');
    $('#wd-try').onclick = () => this.tryFx();
    this.render();
  },

  render() {
    const id = this.char;
    const c = charInfo(id);
    const w = wearOf(id);
    const aw = c.awaken;
    // キャラの きりかえ
    $('#wd-chars').innerHTML = Object.keys(CHARACTERS).filter(hasChar).map(cid =>
      `<button class="wd-char ${cid === id ? 'on' : ''}" data-id="${cid}" title="${charInfo(cid).name}"><div class="sprite">${slimeSVG(cid, charInfo(cid).stage)}</div></button>`).join('');
    $('#wd-chars').querySelectorAll('.wd-char').forEach(b => { b.onclick = () => { this.char = b.dataset.id; SFX.select(); this.render(); }; });

    $('#wd-preview').innerHTML = `<div class="sprite big bounce" id="wd-sprite">${slimeSVG(id, c.stage)}</div>
      <div class="wd-name">${c.name} <small>Lv.${c.L}</small></div>
      <div class="wd-stars">${aw ? starText(aw) : '<small>かくせい なし</small>'}</div>
      <div class="wd-aw">
        <b>せんざいかくせい ${aw}/${AWAKEN_MAX}</b>
        <span>能力値 +${Math.round(aw * AWAKEN_STAT * 100)}%　・　レベルの上限 Lv.${c.cap}</span>
        <span>${aw ? `${AWAKEN_BONUS[id].desc} × ${aw}` : `★ 1 つごとに ${AWAKEN_BONUS[id].desc}`}</span>
        <span class="wd-note">ガチャで ${CHARACTERS[id].names[0]} が かぶると ★ が ふえる。★4 で 専用の いろ「${AWAKEN_COLORS[id].name}」と しょうごう</span>
      </div>`;

    document.querySelectorAll('#wd-tabs button').forEach(b => b.classList.toggle('on', b.dataset.v === this.tab));
    $('#wd-try').style.display = this.tab === 'fx' ? '' : 'none';
    const list = GACHA_ITEMS.filter(it => it.kind === this.tab && (!it.only || it.only === id) && (!it.special || hasItem(it.id)));
    const cur = w[this.tab];
    const none = `<button class="wd-item ${!cur ? 'on' : ''}" data-id=""><div class="wd-none">なし</div><div class="gc-name">${this.tab === 'color' ? 'もとの いろ' : 'はずす'}</div></button>`;
    $('#wd-items').innerHTML = none + list.map(it => {
      const own = hasItem(it.id);
      return `<button class="wd-item ${cur === it.id ? 'on' : ''} ${own ? '' : 'locked'}" data-id="${it.id}" style="--rc:${RARITY[it.rarity].color}" ${own ? '' : 'disabled'}>
        <span class="gc-rar-s">${it.rarity}</span>
        ${own ? itemIcon(it, id) : '<div class="gc-q">？</div>'}
        <div class="gc-name">${own ? it.name : '？？？'}</div></button>`;
    }).join('');
    $('#wd-items').querySelectorAll('.wd-item:not(.locked)').forEach(b => { b.onclick = () => this.wear(b.dataset.id || null); });
    const owned = list.filter(it => hasItem(it.id)).length;
    $('#wd-count').textContent = `${KIND_NAME[this.tab]} ${owned}/${list.length}`;
  },

  wear(itemId) {
    const w = wearOf(this.char);
    w[this.tab] = itemId;
    Save.save();
    SFX.select();
    this.render();
    const sp = $('#wd-sprite');
    const p = FX.center(sp);
    replayAnim(sp, 'jump', 600);
    FX.burst(p.x, p.y, { colors: ['#fff', '#ffd43b'], count: 20, shape: 'star', size: 5 });
    if (this.tab === 'fx') this.tryFx();
  },

  // エフェクトを ためしに 出す
  tryFx() {
    const w = wearOf(this.char);
    if (!w.fx) return;
    const f = ITEM_BY_ID[w.fx];
    const p = FX.center($('#wd-sprite'));
    for (let i = 0; i < 5; i++) {
      setTimeout(() => FX.burst(p.x + (i - 2) * 40, p.y - 60, { colors: f.colors, shape: f.shape, text: f.text, count: i === 4 ? 18 : 5, speed: i === 4 ? 6 : 3, size: f.size, gravity: f.gravity ?? 0.12, life: 40 }), i * 120);
    }
    if (f.bolt) setTimeout(() => FX.bolt(p.x + 30, p.y - 200, p.x, p.y - 40, '#fff27a', 12), 480);
  },

  onKey(e) {
    const tabs = ['color', 'hat', 'fx'];
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 3) { this.tab = tabs[n - 1]; SFX.select(); this.render(); }
    if (e.key === 'Escape') App.show('home');
  },
};
