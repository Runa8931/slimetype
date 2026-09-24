// ============================================================
//  キャラクター・敵・成長の計算式
//  経験値テーブル/能力値/ダメージ式はポケモンの公式(第3世代以降)を
//  このゲーム向けに簡略化したもの
// ============================================================

const MAX_LV = 99;
const BATTLE_HP_SCALE = 3;       // バトルを長めに楽しめるよう HP を 3 倍にする
const ENEMY_HP_SCALE = 3.6;      // 敵はさらに少し多め

// 必要経験値: Lv^3 の 0.5 倍 (Lv20 = 4000, Lv50 = 62500, Lv99 = 約48万)
function expForLevel(L) { return L <= 1 ? 0 : Math.floor(0.5 * L * L * L); }

function levelFromExp(exp) {
  let L = 1;
  while (L < MAX_LV && exp >= expForLevel(L + 1)) L++;
  return L;
}

// 能力値: HP = 2×種族値×Lv/100 + Lv + 10,  その他 = 2×種族値×Lv/100 + 5
function calcStats(base, L) {
  const f = b => Math.floor((2 * b * L) / 100);
  return { hp: f(base.hp) + L + 10, atk: f(base.atk) + 5, def: f(base.def) + 5, spd: f(base.spd) + 5 };
}

// ダメージ: ((2×Lv/5 + 2) × 威力 × 攻撃/防御) / 50 + 2
function calcDamage(L, power, atk, def) {
  return ((2 * L / 5 + 2) * power * atk / def) / 50 + 2;
}

// レベル差による経験値の倍率 (ポケモン第 5 世代の式を もっと きびしくしたもの)
//   ((2×敵Lv + 10) / (敵Lv + 自分Lv + 10)) ^ 6
//   格下をたおすと 大きく へり、格上をたおすと ふえる (最大 1.5 倍)
function levelGapMult(enemyLv, playerLv) {
  const m = Math.pow((2 * enemyLv + 10) / (enemyLv + playerLv + 10), 6);
  return Math.min(1.5, m);
}

// 1 お題あたりの攻撃の威力: 打ったキー数が多いほど強い
function wordPower(keys) { return 10 + keys * 6; }

// 進化: Lv20・40・60・80 で 1 段階ずつ (全 5 段階)
const EVO_LEVELS = [20, 40, 60, 80];
function evoStage(L) { return EVO_LEVELS.filter(x => L >= x).length; }

