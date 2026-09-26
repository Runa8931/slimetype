// ============================================================
//  キャラクター・敵の絵 (SVG)
//  スライムはレベルで進化し、アクセサリーやオーラが増える
// ============================================================

let _svgUid = 0;

// look: きせかえ ({ colors, rainbow, hat, stars })。わたさないときは そのキャラが 今 きているもの
function slimeSVG(id, stage = 0, look) {
  const def = CHARACTERS[id];
  if (look === undefined) look = typeof slimeLook === 'function' && Save.data ? slimeLook(id) : {};
  look = look || {};
  const c = look.colors || (def.stageColors && def.stageColors[stage]) || def.colors;
  const u = 's' + (++_svgUid);

  // 体の形 (進化すると少し形も変わる)
  const bodies = {
    purun: [
      'M60,22 C66,34 84,44 96,62 C108,78 108,100 88,104 L32,104 C12,100 12,78 24,62 C36,44 54,34 60,22 Z',
      'M60,16 C70,30 92,40 104,60 C116,80 114,102 90,105 L30,105 C6,102 4,80 16,60 C28,40 50,30 60,16 Z',
      'M60,16 C70,30 92,40 104,60 C116,80 114,102 90,105 L30,105 C6,102 4,80 16,60 C28,40 50,30 60,16 Z',
    ],
    piriri: [
      'M60,30 C88,30 104,56 106,80 C108,98 96,104 84,104 L36,104 C24,104 12,98 14,80 C16,56 32,30 60,30 Z',
      'M60,28 C90,28 108,54 110,80 C112,100 98,105 84,105 L36,105 C22,105 8,100 10,80 C12,54 30,28 60,28 Z',
      'M60,28 C90,28 108,54 110,80 C112,100 98,105 84,105 L36,105 C22,105 8,100 10,80 C12,54 30,28 60,28 Z',
    ],
    homura: [
      'M60,16 C64,30 76,26 78,40 C92,42 106,62 106,80 C108,98 96,104 84,104 L36,104 C24,104 12,98 14,80 C14,62 26,48 38,44 C38,30 52,34 60,16 Z',
      'M60,8 C66,26 80,20 82,38 C98,40 110,62 110,80 C112,100 98,105 84,105 L36,105 C22,105 8,100 10,80 C10,60 22,46 36,42 C34,26 50,30 60,8 Z',
      'M60,8 C66,26 80,20 82,38 C98,40 110,62 110,80 C112,100 98,105 84,105 L36,105 C22,105 8,100 10,80 C10,60 22,46 36,42 C34,26 50,30 60,8 Z',
    ],
    moririn: [
      'M60,34 C92,34 108,58 108,80 C108,98 96,104 84,104 L36,104 C24,104 12,98 12,80 C12,58 28,34 60,34 Z',
      'M60,30 C94,30 112,56 112,80 C112,100 98,105 84,105 L36,105 C22,105 8,100 8,80 C8,56 26,30 60,30 Z',
      'M60,30 C94,30 112,56 112,80 C112,100 98,105 84,105 L36,105 C22,105 8,100 8,80 C8,56 26,30 60,30 Z',
    ],
    kagemaru: [
      'M60,30 C88,30 104,56 106,80 C108,98 96,104 84,104 L36,104 C24,104 12,98 14,80 C16,56 32,30 60,30 Z',
      'M60,26 C90,26 108,54 110,80 C112,100 98,105 84,105 L36,105 C22,105 8,100 10,80 C12,54 30,26 60,26 Z',
      'M60,26 C90,26 108,54 110,80 C112,100 98,105 84,105 L36,105 C22,105 8,100 10,80 C12,54 30,26 60,26 Z',
    ],
    ryumaru: [
      'M60,30 C86,30 102,52 106,76 C110,98 96,104 84,104 L36,104 C24,104 10,98 14,76 C18,52 34,30 60,30 Z',
      'M60,28 C90,28 106,52 110,78 C114,100 98,105 84,105 L36,105 C22,105 6,100 10,78 C14,52 30,28 60,28 Z',
      'M60,28 C90,28 106,52 110,78 C114,100 98,105 84,105 L36,105 C22,105 6,100 10,78 C14,52 30,28 60,28 Z',
    ],
    kirari: [
      'M60,32 C90,32 106,56 106,80 C106,98 94,104 82,104 L38,104 C26,104 14,98 14,80 C14,56 30,32 60,32 Z',
      'M60,28 C92,28 110,54 110,80 C110,100 96,105 82,105 L38,105 C24,105 10,100 10,80 C10,54 28,28 60,28 Z',
      'M60,28 C92,28 110,54 110,80 C110,100 96,105 82,105 L38,105 C24,105 10,100 10,80 C10,54 28,28 60,28 Z',
    ],
    gotsun: [
      'M30,44 L50,32 L74,34 L94,48 L104,74 L100,100 L86,104 L34,104 L18,100 L16,72 Z',
      'M26,42 L48,28 L76,30 L98,46 L110,74 L104,102 L88,106 L32,106 L14,102 L10,72 Z',
      'M26,42 L48,28 L76,30 L98,46 L110,74 L104,102 L88,106 L32,106 L14,102 L10,72 Z',
    ],
  };

  let behind = '';
  let front = '';
  let mid = ''; // 体の上・目の下 (かげまるの ずきん など)

  // ---- 種類ごとの基本の飾り ----
  if (id === 'purun') {
    front += `<circle cx="38" cy="84" r="5" fill="#ff9ab0" opacity=".6"/><circle cx="82" cy="84" r="5" fill="#ff9ab0" opacity=".6"/>`;
  }
  if (id === 'piriri') {
    const horn = stage >= 1
      ? ['M44,34 L28,4 L44,14 L36,-8', 'M76,34 L92,4 L76,14 L84,-8']
      : ['M44,36 L34,10 L46,18 L42,4', 'M76,36 L86,10 L74,18 L78,4'];
    behind += horn.map(d => `<path d="${d}" fill="none" stroke="${c.dark}" stroke-width="${stage >= 1 ? 6 : 5}" stroke-linejoin="round" stroke-linecap="round"/>`).join('');
    front += `<path d="M16,84 L6,90 L14,92 L4,100" fill="none" stroke="${c.dark}" stroke-width="3" stroke-linecap="round"/>
              <circle cx="36" cy="80" r="6" fill="#ff8a7a" opacity=".7"/><circle cx="84" cy="80" r="6" fill="#ff8a7a" opacity=".7"/>`;
  }
  if (id === 'gotsun') {
    front += `<path d="M30,50 L42,46 L40,56 Z" fill="${c.dark}" opacity=".45"/>
              <path d="M82,52 L94,58 L86,64 Z" fill="${c.dark}" opacity=".45"/>
              <path d="M22,88 L34,84 L30,96 Z" fill="${c.dark}" opacity=".35"/>
              <path d="M70,92 L84,88 L80,100 Z" fill="${c.dark}" opacity=".35"/>`;
  }

  if (id === 'homura') {
    front += `<circle cx="36" cy="84" r="5" fill="#ff8787" opacity=".7"/><circle cx="84" cy="84" r="5" fill="#ff8787" opacity=".7"/>
      <path d="M52,50 C54,42 60,40 60,32 C64,40 68,44 66,52 Z" fill="${c.accent}" opacity=".85"/>`;
    if (stage >= 1) behind += `<g class="spark"><path d="M18,52 C14,40 24,36 22,26 C30,34 32,44 26,52 Z" fill="${c.accent}"/><path d="M102,52 C106,40 96,36 98,26 C90,34 88,44 94,52 Z" fill="${c.accent}"/></g>`;
  }
  if (id === 'moririn') {
    behind += `<path d="M60,36 C60,26 62,18 66,12" stroke="#2b8a3e" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M64,18 C72,4 94,6 96,14 C86,22 72,24 64,18 Z" fill="#69db7c" stroke="#2b8a3e" stroke-width="2.5"/>
      <path d="M62,22 C54,8 34,10 32,18 C42,26 56,28 62,22 Z" fill="#8ce99a" stroke="#2b8a3e" stroke-width="2.5"/>`;
    front += `<circle cx="36" cy="84" r="5" fill="#ffa8a8" opacity=".6"/><circle cx="84" cy="84" r="5" fill="#ffa8a8" opacity=".6"/>`;
    if (stage >= 1) front += `<g transform="translate(96,50)"><circle r="7" fill="#fff"/>${[0, 72, 144, 216, 288].map(a => `<circle cx="${Math.cos(a * Math.PI / 180) * 7}" cy="${Math.sin(a * Math.PI / 180) * 7}" r="4.5" fill="${c.accent}"/>`).join('')}<circle r="3.5" fill="#ffd43b"/></g>`;
  }
  if (id === 'kagemaru') {
    // にんじゃの ずきん と マフラー
    mid += `<path d="M18,62 C30,56 90,56 104,62 L104,80 C90,76 30,76 16,80 Z" fill="#1a1a2e" opacity=".92"/>
      <ellipse cx="46" cy="70" rx="10" ry="7" fill="#fff"/><ellipse cx="74" cy="70" rx="10" ry="7" fill="#fff"/>`;
    behind += `<path d="M100,70 C118,66 126,78 122,92 C116,84 108,84 100,86 Z" fill="${c.accent}" stroke="${c.dark}" stroke-width="2"/>`;
    front += `<path d="M24,92 C44,100 76,100 96,92 L94,100 C74,108 46,108 26,100 Z" fill="${c.accent}"/>`;
    if (stage >= 1) front += `<g transform="translate(18,40) rotate(-20)"><path d="M0,-10 L3,-3 L10,0 L3,3 L0,10 L-3,3 L-10,0 L-3,-3 Z" fill="#dee2e6" stroke="#495057" stroke-width="1.5"/><circle r="2" fill="#495057"/></g>`;
  }

  if (id === 'ryumaru') {
    // つの・しっぽ・おなか・きば
    const hornPath = stage >= 1 ? ['M42,36 C34,24 30,12 34,0 C40,14 48,24 52,32 Z', 'M78,36 C86,24 90,12 86,0 C80,14 72,24 68,32 Z']
      : ['M44,36 L36,16 L52,31 Z', 'M76,36 L84,16 L68,31 Z'];
    behind += hornPath.map(d => `<path d="${d}" fill="#fff3bf" stroke="${c.dark}" stroke-width="2.5" stroke-linejoin="round"/>`).join('');
    behind += `<path d="M98,92 C114,92 120,82 124,70 L130,78 L122,80 C118,94 108,102 96,100 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="2.5" stroke-linejoin="round"/>`;
    front += `<ellipse cx="60" cy="99" rx="22" ry="5" fill="${c.light}" opacity=".7"/>
      <path d="M55,88 L57,93 L59,88 Z" fill="#fff"/>
      <circle cx="36" cy="82" r="5" fill="#ff8787" opacity=".55"/><circle cx="84" cy="82" r="5" fill="#ff8787" opacity=".55"/>`;
    if (stage >= 1) behind += [[40, 36], [60, 30], [80, 36]].map(([x, y]) => `<path d="M${x - 6},${y + 4} L${x},${y - 10} L${x + 6},${y + 4} Z" fill="${c.accent}" stroke="${c.dark}" stroke-width="2"/>`).join('');
  }
  if (id === 'kirari') {
    // ほしの アンテナと きらきら
    behind += `<path d="M60,34 C58,26 60,18 62,12" stroke="${c.dark}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <g transform="translate(62,8)" class="spark-soft"><path d="M0,-11 L3.2,-3.4 L11,-3.4 L4.8,1.8 L7,10 L0,5.2 L-7,10 L-4.8,1.8 L-11,-3.4 L-3.2,-3.4 Z" fill="${c.accent}" stroke="${c.dark}" stroke-width="2" stroke-linejoin="round"/></g>`;
    front += `<circle cx="36" cy="84" r="5" fill="#ff8fab" opacity=".7"/><circle cx="84" cy="84" r="5" fill="#ff8fab" opacity=".7"/>
      <path d="M20,50 L22,56 L28,58 L22,60 L20,66 L18,60 L12,58 L18,56 Z" fill="#fff" class="spark"/>`;
    if (stage >= 1) front += `<g class="orbit">${[[8, 40, 5], [112, 46, 6], [104, 22, 4]].map(([x, y, r]) =>
      `<path transform="translate(${x},${y}) scale(${r / 10})" d="M0,-11 L3.2,-3.4 L11,-3.4 L4.8,1.8 L7,10 L0,5.2 L-7,10 L-4.8,1.8 L-11,-3.4 L-3.2,-3.4 Z" fill="${c.accent}" stroke="${c.dark}" stroke-width="2"/>`).join('')}</g>`;
  }

  // ---- 1 段階目の進化: 見た目がはっきり変わる飾り ----
  if (stage >= 1) {
    if (id === 'purun') {
      // 頭のしずくがくるんと巻き、体に波もよう、しずくが周りを回る
      behind += `<path d="M60,18 C54,6 66,-2 72,6 C76,12 70,18 64,14" fill="none" stroke="${c.dark}" stroke-width="4" stroke-linecap="round"/>`;
      front += `<path d="M14,78 C26,70 36,86 48,78 C60,70 70,86 82,78 C92,72 100,80 106,78" fill="none" stroke="#fff" stroke-width="4" opacity=".45" stroke-linecap="round"/>
        <g class="orbit"><circle cx="10" cy="44" r="7" fill="${c.accent}" stroke="${c.dark}" stroke-width="2"/>
        <circle cx="110" cy="38" r="6" fill="${c.accent}" stroke="${c.dark}" stroke-width="2"/>
        <circle cx="114" cy="62" r="4.5" fill="${c.accent}" stroke="${c.dark}" stroke-width="2"/></g>`;
    }
    if (id === 'piriri') {
      // 体にいなずまのしまもよう + 火花
      front += `<path d="M20,64 L34,58 L30,70 L46,64" fill="none" stroke="${c.dark}" stroke-width="4" stroke-linejoin="round" opacity=".7"/>
        <path d="M100,64 L86,58 L90,70 L74,64" fill="none" stroke="${c.dark}" stroke-width="4" stroke-linejoin="round" opacity=".7"/>
        <path d="M104,36 L114,26 L110,38 L120,32" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" class="spark"/>
        <path d="M16,36 L6,26 L10,38 L0,32" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" class="spark"/>`;
    }
    if (id === 'gotsun') {
      // 背中に水晶が生え、頭にこけ
      behind += `<path d="M34,34 L28,8 L44,28 Z" fill="${c.accent}" stroke="${c.dark}" stroke-width="2"/>
        <path d="M86,36 L96,10 L98,40 Z" fill="${c.accent}" stroke="${c.dark}" stroke-width="2"/>
        <path d="M58,30 L62,2 L70,30 Z" fill="${c.accent}" stroke="${c.dark}" stroke-width="2"/>`;
      if (stage === 1) {
        front += `<path d="M40,34 C46,24 58,22 62,30 C68,22 80,26 82,36 C70,32 52,32 40,34 Z" fill="#6fcf6a"/>`;
      }
    }
  }

  // ---- 最終進化: 王冠 + オーラ ----
  if (stage >= 2) {
    const crownY = { purun: -6, piriri: 6, gotsun: 8, homura: -8, moririn: 2, kagemaru: 4, ryumaru: 6, kirari: 8 }[id] ?? 6;
    // ぼうしを かぶっているときは 王冠を はずす
    if (!look.hat) front += `<g transform="translate(60,${crownY})">
      <path d="M-20,18 L-22,0 L-11,9 L0,-6 L11,9 L22,0 L20,18 Z" fill="#ffd54a" stroke="#b8860b" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="0" cy="10" r="3.8" fill="#ff4d6d"/><circle cx="-12" cy="12" r="2.6" fill="#4dd2ff"/><circle cx="12" cy="12" r="2.6" fill="#6dff8a"/>
    </g>`;
    if (id === 'piriri') {
      behind += `<ellipse cx="60" cy="68" rx="62" ry="50" fill="none" stroke="${c.accent}" stroke-width="3" stroke-dasharray="10 8" class="orbit" opacity=".8"/>`;
    }
    if (id === 'gotsun') {
      front += `<circle cx="36" cy="16" r="3" fill="#fff" class="spark"/><circle cx="92" cy="20" r="3" fill="#fff" class="spark"/>`;
    }
  }

  // ---- 4 段階目 (Lv60〜): つばさ / 5 段階目 (Lv80〜): 光の輪 ----
  if (stage >= 3) {
    const wing = (sx) => `<g transform="translate(60,62) scale(${sx},1)">
      <path d="M22,-4 C44,-34 76,-38 84,-20 C70,-20 64,-12 74,-4 C60,-6 54,2 62,10 C48,8 38,10 26,14 Z" fill="${c.accent}" stroke="${c.dark}" stroke-width="2.5" stroke-linejoin="round" opacity=".95"/>
      <path d="M34,0 C50,-20 66,-24 76,-18 M36,6 C50,-4 60,-6 68,-4" fill="none" stroke="${c.dark}" stroke-width="1.5" opacity=".6"/></g>`;
    behind = wing(1) + wing(-1) + behind;
  }
  if (stage >= 4) {
    front += `<ellipse cx="60" cy="${id === 'purun' ? -14 : -4}" rx="24" ry="6" fill="none" stroke="#ffe066" stroke-width="4" class="spark-soft"/>
      <circle cx="16" cy="96" r="3" fill="#fff" class="spark"/><circle cx="106" cy="30" r="2.5" fill="#fff" class="spark"/>`;
  }

  // ---- きせかえ: ぼうし ----
  if (look.hat && HAT_SVG[look.hat]) {
    const h = HAT_SVG[look.hat];
    const top = (HEAD_TOP[id] || [30, 28])[Math.min(stage, 1)];
    front += h.eyes ? `<g transform="translate(60,71)">${h.draw(c)}</g>` : `<g transform="translate(60,${top + 5})">${h.draw(c)}</g>`;
  }

  // ---- せんざいかくせい: ★ の数だけ 足もとが かがやく ----
  let awaken = '';
  const n = look.stars || 0;
  if (n >= 1) {
    awaken += `<ellipse cx="60" cy="109" rx="${44 + n * 5}" ry="${8 + n}" fill="none" stroke="#ffd43b" stroke-width="${1.5 + n * 0.7}" opacity=".75" class="spark-soft"/>`;
    if (n >= 4) awaken = `<ellipse cx="60" cy="70" rx="64" ry="54" fill="url(#${u}-rb)" opacity=".45" class="spark-soft"/>` + awaken;
  }
  if (n >= 3) {
    front += `<path d="M112,86 L114,92 L120,94 L114,96 L112,102 L110,96 L104,94 L110,92 Z" fill="#ffd43b" class="spark"/>
      <path d="M6,40 L8,45 L13,47 L8,49 L6,54 L4,49 L-1,47 L4,45 Z" fill="#fff3bf" class="spark"/>`;
  }

  const aura = stage >= 2
    ? `<ellipse class="aura" cx="60" cy="72" rx="58" ry="48" fill="url(#${u}-aura)"/>` : '';
  // にじいろ: 体を なないろの グラデーションで ぬる
  const bodyGrad = look.rainbow
    ? `<linearGradient id="${u}-g" x1="0" y1="0" x2="1" y2="1">${RAINBOW.map((col, i) => `<stop offset="${i / (RAINBOW.length - 1) * 100}%" stop-color="${col}"/>`).join('')}</linearGradient>`
    : `<radialGradient id="${u}-g" cx="40%" cy="35%" r="75%">
        <stop offset="0%" stop-color="${c.light}"/><stop offset="55%" stop-color="${c.main}"/><stop offset="100%" stop-color="${c.dark}"/>
      </radialGradient>`;

  return `<svg viewBox="${stage >= 3 ? '-30 -24 180 144' : '-6 -14 132 134'}" class="slime slime-${id} stage-${stage}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      ${bodyGrad}
      <radialGradient id="${u}-aura"><stop offset="0%" stop-color="${c.accent}" stop-opacity=".6"/><stop offset="100%" stop-color="${c.accent}" stop-opacity="0"/></radialGradient>
      ${n >= 4 ? `<radialGradient id="${u}-rb"><stop offset="0%" stop-color="#fff3bf" stop-opacity=".9"/><stop offset="60%" stop-color="#ffd43b" stop-opacity=".5"/><stop offset="100%" stop-color="#ff8fab" stop-opacity="0"/></radialGradient>` : ''}
    </defs>
    ${awaken}
    ${aura}
    <ellipse cx="60" cy="109" rx="46" ry="7" fill="#000" opacity=".25"/>
    <g class="body">
      ${behind}
      <path d="${bodies[id][Math.min(stage, 2)]}" fill="url(#${u}-g)" stroke="${c.dark}" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="40" cy="56" rx="9" ry="5" fill="#fff" opacity=".7" transform="rotate(-30 40 56)"/>
      <circle cx="30" cy="66" r="3" fill="#fff" opacity=".6"/>
      ${mid}
      <g class="eyes">
        <ellipse cx="46" cy="72" rx="6" ry="8" fill="#1d1d2b"/><ellipse cx="74" cy="72" rx="6" ry="8" fill="#1d1d2b"/>
        <circle cx="48" cy="69" r="2.4" fill="#fff"/><circle cx="76" cy="69" r="2.4" fill="#fff"/>
      </g>
      <path d="M52,86 Q60,94 68,86" fill="none" stroke="#1d1d2b" stroke-width="3" stroke-linecap="round"/>
      ${front}
    </g>
  </svg>`;
}

