// ============================================================
//  サバイバルモード
//  ・WASD / 矢印キーで移動。自分のスライムはいつも画面の真ん中
//  ・まわりから敵がどんどん迫ってくる。武器は自動で攻撃
//  ・敵が落とす宝箱で新しい武器を手に入れたり強化したりできる (最大 6 こ)
//  ・難易度 (かんたん〜おに) ごとに 敵の強さ・出てくる敵・ボスが変わる
//  ・2:30 にボスが登場。たおせばクリア
// ============================================================

const SV_BOSS_AT = 150;   // ボスが出てくる時間(秒)
const SV_TOTAL = 180;     // タイムバーの長さ(秒)
const SV_PLAYER_R = 22;
const SV_MAX_LV = 5;
const SV_MAX_WEAPONS = 6;
// 軽くするための上限 (ひかえめモードでは さらに少なく)
const SV_LIMITS = {
  normal: { enemies: 90, parts: 260, texts: 40, dpr: 1.5 },
  lite: { enemies: 60, parts: 120, texts: 24, dpr: 1 },
};
const SV_LV_HP = 75;   // レベルによる 敵の HP の上がり方 (小さいほど強くなる)
const SV_LV_DMG = 120;  // レベルによる 敵の攻撃の上がり方
const SV_ENEMY_HP_BOOST = 1.0; // 敵1体のかたさの調整用 (1 = そのまま)

// 難易度: 敵の HP・攻撃・出現数・ボスの HP・もらえる経験値の倍率
const SV_DIFFS = {
  easy: {
    name: 'かんたん', color: '#6dff8a', rec: 'Lv.1〜', hp: 0.8, dmg: 0.6, spawn: 0.85, bossHp: 0.45, exp: 0.7, boss: 'dragon',
    desc: 'そうげんの 敵だけ。はじめての人に',
    tiers: [['bat', 'mush'], ['bat', 'mush', 'ghost'], ['mush', 'ghost', 'goblin'], ['ghost', 'goblin', 'golem']],
  },
  normal: {
    name: 'ふつう', color: '#4fb3ff', rec: 'Lv.20〜', hp: 1.5, dmg: 1.35, spawn: 1.1, bossHp: 1.4, exp: 1, boss: 'kraken',
    desc: 'うみの 敵も まざる。ボスは クラーケン',
    tiers: [['bat', 'mush'], ['bat', 'ghost', 'crab'], ['ghost', 'goblin', 'jelly', 'crab'], ['goblin', 'golem', 'shark', 'jelly']],
  },
  hard: {
    name: 'むずかしい', color: '#ffd23f', rec: 'Lv.45〜', hp: 2.5, dmg: 1.85, spawn: 1.3, bossHp: 2.4, exp: 1.6, boss: 'yeti',
    desc: 'うみ と ゆきやまの 強い敵。ボスは イエティ',
    tiers: [['crab', 'jelly'], ['jelly', 'shark', 'penguin'], ['penguin', 'snowman', 'wolf'], ['wolf', 'golem', 'snowman', 'shark']],
  },
  oni: {
    name: 'おに', color: '#ff5d5d', rec: 'Lv.70〜', hp: 3.3, dmg: 2.0, spawn: 1.4, bossHp: 3.6, exp: 2.4, boss: 'demon',
    desc: 'マグマのしろの 敵が だいしゅうごう。ボスは まおう',
    tiers: [['crab', 'jelly', 'penguin'], ['penguin', 'wolf', 'snowman'], ['wolf', 'imp', 'salamander'], ['imp', 'salamander', 'mgolem']],
  },
};
const SV_DIFF_KEYS = Object.keys(SV_DIFFS);

// 敵の強さ (w = 画面での横はば)
const SV_ENEMIES = {
  bat: { hp: 10, spd: 100, dmg: 4, r: 20, gem: 1, w: 70, color: '#b48cff' },
  mush: { hp: 20, spd: 60, dmg: 6, r: 22, gem: 2, w: 58, color: '#ff6b6b' },
  ghost: { hp: 18, spd: 78, dmg: 7, r: 22, gem: 2, w: 60, alpha: 0.8, color: '#e5dbff' },
  goblin: { hp: 55, spd: 68, dmg: 10, r: 28, gem: 5, w: 76, chest: 0.1, color: '#69db7c' },
  golem: { hp: 150, spd: 44, dmg: 14, r: 38, gem: 10, w: 104, chest: 0.3, color: '#adb5bd' },
  crab: { hp: 30, spd: 55, dmg: 8, r: 26, gem: 3, w: 78, color: '#ff6b4a' },
  jelly: { hp: 22, spd: 72, dmg: 7, r: 22, gem: 2, w: 58, alpha: 0.85, color: '#e0aaff' },
  shark: { hp: 42, spd: 110, dmg: 10, r: 28, gem: 4, w: 100, color: '#74a9e8' },
  penguin: { hp: 45, spd: 75, dmg: 9, r: 24, gem: 4, w: 64, color: '#74c0fc' },
  snowman: { hp: 72, spd: 45, dmg: 10, r: 28, gem: 5, w: 66, color: '#ffffff' },
  wolf: { hp: 50, spd: 118, dmg: 11, r: 28, gem: 5, w: 92, color: '#a5d8ff' },
  imp: { hp: 45, spd: 95, dmg: 11, r: 24, gem: 5, w: 64, color: '#ff7a1a' },
  mgolem: { hp: 180, spd: 42, dmg: 16, r: 38, gem: 12, w: 104, chest: 0.3, color: '#ff5400' },
  salamander: { hp: 80, spd: 82, dmg: 13, r: 30, gem: 7, w: 100, chest: 0.1, color: '#ffba08' },
  // ボス
  dragon: { hp: 2000, spd: 58, dmg: 22, r: 70, gem: 0, w: 230, color: '#ff7a1a' },
  kraken: { hp: 2100, spd: 50, dmg: 22, r: 74, gem: 0, w: 230, color: '#c9184a' },
  yeti: { hp: 2300, spd: 62, dmg: 24, r: 74, gem: 0, w: 220, color: '#d0ebff' },
  demon: { hp: 2500, spd: 60, dmg: 26, r: 78, gem: 0, w: 240, color: '#9d4edd' },
};

// ボスの攻撃のくせ
const SV_BOSS = {
  dragon: { name: 'ドラゴン', color: '#ff7a1a', core: '#ffe14d', ring: 10, aim: 3, spd: 190, dash: true },
  kraken: { name: 'クラーケン', color: '#7b2cbf', core: '#10002b', ring: 14, aim: 0, spd: 150, dash: false, summon: 'jelly' },
  yeti: { name: 'イエティ', color: '#a5d8ff', core: '#ffffff', ring: 8, aim: 5, spd: 240, dash: true, slow: true },
  demon: { name: 'まおう', color: '#9d4edd', core: '#ff006e', ring: 16, aim: 3, spd: 200, dash: true, summon: 'imp', homing: true },
};

// 武器
const SV_WEAPONS = {
  water: { name: 'みずでっぽう', icon: '💧', color: '#4fb3ff', desc: 'いちばん近い敵に 水の玉をうつ' },
  thunder: { name: 'サンダー', icon: '⚡', color: '#ffe14d', desc: '近くの敵に かみなりを落とす' },
  rock: { name: 'いわシールド', icon: '🪨', color: '#b08a64', desc: 'まわりを 岩がぐるぐる回って守る' },
  fire: { name: 'ほのおのわ', icon: '🔥', color: '#ff7a1a', desc: 'まわりに 炎の輪を広げて 敵をはじく' },
  boomerang: { name: 'ブーメラン', icon: '🪃', color: '#c38bff', desc: '進む方向に投げると もどってくる' },
  star: { name: 'ホーミングスター', icon: '⭐', color: '#ffd43b', desc: '敵を おいかける 星をとばす' },
  ice: { name: 'アイスノヴァ', icon: '❄️', color: '#a5d8ff', desc: '氷のつぶを 全方向にとばし 敵をおそくする' },
  laser: { name: 'レーザー', icon: '🔆', color: '#ff5dd6', desc: '進む方向に 太いビームを 発射する' },
  meteor: { name: 'メテオ', icon: '☄️', color: '#ff6a00', desc: '空から いんせきを落として 大ばくはつ' },
  tornado: { name: 'たつまき', icon: '🌪️', color: '#96f2d7', desc: '敵を まきこむ たつまきを 生みだす' },
};
const SV_START_WEAPON = { purun: 'water', piriri: 'thunder', gotsun: 'rock', homura: 'fire', moririn: 'boomerang', kagemaru: 'star', ryumaru: 'meteor', kirari: 'laser' };