const CHARACTERS = {
  purun: {
    id: 'purun',
    names: ['ぷるん', 'ぷるるん', 'キングぷるん', 'アクアロード', 'ポセイドぷるん'],
    type: 'みず',
    role: 'バランス型',
    colors: { main: '#4fb3ff', light: '#b5e3ff', dark: '#1f6fc4', accent: '#7cf0ff' },
    // 進化段階ごとの体の色
    stageColors: [
      { main: '#4fb3ff', light: '#b5e3ff', dark: '#1f6fc4', accent: '#7cf0ff' },
      { main: '#2fd0c8', light: '#c2fff6', dark: '#0f8a8f', accent: '#9bfff0' },
      { main: '#5a6dff', light: '#cfd6ff', dark: '#2a2fa8', accent: '#ffe27a' },
      { main: '#1098ad', light: '#99e9f2', dark: '#0b5563', accent: '#ffffff' },
      { main: '#3b5bdb', light: '#e7f5ff', dark: '#1c2c80', accent: '#ffd43b' },
    ],
    base: { hp: 75, atk: 80, def: 65, spd: 65 },
    desc: 'どこにでもいる、ぷるぷるのみずスライム。なんでもそつなくこなす。',
    // 進化段階ごとの とくせい・ひっさつ (数値はバトルで使う)
    forms: [
      {
        trait: { name: 'うるおいボディ', desc: 'ノーミスでお題を打ち切ると HP が 3% 回復する', heal: 0.03, statusCut: 0 },
        skill: { name: 'アクアヒール', desc: 'HP を 35% 回復し、どく・やけどを消す。次の攻撃が 1.5 倍', heal: 0.35, boost: 1.5, barrier: 0, charge: 1 },
      },
      {
        trait: { name: 'うるおいボディ+', desc: 'ノーミスで HP 3.5% 回復。どく・やけどの時間が半分', heal: 0.035, statusCut: 0.5 },
        skill: { name: 'アクアヒール+', desc: 'HP を 40% 回復して状態異常を消す。次の攻撃が 1.8 倍。ゲージ +10%', heal: 0.4, boost: 1.8, barrier: 0, charge: 1.1 },
      },
      {
        trait: { name: 'キングのうるおい', desc: 'ノーミスで HP 4% 回復。どく・やけど・こおりが きかない', heal: 0.04, statusCut: 1 },
        skill: { name: 'ロイヤルアクア', desc: 'HP を 42% 回復。次の攻撃が 2.2 倍。水のバリアで 1 回ふせぐ。ゲージ +15%', heal: 0.42, boost: 2.2, barrier: 1, charge: 1.15 },
      },
      {
        trait: { name: 'しおさいのめぐみ', desc: 'ノーミスで HP 4.5% 回復。状態異常が きかない', heal: 0.045, statusCut: 1 },
        skill: { name: 'タイダルウェーブ', desc: 'HP を 44% 回復。次の攻撃が 2.5 倍。バリア 1 回。ゲージ +25%', heal: 0.44, boost: 2.5, barrier: 1, charge: 1.25 },
      },
      {
        trait: { name: 'うみのかみ', desc: 'ノーミスで HP 6% 回復。状態異常が きかない', heal: 0.06, statusCut: 1 },
        skill: { name: 'リヴァイアサン', desc: 'HP を 46% 回復。次の攻撃が 2.8 倍。バリア 2 回。ゲージ +30%', heal: 0.46, boost: 2.8, barrier: 2, charge: 1.3 },
      },
    ],
  },
  piriri: {
    id: 'piriri',
    names: ['ぴりり', 'ぴりりん', 'ライジンぴりり', 'サンダーロード', 'ゼウスぴりり'],
    type: 'でんき',
    role: 'スピード型',
    colors: { main: '#ffd23f', light: '#fff2a8', dark: '#d99a00', accent: '#fff' },
    stageColors: [
      { main: '#ffd23f', light: '#fff2a8', dark: '#d99a00', accent: '#fff' },
      { main: '#ffa62b', light: '#ffe2a8', dark: '#c45f00', accent: '#fff6a0' },
      { main: '#fff27a', light: '#ffffff', dark: '#d9a800', accent: '#7cf0ff' },
      { main: '#9775fa', light: '#e5dbff', dark: '#5f3dc4', accent: '#fff27a' },
      { main: '#fcc419', light: '#ffffff', dark: '#e67700', accent: '#74c0fc' },
    ],
    base: { hp: 70, atk: 85, def: 55, spd: 95 },
    desc: 'いつもビリビリしているかみなりスライム。打つのが速いほど強くなる。',
    forms: [
      {
        trait: { name: 'でんこうせっか', desc: 'お題を速く打ち切るほど会心率アップ (最大 55%・会心 1.5 倍)', critMax: 0.55, critMult: 1.5, dodge: 0, shockImmune: false },
        skill: { name: 'サンダーボルト', desc: '威力 300 のかみなりを落とす', power: 300, resetGauge: false, charge: 1 },
      },
      {
        trait: { name: 'でんこうせっか+', desc: '会心率 最大 62%・会心 1.6 倍。10% の確率で攻撃をよける', critMax: 0.62, critMult: 1.6, dodge: 0.1, shockImmune: false },
        skill: { name: 'ギガボルト', desc: '威力 420 の大いなずま。ゲージ +5%', power: 420, resetGauge: false, charge: 1.05 },
      },
      {
        trait: { name: 'ライジン', desc: '会心率 最大 68%・会心 1.7 倍。20% でよける。しびれが きかない', critMax: 0.68, critMult: 1.7, dodge: 0.2, shockImmune: true },
        skill: { name: 'ライジンサンダー', desc: '威力 540。敵の攻撃ゲージを 0 にもどす。ゲージ +10%', power: 540, resetGauge: true, charge: 1.1 },
      },
      {
        trait: { name: 'らいめいのはやさ', desc: '会心率 最大 72%・会心 1.8 倍。25% でよける。しびれが きかない', critMax: 0.72, critMult: 1.8, dodge: 0.25, shockImmune: true },
        skill: { name: 'ボルテックス', desc: '威力 640。攻撃ゲージを 0 に。ゲージ +15%', power: 640, resetGauge: true, charge: 1.15 },
      },
      {
        trait: { name: 'かみなりのかみ', desc: '会心率 最大 76%・会心 1.9 倍。30% でよける。しびれが きかない', critMax: 0.76, critMult: 1.9, dodge: 0.3, shockImmune: true },
        skill: { name: 'ゼウスのいかずち', desc: '威力 760。攻撃ゲージを 0 に。ゲージ +20%', power: 760, resetGauge: true, charge: 1.2 },
      },
    ],
  },
  gotsun: {
    id: 'gotsun',
    names: ['ごつん', 'ごつごつん', 'ガンセキごつん', 'ダイヤごつん', 'タイタンごつん'],
    type: 'いわ',
    role: 'ぼうぎょ型',
    colors: { main: '#b08a64', light: '#dcc3a3', dark: '#6e5238', accent: '#9be7a0' },
    stageColors: [
      { main: '#b08a64', light: '#dcc3a3', dark: '#6e5238', accent: '#9be7a0' },
      { main: '#8f959e', light: '#d6dae0', dark: '#50565e', accent: '#8fe08a' },
      { main: '#5b5f78', light: '#a4aac6', dark: '#2b2e42', accent: '#c58bff' },
      { main: '#a5d8ff', light: '#ffffff', dark: '#4c6ef5', accent: '#e599f7' },
      { main: '#495057', light: '#adb5bd', dark: '#212529', accent: '#ffd43b' },
    ],
    base: { hp: 90, atk: 60, def: 80, spd: 45 },
    desc: 'かたくて重たいいわスライム。のんびりやだけど、とにかくタフ。',
    forms: [
      {
        trait: { name: 'かたいからだ', desc: '受けるダメージ 15% カット。ミスしてもコンボが半分残る。どく・やけどの時間が 4 わり短い', cut: 0.15, comboKeep: 0.5, freezeImmune: false },
        skill: { name: 'ロックシールド', desc: '敵の攻撃を 2 回ふせぎ、そのたびに威力 80 の岩で反撃', guards: 2, power: 80, heal: 0, charge: 1 },
      },
      {
        trait: { name: 'がんじょうボディ', desc: '受けるダメージ 16% カット。ミスしてもコンボが 6 わり残る。どく・やけどの時間が 4 わり短い', cut: 0.16, comboKeep: 0.6, freezeImmune: false },
        skill: { name: 'ロックシールド+', desc: '2 回ふせぎ、威力 110 で反撃。ふせぐたびに HP 2% 回復', guards: 2, power: 110, heal: 0.02, charge: 1 },
      },
      {
        trait: { name: 'ガンセキのよろい', desc: '受けるダメージ 17% カット。コンボが 7 わり残る。こおり・やけどが きかない', cut: 0.17, comboKeep: 0.7, freezeImmune: true },
        skill: { name: 'ガンセキとりで', desc: '2 回ふせぎ、威力 140 で反撃。ふせぐたびに HP 3% 回復', guards: 2, power: 140, heal: 0.03, charge: 1 },
      },
      {
        trait: { name: 'ダイヤのからだ', desc: '受けるダメージ 17% カット。コンボが 8 わり残る。こおり・やけどが きかない', cut: 0.17, comboKeep: 0.8, freezeImmune: true },
        skill: { name: 'ダイヤモンドウォール', desc: '2 回ふせぎ、威力 160 で反撃。ふせぐたびに HP 3% 回復', guards: 2, power: 160, heal: 0.03, charge: 1 },
      },
      {
        trait: { name: 'きょじんのちから', desc: '受けるダメージ 18% カット。コンボが 9 わり残る。こおり・やけどが きかない', cut: 0.18, comboKeep: 0.9, freezeImmune: true },
        skill: { name: 'タイタンフォートレス', desc: '2 回ふせぎ、威力 180 で反撃。ふせぐたびに HP 4% 回復', guards: 2, power: 180, heal: 0.04, charge: 1 },
      },
    ],
  },
  homura: {
    id: 'homura',
    names: ['ほむら', 'ほむらん', 'フレイムほむら', 'インフェルノ', 'フェニックスほむら'],
    type: 'ほのお',
    role: 'こうげき型',
    colors: { main: '#ff6b35', light: '#ffd8a8', dark: '#c92a2a', accent: '#ffe066' },
    stageColors: [
      { main: '#ff6b35', light: '#ffd8a8', dark: '#c92a2a', accent: '#ffe066' },
      { main: '#ff922b', light: '#ffe8cc', dark: '#d9480f', accent: '#fff3bf' },
      { main: '#f03e3e', light: '#ffc9c9', dark: '#862e2e', accent: '#ffd43b' },
      { main: '#e8590c', light: '#ffec99', dark: '#5c1a00', accent: '#ff8787' },
      { main: '#fab005', light: '#fff9db', dark: '#c92a2a', accent: '#ff6b6b' },
    ],
    base: { hp: 78, atk: 98, def: 64, spd: 75 },
    desc: 'あつい心の ほのおスライム。コンボが つづくほど 手がつけられなくなる。',
    forms: [
      {
        trait: { name: 'ねっけつ', desc: 'コンボ倍率の上限が 1.7 倍に上がる (ふつうは 1.5 倍)。やけどが きかない', burnImmune: true, statusCut: 0, comboMax: 140 },
        skill: { name: 'ファイアブレス', desc: '威力 220 のほのお。敵を 5 秒間 やけど (毎秒 HP 3% ダメージ)', power: 220, burn: 5, charge: 1 },
      },
      {
        trait: { name: 'ねっけつ+', desc: 'コンボ倍率の上限が 1.8 倍。やけどが きかない', burnImmune: true, statusCut: 0, comboMax: 160 },
        skill: { name: 'フレイムバースト', desc: '威力 300。敵を 6 秒間 やけど。ゲージ +5%', power: 300, burn: 6, charge: 1.05 },
      },
      {
        trait: { name: 'もえあがる魂', desc: 'コンボ倍率の上限が 1.9 倍。やけどが きかない。どくの時間が半分', burnImmune: true, statusCut: 0.5, comboMax: 180 },
        skill: { name: 'ボルケーノ', desc: '威力 380。敵を 7 秒間 やけど。ゲージ +10%', power: 380, burn: 7, charge: 1.1 },
      },
      {
        trait: { name: 'ごうか', desc: 'コンボ倍率の上限が 2.0 倍。やけどが きかない。どくの時間が半分', burnImmune: true, statusCut: 0.5, comboMax: 200 },
        skill: { name: 'インフェルノ', desc: '威力 460。敵を 8 秒間 やけど。ゲージ +15%', power: 460, burn: 8, charge: 1.15 },
      },
      {
        trait: { name: 'ふしちょう', desc: 'コンボ倍率の上限が 2.1 倍。やけど・どくが きかない', burnImmune: true, statusCut: 1, comboMax: 220 },
        skill: { name: 'フェニックスフレア', desc: '威力 540。敵を 9 秒間 やけど。ゲージ +20%', power: 540, burn: 9, charge: 1.2 },
      },
    ],
  },
  moririn: {
    id: 'moririn',
    names: ['もりりん', 'もりもりん', 'ジャングルもりりん', 'せいれいもりりん', 'ユグドラもりりん'],
    type: 'くさ',
    role: 'かいふく型',
    colors: { main: '#51cf66', light: '#d3f9d8', dark: '#2b8a3e', accent: '#ffd43b' },
    stageColors: [
      { main: '#51cf66', light: '#d3f9d8', dark: '#2b8a3e', accent: '#ffd43b' },
      { main: '#40c057', light: '#ebfbee', dark: '#1b5e20', accent: '#ff8fab' },
      { main: '#2f9e44', light: '#b2f2bb', dark: '#0b3d16', accent: '#ffe066' },
      { main: '#20c997', light: '#c3fae8', dark: '#087f5b', accent: '#fff3bf' },
      { main: '#94d82d', light: '#f4fce3', dark: '#2b8a3e', accent: '#ffd43b' },
    ],
    base: { hp: 85, atk: 70, def: 72, spd: 60 },
    desc: 'もりに すむ くさスライム。ひなたぼっこで いつのまにか 元気になる。',
    forms: [
      {
        trait: { name: 'こうごうせい', desc: '3 秒ごとに HP が 1% 回復する', regen: 0.01, statusCut: 0 },
        skill: { name: 'やどりぎのタネ', desc: '威力 160 で攻撃し、自分の HP を 20% 回復', power: 160, heal: 0.2, charge: 1 },
      },
      {
        trait: { name: 'こうごうせい+', desc: '3 秒ごとに HP が 1.2% 回復。どく・やけどの時間が半分', regen: 0.012, statusCut: 0.5 },
        skill: { name: 'ギガドレイン', desc: '威力 220 で攻撃し、HP を 22% 回復', power: 220, heal: 0.22, charge: 1.05 },
      },
      {
        trait: { name: 'もりのめぐみ', desc: '3 秒ごとに HP が 1.4% 回復。どく・やけど・こおりが きかない', regen: 0.014, statusCut: 1 },
        skill: { name: 'ジャングルドレイン', desc: '威力 280 で攻撃し、HP を 24% 回復。ゲージ +10%', power: 280, heal: 0.24, charge: 1.1 },
      },
      {
        trait: { name: 'せいれいのいぶき', desc: '3 秒ごとに HP が 1.6% 回復。状態異常が きかない', regen: 0.016, statusCut: 1 },
        skill: { name: 'せいれいのしずく', desc: '威力 340 で攻撃し、HP を 26% 回復。ゲージ +15%', power: 340, heal: 0.26, charge: 1.15 },
      },
      {
        trait: { name: 'せかいじゅ', desc: '3 秒ごとに HP が 1.8% 回復。状態異常が きかない', regen: 0.018, statusCut: 1 },
        skill: { name: 'ユグドラシル', desc: '威力 400 で攻撃し、HP を 28% 回復。ゲージ +20%', power: 400, heal: 0.28, charge: 1.2 },
      },
    ],
  },
  kagemaru: {
    id: 'kagemaru',
    names: ['かげまる', 'かげまるん', 'シャドウかげまる', 'ナイトメア', 'ダークロードかげまる'],
    type: 'かげ',
    role: 'テクニック型',
    colors: { main: '#7048e8', light: '#d0bfff', dark: '#2b1a4a', accent: '#ff6b6b' },
    stageColors: [
      { main: '#7048e8', light: '#d0bfff', dark: '#2b1a4a', accent: '#ff6b6b' },
      { main: '#5f3dc4', light: '#b197fc', dark: '#1a0f3a', accent: '#ffd43b' },
      { main: '#495057', light: '#adb5bd', dark: '#101113', accent: '#e599f7' },
      { main: '#343a40', light: '#9775fa', dark: '#000000', accent: '#ff006e' },
      { main: '#3b1f6b', light: '#e5dbff', dark: '#10002b', accent: '#ffd43b' },
    ],
    base: { hp: 84, atk: 84, def: 66, spd: 85 },
    desc: 'かげに かくれる にんじゃスライム。正確に打つほど 敵の動きを にぶらせる。',
    forms: [
      {
        trait: { name: 'かげぬい', desc: 'かげで 敵の足をしばり、敵の攻撃が 12% おそくなる', slow: 0.12 },
        skill: { name: 'シャドウバインド', desc: '威力 150 で攻撃し、敵の攻撃ゲージを 4 秒間 とめる。ゲージ +10%', power: 150, bind: 4, charge: 1.1 },
      },
      {
        trait: { name: 'かげぬい+', desc: 'かげで 敵の足をしばり、敵の攻撃が 15% おそくなる', slow: 0.15 },
        skill: { name: 'かげしばり', desc: '威力 210。敵を 4.5 秒間 とめる。ゲージ +15%', power: 210, bind: 4.5, charge: 1.15 },
      },
      {
        trait: { name: 'やみのしのび', desc: 'かげで 敵の足をしばり、敵の攻撃が 18% おそくなる', slow: 0.18 },
        skill: { name: 'シャドウロック', desc: '威力 270。敵を 5 秒間 とめる。ゲージ +20%', power: 270, bind: 5, charge: 1.2 },
      },
      {
        trait: { name: 'あくむ', desc: 'かげで 敵の足をしばり、敵の攻撃が 21% おそくなる', slow: 0.21 },
        skill: { name: 'ナイトメアバインド', desc: '威力 330。敵を 5.5 秒間 とめる。ゲージ +25%', power: 330, bind: 5.5, charge: 1.25 },
      },
      {
        trait: { name: 'やみのおう', desc: 'かげで 敵の足をしばり、敵の攻撃が 24% おそくなる', slow: 0.24 },
        skill: { name: 'ダークエンド', desc: '威力 390。敵を 6 秒間 とめる。ゲージ +30%', power: 390, bind: 6, charge: 1.3 },
      },
    ],
  },
};

