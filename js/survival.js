// ============================================================
//  サバイバルモード
//  ・WASD / 矢印キーで移動。自分のスライムはいつも画面の真ん中
//  ・まわりから敵がどんどん迫ってくる。武器は自動で攻撃
//  ・敵が落とす宝箱で新しい武器を手に入れたり強化したりできる
//  ・2:30 にボスのドラゴンが登場。たおせばクリア
// ============================================================

const SV_BOSS_AT = 150;   // ボスが出てくる時間(秒)
const SV_TOTAL = 180;     // タイムバーの長さ(秒)
const SV_PLAYER_R = 22;

// 敵の強さ (時間がたつほど HP が増える)
const SV_ENEMIES = {
  bat: { hp: 10, spd: 100, dmg: 4, r: 20, gem: 1, w: 70, vw: 160, vh: 120 },
  mush: { hp: 20, spd: 60, dmg: 6, r: 22, gem: 2, w: 58, vw: 140, vh: 140 },
  ghost: { hp: 18, spd: 78, dmg: 7, r: 22, gem: 2, w: 60, vw: 140, vh: 140, alpha: 0.8 },
  goblin: { hp: 55, spd: 68, dmg: 10, r: 28, gem: 5, w: 76, vw: 150, vh: 150, chest: 0.1 },
  golem: { hp: 150, spd: 44, dmg: 14, r: 38, gem: 10, w: 104, vw: 170, vh: 170, chest: 0.3 },
  dragon: { hp: 2000, spd: 58, dmg: 22, r: 70, gem: 0, w: 230, vw: 200, vh: 170 },
};

// 武器
const SV_WEAPONS = {
  water: { name: 'みずでっぽう', icon: '💧', color: '#4fb3ff', desc: 'いちばん近い敵に水の玉をうつ' },
  thunder: { name: 'サンダー', icon: '⚡', color: '#ffe14d', desc: '近くの敵にかみなりを落とす' },
  rock: { name: 'いわシールド', icon: '🪨', color: '#b08a64', desc: 'まわりを岩がぐるぐる回って守る' },
  fire: { name: 'ほのおのわ', icon: '🔥', color: '#ff7a1a', desc: 'まわりに炎の輪を広げて敵をはじく' },
  boomerang: { name: 'ブーメラン', icon: '🪃', color: '#c38bff', desc: '進む方向に投げると戻ってくる。敵をつらぬく' },
};
const SV_MAX_LV = 5;
const SV_START_WEAPON = { purun: 'water', piriri: 'thunder', gotsun: 'rock' };

function svWeaponStat(id, lv) {
  const i = lv - 1;
  switch (id) {
    case 'water': return { cd: 0.8 - 0.08 * i, count: [1, 2, 2, 3, 3][i], dmg: 14 + 3 * i, pierce: lv >= 4 ? 2 : 1, speed: 500 };
    case 'thunder': return { cd: 1.5 - 0.15 * i, strikes: [2, 2, 3, 3, 4][i], dmg: 26 + 6 * i, area: 55 };
    case 'rock': return { count: [2, 2, 3, 4, 5][i], dmg: 12 + 3 * i, radius: 80 + 6 * i, spin: 3 + 0.3 * lv };
    case 'fire': return { cd: 2.4 - 0.2 * i, radius: 120 + 15 * i, dmg: 16 + 5 * i };
    case 'boomerang': return { cd: 1.6 - 0.15 * i, count: [1, 1, 2, 2, 3][i], dmg: 20 + 5 * i };
  }
  return {};
}