const RAINBOW = ['#ff6b6b', '#ffa94d', '#ffe066', '#69db7c', '#4dabf7', '#9775fa', '#f783ac'];

// 頭の てっぺんの 高さ [最初の すがた, 進化後]。ぼうしの 位置に つかう
const HEAD_TOP = { purun: [22, 16], piriri: [30, 28], gotsun: [32, 28], homura: [30, 24], moririn: [34, 30], kagemaru: [30, 26], ryumaru: [30, 28], kirari: [32, 28] };

// ぼうし・アクセサリーの絵 (下のはしが y=0。eyes は 目の 高さに つける)
const HAT_SVG = {
  ribbon: { draw: () => `<g transform="translate(18,6) rotate(15)"><path d="M0,0 L-15,-10 L-13,10 Z" fill="#ff6b9d" stroke="#c2255c" stroke-width="2" stroke-linejoin="round"/><path d="M0,0 L15,-10 L13,10 Z" fill="#ff6b9d" stroke="#c2255c" stroke-width="2" stroke-linejoin="round"/><circle r="4.5" fill="#ff8fab" stroke="#c2255c" stroke-width="2"/></g>` },
  hachimaki: { draw: () => `<path d="M-27,10 Q0,2 27,10 L27,17 Q0,9 -27,17 Z" fill="#fff" stroke="#adb5bd" stroke-width="1.5"/><circle cx="0" cy="9" r="4" fill="#e03131"/><path d="M26,12 C34,10 40,16 44,12 M26,15 C34,18 38,24 44,22" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>` },
  beret: { draw: () => `<ellipse cx="4" cy="-3" rx="25" ry="9" fill="#e03131" stroke="#862e2e" stroke-width="2"/><path d="M4,-12 L6,-18" stroke="#862e2e" stroke-width="3" stroke-linecap="round"/>` },
  sprout: { draw: () => `<path d="M0,4 L0,-12" stroke="#2b8a3e" stroke-width="3" stroke-linecap="round"/><path d="M0,-11 C-4,-23 -18,-23 -20,-17 C-12,-11 -6,-9 0,-11 Z" fill="#69db7c" stroke="#2b8a3e" stroke-width="2"/><path d="M0,-12 C4,-24 18,-24 20,-18 C12,-12 6,-10 0,-12 Z" fill="#8ce99a" stroke="#2b8a3e" stroke-width="2"/>` },
  witch: { draw: () => `<path d="M-18,-2 C-10,-20 -4,-40 8,-50 C6,-36 10,-18 18,-2 Z" fill="#6741d9" stroke="#2b1a4a" stroke-width="2.5" stroke-linejoin="round"/><ellipse cx="0" cy="0" rx="32" ry="6.5" fill="#5f3dc4" stroke="#2b1a4a" stroke-width="2.5"/><path d="M-16,-6 L16,-6 L17,-1 L-17,-1 Z" fill="#ffd43b"/><path d="M6,-26 L8,-21 L13,-21 L9,-18 L10,-13 L6,-16 L2,-13 L3,-18 L-1,-21 L4,-21 Z" fill="#ffe066"/>` },
  straw: { draw: () => `<ellipse cx="0" cy="0" rx="34" ry="8" fill="#f5d17a" stroke="#b8860b" stroke-width="2"/><path d="M-16,-1 C-16,-20 16,-20 16,-1 Z" fill="#fce38a" stroke="#b8860b" stroke-width="2"/><path d="M-16,-5 L16,-5 L16,-1 L-16,-1 Z" fill="#e03131"/>` },
  cat: { draw: c => `<path d="M-30,10 L-24,-16 L-8,2 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="2.5" stroke-linejoin="round"/><path d="M-25,4 L-22,-8 L-14,1 Z" fill="#ffa8c5"/><path d="M30,10 L24,-16 L8,2 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="2.5" stroke-linejoin="round"/><path d="M25,4 L22,-8 L14,1 Z" fill="#ffa8c5"/>` },
  shades: { eyes: true, draw: () => `<path d="M-26,-8 L-4,-8 L-6,4 C-8,9 -22,9 -24,4 Z M26,-8 L4,-8 L6,4 C8,9 22,9 24,4 Z" fill="#111" stroke="#000" stroke-width="1.5"/><path d="M-4,-6 L4,-6" stroke="#000" stroke-width="3"/><path d="M-21,-5 L-15,-5" stroke="#fff" stroke-width="2" opacity=".7" stroke-linecap="round"/><path d="M9,-5 L15,-5" stroke="#fff" stroke-width="2" opacity=".7" stroke-linecap="round"/>` },
  tiara: { draw: () => `<path d="M-22,2 L-17,-10 L-9,-3 L0,-18 L9,-3 L17,-10 L22,2 Z" fill="#e9ecef" stroke="#868e96" stroke-width="2" stroke-linejoin="round"/><circle cx="0" cy="-8" r="3.8" fill="#f783ac"/><circle cx="-13" cy="-3" r="2.4" fill="#74c0fc"/><circle cx="13" cy="-3" r="2.4" fill="#74c0fc"/><circle cx="0" cy="-18" r="2" fill="#fff" class="spark"/>` },
  pirate: { draw: () => `<path d="M-34,2 C-24,-30 24,-30 34,2 C20,-4 -20,-4 -34,2 Z" fill="#212529" stroke="#000" stroke-width="2"/><path d="M-30,-2 C-18,-8 18,-8 30,-2" stroke="#ffd43b" stroke-width="2.5" fill="none"/><circle cx="0" cy="-16" r="5" fill="#fff"/><path d="M-7,-8 L7,-3 M7,-8 L-7,-3" stroke="#fff" stroke-width="2"/><circle cx="-2" cy="-17" r="1.3" fill="#000"/><circle cx="2" cy="-17" r="1.3" fill="#000"/>` },
  starcrown: { draw: () => `<path d="M-24,2 L-26,-18 L-13,-8 L0,-26 L13,-8 L26,-18 L24,2 Z" fill="#ffd43b" stroke="#b8860b" stroke-width="2.5" stroke-linejoin="round"/>${[[-26, -18, 5], [0, -26, 7], [26, -18, 5]].map(([x, y, r]) => `<path transform="translate(${x},${y - r}) scale(${r / 10})" d="M0,-11 L3.2,-3.4 L11,-3.4 L4.8,1.8 L7,10 L0,5.2 L-7,10 L-4.8,1.8 L-11,-3.4 L-3.2,-3.4 Z" fill="#fff3bf" stroke="#e67700" stroke-width="2.5"/>`).join('')}<circle cx="0" cy="-6" r="4" fill="#4dabf7"/><circle cx="-14" cy="-3" r="2.6" fill="#ff6b6b"/><circle cx="14" cy="-3" r="2.6" fill="#69db7c"/><circle cx="-30" cy="-30" r="2.4" fill="#fff" class="spark"/><circle cx="30" cy="-34" r="2" fill="#fff" class="spark"/>` },
  kabuto: { draw: () => `<path d="M-28,6 C-28,-24 28,-24 28,6 L22,6 C22,-14 -22,-14 -22,6 Z" fill="#343a40" stroke="#000" stroke-width="2"/><path d="M-28,2 L-36,10 L-24,8 Z M28,2 L36,10 L24,8 Z" fill="#495057" stroke="#000" stroke-width="1.5"/><path d="M-4,-14 C-12,-26 -22,-40 -20,-52 C-14,-40 -6,-30 2,-18 M4,-14 C12,-26 22,-40 20,-52 C14,-40 6,-30 -2,-18" fill="#ffd43b" stroke="#b8860b" stroke-width="2" stroke-linejoin="round"/><circle cx="0" cy="-15" r="6" fill="#ffd43b" stroke="#b8860b" stroke-width="2"/><circle cx="0" cy="-15" r="2.5" fill="#e03131"/>` },
};