// 昔の書き方 (def.trait / def.skill) でも最初の形を読めるようにしておく
for (const c of Object.values(CHARACTERS)) { c.trait = c.forms[0].trait; c.skill = c.forms[0].skill; }

// ============================================================
//  ワールドと敵
//  1 ワールド 6 体 (最後の 1 体がボス)。レベル・経験値は順番から自動で決める
// ============================================================

// 敵の体つき (種族値のもと)
const ENEMY_TYPES = {
  normal: { hp: 70, atk: 80, def: 70 },
  fast: { hp: 58, atk: 85, def: 58 },
  tank: { hp: 88, atk: 75, def: 90 },
  boss: { hp: 125, atk: 100, def: 95 },
};

// 攻撃の威力 (ステージごとの強さ。勝率の計算で決めた値)
// (敵と同じレベル・1 分 220 打鍵で、ふつうの敵は勝率 8〜9 わり、ボスは 6〜7 わり になるよう計算で決めた)
const ENEMY_POWER = {
  bat: 123, mush: 75, ghost: 93, goblin: 80, golem: 67, dragon: 65,
  pbat: 34, frog: 86, bee: 30, swampmush: 98, zombie: 93, hydra: 20,
  scorpion: 46, cactus: 115, snake: 87, mummy: 107, dgoblin: 84, sphinx: 64,
  crab: 107, jelly: 72, puffer: 64, shark: 86, pirate: 91, kraken: 49,
  gummy: 102, lolli: 74, cake: 128, mallow: 104, chocogolem: 100, pudding: 64,
  snail: 118, kappa: 105, rainfrog: 83, rainmush: 128, tbat: 86, raijin: 38,
  robot: 96, drone: 79, bomb: 97, mgoblin: 97, geargolem: 141, mechadragon: 60,
  penguin: 128, snowman: 100, yukionna: 111, wolf: 108, icegolem: 119, yeti: 89,
  skybird: 102, cloud: 109, wbat: 95, skygolem: 123, wyvern: 126, skydragon: 89,
  alien: 126, ufo: 96, meteor: 160, star: 96, galaxyrobo: 146, alienking: 81,
  imp: 102, hellhound: 104, mgolem: 156, darkknight: 144, salamander: 130, demon: 105,
};

