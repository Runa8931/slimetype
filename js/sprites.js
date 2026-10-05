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
    onpuru: [
      'M60,34 C88,34 104,56 104,80 C104,98 92,104 80,104 L40,104 C28,104 16,98 16,80 C16,56 32,34 60,34 Z',
      'M60,30 C92,30 108,54 108,80 C108,100 94,105 80,105 L40,105 C26,105 12,100 12,80 C12,54 28,30 60,30 Z',
      'M60,30 C92,30 108,54 108,80 C108,100 94,105 80,105 L40,105 C26,105 12,100 12,80 C12,54 28,30 60,30 Z',
    ],
    pitarin: [
      'M60,30 C86,30 104,50 104,76 C104,96 90,104 76,104 L44,104 C30,104 16,96 16,76 C16,50 34,30 60,30 Z',
      'M60,26 C90,26 108,48 108,76 C108,98 92,105 76,105 L44,105 C28,105 12,98 12,76 C12,48 30,26 60,26 Z',
      'M60,26 C90,26 108,48 108,76 C108,98 92,105 76,105 L44,105 C28,105 12,98 12,76 C12,48 30,26 60,26 Z',
    ],
    dororin: [
      'M60,32 C88,32 104,54 104,76 C104,90 100,96 98,104 C94,112 90,104 86,104 L70,104 C66,114 60,114 58,104 L40,104 C34,104 30,112 26,104 C18,98 16,90 16,76 C16,54 32,32 60,32 Z',
      'M60,28 C92,28 108,52 108,76 C108,92 104,98 102,106 C98,116 92,106 88,106 L72,106 C68,118 60,118 58,106 L40,106 C34,106 28,116 24,106 C14,100 12,92 12,76 C12,52 28,28 60,28 Z',
      'M60,28 C92,28 108,52 108,76 C108,92 104,98 102,106 C98,116 92,106 88,106 L72,106 C68,118 60,118 58,106 L40,106 C34,106 28,116 24,106 C14,100 12,92 12,76 C12,52 28,28 60,28 Z',
    ],
    gorurin: [
      'M60,34 C88,34 104,54 104,78 C104,98 90,104 76,104 L44,104 C30,104 16,98 16,78 C16,54 32,34 60,34 Z',
      'M60,30 C92,30 108,52 108,78 C108,100 92,105 76,105 L44,105 C28,105 12,100 12,78 C12,52 28,30 60,30 Z',
      'M60,30 C92,30 108,52 108,78 C108,100 92,105 76,105 L44,105 C28,105 12,100 12,78 C12,52 28,30 60,30 Z',
    ],
    yukidarun: [
      'M60,30 C84,30 100,48 100,68 C110,76 110,98 96,104 L24,104 C10,98 10,76 20,68 C20,48 36,30 60,30 Z',
      'M60,26 C88,26 104,46 104,68 C114,76 114,100 98,105 L22,105 C6,100 6,76 16,68 C16,46 32,26 60,26 Z',
      'M60,26 C88,26 104,46 104,68 C114,76 114,100 98,105 L22,105 C6,100 6,76 16,68 C16,46 32,26 60,26 Z',
    ],
    yuusharin: [
      'M60,32 C88,32 104,56 104,80 C104,98 92,104 80,104 L40,104 C28,104 16,98 16,80 C16,56 32,32 60,32 Z',
      'M60,28 C92,28 108,54 108,80 C108,100 94,105 80,105 L40,105 C26,105 12,100 12,80 C12,54 28,28 60,28 Z',
      'M60,28 C92,28 108,54 108,80 C108,100 94,105 80,105 L40,105 C26,105 12,100 12,80 C12,54 28,28 60,28 Z',
    ],
    fuerin: [
      'M60,34 C88,34 104,54 104,78 C104,96 94,104 80,104 L40,104 C26,104 16,96 16,78 C16,54 32,34 60,34 Z',
      'M60,28 C92,28 108,52 108,78 C108,98 96,105 80,105 L40,105 C24,105 12,98 12,78 C12,52 28,28 60,28 Z',
      'M60,28 C92,28 108,52 108,78 C108,98 96,105 80,105 L40,105 C24,105 12,98 12,78 C12,52 28,28 60,28 Z',
    ],
    koorin: [
      'M60,32 C90,32 106,56 106,80 C106,98 94,104 82,104 L38,104 C26,104 14,98 14,80 C14,56 30,32 60,32 Z',
      'M60,28 C92,28 110,54 110,80 C110,100 96,105 82,105 L38,105 C24,105 10,100 10,80 C10,54 28,28 60,28 Z',
      'M60,28 C92,28 110,54 110,80 C110,100 96,105 82,105 L38,105 C24,105 10,100 10,80 C10,54 28,28 60,28 Z',
    ],
    fuwari: [
      'M34,50 C30,36 46,28 56,36 C62,26 80,28 84,40 C98,38 106,52 100,62 C112,70 110,92 96,100 C92,106 84,104 80,104 L40,104 C28,106 12,98 16,82 C8,72 14,56 28,58 C26,54 28,52 34,50 Z',
      'M30,48 C26,32 44,22 56,32 C62,20 84,22 88,36 C104,34 112,50 106,60 C118,70 116,94 100,102 C94,108 86,106 80,106 L40,106 C26,108 8,100 12,82 C2,70 10,52 26,56 C24,52 26,50 30,48 Z',
      'M30,48 C26,32 44,22 56,32 C62,20 84,22 88,36 C104,34 112,50 106,60 C118,70 116,94 100,102 C94,108 86,106 80,106 L40,106 C26,108 8,100 12,82 C2,70 10,52 26,56 C24,52 26,50 30,48 Z',
    ],
    metarun: [
      'M30,36 L90,36 C100,36 106,42 106,52 L106,94 C106,100 100,104 94,104 L26,104 C20,104 14,100 14,94 L14,52 C14,42 20,36 30,36 Z',
      'M28,32 L92,32 C104,32 110,40 110,50 L110,96 C110,102 104,106 96,106 L24,106 C16,106 10,102 10,96 L10,50 C10,40 16,32 28,32 Z',
      'M28,32 L92,32 C104,32 110,40 110,50 L110,96 C110,102 104,106 96,106 L24,106 C16,106 10,102 10,96 L10,50 C10,40 16,32 28,32 Z',
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

  if (id === 'koorin') {
    // あたまに こおりの けっしょう、ほっぺに ゆきの つぶ
    behind += [[42, 38, -18, 0.8], [60, 32, 0, 1.1], [78, 38, 18, 0.8]].map(([x, y, r, k]) =>
      `<path transform="translate(${x},${y}) rotate(${r}) scale(${k})" d="M0,-26 L7,-6 L0,4 L-7,-6 Z" fill="${c.light}" stroke="${c.dark}" stroke-width="2" stroke-linejoin="round"/>`).join('');
    front += `<circle cx="36" cy="84" r="5" fill="#a5d8ff" opacity=".8"/><circle cx="84" cy="84" r="5" fill="#a5d8ff" opacity=".8"/>
      <path d="M28,58 L32,62 M32,58 L28,62 M30,56 L30,64" stroke="#fff" stroke-width="1.5" opacity=".8"/>`;
    if (stage >= 1) front += `<g class="orbit">${[[6, 44], [114, 50], [108, 22]].map(([x, y]) =>
      `<g transform="translate(${x},${y})" stroke="#fff" stroke-width="2.2" stroke-linecap="round"><path d="M0,-7 L0,7 M-6,-3.5 L6,3.5 M-6,3.5 L6,-3.5"/></g>`).join('')}</g>`;
  }
  if (id === 'fuwari') {
    // よこに はね、おでこに うずまき
    behind += `<path d="M16,66 C0,58 -6,72 4,78 C-4,86 8,94 16,86 Z" fill="${c.light}" stroke="${c.dark}" stroke-width="2"/>
      <path d="M104,66 C120,58 126,72 116,78 C124,86 112,94 104,86 Z" fill="${c.light}" stroke="${c.dark}" stroke-width="2"/>`;
    front += `<path d="M56,52 C56,46 64,46 64,52 C64,58 54,58 54,50 C54,42 68,42 68,52" fill="none" stroke="${c.dark}" stroke-width="2.2" stroke-linecap="round" opacity=".6"/>
      <circle cx="36" cy="84" r="5" fill="#ffa8a8" opacity=".6"/><circle cx="84" cy="84" r="5" fill="#ffa8a8" opacity=".6"/>`;
    if (stage >= 1) behind += `<g class="spark-soft" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"><path d="M-10,40 C6,34 16,40 26,36"/><path d="M96,30 C108,26 118,30 130,26"/></g>`;
  }
  if (id === 'metarun') {
    // アンテナ・ねじ・かおの まど
    behind += `<path d="M60,36 L60,16" stroke="${c.dark}" stroke-width="3"/><circle cx="60" cy="13" r="5" fill="${c.accent}" stroke="${c.dark}" stroke-width="2" class="spark-soft"/>`;
    mid += `<rect x="30" y="58" width="60" height="28" rx="10" fill="#1d1d2b" opacity=".18"/>`;
    front += `<circle cx="22" cy="48" r="3" fill="${c.dark}"/><circle cx="98" cy="48" r="3" fill="${c.dark}"/><circle cx="22" cy="96" r="3" fill="${c.dark}"/><circle cx="98" cy="96" r="3" fill="${c.dark}"/>
      <path d="M20,44 L24,52 M96,44 L100,52" stroke="#fff" stroke-width="1" opacity=".6"/>
      <circle cx="36" cy="84" r="5" fill="#ff8787" opacity=".5"/><circle cx="84" cy="84" r="5" fill="#ff8787" opacity=".5"/>`;
    if (stage >= 1) behind += `<path d="M6,52 L16,44 L16,72 L6,66 Z M114,52 L104,44 L104,72 L114,66 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="2.5" stroke-linejoin="round"/>`;
  }

  if (id === 'onpuru') {
    // あたまから のびる おんぷの しっぽ と ヘッドホン
    behind += `<path d="M84,44 L84,6 C94,10 102,16 104,26 C98,20 92,18 88,18 L88,44 Z" fill="${c.dark}"/>`;
    front += `<path d="M18,70 C18,40 102,40 102,70" fill="none" stroke="#343a40" stroke-width="5" stroke-linecap="round"/>
      <rect x="8" y="62" width="14" height="22" rx="6" fill="${c.accent}" stroke="#343a40" stroke-width="2.5"/>
      <rect x="98" y="62" width="14" height="22" rx="6" fill="${c.accent}" stroke="#343a40" stroke-width="2.5"/>
      <circle cx="36" cy="86" r="5" fill="#ff8787" opacity=".6"/><circle cx="84" cy="86" r="5" fill="#ff8787" opacity=".6"/>`;
    if (stage >= 1) front += `<g class="orbit">${[[4, 34, '♪'], [116, 40, '♫'], [110, 12, '♪']].map(([x, y, t]) => `<text x="${x}" y="${y}" font-size="16" font-weight="bold" fill="${c.dark}" text-anchor="middle">${t}</text>`).join('')}</g>`;
  }
  if (id === 'pitarin') {
    // うしろに 大きな みかづき、おでこに ほし
    behind += `<path d="M24,40 C10,10 40,-12 70,-2 C48,-2 32,14 34,40 Z" fill="${c.accent}" stroke="${c.dark}" stroke-width="2.5" stroke-linejoin="round" class="spark-soft"/>`;
    front += `<path d="M60,44 L62,50 L68,50 L63,54 L65,60 L60,56 L55,60 L57,54 L52,50 L58,50 Z" fill="${c.accent}"/>`;
    if (stage >= 1) front += `<circle cx="14" cy="96" r="2.5" fill="#fff" class="spark"/><circle cx="108" cy="92" r="2" fill="#fff" class="spark"/><circle cx="100" cy="30" r="2.5" fill="${c.accent}" class="spark"/>`;
  }

  if (id === 'dororin') {
    // どくの あわが うかぶ
    behind += `<g class="bubble"><circle cx="30" cy="30" r="5" fill="${c.accent}" opacity=".7"/><circle cx="94" cy="22" r="4" fill="${c.accent}" opacity=".6"/><circle cx="84" cy="10" r="2.5" fill="${c.accent}" opacity=".6"/></g>`;
    front += `<path d="M30,52 C34,46 40,46 42,52" stroke="${c.light}" stroke-width="3" fill="none" opacity=".5" stroke-linecap="round"/>`;
    if (stage >= 1) front += `<g class="spark-soft"><path d="M104,58 C112,62 112,72 106,74 C102,70 102,62 104,58 Z" fill="${c.accent}"/><path d="M14,62 C8,66 8,74 14,76 C18,72 18,66 14,62 Z" fill="${c.accent}"/></g>`;
  }
  if (id === 'gorurin') {
    // あたまの 大きな きんか と きらめき
    behind += `<g transform="translate(60,26)"><ellipse rx="16" ry="16" fill="#ffd43b" stroke="#b8860b" stroke-width="2.5"/><ellipse rx="11" ry="11" fill="none" stroke="#b8860b" stroke-width="1.5"/><text y="5" font-size="14" font-weight="bold" fill="#b8860b" text-anchor="middle">G</text></g>`;
    front += `<path d="M22,46 L24,52 L30,54 L24,56 L22,62 L20,56 L14,54 L20,52 Z" fill="#fff" class="spark"/><path d="M98,50 L99.5,54 L104,55.5 L99.5,57 L98,61 L96.5,57 L92,55.5 L96.5,54 Z" fill="#fff" class="spark"/>`;
    if (stage >= 1) front += `<g class="orbit">${[[6, 60], [114, 70]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="6" fill="#ffd43b" stroke="#b8860b" stroke-width="1.5"/>`).join('')}</g>`;
  }
  if (id === 'yukidarun') {
    // バケツの ぼうし・マフラー・ボタン
    behind += `<path d="M44,34 L48,14 L72,14 L76,34 Z" fill="#495057" stroke="#212529" stroke-width="2"/><rect x="40" y="30" width="40" height="6" rx="3" fill="#343a40"/>`;
    front += `<path d="M20,68 C40,76 80,76 100,68 L100,76 C80,84 40,84 20,76 Z" fill="${c.accent}"/><path d="M84,74 L92,96 L84,98 L78,76 Z" fill="${c.accent}"/>
      <circle cx="60" cy="94" r="2.5" fill="#343a40"/><circle cx="60" cy="101" r="2.5" fill="#343a40"/>`;
    if (stage >= 1) behind += `<g class="spark-soft" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"><path d="M8,40 L16,40 M12,36 L12,44"/><path d="M106,30 L114,30 M110,26 L110,34"/></g>`;
  }
  if (id === 'yuusharin') {
    // マント・はちまき・こしの けん
    behind += `<path d="M22,62 C14,84 12,100 20,110 L100,110 C108,100 106,84 98,62 Z" fill="#e03131" opacity=".9"/>`;
    front += `<path d="M20,56 C40,48 80,48 100,56 L100,62 C80,54 40,54 20,62 Z" fill="#e03131"/><path d="M98,58 C108,54 114,60 118,56 M98,60 C106,62 110,70 116,68" stroke="#e03131" stroke-width="4" fill="none" stroke-linecap="round"/>
      <g transform="translate(102,92) rotate(-30)"><rect x="-2" y="-20" width="4" height="22" fill="#ced4da" stroke="#495057" stroke-width="1"/><rect x="-6" y="0" width="12" height="3" fill="#ffd43b"/><rect x="-1.5" y="3" width="3" height="6" fill="#8d5524"/></g>`;
  }

  if (id === 'fuerin') {
    // ぶんれつした ちびふえりん。進化すると 1 → 2 → 3 → 4 ひき
    const buds = [[10, 96, 1], [110, 96, -1], [8, 58, 1], [112, 56, -1]].slice(0, [1, 2, 3, 3, 4][stage]);
    behind += buds.map(([x, y, f], i) => `<g transform="translate(${x},${y}) scale(${i < 2 ? 1 : 0.8})" class="${i < 2 ? '' : 'spark-soft'}">
      <path d="M0,-12 C8,-12 12,-6 12,1 C12,7 8,9 4,9 L-4,9 C-8,9 -12,7 -12,1 C-12,-6 -8,-12 0,-12 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="2"/>
      <circle cx="${-3 * f}" cy="0" r="1.8" fill="#1d1d2b"/><circle cx="${4 * f}" cy="0" r="1.8" fill="#1d1d2b"/><ellipse cx="-5" cy="-6" rx="3" ry="1.8" fill="#fff" opacity=".7"/></g>`).join('');
    // 頭の上で ぷくっと ふくらむ つぼみ
    front += `<path d="M54,${stage ? 30 : 36} C54,${stage ? 20 : 26} 66,${stage ? 20 : 26} 66,${stage ? 30 : 36}" fill="${c.main}" stroke="${c.dark}" stroke-width="2.5"/>`;
    if (stage >= 3) behind += `<g class="orbit"><circle cx="8" cy="30" r="4" fill="${c.accent}"/><circle cx="114" cy="26" r="3.5" fill="${c.accent}"/><circle cx="60" cy="0" r="3" fill="${c.accent}"/></g>`;
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
    const crownY = { purun: -6, piriri: 6, gotsun: 8, homura: -8, moririn: 2, kagemaru: 4, ryumaru: 6, kirari: 8, koorin: 2, fuwari: 4, metarun: 10, onpuru: 8, pitarin: 6, dororin: 6, gorurin: 0, yukidarun: -4, yuusharin: 6, fuerin: 8, torio: 12, yurarin: -2, saikoro: 16, imomushi: 30, chochin: -4 }[id] ?? 6;
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
  if (stage >= 3 && id !== 'imomushi') { // いもりんは チョウの はねが あるので つけない
    // 体の 横 (まんなか あたり) から 外へ ひろがる 羽根の つばさ。上に とがらせると 耳に 見えるので 横向きに する
    const wing = (sx) => `<g transform="translate(60,74) scale(${sx * 0.85},0.85) rotate(-8)"><g class="slime-wing">
      <path d="M34,-6 C48,-24 72,-30 94,-22 C88,-18 88,-14 94,-10 C86,-8 86,-3 90,2 C82,2 80,7 83,12 C74,11 70,15 71,20 C60,14 46,12 34,10 Z" fill="${c.accent}" stroke="${c.dark}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M38,-2 C52,-14 70,-18 86,-15 C80,-10 80,-6 84,-3 C74,-2 70,2 72,7 C62,6 50,6 38,6 Z" fill="#fff" opacity=".35"/>
      <path d="M42,0 C58,-10 74,-14 88,-12 M42,4 C56,-2 70,-3 84,0 M42,8 C54,6 64,8 76,12" fill="none" stroke="${c.dark}" stroke-width="1.4" stroke-linecap="round" opacity=".55"/></g></g>`;
    behind = wing(1) + wing(-1) + behind;
  }
  if (stage >= 4) {
    front += `<ellipse cx="60" cy="${id === 'purun' ? -14 : -4}" rx="24" ry="6" fill="none" stroke="#ffe066" stroke-width="4" class="spark-soft"/>
      <circle cx="16" cy="96" r="3" fill="#fff" class="spark"/><circle cx="106" cy="30" r="2.5" fill="#fff" class="spark"/>`;
  }

  // ---- きせかえ: ぼうし ----
  let eyewear = '';
  if (look.hat && HAT_SVG[look.hat]) {
    const h = HAT_SVG[look.hat];
    const top = (HEAD_TOP[id] || [30, 28])[Math.min(stage, 1)];
    if (h.eyes) {
      // 目に かける もの: キャラごとの 目の 位置と 大きさに 合わせる。形の 違う キャラは 目と 同じ 部品の 中に 入れて、体と 一緒に 動かす
      const [ex, ey, es, mono] = eyeFit(id, stage);
      const draw = mono && EYEWEAR_MONO[look.hat] ? EYEWEAR_MONO[look.hat] : h.draw;
      eyewear = `<g transform="translate(${ex},${ey - 1}) scale(${es})">${draw(c)}</g>`;
      if (!CUSTOM_BODY[id]) { front += eyewear; eyewear = ''; }
    } else front += `<g transform="translate(60,${top + 5})">${h.draw(c)}</g>`;
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
      ${CUSTOM_BODY[id] ? withEyewear(CUSTOM_BODY[id](c, u, stage, look), eyewear) : `<path d="${bodies[id][Math.min(stage, 2)]}" fill="url(#${u}-g)" stroke="${c.dark}" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="40" cy="56" rx="9" ry="5" fill="#fff" opacity=".7" transform="rotate(-30 40 56)"/>
      <circle cx="30" cy="66" r="3" fill="#fff" opacity=".6"/>
      ${mid}
      ${FACES[id] ? FACES[id](c, stage) : `<g class="eyes">
        <ellipse cx="46" cy="72" rx="6" ry="8" fill="#1d1d2b"/><ellipse cx="74" cy="72" rx="6" ry="8" fill="#1d1d2b"/>
        <circle cx="48" cy="69" r="2.4" fill="#fff"/><circle cx="76" cy="69" r="2.4" fill="#fff"/>
      </g>
      <path d="M52,86 Q60,94 68,86" fill="none" stroke="#1d1d2b" stroke-width="3" stroke-linecap="round"/>`}`}
      ${front}
    </g>
    ${look.pet && PET_SVG[look.pet] ? `<g class="pet" transform="translate(114,111) scale(1.5)">${PET_SVG[look.pet]()}</g>` : ''}
  </svg>`;
}

// ---------------- 目に かける きせかえ (サングラスなど) の 位置 ----------------
// [目の まんなかの x, y, 大きさ]。ふつうの スライムは (60, 72) で 目の はばが 40
function eyeFit(id, stage) {
  const g = stage >= 1 ? 1.08 : 1;
  const fit = {
    yukidarun: [60, 58, 0.93],
    yurarin: [60, 50, 1],
    saikoro: [51, 74, 0.75],
    imomushi: stage >= 3 ? [60, 50, 0.5] : [36, 84, 0.65],
    chochin: [60, 53, 1.1, 'mono'], // 一つ目: レンズ 1 まいの サングラス (EYEWEAR_MONO)
    torio: [60, 76 - 40 * g * 0.42 + 3.5, 0.55], // うえの リーダーの 顔
  }[id];
  return fit || [60, 72, 1];
}
// 目が 1 つの キャラ用 (ちょうちんりん)。目の まんなかが (0,0)、目の 大きさは 半径 13 くらい
const EYEWEAR_MONO = {
  // 半月型の レンズ 1 まい (上が まっすぐで、下に まるく ふくらむ) + 左右に 少し のびる つる
  shades: () => `<path d="M-20,-10 L-33,-12 M20,-10 L33,-12" stroke="#111" stroke-width="3" stroke-linecap="round"/>
    <path d="M-21,-11 L21,-11 A21,21 0 0 1 -21,-11 Z" fill="#111" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
    <path d="M-14,-7 L-6,-7" stroke="#fff" stroke-width="2.2" opacity=".7" stroke-linecap="round"/>
    <path d="M-13,-1 C-11,3 -8,5 -5,6" fill="none" stroke="#fff" stroke-width="1.6" opacity=".35" stroke-linecap="round"/>`,
};
// 形の 違う キャラの 体に、目に かける ものを 入れる (目の すぐ あと = 同じ 動く 部品の 中)
function withEyewear(body, eyewear) {
  if (!eyewear) return body.replace('<!--eyewear-->', '');
  if (body.includes('<!--eyewear-->')) return body.replace('<!--eyewear-->', eyewear);
  const i = body.indexOf('<g class="eyes">');
  if (i < 0) return body + eyewear;
  const j = body.indexOf('</g>', i) + 4;
  return body.slice(0, j) + eyewear + body.slice(j);
}

// ---------------- スライムの かたちに とらわれない キャラの 体 ----------------
// (c: 色, u: この 絵の id, stage: 進化, look: きせかえ)。ふつうの 体・顔の かわりに 描く
const CUSTOM_BODY = {
  // トリオりん: 小さな 3 びきが ピラミッドの ように つみかさなる。顔も 3 びき ちがう
  torio(c, u, stage, look) {
    // 3 びきの 色: 進化ごとの 色 (きせかえの 色に tri が あれば それ)。ない ときは その 色の 3 だんかい
    const tri = c.tri && !look.rainbow ? c.tri : [[c.main, c.dark], [c.accent || c.main, c.dark], [c.light || c.main, c.dark]];
    const g = stage >= 1 ? 1.08 : 1;
    const blob = (x, y, w, h) => `M${x},${y - h} C${x + w * 0.42},${y - h} ${x + w / 2},${y - h * 0.5} ${x + w / 2},${y - h * 0.22} C${x + w / 2},${y} ${x + w * 0.3},${y} ${x},${y} C${x - w * 0.3},${y} ${x - w / 2},${y} ${x - w / 2},${y - h * 0.22} C${x - w / 2},${y - h * 0.5} ${x - w * 0.42},${y - h} ${x},${y - h} Z`;
    const one = (i, x, y, w, h, face) => {
      const [col, dk] = tri[i];
      return `<path d="${blob(x, y, w, h)}" fill="${look.rainbow ? `url(#${u}-g)` : col}" stroke="${dk}" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="${blob(x, y, w, h)}" fill="url(#${u}-tshade)"/>
        <ellipse cx="${x - w * 0.2}" cy="${y - h * 0.72}" rx="${w * 0.14}" ry="${h * 0.08}" fill="#fff" opacity=".75" transform="rotate(-25 ${x - w * 0.2} ${y - h * 0.72})"/>
        ${face(x, y - h * 0.42)}`;
    };
    const eyeDot = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="3.2" ry="4.2" fill="#1d1d2b"/><circle cx="${x + 1}" cy="${y - 1.6}" r="1.3" fill="#fff"/>`;
    // ひだり (きいろ): にっこり 目 + あいた 口
    const happy = (x, y) => `<path d="M${x - 11},${y + 1} Q${x - 7},${y - 5} ${x - 3},${y + 1} M${x + 3},${y + 1} Q${x + 7},${y - 5} ${x + 11},${y + 1}" fill="none" stroke="#1d1d2b" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M${x - 5},${y + 7} Q${x},${y + 14} ${x + 5},${y + 7} Z" fill="#c92a2a" stroke="#1d1d2b" stroke-width="1.8" stroke-linejoin="round"/>
      <ellipse cx="${x - 13}" cy="${y + 7}" rx="3.5" ry="2" fill="#ff8787" opacity=".6"/><ellipse cx="${x + 13}" cy="${y + 7}" rx="3.5" ry="2" fill="#ff8787" opacity=".6"/>`;
    // みぎ (あお): まるい 目 + ウインク + ちいさな 口
    const wink = (x, y) => `${eyeDot(x - 7, y)}<path d="M${x + 3},${y} L${x + 11},${y}" stroke="#1d1d2b" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M${x - 3},${y + 9} Q${x + 1},${y + 12} ${x + 5},${y + 8}" fill="none" stroke="#1d1d2b" stroke-width="2.2" stroke-linecap="round"/>`;
    // うえ (リーダー): きりっと まゆ + じしんまんまんの 口
    const leader = (x, y) => `<path d="M${x - 12},${y - 7} L${x - 3},${y - 4} M${x + 12},${y - 7} L${x + 3},${y - 4}" stroke="#1d1d2b" stroke-width="2.6" stroke-linecap="round"/>
      ${eyeDot(x - 7, y + 1)}${eyeDot(x + 7, y + 1)}
      <path d="M${x - 6},${y + 9} Q${x},${y + 15} ${x + 7},${y + 8}" fill="none" stroke="#1d1d2b" stroke-width="2.4" stroke-linecap="round"/>`;
    return `<defs><radialGradient id="${u}-tshade" cx="38%" cy="30%" r="80%"><stop offset="0%" stop-color="#fff" stop-opacity=".45"/><stop offset="55%" stop-color="#fff" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".22"/></radialGradient></defs>
      <g class="trio-l">${one(1, 35, 106, 46 * g, 40 * g, happy)}</g>
      <g class="trio-r">${one(2, 85, 106, 46 * g, 40 * g, wink)}</g>
      <g class="trio-t">${one(0, 60, 76, 44 * g, 40 * g, leader)}<!--eyewear-->${stage >= 1 ? `<path d="M60,${76 - 40 * g - 12} L62.5,${76 - 40 * g - 5} L60,${76 - 40 * g - 2} L57.5,${76 - 40 * g - 5} Z" fill="${c.accent}" stroke="${tri[0][1]}" stroke-width="1.5"/>` : ''}</g>`;
  },
  // ゆらりん: すきとおった かさ・ほしの ような もよう・ゆれる しょくしゅ
  yurarin(c, u, stage) {
    const len = stage >= 2 ? 108 : 102;
    const tents = [24, 40, 60, 80, 96].map((x, i) => `<path class="jelly-tent" style="animation-delay:${-i * 0.35}s" d="M${x},64 C${x - 7},${74 + i % 2 * 4} ${x + 7},${86} ${x},${len - Math.abs(2 - i) * 6}" fill="none" stroke="${c.main}" stroke-width="5" stroke-linecap="round" opacity=".85"/>`).join('');
    const arms = `<path class="jelly-tent" d="M52,64 C44,78 60,88 50,${len + 2}" fill="none" stroke="${c.light}" stroke-width="7" stroke-linecap="round" opacity=".8"/>
      <path class="jelly-tent" style="animation-delay:-.6s" d="M68,64 C76,78 60,88 70,${len + 2}" fill="none" stroke="${c.light}" stroke-width="7" stroke-linecap="round" opacity=".8"/>`;
    const bell = 'M12,64 C12,30 34,16 60,16 C86,16 108,30 108,64 C102,70 96,62 90,68 C84,74 78,64 72,70 C66,76 54,76 48,70 C42,64 36,74 30,68 C24,62 18,70 12,64 Z';
    const dots = stage >= 1 ? [[30, 44], [90, 42], [40, 28], [80, 28], [60, 24]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="${c.accent}" class="spark-soft"/>`).join('') : '';
    return `<g class="jelly">
      ${tents}${arms}
      <path d="${bell}" fill="url(#${u}-g)" opacity=".9" stroke="${c.dark}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M22,58 C24,36 40,26 60,26 C80,26 96,36 98,58" fill="none" stroke="${c.light}" stroke-width="3" opacity=".5"/>
      ${[[44, 38, -30], [76, 38, 30], [52, 30, -10], [68, 30, 10]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="4" fill="${c.accent}" opacity=".35" transform="rotate(${r} ${x} ${y})"/>`).join('')}
      <path d="M26,40 C30,28 40,22 50,21" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/>
      ${dots}
      <g class="eyes"><ellipse cx="46" cy="50" rx="5.5" ry="6.5" fill="#1d1d2b"/><ellipse cx="74" cy="50" rx="5.5" ry="6.5" fill="#1d1d2b"/>
        <circle cx="48" cy="47.5" r="2.2" fill="#fff"/><circle cx="76" cy="47.5" r="2.2" fill="#fff"/><circle cx="44.5" cy="52.5" r="1" fill="#fff"/><circle cx="72.5" cy="52.5" r="1" fill="#fff"/></g>
      <ellipse cx="36" cy="58" rx="4.5" ry="2.6" fill="${c.accent}" opacity=".6"/><ellipse cx="84" cy="58" rx="4.5" ry="2.6" fill="${c.accent}" opacity=".6"/>
      <path d="M55,58 Q57.5,61 60,58 Q62.5,61 65,58" fill="none" stroke="#1d1d2b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`;
  },
  // サイコロりん: 立体の サイコロ。手前の 面に 顔、上の 面に 5、横の 面に 3 (となりあう 面に おなじ 目は こない)
  saikoro(c, u, stage) {
    // 目は ふちと おなじ 色で うすく (目立ちすぎない ように)
    const pip = (x, y, r = 3.6) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c.dark}" opacity=".4"/>`;
    return `<g class="dice">
      <path d="M22,50 L44,36 L102,36 L80,50 Z" fill="${c.light}" stroke="${c.dark}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M80,50 L102,36 L102,90 L80,104 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M80,50 L102,36 L102,90 L80,104 Z" fill="#000" opacity=".14"/>
      <rect x="22" y="50" width="58" height="54" rx="9" fill="url(#${u}-g)" stroke="${c.dark}" stroke-width="3"/>
      <path d="M30,56 C40,54 56,54 66,56" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>
      ${[[42, 46.5], [71, 46.5], [62, 43], [53, 39.5], [82, 39.5]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3.8" ry="2.1" fill="${c.dark}" opacity=".4"/>`).join('')}
      ${pip(85.5, 60, 3)}${pip(91, 70, 3)}${pip(96.5, 80, 3)}
      <g class="eyes"><ellipse cx="41" cy="74" rx="5" ry="6.5" fill="#1d1d2b"/><ellipse cx="61" cy="74" rx="5" ry="6.5" fill="#1d1d2b"/>
        <circle cx="42.5" cy="71.5" r="2" fill="#fff"/><circle cx="62.5" cy="71.5" r="2" fill="#fff"/></g>
      <path d="M45,86 Q51,93 57,86" fill="none" stroke="#1d1d2b" stroke-width="2.8" stroke-linecap="round"/>
      <ellipse cx="32" cy="84" rx="4" ry="2.4" fill="${c.accent}" opacity=".45"/><ellipse cx="70" cy="84" rx="4" ry="2.4" fill="${c.accent}" opacity=".45"/>
      ${stage >= 1 ? `<path d="M14,40 L16,45 L21,47 L16,49 L14,54 L12,49 L7,47 L12,45 Z" fill="${c.accent}" class="spark"/>` : ''}
    </g>`;
  },
  // いもりん: 3 段階目までは 玉が つながった イモムシ、4 段階目から チョウチョ
  imomushi(c, u, stage) {
    if (stage >= 3) {
      const wing = sx => `<g transform="translate(60,64) scale(${sx},1)"><g class="bfly-wing">
        <path d="M4,-4 C14,-40 52,-50 58,-24 C62,-8 40,2 8,2 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M4,4 C30,4 50,14 46,32 C42,46 18,40 6,14 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="3" stroke-linejoin="round"/>
        <circle cx="34" cy="-22" r="9" fill="${c.accent}" opacity=".85"/><circle cx="34" cy="-22" r="4" fill="${c.light}"/>
        <circle cx="30" cy="22" r="6" fill="${c.accent}" opacity=".85"/>
        <path d="M10,-6 C22,-24 38,-32 50,-28" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".5"/></g></g>`;
      return `${wing(1)}${wing(-1)}
        <ellipse cx="60" cy="80" rx="11" ry="26" fill="url(#${u}-g)" stroke="${c.dark}" stroke-width="3"/>
        <path d="M52,76 L68,76 M52,86 L68,86 M53,96 L67,96" stroke="${c.dark}" stroke-width="2" opacity=".5"/>
        <circle cx="60" cy="50" r="17" fill="url(#${u}-g)" stroke="${c.dark}" stroke-width="3"/>
        <path d="M54,36 C50,24 42,20 38,22 M66,36 C70,24 78,20 82,22" fill="none" stroke="${c.dark}" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="38" cy="22" r="3.5" fill="${c.accent}"/><circle cx="82" cy="22" r="3.5" fill="${c.accent}"/>
        <g class="eyes"><ellipse cx="54" cy="50" rx="3.5" ry="4.5" fill="#1d1d2b"/><ellipse cx="66" cy="50" rx="3.5" ry="4.5" fill="#1d1d2b"/>
          <circle cx="55" cy="48.5" r="1.4" fill="#fff"/><circle cx="67" cy="48.5" r="1.4" fill="#fff"/></g>
        <path d="M56,57 Q60,61 64,57" fill="none" stroke="#1d1d2b" stroke-width="2.2" stroke-linecap="round"/>
        ${stage >= 4 ? `<g class="spark">${[[10, 90], [112, 94], [18, 30], [104, 26]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="${c.accent}"/>`).join('')}</g>` : ''}`;
    }
    // うしろから 玉を ならべる (いちばん 左が あたま)
    const segs = stage >= 2 ? [[110, 94, 11], [94, 92, 13], [78, 90, 14], [60, 90, 15]] : [[104, 94, 12], [86, 92, 14], [66, 90, 15]];
    return `<g class="imo">
      ${segs.map(([x, y, r], i) => `<g class="imo-seg" style="animation-delay:${-i * 0.15}s">
        <path d="M${x - 5},${y + r - 2} L${x - 6},${y + r + 5} M${x + 5},${y + r - 2} L${x + 6},${y + r + 5}" stroke="${c.dark}" stroke-width="3" stroke-linecap="round"/>
        <circle cx="${x}" cy="${y}" r="${r}" fill="url(#${u}-g)" stroke="${c.dark}" stroke-width="2.6"/>
        <circle cx="${x}" cy="${y - r * 0.35}" r="${r * 0.28}" fill="${c.accent}" opacity=".9"/></g>`).join('')}
      <g class="imo-head">
        <path d="M30,62 C26,48 20,42 14,42 M44,60 C46,46 52,40 58,40" fill="none" stroke="${c.dark}" stroke-width="3" stroke-linecap="round"/>
        <circle cx="14" cy="42" r="4" fill="${c.accent}" stroke="${c.dark}" stroke-width="1.5"/><circle cx="58" cy="40" r="4" fill="${c.accent}" stroke="${c.dark}" stroke-width="1.5"/>
        <path d="M28,${104} L26,${108} M44,${104} L46,${108}" stroke="${c.dark}" stroke-width="3" stroke-linecap="round"/>
        <circle cx="36" cy="84" r="23" fill="url(#${u}-g)" stroke="${c.dark}" stroke-width="3"/>
        <ellipse cx="28" cy="72" rx="6" ry="3.5" fill="#fff" opacity=".7" transform="rotate(-30 28 72)"/>
        <g class="eyes"><ellipse cx="28" cy="84" rx="4.5" ry="6" fill="#1d1d2b"/><ellipse cx="44" cy="84" rx="4.5" ry="6" fill="#1d1d2b"/>
          <circle cx="29.5" cy="81.5" r="1.8" fill="#fff"/><circle cx="45.5" cy="81.5" r="1.8" fill="#fff"/></g>
        <ellipse cx="20" cy="93" rx="4" ry="2.4" fill="#ff8787" opacity=".55"/><ellipse cx="52" cy="93" rx="4" ry="2.4" fill="#ff8787" opacity=".55"/>
        <path d="M31,95 Q36,100 41,95" fill="none" stroke="#1d1d2b" stroke-width="2.4" stroke-linecap="round"/>
      </g></g>`;
  },
  // ちょうちんりん: 一つ目の おばけちょうちん。ふらふら ゆれて、した を ぺろっと 出す
  chochin(c, u, stage) {
    const wisps = stage >= 1 ? `<g class="orbit">${[[4, 54], [116, 60], [100, 12]].map(([x, y]) => `<path transform="translate(${x},${y})" d="M0,-9 C5,-3 6,3 0,7 C-6,3 -5,-3 0,-9 Z" fill="${c.accent}" opacity=".85"/>`).join('')}</g>` : '';
    return `${wisps}<g class="lantern">
      <path d="M60,4 L60,16" stroke="${c.dark}" stroke-width="3"/><path d="M52,6 C52,-2 68,-2 68,6" fill="none" stroke="${c.dark}" stroke-width="3" stroke-linecap="round"/>
      <rect x="38" y="14" width="44" height="10" rx="3" fill="#343a40" stroke="#1d1d2b" stroke-width="2"/>
      <path d="M40,24 C14,32 14,90 40,98 L80,98 C106,90 106,32 80,24 Z" fill="url(#${u}-g)" stroke="${c.dark}" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="60" cy="60" rx="30" ry="28" fill="${c.accent}" opacity=".28" class="spark-soft"/>
      <path d="M22,42 C40,38 80,38 98,42 M18,60 C40,57 80,57 102,60 M22,78 C40,82 80,82 98,78" fill="none" stroke="${c.dark}" stroke-width="2" opacity=".45"/>
      <path d="M28,36 C24,48 24,70 28,84" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".45"/>
      <rect x="38" y="96" width="44" height="10" rx="3" fill="#343a40" stroke="#1d1d2b" stroke-width="2"/>
      <path d="M52,106 L50,116 M60,106 L60,118 M68,106 L70,116" stroke="${c.accent}" stroke-width="2.5" stroke-linecap="round"/>
      <g class="eyes"><ellipse cx="60" cy="52" rx="13" ry="12" fill="#fff" stroke="#1d1d2b" stroke-width="2.5"/>
        <circle cx="57" cy="54" r="6.5" fill="#1d1d2b"/><circle cx="54.5" cy="51.5" r="2.4" fill="#fff"/></g>
      <path d="M44,72 Q60,84 76,72" fill="#1d1d2b" stroke="#1d1d2b" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M58,76 C58,88 70,92 70,82 L68,75 Z" fill="#ff6b6b" stroke="#c92a2a" stroke-width="1.8" stroke-linejoin="round"/>
      <ellipse cx="36" cy="66" rx="5" ry="3" fill="#ff8787" opacity=".55"/><ellipse cx="84" cy="66" rx="5" ry="3" fill="#ff8787" opacity=".55"/>
    </g>`;
  },
};

