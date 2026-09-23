// ============================================================
//  キャラクター・敵の絵 (SVG)
//  スライムはレベルで進化し、アクセサリーやオーラが増える
// ============================================================

let _svgUid = 0;

function slimeSVG(id, stage = 0) {
  const c = CHARACTERS[id].colors;
  const u = 's' + (++_svgUid);

  // 体の形
  const bodies = {
    purun: 'M60,22 C66,34 84,44 96,62 C108,78 108,100 88,104 L32,104 C12,100 12,78 24,62 C36,44 54,34 60,22 Z',
    piriri: 'M60,30 C88,30 104,56 106,80 C108,98 96,104 84,104 L36,104 C24,104 12,98 14,80 C16,56 32,30 60,30 Z',
    gotsun: 'M30,44 L50,32 L74,34 L94,48 L104,74 L100,100 L86,104 L34,104 L18,100 L16,72 Z',
  };

  // 種類ごとの飾り
  let behind = '';
  let front = '';
  if (id === 'piriri') {
    // かみなりのツノ
    behind += `<path d="M44,36 L34,10 L46,18 L42,4" fill="none" stroke="${c.dark}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>
               <path d="M76,36 L86,10 L74,18 L78,4" fill="none" stroke="${c.dark}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>`;
    front += `<path d="M16,84 L6,90 L14,92 L4,100" fill="none" stroke="${c.dark}" stroke-width="3" stroke-linecap="round"/>
              <circle cx="36" cy="80" r="6" fill="#ff8a7a" opacity=".7"/><circle cx="84" cy="80" r="6" fill="#ff8a7a" opacity=".7"/>`;
  }
  if (id === 'gotsun') {
    front += `<path d="M30,50 L42,46 L40,56 Z" fill="${c.dark}" opacity=".45"/>
              <path d="M82,52 L94,58 L86,64 Z" fill="${c.dark}" opacity=".45"/>
              <path d="M22,88 L34,84 L30,96 Z" fill="${c.dark}" opacity=".35"/>
              <path d="M70,92 L84,88 L80,100 Z" fill="${c.dark}" opacity=".35"/>`;
  }
  if (id === 'purun') {
    front += `<circle cx="38" cy="84" r="5" fill="#ff9ab0" opacity=".6"/><circle cx="82" cy="84" r="5" fill="#ff9ab0" opacity=".6"/>`;
  }

  // 進化段階ごとの飾り
  if (stage >= 1) {
    if (id === 'purun') {
      front += `<g class="orbit"><circle cx="16" cy="44" r="5" fill="${c.accent}" stroke="${c.dark}" stroke-width="1.5"/>
                <circle cx="104" cy="40" r="4" fill="${c.accent}" stroke="${c.dark}" stroke-width="1.5"/>
                <circle cx="108" cy="58" r="3" fill="${c.accent}" stroke="${c.dark}" stroke-width="1.5"/></g>`;
    }
    if (id === 'piriri') {
      front += `<path d="M98,40 L108,30 L104,42 L114,36" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" class="spark"/>
                <path d="M22,40 L12,30 L16,42 L6,36" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" class="spark"/>`;
    }
    if (id === 'gotsun' && stage === 1) {
      front += `<path d="M44,34 C48,26 58,24 62,30 C66,24 76,26 78,34 Z" fill="${c.accent}"/>
                <circle cx="56" cy="28" r="3" fill="#fff8b0"/>`;
    }
  }
  if (stage >= 2) {
    const crownY = id === 'purun' ? 2 : id === 'piriri' ? 12 : 12;
    front += `<g transform="translate(60,${crownY})">
      <path d="M-18,18 L-20,0 L-10,9 L0,-4 L10,9 L20,0 L18,18 Z" fill="#ffd54a" stroke="#b8860b" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="0" cy="10" r="3.5" fill="#ff4d6d"/><circle cx="-11" cy="12" r="2.5" fill="#4dd2ff"/><circle cx="11" cy="12" r="2.5" fill="#6dff8a"/>
    </g>`;
  }

  const aura = stage >= 2
    ? `<ellipse class="aura" cx="60" cy="72" rx="56" ry="46" fill="url(#${u}-aura)"/>` : '';

  return `<svg viewBox="-6 -8 132 128" class="slime slime-${id} stage-${stage}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="${u}-g" cx="40%" cy="35%" r="75%">
        <stop offset="0%" stop-color="${c.light}"/><stop offset="55%" stop-color="${c.main}"/><stop offset="100%" stop-color="${c.dark}"/>
      </radialGradient>
      <radialGradient id="${u}-aura"><stop offset="0%" stop-color="${c.accent}" stop-opacity=".55"/><stop offset="100%" stop-color="${c.accent}" stop-opacity="0"/></radialGradient>
    </defs>
    ${aura}
    <ellipse cx="60" cy="108" rx="44" ry="7" fill="#000" opacity=".25"/>
    <g class="body">
      ${behind}
      <path d="${bodies[id]}" fill="url(#${u}-g)" stroke="${c.dark}" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="40" cy="56" rx="9" ry="5" fill="#fff" opacity=".7" transform="rotate(-30 40 56)"/>
      <circle cx="30" cy="66" r="3" fill="#fff" opacity=".6"/>
      <g class="eyes">
        <ellipse cx="46" cy="72" rx="6" ry="8" fill="#1d1d2b"/><ellipse cx="74" cy="72" rx="6" ry="8" fill="#1d1d2b"/>
        <circle cx="48" cy="69" r="2.4" fill="#fff"/><circle cx="76" cy="69" r="2.4" fill="#fff"/>
      </g>
      <path d="M52,86 Q60,94 68,86" fill="none" stroke="#1d1d2b" stroke-width="3" stroke-linecap="round"/>
      ${front}
    </g>
  </svg>`;
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
};

function enemySVG(id) { return ENEMY_SVG[id](); }