// E(id, 名前, 体つき, 攻撃間隔ms, 特殊能力, 能力の説明, 敵の説明, その他)
const E = (id, name, type, interval, ability, abilityDesc, desc, extra = {}) => ({ id, name, type, interval, ability, abilityDesc, desc, ...extra });

const WORLD_DEFS = [
  { id: 'grass', name: 'そうげん', diff: 'normal', enemies: [
    E('bat', 'コウモリン', 'fast', 4200, null, 'とくになし', 'どうくつにすむ小さなコウモリ。最初の相手にぴったり。', { diff: 'easy', bg: 'cave' }),
    E('mush', 'ドクキノコ', 'normal', 4800, 'poison', 'どく: 攻撃をうけると 5 秒間 HP がへりつづける', 'もりのどくキノコ。攻撃をうけると、どくになってしまう。', { diff: 'easy', bg: 'forest' }),
    E('ghost', 'ユウレイン', 'fast', 4200, 'fade', 'ゆうれいのきり: ときどきローマ字ガイドが見えなくなる', 'ぼちをさまようおばけ。ローマ字のガイドをかくしてくる。', { bg: 'grave' }),
    E('goblin', 'ゴブリン', 'normal', 4600, 'rage', 'げきど: HP が半分をきると攻撃が速くなる', 'こんぼうをふりまわす らんぼうもの。追いつめるとおこりだす。', { bg: 'plain' }),
    E('golem', 'ストーンゴーレム', 'tank', 5600, 'armor', 'いしのよろい: コンボ 30 未満だとダメージ半減', 'いせきを守るいしのきょじん。とてもかたい。', { bg: 'ruins' }),
    E('dragon', 'ドラゴン', 'boss', 5400, 'dragon', 'ほんき: HP 半分で攻撃が速くなり、3 回に 1 回ほのおのブレス', 'そうげんの果てにすむ りゅう。HP が半分をきると本気をだす。', { bg: 'volcano' }),
  ] },
  { id: 'poison', name: 'どくぬま', diff: 'normal', enemies: [
    E('pbat', 'ドクコウモリ', 'fast', 4000, 'poison', 'どくのキバ: 攻撃をうけると どくになる', 'ぬまの上をとびまわる どくのコウモリ。'),
    E('frog', 'ドクガエル', 'normal', 4600, 'mud', 'ぬかるみ: 攻撃をうけると ガイドが泥で見えにくくなり、ゲージがへる', 'どろをとばしてくる カエル。'),
    E('bee', 'ドクバチ', 'fast', 3800, 'poison', 'どくばり: 攻撃をうけると どくになる', 'ぶんぶんうるさい どくのハチ。'),
    E('swampmush', 'ヌマダケ', 'normal', 5000, 'regen', 'ぬまのめぐみ: ときどき HP を回復する', 'ぬまにはえる むらさきのキノコ。'),
    E('zombie', 'ゾンビ', 'tank', 5400, 'regen', 'しぶとい: ときどき HP を回復する', 'なんどでも おきあがる ぬまのゾンビ。'),
    E('hydra', 'ヒュドラ', 'boss', 5600, ['hydra', 'poison'], 'みつくび: HP がへるたびに 1 回の攻撃回数がふえる。どくもある', 'みっつの首をもつ どくぬまの ぬし。'),
  ] },
  { id: 'desert', name: 'さばく', diff: 'normal', enemies: [
    E('scorpion', 'サソリン', 'fast', 4000, 'poison', 'どくばり: 攻撃をうけると どくになる', 'すなの中から とびだす サソリ。'),
    E('cactus', 'サボテンマン', 'tank', 5400, 'shell', 'トゲガード: ときどき 3 秒間 うけるダメージが大きくへる', 'トゲだらけの サボテン。'),
    E('snake', 'スナヘビ', 'fast', 4000, 'rage', 'しっぽ: HP が半分をきると 攻撃が速くなる', 'すなの上を すべるように すすむヘビ。'),
    E('mummy', 'ミイラン', 'normal', 5000, 'sandstorm', 'すなあらし: ときどき 漢字とかなが見えなくなる', 'ピラミッドから でてきた ミイラ。'),
    E('dgoblin', 'サバクゴブリン', 'normal', 4400, 'charge', 'ためこうげき: 3 回に 1 回、力をためた強い攻撃', 'さばくの とうぞく ゴブリン。'),
    E('sphinx', 'スフィンクス', 'boss', 5400, ['sandstorm', 'rage'], 'なぞのちから: すなあらしを おこし、HP 半分で攻撃が速くなる', 'ピラミッドを守る なぞの番人。'),
  ] },
  { id: 'sea', name: 'うみ', diff: 'hard', enemies: [
    E('crab', 'カニッパ', 'tank', 5200, 'shell', 'からにこもる: ときどき 3 秒間 うけるダメージが大きくへる', 'かたいこうらの大きなカニ。', { diff: 'normal' }),
    E('jelly', 'クラゲール', 'normal', 5000, 'shock', 'しびれ: ミスすると 自分が ダメージをうける', 'ビリビリするクラゲ。まちがえて さわると しびれる。'),
    E('puffer', 'フグリン', 'normal', 4800, 'shock', 'トゲトゲ: ミスすると 自分が ダメージをうける', 'おこると ふくらむ フグ。'),
    E('shark', 'サメキバ', 'fast', 4400, 'rage', 'ちのにおい: HP が半分をきると 攻撃が速くなる', 'うみのハンター。弱ってくると どうもうになる。'),
    E('pirate', 'ガイコツせんちょう', 'normal', 5000, 'charge', 'たいほう: 3 回に 1 回、力をためた強い攻撃', 'ゆうれいせんの せんちょう。'),
    E('kraken', 'クラーケン', 'boss', 5400, 'ink', 'すみはき: ときどき お題が すみで見えにくくなる。HP 半分から 2 れんぞく攻撃', 'しんかいの ぬし。すみを はいて じゃまをしてくる。'),
  ] },
  { id: 'candy', name: 'おかしのくに', diff: 'hard', enemies: [
    E('gummy', 'グミベア', 'normal', 4600, 'sweet', 'あまいゆうわく: ミスすると 敵の HP が回復する', 'ぷにぷにの グミのクマ。'),
    E('lolli', 'ペロペロン', 'fast', 4000, 'rage', 'あまのじゃく: HP が半分をきると 攻撃が速くなる', 'ぐるぐるうずまきの キャンディ。'),
    E('cake', 'ショートケーキン', 'normal', 5000, 'sweet', 'あまいゆうわく: ミスすると 敵の HP が回復する', 'いちごをのせた ケーキのモンスター。'),
    E('mallow', 'マシュマロおばけ', 'fast', 4400, 'fade', 'ふわふわ: ときどき ローマ字ガイドが見えなくなる', 'ふわふわの マシュマロの おばけ。'),
    E('chocogolem', 'チョコゴーレム', 'tank', 5600, 'armor', 'チョコのよろい: コンボ 30 未満だと ダメージ半減', 'チョコレートで できた きょじん。'),
    E('pudding', 'ジャイアントプリン', 'boss', 5600, ['sweet', 'charge'], 'あまいわな: ミスすると回復し、3 回に 1 回 ためこうげきをしてくる', 'おかしのくにの 女王さま。'),
  ] },
  { id: 'rain', name: 'あめのもり', diff: 'hard', enemies: [
    E('snail', 'カタツムリン', 'tank', 5600, 'shell', 'からにこもる: ときどき 3 秒間 うけるダメージが大きくへる', 'あめの日に でてくる カタツムリ。'),
    E('kappa', 'カッパ', 'normal', 4600, 'fade', 'みずしぶき: ときどき ローマ字ガイドが見えなくなる', 'かわにすむ いたずらもの。'),
    E('rainfrog', 'アマガエル', 'fast', 4200, 'mud', 'ぬかるみ: 攻撃をうけると ガイドが泥で見えにくくなり、ゲージがへる', 'あめが だいすきな カエル。'),
    E('rainmush', 'アメフラシダケ', 'normal', 5000, 'regen', 'あめのめぐみ: ときどき HP を回復する', 'あめを よぶ キノコ。'),
    E('tbat', 'イナズマコウモリ', 'fast', 4000, 'thunder', 'かみなりのよこく: ときどき落雷の予告。3 秒以内にお題を打ち切らないと大ダメージ', 'かみなりをまとう コウモリ。'),
    E('raijin', 'ライジン', 'boss', 5200, ['thunder', 'rage'], 'かみなりさま: 落雷の予告が多い。HP 半分で攻撃が速くなる', 'たいこを たたく かみなりの神。'),
  ] },
  { id: 'factory', name: 'きかいのこうじょう', diff: 'hard', enemies: [
    E('robot', 'ロボッタ', 'tank', 5400, 'armor', 'てっこう: コンボ 30 未満だと ダメージ半減', 'こうじょうを 見はる ロボット。'),
    E('drone', 'ドローン', 'fast', 3800, 'charge', 'レーザーためうち: 3 回に 1 回、力をためた強い攻撃', 'ぶーんと とびまわる ドローン。'),
    E('bomb', 'バクダンくん', 'normal', 4800, 'charge', 'ばくはつ: 3 回に 1 回、力をためた強い攻撃', 'いつ ばくはつするか わからない。'),
    E('mgoblin', 'メカゴブリン', 'normal', 4400, 'rage', 'オーバーヒート: HP が半分をきると 攻撃が速くなる', 'きかいの 体になった ゴブリン。'),
    E('geargolem', 'ギアゴーレム', 'tank', 5600, 'shell', 'ギアガード: ときどき 3 秒間 うけるダメージが大きくへる', 'はぐるまで うごく きょじん。'),
    E('mechadragon', 'メカドラゴン', 'boss', 5200, ['dragon', 'charge'], 'メカのほんき: HP 半分で速くなりブレス。ためこうげきもある', 'こうじょうで つくられた きかいの りゅう。'),
  ] },
  { id: 'snow', name: 'ゆきやま', diff: 'hard', enemies: [
    E('penguin', 'ペンギナイト', 'normal', 4800, 'shell', 'こおりのたて: ときどき 3 秒間 うけるダメージが大きくへる', 'たてと やりを もったペンギンの きし。'),
    E('snowman', 'ユキダルマン', 'tank', 5000, 'regen', 'ゆきだまり: ときどき HP を回復する', 'うごく ゆきだるま。ゆきを あつめて 回復する。'),
    E('yukionna', 'ユキオンナ', 'fast', 4400, 'freeze', 'つめたいいき: 攻撃をうけると 1 秒間 こおって入力できない', 'ゆきやまに あらわれる ゆうれい。'),
    E('wolf', 'アイスウルフ', 'fast', 4200, 'freeze', 'こおりのいき: 攻撃をうけると 1 秒間 こおって入力できない', 'こおりの いきを はく オオカミ。'),
    E('icegolem', 'アイスゴーレム', 'tank', 5600, 'armor', 'こおりのよろい: コンボ 30 未満だと ダメージ半減', 'こおりで できた きょじん。'),
    E('yeti', 'イエティ', 'boss', 5400, 'blizzard', 'ふぶき: ときどき 漢字とかなが見えなくなる。攻撃で こおらせてくる', 'ゆきやまの ぬし。ふぶきを よびおこす。'),
  ] },
  { id: 'sky', name: 'てんくう', diff: 'hard', enemies: [
    E('skybird', 'ソラドリ', 'fast', 3800, 'wind', 'かぜおこし: ときどき 風で文字がゆれる', 'くもの上を とぶ 鳥。'),
    E('cloud', 'カミナリグモ', 'normal', 4800, 'thunder', 'かみなりのよこく: 3 秒以内にお題を打ち切らないと 落雷', 'かみなりを よぶ くも。'),
    E('wbat', 'シロコウモリ', 'fast', 4000, 'rage', 'てんくうのキバ: HP が半分をきると 攻撃が速くなる', 'まっしろな コウモリ。'),
    E('skygolem', 'スカイゴーレム', 'tank', 5600, 'armor', 'ひかりのよろい: コンボ 30 未満だと ダメージ半減', 'そらの しろを 守る きょじん。'),
    E('wyvern', 'ワイバーン', 'normal', 4600, 'wind', 'はばたき: ときどき 風で文字がゆれる', 'そらを かける 小さな りゅう。'),
    E('skydragon', 'てんくうりゅう', 'boss', 5200, ['dragon', 'wind'], 'てんくうのおう: 風で文字をゆらし、HP 半分で速くなりブレス', 'くもの上の おうさま りゅう。'),
  ] },
  { id: 'space', name: 'うちゅう', diff: 'hard', enemies: [
    E('alien', 'エイリアン', 'normal', 4600, 'fade', 'テレパシー: ときどき ローマ字ガイドが見えなくなる', 'とおい ほしから きた うちゅうじん。'),
    E('ufo', 'ユーフォー', 'fast', 4000, 'charge', 'ビームためうち: 3 回に 1 回、力をためた強い攻撃', 'ふしぎな ひかりの のりもの。'),
    E('meteor', 'メテオン', 'tank', 5600, 'shell', 'いわのからだ: ときどき 3 秒間 うけるダメージが大きくへる', 'うちゅうを ただよう いんせき。'),
    E('star', 'スターン', 'fast', 4200, 'shock', 'ほしくず: ミスすると 自分が ダメージをうける', 'きらきら ひかる ほしの子。'),
    E('galaxyrobo', 'ギャラクシーロボ', 'tank', 5400, 'armor', 'うちゅうごうきん: コンボ 30 未満だと ダメージ半減', 'うちゅうせんを 守る ロボット。'),
    E('alienking', 'ギャラクシーキング', 'boss', 5200, ['fade', 'charge'], 'うちゅうのおう: ガイドを隠し、ためこうげきもしてくる', 'うちゅうじんたちの おうさま。'),
  ] },
  { id: 'magma', name: 'マグマのしろ', diff: 'hard', enemies: [
    E('imp', 'ファイアインプ', 'fast', 4400, 'poison', 'やけど: 攻撃をうけると 5 秒間 HP がへりつづける', 'しろを まもる ほのおの こあくま。', { statusName: 'やけど' }),
    E('hellhound', 'ヘルハウンド', 'fast', 4000, 'rage', 'じごくのキバ: HP が半分をきると 攻撃が速くなる', 'ほのおを はく じごくの いぬ。'),
    E('mgolem', 'マグマゴーレム', 'tank', 5600, 'armor', 'マグマのよろい: コンボ 30 未満だと ダメージ半減', 'ようがんで できた きょじん。とても かたい。'),
    E('darkknight', 'ダークナイト', 'normal', 4800, 'shell', 'やみのたて: ときどき 3 秒間 うけるダメージが大きくへる', 'まおうに つかえる やみの きし。'),
    E('salamander', 'サラマンダー', 'normal', 4600, 'fade', 'かげろう: ときどき ローマ字ガイドが ゆらめいて見えなくなる', 'ほのおを まとう トカゲ。'),
    E('demon', 'まおう', 'boss', 5600, 'demon', 'まおうのちから: HP 2/3 で やみ (ガイドが消える)、1/3 で 攻撃が速くなり ひっさつゲージをうばう', 'マグマのしろの あるじ。さいごの てき。', { final: true }),
  ] },
];