const RAINBOW = ['#ff6b6b', '#ffa94d', '#ffe066', '#69db7c', '#4dabf7', '#9775fa', '#f783ac'];

// 頭の てっぺんの 高さ [最初の すがた, 進化後]。ぼうしの 位置に つかう
const HEAD_TOP = { purun: [22, 16], piriri: [30, 28], gotsun: [32, 28], homura: [30, 24], moririn: [34, 30], kagemaru: [30, 26], ryumaru: [30, 28], kirari: [32, 28], koorin: [30, 26], fuwari: [30, 26], metarun: [36, 32], onpuru: [34, 30], pitarin: [30, 26], dororin: [32, 28], gorurin: [18, 14], yukidarun: [16, 12], yuusharin: [32, 28], fuerin: [34, 28], torio: [34, 30], yurarin: [16, 16], saikoro: [36, 36], imomushi: [60, 60], chochin: [14, 14] };

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
  flower: { draw: () => `<g transform="translate(-14,4)">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="${Math.cos(a * Math.PI / 180) * 6}" cy="${Math.sin(a * Math.PI / 180) * 6}" rx="5" ry="4" fill="#ffa8c5" stroke="#e64980" stroke-width="1.2" transform="rotate(${a} ${Math.cos(a * Math.PI / 180) * 6} ${Math.sin(a * Math.PI / 180) * 6})"/>`).join('')}<circle r="3.5" fill="#ffd43b"/></g><path d="M-4,6 C4,2 10,2 16,6" stroke="#2b8a3e" stroke-width="2.5" fill="none"/>` },
  cap: { draw: () => `<path d="M-22,2 C-22,-18 20,-18 20,2 Z" fill="#228be6" stroke="#1864ab" stroke-width="2"/><path d="M14,0 L36,4 L34,8 L12,4 Z" fill="#1971c2" stroke="#1864ab" stroke-width="1.5"/><circle cx="-1" cy="-15" r="2.5" fill="#fff"/><path d="M-10,-6 L8,-6" stroke="#fff" stroke-width="2" opacity=".6"/>` },
  chef: { draw: () => `<rect x="-16" y="-10" width="32" height="12" rx="2" fill="#fff" stroke="#ced4da" stroke-width="2"/><circle cx="-10" cy="-18" r="10" fill="#fff" stroke="#ced4da" stroke-width="2"/><circle cx="10" cy="-18" r="10" fill="#fff" stroke="#ced4da" stroke-width="2"/><circle cx="0" cy="-24" r="11" fill="#fff" stroke="#ced4da" stroke-width="2"/><rect x="-15" y="-12" width="30" height="6" fill="#fff"/>` },
  bunny: { draw: () => `<path d="M-14,4 C-22,-20 -18,-40 -10,-40 C-2,-40 -4,-16 -6,4 Z" fill="#fff" stroke="#ced4da" stroke-width="2"/><path d="M-12,-2 C-16,-18 -14,-32 -10,-32 C-7,-32 -8,-16 -9,-2 Z" fill="#ffc9de"/><path d="M14,4 C22,-20 18,-40 10,-40 C2,-40 4,-16 6,4 Z" fill="#fff" stroke="#ced4da" stroke-width="2"/><path d="M12,-2 C16,-18 14,-32 10,-32 C7,-32 8,-16 9,-2 Z" fill="#ffc9de"/>` },
  santa: { draw: () => `<path d="M-22,0 C-18,-26 10,-34 26,-18 C20,-18 14,-12 16,0 Z" fill="#e03131" stroke="#a61e1e" stroke-width="2"/><circle cx="28" cy="-18" r="6" fill="#fff" stroke="#dee2e6" stroke-width="1.5"/><rect x="-25" y="-4" width="44" height="9" rx="4.5" fill="#fff" stroke="#dee2e6" stroke-width="1.5"/>` },
  dragonhorn: { draw: () => `<path d="M-18,6 C-26,-8 -30,-24 -22,-40 C-18,-28 -12,-16 -8,2 Z" fill="#ffd43b" stroke="#b8860b" stroke-width="2" stroke-linejoin="round"/><path d="M18,6 C26,-8 30,-24 22,-40 C18,-28 12,-16 8,2 Z" fill="#ffd43b" stroke="#b8860b" stroke-width="2" stroke-linejoin="round"/><path d="M-22,-16 L-14,-18 M-24,-26 L-17,-28 M22,-16 L14,-18 M24,-26 L17,-28" stroke="#b8860b" stroke-width="1.5"/><circle cx="-22" cy="-40" r="2" fill="#fff" class="spark"/>` },
  kabuto: { draw: () => `<path d="M-28,6 C-28,-24 28,-24 28,6 L22,6 C22,-14 -22,-14 -22,6 Z" fill="#343a40" stroke="#000" stroke-width="2"/><path d="M-28,2 L-36,10 L-24,8 Z M28,2 L36,10 L24,8 Z" fill="#495057" stroke="#000" stroke-width="1.5"/><path d="M-4,-14 C-12,-26 -22,-40 -20,-52 C-14,-40 -6,-30 2,-18 M4,-14 C12,-26 22,-40 20,-52 C14,-40 6,-30 -2,-18" fill="#ffd43b" stroke="#b8860b" stroke-width="2" stroke-linejoin="round"/><circle cx="0" cy="-15" r="6" fill="#ffd43b" stroke="#b8860b" stroke-width="2"/><circle cx="0" cy="-15" r="2.5" fill="#e03131"/>` },
};

// おとも: スライムの 右下に いる 小さな なかま (-14〜14 くらいの 大きさ、下の はしが y=0)
const PET_SVG = {
  chick: () => `<ellipse cx="0" cy="-9" rx="10" ry="9" fill="#ffe066" stroke="#e67700" stroke-width="1.5"/><circle cx="-3" cy="-12" r="1.6" fill="#1d1d2b"/><circle cx="3" cy="-12" r="1.6" fill="#1d1d2b"/><path d="M-2,-8 L2,-8 L0,-5 Z" fill="#ff922b"/><path d="M-1,-18 L1,-22 L2,-18" stroke="#e67700" stroke-width="1.5" fill="none"/>`,
  cat: () => `<ellipse cx="0" cy="-8" rx="11" ry="8" fill="#ffa94d" stroke="#d9480f" stroke-width="1.5"/><path d="M-9,-13 L-7,-21 L-2,-15 Z M9,-13 L7,-21 L2,-15 Z" fill="#ffa94d" stroke="#d9480f" stroke-width="1.5" stroke-linejoin="round"/><circle cx="-4" cy="-9" r="1.6" fill="#1d1d2b"/><circle cx="4" cy="-9" r="1.6" fill="#1d1d2b"/><path d="M-2,-5 Q0,-3 2,-5" stroke="#1d1d2b" stroke-width="1.2" fill="none"/><path d="M11,-6 C17,-8 18,-16 14,-18" stroke="#d9480f" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
  bunny: () => `<ellipse cx="0" cy="-8" rx="10" ry="8" fill="#fff" stroke="#adb5bd" stroke-width="1.5"/><ellipse cx="-4" cy="-20" rx="3" ry="8" fill="#fff" stroke="#adb5bd" stroke-width="1.5"/><ellipse cx="4" cy="-20" rx="3" ry="8" fill="#fff" stroke="#adb5bd" stroke-width="1.5"/><circle cx="-3" cy="-9" r="1.6" fill="#1d1d2b"/><circle cx="3" cy="-9" r="1.6" fill="#1d1d2b"/><circle cx="0" cy="-6" r="1.2" fill="#ff8fab"/>`,
  bat: () => `<g class="float"><path d="M-4,-12 C-10,-20 -18,-18 -20,-12 C-16,-12 -14,-8 -14,-6 C-10,-8 -6,-8 -4,-6 Z M4,-12 C10,-20 18,-18 20,-12 C16,-12 14,-8 14,-6 C10,-8 6,-8 4,-6 Z" fill="#6d4aa8" stroke="#2b1a4a" stroke-width="1.2"/><circle cx="0" cy="-10" r="6" fill="#8c6cc4" stroke="#2b1a4a" stroke-width="1.2"/><circle cx="-2" cy="-11" r="1.3" fill="#ffe14d"/><circle cx="2" cy="-11" r="1.3" fill="#ffe14d"/></g>`,
  ghost: () => `<g class="float"><path d="M-9,-2 L-9,-14 C-9,-22 9,-22 9,-14 L9,-2 L6,-5 L3,-2 L0,-5 L-3,-2 L-6,-5 Z" fill="#f8f9fa" stroke="#adb5bd" stroke-width="1.5" opacity=".9"/><ellipse cx="-3" cy="-13" rx="1.6" ry="2.2" fill="#1d1d2b"/><ellipse cx="3" cy="-13" rx="1.6" ry="2.2" fill="#1d1d2b"/></g>`,
  robo: () => `<rect x="-9" y="-16" width="18" height="15" rx="3" fill="#ced4da" stroke="#495057" stroke-width="1.5"/><rect x="-6" y="-13" width="12" height="6" rx="2" fill="#212529"/><circle cx="-3" cy="-10" r="1.4" fill="#63e6be"/><circle cx="3" cy="-10" r="1.4" fill="#63e6be"/><path d="M0,-16 L0,-21" stroke="#495057" stroke-width="1.5"/><circle cx="0" cy="-22" r="2" fill="#ff6b6b" class="spark-soft"/>`,
  fairy: () => `<g class="float"><path d="M-2,-12 C-10,-20 -16,-14 -12,-8 Z M2,-12 C10,-20 16,-14 12,-8 Z" fill="#c5f6fa" stroke="#3bc9db" stroke-width="1" opacity=".9"/><path transform="translate(0,-11) scale(.7)" d="M0,-11 L3.2,-3.4 L11,-3.4 L4.8,1.8 L7,10 L0,5.2 L-7,10 L-4.8,1.8 L-11,-3.4 L-3.2,-3.4 Z" fill="#ffe066" stroke="#e67700" stroke-width="1.5"/><circle cx="0" cy="-10" r="1" fill="#1d1d2b"/></g>`,
  phoenix: () => `<g class="float"><path d="M-4,-10 C-14,-22 -22,-14 -20,-6 C-14,-10 -10,-8 -6,-6 Z M4,-10 C14,-22 22,-14 20,-6 C14,-10 10,-8 6,-6 Z" fill="#ff922b" stroke="#c92a2a" stroke-width="1"/><ellipse cx="0" cy="-9" rx="6" ry="7" fill="#ffd43b" stroke="#e8590c" stroke-width="1.2"/><path d="M-2,-16 C-4,-24 2,-24 0,-18 C4,-24 6,-18 2,-15 Z" fill="#ff6b6b"/><circle cx="-2" cy="-10" r="1.2" fill="#1d1d2b"/><circle cx="2" cy="-10" r="1.2" fill="#1d1d2b"/><path d="M-1,-7 L1,-7 L0,-5 Z" fill="#e8590c"/><path d="M-3,-2 C-6,4 0,6 0,0 C0,6 6,4 3,-2 Z" fill="#ff922b" class="spark-soft"/></g>`,
  dragon: () => `<path d="M8,-6 C16,-6 18,-12 16,-16 L20,-14 C20,-6 16,-2 8,-2 Z" fill="#40c057" stroke="#2b8a3e" stroke-width="1.2"/><ellipse cx="0" cy="-8" rx="9" ry="7" fill="#51cf66" stroke="#2b8a3e" stroke-width="1.5"/><path d="M-4,-14 L-6,-20 L-1,-15 Z M4,-14 L6,-20 L1,-15 Z" fill="#ffe066" stroke="#e67700" stroke-width="1"/><path d="M-8,-10 C-16,-18 -14,-4 -8,-6 Z" fill="#96f2d7" stroke="#2b8a3e" stroke-width="1"/><circle cx="-3" cy="-9" r="1.5" fill="#1d1d2b"/><circle cx="3" cy="-9" r="1.5" fill="#1d1d2b"/><circle cx="16" cy="-20" r="1.5" fill="#ff922b" class="spark"/>`,
};

