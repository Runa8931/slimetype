// ============================================================
//  追加の敵の絵 (どくぬま・さばく・おかしのくに・あめのもり・
//  きかいのこうじょう・てんくう・うちゅう など)
//  すべて左向き (プレイヤーは左にいる)
// ============================================================

// 色をまとめて置きかえる (色ちがいの敵を作る)
function recolorSVG(svg, map) {
  const keys = Object.keys(map).map(k => k.replace('#', '\\#'));
  const re = new RegExp(keys.join('|'), 'gi');
  return svg.replace(re, m => map[m.toLowerCase()] || map[m] || m);
}

const eyes = (x1, x2, y, r = 6, col = '#1a1a1a') => `<circle cx="${x1}" cy="${y}" r="${r}" fill="#fff"/><circle cx="${x2}" cy="${y}" r="${r}" fill="#fff"/>
  <circle cx="${x1 - 1.5}" cy="${y + 1}" r="${r * 0.5}" fill="${col}"/><circle cx="${x2 - 1.5}" cy="${y + 1}" r="${r * 0.5}" fill="${col}"/>`;
const shadow = (cx, cy, rx) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="6" fill="#000" opacity=".25"/>`;

function alienSVG(king) {
  return `<svg viewBox="0 0 ${king ? 180 : 140} ${king ? 190 : 160}" class="enemy-svg">
    ${shadow(king ? 90 : 70, king ? 182 : 152, king ? 52 : 34)}
    <g class="float" ${king ? 'transform="translate(20,20)"' : ''}>
      ${king ? '<path d="M20,110 C0,150 10,170 30,168 L110,168 C130,170 140,150 120,110 Z" fill="#7b2cbf" stroke="#3c096c" stroke-width="3"/>' : ''}
      <path d="M44,100 C40,130 46,146 70,146 C94,146 100,130 96,100 Z" fill="#69db7c" stroke="#2b8a3e" stroke-width="3"/>
      <path d="M40,112 L22,126 M100,112 L118,126" stroke="#69db7c" stroke-width="8" stroke-linecap="round"/>
      <ellipse cx="70" cy="62" rx="42" ry="44" fill="#8ce99a" stroke="#2b8a3e" stroke-width="3"/>
      <path d="M52,22 L44,4 M88,22 L96,4" stroke="#2b8a3e" stroke-width="3"/><circle cx="44" cy="4" r="5" fill="#ffd43b"/><circle cx="96" cy="4" r="5" fill="#ffd43b"/>
      <ellipse cx="52" cy="64" rx="13" ry="17" fill="#111" transform="rotate(-15 52 64)"/><ellipse cx="88" cy="64" rx="13" ry="17" fill="#111" transform="rotate(15 88 64)"/>
      <circle cx="48" cy="58" r="4" fill="#fff"/><circle cx="84" cy="58" r="4" fill="#fff"/>
      <path d="M62,90 Q70,94 78,90" fill="none" stroke="#2b8a3e" stroke-width="3" stroke-linecap="round"/>
      ${king ? '<path d="M44,24 L48,4 L60,16 L70,0 L80,16 L92,4 L96,24 Z" fill="#ffd43b" stroke="#e67700" stroke-width="2" transform="translate(0,-8)"/><circle cx="70" cy="12" r="4" fill="#ff006e"/>' : ''}
    </g></svg>`;
}

Object.assign(ENEMY_SVG, {
  // ---------- どくぬま ----------
  frog: () => `<svg viewBox="0 0 150 130" class="enemy-svg">${shadow(75, 122, 50)}
    <g class="squish">
      <path d="M30,110 C20,100 22,90 34,90 L48,108 Z M120,110 C130,100 128,90 116,90 L102,108 Z" fill="#7b2cbf" stroke="#3c096c" stroke-width="3"/>
      <ellipse cx="75" cy="86" rx="52" ry="34" fill="#9d4edd" stroke="#3c096c" stroke-width="3"/>
      <ellipse cx="75" cy="96" rx="34" ry="20" fill="#c3fae8"/>
      <circle cx="48" cy="48" r="18" fill="#9d4edd" stroke="#3c096c" stroke-width="3"/><circle cx="94" cy="48" r="18" fill="#9d4edd" stroke="#3c096c" stroke-width="3"/>
      ${eyes(48, 94, 48, 10)}
      <path d="M40,82 Q75,100 110,82" fill="none" stroke="#3c096c" stroke-width="4" stroke-linecap="round"/>
      <circle cx="60" cy="70" r="5" fill="#d0bfff"/><circle cx="102" cy="74" r="4" fill="#d0bfff"/><circle cx="84" cy="66" r="3" fill="#d0bfff"/>
      <g class="bubble"><circle cx="20" cy="70" r="5" fill="#b2f2bb" opacity=".8"/></g>
    </g></svg>`,

  bee: () => `<svg viewBox="0 0 150 130" class="enemy-svg">${shadow(80, 124, 30)}
    <g class="float">
      <g class="wing wing-l"><ellipse cx="70" cy="34" rx="18" ry="28" fill="#e7f5ff" stroke="#74c0fc" stroke-width="2" opacity=".85" transform="rotate(-20 70 34)"/></g>
      <g class="wing wing-r"><ellipse cx="96" cy="34" rx="18" ry="28" fill="#e7f5ff" stroke="#74c0fc" stroke-width="2" opacity=".85" transform="rotate(20 96 34)"/></g>
      <ellipse cx="92" cy="74" rx="40" ry="28" fill="#fcc419" stroke="#5c3d00" stroke-width="3"/>
      <path d="M78,48 L78,100 M98,47 L98,101 M116,54 L116,94" stroke="#212529" stroke-width="9"/>
      <path d="M130,74 L148,80 L130,86 Z" fill="#212529"/>
      <circle cx="46" cy="70" r="24" fill="#fcc419" stroke="#5c3d00" stroke-width="3"/>
      ${eyes(38, 56, 66, 6)}
      <path d="M36,54 L48,58 M60,54 L50,58" stroke="#5c3d00" stroke-width="3" stroke-linecap="round"/>
      <path d="M40,36 C36,26 30,22 26,24 M52,36 C54,24 60,20 64,22" fill="none" stroke="#212529" stroke-width="3"/>
      <path d="M40,82 Q46,86 52,82" fill="none" stroke="#5c3d00" stroke-width="3"/>
    </g></svg>`,

  zombie: () => `<svg viewBox="0 0 140 160" class="enemy-svg">${shadow(70, 152, 40)}
    <g class="squish">
      <path d="M44,96 L96,96 L102,146 L38,146 Z" fill="#5f3dc4" stroke="#2b1a4a" stroke-width="3"/>
      <path d="M56,96 L64,120 L72,100 L80,122 L86,96" fill="none" stroke="#2b1a4a" stroke-width="2"/>
      <path d="M44,104 L6,96 M50,116 L10,112" stroke="#8ce99a" stroke-width="12" stroke-linecap="round"/>
      <path d="M52,146 L50,158 M88,146 L90,158" stroke="#3b5bdb" stroke-width="10"/>
      <rect x="36" y="22" width="68" height="76" rx="26" fill="#8ce99a" stroke="#2b8a3e" stroke-width="3"/>
      <path d="M40,40 L56,30 L70,38 L84,28 L100,40" fill="none" stroke="#343a40" stroke-width="6" stroke-linecap="round"/>
      <circle cx="56" cy="58" r="8" fill="#fff"/><circle cx="84" cy="60" r="6" fill="#fff"/>
      <circle cx="54" cy="59" r="3" fill="#c92a2a"/><circle cx="82" cy="61" r="2.5" fill="#c92a2a"/>
      <path d="M52,80 L88,80 M58,76 L58,84 M66,76 L66,84 M74,76 L74,84 M82,76 L82,84" stroke="#2b8a3e" stroke-width="2.5"/>
      <path d="M92,44 L100,52 M94,52 L98,44" stroke="#2b8a3e" stroke-width="2"/>
    </g></svg>`,

  hydra: () => `<svg viewBox="0 0 220 190" class="enemy-svg">${shadow(116, 182, 80)}
    <g class="squish">
      <ellipse cx="130" cy="140" rx="64" ry="40" fill="#5c940d" stroke="#2b3a0a" stroke-width="3"/>
      <ellipse cx="124" cy="150" rx="40" ry="22" fill="#c0eb75"/>
      <path d="M180,140 C206,140 214,120 208,104 C200,120 190,124 180,124 Z" fill="#5c940d" stroke="#2b3a0a" stroke-width="3"/>
      ${[[110, 108, 70, 40], [124, 106, 40, 76], [140, 108, 108, 20]].map(([x0, y0, hx, hy]) => `
      <path d="M${x0},${y0} C${x0 - 10},${y0 - 30} ${hx + 10},${hy + 40} ${hx},${hy + 14}" stroke="#74b816" stroke-width="22" fill="none" stroke-linecap="round"/>
      <g transform="translate(${hx},${hy})"><path d="M-30,10 C-30,-8 -10,-16 8,-12 C22,-8 24,10 14,18 C0,24 -24,22 -30,10 Z" fill="#74b816" stroke="#2b3a0a" stroke-width="3"/>
        <circle cx="-6" cy="-2" r="5" fill="#ffe066"/><rect x="-7" y="-6" width="2.5" height="8" fill="#111"/>
        <path d="M-30,12 L-8,14" stroke="#2b3a0a" stroke-width="2"/><path d="M-26,13 L-24,19 L-21,14 Z M-18,14 L-16,20 L-13,14 Z" fill="#fff"/>
        <path d="M2,-12 L6,-24 L12,-10 Z" fill="#e67700"/></g>`).join('')}
      <g class="bubble"><circle cx="40" cy="120" r="7" fill="#b197fc" opacity=".8"/><circle cx="54" cy="104" r="4" fill="#b197fc" opacity=".7"/></g>
    </g></svg>`,

  // ---------- さばく ----------
  scorpion: () => `<svg viewBox="0 0 170 130" class="enemy-svg">${shadow(90, 122, 60)}
    <g class="squish">
      <path d="M120,86 C150,86 160,60 150,34 C146,20 130,18 126,30" fill="none" stroke="#c2410c" stroke-width="14" stroke-linecap="round"/>
      <path d="M126,30 L112,22 L124,42 Z" fill="#7c2d12"/>
      <g stroke="#7c2d12" stroke-width="4" stroke-linecap="round"><path d="M70,98 L56,118 M84,100 L78,120 M100,100 L106,120 M114,96 L126,116"/></g>
      <ellipse cx="92" cy="88" rx="40" ry="20" fill="#ea580c" stroke="#7c2d12" stroke-width="3"/>
      <path d="M72,82 L72,94 M88,78 L88,98 M104,80 L104,96" stroke="#7c2d12" stroke-width="2"/>
      <path d="M56,80 C40,70 24,70 16,78 M56,94 C40,100 26,104 16,100" fill="none" stroke="#ea580c" stroke-width="8" stroke-linecap="round"/>
      <path d="M16,78 C4,72 2,62 10,58 C12,66 18,68 24,66 Z M16,100 C4,106 2,116 10,120 C12,112 18,110 24,112 Z" fill="#ea580c" stroke="#7c2d12" stroke-width="2.5"/>
      ${eyes(62, 76, 76, 5)}
    </g></svg>`,

  cactus: () => `<svg viewBox="0 0 130 170" class="enemy-svg">${shadow(65, 162, 40)}
    <g class="squish">
      <path d="M36,100 C18,100 14,80 16,64 C18,54 30,54 30,64 L32,84 Z" fill="#40c057" stroke="#1b5e20" stroke-width="3"/>
      <path d="M94,90 C112,90 116,70 114,54 C112,44 100,44 100,54 L98,74 Z" fill="#40c057" stroke="#1b5e20" stroke-width="3"/>
      <rect x="36" y="30" width="58" height="120" rx="29" fill="#51cf66" stroke="#1b5e20" stroke-width="3"/>
      <path d="M52,40 L52,146 M78,40 L78,146" stroke="#2f9e44" stroke-width="3"/>
      <g stroke="#f8f9fa" stroke-width="2">${[[40, 60], [90, 70], [44, 110], [88, 120], [66, 36], [20, 70], [110, 60]].map(([x, y]) => `<path d="M${x - 5},${y} L${x + 5},${y} M${x},${y - 5} L${x},${y + 5}"/>`).join('')}</g>
      <circle cx="65" cy="28" r="10" fill="#ff8fab"/><circle cx="65" cy="28" r="4" fill="#ffd43b"/>
      ${eyes(54, 76, 70, 7)}
      <path d="M50,58 L60,62 M80,58 L70,62" stroke="#1b5e20" stroke-width="3" stroke-linecap="round"/>
      <path d="M56,90 Q65,84 74,90" fill="none" stroke="#1b5e20" stroke-width="3"/>
    </g></svg>`,

  snake: () => `<svg viewBox="0 0 170 130" class="enemy-svg">${shadow(90, 122, 60)}
    <g class="squish">
      <path d="M150,108 C160,100 150,88 130,92 C104,98 96,112 72,112 C50,112 50,96 64,88 C78,80 76,60 60,56" fill="none" stroke="#e8b04b" stroke-width="22" stroke-linecap="round"/>
      <path d="M150,108 C160,100 150,88 130,92 C104,98 96,112 72,112 C50,112 50,96 64,88" fill="none" stroke="#9c6b1f" stroke-width="4" stroke-dasharray="6 10"/>
      <path d="M20,50 C20,34 40,26 60,30 C74,34 76,52 66,60 C56,68 30,68 20,50 Z" fill="#e8b04b" stroke="#7a4d10" stroke-width="3"/>
      <circle cx="38" cy="44" r="5" fill="#fff"/><rect x="36" y="40" width="3" height="8" fill="#111"/>
      <path d="M20,54 L6,58 L12,54 L6,50 Z" fill="#e03131"/>
    </g></svg>`,

  mummy: () => `<svg viewBox="0 0 140 160" class="enemy-svg">${shadow(70, 152, 40)}
    <g class="squish">
      <path d="M42,96 L20,110 M98,96 L120,108" stroke="#f1e3c8" stroke-width="12" stroke-linecap="round"/>
      <rect x="38" y="20" width="64" height="130" rx="30" fill="#f1e3c8" stroke="#a68a5b" stroke-width="3"/>
      <g stroke="#c9b28a" stroke-width="3" fill="none">${[34, 48, 62, 92, 108, 124, 138].map((y, i) => `<path d="M${38 + (i % 2) * 4},${y} L102,${y + (i % 2 ? -6 : 6)}"/>`).join('')}</g>
      <rect x="46" y="66" width="48" height="16" rx="6" fill="#343a40"/>
      <circle cx="60" cy="74" r="4" fill="#ffd43b" class="eye-glow"/><circle cx="82" cy="74" r="4" fill="#ffd43b" class="eye-glow"/>
      <path d="M98,40 C112,44 118,56 110,66" fill="none" stroke="#f1e3c8" stroke-width="6" stroke-linecap="round"/>
    </g></svg>`,

  sphinx: () => `<svg viewBox="0 0 220 180" class="enemy-svg">${shadow(116, 172, 84)}
    <g class="squish">
      <path d="M60,130 L190,130 C200,130 204,120 198,112 C180,96 150,96 120,100 L80,104 Z" fill="#d4a373" stroke="#7f5539" stroke-width="3"/>
      <path d="M190,124 C212,120 214,96 204,86" fill="none" stroke="#d4a373" stroke-width="10" stroke-linecap="round"/>
      <path d="M40,136 L100,136 L100,160 L40,160 Z M140,136 L196,136 L196,160 L140,160 Z" fill="#c08552" stroke="#7f5539" stroke-width="3"/>
      <path d="M36,40 L96,40 L110,110 L22,110 Z" fill="#1971c2" stroke="#0b3d78" stroke-width="3"/>
      <path d="M36,40 L22,110 M50,40 L40,110 M82,40 L92,110 M96,40 L110,110" stroke="#ffd43b" stroke-width="5"/>
      <ellipse cx="66" cy="66" rx="26" ry="30" fill="#e9c46a" stroke="#7f5539" stroke-width="3"/>
      <path d="M40,30 L92,30 L86,44 L46,44 Z" fill="#ffd43b" stroke="#b8860b" stroke-width="2"/>
      <path d="M50,60 L62,58 M82,60 L70,58" stroke="#1a1a1a" stroke-width="3"/>
      <ellipse cx="56" cy="66" rx="5" ry="3" fill="#1a1a1a"/><ellipse cx="76" cy="66" rx="5" ry="3" fill="#1a1a1a"/>
      <path d="M58,84 L74,84" stroke="#7f5539" stroke-width="3"/>
      <circle cx="66" cy="22" r="6" fill="#e03131"/>
    </g></svg>`,

  // ---------- うみ ----------
  puffer: () => `<svg viewBox="0 0 150 140" class="enemy-svg">${shadow(75, 132, 40)}
    <g class="float">
      <path d="M118,70 L146,50 L140,70 L146,90 Z" fill="#ffd43b" stroke="#b8860b" stroke-width="3"/>
      <g stroke="#b8860b" stroke-width="3" fill="#ffe066">${Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return `<path d="M${72 + Math.cos(a) * 44},${70 + Math.sin(a) * 44} L${72 + Math.cos(a) * 58},${70 + Math.sin(a) * 58} L${72 + Math.cos(a + 0.18) * 44},${70 + Math.sin(a + 0.18) * 44} Z"/>`; }).join('')}</g>
      <circle cx="72" cy="70" r="46" fill="#ffe066" stroke="#b8860b" stroke-width="3"/>
      <path d="M36,84 C60,110 96,110 112,86" fill="#fff9db"/>
      ${eyes(52, 76, 58, 9)}
      <path d="M44,44 L58,50 M84,44 L72,50" stroke="#b8860b" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="44" cy="82" rx="7" ry="5" fill="#e8590c"/>
    </g></svg>`,

  pirate: () => `<svg viewBox="0 0 140 170" class="enemy-svg">${shadow(70, 162, 40)}
    <g class="squish">
      <path d="M44,96 L96,96 L102,150 L38,150 Z" fill="#1c3d5a" stroke="#0b1d2e" stroke-width="3"/>
      <path d="M56,96 L70,130 L84,96" fill="#f8f9fa"/>
      <path d="M40,104 L16,124" stroke="#f1f3f5" stroke-width="8" stroke-linecap="round"/>
      <path d="M18,110 L4,140" stroke="#adb5bd" stroke-width="5" stroke-linecap="round"/><path d="M8,112 L26,120" stroke="#ffd43b" stroke-width="5"/>
      <ellipse cx="70" cy="64" rx="32" ry="34" fill="#f8f9fa" stroke="#868e96" stroke-width="3"/>
      <ellipse cx="56" cy="62" rx="9" ry="10" fill="#212529"/><ellipse cx="84" cy="62" rx="9" ry="10" fill="#212529"/>
      <circle cx="56" cy="62" r="3" fill="#ffd43b" class="eye-glow"/>
      <path d="M66,78 L70,72 L74,78 Z" fill="#212529"/>
      <path d="M54,88 L86,88 M60,84 L60,92 M68,84 L68,92 M76,84 L76,92" stroke="#868e96" stroke-width="2.5"/>
      <path d="M28,40 C36,16 104,16 112,40 C100,34 40,34 28,40 Z" fill="#212529" stroke="#000" stroke-width="2"/>
      <path d="M62,30 L78,30 M70,22 L70,38" stroke="#f8f9fa" stroke-width="4"/>
    </g></svg>`,

  // ---------- おかしのくに ----------
  gummy: () => `<svg viewBox="0 0 140 160" class="enemy-svg">${shadow(70, 152, 40)}
    <g class="squish" opacity=".95">
      <circle cx="42" cy="30" r="14" fill="#ff6b6b" stroke="#c92a2a" stroke-width="3"/><circle cx="98" cy="30" r="14" fill="#ff6b6b" stroke="#c92a2a" stroke-width="3"/>
      <ellipse cx="70" cy="112" rx="40" ry="38" fill="#ff6b6b" stroke="#c92a2a" stroke-width="3"/>
      <circle cx="70" cy="56" r="34" fill="#ff8787" stroke="#c92a2a" stroke-width="3"/>
      <ellipse cx="56" cy="44" rx="9" ry="5" fill="#fff" opacity=".6" transform="rotate(-25 56 44)"/>
      <path d="M34,104 C22,100 20,114 32,118 M106,104 C118,100 120,114 108,118 M48,146 L50,156 M92,146 L90,156" stroke="#c92a2a" stroke-width="10" stroke-linecap="round" fill="none"/>
      ${eyes(58, 82, 56, 6)}
      <ellipse cx="70" cy="70" rx="8" ry="5" fill="#c92a2a"/>
    </g></svg>`,

  lolli: () => `<svg viewBox="0 0 130 170" class="enemy-svg">${shadow(65, 162, 30)}
    <g class="float">
      <rect x="61" y="96" width="8" height="64" rx="4" fill="#f8f9fa" stroke="#adb5bd" stroke-width="2"/>
      <circle cx="65" cy="62" r="46" fill="#ff8fab" stroke="#c2255c" stroke-width="3"/>
      <path d="M65,62 m0,-38 a38,38 0 1,1 -1,0 M65,62 m0,-26 a26,26 0 1,0 1,0 M65,62 m0,-14 a14,14 0 1,1 -1,0" fill="none" stroke="#fff" stroke-width="7" opacity=".85"/>
      ${eyes(52, 76, 58, 7)}
      <path d="M40,46 L56,50 M90,46 L74,50" stroke="#c2255c" stroke-width="3" stroke-linecap="round"/>
      <path d="M54,82 Q65,76 76,82" fill="none" stroke="#c2255c" stroke-width="3" stroke-linecap="round"/>
      <path d="M92,120 C108,118 116,126 110,136" fill="none" stroke="#c2255c" stroke-width="4" stroke-dasharray="4 6"/>
    </g></svg>`,

  cake: () => `<svg viewBox="0 0 150 150" class="enemy-svg">${shadow(75, 142, 50)}
    <g class="squish">
      <path d="M22,70 L128,70 L128,132 L22,132 Z" fill="#fff4e6" stroke="#d9a066" stroke-width="3"/>
      <path d="M22,96 L128,96" stroke="#ff8fab" stroke-width="8"/>
      <path d="M22,70 C30,82 38,70 46,82 C54,70 62,82 70,70 C78,82 86,70 94,82 C102,70 110,82 118,70 C124,78 128,74 128,70 Z" fill="#fff" stroke="#e9ecef" stroke-width="2"/>
      <path d="M28,70 C34,40 116,40 122,70 Z" fill="#fff" stroke="#e9ecef" stroke-width="2"/>
      <path d="M75,24 C62,24 60,44 75,48 C90,44 88,24 75,24 Z" fill="#e03131"/><path d="M68,24 L75,16 L82,24 Z" fill="#2f9e44"/>
      <circle cx="70" cy="34" r="1.5" fill="#fff"/><circle cx="78" cy="38" r="1.5" fill="#fff"/>
      ${eyes(58, 88, 112, 7)}
      <path d="M64,124 Q73,130 82,124" fill="none" stroke="#d9a066" stroke-width="3"/>
    </g></svg>`,

  pudding: () => `<svg viewBox="0 0 210 180" class="enemy-svg">${shadow(105, 172, 90)}
    <g class="squish">
      <ellipse cx="105" cy="160" rx="96" ry="14" fill="#fff" stroke="#dee2e6" stroke-width="3"/>
      <path d="M30,156 C28,110 40,56 60,40 L150,40 C170,56 182,110 180,156 Z" fill="#ffd43b" stroke="#e67700" stroke-width="3"/>
      <path d="M58,42 C60,20 150,20 152,42 C150,62 140,72 132,58 C124,74 110,66 104,56 C98,70 84,72 78,58 C70,70 58,62 58,42 Z" fill="#7a3e0a" stroke="#4a2511" stroke-width="3"/>
      <ellipse cx="80" cy="34" rx="12" ry="5" fill="#fff" opacity=".35"/>
      <path d="M92,14 L96,-4 L104,10 L110,-6 L116,10 L122,-2 L124,16 Z" fill="#ff8fab" stroke="#c2255c" stroke-width="2"/>
      ${eyes(84, 124, 100, 11)}
      <path d="M92,128 Q104,138 116,128" fill="none" stroke="#e67700" stroke-width="4" stroke-linecap="round"/>
      <ellipse cx="68" cy="116" rx="8" ry="5" fill="#ff8fab" opacity=".7"/><ellipse cx="140" cy="116" rx="8" ry="5" fill="#ff8fab" opacity=".7"/>
    </g></svg>`,

  // ---------- あめのもり ----------
  snail: () => `<svg viewBox="0 0 170 130" class="enemy-svg">${shadow(90, 122, 64)}
    <g class="squish">
      <path d="M20,112 C16,90 30,80 48,84 L150,108 C156,112 152,118 144,118 L28,118 Z" fill="#b2f2bb" stroke="#2b8a3e" stroke-width="3"/>
      <path d="M36,84 L28,52 M50,84 L48,54" stroke="#2b8a3e" stroke-width="4"/>
      <circle cx="28" cy="50" r="6" fill="#fff" stroke="#2b8a3e" stroke-width="2"/><circle cx="48" cy="52" r="6" fill="#fff" stroke="#2b8a3e" stroke-width="2"/>
      <circle cx="27" cy="51" r="2.5" fill="#111"/><circle cx="47" cy="53" r="2.5" fill="#111"/>
      <circle cx="104" cy="70" r="44" fill="#e8590c" stroke="#862e0a" stroke-width="3"/>
      <path d="M104,70 m0,-32 a32,32 0 1,1 -1,0 M104,70 m0,-20 a20,20 0 1,0 1,0 M104,70 m0,-8 a8,8 0 1,1 -1,0" fill="none" stroke="#ffc078" stroke-width="5"/>
      <path d="M40,100 Q46,104 52,100" fill="none" stroke="#2b8a3e" stroke-width="2.5"/>
    </g></svg>`,

  kappa: () => `<svg viewBox="0 0 140 160" class="enemy-svg">${shadow(70, 152, 40)}
    <g class="squish">
      <ellipse cx="80" cy="112" rx="36" ry="38" fill="#8d6e3a" stroke="#4a3510" stroke-width="3"/>
      <path d="M64,84 L100,84 M60,100 L104,100 M62,116 L102,116" stroke="#4a3510" stroke-width="2.5"/>
      <ellipse cx="62" cy="116" rx="28" ry="32" fill="#69db7c" stroke="#2b8a3e" stroke-width="3"/>
      <path d="M40,140 L32,152 L50,152 Z M76,140 L72,152 L90,152 Z" fill="#69db7c" stroke="#2b8a3e" stroke-width="2"/>
      <circle cx="62" cy="58" r="34" fill="#8ce99a" stroke="#2b8a3e" stroke-width="3"/>
      <path d="M30,44 C32,20 92,20 94,44 C80,34 44,34 30,44 Z" fill="#212529"/>
      <ellipse cx="62" cy="28" rx="18" ry="6" fill="#a5d8ff" stroke="#1c7ed6" stroke-width="2"/>
      ${eyes(50, 72, 58, 6)}
      <path d="M26,70 L40,64 L40,76 Z" fill="#ffd43b" stroke="#e67700" stroke-width="2"/>
    </g></svg>`,

  raijin: () => `<svg viewBox="0 0 220 190" class="enemy-svg">${shadow(110, 182, 70)}
    <g class="float">
      <g fill="#ffd43b" stroke="#b8860b" stroke-width="3">${Array.from({ length: 6 }, (_, i) => { const a = Math.PI + i / 5 * Math.PI; return `<circle cx="${110 + Math.cos(a) * 92}" cy="${86 + Math.sin(a) * 70}" r="15"/><circle cx="${110 + Math.cos(a) * 92}" cy="${86 + Math.sin(a) * 70}" r="5" fill="#b8860b"/>`; }).join('')}</g>
      <path d="M26,86 C40,6 180,6 194,86" fill="none" stroke="#b8860b" stroke-width="5"/>
      <path d="M72,112 L148,112 L160,176 L60,176 Z" fill="#f8f9fa" stroke="#868e96" stroke-width="3"/>
      <path d="M72,112 L110,150 L148,112" fill="none" stroke="#fcc419" stroke-width="6"/>
      <circle cx="110" cy="82" r="40" fill="#74c0fc" stroke="#1864ab" stroke-width="3"/>
      <path d="M86,44 L78,24 L96,40 Z M134,44 L142,24 L124,40 Z" fill="#fff" stroke="#1864ab" stroke-width="2"/>
      <path d="M72,70 C74,50 146,50 148,70 C136,60 84,60 72,70 Z" fill="#212529"/>
      <path d="M88,76 L102,82 M132,76 L118,82" stroke="#1864ab" stroke-width="4" stroke-linecap="round"/>
      ${eyes(96, 124, 88, 6)}
      <path d="M92,104 Q110,96 128,104" fill="none" stroke="#1864ab" stroke-width="4" stroke-linecap="round"/>
      <path d="M44,150 L56,130 L50,130 L62,110" fill="none" stroke="#fff27a" stroke-width="5" stroke-linecap="round" class="spark"/>
    </g></svg>`,

  // ---------- きかいのこうじょう ----------
  robot: () => `<svg viewBox="0 0 140 160" class="enemy-svg">${shadow(70, 152, 42)}
    <g class="squish">
      <rect x="46" y="130" width="16" height="20" fill="#495057"/><rect x="78" y="130" width="16" height="20" fill="#495057"/>
      <rect x="30" y="72" width="80" height="60" rx="10" fill="#adb5bd" stroke="#343a40" stroke-width="3"/>
      <rect x="46" y="86" width="48" height="26" rx="4" fill="#343a40"/><circle cx="58" cy="99" r="5" fill="#ff6b6b" class="core"/><circle cx="82" cy="99" r="5" fill="#69db7c"/>
      <rect x="10" y="80" width="18" height="44" rx="8" fill="#868e96" stroke="#343a40" stroke-width="3"/><rect x="112" y="80" width="18" height="44" rx="8" fill="#868e96" stroke="#343a40" stroke-width="3"/>
      <rect x="36" y="18" width="68" height="52" rx="12" fill="#ced4da" stroke="#343a40" stroke-width="3"/>
      <path d="M70,18 L70,6" stroke="#343a40" stroke-width="3"/><circle cx="70" cy="5" r="5" fill="#ff6b6b" class="eye-glow"/>
      <rect x="46" y="34" width="48" height="16" rx="8" fill="#212529"/>
      <circle cx="58" cy="42" r="5" fill="#74c0fc" class="eye-glow"/><circle cx="82" cy="42" r="5" fill="#74c0fc" class="eye-glow"/>
      <path d="M54,60 L86,60" stroke="#495057" stroke-width="3" stroke-dasharray="4 4"/>
    </g></svg>`,

  drone: () => `<svg viewBox="0 0 170 120" class="enemy-svg">${shadow(85, 114, 40)}
    <g class="float">
      <path d="M40,40 L130,40" stroke="#495057" stroke-width="6"/>
      <g class="wing wing-l"><ellipse cx="36" cy="30" rx="28" ry="5" fill="#adb5bd" opacity=".8"/></g>
      <g class="wing wing-r"><ellipse cx="134" cy="30" rx="28" ry="5" fill="#adb5bd" opacity=".8"/></g>
      <rect x="32" y="30" width="8" height="14" fill="#343a40"/><rect x="130" y="30" width="8" height="14" fill="#343a40"/>
      <path d="M50,50 C50,40 120,40 120,50 L112,82 C100,92 70,92 58,82 Z" fill="#fab005" stroke="#5c3d00" stroke-width="3"/>
      <circle cx="74" cy="66" r="14" fill="#212529"/><circle cx="72" cy="64" r="7" fill="#ff6b6b" class="eye-glow"/><circle cx="70" cy="62" r="2" fill="#fff"/>
      <path d="M92,58 L108,58 M92,66 L106,66" stroke="#5c3d00" stroke-width="3"/>
      <path d="M72,90 L66,104 M98,90 L104,104" stroke="#495057" stroke-width="4"/>
    </g></svg>`,

  bomb: () => `<svg viewBox="0 0 140 150" class="enemy-svg">${shadow(70, 142, 40)}
    <g class="squish">
      <path d="M86,30 C92,14 106,10 112,18" fill="none" stroke="#8d6e3a" stroke-width="5" stroke-linecap="round"/>
      <path d="M112,18 L120,8 L118,20 L128,16 L116,26 Z" fill="#ffd43b" class="spark"/>
      <rect x="72" y="26" width="24" height="16" rx="3" fill="#495057" stroke="#212529" stroke-width="3" transform="rotate(20 84 34)"/>
      <circle cx="66" cy="88" r="50" fill="#343a40" stroke="#000" stroke-width="3"/>
      <ellipse cx="46" cy="66" rx="14" ry="8" fill="#fff" opacity=".35" transform="rotate(-30 46 66)"/>
      ${eyes(50, 76, 88, 9)}
      <path d="M38,74 L56,80 M88,74 L70,80" stroke="#ff6b6b" stroke-width="4" stroke-linecap="round"/>
      <path d="M52,112 Q64,104 78,112" fill="none" stroke="#ff6b6b" stroke-width="3"/>
    </g></svg>`,

  // ---------- てんくう ----------
  skybird: () => `<svg viewBox="0 0 170 130" class="enemy-svg">${shadow(90, 124, 34)}
    <g class="float">
      <g class="wing wing-r"><path d="M96,58 C120,20 160,18 168,30 C150,34 146,44 150,54 C136,50 126,58 120,70 Z" fill="#74c0fc" stroke="#1864ab" stroke-width="3"/></g>
      <path d="M130,72 L162,84 L150,92 L164,100 L128,90 Z" fill="#4dabf7" stroke="#1864ab" stroke-width="3"/>
      <ellipse cx="92" cy="76" rx="44" ry="30" fill="#a5d8ff" stroke="#1864ab" stroke-width="3"/>
      <ellipse cx="86" cy="86" rx="26" ry="16" fill="#fff"/>
      <circle cx="50" cy="58" r="24" fill="#a5d8ff" stroke="#1864ab" stroke-width="3"/>
      <path d="M40,36 C44,22 58,20 60,34 C66,24 74,30 70,38" fill="#4dabf7" stroke="#1864ab" stroke-width="2"/>
      <circle cx="42" cy="54" r="6" fill="#fff"/><circle cx="40" cy="55" r="3" fill="#111"/>
      <path d="M28,62 L10,68 L28,72 Z" fill="#ffd43b" stroke="#e67700" stroke-width="2"/>
      <g class="wing wing-l"><path d="M80,60 C60,22 30,22 22,32 C40,38 44,46 42,54 C56,52 64,60 70,72 Z" fill="#74c0fc" stroke="#1864ab" stroke-width="3"/></g>
    </g></svg>`,

  cloud: () => `<svg viewBox="0 0 170 130" class="enemy-svg">
    <g class="float">
      <path d="M52,92 L44,112 L56,108 L48,128" fill="none" stroke="#fff27a" stroke-width="5" stroke-linecap="round" class="spark"/>
      <path d="M112,92 L104,112 L116,108 L108,128" fill="none" stroke="#fff27a" stroke-width="5" stroke-linecap="round" class="spark"/>
      <path d="M30,92 C8,92 8,62 30,60 C30,34 62,24 78,42 C90,20 130,22 134,50 C160,48 166,88 140,92 Z" fill="#868e96" stroke="#343a40" stroke-width="3"/>
      <path d="M36,70 C44,62 56,64 60,70" fill="none" stroke="#adb5bd" stroke-width="4" stroke-linecap="round"/>
      ${eyes(66, 92, 66, 7)}
      <path d="M56,54 L72,60 M102,54 L86,60" stroke="#212529" stroke-width="3" stroke-linecap="round"/>
      <path d="M68,82 Q79,76 90,82" fill="none" stroke="#212529" stroke-width="3"/>
    </g></svg>`,

  // ---------- うちゅう ----------
  alien: () => alienSVG(false),
  alienking: () => alienSVG(true),

  ufo: () => `<svg viewBox="0 0 180 130" class="enemy-svg">
    <g class="float">
      <path d="M60,78 L40,126 L140,126 L120,78 Z" fill="#fff27a" opacity=".25"/>
      <ellipse cx="90" cy="54" rx="34" ry="30" fill="#a5d8ff" stroke="#1971c2" stroke-width="3" opacity=".9"/>
      <circle cx="90" cy="56" r="14" fill="#69db7c"/>${eyes(84, 96, 54, 3.5)}
      <ellipse cx="90" cy="72" rx="80" ry="20" fill="#adb5bd" stroke="#495057" stroke-width="3"/>
      <ellipse cx="90" cy="66" rx="60" ry="8" fill="#ced4da"/>
      ${[30, 60, 90, 120, 150].map((x, i) => `<circle cx="${x}" cy="76" r="5" fill="${['#ff6b6b', '#ffd43b', '#69db7c', '#4dabf7', '#e599f7'][i]}" class="core"/>`).join('')}
    </g></svg>`,

  meteor: () => `<svg viewBox="0 0 150 140" class="enemy-svg">
    <g class="float">
      <path d="M110,40 C130,20 150,14 150,14 C140,30 132,46 120,58 Z M116,70 C136,64 150,66 150,66 C136,74 124,82 110,84 Z" fill="#ff922b" opacity=".6"/>
      <path d="M24,70 C20,40 44,18 74,20 C104,22 124,44 120,76 C116,108 88,124 60,118 C36,112 26,96 24,70 Z" fill="#7a5c45" stroke="#3b2a1e" stroke-width="3"/>
      <circle cx="90" cy="46" r="10" fill="#5c4332"/><circle cx="96" cy="94" r="7" fill="#5c4332"/><circle cx="46" cy="100" r="6" fill="#5c4332"/>
      ${eyes(54, 78, 64, 8, '#ff6b6b')}
      <path d="M44,50 L60,56 M88,50 L72,56" stroke="#3b2a1e" stroke-width="4" stroke-linecap="round"/>
      <path d="M54,86 Q66,80 78,86" fill="none" stroke="#3b2a1e" stroke-width="3"/>
    </g></svg>`,

  star: () => `<svg viewBox="0 0 150 150" class="enemy-svg">
    <g class="float">
      <path d="M75,8 L93,52 L140,56 L104,86 L116,134 L75,108 L34,134 L46,86 L10,56 L57,52 Z" fill="#ffe066" stroke="#e67700" stroke-width="4" stroke-linejoin="round"/>
      <path d="M75,24 L88,58" stroke="#fff" stroke-width="4" opacity=".6" stroke-linecap="round"/>
      ${eyes(62, 88, 74, 7)}
      <path d="M64,94 Q75,102 86,94" fill="none" stroke="#e67700" stroke-width="3" stroke-linecap="round"/>
      <circle cx="20" cy="20" r="3" fill="#fff" class="spark"/><circle cx="134" cy="26" r="2.5" fill="#fff" class="spark"/>
    </g></svg>`,
});

// ---------- 色ちがいの敵 ----------
const RECOLORS = {
  pbat: ['bat', { '#4a2f7a': '#2b6a3a', '#2b1a4a': '#123a1c', '#6d4aa8': '#3f9a4a', '#8c6cc4': '#7bd389', '#ffe14d': '#e0aaff', '#c0162c': '#6a0dad' }],
  swampmush: ['mush', { '#d93b3b': '#8e44ad', '#7a1a1a': '#4a1a6a', '#f3e2c3': '#d8f3dc', '#8a6a44': '#52796f' }],
  dgoblin: ['goblin', { '#6cc152': '#d4a373', '#2c5a20': '#7f5539', '#5aa845': '#c08552', '#4f9a3c': '#b07d4f', '#7a5230': '#e9c46a', '#3e2912': '#6b4f2a' }],
  mallow: ['ghost', { '#eef1ff': '#ffe3ef', '#8a90c4': '#e599b7', '#26264a': '#8f3b5d', '#c9b8ff': '#ffadd2' }],
  chocogolem: ['golem', { '#9ca0aa': '#7b4a2e', '#a8acb6': '#8b5a3c', '#8b8f99': '#6b3e24', '#7a7e88': '#5c3317', '#767a84': '#5c3317', '#5ef0ff': '#ff8fab', '#6aa84f': '#fff4e6', '#5c6068': '#4a2511', '#4a4d55': '#3b1f0e' }],
  rainfrog: ['frog', { '#7b2cbf': '#2f9e44', '#3c096c': '#1b5e20', '#9d4edd': '#51cf66', '#c3fae8': '#d3f9d8', '#d0bfff': '#a9e34b', '#b2f2bb': '#a5d8ff' }],
  rainmush: ['mush', { '#d93b3b': '#4dabf7', '#7a1a1a': '#1c5a8f', '#f3e2c3': '#e7f5ff', '#8a6a44': '#5c7c99', '#a4e06a': '#a5d8ff' }],
  tbat: ['bat', { '#4a2f7a': '#b08900', '#2b1a4a': '#5c4700', '#6d4aa8': '#f2c94c', '#8c6cc4': '#ffe58a', '#ffe14d': '#74c0fc', '#c0162c': '#1864ab' }],
  mgoblin: ['goblin', { '#6cc152': '#adb5bd', '#2c5a20': '#343a40', '#5aa845': '#868e96', '#4f9a3c': '#6c757d', '#7a5230': '#495057', '#3e2912': '#212529', '#ffe14d': '#ff6b6b', '#8a5a2b': '#495057', '#6b4423': '#343a40', '#4a2c12': '#212529' }],
  geargolem: ['golem', { '#9ca0aa': '#c0c7d0', '#a8acb6': '#d0d6de', '#8b8f99': '#9aa3ad', '#5ef0ff': '#ff922b', '#6aa84f': '#495057', '#4a4d55': '#343a40' }],
  mechadragon: ['dragon', { '#c53d4a': '#6c757d', '#5a1019': '#212529', '#b8323f': '#495057', '#7a1f2b': '#343a40', '#3d0d14': '#111111', '#f2b37a': '#adb5bd', '#d98f58': '#868e96', '#ffcf4a': '#22b8cf', '#ffe14d': '#ff6b6b' }],
  yukionna: ['ghost', { '#eef1ff': '#f8fbff', '#8a90c4': '#74c0fc', '#26264a': '#1c3d5a', '#c9b8ff': '#a5d8ff' }],
  icegolem: ['golem', { '#9ca0aa': '#a5d8ff', '#a8acb6': '#d0ebff', '#8b8f99': '#74c0fc', '#7a7e88': '#4dabf7', '#767a84': '#4dabf7', '#5ef0ff': '#ffffff', '#6aa84f': '#ffffff', '#5c6068': '#1c7ed6', '#4a4d55': '#1864ab' }],
  wbat: ['bat', { '#4a2f7a': '#dee2e6', '#2b1a4a': '#868e96', '#6d4aa8': '#f8f9fa', '#8c6cc4': '#ffffff', '#ffe14d': '#74c0fc', '#c0162c': '#1864ab' }],
  skygolem: ['golem', { '#9ca0aa': '#f1f3f5', '#a8acb6': '#ffffff', '#8b8f99': '#dee2e6', '#7a7e88': '#ced4da', '#767a84': '#ced4da', '#5ef0ff': '#ffd43b', '#6aa84f': '#ffd43b', '#5c6068': '#fab005', '#4a4d55': '#868e96' }],
  wyvern: ['dragon', { '#c53d4a': '#40c057', '#5a1019': '#1b5e20', '#b8323f': '#2f9e44', '#7a1f2b': '#2b8a3e', '#3d0d14': '#0b3d16', '#f2b37a': '#d8f5a2', '#d98f58': '#a9e34b' }],
  skydragon: ['dragon', { '#c53d4a': '#f8f9fa', '#5a1019': '#5c7cfa', '#b8323f': '#e9ecef', '#7a1f2b': '#ffd43b', '#3d0d14': '#e67700', '#f2b37a': '#fff3bf', '#d98f58': '#ffe066', '#ffcf4a': '#74c0fc' }],
  galaxyrobo: ['robot', { '#adb5bd': '#9775fa', '#ced4da': '#b197fc', '#868e96': '#7048e8', '#343a40': '#240046', '#495057': '#5f3dc4', '#74c0fc': '#fff27a' }],
  hellhound: ['wolf', { '#e7f5ff': '#c92a2a', '#d0ebff': '#e03131', '#1971c2': '#3b0a0a', '#a5d8ff': '#ff922b', '#4dabf7': '#ffd43b' }],
  darkknight: ['penguin', { '#212529': '#1a1a2e', '#f8f9fa': '#495057', '#74c0fc': '#7b2cbf', '#1864ab': '#240046', '#a5d8ff': '#9d4edd', '#ffa94d': '#ff006e', '#ff6b6b': '#ff006e', '#dee2e6': '#adb5bd', '#d9480f': '#9d0208' }],
};
for (const [id, [base, map]] of Object.entries(RECOLORS)) {
  ENEMY_SVG[id] = () => recolorSVG(ENEMY_SVG[base](), map);
}