function svWeaponStat(id, lv) {
  const i = lv - 1;
  switch (id) {
    case 'water': return { cd: 0.8 - 0.08 * i, count: [1, 2, 2, 3, 3][i], dmg: 14 + 3 * i, pierce: lv >= 4 ? 2 : 1, speed: 520 };
    case 'thunder': return { cd: 1.5 - 0.15 * i, strikes: [2, 2, 3, 3, 4][i], dmg: 26 + 6 * i, area: 55 + 5 * i };
    case 'rock': return { count: [2, 2, 3, 4, 5][i], dmg: 12 + 3 * i, radius: 80 + 6 * i, spin: 3 + 0.3 * lv };
    case 'fire': return { cd: 2.4 - 0.2 * i, radius: 120 + 15 * i, dmg: 16 + 5 * i };
    case 'boomerang': return { cd: 1.6 - 0.15 * i, count: [1, 1, 2, 2, 3][i], dmg: 20 + 5 * i };
    case 'star': return { cd: 1.3 - 0.1 * i, count: [2, 3, 3, 4, 5][i], dmg: 13 + 3 * i };
    case 'ice': return { cd: 2.3 - 0.15 * i, count: [8, 10, 12, 14, 16][i], dmg: 10 + 3 * i, slow: 1.4 + 0.2 * i };
    case 'laser': return { cd: 2.8 - 0.25 * i, dmg: 34 + 9 * i, width: 26 + 5 * i, len: 720 };
    case 'meteor': return { cd: 3.2 - 0.3 * i, count: [1, 1, 2, 2, 3][i], dmg: 60 + 16 * i, radius: 95 + 8 * i };
    case 'tornado': return { cd: 3.4 - 0.25 * i, count: [1, 1, 2, 2, 3][i], dmg: 7 + 2 * i, radius: 52 + 5 * i, life: 3 + 0.3 * i };
  }
  return {};
}

// SVG の viewBox から 縦横の比を読む
function svgAspect(svg) {
  const m = svg.match(/viewBox="[-\d.]+ [-\d.]+ ([\d.]+) ([\d.]+)"/);
  return m ? +m[2] / +m[1] : 1;
}