// ワールドの一覧
const WORLDS = WORLD_DEFS.map(w => ({ id: w.id, name: w.name }));

// 敵の一覧 (ステージ順)。レベル・経験値は 通し番号から決める
const ENEMIES = [];
WORLD_DEFS.forEach((w, wi) => {
  w.enemies.forEach((e, i) => {
    const g = ENEMIES.length;
    const boss = i === w.enemies.length - 1;
    const lv = e.final ? 99 : Math.round(2 + g * 1.46) + (boss ? 2 : 0);
    ENEMIES.push({
      ...e,
      world: wi,
      boss,
      lv,
      base: { ...ENEMY_TYPES[e.type] },
      power: 40,
      exp: Math.round((boss ? 1.4 : 1) * (240 + g * 15)),
      diff: e.diff || w.diff,
      bg: e.bg || w.id,
      abilities: [].concat(e.ability || []),
    });
  });
});
// 決めてある威力を反映
function applyEnemyPower() { for (const e of ENEMIES) if (ENEMY_POWER[e.id]) e.power = ENEMY_POWER[e.id]; }
applyEnemyPower();

// ワールド w のステージ番号 (ENEMIES の添字) の一覧
function worldStages(w) {
  const list = [];
  ENEMIES.forEach((e, i) => { if (e.world === w) list.push(i); });
  return list;
}

