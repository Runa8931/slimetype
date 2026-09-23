// ============================================================
//  ワールドマップ (バトルの入り口)
//  ・そうげん → うみ → ゆきやま → マグマのしろ の 4 ワールド
//  ・WASD / 矢印キーで道を走ってステージからステージへ移動
//  ・ステージの上で Space / Enter を押すとバトル開始
//  ・ボスをたおすと「つぎのワールドへ」のゲートがひらく
//  ・Tab で横からステージ一覧を出して、直接えらぶこともできる
// ============================================================

const MAP_W = 1200;
const MAP_H = 680;
const KEY_DIR = { w: 'up', arrowup: 'up', s: 'down', arrowdown: 'down', a: 'left', arrowleft: 'left', d: 'right', arrowright: 'right' };
const DIR_KEY = { up: 'W', down: 'S', left: 'A', right: 'D' };
const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

// ワールドごとの地図 (nodes は ENEMIES の出てくる順番と同じ)
const P = (x, y) => ({ x, y });
const WORLD_MAPS = [
  { // そうげん
    start: P(100, 590),
    nodes: [P(270, 590), P(270, 390), P(520, 270), P(760, 450), P(1000, 450), P(1000, 180)],
    via: [[], [], [P(390, 390), P(390, 270)], [P(640, 270), P(640, 450)], [], []],
    gate: P(1135, 180),
  },
  { // うみ
    start: P(90, 560),
    nodes: [P(300, 560), P(300, 300), P(640, 300), P(980, 520)],
    via: [[], [], [], [P(800, 300), P(800, 520)]],
    gate: P(1130, 520),
  },
  { // ゆきやま
    start: P(90, 210),
    nodes: [P(300, 210), P(300, 470), P(620, 470), P(900, 210)],
    via: [[], [], [], [P(900, 470)]],
    gate: P(1120, 210),
  },
  { // マグマのしろ
    start: P(90, 600),
    nodes: [P(280, 600), P(280, 360), P(560, 360), P(950, 190)],
    via: [[], [], [], [P(560, 190)]],
    gate: null,
  },
];
// paths[k] = ひとつ前の地点 → ステージ k までの道
WORLD_MAPS.forEach(m => {
  m.paths = m.nodes.map((n, k) => [k === 0 ? m.start : m.nodes[k - 1], ...m.via[k], n]);
  m.gatePath = m.gate ? [m.nodes[m.nodes.length - 1], m.gate] : null;
});