Screens.survival = {
  enter() {
    this.ch = charInfo(Save.data.active);
    this.cv = $('#sv-canvas');
    this.ctx = this.cv.getContext('2d');
    this.resize();
    this._onResize = () => this.resize();
    addEventListener('resize', this._onResize);

    // 画像を用意 (SVG は毎フレーム描くととても重いので、最初に 1 回だけ 絵(ビットマップ)にしておく)
    this.sprites = {}; this.glows = {};
    this.buildSprites();
    this.pattern = this.makeGround();

    this.diffKey = SV_DIFFS[Save.data.settings.svDiff] ? Save.data.settings.svDiff : 'normal';
    this.reset();
    this.state = 'ready';
    this._drawnState = null;
    this.showReady();
    this.last = performance.now();
    this.raf = requestAnimationFrame(t => this.tick(t));
  },

  // 1 回ぶんのゲームの状態を作りなおす
  reset() {
    const st = this.ch.stats;
    const base = this.ch.def.base;
    const max = Math.round(st.hp * 2.5 + 40);
    let speed = 175 * (0.85 + base.spd / 300);
    // とくせいは 進化すると強くなる
    if (this.ch.id === 'piriri') speed *= [1.15, 1.18, 1.21, 1.24, 1.27][this.ch.stage];
    this.p = { x: 0, y: 0, hp: max, max, speed, face: 1, dir: { x: 1, y: 0 }, inv: 0, regenT: 0, moving: false, slowUntil: 0 };
    this.dmgMult = 1 + (st.atk - 5) / 60;
    // ほむら: 武器のダメージが上がる (進化で もっと上がる)
    if (this.ch.id === 'homura') this.dmgMult *= [1.1, 1.14, 1.18, 1.22, 1.26][this.ch.stage];
    // きらり: 武器を うつ間かくが みじかい
    this.cdMult = this.ch.id === 'kirari' ? [0.9, 0.88, 0.86, 0.84, 0.82][this.ch.stage] : 1;
    this.weapons = { [SV_START_WEAPON[this.ch.id]]: { lv: 1, t: 0.5 } };

    this.enemies = []; this.shots = []; this.eshots = []; this.pickups = [];
    this.parts = []; this.texts = []; this.fx = []; this.decals = [];
    this.time = 0; this.kills = 0; this.gems = 0;
    this.spawnT = 1; this.lastChest = 0; this.events = { 60: false, 110: false };
    this.boss = null; this.bossSpawned = false; this.rockAngle = 0;
    this.shakeAmt = 0; this.flash = 0;
    this.held = new Set();
    this.hudT = 0;
    $('#sv-name').innerHTML = `${this.ch.name} <small>Lv.${this.ch.L}</small>`;
    $('#sv-boss').classList.remove('show');
    this.updateHud();
  },

  diff() { return SV_DIFFS[this.diffKey]; },
  lim() { return Save.data.settings.lite ? SV_LIMITS.lite : SV_LIMITS.normal; },

  async buildSprites() {
    const q = this.dpr;
    const jobs = Object.keys(SV_ENEMIES).map(id => {
      const svg = enemySVG(id);
      const w = SV_ENEMIES[id].w;
      return [id, svg, w, w * svgAspect(svg)];
    });
    const psvg = slimeSVG(this.ch.id, this.ch.stage);
    const pw = this.ch.stage >= 3 ? 104 : 76; // つばさのある姿は 横に広い
    jobs.push(['player', psvg, pw, pw * svgAspect(psvg)]);
    await Promise.all(jobs.map(async ([id, svg, w, h]) => {
      const img = svgToImage(svg);
      try { await img.decode(); } catch (e) { return; }
      const c = document.createElement('canvas');
      c.width = Math.ceil(w * q); c.height = Math.ceil(h * q);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      this.sprites[id] = { c, flash: this.tint(c, 'rgba(255,255,255,.8)'), slow: this.tint(c, 'rgba(70,150,255,.5)'), w, h };
    }));
  },

  // 絵を 1 色で うすく ぬった版を作る (ダメージの白い光・こおった青色用)
  tint(src, color) {
    const c = document.createElement('canvas');
    c.width = src.width; c.height = src.height;
    const g = c.getContext('2d');
    g.drawImage(src, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
    return c;
  },

  // 光る玉の絵をキャッシュ (毎フレーム グラデーションを作らない)
  glow(color, r) {
    const key = color + r;
    if (this.glows[key]) return this.glows[key];
    const q = this.dpr;
    const c = document.createElement('canvas');
    c.width = c.height = Math.ceil(r * 2 * q);
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(r * q, r * q, 0, r * q, r * q, r * q);
    gr.addColorStop(0, color); gr.addColorStop(0.35, color); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
    return (this.glows[key] = c);
  },

  drawGlow(ctx, color, x, y, r, alpha = 1) {
    if (alpha < 1) ctx.globalAlpha = alpha;
    ctx.drawImage(this.glow(color, r), x - r, y - r, r * 2, r * 2);
    if (alpha < 1) ctx.globalAlpha = 1;
  },

  showReady() {
    const w = SV_WEAPONS[SV_START_WEAPON[this.ch.id]];
    const best = k => {
      const b = Save.data.best['sv-' + k];
      return b ? (b.cleared ? '<span class="svd-best clear">クリア済み</span>' : `<span class="svd-best">さいこう ${fmtTime(b.time)}</span>`) : '';
    };
    const cards = SV_DIFF_KEYS.map((k, i) => {
      const d = SV_DIFFS[k];
      return `<button class="svd-card ${k === this.diffKey ? 'on' : ''}" data-k="${k}" style="--dc:${d.color}">
        <span class="mc-key">${i + 1}</span>
        <div class="svd-boss">${enemySVG(d.boss)}</div>
        <div class="svd-name">${d.name}</div>
        <div class="svd-rec">おすすめ ${d.rec}</div>
        <div class="svd-desc">${d.desc}</div>
        <div class="svd-exp">EXP ×${d.exp}</div>
        ${best(k)}
      </button>`;
    }).join('');
    this.overlay(`<div class="ov-box sv-ready">
      <div class="ov-title">サバイバルモード</div>
      <div class="ov-sub">まわりから せまる敵を たおして 生きのころう！ 2:30 に ボスが あらわれる</div>
      <div class="svd-grid">${cards}</div>
      <div class="sv-rules">
        <div><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> いどう (攻撃は自動)　🎁 宝箱で 武器を入手・強化 (最大 ${SV_MAX_WEAPONS} こ)</div>
        <div>💎 ジェム = 経験値　❤️ = 回復　さいしょの武器: ${w.icon} ${w.name}</div>
      </div>
      <div class="ov-key"><kbd>1</kbd>〜<kbd>4</kbd> で難易度　<kbd>Space</kbd> でスタート</div></div>`);
    document.querySelectorAll('.svd-card').forEach(b => { b.onclick = () => this.pickDiff(b.dataset.k); });
  },

  pickDiff(k) {
    this.diffKey = k;
    Save.data.settings.svDiff = k;
    Save.save();
    SFX.select();
    this.showReady();
  },

  leave() {
    this.state = 'off';
    cancelAnimationFrame(this.raf);
    removeEventListener('resize', this._onResize);
  },

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, this.lim().dpr);
    this.W = innerWidth; this.H = innerHeight;
    this.cv.width = this.W * dpr; this.cv.height = this.H * dpr;
    this.cv.style.width = this.W + 'px'; this.cv.style.height = this.H + 'px';
    this.dpr = dpr;
    // 画面のふちの暗さ (毎フレーム作らないよう、ここで作っておく)
    this.vignettes = {};
    for (const [k, col] of [['n', 'rgba(0,0,30,.45)'], ['b', 'rgba(60,0,0,.5)']]) {
      const c = document.createElement('canvas');
      c.width = Math.ceil(this.W / 4); c.height = Math.ceil(this.H / 4);
      const g = c.getContext('2d');
      const gr = g.createRadialGradient(c.width / 2, c.height / 2, Math.min(c.width, c.height) * 0.35, c.width / 2, c.height / 2, Math.max(c.width, c.height) * 0.75);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, col);
      g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
      this.vignettes[k] = c;
    }
  },

  overlay(html) {
    const o = $('#sv-overlay');
    o.innerHTML = html || '';
    o.classList.toggle('show', !!html);
  },

  // 草原のタイル模様
  makeGround() {
    const c = document.createElement('canvas');
    c.width = c.height = 192;
    const g = c.getContext('2d');
    g.fillStyle = '#6cbf46'; g.fillRect(0, 0, 192, 192);
    const rnd = seededRnd(3);
    g.fillStyle = '#68ba43';
    g.fillRect(0, 0, 96, 96); g.fillRect(96, 96, 96, 96);
    for (let i = 0; i < 40; i++) {
      const x = rnd() * 192, y = rnd() * 192;
      g.strokeStyle = rnd() > 0.5 ? '#4f9a2f' : '#8fd65f';
      g.lineWidth = 2;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x - 2, y - 7); g.moveTo(x + 3, y); g.lineTo(x + 4, y - 6); g.stroke();
    }
    const cols = ['#fff', '#ff8fab', '#ffd43b'];
    for (let i = 0; i < 6; i++) {
      const x = rnd() * 192, y = rnd() * 192;
      g.fillStyle = cols[i % 3];
      for (let a = 0; a < 5; a++) { g.beginPath(); g.arc(x + Math.cos(a * 1.256) * 3, y + Math.sin(a * 1.256) * 3, 2, 0, 7); g.fill(); }
    }
    return this.ctx.createPattern(c, 'repeat');
  },

  // ---------------- メインループ ----------------
  tick(now) {
    if (this.state === 'off') return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (this.state === 'run') this.update(dt);
    // 止まっている画面 (えらぶ・ポーズ) では描き直さない
    if (this.state === 'run' || this.state !== this._drawnState) {
      this.draw(now / 1000);
      this._drawnState = this.state;
    }
    this.raf = requestAnimationFrame(t => this.tick(t));
  },

  update(dt) {
    this.time += dt;
    const p = this.p;

    // 移動
    let mx = 0, my = 0;
    for (const k of this.held) {
      const d = KEY_DIR[k];
      if (d === 'up') my -= 1; if (d === 'down') my += 1;
      if (d === 'left') mx -= 1; if (d === 'right') mx += 1;
    }
    const len = Math.hypot(mx, my);
    p.moving = len > 0;
    if (len > 0) {
      mx /= len; my /= len;
      const sp = p.speed * (p.slowUntil > this.time ? 0.55 : 1);
      p.x += mx * sp * dt; p.y += my * sp * dt;
      p.dir = { x: mx, y: my };
      if (mx) p.face = mx > 0 ? 1 : -1;
      if (Math.random() < 0.3) this.parts.push({ x: p.x + (Math.random() - 0.5) * 20, y: p.y + 14, vx: -mx * 30, vy: -10, life: 0.4, max: 0.4, color: 'rgba(255,255,255,.6)', size: 3 });
    }
    if (p.inv > 0) p.inv -= dt;
    if (this.ch.id === 'purun' || this.ch.id === 'moririn') {
      p.regenT += dt;
      const regenIv = this.ch.id === 'moririn' ? [2.6, 2.3, 2.0, 1.7, 1.4] : [3.5, 3.2, 2.9, 2.6, 2.3];
      if (p.regenT >= regenIv[this.ch.stage]) { p.regenT = 0; if (p.hp < p.max) p.hp = Math.min(p.max, p.hp + 1); }
    }

    // イベント
    if (!this.bossSpawned && this.time >= SV_BOSS_AT) this.spawnBoss();
    for (const t of [60, 110]) {
      if (!this.events[t] && this.time >= t) { this.events[t] = true; this.surround(this.diff().tiers[t === 60 ? 1 : 2][0]); }
    }

    // 敵の出現
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = Math.max(0.4, 1.4 - this.time / 200) * (this.boss ? 1.8 : 1) / this.diff().spawn;
      const n = 1 + Math.floor(this.time / 90);
      for (let i = 0; i < n && this.enemies.length < this.lim().enemies; i++) this.spawn(this.pickType());
    }

    this.updateWeapons(dt);
    this.updateEnemies(dt);
    this.updateShots(dt);
    this.updatePickups(dt);
    this.updateEffects(dt);

    this.hudT -= dt;
    if (this.hudT <= 0) { this.hudT = 0.1; this.updateHud(); }
    if (p.hp <= 0) this.end(false);
  },

  pickType() {
    const t = this.time;
    const tier = this.diff().tiers[t < 40 ? 0 : t < 80 ? 1 : t < 120 ? 2 : 3];
    return tier[Math.floor(Math.random() * tier.length)];
  },

  // 敵の HP の倍率 (時間・難易度・キャラのレベルで決まる)
  hpScale() { return (1 + this.time / 140) * 0.9 * this.diff().hp * this.lvScale().hp; },
  // キャラのレベルが高いほど 敵も少し強くなる (レベルだけで簡単になりすぎないように)
  lvScale() { const L = this.ch.L; return { hp: 1 + (L - 1) / SV_LV_HP, dmg: 1 + (L - 1) / SV_LV_DMG }; },

  makeEnemy(type, x, y) {
    const b = SV_ENEMIES[type];
    const hp = b.hp * this.hpScale();
    return { type, x, y, hp: Math.round(hp * SV_ENEMY_HP_BOOST), max: Math.round(hp * SV_ENEMY_HP_BOOST), spd: b.spd * (0.9 + Math.random() * 0.2), dmg: b.dmg * this.diff().dmg * this.lvScale().dmg, r: b.r, flash: 0, kbx: 0, kby: 0, hitCd: {}, slowUntil: 0 };
  },

  spawn(type) {
    const a = Math.random() * Math.PI * 2;
    const d = Math.hypot(this.W, this.H) / 2 + 60;
    this.enemies.push(this.makeEnemy(type, this.p.x + Math.cos(a) * d, this.p.y + Math.sin(a) * d));
  },

  // ぐるっと囲まれるイベント
  surround(type) {
    const n = Math.min(14, this.lim().enemies - this.enemies.length);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      this.enemies.push(this.makeEnemy(type, this.p.x + Math.cos(a) * 480, this.p.y + Math.sin(a) * 480));
    }
    this.banner('かこまれた！');
  },

  spawnBoss() {
    this.bossSpawned = true;
    const id = this.diff().boss;
    const b = this.makeEnemy(id, this.p.x + 520, this.p.y - 120);
    b.hp = b.max = Math.round(SV_ENEMIES[id].hp * this.lvScale().hp * this.diff().bossHp);
    b.dmg = SV_ENEMIES[id].dmg * this.diff().dmg * this.lvScale().dmg;
    b.boss = true; b.atkT = 3; b.dashT = 8; b.dash = 0; b.warn = 0; b.sumT = 6;
    this.boss = b;
    this.enemies.push(b);
    $('#sv-boss span').textContent = SV_BOSS[id].name;
    $('#sv-boss').classList.add('show');
    SFX.thunder();
    this.shakeAmt = 16;
    cutin('ボス しゅつげん！', `${SV_BOSS[id].name}が あらわれた`, SV_BOSS[id].color, enemySVG(id));
  },

  banner(text) {
    floatText(this.W / 2, this.H / 2 - 120, text, 'sv-banner');
    SFX.charge();
  },

  // ---------------- 武器 ----------------
  nearest(n, maxDist = 700) {
    const p = this.p;
    return this.enemies
      .map(e => ({ e, d: Math.hypot(e.x - p.x, e.y - p.y) }))
      .filter(o => o.d < maxDist)
      .sort((a, b) => a.d - b.d).slice(0, n).map(o => o.e);
  },

  randomNear(range) {
    const p = this.p;
    const c = this.enemies.filter(e => Math.hypot(e.x - p.x, e.y - p.y) < range);
    return c.length ? c[Math.floor(Math.random() * c.length)] : null;
  },

  updateWeapons(dt) {
    const p = this.p;
    for (const [id, w] of Object.entries(this.weapons)) {
      const s = svWeaponStat(id, w.lv);
      if (id === 'rock') { this.rockAngle += s.spin * dt; continue; }
      w.t -= dt;
      if (w.t > 0) continue;
      w.t = s.cd * this.cdMult;
      const fired = this.fire(id, s, p);
      if (!fired) w.t = 0.2;
    }
    // 岩はいつもまわりにある
    if (this.weapons.rock) {
      const s = svWeaponStat('rock', this.weapons.rock.lv);
      for (let i = 0; i < s.count; i++) {
        const a = this.rockAngle + (i / s.count) * Math.PI * 2;
        const rx = p.x + Math.cos(a) * s.radius, ry = p.y + Math.sin(a) * s.radius;
        if (Math.random() < 0.25) this.parts.push({ x: rx, y: ry, vx: 0, vy: 0, life: 0.3, max: 0.3, color: '#c9a27a', size: 4 });
        for (const e of this.enemies) {
          if (Math.hypot(e.x - rx, e.y - ry) < 16 + e.r && !(e.hitCd.rock > this.time)) {
            e.hitCd.rock = this.time + 0.5;
            this.hurt(e, s.dmg, Math.cos(a) * 200, Math.sin(a) * 200, '#c9a27a');
          }
        }
      }
    }
  },

  // 武器ごとの発射。敵がいなくて撃てなかったら false
  fire(id, s, p) {
    if (id === 'water') {
      const targets = this.nearest(s.count);
      if (!targets.length) return false;
      for (let i = 0; i < s.count; i++) {
        const e = targets[i % targets.length];
        const a = Math.atan2(e.y - p.y, e.x - p.x) + (i >= targets.length ? (Math.random() - 0.5) * 0.4 : 0);
        this.shots.push({ kind: 'water', x: p.x, y: p.y, vx: Math.cos(a) * s.speed, vy: Math.sin(a) * s.speed, r: 10, dmg: s.dmg, pierce: s.pierce, life: 1.4, hit: new Set() });
      }
      SFX.tone(700, 0.05, { type: 'sine', vol: 0.03, slide: 400 });
      return true;
    }
    if (id === 'thunder') {
      if (!this.randomNear(430)) return false;
      for (let i = 0; i < s.strikes; i++) {
        const e = this.randomNear(430);
        if (!e) break;
        this.fx.push({ kind: 'bolt', x: e.x, y: e.y, life: 0.3, max: 0.3, pts: this.boltPts(e.x, e.y), branch: this.boltPts(e.x + 30, e.y - 80, 4) });
        this.fx.push({ kind: 'ring', x: e.x, y: e.y, r0: 10, r1: s.area * 1.4, life: 0.35, max: 0.35, color: '#fff27a', width: 6 });
        this.decals.push({ x: e.x, y: e.y, r: s.area * 0.7, life: 2, max: 2, color: 'rgba(40,30,0,' });
        for (const o of this.enemies) if (Math.hypot(o.x - e.x, o.y - e.y) < s.area + o.r) this.hurt(o, s.dmg, 0, 0, '#fff27a');
        this.burst(e.x, e.y, ['#fff27a', '#fff', '#ffd43b'], 16, 260, true);
      }
      this.flash = Math.max(this.flash, 0.12);
      this.shakeAmt = Math.max(this.shakeAmt, 4);
      SFX.noise(0.15, { vol: 0.08, filter: 3000 });
      return true;
    }
    if (id === 'fire') {
      this.fx.push({ kind: 'firering', x: p.x, y: p.y, r: s.radius, life: 0.5, max: 0.5 });
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 2;
        this.parts.push({ x: p.x + Math.cos(a) * 30, y: p.y + Math.sin(a) * 30, vx: Math.cos(a) * s.radius * 2.2, vy: Math.sin(a) * s.radius * 2.2, life: 0.45, max: 0.45, color: i % 2 ? '#ff7a1a' : '#ffd43b', size: 6, glow: true });
      }
      for (const e of this.enemies) {
        const d = Math.hypot(e.x - p.x, e.y - p.y);
        if (d < s.radius + e.r) this.hurt(e, s.dmg, (e.x - p.x) / (d || 1) * 280, (e.y - p.y) / (d || 1) * 280, '#ff7a1a');
      }
      SFX.noise(0.25, { vol: 0.07, filter: 900 });
      return true;
    }
    if (id === 'boomerang') {
      for (let i = 0; i < s.count; i++) {
        const a = Math.atan2(p.dir.y, p.dir.x) + (i - (s.count - 1) / 2) * 0.5;
        this.shots.push({ kind: 'boomerang', x: p.x, y: p.y, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, r: 15, dmg: s.dmg, pierce: Infinity, life: 2.2, age: 0, spin: 0, hitCd: new Map(), trail: [] });
      }
      return true;
    }
    if (id === 'star') {
      if (!this.enemies.length) return false;
      for (let i = 0; i < s.count; i++) {
        const a = (i / s.count) * Math.PI * 2 + Math.random();
        this.shots.push({ kind: 'star', x: p.x, y: p.y, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, r: 11, dmg: s.dmg, pierce: 1, life: 3, spin: 0, hit: new Set(), target: null });
      }
      SFX.tone(1400, 0.08, { type: 'triangle', vol: 0.03, slide: 2000 });
      return true;
    }
    if (id === 'ice') {
      for (let i = 0; i < s.count; i++) {
        const a = (i / s.count) * Math.PI * 2;
        this.shots.push({ kind: 'ice', x: p.x, y: p.y, vx: Math.cos(a) * 430, vy: Math.sin(a) * 430, r: 9, dmg: s.dmg, pierce: 2, life: 0.9, hit: new Set(), slow: s.slow, ang: a });
      }
      this.fx.push({ kind: 'ring', x: p.x, y: p.y, r0: 20, r1: 120, life: 0.35, max: 0.35, color: '#d0ebff', width: 8 });
      SFX.tone(2200, 0.15, { type: 'sine', vol: 0.03, slide: 900 });
      return true;
    }
    if (id === 'laser') {
      if (!this.enemies.length) return false;
      // 進む方向。止まっているときは いちばん近い敵の方向
      let ang = Math.atan2(p.dir.y, p.dir.x);
      if (!p.moving) { const t = this.nearest(1)[0]; if (t) ang = Math.atan2(t.y - p.y, t.x - p.x); }
      this.fx.push({ kind: 'laser', x: p.x, y: p.y, ang, len: s.len, width: s.width, life: 0.4, max: 0.4 });
      const cx = Math.cos(ang), cy = Math.sin(ang);
      for (const e of this.enemies) {
        const dx = e.x - p.x, dy = e.y - p.y;
        const along = dx * cx + dy * cy;
        const side = Math.abs(-dx * cy + dy * cx);
        if (along > 0 && along < s.len && side < s.width / 2 + e.r) this.hurt(e, s.dmg, cx * 160, cy * 160, '#ff5dd6');
      }
      for (let i = 0; i < 30; i++) {
        const d = Math.random() * s.len;
        this.parts.push({ x: p.x + cx * d, y: p.y + cy * d, vx: (Math.random() - 0.5) * 120, vy: (Math.random() - 0.5) * 120, life: 0.4, max: 0.4, color: i % 2 ? '#ff5dd6' : '#fff', size: 4, glow: true });
      }
      this.shakeAmt = Math.max(this.shakeAmt, 6);
      SFX.tone(300, 0.35, { type: 'sawtooth', vol: 0.05, slide: 1200 });
      return true;
    }
    if (id === 'meteor') {
      if (!this.randomNear(520)) return false;
      for (let i = 0; i < s.count; i++) {
        const e = this.randomNear(520);
        if (!e) break;
        this.fx.push({ kind: 'meteor', x: e.x + (Math.random() - 0.5) * 40, y: e.y + (Math.random() - 0.5) * 40, r: s.radius, dmg: s.dmg, life: 0.8 + i * 0.2, max: 0.8 + i * 0.2 });
      }
      return true;
    }
    if (id === 'tornado') {
      for (let i = 0; i < s.count; i++) {
        const a = Math.random() * Math.PI * 2;
        this.shots.push({ kind: 'tornado', x: p.x, y: p.y, vx: Math.cos(a) * 110, vy: Math.sin(a) * 110, r: s.radius, dmg: s.dmg, pierce: Infinity, life: s.life, max: s.life, spin: 0, tickT: 0 });
      }
      SFX.noise(0.5, { vol: 0.05, filter: 1500 });
      return true;
    }
    return false;
  },

  // メテオが落ちた
  explode(f) {
    this.fx.push({ kind: 'ring', x: f.x, y: f.y, r0: 10, r1: f.r * 1.5, life: 0.5, max: 0.5, color: '#ffd43b', width: 14 });
    this.fx.push({ kind: 'ring', x: f.x, y: f.y, r0: 10, r1: f.r, life: 0.35, max: 0.35, color: '#fff', width: 8 });
    this.fx.push({ kind: 'boom', x: f.x, y: f.y, r: f.r, life: 0.35, max: 0.35 });
    this.decals.push({ x: f.x, y: f.y, r: f.r * 0.8, life: 3, max: 3, color: 'rgba(30,15,5,' });
    this.burst(f.x, f.y, ['#ff6a00', '#ffd43b', '#fff', '#6b3e1e'], 40, 420, true);
    for (const e of this.enemies) {
      const d = Math.hypot(e.x - f.x, e.y - f.y);
      if (d < f.r + e.r) this.hurt(e, f.dmg, (e.x - f.x) / (d || 1) * 380, (e.y - f.y) / (d || 1) * 380, '#ff6a00');
    }
    this.shakeAmt = Math.max(this.shakeAmt, 14);
    this.flash = Math.max(this.flash, 0.18);
    SFX.noise(0.5, { vol: 0.16, filter: 700 });
    SFX.tone(80, 0.4, { type: 'sawtooth', vol: 0.06, slide: 40 });
  },

  boltPts(x, y, n = 8) {
    const pts = [];
    for (let i = 0; i <= n; i++) pts.push({ x: x + (i === n ? 0 : (Math.random() - 0.5) * 34), y: y - (n * 32) + i * 32 });
    return pts;
  },

  hurt(e, base, kbx, kby, color = '#fff') {
    if (e.dead) return;
    // りゅうまる: HP が へると こうげきアップ
    const rage = this.ch.id === 'ryumaru' && this.p.hp / this.p.max < this.ch.trait.rageAt ? this.ch.trait.rageMult : 1;
    const dmg = Math.max(1, Math.round(base * this.dmgMult * rage * (0.9 + Math.random() * 0.2)));
    e.hp -= dmg;
    e.flash = 0.1;
    if (!e.boss) { e.kbx += kbx; e.kby += kby; }
    const big = dmg >= 50;
    this.texts.push({ x: e.x + (Math.random() - 0.5) * 24, y: e.y - e.r, text: dmg, life: 0.7, max: 0.7, color: e.boss || big ? '#ffd23f' : '#fff', size: Math.min(34, 16 + dmg / 6) });
    // ヒットの火花
    for (let i = 0; i < 2; i++) {
      const a = Math.random() * Math.PI * 2;
      this.parts.push({ x: e.x, y: e.y, vx: Math.cos(a) * 180, vy: Math.sin(a) * 180, life: 0.25, max: 0.25, color, size: 3, glow: true });
    }
    if (e.hp <= 0) this.kill(e);
  },

  kill(e) {
    e.dead = true;
    this.kills++;
    const b = SV_ENEMIES[e.type];
    this.burst(e.x, e.y, [b.color, '#fff', '#ffd23f'], e.boss ? 120 : 14, e.boss ? 500 : 220, true);
    this.fx.push({ kind: 'ring', x: e.x, y: e.y, r0: 6, r1: e.r * 2.2, life: 0.3, max: 0.3, color: b.color, width: 5 });
    if (e.boss) { this.shakeAmt = 24; this.flash = 0.5; this.end(true); return; }
    this.pickups.push({ kind: 'gem', x: e.x, y: e.y, val: b.gem, t: 0 });
    if (this.time - (this.lastChest || 0) > 14) {
      // 定期的な宝箱は、自分の近くに落ちてくる
      this.lastChest = this.time;
      const a = Math.random() * Math.PI * 2, d = 160 + Math.random() * 60;
      this.pickups.push({ kind: 'chest', x: this.p.x + Math.cos(a) * d, y: this.p.y + Math.sin(a) * d, t: 0 });
    } else if (Math.random() < (b.chest || 0.004)) {
      this.pickups.push({ kind: 'chest', x: e.x + 10, y: e.y, t: 0 });
    } else if (Math.random() < 0.012) {
      this.pickups.push({ kind: 'heart', x: e.x, y: e.y, t: 0 });
    }
    if (this.kills % 5 === 0) SFX.tone(500, 0.06, { type: 'triangle', vol: 0.03 });
  },

  // ---------------- 敵の動き ----------------
  updateEnemies(dt) {
    const p = this.p;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const dx = p.x - e.x, dy = p.y - e.y;
      const d = Math.hypot(dx, dy) || 1;
      let spd = e.spd * (e.slowUntil > this.time ? 0.4 : 1);
      if (e.boss) this.bossAI(e, dt, dx / d, dy / d);
      if (e.boss && e.dash > 0) spd *= 5;
      if (e.boss && e.warn > 0) spd = 0;
      const vx = e.boss && e.dash > 0 ? e.dvx : dx / d;
      const vy = e.boss && e.dash > 0 ? e.dvy : dy / d;
      e.x += (vx * spd + e.kbx) * dt;
      e.y += (vy * spd + e.kby) * dt;
      e.kbx *= 0.86; e.kby *= 0.86;
      if (e.flash > 0) e.flash -= dt;
      if (e.boss && e.dash > 0 && Math.random() < 0.6) this.parts.push({ x: e.x, y: e.y + 20, vx: 0, vy: 0, life: 0.4, max: 0.4, color: SV_BOSS[e.type].color, size: 10, glow: true });
      // 遠すぎる敵は近くに出しなおす
      if (!e.boss && d > Math.hypot(this.W, this.H) * 0.9) {
        const a = Math.random() * Math.PI * 2, r = Math.hypot(this.W, this.H) / 2 + 40;
        e.x = p.x + Math.cos(a) * r; e.y = p.y + Math.sin(a) * r;
      }
      if (d < e.r + SV_PLAYER_R && p.inv <= 0) this.hitPlayer(e.dmg * (e.boss && e.dash > 0 ? 1.5 : 1));
    }
    // 敵どうしが重なりすぎないようにする
    const list = this.enemies;
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const min = (a.r + b.r) * 0.8;
        if (Math.abs(dx) > min || Math.abs(dy) > min) continue;
        const d = Math.hypot(dx, dy) || 0.01;
        if (d < min) {
          const push = (min - d) / 2;
          const ux = dx / d, uy = dy / d;
          if (!a.boss) { a.x -= ux * push; a.y -= uy * push; }
          if (!b.boss) { b.x += ux * push; b.y += uy * push; }
        }
      }
    }
    this.enemies = this.enemies.filter(e => !e.dead);
  },

  bossAI(b, dt, ux, uy) {
    const cfg = SV_BOSS[b.type];
    if (b.dash > 0) { b.dash -= dt; return; }
    if (b.warn > 0) {
      b.warn -= dt;
      if (b.warn <= 0) { b.dash = 0.6; b.dvx = b.aimx; b.dvy = b.aimy; SFX.hurt(); this.shakeAmt = 10; }
      return;
    }
    b.atkT -= dt; b.dashT -= dt; b.sumT -= dt;
    const enraged = b.hp < b.max / 2;
    if (b.atkT <= 0) {
      b.atkT = enraged ? 2.2 : 3;
      const n = cfg.ring + (enraged ? 4 : 0);
      const off = Math.random() * Math.PI;
      const dmg = 12 * this.diff().dmg * this.lvScale().dmg;
      for (let i = 0; i < n; i++) {
        const a = off + (i / n) * Math.PI * 2;
        this.eshots.push({ x: b.x, y: b.y, vx: Math.cos(a) * cfg.spd, vy: Math.sin(a) * cfg.spd, r: 11, dmg, life: 4, color: cfg.color, core: cfg.core, homing: false });
      }
      const aim = Math.atan2(uy, ux);
      for (let i = 0; i < cfg.aim; i++) {
        const k = (i - (cfg.aim - 1) / 2) * 0.18;
        this.eshots.push({ x: b.x, y: b.y, vx: Math.cos(aim + k) * cfg.spd * 1.45, vy: Math.sin(aim + k) * cfg.spd * 1.45, r: 12, dmg: dmg * 1.2, life: 3, color: cfg.color, core: cfg.core });
      }
      if (cfg.homing) {
        for (const k of [-1, 1]) this.eshots.push({ x: b.x, y: b.y, vx: -uy * k * 150, vy: ux * k * 150, r: 14, dmg: dmg * 1.3, life: 4, color: '#ff006e', core: '#fff', homing: true });
      }
      this.fx.push({ kind: 'ring', x: b.x, y: b.y, r0: 20, r1: 160, life: 0.4, max: 0.4, color: cfg.color, width: 8 });
      SFX.noise(0.3, { vol: 0.1, filter: 700 });
    }
    if (cfg.summon && b.sumT <= 0) {
      b.sumT = enraged ? 6 : 9;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        this.enemies.push(this.makeEnemy(cfg.summon, b.x + Math.cos(a) * 90, b.y + Math.sin(a) * 90));
      }
      this.burst(b.x, b.y, [cfg.color, '#fff'], 30, 300, true);
    }
    if (cfg.dash && b.dashT <= 0) {
      b.dashT = enraged ? 6 : 8;
      b.warn = 0.7; b.aimx = ux; b.aimy = uy;
      this.banner(`${cfg.name}の とっしん！`);
    }
  },

  hitPlayer(dmg, slow = false) {
    const p = this.p;
    let d = dmg * 40 / (40 + this.ch.stats.def);
    if (this.ch.id === 'gotsun') d *= [0.75, 0.72, 0.69, 0.66, 0.63][this.ch.stage];
    d = Math.max(1, Math.round(d));
    p.hp -= d;
    // かげまる: 攻撃をうけたあと 長めに むてき
    p.inv = this.ch.id === 'kagemaru' ? [1.0, 1.1, 1.2, 1.3, 1.4][this.ch.stage] : 0.8;
    if (slow) p.slowUntil = this.time + 1.2;
    this.texts.push({ x: p.x, y: p.y - 40, text: d, life: 0.7, max: 0.7, color: '#ff5d5d', size: 26 });
    this.burst(p.x, p.y, ['#ff5d5d', '#fff'], 12, 200, false);
    this.shakeAmt = Math.max(this.shakeAmt, 8);
    SFX.hurt();
    replayAnim($('#scr-survival'), 'vignette', 500);
  },

  // ---------------- 弾・ひろいもの ----------------
  updateShots(dt) {
    const p = this.p;
    for (const s of this.shots) {
      s.life -= dt;
      if (s.kind === 'boomerang') {
        s.age += dt; s.spin += dt * 18;
        s.trail.push({ x: s.x, y: s.y, a: s.spin }); if (s.trail.length > 6) s.trail.shift();
        if (s.age > 0.45) {
          const dx = p.x - s.x, dy = p.y - s.y, d = Math.hypot(dx, dy) || 1;
          s.vx += dx / d * 1800 * dt; s.vy += dy / d * 1800 * dt;
          const sp = Math.hypot(s.vx, s.vy);
          if (sp > 620) { s.vx *= 620 / sp; s.vy *= 620 / sp; }
          if (d < 24 && s.age > 0.7) s.life = 0;
        }
      }
      if (s.kind === 'star') {
        s.spin += dt * 10;
        if (!s.target || s.target.dead) s.target = this.nearest(1, 900)[0] || null;
        if (s.target) {
          const dx = s.target.x - s.x, dy = s.target.y - s.y, d = Math.hypot(dx, dy) || 1;
          s.vx += dx / d * 2400 * dt; s.vy += dy / d * 2400 * dt;
          const sp = Math.hypot(s.vx, s.vy);
          if (sp > 560) { s.vx *= 560 / sp; s.vy *= 560 / sp; }
        }
        this.parts.push({ x: s.x, y: s.y, vx: 0, vy: 0, life: 0.3, max: 0.3, color: '#ffd43b', size: 4, glow: true });
      }
      if (s.kind === 'water' && Math.random() < 0.5) this.parts.push({ x: s.x, y: s.y, vx: (Math.random() - 0.5) * 40, vy: (Math.random() - 0.5) * 40, life: 0.3, max: 0.3, color: '#b5e3ff', size: 3 });
      if (s.kind === 'tornado') {
        s.spin += dt * 12;
        s.vx += (Math.random() - 0.5) * 300 * dt; s.vy += (Math.random() - 0.5) * 300 * dt;
        s.tickT -= dt;
        // まわりの敵を 中心へ すいよせる
        for (const e of this.enemies) {
          if (e.boss) continue;
          const dx = s.x - e.x, dy = s.y - e.y, d = Math.hypot(dx, dy);
          if (d < s.r * 2.2 && d > 4) { e.x += dx / d * 120 * dt; e.y += dy / d * 120 * dt; }
        }
        if (s.tickT <= 0) {
          s.tickT = 0.25;
          for (const e of this.enemies) if (Math.hypot(e.x - s.x, e.y - s.y) < s.r + e.r) this.hurt(e, s.dmg, 0, 0, '#96f2d7');
        }
        if (Math.random() < 0.6) {
          const a = Math.random() * Math.PI * 2;
          this.parts.push({ x: s.x + Math.cos(a) * s.r, y: s.y + Math.sin(a) * s.r * 0.5, vx: -Math.sin(a) * 200, vy: -60, life: 0.4, max: 0.4, color: '#c3fae8', size: 3 });
        }
      }
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.kind === 'tornado') continue;
      for (const e of this.enemies) {
        if (e.dead || s.life <= 0) continue;
        if (Math.hypot(e.x - s.x, e.y - s.y) > e.r + s.r) continue;
        if (s.kind === 'boomerang') {
          if ((s.hitCd.get(e) || 0) > this.time) continue;
          s.hitCd.set(e, this.time + 0.35);
          this.hurt(e, s.dmg, s.vx * 0.3, s.vy * 0.3, '#c38bff');
        } else {
          if (s.hit.has(e)) continue;
          s.hit.add(e);
          const col = { water: '#4fb3ff', star: '#ffd43b', ice: '#a5d8ff' }[s.kind];
          this.hurt(e, s.dmg, s.vx * 0.25, s.vy * 0.25, col);
          if (s.kind === 'ice') e.slowUntil = this.time + s.slow;
          if (s.kind === 'water') this.fx.push({ kind: 'ring', x: s.x, y: s.y, r0: 4, r1: 30, life: 0.25, max: 0.25, color: '#b5e3ff', width: 4 });
          if (s.kind === 'star') this.burst(s.x, s.y, ['#ffd43b', '#fff'], 8, 200, true);
          if (--s.pierce <= 0) s.life = 0;
        }
      }
    }
    this.shots = this.shots.filter(s => s.life > 0);

    for (const s of this.eshots) {
      s.life -= dt;
      if (s.homing) {
        const dx = p.x - s.x, dy = p.y - s.y, d = Math.hypot(dx, dy) || 1;
        s.vx += dx / d * 300 * dt; s.vy += dy / d * 300 * dt;
        const sp = Math.hypot(s.vx, s.vy); if (sp > 230) { s.vx *= 230 / sp; s.vy *= 230 / sp; }
      }
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (Math.random() < 0.3) this.parts.push({ x: s.x, y: s.y, vx: 0, vy: -20, life: 0.3, max: 0.3, color: s.color, size: 5, glow: true });
      if (p.inv <= 0 && Math.hypot(p.x - s.x, p.y - s.y) < s.r + SV_PLAYER_R - 4) {
        s.life = 0;
        this.hitPlayer(s.dmg, this.boss && SV_BOSS[this.boss.type].slow);
      }
    }
    this.eshots = this.eshots.filter(s => s.life > 0);
  },

  updatePickups(dt) {
    const p = this.p;
    for (const it of this.pickups) {
      it.t += dt;
      const dx = p.x - it.x, dy = p.y - it.y, d = Math.hypot(dx, dy);
      const magnet = it.kind === 'gem' ? 130 : 90;
      if (d < magnet) { it.x += dx / d * 420 * dt; it.y += dy / d * 420 * dt; }
      if (d < 26) {
        it.got = true;
        if (it.kind === 'gem') { this.gems += it.val; SFX.tone(1300 + Math.random() * 300, 0.04, { type: 'sine', vol: 0.03 }); }
        if (it.kind === 'heart') {
          const h = Math.round(p.max * 0.12);
          p.hp = Math.min(p.max, p.hp + h);
          this.texts.push({ x: p.x, y: p.y - 44, text: '+' + h, life: 0.8, max: 0.8, color: '#6dff8a', size: 24 });
          this.fx.push({ kind: 'ring', x: p.x, y: p.y, r0: 10, r1: 80, life: 0.4, max: 0.4, color: '#6dff8a', width: 6 });
          SFX.heal();
        }
        if (it.kind === 'chest') this.openChest();
      }
    }
    this.pickups = this.pickups.filter(it => !it.got);
  },

  updateEffects(dt) {
    for (const q of this.parts) { q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.93; q.vy *= 0.93; }
    this.parts = this.parts.filter(q => q.life > 0);
    const lim = this.lim();
    if (this.parts.length > lim.parts) this.parts.splice(0, this.parts.length - lim.parts);
    if (this.texts.length > lim.texts) this.texts.splice(0, this.texts.length - lim.texts);
    for (const t of this.texts) { t.life -= dt; t.y -= 44 * dt; }
    this.texts = this.texts.filter(t => t.life > 0);
    for (const f of this.fx) {
      f.life -= dt;
      if (f.kind === 'meteor' && f.life <= 0 && !f.done) { f.done = true; this.explode(f); }
    }
    this.fx = this.fx.filter(f => f.life > 0);
    for (const d of this.decals) d.life -= dt;
    this.decals = this.decals.filter(d => d.life > 0);
    this.shakeAmt *= 0.86;
    if (this.shakeAmt < 0.3) this.shakeAmt = 0;
    this.flash = Math.max(0, this.flash - dt * 1.5);
  },

  burst(x, y, colors, n, speed, glow) {
    if (Save.data.settings.lite) n = Math.ceil(n / 2);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = speed * (0.3 + Math.random() * 0.7);
      this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5, max: 0.5, color: colors[i % colors.length], size: 3 + Math.random() * 3, glow });
    }
  },

  // ---------------- 宝箱: 3 つから 1 つえらぶ ----------------
  openChest() {
    const owned = Object.keys(this.weapons);
    const canNew = owned.length < SV_MAX_WEAPONS;
    const cands = Object.keys(SV_WEAPONS).filter(id => this.weapons[id] ? this.weapons[id].lv < SV_MAX_LV : canNew);
    for (let i = cands.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cands[i], cands[j]] = [cands[j], cands[i]]; }
    this.choices = cands.slice(0, 3);
    if (!this.choices.length) this.choices = ['heal'];
    this.state = 'choice';
    this.held.clear();
    SFX.levelup();
    const cards = this.choices.map((id, i) => {
      if (id === 'heal') return `<button class="sv-choice" data-i="${i}"><span class="mc-key">${i + 1}</span><div class="svc-icon">❤️</div><div class="svc-name">かいふく</div><div class="svc-desc">武器はぜんぶ MAX！ HP を 40% 回復</div></button>`;
      const w = SV_WEAPONS[id];
      const cur = this.weapons[id];
      const tag = cur ? `Lv.${cur.lv} → <b>Lv.${cur.lv + 1}</b>` : '<b class="new">NEW!</b>';
      return `<button class="sv-choice" data-i="${i}" style="--wc:${w.color}"><span class="mc-key">${i + 1}</span>
        <div class="svc-icon">${w.icon}</div><div class="svc-name">${w.name}</div><div class="svc-tag">${tag}</div><div class="svc-desc">${w.desc}</div></button>`;
    }).join('');
    this.overlay(`<div class="ov-box chest"><div class="ov-title">🎁 たからばこ！</div><div class="ov-sub">ほしいものを えらぼう (武器 ${owned.length}/${SV_MAX_WEAPONS})</div>
      <div class="sv-choices">${cards}</div></div>`);
    document.querySelectorAll('.sv-choice').forEach(b => { b.onclick = () => this.choose(+b.dataset.i); });
  },

  choose(i) {
    const id = this.choices[i];
    if (!id) return;
    if (id === 'heal') this.p.hp = Math.min(this.p.max, this.p.hp + this.p.max * 0.4);
    else if (this.weapons[id]) this.weapons[id].lv++;
    else this.weapons[id] = { lv: 1, t: 0.3 };
    this.overlay('');
    this.state = 'run';
    this.last = performance.now();
    SFX.select();
    const col = SV_WEAPONS[id]?.color || '#ff5d8f';
    FX.burst(this.W / 2, this.H / 2, { colors: [col, '#fff', '#ffd23f'], count: 36, shape: 'star', size: 7, speed: 8 });
    this.fx.push({ kind: 'ring', x: this.p.x, y: this.p.y, r0: 10, r1: 160, life: 0.6, max: 0.6, color: col, width: 10 });
    this.flash = 0.25;
    if (id !== 'heal') floatText(this.W / 2, this.H / 2 - 70, `${SV_WEAPONS[id].name} Lv.${this.weapons[id].lv}`, 'levelup');
    this.updateHud();
  },

  // ---------------- 描画 ----------------
  draw(clock) {
    const ctx = this.ctx, p = this.p, W = this.W, H = this.H;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.save();
    const sx = (Math.random() - 0.5) * this.shakeAmt, sy = (Math.random() - 0.5) * this.shakeAmt;
    ctx.translate(Math.round(W / 2 - p.x + sx), Math.round(H / 2 - p.y + sy));
    ctx.fillStyle = this.pattern;
    ctx.fillRect(p.x - W / 2 - 20, p.y - H / 2 - 20, W + 40, H + 40);

    const inView = (x, y, m = 120) => Math.abs(x - p.x) < W / 2 + m && Math.abs(y - p.y) < H / 2 + m;

    // こげあと
    for (const d of this.decals) {
      ctx.fillStyle = d.color + (0.35 * d.life / d.max) + ')';
      ctx.beginPath(); ctx.ellipse(d.x, d.y, d.r, d.r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
    }

    // メテオの予告
    for (const f of this.fx) {
      if (f.kind !== 'meteor') continue;
      const k = 1 - f.life / f.max;
      ctx.strokeStyle = `rgba(255,80,0,${0.4 + k * 0.5})`; ctx.lineWidth = 3;
      ctx.setLineDash([10, 8]);
      ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r, f.r * 0.55, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = `rgba(255,80,0,${k * 0.25})`;
      ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * k, f.r * 0.55 * k, 0, 0, Math.PI * 2); ctx.fill();
    }

    // ひろいもの
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const it of this.pickups) {
      if (!inView(it.x, it.y)) continue;
      const bob = Math.sin(clock * 5 + it.x) * 3;
      if (it.kind === 'gem') {
        ctx.fillStyle = it.val >= 5 ? '#ff5d8f' : it.val >= 2 ? '#4fb3ff' : '#6dff8a';
        ctx.beginPath(); ctx.moveTo(it.x, it.y - 8 + bob); ctx.lineTo(it.x + 6, it.y + bob); ctx.lineTo(it.x, it.y + 8 + bob); ctx.lineTo(it.x - 6, it.y + bob); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
      } else {
        if (it.kind === 'chest') this.drawGlow(ctx, 'rgba(255,220,80,.6)', it.x, it.y, 46);
        ctx.font = it.kind === 'chest' ? '34px sans-serif' : '24px sans-serif';
        ctx.fillText(it.kind === 'chest' ? '🎁' : '❤️', it.x, it.y + bob);
      }
    }

    // ほのおのわ
    for (const f of this.fx) {
      if (f.kind !== 'firering') continue;
      const k = f.life / f.max;
      const r = f.r * (1.1 - k * 0.7);
      const g = ctx.createRadialGradient(p.x, p.y, r * 0.5, p.x, p.y, r);
      g.addColorStop(0, 'rgba(255,120,20,0)'); g.addColorStop(0.8, `rgba(255,140,30,${0.35 * k})`); g.addColorStop(1, `rgba(255,220,80,${0.8 * k})`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
    }

    // 敵とプレイヤーを y 順に描く
    const actors = this.enemies.filter(e => inView(e.x, e.y, 200));
    actors.push({ player: true, y: p.y, x: p.x });
    actors.sort((a, b) => a.y - b.y);
    for (const a of actors) {
      if (a.player) { this.drawPlayer(ctx, clock); continue; }
      const b = SV_ENEMIES[a.type];
      const sp = this.sprites[a.type];
      if (!sp) continue;
      const w = sp.w, h = sp.h;
      const bob = Math.sin(clock * 6 + a.x * 0.1) * 0.05;
      ctx.save();
      ctx.translate(a.x, a.y);
      if (a.boss && a.warn > 0) {
        ctx.strokeStyle = 'rgba(255,60,60,.55)'; ctx.lineWidth = 60; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(a.aimx * 650, a.aimy * 650); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(0,0,0,.18)';
      ctx.beginPath(); ctx.ellipse(0, a.r * 0.7, a.r, a.r * 0.3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.scale(p.x > a.x ? -1 : 1, 1);
      ctx.scale(1 + bob, 1 - bob);
      if (a.boss) this.drawGlow(ctx, a.hp < a.max / 2 ? 'rgba(255,48,48,.55)' : 'rgba(255,255,255,.3)', 0, -h * 0.12, w * 0.6);
      if (b.alpha) ctx.globalAlpha = b.alpha;
      const img = a.flash > 0 ? sp.flash : a.slowUntil > this.time ? sp.slow : sp.c;
      ctx.drawImage(img, -w / 2, -h * 0.62, w, h);
      ctx.restore();
      if (a.slowUntil > this.time) {
        ctx.strokeStyle = 'rgba(165,216,255,.8)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r + 4, 0, Math.PI * 2); ctx.stroke();
      }
      if (!a.boss && a.hp < a.max) {
        ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(a.x - 16, a.y + a.r + 4, 32, 4);
        ctx.fillStyle = '#ff5d8f'; ctx.fillRect(a.x - 16, a.y + a.r + 4, 32 * Math.max(0, a.hp / a.max), 4);
      }
    }

    // ここから光るもの (加算合成で はでに)
    ctx.globalCompositeOperation = 'lighter';

    for (const s of this.shots) this.drawShot(ctx, s);

    // 岩
    ctx.globalCompositeOperation = 'source-over';
    if (this.weapons.rock) {
      const s = svWeaponStat('rock', this.weapons.rock.lv);
      for (let i = 0; i < s.count; i++) {
        const a = this.rockAngle + (i / s.count) * Math.PI * 2;
        const rx = p.x + Math.cos(a) * s.radius, ry = p.y + Math.sin(a) * s.radius;
        ctx.save(); ctx.translate(rx, ry); ctx.rotate(a * 2);
        ctx.fillStyle = '#9c7a57'; ctx.strokeStyle = '#5e4630'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-15, 4); ctx.lineTo(-9, -12); ctx.lineTo(7, -14); ctx.lineTo(16, -2); ctx.lineTo(10, 12); ctx.lineTo(-8, 13); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#c9a27a'; ctx.beginPath(); ctx.arc(-3, -5, 4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }
    ctx.globalCompositeOperation = 'lighter';

    // 敵の弾
    for (const s of this.eshots) {
      this.drawGlow(ctx, s.color, s.x, s.y, s.r * 2);
      ctx.fillStyle = s.core; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 0.5, 0, Math.PI * 2); ctx.fill();
    }

    // エフェクト
    for (const f of this.fx) {
      const k = f.life / f.max;
      if (f.kind === 'ring') {
        const r = f.r0 + (f.r1 - f.r0) * (1 - k * k);
        ctx.globalAlpha = k;
        ctx.strokeStyle = f.color; ctx.lineWidth = f.width * k + 1;
        ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (f.kind === 'bolt') {
        ctx.globalAlpha = k;
        for (const [w, c] of [[14, 'rgba(255,240,120,.35)'], [7, '#fff27a'], [3, '#fff']]) {
          ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineJoin = 'round';
          ctx.beginPath(); f.pts.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.stroke();
          ctx.lineWidth = w * 0.5;
          ctx.beginPath(); f.branch.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.stroke();
        }
        this.drawGlow(ctx, 'rgba(255,255,200,.8)', f.x, f.y, 60);
        ctx.globalAlpha = 1;
      }
      if (f.kind === 'laser') {
        ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.ang);
        const w = f.width * (0.4 + k * 0.8);
        for (const [mul, c] of [[2.2, `rgba(255,93,214,${0.25 * k})`], [1.2, `rgba(255,93,214,${0.7 * k})`], [0.45, `rgba(255,255,255,${k})`]]) {
          ctx.fillStyle = c;
          ctx.beginPath(); ctx.moveTo(0, -w * mul / 2); ctx.lineTo(f.len, -w * mul / 3); ctx.lineTo(f.len, w * mul / 3); ctx.lineTo(0, w * mul / 2); ctx.closePath(); ctx.fill();
        }
        const g = ctx.createRadialGradient(0, 0, 2, 0, 0, w * 1.6);
        g.addColorStop(0, `rgba(255,255,255,${k})`); g.addColorStop(1, 'rgba(255,93,214,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, w * 1.6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      if (f.kind === 'meteor') {
        // 空から落ちてくる いんせき
        const t = 1 - k;
        const mx = f.x + (1 - t) * 260, my = f.y - (1 - t) * 520;
        this.drawGlow(ctx, 'rgba(255,140,20,.9)', mx, my, 40);
        ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(mx, my, 12, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,140,40,.5)'; ctx.lineWidth = 22; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + 90, my - 180); ctx.stroke();
      }
      if (f.kind === 'boom') {
        this.drawGlow(ctx, 'rgba(255,212,59,1)', f.x, f.y, f.r * 1.2 * (1.2 - k * 0.4), k);
      }
    }

    // 粒
    for (const q of this.parts) {
      if (!q.glow) continue;
      ctx.globalAlpha = q.life / q.max;
      ctx.fillStyle = q.color;
      ctx.beginPath(); ctx.arc(q.x, q.y, q.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    for (const q of this.parts) {
      if (q.glow) continue;
      ctx.globalAlpha = q.life / q.max;
      ctx.fillStyle = q.color;
      ctx.beginPath(); ctx.arc(q.x, q.y, q.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ダメージ数字
    for (const t of this.texts) {
      const k = t.life / t.max;
      const pop = k > 0.8 ? 1 + (k - 0.8) * 2 : 1;
      ctx.globalAlpha = Math.min(1, k * 2);
      ctx.font = `bold ${Math.round(t.size * pop)}px "DotGothic16", sans-serif`;
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(t.text, t.x, t.y);
      ctx.fillStyle = t.color; ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // 画面の外にある宝箱の方向を矢印で知らせる
    for (const it of this.pickups) {
      if (it.kind !== 'chest' || inView(it.x, it.y, -30)) continue;
      const ang = Math.atan2(it.y - p.y, it.x - p.x);
      const cx = clamp(W / 2 + Math.cos(ang) * (W / 2 - 50), 40, W - 40), cy = clamp(H / 2 + Math.sin(ang) * (H / 2 - 50), 90, H - 40);
      ctx.save(); ctx.translate(cx, cy);
      ctx.font = '26px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🎁', 0, 0);
      ctx.rotate(ang); ctx.fillStyle = '#ffd23f';
      ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(18, -9); ctx.lineTo(18, 9); ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    // 画面のふち・フラッシュ
    ctx.drawImage(this.vignettes[this.boss ? 'b' : 'n'], 0, 0, W, H);
    if (this.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${this.flash})`; ctx.fillRect(0, 0, W, H); }
  },

  drawShot(ctx, s) {
    if (s.kind === 'water') {
      this.drawGlow(ctx, '#4fb3ff', s.x, s.y, s.r * 2);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 0.45, 0, Math.PI * 2); ctx.fill();
    } else if (s.kind === 'boomerang') {
      s.trail.forEach((t, i) => this.drawBoomerang(ctx, t.x, t.y, t.a, (i + 1) / (s.trail.length + 1) * 0.4));
      this.drawBoomerang(ctx, s.x, s.y, s.spin, 1);
    } else if (s.kind === 'star') {
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.spin);
      this.drawGlow(ctx, 'rgba(255,212,59,.6)', 0, 0, s.r * 2);
      ctx.fillStyle = '#ffd43b';
      FX.star(ctx, s.r * 1.4);
      ctx.restore();
    } else if (s.kind === 'ice') {
      ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.translate(s.x, s.y); ctx.rotate(s.ang);
      ctx.fillStyle = 'rgba(208,235,255,.35)'; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#4dabf7'; ctx.lineWidth = 2;
      ctx.fillStyle = '#f1f9ff';
      ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-6, -7); ctx.lineTo(-13, 0); ctx.lineTo(-6, 7); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    } else if (s.kind === 'tornado') {
      const k = Math.min(1, s.life / 0.4, (s.max - s.life) / 0.2 + 0.2);
      ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.translate(s.x, s.y);
      ctx.fillStyle = `rgba(255,255,255,${0.12 * k})`; ctx.beginPath(); ctx.ellipse(0, -30, s.r, s.r * 0.9, 0, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 6; i++) {
        const y = -i * 14, rr = s.r * (0.4 + i * 0.13);
        ctx.strokeStyle = `rgba(230,255,250,${0.8 * k})`; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.ellipse(Math.sin(s.spin + i) * 8, y, rr, rr * 0.3, 0, s.spin + i, s.spin + i + Math.PI * 1.4); ctx.stroke();
      }
      ctx.restore();
    }
  },

  drawBoomerang(ctx, x, y, a, alpha) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#c38bff'; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-15, -11); ctx.lineTo(0, 0); ctx.lineTo(15, -11); ctx.stroke();
    ctx.restore();
  },

  drawPlayer(ctx, clock) {
    const p = this.p;
    const sp0 = this.sprites.player;
    const w = sp0 ? sp0.w : 76, h = sp0 ? sp0.h : 77;
    const sq = p.moving ? Math.sin(clock * 16) * 0.07 : Math.sin(clock * 4) * 0.04;
    ctx.fillStyle = 'rgba(0,0,0,.2)';
    ctx.beginPath(); ctx.ellipse(p.x, p.y + 18, 28, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.inv > 0 && Math.floor(clock * 20) % 2) ctx.globalAlpha = 0.4;
    ctx.scale(p.face * (1 + sq), 1 - sq);
    const sp = this.sprites.player;
    if (sp) ctx.drawImage(p.slowUntil > this.time ? sp.slow : sp.c, -w / 2, -h * 0.66, w, h);
    ctx.restore();
  },

  updateHud() {
    const p = this.p;
    $('#sv-hp').style.width = clamp(p.hp / p.max * 100, 0, 100) + '%';
    $('#sv-hp').classList.toggle('low', p.hp / p.max < 0.3);
    $('#sv-time').textContent = fmtTime(this.time);
    $('#sv-timefill').style.width = clamp(this.time / SV_TOTAL * 100, 0, 100) + '%';
    $('#sv-kills').textContent = this.kills;
    $('#sv-gems').textContent = this.gems;
    $('#sv-diff').textContent = this.diff().name;
    $('#sv-diff').style.color = this.diff().color;
    $('#sv-weapons').innerHTML = Object.entries(this.weapons).map(([id, w]) =>
      `<div class="sv-w" style="--wc:${SV_WEAPONS[id].color}" title="${SV_WEAPONS[id].name}">${SV_WEAPONS[id].icon}<small>${w.lv >= SV_MAX_LV ? 'MAX' : 'Lv' + w.lv}</small></div>`).join('');
    if (this.boss) $('#sv-bosshp').style.width = clamp(this.boss.hp / this.boss.max * 100, 0, 100) + '%';
  },

  // ---------------- 終わり ----------------
  end(won) {
    if (this.state === 'end') return;
    this.state = 'end';
    this.held.clear();
    this.updateHud();
    if (won) {
      SFX.win();
      FX.confetti();
      this.overlay('<div class="count go win">CLEAR!</div>');
    } else {
      SFX.lose();
      this.overlay('<div class="count lose">GAME OVER</div>');
    }
    const d = this.diff();
    const bonus = won ? 300 : 0;
    const timeBonus = Math.floor(this.time);
    const exp = Math.round((this.gems + timeBonus + bonus) * d.exp);
    const key = 'sv-' + this.diffKey;
    const prev = Save.data.best[key];
    const better = !prev || (won && !prev.cleared) || (won === !!prev.cleared && (won ? this.time < prev.time : this.time > prev.time));
    if (better) Save.data.best[key] = { time: Math.floor(this.time), cleared: won };
    const expRes = grantExp(this.ch.id, exp);
    const coins = grantCoins((this.kills / 4 + this.time / 2 + (won ? 150 : 0)) * d.exp);
    setTimeout(() => App.show('result', {
      mode: 'survival', won, time: this.time, kills: this.kills, gems: this.gems, diffName: d.name, diffColor: d.color, boss: d.boss,
      weapons: Object.entries(this.weapons).map(([id, w]) => ({ id, lv: w.lv })), expRes, newBest: better,
      coins, coinNote: `(たおした数 ÷ 4 + 秒 ÷ 2${won ? ' + クリア 150' : ''}) × 難易度 ${d.exp}`,
      expBreakdown: [`(ジェム ${this.gems} + 時間 ${timeBonus}${won ? ` + ボス ${bonus}` : ''}) × 難易度 ${d.exp}`],
    }), 1800);
  },

  // ---------------- 操作 ----------------
  onKey(e) {
    const k = e.key.toLowerCase();
    if (this.state === 'ready') {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= SV_DIFF_KEYS.length) this.pickDiff(SV_DIFF_KEYS[n - 1]);
      if (e.key === ' ') { this.reset(); this.state = 'run'; this.overlay(''); this.last = performance.now(); SFX.go(); }
      if (e.key === 'Escape') App.show('home');
      return;
    }
    if (this.state === 'choice') {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= this.choices.length) this.choose(n - 1);
      return;
    }
    if (this.state === 'pause') {
      if (e.key === 'Escape' || e.key === ' ') { this.state = 'run'; this.overlay(''); this.last = performance.now(); }
      if (e.key === 'Enter') App.show('home');
      return;
    }
    if (this.state !== 'run') return;
    if (e.key === 'Escape') {
      this.state = 'pause';
      this.held.clear();
      this.overlay('<div class="ov-box"><div class="ov-title">ポーズ中</div><div class="ov-key"><kbd>Esc</kbd> で再開　<kbd>Enter</kbd> でホームへ (記録なし)</div></div>');
      return;
    }
    if (KEY_DIR[k]) { this.held.add(k); e.preventDefault(); }
  },

  onKeyUp(e) { this.held.delete(e.key.toLowerCase()); },
  onBlur() { this.held.clear(); },
};