// 「1-3」のようなステージ番号
function stageLabel(i) {
  const e = ENEMIES[i];
  return `${e.world + 1}-${worldStages(e.world).indexOf(i) + 1}`;
}

// タイピングの成績評価 (e-typing のスコア式「WPM × 正確率^3」を参考に、ここでは WPM = 1 分あたりの打鍵数)
const RANKS = [
  { min: 0, name: 'E', label: 'スライムのたまご' },
  { min: 80, name: 'D', label: 'みならいスライム' },
  { min: 130, name: 'C', label: 'ぷるぷるスライム' },
  { min: 180, name: 'B', label: 'いっぱしスライム' },
  { min: 240, name: 'A', label: 'はやうちスライム' },
  { min: 310, name: 'S', label: 'スライムナイト' },
  { min: 400, name: 'SS', label: 'スライムマスター' },
  { min: 500, name: 'SSS', label: 'でんせつのスライム' },
];

function rankFor(score) {
  let r = RANKS[0];
  for (const x of RANKS) if (score >= x.min) r = x;
  return r;
}

if (typeof module !== 'undefined') {
  module.exports = { expForLevel, levelFromExp, calcStats, calcDamage, wordPower, evoStage, CHARACTERS, ENEMIES, ENEMY_POWER, applyEnemyPower, BATTLE_HP_SCALE, ENEMY_HP_SCALE, WORLDS, MAX_LV };
}
