// ============================================================
//  ワールドマップ (バトルの入り口)
//  ・WASD / 矢印キーで道を走ってステージからステージへ移動
//  ・ステージの上で Space / Enter を押すとバトル開始
//  ・Tab で横からステージ一覧を出して、直接えらぶこともできる
// ============================================================

const MAP_W = 1200;
const MAP_H = 680;
const MAP_START = { x: 100, y: 590 };
// ステージの位置 (ENEMIES と同じ順番)
const MAP_NODES = [
  { x: 270, y: 590 },
  { x: 270, y: 390 },
  { x: 520, y: 270 },
  { x: 760, y: 450 },
  { x: 1000, y: 450 },
  { x: 1000, y: 180 },
];
// MAP_PATHS[k] = ひとつ前の地点 → ステージ k までの道 (曲がり角を含む)
const MAP_PATHS = [
  [MAP_START, MAP_NODES[0]],
  [MAP_NODES[0], MAP_NODES[1]],
  [MAP_NODES[1], { x: 390, y: 390 }, { x: 390, y: 270 }, MAP_NODES[2]],
  [MAP_NODES[2], { x: 640, y: 270 }, { x: 640, y: 450 }, MAP_NODES[3]],
  [MAP_NODES[3], MAP_NODES[4]],
  [MAP_NODES[4], MAP_NODES[5]],
];
const KEY_DIR = { w: 'up', arrowup: 'up', s: 'down', arrowdown: 'down', a: 'left', arrowleft: 'left', d: 'right', arrowright: 'right' };
const DIR_KEY = { up: 'W', down: 'S', left: 'A', right: 'D' };

