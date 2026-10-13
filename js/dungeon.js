// ============================================================
//  パーティダンジョン
//  持っている キャラから 3 体を えらんで、5 階建ての ダンジョンに いどむ。各階に 新しい 巨大ボス
//  ・3 体 いっしょに 戦う。お題を 打ち切る たびに 攻撃の 中心が 自動で 次の キャラへ。のこりの 2 体も 連携攻撃
//    敵の 攻撃は 3 体の だれかに 当たる。3 体とも 倒れたら 負け。チームスキルは ゲージが 満タンで 自動
//  ・相性: キャラの タイプの 組み合わせで 効果 (TEAM_SYNERGIES)
//  ・絆: 同じ パーティで 階を 突破する たびに、2 体ずつの 絆が 深まり 攻撃が 上がる (育てる やりこみ)
//  ・HP は 階を こえて 持ちこし (階の 間に 30% 回復、倒れた キャラも 25% で 起きる)
//  バトルは battle.js を つかう (App.show('battle', { enemy, dungeon }))
//  記録: Save.data.dungeon = { best: { 難易度: 突破した 階 }, clear: { 難易度: { 階: 1 } }, runs }
//        Save.data.bonds = { 'a|b': ポイント }
// ============================================================

// ---------------- 巨大ボスの 絵 ----------------
Object.assign(ENEMY_SVG, {
  // 大ダコ王: 王冠を かぶった 大きな タコ。8 本の 足
  d_octo: () => `<svg viewBox="0 0 260 230" class="enemy-svg">
    <ellipse cx="130" cy="222" rx="110" ry="8" fill="#000" opacity=".3"/>
    <g class="squish">
      <g fill="#c2255c" stroke="#5c0a2c" stroke-width="3.5">
        ${[[-1, 40, 150], [-1, 66, 170], [-1, 96, 182], [1, 164, 182], [1, 194, 170], [1, 220, 150]].map(([s, x, y]) =>
          `<path d="M${x},${y - 30} C${x + s * 30},${y} ${x + s * 10},${y + 36} ${x + s * 40},${y + 30} C${x + s * 30},${y + 14} ${x + s * 34},${y} ${x + s * 14},${y - 18} Z"/>`).join('')}
        <path d="M70,120 C20,110 6,70 26,50 C34,72 52,86 80,92 Z"/><path d="M190,120 C240,110 254,70 234,50 C226,72 208,86 180,92 Z"/>
      </g>
      <g fill="#ffc9e3">${[[50, 186], [84, 200], [176, 200], [210, 186], [34, 74], [226, 74]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4"/>`).join('')}</g>
      <path d="M58,150 C40,70 84,24 130,24 C176,24 220,70 202,150 C186,172 74,172 58,150 Z" fill="#e64980" stroke="#5c0a2c" stroke-width="4"/>
      <path d="M86,58 C100,40 122,36 140,38" fill="none" stroke="#ffc9e3" stroke-width="8" stroke-linecap="round" opacity=".6"/>
      <circle cx="96" cy="62" r="7" fill="#ff8cc6" opacity=".7"/><circle cx="170" cy="56" r="10" fill="#ff8cc6" opacity=".7"/>
      <ellipse cx="100" cy="106" rx="20" ry="22" fill="#fff3bf" stroke="#5c0a2c" stroke-width="3.5"/><ellipse cx="160" cy="106" rx="20" ry="22" fill="#fff3bf" stroke="#5c0a2c" stroke-width="3.5"/>
      <rect x="95" y="92" width="10" height="28" rx="4" fill="#111"/><rect x="155" y="92" width="10" height="28" rx="4" fill="#111"/>
      <path d="M76,82 L114,92 M184,82 L146,92" stroke="#5c0a2c" stroke-width="6" stroke-linecap="round"/>
      <path d="M112,146 Q130,132 148,146" fill="none" stroke="#5c0a2c" stroke-width="5" stroke-linecap="round"/>
      <path d="M92,30 L100,6 L114,22 L130,0 L146,22 L160,6 L168,30 Z" fill="#ffd43b" stroke="#a66b00" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="130" cy="20" r="5" fill="#4dabf7"/><circle cx="104" cy="22" r="3.5" fill="#ff6b6b"/><circle cx="156" cy="22" r="3.5" fill="#69db7c"/>
    </g></svg>`,

  // 森の巨人: 大きな 木の 体。枝の 腕と 葉の かんむり
  d_treant: () => `<svg viewBox="0 0 260 230" class="enemy-svg">
    <ellipse cx="130" cy="222" rx="104" ry="8" fill="#000" opacity=".3"/>
    <g class="squish">
      <g fill="#2f9e44" stroke="#14532d" stroke-width="3">
        <circle cx="80" cy="56" r="40"/><circle cx="130" cy="36" r="44"/><circle cx="182" cy="56" r="40"/><circle cx="106" cy="76" r="36"/><circle cx="158" cy="76" r="36"/>
      </g>
      <g fill="#69db7c" opacity=".6"><circle cx="112" cy="24" r="12"/><circle cx="70" cy="44" r="9"/><circle cx="176" cy="40" r="10"/></g>
      <g fill="#ffd43b">${[[92, 40], [150, 22], [196, 66], [64, 74]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5"/>`).join('')}</g>
      <path d="M58,140 C30,124 18,100 26,84 C40,96 52,100 66,104 Z M202,140 C230,124 242,100 234,84 C220,96 208,100 194,104 Z" fill="#8a5a2b" stroke="#3d2410" stroke-width="3.5"/>
      <path d="M78,96 C70,150 72,190 66,214 L194,214 C188,190 190,150 182,96 Z" fill="#9c6b3a" stroke="#3d2410" stroke-width="4"/>
      <path d="M96,120 C94,150 98,180 92,206 M164,120 C166,150 162,180 168,206 M130,170 C128,186 132,198 128,210" fill="none" stroke="#6b4423" stroke-width="3" opacity=".7"/>
      <ellipse cx="104" cy="128" rx="13" ry="15" fill="#1a1208"/><ellipse cx="156" cy="128" rx="13" ry="15" fill="#1a1208"/>
      <circle cx="104" cy="128" r="5" fill="#b2f2bb"/><circle cx="156" cy="128" r="5" fill="#b2f2bb"/>
      <path d="M86,108 L118,116 M174,108 L142,116" stroke="#3d2410" stroke-width="6" stroke-linecap="round"/>
      <path d="M108,162 Q130,176 152,162 Q130,168 108,162 Z" fill="#1a1208" stroke="#3d2410" stroke-width="3"/>
    </g></svg>`,

  // 雷鳥: 大きな つばさを 広げた 金色の 鳥。羽の 先に 稲妻
  d_thunderbird: () => `<svg viewBox="0 0 260 230" class="enemy-svg">
    <ellipse cx="130" cy="222" rx="96" ry="8" fill="#000" opacity=".3"/>
    <g class="squish">
      <g fill="#1c7ed6" stroke="#0b3d6e" stroke-width="3.5" stroke-linejoin="round">
        <path d="M110,110 C70,70 30,50 4,56 C20,70 22,80 14,90 C30,92 34,100 26,112 C44,110 52,116 50,128 C70,122 86,124 104,136 Z"/>
        <path d="M150,110 C190,70 230,50 256,56 C240,70 238,80 246,90 C230,92 226,100 234,112 C216,110 208,116 210,128 C190,122 174,124 156,136 Z"/>
      </g>
      <path d="M30,62 L44,78 L36,80 L50,98" fill="none" stroke="#ffe066" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M230,62 L216,78 L224,80 L210,98" fill="none" stroke="#ffe066" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M104,190 L96,216 M118,192 L114,216 M142,192 L146,216 M156,190 L164,216" stroke="#e67700" stroke-width="6" stroke-linecap="round"/>
      <path d="M90,120 C88,80 106,56 130,56 C154,56 172,80 170,120 C168,170 150,196 130,196 C110,196 92,170 90,120 Z" fill="#fcc419" stroke="#a66b00" stroke-width="4"/>
      <path d="M108,140 C112,168 120,184 130,186 C140,184 148,168 152,140 C144,150 116,150 108,140 Z" fill="#fff3bf" opacity=".9"/>
      <path d="M118,40 L124,10 L132,34 L140,8 L144,42 Z" fill="#fcc419" stroke="#a66b00" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="114" cy="92" rx="10" ry="12" fill="#fff" stroke="#a66b00" stroke-width="3"/><ellipse cx="146" cy="92" rx="10" ry="12" fill="#fff" stroke="#a66b00" stroke-width="3"/>
      <circle cx="116" cy="94" r="5" fill="#1971c2"/><circle cx="144" cy="94" r="5" fill="#1971c2"/>
      <path d="M100,76 L124,84 M160,76 L136,84" stroke="#a66b00" stroke-width="5" stroke-linecap="round"/>
      <path d="M120,108 L140,108 L130,128 Z" fill="#e67700" stroke="#a65000" stroke-width="3" stroke-linejoin="round"/>
    </g></svg>`,

  // 氷の大蛇: とぐろを まく 氷の ヘビ。せなかに 氷の とげ
  d_serpent: () => `<svg viewBox="0 0 260 230" class="enemy-svg">
    <ellipse cx="130" cy="222" rx="112" ry="8" fill="#000" opacity=".3"/>
    <g class="squish">
      <path d="M40,196 C20,170 40,140 90,140 C150,140 214,150 220,178 C226,204 180,214 130,214 C80,214 54,212 40,196 Z" fill="#74c0fc" stroke="#1864ab" stroke-width="4"/>
      <path d="M60,170 C70,160 110,156 150,160 C180,164 196,170 200,180" fill="none" stroke="#d0ebff" stroke-width="6" stroke-linecap="round" opacity=".8"/>
      <g fill="#e7f5ff" stroke="#1864ab" stroke-width="2.5" stroke-linejoin="round">${[[60, 144], [96, 136], [132, 136], [168, 140], [200, 150]].map(([x, y]) => `<path d="M${x - 9},${y + 4} L${x},${y - 22} L${x + 9},${y + 4} Z"/>`).join('')}</g>
      <path d="M150,150 C150,110 120,90 118,60 C116,34 136,20 160,22 C190,24 206,46 198,72 C192,92 170,96 168,120 C166,136 170,144 172,150 Z" fill="#4dabf7" stroke="#1864ab" stroke-width="4"/>
      <path d="M140,26 L134,4 L150,20 M180,26 L190,4 L188,28" fill="#e7f5ff" stroke="#1864ab" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="146" cy="56" rx="9" ry="11" fill="#fff" stroke="#1864ab" stroke-width="3"/><ellipse cx="180" cy="54" rx="9" ry="11" fill="#fff" stroke="#1864ab" stroke-width="3"/>
      <rect x="143" y="48" width="6" height="16" rx="3" fill="#0b3d6e"/><rect x="177" y="46" width="6" height="16" rx="3" fill="#0b3d6e"/>
      <path d="M150,86 Q166,96 184,84" fill="none" stroke="#1864ab" stroke-width="4" stroke-linecap="round"/>
      <path d="M160,90 L156,104 M170,92 L172,106" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
      <path d="M190,92 C200,100 204,108 212,104 M208,104 L216,98 M208,104 L214,112" fill="none" stroke="#c92a2a" stroke-width="3" stroke-linecap="round"/>
    </g></svg>`,

  // 混沌の王: たくさんの 目を もつ 黒い 王。まわりを 闇の 玉が まわる
  d_chaos: () => `<svg viewBox="0 0 260 230" class="enemy-svg">
    <ellipse cx="130" cy="222" rx="104" ry="8" fill="#000" opacity=".35"/>
    <g class="squish">
      <g fill="#7048e8" stroke="#2b0a6e" stroke-width="3">${[[30, 120, 16], [230, 110, 14], [52, 50, 11], [208, 40, 12], [130, 210, 9]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>
      <path d="M50,210 C40,150 50,70 130,62 C210,70 220,150 210,210 C190,200 176,214 160,204 C146,214 114,214 100,204 C84,214 70,200 50,210 Z" fill="#212529" stroke="#000" stroke-width="4"/>
      <path d="M70,120 C80,92 100,80 124,78" fill="none" stroke="#9775fa" stroke-width="7" stroke-linecap="round" opacity=".5"/>
      ${[[96, 116, 13], [164, 116, 13], [130, 98, 9], [112, 150, 8], [150, 150, 8], [74, 150, 6], [186, 150, 6], [130, 132, 6]].map(([x, y, r]) =>
        `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.8}" fill="#ff6b6b" stroke="#000" stroke-width="2"/><ellipse cx="${x}" cy="${y}" rx="${r * 0.28}" ry="${r * 0.7}" fill="#1a0000"/>`).join('')}
      <path d="M104,178 L112,188 L120,178 L128,188 L136,178 L144,188 L152,178 L158,186 Q130,200 102,186 Z" fill="#fff" stroke="#000" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M78,72 L86,30 L104,56 L130,18 L156,56 L174,30 L182,72 Z" fill="#495057" stroke="#000" stroke-width="3.5" stroke-linejoin="round"/>
      <circle cx="130" cy="44" r="7" fill="#be4bdb"/><circle cx="96" cy="54" r="4" fill="#ff6b6b"/><circle cx="164" cy="54" r="4" fill="#ff6b6b"/>
    </g></svg>`,
});

// ---------------- 階と ボス ----------------
// 2026-10-13 (v5.19.4): Lv124・完凸 3 体で「1 階は 一瞬、2 階は 5 分 いじょう」と 言われ、作りなおした。
//  ・ボスの レベルを 終盤向けに そろえた (Lv100〜124。クリア後の やりこみ なので)
//  ・HP は へらしすぎず、Lv124・完凸 3 体・中級者 300 打鍵・正確さ 95% の 計算で 1 体 約 25〜40 秒 (全体 約 3 分) に そろえた
//    2 階 (トレントン) は 殻と コンボ半減で 長く なるので HP を 少なめに
//  ・手強さは 攻撃で 出す: 中級者で 1 階ごとに パーティの HP が 3〜5 割 へる くらい。上級者は 攻撃 ×0.5 (DUNGEON_POW。もともと 敵の 攻撃が 約 1.8 倍)
//  ・2026-10-13 (v5.19.6): バグ (どろりんの 毒で 無敵) が 直って「もう少し 強く」と 言われた。
//    5 階 つづけて (HP 持ちこし) の 計算で、初心者は 5 階 すべて HP 7 割 以上 残って いたので 大きく、中級者・上級者は 少し 強く した
const DUNGEON_POW = { beg: 2.2, mid: 1.24, adv: 0.63 };  // 攻撃の 倍率 (難易度ごと)。v5.20 で 中心 いがいの パッシブが 効く ように なった ぶん 1.15 倍
const DUNGEON_HPK = { beg: 1.45, mid: 1.1, adv: 1.05 }; // HP の 倍率 (難易度ごと)
function dungeonEnemy(f, dk) { return { ...f, power: Math.round(f.power * (DUNGEON_POW[dk] || 1)), hpMult: f.hpMult * (DUNGEON_HPK[dk] || 1) }; }
const DUNGEON_FLOORS = [
  { id: 'd_octo', name: '大ダコ王オクトキング', lv: 100, bg: 'sea', ability: ['ink', 'charge'], power: 312, interval: 5000, hpMult: 1.6,
    abilityDesc: '墨でガイドを隠し、3回に1回強い攻撃', desc: '深い海の底のダンジョンを治める大ダコの王。8本の足で何でもつかむ。' },
  { id: 'd_treant', name: '森の巨人トレントン', lv: 106, bg: 'rain', ability: ['armor', 'shell'], power: 540, interval: 5200, hpMult: 1.05,
    abilityDesc: 'かたい樹皮: コンボ30未満だとダメージ半減。ときどき殻にこもる', desc: '千年生きた大木の巨人。ちょっとやそっとの攻撃ではびくともしない。' },
  { id: 'd_thunderbird', name: '雷鳥ライボルト', lv: 112, bg: 'sky', ability: ['thunder', 'wind', 'rage'], power: 440, interval: 4800, hpMult: 1.7,
    abilityDesc: '落雷の予告・文字がゆれる風・HP半分で速くなる', desc: '嵐の雲の上に巣をつくる金色の鳥。羽ばたくたびに雷が落ちる。' },
  { id: 'd_serpent', name: '氷の大蛇ヨルムガント', lv: 118, bg: 'snow', ability: ['freeze', 'charge', 'rage'], power: 390, interval: 5000, hpMult: 1.75,
    abilityDesc: 'こごえさせる・3回に1回強い攻撃・HP半分で速くなる', desc: '氷の山をとりまくほど長い大蛇。吐く息で何でも凍らせる。' },
  { id: 'd_chaos', name: '混沌の王カオスロード', lv: 124, bg: 'void', ability: ['demon', 'poison', 'thunder'], power: 368, interval: 5200, hpMult: 1.9,
    abilityDesc: '本気になると闇でガイドを隠し、必殺ゲージを奪う。毒・落雷の予告', desc: 'ダンジョンのいちばん奥でねむる、すべての魔物の王。目がいくつあるのか、だれも知らない。' },
].map((f, i) => ({ ...f, dg: 'abyss', floor: i, type: 'boss', boss: true, giant: true, base: { ...ENEMY_TYPES.boss }, abilities: f.ability, diff: 'hard', exp: 0 }));
const mkFloors = (dg, arr) => arr.map((f, i) => ({ ...f, dg, floor: i, type: 'boss', boss: true, giant: true, base: { ...ENEMY_TYPES.boss }, abilities: f.ability, diff: 'hard', exp: 0 }));

// ---------------- 2 つめ: 灼熱の 火山洞 (新しい 巨大ボス 5 体) ----------------
Object.assign(ENEMY_SVG, {
  // 溶岩ガニ: 背中が 冷えた 溶岩、ひびから マグマが 光る 大きな カニ
  d_magmacrab: () => `<svg viewBox="0 0 260 230" class="enemy-svg">
    <ellipse cx="130" cy="222" rx="110" ry="8" fill="#000" opacity=".3"/>
    <g class="squish">
      <g stroke="#3b0a00" stroke-width="5" stroke-linecap="round" fill="none">
        <path d="M70,170 L40,205 M86,176 L66,212 M174,176 L194,212 M190,170 L220,205"/></g>
      <path d="M58,110 C20,96 10,60 30,40 C46,50 52,64 64,74 C44,74 40,92 66,100 Z" fill="#e8590c" stroke="#3b0a00" stroke-width="4"/>
      <path d="M202,110 C240,96 250,60 230,40 C214,50 208,64 196,74 C216,74 220,92 194,100 Z" fill="#e8590c" stroke="#3b0a00" stroke-width="4"/>
      <path d="M50,170 C40,120 80,92 130,92 C180,92 220,120 210,170 C200,190 60,190 50,170 Z" fill="#495057" stroke="#212529" stroke-width="4"/>
      <path d="M80,120 L100,140 L94,160 M150,110 L140,134 L160,152 M118,166 L132,148 L170,170" fill="none" stroke="#ff922b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" class="spark-soft"/>
      <path d="M100,92 L96,62 M160,92 L164,62" stroke="#3b0a00" stroke-width="5"/>
      <circle cx="96" cy="56" r="13" fill="#fff4e6" stroke="#3b0a00" stroke-width="3.5"/><circle cx="164" cy="56" r="13" fill="#fff4e6" stroke="#3b0a00" stroke-width="3.5"/>
      <circle cx="98" cy="58" r="6" fill="#c92a2a"/><circle cx="162" cy="58" r="6" fill="#c92a2a"/>
      <path d="M112,128 Q130,140 148,128" fill="none" stroke="#212529" stroke-width="4" stroke-linecap="round"/>
    </g></svg>`,
  // 炎の 魔人: 角の ある 炎の 上半身。下は 燃える 炎
  d_ifrit: () => `<svg viewBox="0 0 260 230" class="enemy-svg">
    <ellipse cx="130" cy="222" rx="80" ry="8" fill="#000" opacity=".3"/>
    <g class="squish">
      <path d="M86,214 C70,190 92,176 84,150 C110,166 112,186 130,198 C148,186 150,166 176,150 C168,176 190,190 174,214 Z" fill="#ff922b" opacity=".9" class="spark-soft"/>
      <path d="M100,214 C96,196 112,190 110,172 C124,184 130,196 130,208 C130,196 136,184 150,172 C148,190 164,196 160,214 Z" fill="#ffe066"/>
      <path d="M40,104 C28,90 30,70 46,64 C56,80 70,84 86,88 L84,118 Z M220,104 C232,90 230,70 214,64 C204,80 190,84 174,88 L176,118 Z" fill="#d9480f" stroke="#5c1a00" stroke-width="4"/>
      <path d="M80,150 C70,100 90,60 130,60 C170,60 190,100 180,150 C170,166 90,166 80,150 Z" fill="#f03e3e" stroke="#5c1a00" stroke-width="4"/>
      <path d="M96,66 C86,46 88,26 104,14 C104,34 110,44 116,58 Z M164,66 C174,46 172,26 156,14 C156,34 150,44 144,58 Z" fill="#343a40" stroke="#000" stroke-width="3"/>
      <path d="M100,96 L120,104 M160,96 L140,104" stroke="#5c1a00" stroke-width="6" stroke-linecap="round"/>
      <ellipse cx="112" cy="112" rx="9" ry="7" fill="#ffe066"/><ellipse cx="148" cy="112" rx="9" ry="7" fill="#ffe066"/>
      <path d="M108,136 Q130,150 152,136" fill="#5c1a00" stroke="#5c1a00" stroke-width="3"/>
      <path d="M116,138 L120,146 L124,139 M136,139 L140,146 L144,138" fill="#fff"/>
      <path d="M104,64 C112,50 124,44 136,44" fill="none" stroke="#ffa8a8" stroke-width="5" stroke-linecap="round" opacity=".6"/>
    </g></svg>`,
  // 黒曜の 巨人: 黒い 結晶の 体に マグマの すじ
  d_obsidian: () => `<svg viewBox="0 0 260 230" class="enemy-svg">
    <ellipse cx="130" cy="222" rx="100" ry="8" fill="#000" opacity=".35"/>
    <g class="squish">
      <path d="M40,150 L56,86 L84,100 L76,170 Z M220,150 L204,86 L176,100 L184,170 Z" fill="#343a40" stroke="#000" stroke-width="4" stroke-linejoin="round"/>
      <path d="M84,214 L74,120 L100,62 L130,48 L160,62 L186,120 L176,214 Z" fill="#212529" stroke="#000" stroke-width="4" stroke-linejoin="round"/>
      <path d="M100,62 L118,120 L130,48 M160,62 L142,120 L130,48 M118,120 L142,120 L130,170 Z" fill="#495057" opacity=".6"/>
      <path d="M96,150 L112,170 L104,200 M164,150 L150,172 L158,204 M74,120 L60,140 M186,120 L200,140" fill="none" stroke="#ff6b00" stroke-width="4" stroke-linecap="round" class="spark-soft"/>
      <path d="M108,98 L124,104 L108,110 Z M152,98 L136,104 L152,110 Z" fill="#ff922b" class="spark-soft"/>
      <path d="M114,132 L146,132" stroke="#ff6b00" stroke-width="4" stroke-linecap="round"/>
      <path d="M130,48 L122,22 L130,30 L138,22 Z" fill="#495057" stroke="#000" stroke-width="3"/>
    </g></svg>`,
  // 火山竜: 背中に 火山の ような とげ、口から 火の 粉
  d_volcdragon: () => `<svg viewBox="0 0 260 230" class="enemy-svg">
    <ellipse cx="130" cy="222" rx="110" ry="8" fill="#000" opacity=".3"/>
    <g class="squish">
      <path d="M30,210 C20,160 60,130 110,140 C150,146 180,170 230,160 C226,196 190,214 130,214 Z" fill="#c92a2a" stroke="#4a0a0a" stroke-width="4"/>
      <g fill="#495057" stroke="#212529" stroke-width="3" stroke-linejoin="round">${[[70, 142], [104, 138], [140, 146], [176, 156]].map(([x, y]) => `<path d="M${x - 14},${y + 4} L${x - 6},${y - 22} L${x + 6},${y - 22} L${x + 14},${y + 4} Z"/><path d="M${x - 5},${y - 22} L${x + 5},${y - 22}" stroke="#ff922b" stroke-width="4"/>`).join('')}</g>
      <path d="M150,150 C150,110 130,90 128,64 C126,36 150,20 180,22 C214,24 232,50 224,78 C216,104 190,110 186,130 Z" fill="#e03131" stroke="#4a0a0a" stroke-width="4"/>
      <path d="M150,30 L140,4 L160,22 M200,26 L214,2 L212,30" fill="#ffd8a8" stroke="#4a0a0a" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="164" cy="60" rx="9" ry="10" fill="#ffe066" stroke="#4a0a0a" stroke-width="3"/><ellipse cx="200" cy="58" rx="9" ry="10" fill="#ffe066" stroke="#4a0a0a" stroke-width="3"/>
      <rect x="161" y="52" width="6" height="16" rx="3" fill="#000"/><rect x="197" y="50" width="6" height="16" rx="3" fill="#000"/>
      <path d="M170,92 Q190,100 214,88" fill="none" stroke="#4a0a0a" stroke-width="4" stroke-linecap="round"/>
      <g fill="#ffa94d" class="spark">${[[226, 96], [236, 86], [240, 104]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4"/>`).join('')}</g>
    </g></svg>`,
  // 炎帝: 炎の つばさと 王冠を もつ 火の 鳥の 王
  d_kagutsuchi: () => `<svg viewBox="0 0 260 230" class="enemy-svg">
    <ellipse cx="130" cy="222" rx="100" ry="8" fill="#000" opacity=".3"/>
    <g class="squish">
      <g fill="#ff6b00" stroke="#7a2600" stroke-width="3.5" stroke-linejoin="round" class="spark-soft">
        <path d="M108,120 C70,80 30,70 6,86 C30,94 30,104 20,116 C40,116 44,126 34,140 C56,136 66,144 64,158 C84,148 98,148 108,156 Z"/>
        <path d="M152,120 C190,80 230,70 254,86 C230,94 230,104 240,116 C220,116 216,126 226,140 C204,136 194,144 196,158 C176,148 162,148 152,156 Z"/></g>
      <path d="M40,96 C56,92 70,96 84,104 M220,96 C204,92 190,96 176,104" fill="none" stroke="#ffe066" stroke-width="4" stroke-linecap="round"/>
      <path d="M100,200 C90,180 104,170 100,150 L160,150 C156,170 170,180 160,200 C150,214 110,214 100,200 Z" fill="#ff922b" stroke="#7a2600" stroke-width="4"/>
      <path d="M96,130 C92,92 108,66 130,66 C152,66 168,92 164,130 C162,154 98,154 96,130 Z" fill="#fa5252" stroke="#7a2600" stroke-width="4"/>
      <path d="M104,62 L110,30 L122,48 L130,22 L138,48 L150,30 L156,62 Z" fill="#ffd43b" stroke="#a66b00" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="130" cy="40" r="5" fill="#ff6bff"/>
      <ellipse cx="116" cy="102" rx="8" ry="10" fill="#fff" stroke="#7a2600" stroke-width="3"/><ellipse cx="144" cy="102" rx="8" ry="10" fill="#fff" stroke="#7a2600" stroke-width="3"/>
      <circle cx="117" cy="104" r="4.5" fill="#c92a2a"/><circle cx="143" cy="104" r="4.5" fill="#c92a2a"/>
      <path d="M122,120 L138,120 L130,136 Z" fill="#fcc419" stroke="#a66b00" stroke-width="3" stroke-linejoin="round"/>
    </g></svg>`,
});
const VOLCANO_FLOORS = mkFloors('volcano', [
  { id: 'd_magmacrab', name: '溶岩ガニマグマクラブ', lv: 110, bg: 'volcano', ability: ['armor', 'charge'], power: 480, interval: 5000, hpMult: 1.7,
    abilityDesc: '溶岩のこうら: コンボ30未満だとダメージ半減・3回に1回強い攻撃', desc: '冷えた溶岩を背負った大ガニ。ひびの中ではマグマが煮えている。' },
  { id: 'd_ifrit', name: '炎の魔人イフリート', lv: 114, bg: 'volcano', ability: ['poison', 'rage'], statusName: 'やけど', power: 495, interval: 4800, hpMult: 1.75,
    abilityDesc: 'やけどにする・HP半分で速くなる', desc: '火山の熱から生まれた魔人。笑い声だけで岩がとける。' },
  { id: 'd_obsidian', name: '黒曜の巨人オブシディアン', lv: 118, bg: 'volcano', ability: ['shell', 'charge'], power: 540, interval: 5200, hpMult: 1.6,
    abilityDesc: 'ときどき黒曜石の殻にこもる・3回に1回強い攻撃', desc: '黒曜石でできた巨人。体のすきまをマグマが流れている。' },
  { id: 'd_volcdragon', name: '火山竜ボルケドラ', lv: 121, bg: 'volcano', ability: ['dragon', 'rage'], power: 460, interval: 5000, hpMult: 1.85,
    abilityDesc: '3回に1回炎のブレス・HP半分で速くなる', desc: '背中に小さな火山をいくつも背負った竜。ねむるたびに噴火する。' },
  { id: 'd_kagutsuchi', name: '炎帝カグツチ', lv: 124, bg: 'magma', ability: ['demon', 'poison', 'wind'], statusName: 'やけど', power: 437, interval: 5000, hpMult: 2,
    abilityDesc: '本気になると闇でガイドを隠し必殺ゲージを奪う・やけど・風', desc: '火山洞の主。炎のつばさで羽ばたくと、洞くつ全体が赤く光る。' },
]);

// ---------------- 3 つめ: 星降る 天空塔 (深淵の 迷宮の ボスが 星の 力で 変わった 変異種。能力が 1 つずつ 多い) ----------------
const SKY_FLOORS = mkFloors('sky', [
  { id: 's_octo', vbase: 'd_octo', filter: 'hue-rotate(190deg) saturate(1.6) brightness(1.1)', name: '星海の王オクトスター', lv: 124, bg: 'space', ability: ['ink', 'charge', 'wind'], power: 400, interval: 4800, hpMult: 2.1,
    abilityDesc: '墨でガイドを隠す・強い攻撃・風で文字がゆれる', desc: '星の海を泳ぐ大ダコ。8本の足の先が星のように光る。' },
  { id: 's_treant', vbase: 'd_treant', filter: 'hue-rotate(160deg) saturate(1.4)', name: '星の巨樹ユグドラ', lv: 124, bg: 'space', ability: ['armor', 'shell', 'charge'], power: 600, interval: 5200, hpMult: 1.3,
    abilityDesc: 'コンボ30未満で半減・殻にこもる・強い攻撃', desc: '天空塔をつらぬいて生える星の大樹。実のかわりに星がなる。' },
  { id: 's_thunderbird', vbase: 'd_thunderbird', filter: 'hue-rotate(200deg) saturate(1.5) brightness(1.15)', name: '銀河鳥ギャラクシア', lv: 124, bg: 'space', ability: ['thunder', 'wind', 'rage', 'fade'], power: 470, interval: 4600, hpMult: 2,
    abilityDesc: '落雷の予告・風・怒る・霧でガイドを隠す', desc: '銀河を横切って飛ぶ鳥。羽ばたきで流れ星が生まれる。' },
  { id: 's_serpent', vbase: 'd_serpent', filter: 'hue-rotate(230deg) saturate(1.8) brightness(1.05)', name: '星屑の大蛇コスモガント', lv: 124, bg: 'space', ability: ['freeze', 'charge', 'rage', 'poison'], power: 430, interval: 4800, hpMult: 2.1,
    abilityDesc: 'こごえ・強い攻撃・怒る・毒', desc: '星屑でできた大蛇。とぐろの中に小さな銀河がある。' },
  { id: 's_chaos', vbase: 'd_chaos', filter: 'hue-rotate(260deg) saturate(2) brightness(1.2)', name: '虚無の王ヴォイドロード', lv: 124, bg: 'void', ability: ['demon', 'poison', 'thunder', 'fade'], power: 420, interval: 5000, hpMult: 2.3,
    abilityDesc: '本気で闇・必殺ゲージを奪う・毒・落雷・霧', desc: '天空塔のてっぺんで、すべての星を見下ろす王。カオスロードの本当の姿とも言われる。' },
]);
for (const f of SKY_FLOORS) ENEMY_VARIANT[f.id] = { base: f.vbase, filter: f.filter };

// ---------------- ダンジョンの 一覧 ----------------
// reward: 報酬の 倍率 / unlock: この ダンジョンを 全部 突破 (どの 難易度でも) すると 開く
const DUNGEONS = [
  { id: 'abyss', name: '深淵の迷宮', icon: '🏰', floors: DUNGEON_FLOORS, reward: 1, unlock: null },
  { id: 'volcano', name: '灼熱の火山洞', icon: '🌋', floors: VOLCANO_FLOORS, reward: 1.6, unlock: 'abyss' },
  { id: 'sky', name: '星降る天空塔', icon: '🌌', floors: SKY_FLOORS, reward: 2.5, unlock: 'volcano' },
];
function dungeonDef(id) { return DUNGEONS.find(x => x.id === id) || DUNGEONS[0]; }
// 記録 (深淵の 迷宮は 前からの d.best / d.clear を そのまま つかう)
function dgRec(id) {
  const d = dungeonData();
  if (id === 'abyss') return { best: d.best, clear: d.clear };
  d.recs = d.recs || {};
  return d.recs[id] = d.recs[id] || { best: {}, clear: {} };
}
function dungeonCleared(id) { const r = dgRec(id); return Math.max(0, ...Object.values(r.best)) >= dungeonDef(id).floors.length; }
function dungeonOpen(dgd) { return !dgd.unlock || dungeonCleared(dgd.unlock); }
// 持ち帰りの 報酬 (1 階 突破ごと。脱出か 全部 突破で もらえる)
function floorPot(dgd, f) { return { coins: Math.round((120 + f * 80) * dgd.reward), shards: Math.round((3 + f * 2) * dgd.reward) }; }
const DUNGEON_WIPE_KEEP = 0.5; // 全滅したら 持ち帰りの 半分

const DUNGEON_HEAL = 0.3, DUNGEON_REVIVE = 0.25; // 階の 間の 回復 / 倒れた キャラ
const DUNGEON_REWARD = i => ({ coins: 400 + i * 300, shards: 10 + i * 8 });
const SUPPORT_RATE = 0.2;       // うしろの キャラの 連携攻撃 (1 体ぶん、お題の 威力の 2 割)
const TEAM_GAUGE_KEY = 0.75;    // チームゲージ: 正しく 1 打つ ごとに (約 130 打で 満タン)
const TEAM_GAUGE_MISS = 2;      // ミスで へる
const TEAM_SKILL_POWER = 140;   // チームスキル: 3 体 それぞれの 威力
// キャラごとに しまって おく 状態 (battle.js の enter で 0 に して いる もの)
const PARTY_STATE = ['streak', 'tempo', 'tempoMult', 'snow', 'seg', 'luck', 'trioStreak', 'forgiven', 'forgiveUntil', 'wardUntil', 'critUntil', 'critAdd', 'rageUntil', 'regenUntil',
  'streakGuard', 'doubleUntil', 'poisonBoostUntil', 'drainUntil', 'comboGuardUntil', 'trioNext', 'segGuardUntil', 'diceN', 'diceZoro', 'diceWeight', 'diceTriple', 'diceExt', 'bestKps'];
const PARTY_STATE_INIT = { tempoMult: 1, trioNext: false };
const PARTY_PSTATE = ['skill', 'shield', 'barrier', 'evade', 'reflect', 'boost'];
const PARTY_PSTATE_INIT = { boost: 1 };
// ふつうの バトルに もどる ときに 1 体の 表示へ もどす
function restoreSolo() {
  const t = document.getElementById('b-trio'); if (t) t.remove();
  const s = document.getElementById('b-psprite-solo'); if (s) s.id = 'b-psprite';
  const p = document.getElementById('b-player'); if (p) p.style.display = '';
}

// ---------------- 相性 ----------------
const tset = ids => new Set(ids.map(id => CHARACTERS[id].type));
const TEAM_SYNERGIES = [
  { id: 'triangle', name: '三すくみ', desc: '水・炎・草がそろう', eff: { atk: 0.15 }, check: (t) => t.has('水') && t.has('炎') && t.has('草') },
  { id: 'storm', name: '疾風迅雷', desc: '電気と風', eff: { crit: 0.1 }, check: (t) => t.has('電気') && t.has('風') },
  { id: 'lightshadow', name: '光と影', desc: '光と影', eff: { charge: 0.25 }, check: (t) => t.has('光') && t.has('影') },
  { id: 'fortress', name: '鉄壁', desc: '岩・鋼・雪・金のうち2体', eff: { cut: 0.15 }, check: (t) => ['岩', '鋼', '雪', '金'].filter(x => t.has(x)).length >= 2 },
  { id: 'frost', name: '氷雪', desc: '氷と雪', eff: { cut: 0.1, atk: 0.05 }, check: (t) => t.has('氷') && t.has('雪') },
  { id: 'night', name: '月夜', desc: '月と、影かクラゲ', eff: { crit: 0.08 }, check: (t) => t.has('月') && (t.has('影') || t.has('クラゲ')) },
  { id: 'dragonfire', name: '竜の炎', desc: 'ドラゴンと、炎か灯火', eff: { atk: 0.12 }, check: (t) => t.has('ドラゴン') && (t.has('炎') || t.has('灯火')) },
  { id: 'nature', name: '森の仲間', desc: '草・虫・毒のうち2体', eff: { hp: 0.15 }, check: (t) => ['草', '虫', '毒'].filter(x => t.has(x)).length >= 2 },
  { id: 'rhythm', name: 'リズム隊', desc: '音と、分裂か仲間', eff: { atk: 0.1 }, check: (t) => t.has('音') && (t.has('分裂') || t.has('仲間')) },
  { id: 'luck', name: '一か八か', desc: '運試しと伝説', eff: { crit: 0.12 }, check: (t) => t.has('運試し') && t.has('伝説') },
  { id: 'starters', name: 'はじまりの仲間', desc: '最初の6体だけで組む', eff: { hp: 0.1, atk: 0.08 }, check: (t, ids) => ids.every(id => STARTERS.includes(id)) },
  { id: 'gachaborn', name: 'ガチャの申し子', desc: 'ガチャ限定キャラ3体', eff: { charge: 0.2 }, check: (t, ids) => ids.every(id => CHARACTERS[id].gacha) },
  // ---- 広い 条件の 相性 (2026-10-13: 重なりやすく して 組み合わせの 幅を 広げる) ----
  { id: 'balance', name: '攻・守・支', desc: '攻め・守り・支えが1体ずつ', eff: { atk: 0.06, cut: 0.06, charge: 0.1 }, check: (t, ids) => ['攻め', '守り', '支え'].every(g => ids.some(id => roleGroup(id) === g)) },
  { id: 'assault', name: '猛攻', desc: '3体とも攻め', eff: { atk: 0.18 }, check: (t, ids) => ids.every(id => roleGroup(id) === '攻め') },
  { id: 'castle', name: '不落の城', desc: '守りが2体以上', eff: { cut: 0.12 }, check: (t, ids) => ids.filter(id => roleGroup(id) === '守り').length >= 2 },
  { id: 'healring', name: '癒やしの輪', desc: '支えが2体以上', eff: { hp: 0.12 }, check: (t, ids) => ids.filter(id => roleGroup(id) === '支え').length >= 2 },
  { id: 'elements', name: '元素の嵐', desc: '水・炎・草・電気・風・氷・岩のうち3体', eff: { atk: 0.08 }, check: (t) => ['水', '炎', '草', '電気', '風', '氷', '岩'].filter(x => t.has(x)).length >= 3 },
  { id: 'nightfolk', name: '夜の住人', desc: '影・月・毒・灯火のうち2体', eff: { crit: 0.08 }, check: (t) => ['影', '月', '毒', '灯火'].filter(x => t.has(x)).length >= 2 },
  { id: 'evolved', name: '進化の力', desc: '3体とも最後まで進化（Lv.80以上）', eff: { atk: 0.1, hp: 0.1 }, check: (t, ids) => ids.every(id => charInfo(id).stage >= 4) },
  { id: 'awakened', name: '覚醒の絆', desc: '3体とも覚醒★1以上', eff: { charge: 0.15 }, check: (t, ids) => ids.every(id => awakenOf(id) >= 1) },
  { id: 'masters', name: '極みの集い', desc: '熟練度が極みのキャラが2体以上', eff: { crit: 0.1 }, check: (t, ids) => ids.filter(id => masteryLv(id) >= MASTERY_MAX).length >= 2 },
  { id: 'sameage', name: '同期', desc: '3体のレベルの差が5以内', eff: { cut: 0.08 }, check: (t, ids) => { const ls = ids.map(id => charInfo(id).L); return Math.max(...ls) - Math.min(...ls) <= 5; } },
];
// 役割の 系統 (攻め・守り・支え)
const ROLE_GROUPS = {
  攻め: ['攻撃型', '逆転型', '連撃型', 'ため打ち型', 'コンボ型', '連続型', 'ギャンブル型', 'ぎりぎり型', 'スピード型', '正確型'],
  守り: ['防御型', '守り型', 'カウンター型', '吸収型', 'ため込み型'],
  支え: ['回復型', 'テクニック型', 'じわじわ型', '連携型', 'バランス型', 'オールラウンド型'],
};
function roleGroup(id) { const r = CHARACTERS[id].role; return Object.keys(ROLE_GROUPS).find(g => ROLE_GROUPS[g].includes(r)) || '支え'; }
const EFF_NAME = { atk: '攻撃', cut: '受けるダメージ', crit: '会心率', charge: '必殺ゲージのたまり', hp: 'HP' };
function effText(eff) { return Object.entries(eff).map(([k, v]) => `${EFF_NAME[k]}${k === 'cut' ? '-' : '+'}${Math.round(v * 100)}%`).join('・'); }
function activeSynergies(ids) { const t = tset(ids); return ids.length >= 2 ? TEAM_SYNERGIES.filter(s => s.check(t, ids)) : []; }

// ---------------- 絆 (2 体ずつ) ----------------
const BOND_STEPS = [3, 8, 15, 25, 40]; // この ポイントで 絆 Lv が 1 上がる (最大 5)
const BOND_ATK = 0.02; // 絆 Lv 1 つごとに 攻撃 +2% (その 2 体が パーティに いるとき)
const bondKey = (a, b) => [a, b].sort().join('|');
function bondPts(a, b) { return (Save.data.bonds || {})[bondKey(a, b)] || 0; }
function bondLv(a, b) { const p = bondPts(a, b); return BOND_STEPS.filter(s => p >= s).length; }
function pairsOf(ids) { const r = []; for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) r.push([ids[i], ids[j]]); return r; }
function addBond(ids, n) { const b = Save.data.bonds = Save.data.bonds || {}; for (const [a, c] of pairsOf(ids)) b[bondKey(a, c)] = (b[bondKey(a, c)] || 0) + n; }
function maxBondLv() { return Math.max(0, ...Object.keys(Save.data.bonds || {}).map(k => { const [a, b] = k.split('|'); return bondLv(a, b); })); }

// パーティ全体の 効果 (相性 + 絆)
function dungeonTeam(ids) {
  const t = { atk: 0, cut: 0, crit: 0, charge: 0, hp: 0 };
  for (const s of activeSynergies(ids)) for (const [k, v] of Object.entries(s.eff)) t[k] += v;
  t.bond = pairsOf(ids).reduce((n, [a, b]) => n + bondLv(a, b), 0) * BOND_ATK;
  return t;
}

function dungeonData() {
  const d = Save.data.dungeon = Save.data.dungeon || { best: {}, clear: {}, runs: 0 };
  d.best = d.best || {}; d.clear = d.clear || {};
  return d;
}
function dungeonParty() { return (Save.data.dungeonParty || []).filter(id => CHARACTERS[id] && hasChar(id)); }

// ---------------- バトルの 中の パーティ (battle.js に 足す) ----------------
Object.assign(Screens.battle, {
  // ---- 3 体 いっしょに 戦う ----
  // 3 体は いつも 並んで いる (#b-trio)。お題を 打ち切る たびに「攻撃の 中心」(this.pi) が 次の キャラへ 自動で 回る。
  // 中心の キャラが 自分の 特性で 攻撃し、のこりの 2 体も 連携攻撃。キャラごとの 状態 (連続ボーナス・必殺ゲージ など) は
  // キャラごとに しまって おく (stash / unstash)。敵の 攻撃は 3 体の だれかに 当たる
  setupParty() {
    const dg = this.dungeon, team = dungeonTeam(dg.party.map(m => m.id));
    this.team = team;
    this.teamAtk = 1 + team.atk + team.bond; this.teamCut = 1 - Math.min(0.5, team.cut); this.teamCrit = team.crit; this.teamCharge = 1 + team.charge;
    this.party = dg.party.map(m => {
      const ch = charInfo(m.id), max = Math.round(ch.stats.hp * BATTLE_HP_SCALE * (1 + team.hp));
      return { id: m.id, ch, max, hp: m.hp == null ? max : Math.round(Math.min(1, m.hp) * max), keys: 0, st: { skill: m.skill || 0 } };
    });
    const lead = dg.lead || 0;
    this.pi = this.party[lead] && this.party[lead].hp > 0 ? lead : Math.max(0, this.party.findIndex(m => m.hp > 0));
    this.teamGauge = dg.teamGauge || 0;
    this.buildTrio();
    this.unstash(this.party[this.pi]);
    this.markTurn();
    this.renderParty(); // 敵は 使わないので ここで 出して よい
    this._ptT = 0;
  },

  // キャラごとの 状態を しまう / とりだす
  stash(m) {
    const st = m.st = {};
    for (const k of PARTY_STATE) st[k] = this[k];
    for (const k of PARTY_PSTATE) st['p_' + k] = this.p[k];
    m.hp = this.p.hp;
  },
  unstash(m) {
    const st = m.st || {};
    for (const k of PARTY_STATE) this[k] = st[k] ?? PARTY_STATE_INIT[k] ?? 0;
    for (const k of PARTY_PSTATE) this.p[k] = st['p_' + k] ?? PARTY_PSTATE_INIT[k] ?? 0;
    this.p.skill = st.skill ?? st.p_skill ?? 0;
    this.ch = m.ch; this.p.hp = m.hp; this.p.max = m.max;
  },

  // 3 体の 並び (ひとりの 絵の かわりに 3 つの 枠)。中心の キャラの 絵に id="b-psprite" を つけて、攻撃の 動きは そこから 出す
  buildTrio() {
    const solo = $('#b-psprite');
    if (solo && solo.closest('#b-player')) solo.id = 'b-psprite-solo';
    $('#b-player').style.display = 'none';
    let el = $('#b-trio');
    if (!el) { el = document.createElement('div'); el.id = 'b-trio'; $('#arena').appendChild(el); }
    el.innerHTML = this.party.map((m, i) => `<div class="tr-mem t${i}" data-i="${i}">
      <div class="tr-info"><b>${m.ch.name}</b><small>Lv.${m.ch.L}</small>
        <div class="tr-hp"><i></i></div><div class="tr-sk"><i></i></div></div>
      <div class="tr-sprite">${slimeSVG(m.id, m.ch.stage)}</div><div class="tr-ring"></div></div>`).join('');
  },
  // 攻撃の 中心を 光らせる (id も 移す)
  markTurn() {
    document.querySelectorAll('#b-trio .tr-mem').forEach(el => {
      const i = +el.dataset.i, sp = el.querySelector('.tr-sprite');
      el.classList.toggle('turn', i === this.pi);
      sp.id = i === this.pi ? 'b-psprite' : '';
    });
    $('#b-pname').textContent = this.ch.name;
    $('#b-plv').textContent = ` Lv.${this.ch.L}`;
    $('#b-skillname').textContent = this.ch.skill.name;
    $('#b-skill').style.setProperty('--cc', this.ch.def.colors.main);
    if (this.e && this.e.max) this.updateBars(true); // 敵が できる 前 (setupParty の とき) は まだ 出さない
  },
  // 次の キャラへ (お題を 打ち切る たび)
  nextTurn() {
    if (!this.party || this.state !== 'run') return;
    for (let k = 1; k <= this.party.length; k++) {
      const i = (this.pi + k) % this.party.length;
      if (this.party[i].hp > 0) {
        if (i === this.pi) return;
        this.stash(this.party[this.pi]);
        this.pi = i;
        this.unstash(this.party[i]);
        this.markTurn();
        this.renderParty();
        return;
      }
    }
  },

  // 上の チームゲージと、3 体の HP・必殺ゲージ
  renderParty() {
    let el = $('#b-party');
    if (!this.party) { if (el) el.remove(); return; }
    if (!el) { el = document.createElement('div'); el.id = 'b-party'; $('#arena').appendChild(el); }
    this.party[this.pi].hp = this.p.hp;
    el.innerHTML = `<div class="bp-team ${this.teamGauge >= 100 ? 'ready' : ''}" id="bp-team"><span>チームスキル</span><b><i style="width:${this.teamGauge}%"></i></b><small>満タンで自動</small></div>`;
    document.querySelectorAll('#b-trio .tr-mem').forEach(t => {
      const i = +t.dataset.i, m = this.party[i];
      const sk = i === this.pi ? this.p.skill : (m.st && (m.st.skill ?? m.st.p_skill)) || 0;
      t.classList.toggle('down', m.hp <= 0);
      t.querySelector('.tr-hp i').style.width = Math.max(0, m.hp / m.max * 100).toFixed(1) + '%';
      t.querySelector('.tr-hp i').classList.toggle('low', m.hp / m.max < 0.3);
      t.querySelector('.tr-sk i').style.width = clamp(sk, 0, 100) + '%';
    });
  },

  // お題を 打ち切った: 中心 いがいの 2 体も 連携攻撃 → 中心を 次の キャラへ
  supportAttack() {
    if (this.state !== 'run') return;
    const ec = FX.center($('#b-esprite'));
    this.party.forEach((m, i) => {
      if (i === this.pi || m.hp <= 0) return;
      const el = document.querySelector(`#b-trio .tr-mem[data-i="${i}"]`);
      const d = Math.max(1, Math.round(calcDamage(m.ch.L, wordPower(this.lastWordKeys || 10), m.ch.stats.atk, this.e.stats.def) * SUPPORT_RATE));
      replayAnim(el, 'sup-hop', 300);
      this.proj(FX.center(el.querySelector('.tr-sprite')), ec, { color: m.ch.def.colors.main, size: 7, frames: 16 + i * 3, arc: -60,
        onHit: () => { if (this.state === 'run') this.hitEnemy(d, { colors: [m.ch.def.colors.main, '#fff'] }); } });
    });
    this.after(() => this.nextTurn(), 120);
  },

  // ---- 中心で なくても いつも 効く 特性 (2026-10-13: ユーザーの 希望) ----
  // 当たった キャラ自身の 守りの 特性で ダメージを へらす (ごつん・ゆうしゃりんの カット、ゆきだるんの 雪玉)
  guardCut(m, dmg) {
    const tr = m.ch.trait;
    if (m.id === 'gotsun' || m.id === 'yuusharin') dmg *= 1 - (tr.cut || 0);
    if (m.id === 'yukidarun') {
      const snow = m === this.party[this.pi] ? this.snow : ((m.st && m.st.snow) || 0);
      dmg *= 1 - (tr.snowCut || 0) * snow;
    }
    return Math.max(1, Math.round(dmg));
  },
  // 中心 いがいの キャラに 当たった: その キャラの 回避・カット・押し返しで 受ける
  memberHit(i, dmg) {
    const m = this.party[i], tr = m.ch.trait, el = document.querySelector(`#b-trio .tr-mem[data-i="${i}"]`);
    const c = FX.center(el.querySelector('.tr-sprite'));
    if (m.id === 'piriri' && Math.random() < (tr.dodge || 0)) { // ぴりり: すばやく よける
      replayAnim(el.querySelector('.tr-sprite'), 'dodge', 400); floatText(c.x, c.y - 40, 'よけた！', 'guard'); return;
    }
    if (m.id === 'koorin' && Math.random() < (tr.counter || 0)) { // こおりん: 攻撃ゲージを 押し返す
      this.e.gauge = Math.max(0, this.e.gauge - (tr.pushback || 0)); floatText(c.x, c.y - 60, 'ひんやり！', 'guard');
    }
    dmg = this.guardCut(m, dmg);
    if (m.id === 'yukidarun' && m.st && m.st.snow > 0) m.st.snow--; // 雪玉は 攻撃を うけると 1 個 へる
    if (this.teamCut !== 1) dmg = Math.max(1, Math.round(dmg * this.teamCut));
    this.damageMember(i, dmg);
  },
  // かげまる: 生きて いれば いつも 敵の 攻撃が 遅く なる (いちばん 強い 値)
  partySlow() { return Math.max(0, ...this.party.filter(m => m.hp > 0 || m === this.party[this.pi]).map(m => m.ch.trait.slow || 0)); },

  // 敵の 攻撃: 3 体の だれかに 当たる (中心の キャラ いがいなら その キャラの HP を へらす)
  pickTarget() {
    const alive = this.party.map((m, i) => i).filter(i => this.party[i].hp > 0);
    return alive[Math.floor(Math.random() * alive.length)];
  },
  damageMember(i, dmg) {
    const m = this.party[i], el = document.querySelector(`#b-trio .tr-mem[data-i="${i}"]`);
    m.hp -= dmg;
    const c = FX.center(el.querySelector('.tr-sprite'));
    floatText(c.x, c.y - 40, dmg, 'dmg taken');
    replayAnim(el.querySelector('.tr-sprite'), 'hurt', 450);
    SFX.hurt();
    shake($('#arena'), false);
    if (m.hp <= 0) {
      m.hp = 0;
      toast(`${m.ch.name}が倒れた！`, 1800);
      if (!this.party.some(x => x.hp > 0)) { this.renderParty(); this.lose(); return; }
    }
    this.renderParty();
  },

  // 中心の キャラが 倒れた: 次の キャラが 中心に なる。全員 倒れたら 負け
  partyFall() {
    this.p.hp = 0;
    this.party[this.pi].hp = 0;
    toast(`${this.ch.name}が倒れた！`, 1800);
    if (!this.party.some(m => m.hp > 0)) { this.renderParty(); this.lose(); return; }
    this.nextTurn();
    this.renderParty();
  },

  partyTick(dt) {
    // もりりん: 3 秒ごとに 全員を 回復 (中心で なくても)
    this._regenT = (this._regenT || 0) + dt;
    if (this._regenT >= 3000) {
      this._regenT = 0;
      for (const h of this.party) {
        if (h.hp <= 0 && h !== this.party[this.pi]) continue;
        const r = h.ch.trait.regen; if (!r) continue;
        const own = h === this.party[this.pi] ? this : h.st || {};
        const mult = (own.regenUntil || 0) > this.elapsed ? 2 : 1;
        this.party.forEach((m, i) => {
          if (i === this.pi) { if (this.p.hp > 0) this.p.hp = Math.min(this.p.max, this.p.hp + this.p.max * r * mult); }
          else if (m.hp > 0) m.hp = Math.min(m.max, m.hp + m.max * r * mult);
        });
        const el = document.querySelector(`#b-trio .tr-mem[data-i="${this.party.indexOf(h)}"]`);
        if (el) { const c = FX.center(el.querySelector('.tr-sprite')); floatText(c.x, c.y - 50, '全員回復', 'heal'); }
      }
      this.updateBars();
    }
    this._ptT = (this._ptT || 0) + dt;
    if (this._ptT > 300) { this._ptT = 0; this.renderParty(); }
  },

  addTeamGauge(n) {
    const before = this.teamGauge;
    this.teamGauge = clamp(this.teamGauge + n, 0, 100);
    const f = $('#bp-team i'); if (f) f.style.width = this.teamGauge + '%';
    const b = $('#bp-team'); if (b) b.classList.toggle('ready', this.teamGauge >= 100);
    // 満タンに なったら 自動で チームスキル
    if (before < 100 && this.teamGauge >= 100) { SFX.charge(); this.after(() => this.teamSkill(), 250); }
  },
  // チームスキル: 3 体 そろって 大技。相性に 合わせて 追加の 効果
  teamSkill() {
    if (this.state !== 'run' || this.teamGauge < 100) return;
    this.teamGauge = 0; this.addTeamGauge(0);
    const syn = activeSynergies(this.party.map(m => m.id));
    const kinds = new Set(syn.flatMap(x => Object.keys(x.eff)));
    const name = syn.length ? `トリプル${syn[0].name}${syn.length > 1 ? `＋${syn.length - 1}` : ''}` : 'トリプルアタック';
    const extra = [];
    let mult = 1, crit = false;
    if (kinds.has('atk')) { mult = 1.5; extra.push('威力1.5倍'); }
    if (kinds.has('crit')) { crit = true; extra.push('全部会心'); }
    if (kinds.has('cut')) { this.p.barrier += 2; extra.push('バリア2回'); }
    if (kinds.has('charge')) {
      this.p.skill = Math.min(99, this.p.skill + 40);
      this.party.forEach((m, i) => { if (i !== this.pi) { m.st = m.st || {}; m.st.skill = Math.min(99, (m.st.skill ?? m.st.p_skill ?? 0) + 40); m.st.p_skill = m.st.skill; } });
      extra.push('必殺ゲージ+40%');
    }
    const heal = kinds.has('hp') ? 0.15 : extra.length ? 0 : 0.08;
    if (heal) {
      this.p.hp = Math.min(this.p.max, this.p.hp + this.p.max * heal);
      this.party.forEach((m, i) => { if (i !== this.pi && m.hp > 0) m.hp = Math.min(m.max, m.hp + m.max * heal); });
      extra.push(`全員HP${Math.round(heal * 100)}%回復`);
    }
    teamCutin(name, syn.map(x => x.name), extra, this.party.filter(m => m.hp > 0));
    this.log(`チームスキル「${name}」！${extra.length ? '（' + extra.join('・') + '）' : ''}`, 'player');
    const ec = FX.center($('#b-esprite'));
    this.party.forEach((m, i) => {
      if (m.hp <= 0) return;
      const d = Math.round(calcDamage(m.ch.L, TEAM_SKILL_POWER, m.ch.stats.atk, this.e.stats.def) * mult * (crit ? 1.5 : 1));
      const el = document.querySelector(`#b-trio .tr-mem[data-i="${i}"]`);
      this.after(() => {
        if (this.state !== 'run') return;
        replayAnim(el, 'sup-hop', 300);
        this.proj(FX.center(el.querySelector('.tr-sprite')), ec, { color: m.ch.def.colors.main, size: 13, frames: 18, arc: -90,
          onHit: () => { if (this.state === 'run') { this.hitEnemy(d, { crit, big: true, colors: [m.ch.def.colors.main, '#ffd43b', '#fff'] }); FX.ring(ec.x, ec.y, m.ch.def.colors.main, 120, 24, 6); } } });
      }, TEAM_CUT_MS + i * 260);
    });
    this.updateBars();
    this.renderParty();
  },

  // 2 階から 先: 難易度は 1 階で きめたので 聞かずに 始める
  dungeonAutoStart() {
    this.overlay(`<div class="ov-box">${dungeonBanner(this)}<div class="ov-title">${this.ed.floor + 1}階 ${this.ed.name}</div><div class="ov-sub">${this.ed.abilityDesc}</div></div>`);
    this.after(() => { if (this.state === 'ready') this.countdown(); }, 1400);
  },
  // 階と 階の 間で 脱出: ここまで 突破した 階の 報酬 (持ち帰り) を 全部 もらう
  dungeonEscape() {
    const dg = this.nextDungeon || this.dungeon;
    this.nextDungeon = null;
    this.dungeonEnd('escape', dg.pot, this.ed.floor + 1, '');
  },
  // ダンジョンの 終わり (脱出・全部 突破・全滅)。持ち帰りの 報酬を わたして 結果を 出す
  dungeonEnd(kind, pot, floorsDone, lines) {
    const d = dungeonData(), bd = this.bd, dgd = dungeonDef(this.dungeon.dg), rec = dgRec(dgd.id);
    d.runs = (d.runs || 0) + 1;
    pot = pot || { coins: 0, shards: 0 };
    const rate = kind === 'wipe' ? DUNGEON_WIPE_KEEP : 1; // 全滅は 持ち帰りの 半分
    const coins = grantCoins(pot.coins * rate), shards = Math.round(pot.shards * rate);
    gachaData().shards += shards;
    Save.save();
    this.state = 'chend';
    SFX.select();
    const title = { escape: `${floorsDone}階まで突破して、脱出した！`, clear: '全部の階を突破した！', wipe: `${floorsDone + 1}階で全員倒れてしまった…` }[kind];
    this.overlay(`<div class="ov-box"><div class="ov-challenge">${dgd.icon} ${dgd.name}（${bd.name}）</div>
      <div class="ov-title">${title}</div>
      <div class="ov-sub">${lines ? lines + '<br>' : ''}🎒 持ち帰った報酬: 🪙 ${coins}・💎 ${shards}${kind === 'wipe' && pot.coins ? '（全滅したので半分）' : ''}
        <br>${bd.name}の最高記録: ${rec.best[this.dk] || 0} / ${dgd.floors.length}階</div>
      <div class="ov-key"><kbd>Space</kbd>でダンジョンの入口へ</div></div>`);
  },

  // 階の 終わり
  dungeonFinish(won) {
    this.leave(); this.state = 'chend';
    const dg = this.dungeon, f = this.ed.floor, dk = this.dk, bd = this.bd, dgd = dungeonDef(dg.dg), floors = dgd.floors;
    this.stash(this.party[this.pi]); this.party[this.pi].hp = Math.max(0, this.p.hp);
    const secs = Math.max(1, this.elapsed / 1000);
    const ids = this.party.map(m => m.id);
    // 経験値: それぞれ 打った 分 + 突破すると 0.4 レベル分
    const lines = this.party.map(m => {
      const exp = Math.round(typingExp(m.keys, 0, secs, 0.3, m.ch.L) + (won ? levelNeed(m.ch.L) * 0.4 : 0));
      grantExp(m.id, exp);
      if (won && m.hp > 0) masteryAdd(m.id, 'wins');
      masteryCheck(m.id);
      return `${m.ch.name} EXP+${exp}`;
    }).join('　');
    Save.data.totals.keys += this.correct;
    const rec = dgRec(dgd.id);
    const pot = { ...(dg.pot || { coins: 0, shards: 0 }) };
    let rw = '';
    if (won) {
      Save.data.totals.wins++;
      addBond(ids, 1 + (dk === 'adv' ? 1 : 0)); // 上級者は 絆が 2 倍
      // 持ち帰りの 報酬が ふえる (脱出か 全部 突破で もらえる)
      const r = floorPot(dgd, f);
      pot.coins += Math.round(r.coins * bd.reward); pot.shards += r.shards;
      // 初めて 突破した ごほうびは すぐ もらえる
      const cl = rec.clear[dk] = rec.clear[dk] || {};
      if (!cl[f]) { cl[f] = Date.now(); const fr = DUNGEON_REWARD(f); const c = grantCoins(fr.coins * bd.reward * dgd.reward); const sh = Math.round(fr.shards * dgd.reward); gachaData().shards += sh; rw = `<br>🎁 ${bd.name}で初めて突破: 🪙 ${c}・💎 ${sh}`; }
      rec.best[dk] = Math.max(rec.best[dk] || 0, f + 1);
    }
    const acc = this.correct + this.miss ? this.correct / (this.correct + this.miss) : 0;
    this.recordGrowth(won, secs, acc);
    Save.save();
    if (won && f + 1 < floors.length) {
      // 次の 階へ: HP を 持ちこして 少し 回復、倒れた キャラも 起きる
      const party = this.party.map(m => ({ id: m.id, hp: m.hp > 0 ? Math.min(1, m.hp / m.max + DUNGEON_HEAL) : DUNGEON_REVIVE, skill: (m.st && m.st.p_skill) || 0 }));
      this.nextDungeon = { dg: dg.dg, floor: f + 1, party, lead: this.pi, teamGauge: this.teamGauge, pot };
      this.state = 'between';
      const nf = floors[f + 1];
      this.overlay(`<div class="ov-box"><div class="ov-challenge">${dgd.icon} ${dgd.name} ${f + 1}階 突破！</div>
        <div class="ov-title">${this.ed.name}を倒した！</div>
        <div class="ov-sub">${lines}${rw}<br>🎒 持ち帰りの報酬: 🪙 ${pot.coins}・💎 ${pot.shards}（脱出か全部突破でもらえる。全滅すると半分）
          <br>次は ${f + 2}階: <b>${nf.name}</b>（Lv.${nf.lv}）　HPが${Math.round(DUNGEON_HEAL * 100)}%回復、倒れた仲間も起きる</div>
        <div class="set-actions"><button class="btn big dg-go">▶ 続ける <kbd>Space</kbd></button><button class="btn ghost dg-retire">🏃 脱出（報酬をもらう） <kbd>Esc</kbd></button></div></div>`);
      const o = $('#b-overlay');
      o.querySelector('.dg-go').onclick = () => this.dungeonNext();
      o.querySelector('.dg-retire').onclick = () => this.dungeonEscape();
      return;
    }
    this.dungeonEnd(won ? 'clear' : 'wipe', pot, won ? f + 1 : f, lines + rw);
  },
  dungeonNext() {
    const n = this.nextDungeon;
    if (!n) return;
    this.nextDungeon = null;
    SFX.select();
    this.enter({ enemy: dungeonDef(n.dg).floors[n.floor], dungeon: n });
  },
});

// ---------------- チームスキルの 演出 (ふつうの 必殺の カットインとは べつ) ----------------
// 3 体が それぞれの 色の 帯に のって ななめに すべりこみ、まん中に「TEAM SKILL」と 技の 名前、下に 発動中の 相性
const TEAM_CUT_MS = 1500;
function teamCutin(name, synNames, extra, members) {
  document.querySelectorAll('.team-cut').forEach(x => x.remove());
  const el = document.createElement('div');
  el.className = 'team-cut';
  el.innerHTML = `<div class="tc-flash"></div><div class="tc-rays"></div>
    <div class="tc-panels">${members.map((m, i) => `<div class="tc-panel" style="--c:${m.ch.def.colors.main};--d:${m.ch.def.colors.dark};--i:${i}">
      <div class="tc-sprite">${slimeSVG(m.id, m.ch.stage)}</div><div class="tc-name">${m.ch.name}</div></div>`).join('')}</div>
    <div class="tc-center"><div class="tc-label">TEAM SKILL</div><div class="tc-title">${name}</div>
      ${synNames.length ? `<div class="tc-syns">${synNames.map(n => `<span>${n}</span>`).join('')}</div>` : ''}
      ${extra.length ? `<div class="tc-extra">${extra.join('・')}</div>` : ''}</div>`;
  ($('#arena') || document.body).appendChild(el); // バトルの 場の 中だけ (お題の 欄は 見えた まま 打てる)
  // 音: 3 体ぶん の 音が 重なって 和音に なる
  [523, 659, 784].forEach((f, i) => SFX.tone(f, 0.35, { type: 'triangle', vol: 0.05, delay: 0.12 * i }));
  SFX.tone(1047, 0.6, { type: 'triangle', vol: 0.06, delay: 0.5, slide: 1568 });
  if (SFX.rankCut) setTimeout(() => SFX.rankCut(), 450);
  setTimeout(() => el.classList.add('out'), TEAM_CUT_MS + 300);
  setTimeout(() => el.remove(), TEAM_CUT_MS + 800);
}

// バトル前の 見出し
function dungeonBanner(b) {
  const syn = activeSynergies(b.party.map(m => m.id));
  const dgd = dungeonDef(b.dungeon.dg);
  return `<div class="ov-challenge">${dgd.icon} ${dgd.name} ${b.ed.floor + 1} / ${dgd.floors.length}階${syn.length ? `　相性: ${syn.map(s => s.name).join('・')}` : ''}${b.team.bond ? `　絆 攻撃+${Math.round(b.team.bond * 100)}%` : ''}</div>`;
}

// ---------------- ダンジョンの 入口 (パーティを えらぶ 画面) ----------------
Screens.dungeon = {
  enter() {
    $('#btn-dg-back').onclick = () => App.show('home');
    this.render();
  },
  toggle(id) {
    let p = dungeonParty();
    if (p.includes(id)) p = p.filter(x => x !== id);
    else if (p.length < 3) p.push(id);
    else { SFX.miss(); toast('パーティは3体まで。外すキャラを先に押してね', 2000); return; }
    Save.data.dungeonParty = p; Save.save(); SFX.select(); this.render();
  },
  render() {
    const party = dungeonParty(), dk = battleDiffKey(), bd = BATTLE_DIFFS[dk], d = dungeonData();
    const team = dungeonTeam(party), syn = activeSynergies(party);
    const owned = Object.keys(CHARACTERS).filter(hasChar);
    const diffSel = `<div class="ch-diff">難易度 ${BATTLE_DIFF_KEYS.map((k, i) => `<button class="${k === dk ? 'on' : ''}" data-k="${k}" style="--dc:${BATTLE_DIFFS[k].color}"><kbd>${i + 1}</kbd> ${BATTLE_DIFFS[k].name}</button>`).join('')}</div>`;
    $('#dg-desc').innerHTML = `仲間を3体えらんで、5階建てのダンジョンの巨大ボスに挑む　・　${diffSel}`;
    $('#dg-party').innerHTML = [0, 1, 2].map(i => {
      const id = party[i];
      if (!id) return `<div class="dg-slot empty"><kbd>${i + 1}</kbd><div class="dg-q">？</div><small>下からえらぶ</small></div>`;
      const c = charInfo(id);
      return `<button class="dg-slot" data-id="${id}"><kbd>${i + 1}</kbd><div class="sprite">${slimeSVG(id, c.stage)}</div><b>${c.name}</b><small>Lv.${c.L}・${c.def.type}・${roleGroup(id)}</small></button>`;
    }).join('');
    const bonds = pairsOf(party).map(([a, b]) => { const lv = bondLv(a, b), pts = bondPts(a, b), nx = BOND_STEPS[lv];
      return `<div class="dg-bond"><span>${CHARACTERS[a].names[0]} × ${CHARACTERS[b].names[0]}</span><b>絆 Lv.${lv}</b><small>${nx ? `${pts}/${nx}pt` : 'MAX'}</small></div>`; }).join('');
    $('#dg-info').innerHTML = `
      <div class="dg-h">相性 <b class="dg-syncount">${syn.length}個 発動中</b> <small>（タイプ・役割・育ち方の組み合わせ。条件に合うものは全部重なる）</small></div>
      <div class="dg-syns">${[...TEAM_SYNERGIES].sort((a, b) => syn.includes(b) - syn.includes(a)).map(s => `<div class="dg-syn ${syn.includes(s) ? 'on' : ''}"><b>${s.name}</b><span>${s.desc}</span><small>${effText(s.eff)}</small></div>`).join('')}</div>
      <div class="dg-h">絆 <small>（同じパーティで階を突破すると深まる。1 Lvにつき攻撃+${BOND_ATK * 100}%）</small></div>
      <div class="dg-bonds">${bonds || '<small>3体えらぶと出る</small>'}</div>
      <div class="dg-h">このパーティの効果</div>
      <div class="dg-team">${party.length ? `攻撃 +${Math.round((team.atk + team.bond) * 100)}%・受けるダメージ -${Math.round(team.cut * 100)}%・会心率 +${Math.round(team.crit * 100)}%・必殺ゲージ +${Math.round(team.charge * 100)}%・HP +${Math.round(team.hp * 100)}%` : '—'}</div>`;
    // ダンジョンの 切りかえ (Tab / ボタン)。まだ 開いて いない ものは 開き方を 出す
    const dgd = this.cur(), rec = dgRec(dgd.id);
    $('#dg-tabs').innerHTML = DUNGEONS.map(x => { const open = dungeonOpen(x);
      return `<button class="dg-tab ${x.id === dgd.id ? 'on' : ''} ${open ? '' : 'locked'}" data-id="${x.id}" title="${open ? '' : `「${dungeonDef(x.unlock).name}」を全部突破すると開く`}">${open ? x.icon : '🔒'} ${x.name}</button>`; }).join('') + '<small><kbd>Tab</kbd> 切りかえ</small>';
    $('#dg-tabs').querySelectorAll('.dg-tab').forEach(b => { b.onclick = () => this.pick(b.dataset.id); });
    $('#dg-floors').innerHTML = dgd.floors.map(f => {
      const cl = (rec.clear[dk] || {})[f.floor], fr = DUNGEON_REWARD(f.floor), pot = floorPot(dgd, f.floor);
      return `<div class="dg-floor ${cl ? 'clear' : ''}"><div class="dg-fsprite">${enemySVG(f.id)}</div><div><b>${f.floor + 1}階 ${f.name}</b><small>Lv.${f.lv}・${f.abilityDesc}</small>
        <small>🎒 持ち帰り +🪙${Math.round(pot.coins * bd.reward)}・💎${pot.shards}${cl ? '　✔ 突破' : `　初めて突破: 🪙 ${Math.round(fr.coins * bd.reward * dgd.reward)}・💎 ${Math.round(fr.shards * dgd.reward)}`}</small></div></div>`;
    }).join('');
    $('#dg-chars').innerHTML = owned.map(id => {
      const c = charInfo(id), on = party.includes(id);
      return `<button class="dg-char ${on ? 'on' : ''}" data-id="${id}" title="${c.name} Lv.${c.L}・${c.def.type}"><div class="sprite">${slimeSVG(id, c.stage)}</div><small>${c.def.type}・${roleGroup(id)}</small>${on ? `<i>${party.indexOf(id) + 1}</i>` : ''}</button>`;
    }).join('');
    $('#dg-start').innerHTML = `<kbd>Space</kbd> ${party.length === 3 ? `1階から挑む（${bd.name}）` : `あと${3 - party.length}体えらぶ`}`;
    $('#dg-start').classList.toggle('disabled', party.length < 3);
    $('#dg-best').textContent = `最高記録（${bd.name}）: ${rec.best[dk] || 0} / ${dgd.floors.length}階`;
    $('#dg-start').classList.toggle('disabled', party.length < 3 || !dungeonOpen(dgd));
    if (!dungeonOpen(dgd)) $('#dg-start').innerHTML = `🔒「${dungeonDef(dgd.unlock).name}」を全部突破すると開く`;
    $('#dg-chars').querySelectorAll('.dg-char').forEach(b => { b.onclick = () => this.toggle(b.dataset.id); });
    $('#dg-party').querySelectorAll('.dg-slot[data-id]').forEach(b => { b.onclick = () => this.toggle(b.dataset.id); });
    $('#dg-desc').querySelectorAll('.ch-diff button').forEach(b => { b.onclick = () => { setBattleDiff(b.dataset.k); this.render(); }; });
    $('#dg-start').onclick = () => this.start();
  },
  // 今 えらんで いる ダンジョン
  cur() { return dungeonDef(Save.data.dungeonSel); },
  pick(id) {
    const x = dungeonDef(id);
    if (!dungeonOpen(x)) { SFX.miss(); toast(`「${dungeonDef(x.unlock).name}」を全部突破すると開く`, 2000); return; }
    Save.data.dungeonSel = x.id; Save.save(); SFX.select(); this.render();
  },
  start() {
    const party = dungeonParty(), dgd = this.cur();
    if (!dungeonOpen(dgd)) { SFX.miss(); return; }
    if (party.length < 3) { SFX.miss(); toast('仲間を3体えらんでね', 1800); return; }
    SFX.select();
    App.show('battle', { enemy: dgd.floors[0], dungeon: { dg: dgd.id, floor: 0, party: party.map(id => ({ id })), lead: 0, pot: { coins: 0, shards: 0 } } });
  },
  onKey(e) {
    if (e.key === 'Escape') App.show('home');
    if (e.key === ' ' || e.key === 'Enter') this.start();
    if (e.key === 'Tab') { e.preventDefault(); const i = DUNGEONS.indexOf(this.cur()); for (let k = 1; k <= DUNGEONS.length; k++) { const x = DUNGEONS[(i + k) % DUNGEONS.length]; if (dungeonOpen(x)) { this.pick(x.id); break; } } }
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= BATTLE_DIFF_KEYS.length) { setBattleDiff(BATTLE_DIFF_KEYS[n - 1]); this.render(); }
  },
};