// キャラごとの 顔 (目と 口)。ない キャラは いつもの まるい 目
const FACES = {
  // おんぷる: にっこり とじた 目 + うたっている 口
  onpuru: () => `<g class="eyes"><path d="M38,72 Q46,62 54,72" fill="none" stroke="#1d1d2b" stroke-width="4" stroke-linecap="round"/>
      <path d="M66,72 Q74,62 82,72" fill="none" stroke="#1d1d2b" stroke-width="4" stroke-linecap="round"/></g>
    <ellipse cx="60" cy="88" rx="7" ry="8" fill="#1d1d2b"/><ellipse cx="60" cy="91" rx="4" ry="3.5" fill="#ff8787"/>`,
  // どろりん: うずまき目 + ぺろっと した
  dororin: () => `<g class="eyes"><path d="M46,72 m-1,0 a1,1 0 1,1 2,0 a3,3 0 1,1 -5,0 a5,5 0 1,1 9,1 a7,7 0 1,1 -12,-2" fill="none" stroke="#1d1d2b" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M74,72 m-1,0 a1,1 0 1,1 2,0 a3,3 0 1,1 -5,0 a5,5 0 1,1 9,1 a7,7 0 1,1 -12,-2" fill="none" stroke="#1d1d2b" stroke-width="2.2" stroke-linecap="round"/></g>
    <path d="M50,86 Q60,94 70,86" fill="none" stroke="#1d1d2b" stroke-width="3" stroke-linecap="round"/><path d="M60,89 C60,96 66,98 66,92 L66,88 Z" fill="#ff8787" stroke="#c92a2a" stroke-width="1.2"/>`,
  // ゴルりん: キラキラの 星の 目 + 歯を 見せて わらう
  gorurin: () => `<g class="eyes">${[46, 74].map(x => `<path transform="translate(${x},71)" d="M0,-9 L2.5,-2.5 L9,0 L2.5,2.5 L0,9 L-2.5,2.5 L-9,0 L-2.5,-2.5 Z" fill="#1d1d2b"/><circle cx="${x + 2}" cy="69" r="1.6" fill="#fff"/>`).join('')}</g>
    <path d="M48,84 Q60,98 72,84 Z" fill="#1d1d2b"/><path d="M50,85 L70,85 L68,88 L52,88 Z" fill="#fff"/>`,
  // ゆきだるん: せきたんの 目 + にんじんの はな + てんてんの 口
  yukidarun: () => `<g class="eyes"><circle cx="46" cy="58" r="4.5" fill="#212529"/><circle cx="74" cy="58" r="4.5" fill="#212529"/></g>
    <path d="M58,62 L78,66 L58,68 Z" fill="#ff922b" stroke="#d9480f" stroke-width="1.2" stroke-linejoin="round"/>
    ${[[48, 72], [54, 75], [60, 76], [66, 75], [72, 72]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="#212529"/>`).join('')}`,
  // ふえりん: にっこり 細めた 目 (^ ^) + ω の 口 + ほっぺ
  fuerin: c => `<g class="eyes"><path d="M38,74 Q46,64 54,74" fill="none" stroke="#1d1d2b" stroke-width="4" stroke-linecap="round"/>
      <path d="M66,74 Q74,64 82,74" fill="none" stroke="#1d1d2b" stroke-width="4" stroke-linecap="round"/></g>
    <ellipse cx="34" cy="84" rx="6" ry="3.5" fill="${c.accent}" opacity=".55"/><ellipse cx="86" cy="84" rx="6" ry="3.5" fill="${c.accent}" opacity=".55"/>
    <path d="M52,84 Q56,90 60,85 Q64,90 68,84" fill="none" stroke="#1d1d2b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
  // ゆうしゃりん: きりっと した まゆ + じしんの ある 口
  yuusharin: () => `<g class="eyes"><path d="M36,62 L54,66" stroke="#1d1d2b" stroke-width="3.5" stroke-linecap="round"/><path d="M84,62 L66,66" stroke="#1d1d2b" stroke-width="3.5" stroke-linecap="round"/>
      <ellipse cx="46" cy="74" rx="5.5" ry="6.5" fill="#1d1d2b"/><ellipse cx="74" cy="74" rx="5.5" ry="6.5" fill="#1d1d2b"/><circle cx="48" cy="72" r="2" fill="#fff"/><circle cx="76" cy="72" r="2" fill="#fff"/></g>
    <path d="M50,88 Q62,94 72,86" fill="none" stroke="#1d1d2b" stroke-width="3" stroke-linecap="round"/>`,
  // ぴたりん: はんぶん まぶたの おりた おちついた 目 + すこし 口角が 上がった 口
  pitarin: c => `<g class="eyes">
      <ellipse cx="46" cy="72" rx="7" ry="7" fill="#1d1d2b"/><ellipse cx="74" cy="72" rx="7" ry="7" fill="#1d1d2b"/>
      <path d="M38,71 L54,71 L54,63 L38,63 Z M66,71 L82,71 L82,63 L66,63 Z" fill="${c.main}"/>
      <path d="M38,71 L54,71 M66,71 L82,71" stroke="${c.dark}" stroke-width="3" stroke-linecap="round"/>
      <circle cx="49" cy="74" r="2" fill="${c.accent}"/><circle cx="77" cy="74" r="2" fill="${c.accent}"/></g>
    <path d="M54,87 Q62,91 68,85" fill="none" stroke="#1d1d2b" stroke-width="3" stroke-linecap="round"/>`,
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

  // ゴブリン: 大きな 頭・たれた 長い 耳・つりあがった 目・きばの ある にやり顔・ぼろの ふく・くぎの こんぼう
  // (色は サバクゴブリン・メカゴブリンの 色ちがいと そろえている)
  goblin: () => `<svg viewBox="0 0 150 150" class="enemy-svg">
    <ellipse cx="75" cy="142" rx="40" ry="6" fill="#000" opacity=".25"/>
    <g class="squish">
      <g class="club">
        <path d="M22,122 L34,70" stroke="#4a2c12" stroke-width="10" stroke-linecap="round"/>
        <path d="M22,122 L34,70" stroke="#6b4423" stroke-width="6" stroke-linecap="round"/>
        <path d="M24,78 C16,70 18,48 28,36 C36,28 50,30 52,42 C54,56 48,72 40,80 C34,84 28,84 24,78 Z" fill="#8a5a2b" stroke="#4a2c12" stroke-width="3" stroke-linejoin="round"/>
        <path d="M30,44 C34,38 42,38 44,44" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".35"/>
        <path d="M20,52 L12,48 L20,58 Z M50,44 L60,40 L52,50 Z M46,64 L56,64 L46,70 Z M26,36 L22,28 L32,34 Z M18,68 L10,70 L20,74 Z" fill="#ced4da" stroke="#495057" stroke-width="1.5" stroke-linejoin="round"/>
        <circle cx="32" cy="56" r="2.2" fill="#4a2c12"/><circle cx="40" cy="68" r="2.2" fill="#4a2c12"/><circle cx="42" cy="48" r="1.8" fill="#4a2c12"/>
      </g>
      <path d="M58,126 L58,138 M92,126 L92,138" stroke="#2c5a20" stroke-width="11" stroke-linecap="round"/>
      <path d="M58,126 L58,138 M92,126 L92,138" stroke="#5aa845" stroke-width="7" stroke-linecap="round"/>
      <path d="M46,140 C46,134 66,132 68,140 Z M82,140 C84,132 104,134 104,140 Z" fill="#5aa845" stroke="#2c5a20" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M48,140 L46,144 M54,140 L53,144 M98,140 L100,144 M104,140 L106,143" stroke="#2c5a20" stroke-width="2" stroke-linecap="round"/>
      <path d="M52,102 C46,114 48,126 58,130 L92,130 C102,126 104,114 98,102 C90,94 60,94 52,102 Z" fill="#6cc152" stroke="#2c5a20" stroke-width="3"/>
      <path d="M48,106 C54,98 96,98 102,106 L108,130 L98,126 L92,134 L84,126 L75,134 L66,126 L58,134 L52,126 L42,130 Z" fill="#7a5230" stroke="#3e2912" stroke-width="3" stroke-linejoin="round"/>
      <path d="M56,108 L60,124 M88,110 L84,122 M70,104 L72,112" stroke="#3e2912" stroke-width="1.8" stroke-linecap="round" opacity=".6"/>
      <rect x="47" y="112" width="56" height="7" rx="3" fill="#6b4423" stroke="#3e2912" stroke-width="2"/>
      <rect x="70" y="111" width="10" height="9" rx="2" fill="#d4a017" stroke="#3e2912" stroke-width="2"/>
      <path d="M100,104 C108,110 112,118 112,124" fill="none" stroke="#2c5a20" stroke-width="12" stroke-linecap="round"/>
      <path d="M100,104 C108,110 112,118 112,124" fill="none" stroke="#6cc152" stroke-width="8" stroke-linecap="round"/>
      <path d="M108,124 L106,130 M112,125 L112,131 M116,124 L118,129" stroke="#2c5a20" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M54,104 C44,108 34,104 28,96" fill="none" stroke="#2c5a20" stroke-width="12" stroke-linecap="round"/>
      <path d="M54,104 C44,108 34,104 28,96" fill="none" stroke="#6cc152" stroke-width="8" stroke-linecap="round"/>
      <circle cx="27" cy="96" r="7" fill="#6cc152" stroke="#2c5a20" stroke-width="2.5"/>
      <path d="M44,58 C28,54 12,44 2,32 C8,50 20,64 42,74 Z" fill="#5aa845" stroke="#2c5a20" stroke-width="3" stroke-linejoin="round"/>
      <path d="M40,62 C28,58 18,50 10,42 C16,54 26,62 40,68 Z" fill="#4f9a3c"/>
      <path d="M106,58 C122,54 138,44 148,32 C142,50 130,64 108,74 Z" fill="#5aa845" stroke="#2c5a20" stroke-width="3" stroke-linejoin="round"/>
      <path d="M110,62 C122,58 132,50 140,42 C134,54 124,62 110,68 Z" fill="#4f9a3c"/>
      <circle cx="138" cy="50" r="4" fill="none" stroke="#ffe14d" stroke-width="2.5"/>
      <path d="M75,26 C100,26 114,44 114,64 C114,86 98,98 75,98 C52,98 36,86 36,64 C36,44 50,26 75,26 Z" fill="#6cc152" stroke="#2c5a20" stroke-width="3"/>
      <path d="M40,74 C46,92 104,92 110,74 C104,96 46,96 40,74 Z" fill="#000" opacity=".12"/>
      <path d="M50,40 C56,32 66,30 72,32" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".3"/>
      <path d="M64,30 L66,14 L74,27 L80,12 L84,28 L92,18 L90,32 Z" fill="#2c5a20"/>
      <path d="M48,52 L68,60 L66,64 L48,58 Z M102,52 L82,60 L84,64 L102,58 Z" fill="#2c5a20"/>
      <path d="M50,62 C54,58 64,60 68,66 C62,72 54,70 50,62 Z M100,62 C96,58 86,60 82,66 C88,72 96,70 100,62 Z" fill="#ffe14d" stroke="#2c5a20" stroke-width="2"/>
      <ellipse cx="60" cy="65" rx="1.8" ry="4" fill="#1f1f1f"/><ellipse cx="90" cy="65" rx="1.8" ry="4" fill="#1f1f1f"/>
      <circle cx="57" cy="63" r="1.3" fill="#fff"/><circle cx="87" cy="63" r="1.3" fill="#fff"/>
      <path d="M75,62 C84,66 88,74 82,79 C77,81 73,77 75,62 Z" fill="#4f9a3c" stroke="#2c5a20" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="81" cy="72" r="1.6" fill="#2c5a20"/><circle cx="47" cy="78" r="2" fill="#4f9a3c"/><circle cx="104" cy="74" r="1.6" fill="#4f9a3c"/>
      <path d="M52,82 Q75,98 98,82 Q94,94 75,96 Q56,94 52,82 Z" fill="#3a1a12" stroke="#2c5a20" stroke-width="2" stroke-linejoin="round"/>
      <path d="M58,86 L61,91 L64,87 L67,92 L70,88 L73,92 L77,88 L80,92 L83,88 L86,91 L90,86 Z" fill="#fff"/>
      <path d="M88,93 L92,84 L94,94 Z" fill="#fff" stroke="#2c5a20" stroke-width="1"/>
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

  // ドラゴン: すわった すがた・S 字の 首・うしろへ まがる 角・ひらいた 口と きば・ひだの ある つばさ 2 まい・とげの ある しっぽ
  // (色は メカドラゴン・ワイバーン・てんくうりゅうの 色ちがいと そろえている)
  dragon: () => `<svg viewBox="0 0 200 170" class="enemy-svg">
    <ellipse cx="112" cy="162" rx="72" ry="8" fill="#000" opacity=".3"/>
    <g class="squish">
      <g class="wing wing-big">
        <path d="M128,84 C136,46 150,22 170,12 C168,26 172,34 178,40 C170,46 170,54 176,60 C166,64 164,72 168,80 C156,80 146,86 140,94 Z" fill="#7a1f2b" stroke="#3d0d14" stroke-width="3" stroke-linejoin="round" opacity=".75"/>
        <path d="M112,86 C114,50 136,16 170,4 L176,2 L172,10 C186,20 194,30 198,44 C190,44 184,50 184,58 C176,56 168,62 170,72 C160,70 152,76 154,86 C142,84 132,88 128,98 Z" fill="#7a1f2b" stroke="#3d0d14" stroke-width="3" stroke-linejoin="round"/>
        <path d="M116,90 C124,58 146,26 172,8 M132,94 C146,74 170,52 196,44 M130,92 C146,72 164,62 184,58 M128,94 C140,80 156,72 170,72" fill="none" stroke="#3d0d14" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M122,80 C130,56 146,34 162,22" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".18"/>
      </g>
      <path d="M150,138 C172,140 190,128 194,106 C196,94 188,86 180,90 C188,96 186,112 176,120 C166,128 154,126 146,122 Z" fill="#b8323f" stroke="#5a1019" stroke-width="3" stroke-linejoin="round"/>
      <path d="M180,90 L170,80 L184,82 L190,72 L192,86 Z" fill="#ffcf4a" stroke="#8a5a00" stroke-width="2" stroke-linejoin="round"/>
      <path d="M186,114 L196,112 L190,120 Z M176,126 L184,132 L174,132 Z" fill="#ffcf4a" stroke="#8a5a00" stroke-width="1.5" stroke-linejoin="round"/>
      <ellipse cx="150" cy="150" rx="18" ry="10" fill="#b8323f" stroke="#5a1019" stroke-width="3"/>
      <path d="M84,112 C82,88 108,78 134,84 C158,90 168,114 160,136 C152,156 112,160 94,150 C84,142 84,126 84,112 Z" fill="#c53d4a" stroke="#5a1019" stroke-width="3"/>
      <path d="M92,112 C94,98 106,94 114,100 C122,116 118,142 104,152 C94,148 88,130 92,112 Z" fill="#f2b37a" stroke="#d98f58" stroke-width="2"/>
      <path d="M94,108 C100,106 108,106 114,108 M92,118 C100,116 110,116 118,118 M92,128 C100,127 110,127 118,129 M94,138 C100,138 108,139 114,141" fill="none" stroke="#d98f58" stroke-width="2" stroke-linecap="round"/>
      <path d="M140,88 C150,90 160,98 164,108" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".2"/>
      <path d="M150,112 C166,116 172,132 164,146 C158,154 142,156 134,150 C128,140 134,120 150,112 Z" fill="#b8323f" stroke="#5a1019" stroke-width="3"/>
      <path d="M126,160 C126,150 164,148 170,160 Z" fill="#b8323f" stroke="#5a1019" stroke-width="3" stroke-linejoin="round"/>
      <path d="M130,160 L127,166 M140,160 L138,166 M150,160 L150,166 M160,160 L162,166" stroke="#fff3bf" stroke-width="3" stroke-linecap="round"/>
      <path d="M96,124 C88,132 82,138 78,146" fill="none" stroke="#5a1019" stroke-width="13" stroke-linecap="round"/>
      <path d="M96,124 C88,132 82,138 78,146" fill="none" stroke="#b8323f" stroke-width="9" stroke-linecap="round"/>
      <path d="M72,148 L70,154 M78,150 L77,156 M84,148 L86,154" stroke="#fff3bf" stroke-width="3" stroke-linecap="round"/>
      <path d="M100,98 C88,86 80,70 72,54" fill="none" stroke="#5a1019" stroke-width="31" stroke-linecap="round"/>
      <path d="M100,98 C88,86 80,70 72,54" fill="none" stroke="#c53d4a" stroke-width="25" stroke-linecap="round"/>
      <path d="M92,100 C82,88 74,74 66,60" fill="none" stroke="#f2b37a" stroke-width="9" stroke-linecap="round"/>
      <path d="M86,62 L98,56 L94,68 L106,66 L100,78 L112,78 L104,88 Z" fill="#ffcf4a" stroke="#8a5a00" stroke-width="2" stroke-linejoin="round"/>
      <g class="head">
        <path d="M72,30 C80,16 94,8 108,10 C98,14 90,22 84,34 Z" fill="#ffcf4a" stroke="#8a5a00" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M60,30 C62,18 70,8 80,4 C74,12 70,20 70,32 Z" fill="#e0b040" stroke="#8a5a00" stroke-width="2" stroke-linejoin="round"/>
        <path d="M86,46 L104,38 L96,50 L108,54 L92,60 Z" fill="#7a1f2b" stroke="#3d0d14" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M88,50 C88,34 74,24 58,26 C46,28 40,34 32,38 C20,40 8,44 6,54 C5,60 8,64 14,64 L44,64 C60,66 84,66 88,50 Z" fill="#c53d4a" stroke="#5a1019" stroke-width="3" stroke-linejoin="round"/>
        <path d="M16,66 C24,78 44,84 62,74 L60,64 L16,64 Z" fill="#3a0a10" stroke="#5a1019" stroke-width="3" stroke-linejoin="round"/>
        <path d="M26,72 C34,70 44,70 52,74 C44,78 32,78 26,72 Z" fill="#ff8787"/>
        <path d="M18,64 L21,71 L24,64 Z M30,64 L33,72 L36,64 Z M46,64 L48,70 L51,64 Z M26,76 L29,70 L32,77 Z M40,78 L43,71 L46,78 Z" fill="#fff"/>
        <path d="M14,64 C22,82 46,88 64,74 C66,82 50,92 32,88 C20,86 12,76 14,64 Z" fill="#c53d4a" stroke="#5a1019" stroke-width="3" stroke-linejoin="round"/>
        <path d="M22,46 C30,40 44,36 56,36" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".3"/>
        <ellipse cx="14" cy="50" rx="2.5" ry="1.8" fill="#5a1019"/>
        <circle cx="4" cy="44" r="3" fill="#adb5bd" opacity=".5" class="spark"/><circle cx="-2" cy="38" r="2" fill="#adb5bd" opacity=".4" class="spark"/>
        <path d="M50,44 C56,38 68,38 72,44 C68,52 56,52 50,44 Z" fill="#ffe14d" stroke="#5a1019" stroke-width="2"/>
        <ellipse cx="62" cy="45" rx="1.8" ry="5" fill="#1a1a1a"/><circle cx="59" cy="43" r="1.4" fill="#fff"/>
        <path d="M46,40 C54,32 68,32 76,38" fill="none" stroke="#5a1019" stroke-width="4" stroke-linecap="round"/>
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