function dirOf(p, q) {
  const dx = q.x - p.x, dy = q.y - p.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

function nodePos(i) { return i < 0 ? MAP_START : MAP_NODES[i]; }

// ---------------- マップの背景 (草原・池・木など) ----------------
function mapBackgroundSVG() {
  const tree = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})">
    <ellipse cx="0" cy="34" rx="26" ry="7" fill="#000" opacity=".18"/>
    <rect x="-6" y="8" width="12" height="26" rx="3" fill="#8a5a2b"/>
    <circle cx="-14" cy="0" r="18" fill="#2f9e44"/><circle cx="14" cy="0" r="18" fill="#2f9e44"/>
    <circle cx="0" cy="-14" r="22" fill="#40c057"/><circle cx="-6" cy="-20" r="7" fill="#8ce99a" opacity=".7"/></g>`;
  const bush = (x, y) => `<g transform="translate(${x},${y})"><ellipse cx="0" cy="12" rx="30" ry="6" fill="#000" opacity=".15"/>
    <circle cx="-16" cy="2" r="13" fill="#37b24d"/><circle cx="16" cy="2" r="13" fill="#37b24d"/><circle cx="0" cy="-6" r="16" fill="#51cf66"/></g>`;
  const flower = (x, y, c) => `<g transform="translate(${x},${y})">${[0, 72, 144, 216, 288].map(a =>
    `<circle cx="${Math.cos(a * Math.PI / 180) * 5}" cy="${Math.sin(a * Math.PI / 180) * 5}" r="4" fill="${c}"/>`).join('')}<circle r="3" fill="#ffd43b"/></g>`;
  const rock = (x, y) => `<g transform="translate(${x},${y})"><ellipse cx="0" cy="8" rx="20" ry="5" fill="#000" opacity=".15"/>
    <path d="M-18,6 L-12,-10 L4,-14 L18,-2 L16,8 Z" fill="#adb5bd" stroke="#6c757d" stroke-width="2"/></g>`;
  const mush = (x, y) => `<g transform="translate(${x},${y})"><rect x="-5" y="0" width="10" height="12" rx="3" fill="#fff4e6"/>
    <path d="M-14,2 C-14,-12 14,-12 14,2 Z" fill="#fa5252"/><circle cx="-5" cy="-5" r="2.5" fill="#fff"/><circle cx="5" cy="-3" r="2" fill="#fff"/></g>`;

  const flowers = [];
  const cols = ['#ff8fab', '#fff', '#ffa94d', '#b197fc'];
  let seed = 7;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < 46; i++) {
    const x = 30 + rnd() * 1140, y = 40 + rnd() * 610;
    // 道の近くには置かない
    const near = MAP_PATHS.some(path => path.some((p, j) => {
      const q = path[j + 1]; if (!q) return false;
      const minx = Math.min(p.x, q.x) - 40, maxx = Math.max(p.x, q.x) + 40;
      const miny = Math.min(p.y, q.y) - 40, maxy = Math.max(p.y, q.y) + 40;
      return x > minx && x < maxx && y > miny && y < maxy;
    }));
    if (!near) flowers.push(flower(x, y, cols[i % cols.length]));
  }

  return `
    <defs>
      <radialGradient id="mg-grass" cx="50%" cy="40%" r="75%"><stop offset="0%" stop-color="#9be15d"/><stop offset="100%" stop-color="#5fb33a"/></radialGradient>
      <pattern id="mg-dots" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="8" cy="10" r="2" fill="#fff" opacity=".12"/><circle cx="28" cy="30" r="1.5" fill="#fff" opacity=".1"/></pattern>
    </defs>
    <rect width="${MAP_W}" height="${MAP_H}" fill="url(#mg-grass)"/>
    <rect width="${MAP_W}" height="${MAP_H}" fill="url(#mg-dots)"/>
    <ellipse cx="160" cy="110" rx="170" ry="80" fill="#74c045" opacity=".6"/>
    <ellipse cx="880" cy="620" rx="260" ry="70" fill="#74c045" opacity=".6"/>
    <g><ellipse cx="560" cy="560" rx="120" ry="58" fill="#4dabf7" stroke="#e9d8a6" stroke-width="10"/>
      <ellipse cx="530" cy="545" rx="40" ry="10" fill="#fff" opacity=".35"/><ellipse cx="600" cy="575" rx="22" ry="6" fill="#fff" opacity=".3"/></g>
    ${flowers.join('')}
    ${tree(80, 330, 1.1)}${tree(150, 250)}${tree(430, 120, 1.2)}${tree(700, 110)}${tree(860, 260, 1.1)}
    ${tree(1120, 360)}${tree(1140, 580, 1.2)}${tree(420, 620)}${tree(760, 620, .9)}${tree(60, 470, .9)}
    ${bush(180, 470)}${bush(620, 170)}${bush(880, 360)}${bush(1100, 260)}${bush(330, 180)}${bush(720, 360)}
    ${rock(470, 470)}${rock(900, 560)}${rock(1150, 120)}${mush(210, 150)}${mush(820, 180)}${mush(660, 520)}
    <g transform="translate(40,20)" opacity=".9">${[0, 1, 2, 3].map(i => `<rect x="${i * 22}" y="0" width="6" height="30" fill="#c08457"/>`).join('')}
      <rect x="-4" y="8" width="80" height="5" fill="#c08457"/><rect x="-4" y="20" width="80" height="5" fill="#c08457"/></g>`;
}

function castleSVG() {
  return `<svg viewBox="0 0 120 110" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="60" cy="104" rx="52" ry="6" fill="#000" opacity=".25"/>
    <rect x="18" y="40" width="84" height="62" fill="#868e96" stroke="#343a40" stroke-width="3"/>
    <rect x="8" y="24" width="26" height="78" fill="#adb5bd" stroke="#343a40" stroke-width="3"/>
    <rect x="86" y="24" width="26" height="78" fill="#adb5bd" stroke="#343a40" stroke-width="3"/>
    ${[8, 17, 26, 86, 95, 104].map(x => `<rect x="${x}" y="16" width="7" height="10" fill="#adb5bd" stroke="#343a40" stroke-width="2"/>`).join('')}
    <path d="M44,102 L44,78 C44,64 76,64 76,78 L76,102 Z" fill="#212529"/>
    <rect x="16" y="48" width="10" height="14" rx="4" fill="#ffd43b"/><rect x="94" y="48" width="10" height="14" rx="4" fill="#ffd43b"/>
    <line x1="60" y1="40" x2="60" y2="4" stroke="#343a40" stroke-width="3"/>
    <path d="M60,4 L86,12 L60,20 Z" fill="#e03131"/>
  </svg>`;
}

Screens.stages = {
  enter(arg = {}) {
    this.ch = charInfo(Save.data.active);
    this.cleared = Save.data.cleared;
    let pos = Save.data.mapPos ?? -1;
    if (pos > this.cleared) pos = Math.min(this.cleared, ENEMIES.length - 1);
    this.pos = pos;
    this.moving = false;
    this.held = new Set();
    this.drawerOpen = false;
    this.unlockAnim = arg.justCleared != null && arg.justCleared + 1 < ENEMIES.length ? arg.justCleared + 1 : null;

    this.build();
    this.fit();
    this.placePlayer(nodePos(this.pos));
    this.updateInfo();
    this._onResize = () => this.fit();
    addEventListener('resize', this._onResize);

    if (this.unlockAnim != null) {
      setTimeout(() => this.playUnlock(this.unlockAnim), 500);
    }
    if (arg.drawer) this.toggleDrawer(true);
  },

  leave() {
    this.moving = false;
    cancelAnimationFrame(this.raf);
    removeEventListener('resize', this._onResize);
    $('#drawer').classList.remove('open');
  },

  // 画面の大きさに合わせてマップを拡大縮小
  fit() {
    const availW = innerWidth - 40, availH = innerHeight - 140;
    const s = Math.min(availW / MAP_W, availH / MAP_H);
    this.scale = s;
    $('#map-outer').style.width = MAP_W * s + 'px';
    $('#map-outer').style.height = MAP_H * s + 'px';
    $('#map').style.transform = `scale(${s})`;
  },

  build() {
    // 背景と道
    const pathSvg = MAP_PATHS.map((pts, k) => {
      const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ');
      const open = k <= this.cleared && k !== this.unlockAnim;
      return `<g class="road ${open ? 'open' : 'locked'}" id="road-${k}">
        <path d="${d}" class="road-edge"/><path d="${d}" class="road-fill"/><path d="${d}" class="road-dots"/></g>`;
    }).join('');
    $('#map-svg').innerHTML = mapBackgroundSVG() + pathSvg;

    // スタート地点とステージ
    const start = `<div class="node start" style="left:${MAP_START.x}px;top:${MAP_START.y}px">
      <div class="node-pad"></div><div class="node-flag">START</div></div>`;
    const nodes = ENEMIES.map((e, i) => {
      const p = MAP_NODES[i];
      const locked = i > this.cleared;
      const cleared = i < this.cleared;
      const icon = e.boss ? castleSVG() : locked ? '<div class="node-q">?</div>' : enemySVG(e.id);
      return `<div class="node ${locked ? 'locked' : ''} ${cleared ? 'cleared' : ''} ${e.boss ? 'boss' : ''}" id="node-${i}" data-i="${i}" style="left:${p.x}px;top:${p.y}px">
        <div class="node-pad"></div>
        <div class="node-icon">${icon}</div>
        ${cleared ? '<div class="node-star">★</div>' : ''}
        <div class="node-label">1-${i + 1}${locked ? '' : ' ' + e.name}</div>
      </div>`;
    }).join('');
    $('#map-nodes').innerHTML = start + nodes;
    $('#map-nodes').querySelectorAll('.node[data-i]').forEach(n => {
      n.onclick = () => { const i = +n.dataset.i; if (i <= this.cleared) this.startBattle(i); };
    });

    $('#map-player .sprite').innerHTML = slimeSVG(this.ch.id, this.ch.stage);
    $('#map-char').innerHTML = `<div class="sprite">${slimeSVG(this.ch.id, this.ch.stage)}</div><div><b>${this.ch.name}</b><small>Lv.${this.ch.L}</small></div>`;

    // Tab で出るステージ一覧
    this.buildDrawer();
  },

  buildDrawer() {
    const c = this.ch;
    const diffStars = { easy: '★', normal: '★★', hard: '★★★' };
    $('#stage-list').innerHTML = ENEMIES.map((e, i) => {
      const locked = i > this.cleared;
      const cleared = i < this.cleared;
      const warn = !locked && c.L < e.lv - 2 ? '<span class="warn">レベル不足かも</span>' : '';
      return `<button class="stage-card ${locked ? 'locked' : ''} ${cleared ? 'cleared' : ''} ${e.boss ? 'boss' : ''}" data-i="${i}" ${locked ? 'disabled' : ''}>
        <span class="mc-key">${i + 1}</span>
        <div class="st-sprite">${locked ? '<div class="lock">?</div>' : enemySVG(e.id)}</div>
        <div class="st-body">
          <div class="st-name">${locked ? '？？？' : e.name}${e.boss && !locked ? ' <span class="badge boss">BOSS</span>' : ''}</div>
          <div class="st-meta">1-${i + 1} ・ Lv.${e.lv} ・ お題 ${diffStars[e.diff]} ${warn}</div>
          <div class="st-desc">${locked ? 'まえのあいてをたおすと あらわれる' : e.desc}</div>
          ${locked ? '' : `<div class="st-ability">${e.abilityDesc}</div>`}
        </div>
        ${cleared ? '<div class="st-clear">CLEAR</div>' : ''}
      </button>`;
    }).join('');
    $('#stage-list').querySelectorAll('.stage-card:not(.locked)').forEach(b => {
      b.onclick = () => this.startBattle(+b.dataset.i);
    });
  },

  toggleDrawer(force) {
    this.drawerOpen = force ?? !this.drawerOpen;
    $('#drawer').classList.toggle('open', this.drawerOpen);
    SFX.select();
  },

  placePlayer(p) {
    this.px = p.x; this.py = p.y;
    const el = $('#map-player');
    el.style.left = p.x + 'px';
    el.style.top = p.y + 'px';
    this.updateArrows();
  },

  // 今いる場所から進める方向
  exits() {
    const ex = {};
    const fwd = MAP_PATHS[this.pos + 1];
    if (fwd && this.pos + 1 <= this.cleared && this.pos + 1 !== this.unlockAnim) ex[dirOf(fwd[0], fwd[1])] = { to: this.pos + 1, pts: fwd };
    const back = MAP_PATHS[this.pos];
    if (back) {
      const rev = back.slice().reverse();
      ex[dirOf(rev[0], rev[1])] = { to: this.pos - 1, pts: rev };
    }
    return ex;
  },

  updateArrows() {
    const box = $('#map-arrows');
    if (this.moving) { box.innerHTML = ''; return; }
    const ex = this.exits();
    box.innerHTML = Object.keys(ex).map(d => `<div class="mp-arrow ${d}"><span>${DIR_KEY[d]}</span></div>`).join('');
  },

  updateInfo() {
    // 今いるステージの敵アイコンは少しうすくして、スライムと重ならないようにする
    document.querySelectorAll('#map-nodes .node[data-i]').forEach(n => n.classList.toggle('here', +n.dataset.i === this.pos));
    const info = $('#map-info');
    const world = $('#map-world');
    if (this.pos < 0) {
      world.innerHTML = 'ワールド 1 <b>スタート</b>';
      info.innerHTML = `<div class="mi-body"><div class="mi-name">スタートちてん</div>
        <div class="mi-desc"><kbd>D</kbd> で みちを すすもう</div></div>`;
      return;
    }
    const e = ENEMIES[this.pos];
    const cleared = this.pos < this.cleared;
    world.innerHTML = `ワールド 1 - <b>${this.pos + 1}</b>`;
    const warn = this.ch.L < e.lv - 2 ? `<div class="mi-warn">レベルが たりないかも (おすすめ Lv.${e.lv})</div>` : '';
    info.innerHTML = `<div class="mi-sprite">${enemySVG(e.id)}</div>
      <div class="mi-body">
        <div class="mi-name">${e.name} <small>Lv.${e.lv}</small> ${cleared ? '<span class="mi-clear">CLEAR</span>' : ''}</div>
        <div class="mi-desc">${e.abilityDesc}</div>${warn}
        <div class="mi-go"><kbd>Space</kbd> で たたかう</div>
      </div>`;
    replayAnim(info, 'pop-in', 300);
  },

  tryMove(dir) {
    if (this.moving || this.drawerOpen) return;
    const ex = this.exits()[dir];
    if (!ex) {
      // 進めない方向: その場でぷるっと
      replayAnim($('#map-player .sprite'), 'nope', 300);
      return;
    }
    this.walk(ex.pts, ex.to);
  },

  // 道にそって走る
  walk(pts, to) {
    this.moving = true;
    document.querySelectorAll('#map-nodes .node.here').forEach(n => n.classList.remove('here'));
    this.updateArrows();
    const player = $('#map-player');
    player.classList.add('running');
    const speed = 340; // px/秒
    let seg = 0, t = 0;
    let last = performance.now();
    let dustT = 0;
    const step = now => {
      if (!this.moving) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      let move = speed * dt;
      while (move > 0 && seg < pts.length - 1) {
        const a = pts[seg], b = pts[seg + 1];
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        const remain = len * (1 - t);
        if (move >= remain) { move -= remain; seg++; t = 0; } else { t += move / len; move = 0; }
      }
      if (seg >= pts.length - 1) { this.arrive(to); return; }
      const a = pts[seg], b = pts[seg + 1];
      const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
      if (b.x !== a.x) player.classList.toggle('flip', b.x < a.x);
      this.placePlayer({ x, y });
      dustT += dt;
      if (dustT > 0.09) {
        dustT = 0;
        const r = player.getBoundingClientRect();
        FX.burst(r.left + r.width / 2, r.bottom - 4, { colors: ['#e9d8a6', '#fff'], count: 3, speed: 1.5, size: 3, life: 22, gravity: -0.02 });
      }
      this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  },

  arrive(to) {
    this.moving = false;
    this.pos = to;
    Save.data.mapPos = to;
    Save.save();
    const player = $('#map-player');
    player.classList.remove('running');
    this.placePlayer(nodePos(to));
    replayAnim($('#map-player .sprite'), 'land', 300);
    SFX.select();
    this.updateInfo();
    // キーを押しっぱなしなら続けて走る
    for (const k of this.held) {
      const d = KEY_DIR[k];
      if (d && this.exits()[d]) { this.tryMove(d); break; }
    }
  },

  // 敵をたおした直後: 次の道が少しずつ現れる
  playUnlock(k) {
    const g = $('#road-' + k);
    if (!g) return;
    g.classList.remove('locked');
    g.classList.add('open', 'revealing');
    g.querySelectorAll('path').forEach(p => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
      void p.getBoundingClientRect();
      p.style.transition = 'stroke-dashoffset 1.4s ease-in-out';
      p.style.strokeDashoffset = 0;
    });
    SFX.charge();
    setTimeout(() => {
      g.classList.remove('revealing');
      g.querySelectorAll('path').forEach(p => { p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; p.style.transition = ''; });
      this.unlockAnim = null;
      const node = $('#node-' + k);
      if (node) {
        const r = node.getBoundingClientRect();
        FX.burst(r.left + r.width / 2, r.top + r.height / 2, { colors: ['#ffd23f', '#fff', '#ff8fab'], count: 36, shape: 'star', size: 7, speed: 6 });
        SFX.levelup();
      }
      toast('あたらしい みちが ひらけた！ WASD で すすもう');
      this.updateArrows();
    }, 1500);
  },

  startBattle(i) {
    if (i > this.cleared) return;
    Save.data.mapPos = i;
    Save.save();
    SFX.select();
    App.show('battle', i);
  },

  onKey(e) {
    const k = e.key.toLowerCase();
    if (e.key === 'Tab') { e.preventDefault(); this.toggleDrawer(); return; }
    if (this.drawerOpen) {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= ENEMIES.length && n - 1 <= this.cleared) this.startBattle(n - 1);
      if (e.key === 'Escape') this.toggleDrawer(false);
      return;
    }
    if (e.key === 'Escape') { App.show('home'); return; }
    if (KEY_DIR[k]) { this.held.add(k); e.preventDefault(); this.tryMove(KEY_DIR[k]); return; }
    if ((e.key === ' ' || e.key === 'Enter') && !this.moving && this.pos >= 0) this.startBattle(this.pos);
  },

  onKeyUp(e) { this.held.delete(e.key.toLowerCase()); },
};