function dirOf(p, q) {
  const dx = q.x - p.x, dy = q.y - p.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

// 道の近くかどうか (飾りを道の上に置かないため)
function nearRoad(m, x, y, margin) {
  const all = [...m.paths, ...(m.gatePath ? [m.gatePath] : [])];
  return all.some(path => path.some((p, j) => {
    const q = path[j + 1]; if (!q) return false;
    return x > Math.min(p.x, q.x) - margin && x < Math.max(p.x, q.x) + margin &&
      y > Math.min(p.y, q.y) - margin && y < Math.max(p.y, q.y) + margin;
  }));
}

function seededRnd(seed) {
  return () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
}

// 道から離れた場所をランダムにえらぶ
function scatter(m, n, margin, seed, area = [30, 40, 1170, 650]) {
  const rnd = seededRnd(seed);
  const out = [];
  for (let tries = 0; out.length < n && tries < n * 30; tries++) {
    const x = area[0] + rnd() * (area[2] - area[0]), y = area[1] + rnd() * (area[3] - area[1]);
    if (nearRoad(m, x, y, margin)) continue;
    if (out.some(o => Math.hypot(o.x - x, o.y - y) < margin * 0.9)) continue;
    out.push({ x, y, r: rnd() });
  }
  return out;
}

// ---------------- 飾りの部品 ----------------
const DECO = {
  tree: (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})">
    <ellipse cx="0" cy="34" rx="26" ry="7" fill="#000" opacity=".18"/>
    <rect x="-6" y="8" width="12" height="26" rx="3" fill="#8a5a2b"/>
    <circle cx="-14" cy="0" r="18" fill="#2f9e44"/><circle cx="14" cy="0" r="18" fill="#2f9e44"/>
    <circle cx="0" cy="-14" r="22" fill="#40c057"/><circle cx="-6" cy="-20" r="7" fill="#8ce99a" opacity=".7"/></g>`,
  bush: (x, y) => `<g transform="translate(${x},${y})"><ellipse cx="0" cy="12" rx="30" ry="6" fill="#000" opacity=".15"/>
    <circle cx="-16" cy="2" r="13" fill="#37b24d"/><circle cx="16" cy="2" r="13" fill="#37b24d"/><circle cx="0" cy="-6" r="16" fill="#51cf66"/></g>`,
  flower: (x, y, c) => `<g transform="translate(${x},${y})">${[0, 72, 144, 216, 288].map(a =>
    `<circle cx="${Math.cos(a * Math.PI / 180) * 5}" cy="${Math.sin(a * Math.PI / 180) * 5}" r="4" fill="${c}"/>`).join('')}<circle r="3" fill="#ffd43b"/></g>`,
  rock: (x, y, c = '#adb5bd', e = '#6c757d') => `<g transform="translate(${x},${y})"><ellipse cx="0" cy="8" rx="20" ry="5" fill="#000" opacity=".15"/>
    <path d="M-18,6 L-12,-10 L4,-14 L18,-2 L16,8 Z" fill="${c}" stroke="${e}" stroke-width="2"/></g>`,
  mush: (x, y) => `<g transform="translate(${x},${y})"><rect x="-5" y="0" width="10" height="12" rx="3" fill="#fff4e6"/>
    <path d="M-14,2 C-14,-12 14,-12 14,2 Z" fill="#fa5252"/><circle cx="-5" cy="-5" r="2.5" fill="#fff"/><circle cx="5" cy="-3" r="2" fill="#fff"/></g>`,
  palm: (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})">
    <ellipse cx="4" cy="40" rx="22" ry="6" fill="#000" opacity=".15"/>
    <path d="M0,40 C4,20 2,0 10,-20" stroke="#a0522d" stroke-width="8" fill="none" stroke-linecap="round"/>
    <g fill="#2b9348"><path d="M10,-20 C-10,-34 -30,-24 -36,-10 C-20,-22 -6,-20 10,-20 Z"/><path d="M10,-20 C30,-36 48,-26 52,-12 C36,-22 24,-20 10,-20 Z"/>
    <path d="M10,-20 C0,-44 16,-54 30,-50 C18,-44 14,-34 10,-20 Z"/><path d="M10,-20 C-8,-10 -16,6 -12,16 C-6,2 2,-10 10,-20 Z"/><path d="M10,-20 C28,-8 34,8 30,18 C24,4 18,-8 10,-20 Z"/></g>
    <circle cx="6" cy="-18" r="4" fill="#7f5539"/><circle cx="14" cy="-16" r="4" fill="#7f5539"/></g>`,
  shell: (x, y) => `<g transform="translate(${x},${y})"><path d="M-9,6 C-10,-6 10,-6 9,6 Z" fill="#ffc9de" stroke="#e599b7" stroke-width="1.5"/>
    <path d="M0,6 L0,-4 M-4,6 L-5,-2 M4,6 L5,-2" stroke="#e599b7" stroke-width="1.2"/></g>`,
  star: (x, y) => `<g transform="translate(${x},${y})"><path d="M0,-9 L2.5,-3 L9,-3 L4,1 L6,8 L0,4 L-6,8 L-4,1 L-9,-3 L-2.5,-3 Z" fill="#ff922b" stroke="#e8590c" stroke-width="1"/></g>`,
  wave: (x, y) => `<path d="M${x - 16},${y} q8,-7 16,0 t16,0" fill="none" stroke="#fff" stroke-width="3" opacity=".5" stroke-linecap="round"/>`,
  seaRock: (x, y) => `<g transform="translate(${x},${y})"><ellipse cx="0" cy="8" rx="26" ry="8" fill="#fff" opacity=".35"/>
    <path d="M-20,8 L-14,-12 L2,-18 L18,-4 L20,8 Z" fill="#868e96" stroke="#495057" stroke-width="2"/></g>`,
  boat: (x, y) => `<g transform="translate(${x},${y})"><path d="M-28,0 L28,0 L20,12 L-20,12 Z" fill="#8d5524" stroke="#5c3310" stroke-width="2"/>
    <line x1="0" y1="0" x2="0" y2="-40" stroke="#5c3310" stroke-width="3"/><path d="M2,-38 L26,-8 L2,-8 Z" fill="#fff" stroke="#adb5bd" stroke-width="1.5"/></g>`,
  pine: (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})">
    <ellipse cx="0" cy="36" rx="22" ry="6" fill="#000" opacity=".12"/><rect x="-5" y="24" width="10" height="12" fill="#6d4c41"/>
    <path d="M0,-40 L22,0 L10,0 L28,26 L-28,26 L-10,0 L-22,0 Z" fill="#1b5e20"/>
    <path d="M0,-40 L12,-18 L4,-20 L0,-14 L-4,-20 L-12,-18 Z M-10,0 L-22,0 L-14,-6 Z M10,0 L22,0 L14,-6 Z M-28,26 L-18,16 L-8,24 L0,16 L8,24 L18,16 L28,26 Z" fill="#fff"/></g>`,
  snowman: (x, y) => `<g transform="translate(${x},${y})"><circle cx="0" cy="10" r="14" fill="#fff" stroke="#a5d8ff" stroke-width="2"/>
    <circle cx="0" cy="-10" r="10" fill="#fff" stroke="#a5d8ff" stroke-width="2"/><circle cx="-3" cy="-12" r="1.5" fill="#333"/><circle cx="3" cy="-12" r="1.5" fill="#333"/>
    <path d="M0,-9 L8,-7 L0,-6 Z" fill="#ff922b"/><rect x="-8" y="-24" width="16" height="6" fill="#343a40"/></g>`,
  flake: (x, y, s) => `<g transform="translate(${x},${y}) scale(${s})" stroke="#fff" stroke-width="2" opacity=".7" stroke-linecap="round">
    <path d="M0,-8 L0,8 M-7,-4 L7,4 M-7,4 L7,-4"/></g>`,
  iceRock: (x, y) => `<g transform="translate(${x},${y})"><path d="M-14,10 L-10,-14 L0,-22 L8,-10 L14,10 Z" fill="#a5d8ff" stroke="#4dabf7" stroke-width="2" opacity=".9"/>
    <path d="M-6,-10 L0,-18" stroke="#fff" stroke-width="2"/></g>`,
  lava: (x, y, rx, ry) => `<g><ellipse cx="${x}" cy="${y}" rx="${rx + 8}" ry="${ry + 6}" fill="#3a1a14"/>
    <ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#ff5400" class="lava-glow"/><ellipse cx="${x - rx * 0.2}" cy="${y - ry * 0.2}" rx="${rx * 0.5}" ry="${ry * 0.4}" fill="#ffba08" opacity=".8"/></g>`,
  darkRock: (x, y) => `<g transform="translate(${x},${y})"><path d="M-20,10 L-14,-12 L2,-18 L18,-6 L20,10 Z" fill="#3d2b2b" stroke="#120808" stroke-width="2"/>
    <path d="M-6,-10 L0,0 L6,-4" stroke="#ff7a1a" stroke-width="2" fill="none" opacity=".8"/></g>`,
  brazier: (x, y) => `<g transform="translate(${x},${y})"><rect x="-4" y="0" width="8" height="18" fill="#495057"/><path d="M-12,0 L12,0 L8,-8 L-8,-8 Z" fill="#343a40"/>
    <path d="M0,-30 C-10,-18 -8,-10 0,-8 C8,-10 10,-18 0,-30 Z" fill="#ff7a1a" class="flame"/><path d="M0,-20 C-4,-14 -3,-10 0,-9 C3,-10 4,-14 0,-20 Z" fill="#ffe14d"/></g>`,
};