Screens.survival = {
  enter() {
    this.ch = charInfo(Save.data.active);
    const st = this.ch.stats;
    const base = this.ch.def.base;
    this.cv = $('#sv-canvas');
    this.ctx = this.cv.getContext('2d');
    this.resize();
    this._onResize = () => this.resize();
    addEventListener('resize', this._onResize);

    // 画像を用意
    this.imgs = {};
    for (const id of Object.keys(SV_ENEMIES)) this.imgs[id] = svgToImage(enemySVG(id));
    this.imgs.player = svgToImage(slimeSVG(this.ch.id, this.ch.stage));
    this.pattern = this.makeGround();

    // プレイヤー
    const max = st.hp * 3 + 60;
    let speed = 175 * (0.85 + base.spd / 300);
    if (this.ch.id === 'piriri') speed *= 1.15;
    this.p = { x: 0, y: 0, hp: max, max, speed, face: 1, dir: { x: 1, y: 0 }, inv: 0, regenT: 0, moving: false };
    this.dmgMult = 1 + (st.atk - 5) / 60;
    this.weapons = { [SV_START_WEAPON[this.ch.id]]: { lv: 1, t: 0.5 } };
    this.weaponLog = [SV_START_WEAPON[this.ch.id]];

    this.enemies = []; this.shots = []; this.eshots = []; this.pickups = [];
    this.parts = []; this.texts = []; this.fx = [];
    this.time = 0; this.kills = 0; this.gems = 0;
    this.spawnT = 1; this.lastChest = 0; this.events = { 60: false, 110: false };
    this.boss = null; this.bossSpawned = false; this.rockAngle = 0;
    this.held = new Set();
    this.state = 'ready';
    this.hudT = 0;

    $('#sv-name').innerHTML = `${this.ch.name} <small>Lv.${this.ch.L}</small>`;
    $('#sv-boss').classList.remove('show');
    this.updateHud();
    const w = SV_WEAPONS[SV_START_WEAPON[this.ch.id]];
    this.overlay(`<div class="ov-box">
      <div class="ov-title">サバイバルモード</div>
      <div class="ov-sub">まわりから せまってくる敵を たおしながら生きのころう！<br>
      2:30 に ボスが あらわれる。たおせば クリア！</div>
      <div class="sv-rules">
        <div><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> いどう (攻撃は自動)</div>
        <div>🎁 宝箱をひろうと 武器が手に入る・強くなる</div>
        <div>💎 ジェム = もらえる経験値　❤️ ハート = 回復</div>
        <div>さいしょの武器: ${w.icon} ${w.name}</div>
      </div>
      <div class="ov-key"><kbd>Space</kbd> でスタート</div></div>`);
    this.last = performance.now();
    this.raf = requestAnimationFrame(t => this.tick(t));
  },

  leave() {
    this.state = 'off';
    cancelAnimationFrame(this.raf);
    removeEventListener('resize', this._onResize);
  },

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.W = innerWidth; this.H = innerHeight;
    this.cv.width = this.W * dpr; this.cv.height = this.H * dpr;
    this.cv.style.width = this.W + 'px'; this.cv.style.height = this.H + 'px';
    this.dpr = dpr;
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
    let seed = 3;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
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
    this.draw(now / 1000);
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
      p.x += mx * p.speed * dt; p.y += my * p.speed * dt;
      p.dir = { x: mx, y: my };
      if (mx) p.face = mx > 0 ? 1 : -1;
    }
    if (p.inv > 0) p.inv -= dt;
    if (this.ch.id === 'purun') {
      p.regenT += dt;
      if (p.regenT >= 2) { p.regenT = 0; if (p.hp < p.max) p.hp = Math.min(p.max, p.hp + 1); }
    }

    // イベント
    if (!this.bossSpawned && this.time >= SV_BOSS_AT) this.spawnBoss();
    for (const t of [60, 110]) {
      if (!this.events[t] && this.time >= t) { this.events[t] = true; this.surround(t === 60 ? 'bat' : 'mush'); }
    }

    // 敵の出現
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = Math.max(0.3, 1.2 - this.time / 200) * (this.boss ? 1.8 : 1);
      const n = 1 + Math.floor(this.time / 75);
      for (let i = 0; i < n; i++) this.spawn(this.pickType());
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
    const table = t < 40 ? { bat: 70, mush: 30 }
      : t < 80 ? { bat: 40, mush: 30, ghost: 30 }
        : t < 120 ? { bat: 20, mush: 20, ghost: 30, goblin: 30 }
          : { ghost: 25, goblin: 45, golem: 30 };
    let r = Math.random() * 100;
    for (const [k, w] of Object.entries(table)) { r -= w; if (r <= 0) return k; }
    return 'bat';
  },

  hpScale() { return (1 + this.time / 140) * 0.9; },

  makeEnemy(type, x, y) {
    const b = SV_ENEMIES[type];
    const hp = Math.round(b.hp * this.hpScale());
    return { type, x, y, hp, max: hp, spd: b.spd * (0.9 + Math.random() * 0.2), dmg: b.dmg, r: b.r, flash: 0, kbx: 0, kby: 0, hitCd: {} };
  },

  spawn(type) {
    const a = Math.random() * Math.PI * 2;
    const d = Math.hypot(this.W, this.H) / 2 + 60;
    this.enemies.push(this.makeEnemy(type, this.p.x + Math.cos(a) * d, this.p.y + Math.sin(a) * d));
  },

  // ぐるっと囲まれるイベント
  surround(type) {
    const n = 20;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      this.enemies.push(this.makeEnemy(type, this.p.x + Math.cos(a) * 480, this.p.y + Math.sin(a) * 480));
    }
    this.banner('かこまれた！', '#ff5d8f');
  },

  spawnBoss() {
    this.bossSpawned = true;
    const b = this.makeEnemy('dragon', this.p.x + 520, this.p.y - 120);
    b.hp = b.max = Math.round(SV_ENEMIES.dragon.hp * (1 + this.ch.L / 50));
    b.boss = true; b.atkT = 3; b.dashT = 8; b.dash = 0; b.warn = 0;
    this.boss = b;
    this.enemies.push(b);
    $('#sv-boss').classList.add('show');
    SFX.thunder();
    cutin('ボス しゅつげん！', 'ドラゴンが あらわれた', '#ff6a00', enemySVG('dragon'));
  },

  banner(text, color) {
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

  updateWeapons(dt) {
    const p = this.p;
    for (const [id, w] of Object.entries(this.weapons)) {
      const s = svWeaponStat(id, w.lv);
      if (id === 'rock') { this.rockAngle += s.spin * dt; continue; }
      w.t -= dt;
      if (w.t > 0) continue;
      w.t = s.cd;
      if (id === 'water') {
        const targets = this.nearest(s.count);
        if (!targets.length) { w.t = 0.2; continue; }
        for (let i = 0; i < s.count; i++) {
          const e = targets[i % targets.length];
          const a = Math.atan2(e.y - p.y, e.x - p.x) + (i >= targets.length ? (Math.random() - 0.5) * 0.4 : 0);
          this.shots.push({ kind: 'water', x: p.x, y: p.y, vx: Math.cos(a) * s.speed, vy: Math.sin(a) * s.speed, r: 9, dmg: s.dmg, pierce: s.pierce, life: 1.4, hit: new Set() });
        }
        SFX.tone(700, 0.05, { type: 'sine', vol: 0.03, slide: 400 });
      }
      if (id === 'thunder') {
        const cands = this.nearest(12, 420);
        if (!cands.length) { w.t = 0.2; continue; }
        for (let i = 0; i < s.strikes; i++) {
          const e = cands[Math.floor(Math.random() * cands.length)];
          this.fx.push({ kind: 'bolt', x: e.x, y: e.y, life: 0.25, max: 0.25, pts: this.boltPts(e.x, e.y) });
          for (const o of this.enemies) if (Math.hypot(o.x - e.x, o.y - e.y) < s.area + o.r) this.hurt(o, s.dmg, 0, 0);
          this.burst(e.x, e.y, ['#fff27a', '#fff'], 10, 160);
        }
        SFX.noise(0.15, { vol: 0.08, filter: 3000 });
      }
      if (id === 'fire') {
        this.fx.push({ kind: 'ring', x: p.x, y: p.y, r: s.radius, life: 0.45, max: 0.45, color: '#ff7a1a' });
        for (const e of this.enemies) {
          const d = Math.hypot(e.x - p.x, e.y - p.y);
          if (d < s.radius + e.r) this.hurt(e, s.dmg, (e.x - p.x) / (d || 1) * 260, (e.y - p.y) / (d || 1) * 260);
        }
        SFX.noise(0.25, { vol: 0.07, filter: 900 });
      }
      if (id === 'boomerang') {
        for (let i = 0; i < s.count; i++) {
          const a = Math.atan2(p.dir.y, p.dir.x) + (i - (s.count - 1) / 2) * 0.5;
          this.shots.push({ kind: 'boomerang', x: p.x, y: p.y, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, r: 14, dmg: s.dmg, pierce: Infinity, life: 2.2, age: 0, spin: 0, hitCd: new Map() });
        }
      }
    }
    // 岩はいつもまわりにある
    if (this.weapons.rock) {
      const s = svWeaponStat('rock', this.weapons.rock.lv);
      for (let i = 0; i < s.count; i++) {
        const a = this.rockAngle + (i / s.count) * Math.PI * 2;
        const rx = p.x + Math.cos(a) * s.radius, ry = p.y + Math.sin(a) * s.radius;
        for (const e of this.enemies) {
          if (Math.hypot(e.x - rx, e.y - ry) < 16 + e.r && !(e.hitCd.rock > this.time)) {
            e.hitCd.rock = this.time + 0.5;
            this.hurt(e, s.dmg, Math.cos(a) * 200, Math.sin(a) * 200);
          }
        }
      }
    }
  },

  boltPts(x, y) {
    const pts = [];
    for (let i = 0; i <= 8; i++) pts.push({ x: x + (i === 8 ? 0 : (Math.random() - 0.5) * 30), y: y - 260 + i * 32.5 });
    return pts;
  },

  hurt(e, base, kbx, kby) {
    if (e.dead) return;
    const dmg = Math.max(1, Math.round(base * this.dmgMult * (0.9 + Math.random() * 0.2)));
    e.hp -= dmg;
    e.flash = 0.1;
    if (!e.boss) { e.kbx += kbx; e.kby += kby; }
    this.texts.push({ x: e.x + (Math.random() - 0.5) * 20, y: e.y - e.r, text: dmg, life: 0.6, max: 0.6, color: e.boss ? '#ffd23f' : '#fff', size: e.boss ? 26 : 18 });
    if (e.hp <= 0) this.kill(e);
  },

  kill(e) {
    e.dead = true;
    this.kills++;
    const b = SV_ENEMIES[e.type];
    this.burst(e.x, e.y, ['#fff', '#c9b8ff', '#ffd23f'], e.boss ? 80 : 12, e.boss ? 400 : 200);
    if (e.boss) { this.end(true); return; }
    // ジェム
    this.pickups.push({ kind: 'gem', x: e.x, y: e.y, val: b.gem, t: 0 });
    // 宝箱: 一定時間ごとに 1 つ確定 + 強い敵はたまに落とす
    if (this.time - (this.lastChest || 0) > 14) {
      // 定期的な宝箱は、自分の近くに落ちてくる
      this.lastChest = this.time;
      const a = Math.random() * Math.PI * 2, d = 160 + Math.random() * 60;
      this.pickups.push({ kind: 'chest', x: this.p.x + Math.cos(a) * d, y: this.p.y + Math.sin(a) * d, t: 0 });
    } else if (Math.random() < (b.chest || 0.004)) {
      this.pickups.push({ kind: 'chest', x: e.x + 10, y: e.y, t: 0 });
    } else if (Math.random() < 0.03) {
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
      let spd = e.spd;
      if (e.boss) this.bossAI(e, dt, dx / d, dy / d);
      if (e.boss && e.dash > 0) spd *= 5;
      if (e.boss && e.warn > 0) spd = 0;
      const vx = e.boss && e.dash > 0 ? e.dvx : dx / d;
      const vy = e.boss && e.dash > 0 ? e.dvy : dy / d;
      e.x += (vx * spd + e.kbx) * dt;
      e.y += (vy * spd + e.kby) * dt;
      e.kbx *= 0.86; e.kby *= 0.86;
      if (e.flash > 0) e.flash -= dt;
      // 遠すぎる敵は近くに出しなおす
      if (!e.boss && d > Math.hypot(this.W, this.H) * 0.9) {
        const a = Math.random() * Math.PI * 2, r = Math.hypot(this.W, this.H) / 2 + 40;
        e.x = p.x + Math.cos(a) * r; e.y = p.y + Math.sin(a) * r;
      }
      // プレイヤーに当たった
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
    if (b.dash > 0) { b.dash -= dt; return; }
    if (b.warn > 0) {
      b.warn -= dt;
      if (b.warn <= 0) { b.dash = 0.6; b.dvx = b.aimx; b.dvy = b.aimy; SFX.hurt(); }
      return;
    }
    b.atkT -= dt;
    b.dashT -= dt;
    const enraged = b.hp < b.max / 2;
    if (b.atkT <= 0) {
      b.atkT = enraged ? 2.2 : 3;
      // 全方向に火の玉 + ねらい撃ち
      const n = enraged ? 14 : 10;
      const off = Math.random() * Math.PI;
      for (let i = 0; i < n; i++) {
        const a = off + (i / n) * Math.PI * 2;
        this.eshots.push({ x: b.x, y: b.y, vx: Math.cos(a) * 190, vy: Math.sin(a) * 190, r: 11, dmg: 12, life: 4 });
      }
      const aim = Math.atan2(uy, ux);
      for (const k of [-0.2, 0, 0.2]) this.eshots.push({ x: b.x, y: b.y, vx: Math.cos(aim + k) * 280, vy: Math.sin(aim + k) * 280, r: 12, dmg: 14, life: 3 });
      SFX.noise(0.3, { vol: 0.1, filter: 700 });
    }
    if (b.dashT <= 0) {
      b.dashT = enraged ? 6 : 8;
      b.warn = 0.7; b.aimx = ux; b.aimy = uy;
      this.banner('ドラゴンの とっしん！', '#ff5d5d');
    }
  },

  hitPlayer(dmg) {
    const p = this.p;
    let d = dmg * 40 / (40 + this.ch.stats.def);
    if (this.ch.id === 'gotsun') d *= 0.75;
    d = Math.max(1, Math.round(d));
    p.hp -= d;
    p.inv = 0.8;
    this.texts.push({ x: p.x, y: p.y - 40, text: d, life: 0.7, max: 0.7, color: '#ff5d5d', size: 24 });
    this.burst(p.x, p.y, ['#ff5d5d', '#fff'], 10, 180);
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
        // 0.45 秒後から持ち主のところへ戻る
        if (s.age > 0.45) {
          const dx = p.x - s.x, dy = p.y - s.y, d = Math.hypot(dx, dy) || 1;
          s.vx += dx / d * 1800 * dt; s.vy += dy / d * 1800 * dt;
          const sp = Math.hypot(s.vx, s.vy);
          if (sp > 620) { s.vx *= 620 / sp; s.vy *= 620 / sp; }
          if (d < 24 && s.age > 0.7) s.life = 0;
        }
      }
      s.x += s.vx * dt; s.y += s.vy * dt;
      for (const e of this.enemies) {
        if (e.dead || s.life <= 0) continue;
        if (Math.hypot(e.x - s.x, e.y - s.y) > e.r + s.r) continue;
        if (s.kind === 'boomerang') {
          if ((s.hitCd.get(e) || 0) > this.time) continue;
          s.hitCd.set(e, this.time + 0.35);
          this.hurt(e, s.dmg, s.vx * 0.3, s.vy * 0.3);
        } else {
          if (s.hit.has(e)) continue;
          s.hit.add(e);
          this.hurt(e, s.dmg, s.vx * 0.25, s.vy * 0.25);
          this.burst(s.x, s.y, ['#4fb3ff', '#b5e3ff'], 6, 120);
          if (--s.pierce <= 0) s.life = 0;
        }
      }
    }
    this.shots = this.shots.filter(s => s.life > 0);

    for (const s of this.eshots) {
      s.life -= dt;
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (Math.random() < 0.3) this.parts.push({ x: s.x, y: s.y, vx: 0, vy: -20, life: 0.3, max: 0.3, color: '#ffb040', size: 5 });
      if (p.inv <= 0 && Math.hypot(p.x - s.x, p.y - s.y) < s.r + SV_PLAYER_R - 4) { s.life = 0; this.hitPlayer(s.dmg); }
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
          const h = Math.round(p.max * 0.25);
          p.hp = Math.min(p.max, p.hp + h);
          this.texts.push({ x: p.x, y: p.y - 44, text: '+' + h, life: 0.8, max: 0.8, color: '#6dff8a', size: 24 });
          SFX.heal();
        }
        if (it.kind === 'chest') this.openChest();
      }
    }
    this.pickups = this.pickups.filter(it => !it.got);
  },

  updateEffects(dt) {
    for (const q of this.parts) { q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.94; q.vy *= 0.94; }
    this.parts = this.parts.filter(q => q.life > 0);
    for (const t of this.texts) { t.life -= dt; t.y -= 40 * dt; }
    this.texts = this.texts.filter(t => t.life > 0);
    for (const f of this.fx) f.life -= dt;
    this.fx = this.fx.filter(f => f.life > 0);
  },

  burst(x, y, colors, n, speed) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = speed * (0.3 + Math.random() * 0.7);
      this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5, max: 0.5, color: colors[i % colors.length], size: 3 + Math.random() * 3 });
    }
  },

  // ---------------- 宝箱: 3 つから 1 つえらぶ ----------------
  openChest() {
    const owned = Object.keys(this.weapons);
    const cands = Object.keys(SV_WEAPONS).filter(id => !this.weapons[id] || this.weapons[id].lv < SV_MAX_LV);
    for (let i = cands.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cands[i], cands[j]] = [cands[j], cands[i]]; }
    this.choices = cands.slice(0, 3);
    if (!this.choices.length) this.choices = ['heal'];
    this.state = 'choice';
    this.held.clear();
    SFX.levelup();
    const cards = this.choices.map((id, i) => {
      if (id === 'heal') return `<button class="sv-choice" data-i="${i}"><span class="mc-key">${i + 1}</span><div class="svc-icon">❤️</div><div class="svc-name">ぜんかいふく</div><div class="svc-desc">武器はぜんぶ MAX！ HP を全回復</div></button>`;
      const w = SV_WEAPONS[id];
      const cur = this.weapons[id];
      const tag = cur ? `Lv.${cur.lv} → <b>Lv.${cur.lv + 1}</b>` : '<b class="new">NEW!</b>';
      return `<button class="sv-choice" data-i="${i}" style="--wc:${w.color}"><span class="mc-key">${i + 1}</span>
        <div class="svc-icon">${w.icon}</div><div class="svc-name">${w.name}</div><div class="svc-tag">${tag}</div><div class="svc-desc">${w.desc}</div></button>`;
    }).join('');
    this.overlay(`<div class="ov-box chest"><div class="ov-title">🎁 たからばこ！</div><div class="ov-sub">ほしいものを えらぼう (${owned.length} こ所持)</div>
      <div class="sv-choices">${cards}</div></div>`);
    document.querySelectorAll('.sv-choice').forEach(b => { b.onclick = () => this.choose(+b.dataset.i); });
  },

  choose(i) {
    const id = this.choices[i];
    if (!id) return;
    if (id === 'heal') this.p.hp = this.p.max;
    else if (this.weapons[id]) this.weapons[id].lv++;
    else { this.weapons[id] = { lv: 1, t: 0.3 }; this.weaponLog.push(id); }
    this.overlay('');
    this.state = 'run';
    this.last = performance.now();
    SFX.select();
    const pc = { x: this.W / 2, y: this.H / 2 };
    FX.burst(pc.x, pc.y, { colors: [SV_WEAPONS[id]?.color || '#ff5d8f', '#fff', '#ffd23f'], count: 30, shape: 'star', size: 6, speed: 7 });
    if (id !== 'heal') floatText(pc.x, pc.y - 70, `${SV_WEAPONS[id].name} Lv.${this.weapons[id].lv}`, 'levelup');
    this.updateHud();
  },

  // ---------------- 描画 ----------------
  draw(clock) {
    const ctx = this.ctx, p = this.p, W = this.W, H = this.H;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.save();
    ctx.translate(Math.round(W / 2 - p.x), Math.round(H / 2 - p.y));
    ctx.fillStyle = this.pattern;
    ctx.fillRect(p.x - W / 2 - 2, p.y - H / 2 - 2, W + 4, H + 4);

    const inView = (x, y, m = 120) => Math.abs(x - p.x) < W / 2 + m && Math.abs(y - p.y) < H / 2 + m;

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
        ctx.font = it.kind === 'chest' ? '34px sans-serif' : '24px sans-serif';
        if (it.kind === 'chest') { ctx.shadowColor = '#ffd23f'; ctx.shadowBlur = 20; }
        ctx.fillText(it.kind === 'chest' ? '🎁' : '❤️', it.x, it.y + bob);
        ctx.shadowBlur = 0;
      }
    }

    // ほのおのわ・かみなり
    for (const f of this.fx) {
      const k = f.life / f.max;
      if (f.kind === 'ring') {
        ctx.globalAlpha = k;
        ctx.strokeStyle = f.color; ctx.lineWidth = 14 * k + 2;
        ctx.beginPath(); ctx.arc(p.x, p.y, f.r * (1.1 - k * 0.6), 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = f.color; ctx.globalAlpha = k * 0.15;
        ctx.beginPath(); ctx.arc(p.x, p.y, f.r * (1.1 - k * 0.6), 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // 敵とプレイヤーを y 順に描く (奥から手前へ)
    const actors = this.enemies.filter(e => inView(e.x, e.y, 200));
    actors.push({ player: true, y: p.y, x: p.x });
    actors.sort((a, b) => a.y - b.y);
    for (const a of actors) {
      if (a.player) { this.drawPlayer(ctx, clock); continue; }
      const b = SV_ENEMIES[a.type];
      const w = b.w, h = w * b.vh / b.vw;
      const bob = Math.sin(clock * 6 + a.x * 0.1) * 0.05;
      ctx.save();
      ctx.translate(a.x, a.y);
      if (a.boss && a.warn > 0) {
        // とっしんの予告線
        ctx.strokeStyle = 'rgba(255,60,60,.6)'; ctx.lineWidth = 50; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(a.aimx * 600, a.aimy * 600); ctx.stroke();
      }
      ctx.scale(p.x > a.x ? -1 : 1, 1);
      ctx.scale(1 + bob, 1 - bob);
      if (b.alpha) ctx.globalAlpha = b.alpha;
      if (a.flash > 0) ctx.filter = 'brightness(3)';
      if (a.boss && a.hp < a.max / 2) { ctx.shadowColor = '#ff3030'; ctx.shadowBlur = 30; }
      ctx.drawImage(this.imgs[a.type], -w / 2, -h * 0.62, w, h);
      ctx.restore();
      // 小さな HP バー (ダメージを受けた敵だけ)
      if (!a.boss && a.hp < a.max) {
        ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(a.x - 16, a.y + a.r + 4, 32, 4);
        ctx.fillStyle = '#ff5d8f'; ctx.fillRect(a.x - 16, a.y + a.r + 4, 32 * Math.max(0, a.hp / a.max), 4);
      }
    }

    // 弾
    for (const s of this.shots) {
      if (s.kind === 'water') {
        ctx.fillStyle = '#4fb3ff'; ctx.shadowColor = '#7cf0ff'; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.x - 3, s.y - 3, 3, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.spin);
        ctx.strokeStyle = '#c38bff'; ctx.lineWidth = 7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-14, -10); ctx.lineTo(0, 0); ctx.lineTo(14, -10); ctx.stroke();
        ctx.restore();
      }
    }
    // 岩
    if (this.weapons.rock) {
      const s = svWeaponStat('rock', this.weapons.rock.lv);
      for (let i = 0; i < s.count; i++) {
        const a = this.rockAngle + (i / s.count) * Math.PI * 2;
        const rx = p.x + Math.cos(a) * s.radius, ry = p.y + Math.sin(a) * s.radius;
        ctx.save(); ctx.translate(rx, ry); ctx.rotate(a * 2);
        ctx.fillStyle = '#9c7a57'; ctx.strokeStyle = '#5e4630'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-15, 4); ctx.lineTo(-9, -12); ctx.lineTo(7, -14); ctx.lineTo(16, -2); ctx.lineTo(10, 12); ctx.lineTo(-8, 13); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
    }
    // 敵の火の玉
    for (const s of this.eshots) {
      ctx.fillStyle = '#ff7a1a'; ctx.shadowColor = '#ffb040'; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0; ctx.fillStyle = '#ffe14d'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 0.5, 0, Math.PI * 2); ctx.fill();
    }
    // かみなり
    for (const f of this.fx) {
      if (f.kind !== 'bolt') continue;
      ctx.globalAlpha = f.life / f.max;
      ctx.shadowColor = '#fff27a'; ctx.shadowBlur = 20;
      for (const [w, c] of [[8, '#fff27a'], [3, '#fff']]) {
        ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineJoin = 'round';
        ctx.beginPath(); f.pts.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.stroke();
      }
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    }
    // 粒
    for (const q of this.parts) {
      ctx.globalAlpha = q.life / q.max;
      ctx.fillStyle = q.color;
      ctx.beginPath(); ctx.arc(q.x, q.y, q.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // ダメージ数字
    for (const t of this.texts) {
      ctx.globalAlpha = Math.min(1, t.life / t.max * 2);
      ctx.font = `bold ${t.size}px "DotGothic16", sans-serif`;
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(t.text, t.x, t.y);
      ctx.fillStyle = t.color; ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // 画面の外にある宝箱の方向を矢印で知らせる
    for (const it of this.pickups) {
      if (it.kind !== 'chest' || inView(it.x, it.y, -30)) continue;
      const ang = Math.atan2(it.y - p.y, it.x - p.x);
      const ax = W / 2 + Math.cos(ang) * (W / 2 - 50), ay = H / 2 + Math.sin(ang) * (H / 2 - 50);
      const cx = clamp(ax, 40, W - 40), cy = clamp(ay, 90, H - 40);
      ctx.save(); ctx.translate(cx, cy);
      ctx.font = '26px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🎁', 0, 0);
      ctx.rotate(ang); ctx.fillStyle = '#ffd23f';
      ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(18, -9); ctx.lineTo(18, 9); ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    // 画面のふちを少し暗く
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,30,.45)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  },

  drawPlayer(ctx, clock) {
    const p = this.p;
    const w = 76, h = w * 134 / 132;
    const sq = p.moving ? Math.sin(clock * 16) * 0.07 : Math.sin(clock * 4) * 0.04;
    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.inv > 0 && Math.floor(clock * 20) % 2) ctx.globalAlpha = 0.4;
    ctx.scale(p.face * (1 + sq), 1 - sq);
    ctx.drawImage(this.imgs.player, -w / 2, -h * 0.66, w, h);
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
    const bonus = won ? 300 : 0;
    const timeBonus = Math.floor(this.time);
    const exp = this.gems + timeBonus + bonus;
    const prev = Save.data.best.survival;
    const better = !prev || (won && !prev.cleared) || (won === !!prev.cleared && (won ? this.time < prev.time : this.time > prev.time));
    if (better) Save.data.best.survival = { time: Math.floor(this.time), cleared: won };
    const expRes = grantExp(this.ch.id, exp);
    setTimeout(() => App.show('result', {
      mode: 'survival', won, time: this.time, kills: this.kills, gems: this.gems,
      weapons: Object.entries(this.weapons).map(([id, w]) => ({ id, lv: w.lv })), expRes, newBest: better,
      expBreakdown: [`ジェム ${this.gems}`, `生きのこった時間 ${timeBonus}`, won ? `ボス討伐 ${bonus}` : 'ボス討伐なし'],
    }), 1800);
  },

  // ---------------- 操作 ----------------
  onKey(e) {
    const k = e.key.toLowerCase();
    if (this.state === 'ready') {
      if (e.key === ' ') { this.state = 'run'; this.overlay(''); this.last = performance.now(); SFX.go(); }
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