// へんい種は もとの 敵の 絵に 色の フィルターを かけて つかい回す (新しい 絵を 作らないので 軽い)
function enemySVG(id) {
  const v = typeof ENEMY_VARIANT !== 'undefined' && ENEMY_VARIANT[id];
  if (!v) return polishEnemy(ENEMY_SVG[id]());
  return polishEnemy(ENEMY_SVG[v.base]()).replace('<svg ', `<svg style="filter:${v.filter}" `);
}

// 敵の 絵の しあげ (ぜんぶの 敵に かける): 体の まわりに こい ふちどり、右下に かげ、左上に ハイライト。
// 足もとの 影 (さいしょの 黒い だえん) には かけない
function polishEnemy(svg) {
  const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const k = vb ? (+vb[1] + +vb[2]) / 300 : 1; // 絵の 大きさに あわせる
  const open = svg.indexOf('>') + 1, close = svg.lastIndexOf('</svg>');
  if (open <= 0 || close < 0) return svg;
  let inner = svg.slice(open, close), ground = '';
  inner = inner.replace(/^\s*(<ellipse[^>]*fill="#000"[^>]*\/>)/, (_, e) => { ground = e; return ''; });
  const u = 'q' + (++_svgUid), f = n => +(n * k).toFixed(2);
  return `${svg.slice(0, open)}<defs><filter id="${u}" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
      <feMorphology in="SourceAlpha" operator="dilate" radius="${f(1.8)}" result="dil"/>
      <feFlood flood-color="#140c28" flood-opacity=".9"/><feComposite in2="dil" operator="in" result="outline"/>
      <feGaussianBlur in="SourceAlpha" stdDeviation="${f(3)}" result="bump"/>
      <feDiffuseLighting in="bump" surfaceScale="${f(4)}" diffuseConstant="1" lighting-color="#fff" result="diff"><feDistantLight azimuth="235" elevation="52"/></feDiffuseLighting>
      <feComposite in="diff" in2="SourceGraphic" operator="arithmetic" k1="1.22" k2="0" k3="0" k4="0" result="lit"/>
      <feComposite in="lit" in2="SourceAlpha" operator="in" result="body"/>
      <feSpecularLighting in="bump" surfaceScale="${f(4)}" specularConstant=".35" specularExponent="40" lighting-color="#fff" result="spec"><feDistantLight azimuth="235" elevation="58"/></feSpecularLighting>
      <feComposite in="spec" in2="SourceAlpha" operator="in" result="gloss"/>
      <feMerge><feMergeNode in="outline"/><feMergeNode in="body"/><feMergeNode in="gloss"/></feMerge>
    </filter></defs>${ground}<g filter="url(#${u})">${inner}</g></svg>`;
}
