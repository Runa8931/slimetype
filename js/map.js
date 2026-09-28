// ============================================================
//  ワールドマップ (バトルの入り口)
//  ・そうげん → どくぬま → … → マグマのしろ の 11 ワールド (各 6 ステージ)
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

// 地図の道の形 (4 つの型を ワールドごとに使い回す。nodes は ENEMIES の順番と同じ)
const P = (x, y) => ({ x, y });
const MAP_LAYOUTS = {
  A: { start: P(100, 590), nodes: [P(270, 590), P(270, 390), P(520, 270), P(760, 450), P(1000, 450), P(1000, 180)],
    via: [[], [], [P(390, 390), P(390, 270)], [P(640, 270), P(640, 450)], [], []], gate: P(1135, 180) },
  B: { start: P(90, 200), nodes: [P(260, 200), P(260, 450), P(500, 450), P(500, 220), P(780, 220), P(1000, 450)],
    via: [[], [], [], [], [], [P(1000, 220)]], gate: P(1130, 450) },
  C: { start: P(90, 560), nodes: [P(280, 560), P(280, 330), P(520, 330), P(760, 560), P(1000, 560), P(1000, 250)],
    via: [[], [], [], [P(640, 330), P(640, 560)], [], []], gate: P(1130, 250) },
  D: { start: P(90, 340), nodes: [P(260, 340), P(260, 140), P(560, 140), P(560, 460), P(860, 460), P(860, 200)],
    via: [[], [], [], [], [], []], gate: P(1100, 200) },
};
const WORLD_LAYOUT = { grass: 'A', poison: 'C', desert: 'B', sea: 'D', candy: 'A', rain: 'C', factory: 'B', snow: 'B', sky: 'A', space: 'C', magma: 'D', shade: 'C', void: 'A' };
const WORLD_MAPS = WORLDS.map((w, i) => {
  const L = MAP_LAYOUTS[WORLD_LAYOUT[w.id]];
  // さいごのワールドには ゲートがない
  return { theme: w.id, start: L.start, nodes: L.nodes, via: L.via, gate: i < WORLDS.length - 1 ? L.gate : null };
});
WORLD_MAPS.forEach(m => {
  m.paths = m.nodes.map((n, k) => [k === 0 ? m.start : m.nodes[k - 1], ...m.via[k], n]);
  m.gatePath = m.gate ? [m.nodes[m.nodes.length - 1], m.gate] : null;
});

// ---------------- かくしステージの 道 ----------------
// from の マスで つかっていない 向きの うち、ほかの 道と かさならない ところに かくしステージの マスを おく
const HID_POS = 99; // マップの 上での かくしステージの 位置の 番号
const DIR_VEC = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
function hiddenLink(h) {
  if (h._link) return h._link;
  const m = WORLD_MAPS[h.host], k = h.from, node = m.nodes[k];
  const used = new Set();
  const inPath = m.paths[k]; used.add(dirOf(inPath[inPath.length - 1], inPath[inPath.length - 2]));
  if (k < m.nodes.length - 1) used.add(dirOf(m.paths[k + 1][0], m.paths[k + 1][1]));
  else if (m.gatePath) used.add(dirOf(m.gatePath[0], m.gatePath[1]));
  let best = null;
  for (const dist of [170, 140, 200, 110]) {
    for (const d of ['up', 'down', 'left', 'right']) {
      if (used.has(d) || best) continue;
      const p = P(node.x + DIR_VEC[d][0] * dist, node.y + DIR_VEC[d][1] * dist);
      if (p.x < 80 || p.x > MAP_W - 80 || p.y < 110 || p.y > MAP_H - 60) continue;
      if (nearRoad(m, p.x, p.y, 60)) continue;
      best = { dir: d, pos: p };
    }
  }
  if (!best) best = { dir: 'down', pos: P(node.x, Math.min(MAP_H - 50, node.y + 120)) };
  return (h._link = { ...best, path: [node, best.pos] });
}

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