// ---------------- ワールドごとの背景 ----------------
function mapBackgroundSVG(w) {
  const m = WORLD_MAPS[w];
  if (w === 0) {
    const flowers = scatter(m, 46, 40, 7).map((p, i) => DECO.flower(p.x, p.y, ['#ff8fab', '#fff', '#ffa94d', '#b197fc'][i % 4]));
    return `
      <defs>
        <radialGradient id="mg-grass" cx="50%" cy="40%" r="75%"><stop offset="0%" stop-color="#9be15d"/><stop offset="100%" stop-color="#5fb33a"/></radialGradient>
        <pattern id="mg-dots" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="8" cy="10" r="2" fill="#fff" opacity=".12"/><circle cx="28" cy="30" r="1.5" fill="#fff" opacity=".1"/></pattern>
      </defs>
      <rect width="${MAP_W}" height="${MAP_H}" fill="url(#mg-grass)"/><rect width="${MAP_W}" height="${MAP_H}" fill="url(#mg-dots)"/>
      <ellipse cx="160" cy="110" rx="170" ry="80" fill="#74c045" opacity=".6"/><ellipse cx="880" cy="620" rx="260" ry="70" fill="#74c045" opacity=".6"/>
      <g><ellipse cx="560" cy="560" rx="120" ry="58" fill="#4dabf7" stroke="#e9d8a6" stroke-width="10"/>
        <ellipse cx="530" cy="545" rx="40" ry="10" fill="#fff" opacity=".35"/><ellipse cx="600" cy="575" rx="22" ry="6" fill="#fff" opacity=".3"/></g>
      ${flowers.join('')}
      ${DECO.tree(80, 330, 1.1)}${DECO.tree(150, 250)}${DECO.tree(430, 120, 1.2)}${DECO.tree(700, 110)}${DECO.tree(860, 260, 1.1)}
      ${DECO.tree(1120, 360)}${DECO.tree(1140, 580, 1.2)}${DECO.tree(420, 620)}${DECO.tree(760, 620, .9)}${DECO.tree(60, 470, .9)}
      ${DECO.bush(180, 470)}${DECO.bush(620, 170)}${DECO.bush(880, 360)}${DECO.bush(1100, 290)}${DECO.bush(330, 180)}${DECO.bush(720, 360)}
      ${DECO.rock(470, 470)}${DECO.rock(900, 560)}${DECO.rock(1000, 620)}${DECO.mush(210, 150)}${DECO.mush(820, 180)}${DECO.mush(660, 520)}
      <g transform="translate(40,20)" opacity=".9">${[0, 1, 2, 3].map(i => `<rect x="${i * 22}" y="0" width="6" height="30" fill="#c08457"/>`).join('')}
        <rect x="-4" y="8" width="80" height="5" fill="#c08457"/><rect x="-4" y="20" width="80" height="5" fill="#c08457"/></g>`;
  }

  // 道にそって島 (陸地) を作る
  const land = (color, width, extra = '') => {
    const all = [...m.paths, ...(m.gatePath ? [m.gatePath] : [])];
    return all.map(pts => `<path d="${pts.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`).join('')
      + [m.start, ...m.nodes, ...(m.gate ? [m.gate] : [])].map(p => `<circle cx="${p.x}" cy="${p.y}" r="${width * 0.75}" fill="${color}" ${extra}/>`).join('');
  };

  if (w === 1) {
    const waves = scatter(m, 40, 90, 11).map(p => DECO.wave(p.x, p.y)).join('');
    const rocks = scatter(m, 6, 120, 23).map(p => p.r > 0.5 ? DECO.seaRock(p.x, p.y) : DECO.boat(p.x, p.y)).join('');
    const palms = [m.start, ...m.nodes].map((p, i) => DECO.palm(p.x + (i % 2 ? 58 : -58), p.y - 20, 0.8)).join('');
    const shells = [m.start, ...m.nodes].map((p, i) => (i % 2 ? DECO.shell : DECO.star)(p.x + (i % 2 ? -40 : 44), p.y + 34)).join('');
    return `
      <defs>
        <linearGradient id="mg-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#48b8f0"/><stop offset="100%" stop-color="#1c6fb8"/></linearGradient>
        <pattern id="mg-sparkle" width="60" height="60" patternUnits="userSpaceOnUse"><circle cx="10" cy="12" r="2" fill="#fff" opacity=".25"/><circle cx="40" cy="42" r="1.5" fill="#fff" opacity=".2"/></pattern>
      </defs>
      <rect width="${MAP_W}" height="${MAP_H}" fill="url(#mg-sea)"/><rect width="${MAP_W}" height="${MAP_H}" fill="url(#mg-sparkle)"/>
      ${waves}
      ${land('#7fd3f5', 170, 'opacity=".7"')}${land('#f4dfa6', 120)}
      <g transform="translate(1080,120)"><g class="orbit-slow"><circle r="46" fill="none" stroke="#fff" stroke-width="3" opacity=".45" stroke-dasharray="20 14"/>
        <circle r="26" fill="none" stroke="#fff" stroke-width="3" opacity=".45" stroke-dasharray="12 10"/></g></g>
      ${rocks}${palms}${shells}`;
  }

  if (w === 2) {
    const pines = scatter(m, 26, 70, 31).map(p => DECO.pine(p.x, p.y, 0.8 + p.r * 0.5)).join('');
    const bits = scatter(m, 10, 60, 41).map(p => p.r > 0.6 ? DECO.snowman(p.x, p.y) : DECO.iceRock(p.x, p.y)).join('');
    const flakes = scatter(m, 40, 20, 53).map(p => DECO.flake(p.x, p.y, 0.6 + p.r)).join('');
    return `
      <defs>
        <linearGradient id="mg-snow" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e7f5ff"/><stop offset="100%" stop-color="#c5dff5"/></linearGradient>
      </defs>
      <rect width="${MAP_W}" height="${MAP_H}" fill="url(#mg-snow)"/>
      <path d="M0,120 L120,20 L220,110 L340,0 L470,120 L560,60 L660,130 L0,130 Z" fill="#a5c8e4" opacity=".7"/>
      <path d="M100,36 L120,20 L140,36 L130,40 L120,32 L110,40 Z M320,16 L340,0 L360,16 L350,22 L340,14 L330,22 Z" fill="#fff"/>
      <ellipse cx="520" cy="610" rx="170" ry="48" fill="#a5d8ff" stroke="#fff" stroke-width="8"/>
      <path d="M430,600 L470,620 M560,596 L610,612" stroke="#fff" stroke-width="3" opacity=".7"/>
      ${pines}${bits}${flakes}`;
  }

  // w === 3: マグマのしろ
  const rocks = scatter(m, 14, 70, 61).map(p => DECO.darkRock(p.x, p.y)).join('');
  const pools = scatter(m, 6, 110, 71).map(p => DECO.lava(p.x, p.y, 40 + p.r * 30, 18 + p.r * 10)).join('');
  const braz = m.nodes.map((p, i) => DECO.brazier(p.x + (i % 2 ? 54 : -54), p.y - 6)).join('');
  const river = 'M760,660 C800,560 900,600 960,540 C1020,480 1120,520 1200,470';
  return `
    <defs>
      <radialGradient id="mg-magma" cx="50%" cy="60%" r="80%"><stop offset="0%" stop-color="#4a2a22"/><stop offset="100%" stop-color="#1a0d0a"/></radialGradient>
      <pattern id="mg-cracks" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M10,10 L30,24 L26,40 M50,60 L66,54 L74,70" stroke="#ff5400" stroke-width="1.5" fill="none" opacity=".35"/></pattern>
    </defs>
    <rect width="${MAP_W}" height="${MAP_H}" fill="url(#mg-magma)"/><rect width="${MAP_W}" height="${MAP_H}" fill="url(#mg-cracks)"/>
    <path d="M660,0 C700,90 820,120 900,80 C980,40 1100,60 1200,110 L1200,0 Z" fill="#2a1410"/>
    <path d="M0,300 C80,260 120,330 180,300" fill="none" stroke="#ff5400" stroke-width="18" stroke-linecap="round" class="lava-glow"/>
    <path d="${river}" fill="none" stroke="#3a1a14" stroke-width="44" stroke-linecap="round"/>
    <path d="${river}" fill="none" stroke="#ff5400" stroke-width="28" stroke-linecap="round" class="lava-glow"/>
    <path d="${river}" fill="none" stroke="#ffba08" stroke-width="8" stroke-linecap="round" opacity=".8"/>
    <path d="M40,120 L110,30 L180,120 Z" fill="#2a1410"/><path d="M92,54 L110,30 L128,54 C118,48 102,48 92,54 Z" fill="#ff5400" class="lava-glow"/>
    ${pools}${rocks}${braz}`;
}