// SVG 文字列をキャンバスで描ける画像に変換する
function svgToImage(svg) {
  const img = new Image();
  const s = svg.includes('xmlns=') ? svg : svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  return img;
}

// ---------------- 敵 ----------------
const ENEMY_SVG = {
  bat: () => `<svg viewBox="0 0 160 120" class="enemy-svg">
    <ellipse cx="80" cy="112" rx="30" ry="5" fill="#000" opacity=".25"/>
    <g class="float">
      <g class="wing wing-l"><path d="M64,56 C50,30 24,24 4,40 C14,44 18,54 14,64 C24,58 34,62 40,72 C48,62 58,62 66,68 Z" fill="#4a2f7a" stroke="#2b1a4a" stroke-width="2"/></g>
      <g class="wing wing-r"><path d="M96,56 C110,30 136,24 156,40 C146,44 142,54 146,64 C136,58 126,62 120,72 C112,62 102,62 94,68 Z" fill="#4a2f7a" stroke="#2b1a4a" stroke-width="2"/></g>
      <path d="M66,44 L60,22 L74,38 Z M94,44 L100,22 L86,38 Z" fill="#6d4aa8" stroke="#2b1a4a" stroke-width="2"/>
      <ellipse cx="80" cy="60" rx="24" ry="22" fill="#6d4aa8" stroke="#2b1a4a" stroke-width="2.5"/>
      <ellipse cx="80" cy="68" rx="14" ry="10" fill="#8c6cc4"/>
      <ellipse cx="71" cy="55" rx="5" ry="6" fill="#ffe14d"/><ellipse cx="89" cy="55" rx="5" ry="6" fill="#ffe14d"/>
      <circle cx="70" cy="56" r="2.2" fill="#c0162c"/><circle cx="88" cy="56" r="2.2" fill="#c0162c"/>
      <path d="M72,68 Q80,74 88,68" fill="none" stroke="#2b1a4a" stroke-width="2"/>
      <path d="M74,69 L76,75 L78,70 Z M82,70 L84,75 L86,69 Z" fill="#fff"/>
    </g></svg>`,

  mush: () => `<svg viewBox="0 0 140 140" class="enemy-svg">
    <ellipse cx="70" cy="130" rx="38" ry="6" fill="#000" opacity=".25"/>
    <g class="squish">
      <path d="M44,70 C40,94 38,118 46,126 L94,126 C102,118 100,94 96,70 Z" fill="#f3e2c3" stroke="#8a6a44" stroke-width="3"/>
      <path d="M12,72 C10,32 42,12 70,12 C98,12 130,32 128,72 C110,82 30,82 12,72 Z" fill="#d93b3b" stroke="#7a1a1a" stroke-width="3"/>
      <circle cx="44" cy="40" r="8" fill="#fff" opacity=".9"/><circle cx="80" cy="28" r="6" fill="#fff" opacity=".9"/>
      <circle cx="104" cy="50" r="9" fill="#fff" opacity=".9"/><circle cx="66" cy="56" r="5" fill="#fff" opacity=".9"/>
      <circle cx="26" cy="62" r="4" fill="#fff" opacity=".9"/>
      <path d="M52,88 L64,93 M88,88 L76,93" stroke="#3b2a1a" stroke-width="3" stroke-linecap="round"/>
      <circle cx="59" cy="99" r="4.5" fill="#3b2a1a"/><circle cx="81" cy="99" r="4.5" fill="#3b2a1a"/>
      <path d="M62,112 Q70,106 78,112" fill="none" stroke="#3b2a1a" stroke-width="3" stroke-linecap="round"/>
      <circle cx="112" cy="90" r="4" fill="#a4e06a" opacity=".8" class="bubble"/><circle cx="120" cy="80" r="3" fill="#a4e06a" opacity=".7" class="bubble b2"/>
    </g></svg>`,

  ghost: () => `<svg viewBox="0 0 140 140" class="enemy-svg">
    <ellipse cx="70" cy="132" rx="30" ry="5" fill="#000" opacity=".2"/>
    <g class="float ghostly">
      <path d="M28,118 L28,60 C28,30 48,14 70,14 C92,14 112,30 112,60 L112,118 L102,108 L92,118 L81,108 L70,118 L59,108 L48,118 L38,108 Z" fill="#eef1ff" stroke="#8a90c4" stroke-width="3" stroke-linejoin="round" opacity=".92"/>
      <path d="M28,74 C16,78 12,70 14,62 C22,66 26,64 28,62 Z M112,74 C124,78 128,70 126,62 C118,66 114,64 112,62 Z" fill="#eef1ff" stroke="#8a90c4" stroke-width="2.5"/>
      <ellipse cx="56" cy="56" rx="7" ry="10" fill="#26264a"/><ellipse cx="84" cy="56" rx="7" ry="10" fill="#26264a"/>
      <circle cx="58" cy="52" r="2.5" fill="#fff"/><circle cx="86" cy="52" r="2.5" fill="#fff"/>
      <ellipse cx="70" cy="82" rx="8" ry="10" fill="#26264a"/>
      <circle cx="44" cy="70" r="5" fill="#c9b8ff" opacity=".6"/><circle cx="96" cy="70" r="5" fill="#c9b8ff" opacity=".6"/>
    </g></svg>`,

  goblin: () => `<svg viewBox="0 0 150 150" class="enemy-svg">
    <ellipse cx="75" cy="142" rx="40" ry="6" fill="#000" opacity=".25"/>
    <g class="squish">
      <g class="club"><path d="M20,120 L34,64" stroke="#6b4423" stroke-width="7" stroke-linecap="round"/>
        <ellipse cx="36" cy="56" rx="12" ry="18" fill="#8a5a2b" stroke="#4a2c12" stroke-width="3" transform="rotate(15 36 56)"/>
        <circle cx="30" cy="50" r="2.5" fill="#4a2c12"/><circle cx="40" cy="62" r="2.5" fill="#4a2c12"/></g>
      <path d="M48,96 L102,96 L110,138 L40,138 Z" fill="#7a5230" stroke="#3e2912" stroke-width="3" stroke-linejoin="round"/>
      <path d="M40,110 C30,112 26,118 30,124" stroke="#5aa845" stroke-width="10" stroke-linecap="round" fill="none"/>
      <path d="M40,58 L6,40 L30,70 Z M110,58 L144,40 L120,70 Z" fill="#5aa845" stroke="#2c5a20" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="75" cy="66" rx="38" ry="34" fill="#6cc152" stroke="#2c5a20" stroke-width="3"/>
      <path d="M54,54 L68,60 M96,54 L82,60" stroke="#1f3a15" stroke-width="4" stroke-linecap="round"/>
      <ellipse cx="62" cy="66" rx="6" ry="5" fill="#ffe14d"/><ellipse cx="88" cy="66" rx="6" ry="5" fill="#ffe14d"/>
      <circle cx="62" cy="67" r="2.5" fill="#1f1f1f"/><circle cx="88" cy="67" r="2.5" fill="#1f1f1f"/>
      <ellipse cx="75" cy="76" rx="5" ry="4" fill="#4f9a3c"/>
      <path d="M58,86 Q75,96 92,86 L90,90 Q75,98 60,90 Z" fill="#3a1a12"/>
      <path d="M62,87 L64,93 L67,88 Z M84,88 L86,93 L88,87 Z" fill="#fff"/>
    </g></svg>`,

  golem: () => `<svg viewBox="0 0 170 170" class="enemy-svg">
    <ellipse cx="85" cy="162" rx="56" ry="7" fill="#000" opacity=".3"/>
    <g class="squish">
      <rect x="10" y="70" width="30" height="60" rx="10" fill="#8b8f99" stroke="#4a4d55" stroke-width="3"/>
      <rect x="130" y="70" width="30" height="60" rx="10" fill="#8b8f99" stroke="#4a4d55" stroke-width="3"/>
      <rect x="4" y="122" width="40" height="26" rx="10" fill="#7a7e88" stroke="#4a4d55" stroke-width="3"/>
      <rect x="126" y="122" width="40" height="26" rx="10" fill="#7a7e88" stroke="#4a4d55" stroke-width="3"/>
      <rect x="40" y="130" width="30" height="30" rx="6" fill="#767a84" stroke="#4a4d55" stroke-width="3"/>
      <rect x="100" y="130" width="30" height="30" rx="6" fill="#767a84" stroke="#4a4d55" stroke-width="3"/>
      <rect x="34" y="60" width="102" height="80" rx="14" fill="#9ca0aa" stroke="#4a4d55" stroke-width="3"/>
      <path d="M50,80 L62,96 L56,112 M110,74 L118,90 M98,118 L112,126" stroke="#5c6068" stroke-width="3" fill="none"/>
      <circle cx="85" cy="100" r="10" fill="#5ef0ff" opacity=".8" class="core"/>
      <rect x="54" y="14" width="62" height="52" rx="12" fill="#a8acb6" stroke="#4a4d55" stroke-width="3"/>
      <path d="M54,28 C62,20 70,26 78,18 C86,24 96,16 116,26 L116,22 C100,10 70,10 54,22 Z" fill="#6aa84f"/>
      <rect x="64" y="36" width="14" height="8" rx="2" fill="#5ef0ff" class="eye-glow"/>
      <rect x="92" y="36" width="14" height="8" rx="2" fill="#5ef0ff" class="eye-glow"/>
      <path d="M70,54 L100,54" stroke="#4a4d55" stroke-width="3"/>
    </g></svg>`,

  dragon: () => `<svg viewBox="0 0 200 170" class="enemy-svg">
    <ellipse cx="104" cy="162" rx="72" ry="8" fill="#000" opacity=".3"/>
    <g class="squish">
      <g class="wing wing-big"><path d="M110,70 C120,20 160,4 196,10 C184,20 186,30 178,40 C190,44 188,54 180,62 C188,70 182,80 172,84 C158,90 132,90 118,96 Z" fill="#7a1f2b" stroke="#3d0d14" stroke-width="3" stroke-linejoin="round"/>
        <path d="M118,80 L178,40 M122,88 L180,62" stroke="#3d0d14" stroke-width="2"/></g>
      <path d="M150,130 C176,128 190,114 196,96 C198,120 184,146 150,150 Z" fill="#b8323f" stroke="#5a1019" stroke-width="3"/>
      <path d="M196,96 L190,88 L200,90 Z" fill="#ffcf4a"/>
      <ellipse cx="116" cy="118" rx="46" ry="36" fill="#c53d4a" stroke="#5a1019" stroke-width="3"/>
      <ellipse cx="106" cy="126" rx="28" ry="22" fill="#f2b37a"/>
      <path d="M96,126 L116,126 M94,136 L118,136 M98,116 L114,116" stroke="#d98f58" stroke-width="2"/>
      <rect x="84" y="140" width="20" height="22" rx="7" fill="#b8323f" stroke="#5a1019" stroke-width="3"/>
      <rect x="126" y="140" width="20" height="22" rx="7" fill="#b8323f" stroke="#5a1019" stroke-width="3"/>
      <path d="M90,100 C80,80 76,64 66,52" stroke="#c53d4a" stroke-width="26" stroke-linecap="round" fill="none"/>
      <path d="M90,100 C80,80 76,64 66,52" stroke="#5a1019" stroke-width="30" stroke-linecap="round" fill="none" opacity=".25"/>
      <g class="head">
        <path d="M70,34 L84,14 L80,38 Z M56,32 L62,10 L64,36 Z" fill="#ffcf4a" stroke="#8a5a00" stroke-width="2"/>
        <path d="M16,56 C18,44 36,34 60,32 C78,32 86,44 84,58 C82,70 64,74 44,72 C30,72 16,68 16,56 Z" fill="#c53d4a" stroke="#5a1019" stroke-width="3"/>
        <path d="M18,62 C30,66 50,68 70,66" stroke="#5a1019" stroke-width="2.5" fill="none"/>
        <path d="M24,62 L27,69 L30,63 Z M38,64 L41,71 L44,65 Z" fill="#fff"/>
        <circle cx="24" cy="50" r="2.5" fill="#5a1019"/>
        <path d="M52,44 L70,42 L66,52 L52,50 Z" fill="#ffe14d" stroke="#5a1019" stroke-width="2"/>
        <rect x="60" y="43" width="3" height="8" fill="#1a1a1a"/>
        <path d="M50,40 L72,36" stroke="#5a1019" stroke-width="3" stroke-linecap="round"/>
      </g>
    </g></svg>`,

  // ---------- ワールド 2: うみ ----------
  crab: () => `<svg viewBox="0 0 160 130" class="enemy-svg">
    <ellipse cx="80" cy="122" rx="54" ry="6" fill="#000" opacity=".25"/>
    <g class="squish">
      <g stroke="#8a1c12" stroke-width="5" stroke-linecap="round" fill="none">
        <path d="M44,96 L24,116 M52,100 L40,120 M116,96 L136,116 M108,100 L120,120"/></g>
      <g class="claw"><path d="M36,64 C18,56 6,40 14,26 C22,34 30,36 36,30 C44,40 44,56 36,64 Z" fill="#e8452c" stroke="#8a1c12" stroke-width="3"/>
        <path d="M40,70 L50,80" stroke="#8a1c12" stroke-width="6" stroke-linecap="round"/></g>
      <path d="M124,64 C142,56 154,40 146,26 C138,34 130,36 124,30 C116,40 116,56 124,64 Z" fill="#e8452c" stroke="#8a1c12" stroke-width="3"/>
      <ellipse cx="80" cy="84" rx="44" ry="26" fill="#f25a3a" stroke="#8a1c12" stroke-width="3"/>
      <path d="M50,80 Q80,66 110,80" fill="none" stroke="#ffb199" stroke-width="4" opacity=".7"/>
      <line x1="66" y1="62" x2="62" y2="44" stroke="#8a1c12" stroke-width="3"/><line x1="94" y1="62" x2="98" y2="44" stroke="#8a1c12" stroke-width="3"/>
      <circle cx="62" cy="42" r="8" fill="#fff" stroke="#8a1c12" stroke-width="2"/><circle cx="98" cy="42" r="8" fill="#fff" stroke="#8a1c12" stroke-width="2"/>
      <circle cx="60" cy="43" r="3.5" fill="#1a1a1a"/><circle cx="96" cy="43" r="3.5" fill="#1a1a1a"/>
      <path d="M70,94 Q80,100 90,94" fill="none" stroke="#8a1c12" stroke-width="3" stroke-linecap="round"/>
    </g></svg>`,

  jelly: () => `<svg viewBox="0 0 140 150" class="enemy-svg">
    <g class="float">
      <g stroke="#c77dff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".85">
        <path d="M40,84 C34,100 46,112 38,130"/><path d="M58,88 C54,106 64,118 58,140"/><path d="M82,88 C86,106 76,118 82,140"/><path d="M100,84 C106,100 94,112 102,130"/></g>
      <path d="M20,84 C18,40 44,18 70,18 C96,18 122,40 120,84 C110,92 100,84 92,90 C84,84 76,92 70,88 C64,92 56,84 48,90 C40,84 30,92 20,84 Z" fill="#e0aaff" stroke="#9d4edd" stroke-width="3" opacity=".92"/>
      <ellipse cx="54" cy="40" rx="12" ry="7" fill="#fff" opacity=".6" transform="rotate(-25 54 40)"/>
      <ellipse cx="56" cy="62" rx="6" ry="8" fill="#3c096c"/><ellipse cx="84" cy="62" rx="6" ry="8" fill="#3c096c"/>
      <circle cx="58" cy="59" r="2.2" fill="#fff"/><circle cx="86" cy="59" r="2.2" fill="#fff"/>
      <path d="M62,74 Q70,80 78,74" fill="none" stroke="#3c096c" stroke-width="3" stroke-linecap="round"/>
      <path d="M112,40 L120,30 L116,42 L126,36" fill="none" stroke="#fff27a" stroke-width="3" class="spark"/>
      <path d="M26,48 L16,40 L22,52 L10,48" fill="none" stroke="#fff27a" stroke-width="3" class="spark"/>
    </g></svg>`,

  shark: () => `<svg viewBox="0 0 190 130" class="enemy-svg">
    <ellipse cx="95" cy="122" rx="60" ry="6" fill="#000" opacity=".2"/>
    <g class="float">
      <path d="M150,70 L186,40 L178,72 L186,102 Z" fill="#4a6fa5" stroke="#1d3557" stroke-width="3" stroke-linejoin="round"/>
      <path d="M96,40 L112,8 L124,46 Z" fill="#4a6fa5" stroke="#1d3557" stroke-width="3" stroke-linejoin="round"/>
      <path d="M10,72 C20,44 70,34 110,40 C140,44 158,58 160,72 C158,90 130,104 96,104 C56,104 20,96 10,72 Z" fill="#5c85c4" stroke="#1d3557" stroke-width="3"/>
      <path d="M16,80 C40,96 90,102 150,82 C130,100 60,108 16,80 Z" fill="#e9f1fb"/>
      <path d="M92,96 L110,118 L116,96 Z" fill="#4a6fa5" stroke="#1d3557" stroke-width="3" stroke-linejoin="round"/>
      <path d="M12,74 L50,78" stroke="#1d3557" stroke-width="3"/>
      <path d="M18,75 L22,82 L26,76 L30,83 L34,77 L38,84 L42,78" fill="#fff" stroke="#fff" stroke-width="1"/>
      <circle cx="44" cy="60" r="6" fill="#fff"/><circle cx="43" cy="60" r="3.5" fill="#111"/>
      <path d="M34,50 L52,54" stroke="#1d3557" stroke-width="4" stroke-linecap="round"/>
      <path d="M66,58 L68,72 M74,56 L76,72 M82,56 L84,72" stroke="#1d3557" stroke-width="2" opacity=".5"/>
    </g></svg>`,

  kraken: () => `<svg viewBox="0 0 200 180" class="enemy-svg">
    <ellipse cx="100" cy="172" rx="80" ry="7" fill="#000" opacity=".3"/>
    <g class="squish">
      <g fill="#b5179e" stroke="#560bad" stroke-width="3" class="tentacles">
        <path d="M40,120 C10,120 4,150 20,162 C26,146 36,140 50,142 Z"/>
        <path d="M66,130 C50,150 58,172 76,170 C70,158 74,148 84,142 Z"/>
        <path d="M134,130 C150,150 142,172 124,170 C130,158 126,148 116,142 Z"/>
        <path d="M160,120 C190,120 196,150 180,162 C174,146 164,140 150,142 Z"/>
        <path d="M30,96 C0,80 -2,44 18,34 C18,56 30,70 46,78 Z"/>
      </g>
      <g fill="#ffb3e6" opacity=".8">${[[20,150],[70,160],[130,160],[180,150],[14,60]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3"/>`).join('')}</g>
      <path d="M36,120 C28,60 60,10 100,10 C140,10 172,60 164,120 C150,140 50,140 36,120 Z" fill="#c9184a" stroke="#590d22" stroke-width="3"/>
      <path d="M60,40 C70,24 90,20 104,22" fill="none" stroke="#ff8fa3" stroke-width="6" stroke-linecap="round" opacity=".6"/>
      <circle cx="70" cy="44" r="6" fill="#ff4d6d" opacity=".6"/><circle cx="130" cy="38" r="8" fill="#ff4d6d" opacity=".6"/>
      <ellipse cx="74" cy="86" rx="16" ry="18" fill="#ffd60a" stroke="#590d22" stroke-width="3"/><ellipse cx="126" cy="86" rx="16" ry="18" fill="#ffd60a" stroke="#590d22" stroke-width="3"/>
      <rect x="70" y="74" width="7" height="24" rx="3" fill="#111"/><rect x="122" y="74" width="7" height="24" rx="3" fill="#111"/>
      <path d="M58,64 L88,72 M142,64 L112,72" stroke="#590d22" stroke-width="5" stroke-linecap="round"/>
      <path d="M84,118 Q100,108 116,118" fill="none" stroke="#590d22" stroke-width="4" stroke-linecap="round"/>
    </g></svg>`,

  // ---------- ワールド 3: ゆきやま ----------
  penguin: () => `<svg viewBox="0 0 150 160" class="enemy-svg">
    <ellipse cx="75" cy="152" rx="44" ry="6" fill="#000" opacity=".25"/>
    <g class="squish">
      <path d="M118,30 L118,140" stroke="#adb5bd" stroke-width="5"/><path d="M110,34 L118,6 L126,34 Z" fill="#dee2e6" stroke="#495057" stroke-width="2"/>
      <path d="M44,144 L36,152 L58,152 Z M92,144 L84,152 L106,152 Z" fill="#ffa94d"/>
      <ellipse cx="72" cy="94" rx="44" ry="54" fill="#212529"/>
      <ellipse cx="72" cy="102" rx="30" ry="42" fill="#f8f9fa"/>
      <path d="M36,40 C40,20 104,20 108,40 L108,54 L36,54 Z" fill="#74c0fc" stroke="#1864ab" stroke-width="3"/>
      <path d="M72,14 L72,28" stroke="#1864ab" stroke-width="4"/><circle cx="72" cy="12" r="5" fill="#ff6b6b"/>
      <circle cx="58" cy="66" r="6" fill="#fff"/><circle cx="86" cy="66" r="6" fill="#fff"/>
      <circle cx="57" cy="67" r="3" fill="#111"/><circle cx="85" cy="67" r="3" fill="#111"/>
      <path d="M62,76 L72,86 L82,76 Z" fill="#ffa94d" stroke="#d9480f" stroke-width="2"/>
      <path d="M14,70 L40,62 L44,120 L20,128 Z" fill="#a5d8ff" stroke="#1864ab" stroke-width="3" stroke-linejoin="round"/>
      <path d="M24,84 L36,80 M26,100 L38,96" stroke="#fff" stroke-width="3" opacity=".7"/>
    </g></svg>`,

  snowman: () => `<svg viewBox="0 0 140 170" class="enemy-svg">
    <ellipse cx="70" cy="162" rx="46" ry="6" fill="#000" opacity=".2"/>
    <g class="squish">
      <path d="M26,96 L2,74 M114,96 L138,72" stroke="#8a5a2b" stroke-width="5" stroke-linecap="round"/>
      <path d="M8,80 L2,70 M132,78 L140,68" stroke="#8a5a2b" stroke-width="4" stroke-linecap="round"/>
      <circle cx="70" cy="122" r="42" fill="#f8f9fa" stroke="#a5d8ff" stroke-width="3"/>
      <circle cx="70" cy="62" r="32" fill="#ffffff" stroke="#a5d8ff" stroke-width="3"/>
      <circle cx="70" cy="108" r="4" fill="#343a40"/><circle cx="70" cy="126" r="4" fill="#343a40"/>
      <path d="M40,88 C60,96 80,96 100,88 L102,100 C80,106 60,106 38,100 Z" fill="#e03131"/>
      <path d="M90,94 L100,122 L88,120 Z" fill="#c92a2a"/>
      <rect x="44" y="14" width="52" height="24" rx="3" fill="#343a40"/><rect x="34" y="34" width="72" height="8" rx="3" fill="#343a40"/>
      <rect x="44" y="26" width="52" height="6" fill="#e03131"/>
      <path d="M50,56 L62,60 M90,56 L78,60" stroke="#343a40" stroke-width="3" stroke-linecap="round"/>
      <circle cx="58" cy="64" r="4" fill="#343a40"/><circle cx="82" cy="64" r="4" fill="#343a40"/>
      <path d="M70,70 L40,76 L70,78 Z" fill="#ff922b"/>
      <path d="M58,84 Q70,80 82,84" fill="none" stroke="#343a40" stroke-width="3" stroke-linecap="round"/>
    </g></svg>`,

  wolf: () => `<svg viewBox="0 0 180 140" class="enemy-svg">
    <ellipse cx="96" cy="132" rx="64" ry="6" fill="#000" opacity=".25"/>
    <g class="squish">
      <path d="M150,70 C172,56 178,32 168,20 C164,40 152,50 138,56 Z" fill="#d0ebff" stroke="#1971c2" stroke-width="3"/>
      <path d="M58,84 C60,60 100,50 140,60 C160,66 162,96 150,106 L60,110 Z" fill="#e7f5ff" stroke="#1971c2" stroke-width="3"/>
      <path d="M70,104 L66,130 L80,130 L82,106 M126,104 L128,130 L142,130 L140,104" fill="#d0ebff" stroke="#1971c2" stroke-width="3" stroke-linejoin="round"/>
      <path d="M90,60 L100,48 L106,62 L116,50 L120,64" fill="#a5d8ff" stroke="#1971c2" stroke-width="2"/>
      <path d="M22,70 C20,50 40,34 64,36 C80,38 90,50 88,66 C86,84 66,92 46,90 C30,88 22,82 22,70 Z" fill="#e7f5ff" stroke="#1971c2" stroke-width="3"/>
      <path d="M48,38 L50,14 L64,34 Z M70,40 L78,18 L84,42 Z" fill="#d0ebff" stroke="#1971c2" stroke-width="3" stroke-linejoin="round"/>
      <path d="M8,72 C14,66 24,66 30,70 L30,82 C22,84 12,82 8,72 Z" fill="#d0ebff" stroke="#1971c2" stroke-width="3"/>
      <circle cx="10" cy="72" r="3.5" fill="#1a1a2e"/>
      <path d="M40,56 L56,52 L52,62 Z" fill="#4dabf7"/><circle cx="50" cy="57" r="2.5" fill="#fff"/>
      <path d="M12,82 L16,90 L20,83 L24,90 L28,83" fill="#fff" stroke="#1971c2" stroke-width="1.5"/>
      <g fill="#e7f5ff" opacity=".9" class="bubble"><circle cx="4" cy="86" r="4"/><circle cx="-4" cy="80" r="3"/></g>
    </g></svg>`,

  yeti: () => `<svg viewBox="0 0 200 190" class="enemy-svg">
    <ellipse cx="100" cy="182" rx="76" ry="7" fill="#000" opacity=".3"/>
    <g class="squish">
      <path d="M40,90 C10,100 4,140 20,160 C30,150 36,140 44,136 Z" fill="#f1f3f5" stroke="#868e96" stroke-width="3"/>
      <path d="M160,90 C190,100 196,140 180,160 C170,150 164,140 156,136 Z" fill="#f1f3f5" stroke="#868e96" stroke-width="3"/>
      <path d="M44,60 C44,30 70,14 100,14 C130,14 156,30 156,60 L162,150 C150,174 50,174 38,150 Z" fill="#f8f9fa" stroke="#868e96" stroke-width="3"/>
      <g fill="none" stroke="#ced4da" stroke-width="3" stroke-linecap="round"><path d="M58,100 l6,10 M78,120 l6,10 M120,110 l6,10 M140,130 l6,10 M96,140 l6,10"/></g>
      <path d="M62,48 C64,34 136,34 138,48 C140,72 124,92 100,92 C76,92 60,72 62,48 Z" fill="#74c0fc" stroke="#1864ab" stroke-width="3"/>
      <path d="M68,50 L90,58 M132,50 L110,58" stroke="#1864ab" stroke-width="5" stroke-linecap="round"/>
      <circle cx="82" cy="62" r="6" fill="#fff"/><circle cx="118" cy="62" r="6" fill="#fff"/>
      <circle cx="82" cy="63" r="3" fill="#111"/><circle cx="118" cy="63" r="3" fill="#111"/>
      <path d="M80,78 Q100,90 120,78 L118,84 Q100,94 82,84 Z" fill="#1864ab"/>
      <path d="M86,80 L88,88 L91,81 Z M109,81 L112,88 L114,80 Z" fill="#fff"/>
      <path d="M60,162 L56,178 L80,178 L80,166 M120,166 L120,178 L144,178 L140,162" fill="#f1f3f5" stroke="#868e96" stroke-width="3"/>
    </g></svg>`,

  // ---------- ワールド 4: マグマのしろ ----------
  imp: () => `<svg viewBox="0 0 150 150" class="enemy-svg">
    <ellipse cx="75" cy="142" rx="34" ry="5" fill="#000" opacity=".25"/>
    <g class="float">
      <path d="M40,60 C20,40 4,44 2,60 C14,58 20,66 22,76 Z M110,60 C130,40 146,44 148,60 C136,58 130,66 128,76 Z" fill="#6a040f" stroke="#370617" stroke-width="3" class="wing"/>
      <path d="M110,110 C130,118 138,104 132,94" fill="none" stroke="#9d0208" stroke-width="4" stroke-linecap="round"/>
      <path d="M128,90 L140,92 L132,100 Z" fill="#9d0208"/>
      <ellipse cx="75" cy="84" rx="38" ry="40" fill="#d00000" stroke="#370617" stroke-width="3"/>
      <path d="M52,50 L42,20 L62,44 Z M98,50 L108,20 L88,44 Z" fill="#ffba08" stroke="#370617" stroke-width="2"/>
      <path d="M60,26 C66,8 84,8 90,26 C84,20 66,20 60,26 Z" fill="#ffba08" class="flame"/>
      <path d="M66,30 C70,18 80,18 84,30 Z" fill="#fff3b0"/>
      <path d="M52,70 L68,76 M98,70 L82,76" stroke="#370617" stroke-width="4" stroke-linecap="round"/>
      <circle cx="62" cy="82" r="5" fill="#ffba08"/><circle cx="88" cy="82" r="5" fill="#ffba08"/>
      <path d="M60,98 Q75,110 90,98" fill="none" stroke="#370617" stroke-width="3" stroke-linecap="round"/>
      <path d="M64,100 L67,106 L70,101 Z M80,101 L83,106 L86,100 Z" fill="#fff"/>
      <g class="bubble"><circle cx="20" cy="110" r="6" fill="#ff7a1a"/><circle cx="20" cy="110" r="3" fill="#ffe14d"/></g>
    </g></svg>`,

  mgolem: () => ENEMY_SVG.golem().replace(/#9ca0aa/g, '#5a2a1a').replace(/#a8acb6/g, '#6b3020').replace(/#8b8f99/g, '#4a2014')
    .replace(/#7a7e88/g, '#3d1a10').replace(/#767a84/g, '#3d1a10').replace(/#5ef0ff/g, '#ffba08').replace(/#6aa84f/g, '#ff5400').replace(/#5c6068/g, '#ff7a1a').replace(/#4a4d55/g, '#1a0a05'),

  salamander: () => `<svg viewBox="0 0 200 140" class="enemy-svg">
    <ellipse cx="104" cy="132" rx="70" ry="6" fill="#000" opacity=".25"/>
    <g class="squish">
      <path d="M140,90 C170,92 190,70 196,46 C200,70 186,110 140,108 Z" fill="#e85d04" stroke="#6a040f" stroke-width="3"/>
      <path d="M196,46 C190,36 198,24 192,14 C204,24 206,40 196,46 Z" fill="#ffba08" class="flame"/>
      <path d="M40,84 C44,62 90,54 140,66 C156,72 158,100 144,108 L56,110 C44,106 38,96 40,84 Z" fill="#f48c06" stroke="#6a040f" stroke-width="3"/>
      <path d="M64,62 L72,44 L80,60 L90,40 L98,60 L108,42 L114,62 L126,48 L128,66" fill="#ffba08" stroke="#6a040f" stroke-width="2" stroke-linejoin="round" class="flame"/>
      <path d="M62,106 L54,128 L72,128 L76,108 M122,106 L122,128 L140,128 L138,106" fill="#e85d04" stroke="#6a040f" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="80" cy="88" r="5" fill="#ffba08" opacity=".7"/><circle cx="106" cy="94" r="6" fill="#ffba08" opacity=".7"/><circle cx="128" cy="84" r="4" fill="#ffba08" opacity=".7"/>
      <path d="M6,82 C8,66 26,56 46,62 C58,66 62,80 56,92 C48,102 20,102 8,94 Z" fill="#f48c06" stroke="#6a040f" stroke-width="3"/>
      <path d="M8,88 L40,92" stroke="#6a040f" stroke-width="2.5"/>
      <circle cx="30" cy="72" r="6" fill="#ffe14d"/><rect x="28" y="67" width="3" height="10" fill="#111"/>
      <path d="M20,64 L40,66" stroke="#6a040f" stroke-width="3" stroke-linecap="round"/>
      <path d="M4,90 C-6,88 -10,96 -14,92 C-8,100 0,98 6,94 Z" fill="#ff5400"/>
    </g></svg>`,

  demon: () => `<svg viewBox="0 0 220 200" class="enemy-svg">
    <ellipse cx="110" cy="192" rx="80" ry="8" fill="#000" opacity=".35"/>
    <g class="squish">
      <path d="M60,70 C20,30 -4,50 2,80 C20,70 30,80 32,96 C40,86 50,90 56,100 Z" fill="#240046" stroke="#10002b" stroke-width="3" class="wing"/>
      <path d="M160,70 C200,30 224,50 218,80 C200,70 190,80 188,96 C180,86 170,90 164,100 Z" fill="#240046" stroke="#10002b" stroke-width="3" class="wing"/>
      <path d="M50,100 C50,70 80,56 110,56 C140,56 170,70 170,100 L182,184 L38,184 Z" fill="#3c096c" stroke="#10002b" stroke-width="3"/>
      <path d="M80,100 L110,184 L140,100 Z" fill="#9d0208" stroke="#10002b" stroke-width="2"/>
      <path d="M70,76 C80,92 140,92 150,76" fill="none" stroke="#ffba08" stroke-width="5"/>
      <circle cx="110" cy="96" r="9" fill="#ff006e" class="core"/>
      <path d="M70,40 C70,20 150,20 150,40 C152,62 136,76 110,76 C84,76 68,62 70,40 Z" fill="#7b2cbf" stroke="#10002b" stroke-width="3"/>
      <path d="M74,32 C60,20 58,0 70,-6 C68,10 74,20 84,26 Z M146,32 C160,20 162,0 150,-6 C152,10 146,20 136,26 Z" fill="#e0e0e0" stroke="#10002b" stroke-width="2"/>
      <path d="M84,14 L92,2 L100,12 L110,-2 L120,12 L128,2 L136,14 Z" fill="#ffba08" stroke="#9d4edd" stroke-width="2"/>
      <path d="M82,40 L102,46 M138,40 L118,46" stroke="#10002b" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="94" cy="50" rx="7" ry="5" fill="#ff006e" class="eye-glow"/><ellipse cx="126" cy="50" rx="7" ry="5" fill="#ff006e" class="eye-glow"/>
      <path d="M94,64 Q110,72 126,64" fill="none" stroke="#10002b" stroke-width="3" stroke-linecap="round"/>
      <path d="M98,66 L100,72 L103,67 Z M117,67 L120,72 L122,66 Z" fill="#fff"/>
      <path d="M40,120 L16,110 M180,120 L204,110" stroke="#3c096c" stroke-width="12" stroke-linecap="round"/>
      <circle cx="12" cy="108" r="10" fill="#c77dff" opacity=".8" class="core"/><circle cx="208" cy="108" r="10" fill="#c77dff" opacity=".8" class="core"/>
    </g></svg>`,
};

function enemySVG(id) { return ENEMY_SVG[id](); }