// ---------------- 新しいワールドの背景 ----------------
const NEW_WORLD_BG = {
  // どくぬま: むらさきの沼の上に 泥の道
  poison(m, land) {
    const bubbles = scatter(m, 30, 60, 81).map(p => `<circle cx="${p.x}" cy="${p.y}" r="${3 + p.r * 6}" fill="none" stroke="#d0bfff" stroke-width="2" opacity=".5"/>`).join('');
    const trees = scatter(m, 10, 90, 83).map(p => `<g transform="translate(${p.x},${p.y}) scale(${0.8 + p.r * 0.4})">
      <path d="M0,30 L0,-10 M0,0 L-16,-18 M0,-6 L14,-22 M-8,-10 L-14,-26" stroke="#3b2f2f" stroke-width="5" stroke-linecap="round" fill="none"/></g>`).join('');
    const mush = scatter(m, 12, 60, 85).map(p => `<g transform="translate(${p.x},${p.y})"><rect x="-3" y="0" width="6" height="9" fill="#e5dbff"/>
      <path d="M-10,2 C-10,-8 10,-8 10,2 Z" fill="#9d4edd"/><circle cx="-3" cy="-3" r="2" fill="#d0bfff"/></g>`).join('');
    return `<defs><radialGradient id="mg-swamp" cx="50%" cy="50%" r="80%"><stop offset="0%" stop-color="#4a3b5c"/><stop offset="100%" stop-color="#1f2a1f"/></radialGradient></defs>
      <rect width="${MAP_W}" height="${MAP_H}" fill="url(#mg-swamp)"/>
      ${[[200, 120, 140, 50], [980, 600, 180, 60], [640, 60, 120, 40]].map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#6a4c93" opacity=".6"/>`).join('')}
      ${bubbles}${land('#3d5a2f', 150, 'opacity=".8"')}${land('#6b5b3a', 110)}${trees}${mush}`;
  },
  // さばく: すなの丘・サボテン・ピラミッド
  desert(m) {
    const cacti = scatter(m, 12, 70, 91).map(p => `<g transform="translate(${p.x},${p.y}) scale(${0.7 + p.r * 0.5})"><ellipse cx="0" cy="26" rx="16" ry="4" fill="#000" opacity=".15"/>
      <rect x="-6" y="-20" width="12" height="46" rx="6" fill="#40c057" stroke="#2b8a3e" stroke-width="2"/>
      <path d="M-6,0 L-14,0 L-14,-12 M6,-6 L14,-6 L14,-18" stroke="#40c057" stroke-width="7" fill="none" stroke-linecap="round"/></g>`).join('');
    const bones = scatter(m, 6, 80, 93).map(p => `<path d="M${p.x - 10},${p.y} L${p.x + 10},${p.y}" stroke="#f8f9fa" stroke-width="4" stroke-linecap="round"/>`).join('');
    const pyr = (x, y, s) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M-70,0 L0,-80 L70,0 Z" fill="#e0b56a"/><path d="M0,-80 L70,0 L20,0 Z" fill="#c9974a"/></g>`;
    return `<defs><linearGradient id="mg-sand" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f6d98f"/><stop offset="100%" stop-color="#e2b766"/></linearGradient></defs>
      <rect width="${MAP_W}" height="${MAP_H}" fill="url(#mg-sand)"/>
      ${[[180, 640, 260, 60], [900, 90, 300, 60], [620, 660, 220, 40]].map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#f9e3a8" opacity=".8"/>`).join('')}
      ${pyr(700, 110, 1)}${pyr(820, 120, 0.7)}${pyr(160, 640, 0.8)}
      <g><ellipse cx="880" cy="600" rx="70" ry="26" fill="#4dabf7" stroke="#f9e3a8" stroke-width="6"/>${DECO.palm(930, 560, 0.7)}</g>
      ${cacti}${bones}`;
  },
  // おかしのくに: ピンクの地面・キャンディ・ドーナツ
  candy(m) {
    const sprinkles = scatter(m, 60, 30, 101).map((p, i) => `<rect x="${p.x}" y="${p.y}" width="10" height="3" rx="1.5" fill="${['#ff6b6b', '#ffd43b', '#4dabf7', '#69db7c', '#fff'][i % 5]}" transform="rotate(${p.r * 180} ${p.x} ${p.y})"/>`).join('');
    const items = scatter(m, 14, 80, 103).map((p, i) => {
      if (i % 3 === 0) return `<g transform="translate(${p.x},${p.y})"><rect x="-3" y="0" width="6" height="34" fill="#fff"/><circle cx="0" cy="-6" r="16" fill="#ff8fab"/><path d="M0,-6 m0,-12 a12,12 0 1,1 -1,0" fill="none" stroke="#fff" stroke-width="4"/></g>`;
      if (i % 3 === 1) return `<g transform="translate(${p.x},${p.y})"><circle r="20" fill="#e8a87c"/><circle r="20" fill="none" stroke="#ff8fab" stroke-width="10" stroke-dasharray="6 3"/><circle r="7" fill="#fff0f6"/></g>`;
      return `<g transform="translate(${p.x},${p.y})"><path d="M-6,30 L-6,-10 C-6,-24 14,-24 14,-10" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"/>
        <path d="M-6,30 L-6,-10 C-6,-24 14,-24 14,-10" fill="none" stroke="#fa5252" stroke-width="8" stroke-dasharray="6 6" stroke-linecap="round"/></g>`;
    }).join('');
    return `<rect width="${MAP_W}" height="${MAP_H}" fill="#ffd6e7"/>
      ${[[200, 150, 180, 70], [900, 560, 220, 80]].map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#ffc2dc"/>`).join('')}
      <path d="M0,40 C200,0 400,80 600,40 C800,0 1000,80 1200,40 L1200,0 L0,0 Z" fill="#7a3e0a" opacity=".85"/>
      ${sprinkles}${items}`;
  },
  // あめのもり: くらい森・水たまり・雨
  rain(m) {
    const trees = scatter(m, 22, 70, 111).map(p => DECO.tree(p.x, p.y, 0.8 + p.r * 0.4).replace(/#2f9e44/g, '#1e5e2e').replace(/#40c057/g, '#2b7a3e').replace(/#8ce99a/g, '#69db7c')).join('');
    const puddles = scatter(m, 8, 70, 113).map(p => `<ellipse cx="${p.x}" cy="${p.y}" rx="${24 + p.r * 20}" ry="${9 + p.r * 6}" fill="#74c0fc" opacity=".6" stroke="#a5d8ff" stroke-width="2"/>`).join('');
    return `<defs><pattern id="mg-rain" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M30,0 L22,24" stroke="#d0ebff" stroke-width="2" opacity=".4"/><path d="M10,18 L4,36" stroke="#d0ebff" stroke-width="1.5" opacity=".3"/></pattern></defs>
      <rect width="${MAP_W}" height="${MAP_H}" fill="#2f5d3a"/>
      ${puddles}${trees}
      <rect width="${MAP_W}" height="${MAP_H}" fill="url(#mg-rain)"/>`;
  },
  // きかいのこうじょう: 金属のゆか・はぐるま・パイプ
  factory(m) {
    const gear = (x, y, r, c) => `<g transform="translate(${x},${y})">${Array.from({ length: 8 }, (_, i) => `<rect x="${-r * 0.18}" y="${-r * 1.25}" width="${r * 0.36}" height="${r * 0.5}" fill="${c}" transform="rotate(${i * 45})"/>`).join('')}
      <circle r="${r}" fill="${c}"/><circle r="${r * 0.35}" fill="#343a40"/></g>`;
    const gears = scatter(m, 10, 90, 121).map((p, i) => gear(p.x, p.y, 16 + p.r * 16, i % 2 ? '#868e96' : '#adb5bd')).join('');
    const lamps = scatter(m, 10, 60, 123).map(p => `<circle cx="${p.x}" cy="${p.y}" r="5" fill="#ffd43b" opacity=".8"/>`).join('');
    return `<defs><pattern id="mg-metal" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="#5c636a"/><rect x="1" y="1" width="58" height="58" fill="#646b73"/>
      <circle cx="6" cy="6" r="2" fill="#495057"/><circle cx="54" cy="54" r="2" fill="#495057"/></pattern>
      <pattern id="mg-warn" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="15" height="30" fill="#ffd43b"/><rect x="15" width="15" height="30" fill="#212529"/></pattern></defs>
      <rect width="${MAP_W}" height="${MAP_H}" fill="url(#mg-metal)"/>
      <rect x="0" y="0" width="${MAP_W}" height="16" fill="url(#mg-warn)"/><rect x="0" y="${MAP_H - 16}" width="${MAP_W}" height="16" fill="url(#mg-warn)"/>
      <path d="M40,80 L40,640 M1160,60 L1160,620" stroke="#868e96" stroke-width="18"/><path d="M40,80 L40,640 M1160,60 L1160,620" stroke="#adb5bd" stroke-width="6"/>
      ${gears}${lamps}`;
  },
  // てんくう: 空と くもの道
  sky(m, land) {
    const clouds = scatter(m, 14, 90, 131).map(p => `<g transform="translate(${p.x},${p.y}) scale(${0.6 + p.r * 0.7})" opacity=".85"><circle cx="-20" cy="0" r="18" fill="#fff"/><circle cx="4" cy="-8" r="24" fill="#fff"/><circle cx="28" cy="2" r="16" fill="#fff"/></g>`).join('');
    const birds = scatter(m, 6, 80, 133).map(p => `<path d="M${p.x - 10},${p.y} q5,-6 10,0 q5,-6 10,0" fill="none" stroke="#1c3d5a" stroke-width="2"/>`).join('');
    return `<defs><linearGradient id="mg-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4dabf7"/><stop offset="100%" stop-color="#d0ebff"/></linearGradient></defs>
      <rect width="${MAP_W}" height="${MAP_H}" fill="url(#mg-sky)"/>
      <circle cx="1080" cy="90" r="50" fill="#fff3bf"/><circle cx="1080" cy="90" r="70" fill="#fff3bf" opacity=".3"/>
      ${clouds}${land('#e7f5ff', 150, 'opacity=".9"')}${land('#ffffff', 110)}${birds}`;
  },
  // うちゅう: 星空と いんせきの道
  space(m, land) {
    const stars = scatter(m, 90, 18, 141).map(p => `<circle cx="${p.x}" cy="${p.y}" r="${0.8 + p.r * 1.8}" fill="#fff" opacity="${0.4 + p.r * 0.6}"/>`).join('');
    const craters = [m.start, ...m.nodes].map((p, i) => `<ellipse cx="${p.x + (i % 2 ? 44 : -44)}" cy="${p.y + 30}" rx="12" ry="6" fill="#868e96"/>`).join('');
    return `<rect width="${MAP_W}" height="${MAP_H}" fill="#0b0b24"/>
      <ellipse cx="600" cy="340" rx="500" ry="160" fill="#3b1f6b" opacity=".35"/>
      ${stars}
      <g><circle cx="1070" cy="110" r="56" fill="#ff922b"/><ellipse cx="1070" cy="110" rx="92" ry="18" fill="none" stroke="#ffd8a8" stroke-width="6" transform="rotate(-18 1070 110)"/></g>
      <circle cx="140" cy="600" r="40" fill="#4dabf7"/><path d="M110,590 C130,580 150,600 170,592" stroke="#69db7c" stroke-width="10" fill="none"/>
      ${land('#495057', 130, 'opacity=".9"')}${land('#adb5bd', 100)}${craters}`;
  },
};

// うらの せかい (かず少ない 図形だけで 軽く 描く)
NEW_WORLD_BG.shade = (m, land) => {
  const trees = scatter(m, 18, 80, 211).map(p => `<g transform="translate(${p.x},${p.y}) scale(${0.8 + p.r * 0.5})"><rect x="-5" y="4" width="10" height="26" fill="#1a0f2e"/>
    <path d="M0,-40 L24,8 L-24,8 Z" fill="#2b1a4a"/><circle cx="${p.r > 0.5 ? -6 : 6}" cy="-6" r="2.2" fill="#e599f7"/></g>`).join('');
  const wisps = scatter(m, 14, 60, 223).map(p => `<circle cx="${p.x}" cy="${p.y}" r="${3 + p.r * 4}" fill="#da77f2" opacity="${0.3 + p.r * 0.4}" class="spark-soft"/>`).join('');
  return `<rect width="${MAP_W}" height="${MAP_H}" fill="#140b24"/>
    <ellipse cx="600" cy="360" rx="560" ry="220" fill="#3b1f6b" opacity=".45"/>
    <circle cx="1060" cy="100" r="46" fill="#e5dbff" opacity=".85"/><circle cx="1076" cy="90" r="40" fill="#140b24"/>
    ${land('#2b1a4a', 130)}${land('#4a2d73', 96)}${trees}${wisps}`;
};
NEW_WORLD_BG.void = (m, land) => {
  const stars = scatter(m, 80, 16, 311).map(p => `<circle cx="${p.x}" cy="${p.y}" r="${0.7 + p.r * 1.8}" fill="${p.r > 0.8 ? '#66d9e8' : '#fff'}" opacity="${0.4 + p.r * 0.6}"/>`).join('');
  const shards = scatter(m, 10, 110, 331).map(p => `<path transform="translate(${p.x},${p.y}) rotate(${p.r * 60})" d="M0,-18 L10,0 L0,18 L-10,0 Z" fill="#3bc9db" opacity=".55"/>`).join('');
  return `<rect width="${MAP_W}" height="${MAP_H}" fill="#02030f"/>
    <ellipse cx="620" cy="320" rx="520" ry="200" fill="#0b7285" opacity=".25"/>
    <ellipse cx="300" cy="520" rx="260" ry="90" fill="#5f3dc4" opacity=".2"/>
    ${stars}${shards}${land('#1c2541', 130, 'opacity=".95"')}${land('#3a506b', 96)}`;
};

// ---------------- ワールドごとの背景 ----------------
function mapBackgroundSVG(w) {
  const m = WORLD_MAPS[w];
  const theme = m.theme;
  if (theme === 'grass') {
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

  if (NEW_WORLD_BG[theme]) return NEW_WORLD_BG[theme](m, land);

  if (theme === 'sea') {
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

  if (theme === 'snow') {
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
  const river = 'M0,660 C260,580 560,690 820,600 C960,560 1080,640 1200,600';
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
    this.openWorlds = this.openWorlds || new Set();

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

    // かくしステージの 道が はじめて 見つかった
    const hid = this.hidden();
    if (hid && !(Save.data.hiddenOpen || {})[hid.e.id] && this.unlockAnim == null) {
      (Save.data.hiddenOpen = Save.data.hiddenOpen || {})[hid.e.id] = Date.now(); Save.save();
      this.unlockAnim = 'hidden'; this.build();
    }
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
    if (this.pos === HID_POS) { if (!this.hidden()) this.pos = this.hidden() ? HID_POS : maxPos; return; }
    if (this.pos > maxPos) this.pos = maxPos;
  },

  saveSpot() {
    Save.data.mapWorld = this.world;
    Save.data.mapPos = this.pos;
    Save.save();
  },

  // この ワールドの かくしステージ (道が ひらいていれば)
  hidden() { const h = HIDDEN_DEFS.find(x => x.host === this.world); return h && hiddenOpen(h) ? h : null; },

  spotPos(pos) {
    const m = this.map();
    if (pos === HID_POS && this.hidden()) return hiddenLink(this.hidden()).pos;
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
    const hid = this.hidden();
    if (hid) roads += road(hiddenLink(hid).path, 'road-hidden', this.unlockAnim !== 'hidden');
    $('#map-svg').innerHTML = mapBackgroundSVG(this.world) + roads;

    const start = `<div class="node start" style="left:${m.start.x}px;top:${m.start.y}px">
      <div class="node-pad"></div><div class="node-flag">${this.world === 0 ? 'START' : '◀ もどる'}</div></div>`;
    const nodes = list.map((g, i) => {
      const e = ENEMIES[g];
      const p = m.nodes[i];
      const locked = g > this.cleared;
      const cleared = g < this.cleared;
      let icon;
      if (e.boss && (m.theme === 'grass' || m.theme === 'magma')) icon = castleSVG(m.theme === 'magma');
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
    let hnode = '';
    if (hid) {
      const he = ENEMIES[hid.idx], hp = hiddenLink(hid).pos, done = hiddenCleared(hid);
      hnode = `<div class="node hidden-node boss ${done ? 'cleared' : ''} ${this.unlockAnim === 'hidden' ? 'locked' : ''}" id="node-hidden" data-g="${hid.idx}" data-i="${HID_POS}" style="left:${hp.x}px;top:${hp.y}px">
        <div class="node-pad"></div><div class="node-icon">${enemySVG(he.id)}</div>
        ${done ? '<div class="node-star">★</div>' : ''}<div class="node-label">かくし ${he.name}</div></div>`;
    }
    $('#map-nodes').innerHTML = start + nodes + gate + hnode;
    $('#map-nodes').querySelectorAll('.node[data-g]').forEach(n => {
      n.onclick = () => { const g = +n.dataset.g; if (g <= this.cleared || ENEMIES[g].hidden) this.startBattle(g); };
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
        const here = w === this.world && i === this.pos;
        return `<div class="stage-card ${locked ? 'locked' : ''} ${cleared ? 'cleared' : ''} ${e.boss ? 'boss' : ''} ${here ? 'here' : ''}" data-g="${g}" title="${locked ? '' : 'クリックで このステージへ ワープ'}">
          ${key}
          <div class="st-sprite">${locked ? '<div class="lock">?</div>' : enemySVG(e.id)}</div>
          <div class="st-body">
            <div class="st-name">${locked ? '？？？' : e.name}${e.boss && !locked ? ' <span class="badge boss">BOSS</span>' : ''}</div>
            <div class="st-meta">${stageLabel(g)} ・ Lv.${e.lv} ・ お題 ${diffStars[e.diff]} ${warn}</div>
            <div class="st-desc">${locked ? 'まえのあいてをたおすと あらわれる' : e.desc}</div>
            ${locked ? '' : `<div class="st-ability">${e.abilityDesc}</div>`}
          </div>
          ${cleared ? '<div class="st-clear">CLEAR</div>' : ''}
          ${locked ? '' : `<div class="st-actions">${here ? '<span class="st-here">いまここ</span>' : '<span class="st-warp">ワープ</span>'}<button class="st-fight" data-g="${g}">たたかう</button></div>`}
        </div>`;
      }).join('');
      // ワールドごとに 折りたためる (最初は 今いるワールドだけ ひらく)
      const list = worldStages(w);
      const done = list.filter(g => g < this.cleared).length;
      const reached = list[0] <= this.cleared;
      const open = this.openWorlds.has(w);
      return `<div class="drawer-group ${open ? 'open' : ''} ${reached ? '' : 'far'}" data-w="${w}">
        <button class="drawer-world w-${wd.id}" data-w="${w}"><span class="dw-arrow">${open ? '▼' : '▶'}</span>ワールド ${w + 1}　${wd.name}
          <span class="dw-count">${reached ? `${done}/${list.length} クリア` : 'まだ いけない'}</span></button>
        <div class="drawer-cards">${cards}</div></div>`;
    }).join('');
    $('#stage-list').querySelectorAll('.drawer-world').forEach(b => {
      b.onclick = () => {
        const w = +b.dataset.w;
        if (this.openWorlds.has(w)) this.openWorlds.delete(w); else this.openWorlds.add(w);
        const g = b.parentElement;
        g.classList.toggle('open');
        b.querySelector('.dw-arrow').textContent = g.classList.contains('open') ? '▼' : '▶';
        SFX.select();
      };
    });
    // カードをクリック → そのステージへ ワープ / 「たたかう」→ すぐバトル
    $('#stage-list').querySelectorAll('.stage-card:not(.locked)').forEach(b => {
      b.onclick = () => this.warpTo(+b.dataset.g);
    });
    $('#stage-list').querySelectorAll('.st-fight').forEach(b => {
      b.onclick = ev => { ev.stopPropagation(); this.startBattle(+b.dataset.g); };
    });
  },

  toggleDrawer(force) {
    this.drawerOpen = force ?? !this.drawerOpen;
    $('#drawer').classList.toggle('open', this.drawerOpen);
    SFX.select();
    if (this.drawerOpen) {
      // 今いるワールドは かならず ひらいておく
      if (!this.openWorlds.has(this.world)) { this.openWorlds.add(this.world); this.buildDrawer(); }
      const cur = $('#stage-list').querySelector(`.drawer-group[data-w="${this.world}"]`);
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
    // かくしステージ: 道の ある マスから 行ける / かくしステージからは もどるだけ
    const hid = this.hidden();
    if (hid && this.unlockAnim !== 'hidden') {
      const L = hiddenLink(hid);
      if (this.pos === hid.from) ex[L.dir] = { to: HID_POS, pts: L.path };
      if (this.pos === HID_POS) { const back = L.path.slice().reverse(); return { [dirOf(back[0], back[1])]: { to: hid.from, pts: back } }; }
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
    if (this.pos === HID_POS && this.hidden()) {
      const h = this.hidden(), e = ENEMIES[h.idx];
      const reward = DOORS.find(d => d.hidden === h.e.id);
      $('#map-world').innerHTML = `${head} - <b>かくし</b>`;
      info.innerHTML = `<div class="mi-sprite">${enemySVG(e.id)}</div>
        <div class="mi-body">
          <div class="mi-name">${e.name} <small>Lv.${e.lv}</small> <span class="badge boss">かくし</span> ${hiddenCleared(h) ? '<span class="mi-clear">CLEAR</span>' : ''}</div>
          <div class="mi-desc">${e.abilityDesc}</div>
          ${reward ? `<div class="mi-low">たおすと「${reward.name}」が なかまに なる</div>` : ''}
          <div class="mi-go"><kbd>Space</kbd> で たたかう　難易度 <b style="color:${BATTLE_DIFFS[battleDiffKey()].color}">${BATTLE_DIFFS[battleDiffKey()].name}</b>・推奨 Lv.${e.lv}</div>
        </div>`;
      replayAnim(info, 'pop-in', 300);
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
    const bd = BATTLE_DIFFS[battleDiffKey()];
    const elv = diffEnemyLv(e); // 推奨レベル (難易度では かわらない)
    const gap = levelGapMult(elv, this.ch.L);
    const warn = this.ch.L < elv ? `<div class="mi-warn">レベルが たりないかも (推奨 Lv.${elv}・${bd.note})</div>`
      : gap < 0.8 ? `<div class="mi-low">格下の あいて: もらえる経験値 ×${gap.toFixed(2)}</div>` : '';
    info.innerHTML = `<div class="mi-sprite">${enemySVG(e.id)}</div>
      <div class="mi-body">
        <div class="mi-name">${e.name} <small>Lv.${elv}</small> ${e.boss ? '<span class="badge boss">BOSS</span>' : ''} ${cleared ? '<span class="mi-clear">CLEAR</span>' : ''} <span class="dmarks">${diffBadges(g)}</span></div>
        <div class="mi-desc">${e.abilityDesc}</div>${warn}
        <div class="mi-go"><kbd>Space</kbd> で たたかう　難易度 <b style="color:${BATTLE_DIFFS[battleDiffKey()].color}">${BATTLE_DIFFS[battleDiffKey()].name}</b>・推奨 Lv.${elv} <small>(<kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> で かえる)</small></div>
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
    const dust = { sea: ['#f4dfa6', '#fff'], snow: ['#fff', '#d0ebff'], magma: ['#ff7a1a', '#ffba08'], poison: ['#b197fc', '#8ce99a'],
      desert: ['#f1d7a0', '#fff'], candy: ['#ffc9de', '#fff'], rain: ['#a5d8ff', '#fff'], factory: ['#adb5bd', '#ffd43b'],
      sky: ['#fff', '#e7f5ff'], space: ['#b197fc', '#fff'] }[this.map().theme] || ['#e9d8a6', '#fff'];
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

  // ステージ一覧から そのステージへ ワープする
  warpTo(g) {
    if (g > this.cleared || this.moving) return;
    const e = ENEMIES[g];
    const pos = worldStages(e.world).indexOf(g);
    this.toggleDrawer(false);
    if (e.world !== this.world) { this.changeWorld(e.world, pos); return; }
    if (pos === this.pos) return;
    // 同じワールドの中: ぱっと消えて ぱっと現れる
    const pl = $('#map-player');
    const r1 = pl.getBoundingClientRect();
    FX.burst(r1.left + r1.width / 2, r1.top, { colors: ['#e0aaff', '#fff', '#74c0fc'], count: 24, shape: 'star', size: 6, speed: 5 });
    SFX.charge();
    this.pos = pos;
    this.saveSpot();
    this.placePlayer(this.spotPos(pos));
    replayAnim($('#map-player .sprite'), 'warp-in', 500);
    const r2 = pl.getBoundingClientRect();
    FX.burst(r2.left + r2.width / 2, r2.top, { colors: ['#e0aaff', '#fff', '#74c0fc'], count: 30, shape: 'star', size: 6, speed: 6 });
    FX.ring(r2.left + r2.width / 2, r2.top + 20, '#e0aaff', 70, 24, 5);
    this.updateInfo();
    this.buildDrawer();
  },

  // 敵をたおした直後: 次の道 (またはゲート) が少しずつ現れる
  playUnlock(k) {
    const isGate = k === 'gate', isHidden = k === 'hidden';
    const g = $(isGate ? '#road-gate' : isHidden ? '#road-hidden' : '#road-' + k);
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
      const node = $(isGate ? '#node-gate' : isHidden ? '#node-hidden' : '#node-' + k);
      if (node) {
        node.classList.remove('locked');
        const r = node.getBoundingClientRect();
        FX.burst(r.left + r.width / 2, r.top + r.height / 2 - 40, { colors: ['#ffd23f', '#fff', '#ff8fab'], count: 40, shape: 'star', size: 7, speed: 6 });
        SFX.levelup();
      }
      if (isHidden) { toast('❗ かくしステージへの みちが ひらいた！', 3000); SFX.win(); this.updateArrows(); return; }
      toast(isGate ? `ゲートが ひらいた！ ワールド ${this.world + 2}「${WORLDS[this.world + 1].name}」へ すすもう` : 'あたらしい みちが ひらけた！ WASD で すすもう', 2800);
      this.updateArrows();
    }, 1500);
  },

  startBattle(g) {
    const e = ENEMIES[g];
    if (g > this.cleared && !e.hidden) return;
    Save.data.mapWorld = e.hidden ? e.host : e.world;
    Save.data.mapPos = e.hidden ? HID_POS : worldStages(e.world).indexOf(g);
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
      if (n >= 1 && n <= list.length && list[n - 1] <= this.cleared) this.warpTo(list[n - 1]);
      if (e.key === 'Escape') this.toggleDrawer(false);
      return;
    }
    if (e.key === 'Escape') { App.show('home'); return; }
    const dn = parseInt(e.key, 10);
    if (dn >= 1 && dn <= BATTLE_DIFF_KEYS.length) { setBattleDiff(BATTLE_DIFF_KEYS[dn - 1]); this.updateInfo(); return; }
    if (KEY_DIR[k]) { this.held.add(k); e.preventDefault(); this.tryMove(KEY_DIR[k]); return; }
    if ((e.key === ' ' || e.key === 'Enter') && !this.moving && this.pos === HID_POS && this.hidden()) { this.startBattle(this.hidden().idx); return; }
    if ((e.key === ' ' || e.key === 'Enter') && !this.moving && this.pos >= 0 && this.pos < this.stages().length) {
      this.startBattle(this.stages()[this.pos]);
    }
  },

  onKeyUp(e) { this.held.delete(e.key.toLowerCase()); },
  onBlur() { this.held.clear(); },
};