function castleSVG(dark = false) {
  const wall = dark ? '#3d2b2b' : '#adb5bd', body = dark ? '#2b1b1b' : '#868e96', line = dark ? '#120808' : '#343a40';
  const win = dark ? '#ff5400' : '#ffd43b', flag = dark ? '#7b2cbf' : '#e03131';
  return `<svg viewBox="0 0 120 110" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="60" cy="104" rx="52" ry="6" fill="#000" opacity=".25"/>
    <rect x="18" y="40" width="84" height="62" fill="${body}" stroke="${line}" stroke-width="3"/>
    <rect x="8" y="24" width="26" height="78" fill="${wall}" stroke="${line}" stroke-width="3"/>
    <rect x="86" y="24" width="26" height="78" fill="${wall}" stroke="${line}" stroke-width="3"/>
    ${[8, 17, 26, 86, 95, 104].map(x => `<rect x="${x}" y="16" width="7" height="10" fill="${wall}" stroke="${line}" stroke-width="2"/>`).join('')}
    <path d="M44,102 L44,78 C44,64 76,64 76,78 L76,102 Z" fill="${dark ? '#ff5400' : '#212529'}" ${dark ? 'class="lava-glow"' : ''}/>
    <rect x="16" y="48" width="10" height="14" rx="4" fill="${win}"/><rect x="94" y="48" width="10" height="14" rx="4" fill="${win}"/>
    <line x1="60" y1="40" x2="60" y2="4" stroke="${line}" stroke-width="3"/>
    <path d="M60,4 L86,12 L60,20 Z" fill="${flag}"/>
    ${dark ? '<path d="M30,24 L38,6 L46,24 Z M74,24 L82,6 L90,24 Z" fill="#9d0208"/>' : ''}
  </svg>`;
}

function portalSVG() {
  return `<svg viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="50" cy="104" rx="40" ry="6" fill="#000" opacity=".25"/>
    <path d="M14,104 L14,44 C14,10 86,10 86,44 L86,104 Z" fill="#868e96" stroke="#343a40" stroke-width="3"/>
    <path d="M24,104 L24,48 C24,22 76,22 76,48 L76,104 Z" fill="#7b2cbf"/>
    <g transform="translate(50,68)"><g class="orbit-slow"><path d="M0,-28 C20,-28 24,-2 8,2 C-4,4 -6,-8 2,-10" fill="none" stroke="#e0aaff" stroke-width="5" stroke-linecap="round"/>
      <path d="M0,24 C-20,24 -24,-2 -8,-6 C4,-8 6,4 -2,6" fill="none" stroke="#c77dff" stroke-width="5" stroke-linecap="round"/></g></g>
    <circle cx="50" cy="16" r="6" fill="#ffd43b"/>
  </svg>`;
}

// ---------------- 画面 ----------------
Screens.stages = {
  enter(arg = {}) {
    this.ch = charInfo(Save.data.active);
    this.cleared = Save.data.cleared;
    this.held = new Set();
    this.drawerOpen = false;
    this.moving = false;
    this.unlockAnim = null;

    if (arg.justCleared != null) {
      // たおしたステージのワールドを表示して、次の道をひらく
      const j = arg.justCleared;
      this.world = ENEMIES[j].world;
      const list = worldStages(this.world);
      this.pos = list.indexOf(j);
      if (this.pos === list.length - 1) { if (WORLD_MAPS[this.world].gate) this.unlockAnim = 'gate'; }
      else this.unlockAnim = this.pos + 1;
    } else {
      this.world = clamp(Save.data.mapWorld ?? 0, 0, this.maxWorld());
      this.pos = Save.data.mapPos ?? -1;
    }
    this.clampPos();
    this.saveSpot();

    this.build();
    this.fit();
    this.placePlayer(this.spotPos(this.pos));
    this.updateInfo();
    this._onResize = () => this.fit();
    addEventListener('resize', this._onResize);

    if (this.unlockAnim != null) setTimeout(() => this.playUnlock(this.unlockAnim), 500);
  },

  leave() {
    this.moving = false;
    cancelAnimationFrame(this.raf);
    removeEventListener('resize', this._onResize);
    $('#drawer').classList.remove('open');
  },

  // 行けるワールドの最大番号
  maxWorld() {
    let w = 0;
    WORLDS.forEach((_, i) => { if (worldStages(i)[0] <= this.cleared) w = i; });
    return w;
  },

  stages() { return worldStages(this.world); },
  map() { return WORLD_MAPS[this.world]; },
  gateIndex() { return this.map().gate ? this.stages().length : null; },
  gateOpen() { const l = this.stages(); return !!this.map().gate && l[l.length - 1] < this.cleared; },

  clampPos() {
    const list = this.stages();
    let maxPos = -1;
    list.forEach((g, i) => { if (g <= this.cleared) maxPos = i; });
    if (this.gateOpen()) maxPos = list.length;
    if (this.pos > maxPos) this.pos = maxPos;
  },

  saveSpot() {
    Save.data.mapWorld = this.world;
    Save.data.mapPos = this.pos;
    Save.save();
  },

  spotPos(pos) {
    const m = this.map();
    if (pos < 0) return m.start;
    if (pos >= m.nodes.length) return m.gate;
    return m.nodes[pos];
  },

  fit() {
    const availW = innerWidth - 40, availH = innerHeight - 140;
    const s = Math.min(availW / MAP_W, availH / MAP_H);
    $('#map-outer').style.width = MAP_W * s + 'px';
    $('#map-outer').style.height = MAP_H * s + 'px';
    $('#map').style.transform = `scale(${s})`;
  },

  build() {
    const m = this.map();
    const list = this.stages();
    const theme = WORLDS[this.world].id;
    $('#map').className = 'map theme-' + theme;
    $('#map-outer').className = 'map-outer theme-' + theme;

    const road = (pts, id, open) => {
      const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ');
      return `<g class="road ${open ? 'open' : 'locked'}" id="${id}">
        <path d="${d}" class="road-edge"/><path d="${d}" class="road-fill"/><path d="${d}" class="road-dots"/></g>`;
    };
    let roads = m.paths.map((pts, k) => road(pts, 'road-' + k, list[k] <= this.cleared && k !== this.unlockAnim)).join('');
    if (m.gatePath) roads += road(m.gatePath, 'road-gate', this.gateOpen() && this.unlockAnim !== 'gate');
    $('#map-svg').innerHTML = mapBackgroundSVG(this.world) + roads;

    const start = `<div class="node start" style="left:${m.start.x}px;top:${m.start.y}px">
      <div class="node-pad"></div><div class="node-flag">${this.world === 0 ? 'START' : '◀ もどる'}</div></div>`;
    const nodes = list.map((g, i) => {
      const e = ENEMIES[g];
      const p = m.nodes[i];
      const locked = g > this.cleared;
      const cleared = g < this.cleared;
      let icon;
      if (e.boss && (this.world === 0 || this.world === 3)) icon = castleSVG(this.world === 3);
      else icon = locked ? '<div class="node-q">?</div>' : enemySVG(e.id);
      return `<div class="node ${locked ? 'locked' : ''} ${cleared ? 'cleared' : ''} ${e.boss ? 'boss' : ''}" id="node-${i}" data-g="${g}" data-i="${i}" style="left:${p.x}px;top:${p.y}px">
        <div class="node-pad"></div>
        <div class="node-icon">${icon}</div>
        ${cleared ? '<div class="node-star">★</div>' : ''}
        <div class="node-label">${stageLabel(g)}${locked ? '' : ' ' + e.name}</div>
      </div>`;
    }).join('');
    let gate = '';
    if (m.gate) {
      const nw = WORLDS[this.world + 1];
      gate = `<div class="node gate ${this.gateOpen() && this.unlockAnim !== 'gate' ? '' : 'locked'}" id="node-gate" style="left:${m.gate.x}px;top:${m.gate.y}px">
        <div class="node-icon">${portalSVG()}</div>
        <div class="node-label">ワールド${this.world + 2} ${nw.name}へ</div></div>`;
    }
    $('#map-nodes').innerHTML = start + nodes + gate;
    $('#map-nodes').querySelectorAll('.node[data-g]').forEach(n => {
      n.onclick = () => { const g = +n.dataset.g; if (g <= this.cleared) this.startBattle(g); };
    });

    $('#map-player .sprite').innerHTML = slimeSVG(this.ch.id, this.ch.stage);
    $('#map-char').innerHTML = `<div class="sprite">${slimeSVG(this.ch.id, this.ch.stage)}</div><div><b>${this.ch.name}</b><small>Lv.${this.ch.L}</small></div>`;
    this.buildDrawer();
  },

  buildDrawer() {
    const c = this.ch;
    const diffStars = { easy: '★', normal: '★★', hard: '★★★' };
    $('#stage-list').innerHTML = WORLDS.map((wd, w) => {
      const cards = worldStages(w).map((g, i) => {
        const e = ENEMIES[g];
        const locked = g > this.cleared;
        const cleared = g < this.cleared;
        const warn = !locked && c.L < e.lv - 2 ? '<span class="warn">レベル不足かも</span>' : '';
        const key = w === this.world ? `<span class="mc-key">${i + 1}</span>` : '';
        return `<button class="stage-card ${locked ? 'locked' : ''} ${cleared ? 'cleared' : ''} ${e.boss ? 'boss' : ''}" data-g="${g}" ${locked ? 'disabled' : ''}>
          ${key}
          <div class="st-sprite">${locked ? '<div class="lock">?</div>' : enemySVG(e.id)}</div>
          <div class="st-body">
            <div class="st-name">${locked ? '？？？' : e.name}${e.boss && !locked ? ' <span class="badge boss">BOSS</span>' : ''}</div>
            <div class="st-meta">${stageLabel(g)} ・ Lv.${e.lv} ・ お題 ${diffStars[e.diff]} ${warn}</div>
            <div class="st-desc">${locked ? 'まえのあいてをたおすと あらわれる' : e.desc}</div>
            ${locked ? '' : `<div class="st-ability">${e.abilityDesc}</div>`}
          </div>
          ${cleared ? '<div class="st-clear">CLEAR</div>' : ''}
        </button>`;
      }).join('');
      return `<div class="drawer-world w-${wd.id}">ワールド ${w + 1}　${wd.name}</div>${cards}`;
    }).join('');
    $('#stage-list').querySelectorAll('.stage-card:not(.locked)').forEach(b => {
      b.onclick = () => this.startBattle(+b.dataset.g);
    });
  },

  toggleDrawer(force) {
    this.drawerOpen = force ?? !this.drawerOpen;
    $('#drawer').classList.toggle('open', this.drawerOpen);
    SFX.select();
    if (this.drawerOpen) {
      const cur = $('#stage-list').querySelectorAll('.drawer-world')[this.world];
      if (cur) cur.scrollIntoView({ block: 'start' });
    }
  },

  placePlayer(p) {
    const el = $('#map-player');
    el.style.left = p.x + 'px';
    el.style.top = p.y + 'px';
    this.updateArrows();
  },

  // 今いる場所から進める方向
  exits() {
    const ex = {};
    const m = this.map();
    const list = this.stages();
    const n = list.length;
    if (this.pos < n - 1) {
      const k = this.pos + 1;
      if (list[k] <= this.cleared && k !== this.unlockAnim) ex[dirOf(m.paths[k][0], m.paths[k][1])] = { to: k, pts: m.paths[k] };
    } else if (this.pos === n - 1 && this.gateOpen() && this.unlockAnim !== 'gate') {
      ex[dirOf(m.gatePath[0], m.gatePath[1])] = { to: n, pts: m.gatePath };
    }
    if (this.pos >= 0) {
      const back = (this.pos === n ? m.gatePath : m.paths[this.pos]).slice().reverse();
      ex[dirOf(back[0], back[1])] = { to: this.pos - 1, pts: back };
    } else if (this.world > 0) {
      // スタート地点からは 前のワールドへ もどれる
      ex[OPPOSITE[dirOf(m.paths[0][0], m.paths[0][1])]] = { prevWorld: true };
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
    document.querySelectorAll('#map-nodes .node[data-i]').forEach(n => n.classList.toggle('here', +n.dataset.i === this.pos));
    const info = $('#map-info');
    const wd = WORLDS[this.world];
    const list = this.stages();
    const head = `ワールド ${this.world + 1} <span class="wname">${wd.name}</span>`;
    if (this.pos < 0) {
      $('#map-world').innerHTML = `${head} <b>スタート</b>`;
      info.innerHTML = `<div class="mi-body"><div class="mi-name">スタートちてん</div>
        <div class="mi-desc">WASD で みちを すすもう${this.world > 0 ? '<br>ぎゃくほうこうで まえのワールドへ もどれる' : ''}</div></div>`;
      return;
    }
    if (this.pos >= list.length) {
      $('#map-world').innerHTML = `${head} <b>ゲート</b>`;
      info.innerHTML = `<div class="mi-body"><div class="mi-name">つぎのワールドへの ゲート</div><div class="mi-desc">すすむと ワールド ${this.world + 2} へ いどうします</div></div>`;
      return;
    }
    const g = list[this.pos];
    const e = ENEMIES[g];
    const cleared = g < this.cleared;
    $('#map-world').innerHTML = `${head} - <b>${this.pos + 1}</b>`;
    const warn = this.ch.L < e.lv - 2 ? `<div class="mi-warn">レベルが たりないかも (おすすめ Lv.${Math.min(e.lv, MAX_LV)})</div>` : '';
    info.innerHTML = `<div class="mi-sprite">${enemySVG(e.id)}</div>
      <div class="mi-body">
        <div class="mi-name">${e.name} <small>Lv.${e.lv}</small> ${e.boss ? '<span class="badge boss">BOSS</span>' : ''} ${cleared ? '<span class="mi-clear">CLEAR</span>' : ''}</div>
        <div class="mi-desc">${e.abilityDesc}</div>${warn}
        <div class="mi-go"><kbd>Space</kbd> で たたかう</div>
      </div>`;
    replayAnim(info, 'pop-in', 300);
  },

  tryMove(dir) {
    if (this.moving || this.drawerOpen) return;
    const ex = this.exits()[dir];
    if (!ex) { replayAnim($('#map-player .sprite'), 'nope', 300); return; }
    if (ex.prevWorld) { this.changeWorld(this.world - 1, worldStages(this.world - 1).length); return; }
    this.walk(ex.pts, ex.to);
  },

  walk(pts, to) {
    this.moving = true;
    document.querySelectorAll('#map-nodes .node.here').forEach(n => n.classList.remove('here'));
    this.updateArrows();
    const player = $('#map-player');
    player.classList.add('running');
    const speed = 340;
    let seg = 0, t = 0, dustT = 0;
    let last = performance.now();
    const dust = [['#e9d8a6', '#fff'], ['#f4dfa6', '#fff'], ['#fff', '#d0ebff'], ['#ff7a1a', '#ffba08']][this.world];
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
      if (b.x !== a.x) player.classList.toggle('flip', b.x < a.x);
      this.placePlayer({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      dustT += dt;
      if (dustT > 0.09) {
        dustT = 0;
        const r = player.getBoundingClientRect();
        FX.burst(r.left + r.width / 2, r.bottom - 4, { colors: dust, count: 3, speed: 1.5, size: 3, life: 22, gravity: -0.02 });
      }
      this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  },

  arrive(to) {
    this.moving = false;
    this.pos = to;
    $('#map-player').classList.remove('running');
    this.placePlayer(this.spotPos(to));
    // ゲートに着いたら次のワールドへ
    if (to === this.gateIndex()) { this.saveSpot(); this.changeWorld(this.world + 1, -1); return; }
    this.saveSpot();
    replayAnim($('#map-player .sprite'), 'land', 300);
    SFX.select();
    this.updateInfo();
    for (const k of this.held) {
      const d = KEY_DIR[k];
      if (d && this.exits()[d]) { this.tryMove(d); break; }
    }
  },

  // ワールドを切りかえる (暗転 → 新しい地図)
  changeWorld(w, pos) {
    this.moving = true;
    this.updateArrows();
    const fade = $('#map-fade');
    fade.innerHTML = `<div class="mf-title">ワールド ${w + 1}</div><div class="mf-name">${WORLDS[w].name}</div>`;
    fade.className = 'map-fade show theme-' + WORLDS[w].id;
    SFX.charge();
    setTimeout(() => {
      if (App.current !== 'stages') return;
      this.world = w; this.pos = pos; this.unlockAnim = null;
      this.saveSpot();
      this.build();
      this.placePlayer(this.spotPos(pos));
      this.updateInfo();
      this.moving = false;
      this.updateArrows();
    }, 700);
    setTimeout(() => { fade.classList.remove('show'); SFX.select(); }, 1500);
  },

  // 敵をたおした直後: 次の道 (またはゲート) が少しずつ現れる
  playUnlock(k) {
    const isGate = k === 'gate';
    const g = $(isGate ? '#road-gate' : '#road-' + k);
    if (!g) return;
    g.classList.remove('locked');
    g.classList.add('open');
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
      g.querySelectorAll('path').forEach(p => { p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; p.style.transition = ''; });
      this.unlockAnim = null;
      const node = $(isGate ? '#node-gate' : '#node-' + k);
      if (node) {
        node.classList.remove('locked');
        const r = node.getBoundingClientRect();
        FX.burst(r.left + r.width / 2, r.top + r.height / 2 - 40, { colors: ['#ffd23f', '#fff', '#ff8fab'], count: 40, shape: 'star', size: 7, speed: 6 });
        SFX.levelup();
      }
      toast(isGate ? `ゲートが ひらいた！ ワールド ${this.world + 2}「${WORLDS[this.world + 1].name}」へ すすもう` : 'あたらしい みちが ひらけた！ WASD で すすもう', 2800);
      this.updateArrows();
    }, 1500);
  },

  startBattle(g) {
    if (g > this.cleared) return;
    const e = ENEMIES[g];
    Save.data.mapWorld = e.world;
    Save.data.mapPos = worldStages(e.world).indexOf(g);
    Save.save();
    SFX.select();
    App.show('battle', g);
  },

  onKey(e) {
    const k = e.key.toLowerCase();
    if (e.key === 'Tab') { e.preventDefault(); this.toggleDrawer(); return; }
    if (this.drawerOpen) {
      const n = parseInt(e.key, 10);
      const list = this.stages();
      if (n >= 1 && n <= list.length && list[n - 1] <= this.cleared) this.startBattle(list[n - 1]);
      if (e.key === 'Escape') this.toggleDrawer(false);
      return;
    }
    if (e.key === 'Escape') { App.show('home'); return; }
    if (KEY_DIR[k]) { this.held.add(k); e.preventDefault(); this.tryMove(KEY_DIR[k]); return; }
    if ((e.key === ' ' || e.key === 'Enter') && !this.moving && this.pos >= 0 && this.pos < this.stages().length) {
      this.startBattle(this.stages()[this.pos]);
    }
  },

  onKeyUp(e) { this.held.delete(e.key.toLowerCase()); },
  onBlur() { this.held.clear(); },
};
