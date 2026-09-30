// ============================================================
//  キャラクター・敵・成長の計算式
//  経験値テーブル/能力値/ダメージ式はポケモンの公式(第3世代以降)を
//  このゲーム向けに簡略化したもの
// ============================================================

const MAX_LV = 120; // うらの せかい (Lv101〜120) に あわせて 99 から 上げた
const BATTLE_HP_SCALE = 3;       // バトルを長めに楽しめるよう HP を 3 倍にする
const ENEMY_HP_SCALE = 3.6;      // 敵はさらに少し多め

// 必要経験値: Lv^3 の 0.5 倍 (Lv20 = 4000, Lv50 = 62500, Lv99 = 約48万)
function expForLevel(L) { return L <= 1 ? 0 : Math.floor(0.5 * L * L * L); }

// いまの レベルから 1 つ 上がるのに ひつような 経験値
function levelNeed(L) { return expForLevel(L + 1) - expForLevel(L); }

function levelFromExp(exp, cap = MAX_LV) {
  let L = 1;
  while (L < cap && exp >= expForLevel(L + 1)) L++;
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

// バトルの 難易度: どの 難易度でも 推奨レベル (= 敵の レベル) は おなじ。かわるのは 必要な タイピングの 速さだけ
//   k: 敵の 攻撃力 ×k、HP ×k^0.7、攻撃の 間かく ÷k^0.25
//   ramp: 上級者は さいしょ k×ramp から はじまり、ステージが すすむほど k まで 上がる (序盤は かてる・終盤は ぎりぎり)
//   推奨レベルで むいている 打鍵数なら: 1-1 は Lv1 でも かてる / 序盤 ふつうの 敵に 約 9 わり /
//   終盤 初心者・中級者は 約 8 わり、上級者は 約 5 わり (ぎりぎり)。計算で きめた
const BATTLE_LV_CAP = 124;
const BATTLE_DIFFS = {
  beg: { name: '初心者', k: 0.5, reward: 1, kpm: 100, color: '#69db7c', note: '1 分 100 打鍵くらい 向け' },
  mid: { name: '中級者', k: 0.9, reward: 1.3, kpm: 200, color: '#ffd43b', note: '1 分 200 打鍵くらい 向け' },
  adv: { name: '上級者', k: 1.65, ramp: 0.8, reward: 2, kpm: 350, color: '#ff6b6b', note: '1 分 350 打鍵くらい 向け' },
};
// その ステージ・難易度での 敵の 強さの 倍率
function diffK(bd, idx) {
  // かくしステージは その ワールドの ボスと おなじ すすみぐあい として あつかう
  const g = ENEMIES[idx] && ENEMIES[idx].hidden ? worldStages(ENEMIES[idx].host).slice(-1)[0] : idx;
  return bd.k * (bd.ramp ? bd.ramp + (1 - bd.ramp) * g / (MAIN_STAGES - 1) : 1);
}
// 敵の レベル (= 推奨レベル)。難易度では かわらない
function diffEnemyLv(e) { return e.lv; }
const BATTLE_DIFF_KEYS = Object.keys(BATTLE_DIFFS);

// レベル差による経験値の倍率 (ポケモン第 5 世代の式を もっと きびしくしたもの)
//   ((2×敵Lv + 10) / (敵Lv + 自分Lv + 10)) ^ 6
//   格下をたおすと 大きく へり、格上をたおすと ふえる (最大 1.5 倍)
//   さらに 格下は 2 レベル差から へりはじめ、7 レベル差 以上で ほぼ 0 (2% 以下) に なる
function levelGapMult(enemyLv, playerLv) {
  let m = Math.pow((2 * enemyLv + 10) / (enemyLv + playerLv + 10), 6);
  const gap = playerLv - enemyLv;
  if (gap > 1) m *= Math.max(0.02, 1 - (gap - 1) / 6);
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
    base: { hp: 72, atk: 77, def: 63, spd: 65 },
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
    base: { hp: 72, atk: 88, def: 57, spd: 95 },
    desc: 'いつもビリビリしているかみなりスライム。打つのが速いほど強くなる。',
    forms: [
      {
        trait: { name: 'でんこうせっか', desc: 'お題を速く打ち切るほど会心率アップ (最大 55%・会心 1.5 倍)', critMax: 0.55, critMult: 1.5, dodge: 0, shockImmune: false },
        skill: { name: 'サンダーボルト', desc: '威力 230 のかみなりを落とす', power: 230, resetGauge: false, charge: 1 },
      },
      {
        trait: { name: 'でんこうせっか+', desc: '会心率 最大 62%・会心 1.6 倍。10% の確率で攻撃をよける', critMax: 0.62, critMult: 1.6, dodge: 0.1, shockImmune: false },
        skill: { name: 'ギガボルト', desc: '威力 300 の大いなずま。ゲージ +5%', power: 300, resetGauge: false, charge: 1.05 },
      },
      {
        trait: { name: 'ライジン', desc: '会心率 最大 68%・会心 1.7 倍。20% でよける。しびれが きかない', critMax: 0.68, critMult: 1.7, dodge: 0.2, shockImmune: true },
        skill: { name: 'ライジンサンダー', desc: '威力 370。敵の攻撃ゲージを 0 にもどす。ゲージ +10%', power: 370, resetGauge: true, charge: 1.1 },
      },
      {
        trait: { name: 'らいめいのはやさ', desc: '会心率 最大 72%・会心 1.8 倍。25% でよける。しびれが きかない', critMax: 0.72, critMult: 1.8, dodge: 0.25, shockImmune: true },
        skill: { name: 'ボルテックス', desc: '威力 440。攻撃ゲージを 0 に。ゲージ +15%', power: 440, resetGauge: true, charge: 1.15 },
      },
      {
        trait: { name: 'かみなりのかみ', desc: '会心率 最大 76%・会心 1.9 倍。30% でよける。しびれが きかない', critMax: 0.76, critMult: 1.9, dodge: 0.3, shockImmune: true },
        skill: { name: 'ゼウスのいかずち', desc: '威力 510。攻撃ゲージを 0 に。ゲージ +20%', power: 510, resetGauge: true, charge: 1.2 },
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
    base: { hp: 89, atk: 59, def: 79, spd: 45 },
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
    base: { hp: 84, atk: 69, def: 71, spd: 60 },
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
  // ---- ここから ガチャ限定のキャラ (ガチャで出るまで つかえない) ----
  ryumaru: {
    id: 'ryumaru',
    gacha: true,
    names: ['りゅうまる', 'りゅうりゅん', 'ドラゴまる', 'ワイバーンまる', 'りゅうじんまる'],
    type: 'ドラゴン',
    role: 'ぎゃくてん型',
    colors: { main: '#e8590c', light: '#ffd8a8', dark: '#7c2d12', accent: '#ffd43b' },
    stageColors: [
      { main: '#e8590c', light: '#ffd8a8', dark: '#7c2d12', accent: '#ffd43b' },
      { main: '#d6336c', light: '#ffdeeb', dark: '#6b1030', accent: '#ffd43b' },
      { main: '#ae3ec9', light: '#f3d9fa', dark: '#4a1260', accent: '#ffe066' },
      { main: '#c92a2a', light: '#ffc9c9', dark: '#4d0a0a', accent: '#ffd43b' },
      { main: '#1c7ed6', light: '#d0ebff', dark: '#0b2c55', accent: '#ffd43b' },
    ],
    base: { hp: 82, atk: 88, def: 65, spd: 60 },
    desc: 'りゅうの血を ひく スライム。ピンチになるほど ちからが わいてくる。',
    forms: [
      {
        trait: { name: 'りゅうのいかり', desc: 'HP が 半分を きると こうげき 1.2 倍', rageAt: 0.5, rageMult: 1.2, statusCut: 0 },
        skill: { name: 'ドラゴンブレス', desc: '威力 230 のブレス。自分の HP が へっているほど 強い (最大 1.6 倍)', power: 230, lowBoost: 0.6, charge: 1 },
      },
      {
        trait: { name: 'りゅうのいかり+', desc: 'HP が 半分を きると こうげき 1.25 倍。やけどの時間が半分', rageAt: 0.5, rageMult: 1.25, statusCut: 0.5 },
        skill: { name: 'ドラゴンブレス+', desc: '威力 310。HP が へっているほど 強い (最大 1.7 倍)。ゲージ +5%', power: 310, lowBoost: 0.7, charge: 1.05 },
      },
      {
        trait: { name: 'げきりん', desc: 'HP が 6 わりを きると こうげき 1.3 倍。どく・やけどの時間が半分', rageAt: 0.6, rageMult: 1.3, statusCut: 0.5 },
        skill: { name: 'ドラゴンダイブ', desc: '威力 390。HP が へっているほど 強い (最大 1.8 倍)。ゲージ +10%', power: 390, lowBoost: 0.8, charge: 1.1 },
      },
      {
        trait: { name: 'ひりゅう', desc: 'HP が 6 わりを きると こうげき 1.35 倍。どく・やけど・こおりが きかない', rageAt: 0.6, rageMult: 1.35, statusCut: 1 },
        skill: { name: 'ワイバーンストーム', desc: '威力 470。HP が へっているほど 強い (最大 1.9 倍)。ゲージ +15%', power: 470, lowBoost: 0.9, charge: 1.15 },
      },
      {
        trait: { name: 'りゅうじん', desc: 'HP が 7 わりを きると こうげき 1.4 倍。状態異常が きかない', rageAt: 0.7, rageMult: 1.4, statusCut: 1 },
        skill: { name: 'りゅうじんのさばき', desc: '威力 550。HP が へっているほど 強い (最大 2 倍)。ゲージ +20%', power: 550, lowBoost: 1.0, charge: 1.2 },
      },
    ],
  },
  kirari: {
    id: 'kirari',
    gacha: true,
    names: ['きらり', 'きららん', 'プリズムきらり', 'ステラきらり', 'ルミナスきらり'],
    type: 'ひかり',
    role: 'れんぞく型',
    colors: { main: '#f783ac', light: '#fff0f6', dark: '#a61e4d', accent: '#fff3bf' },
    stageColors: [
      { main: '#f783ac', light: '#fff0f6', dark: '#a61e4d', accent: '#fff3bf' },
      { main: '#faa2c1', light: '#ffffff', dark: '#c2255c', accent: '#99e9f2' },
      { main: '#b197fc', light: '#f3f0ff', dark: '#5f3dc4', accent: '#ffec99' },
      { main: '#66d9e8', light: '#ffffff', dark: '#0b7285', accent: '#fcc2d7' },
      { main: '#fff3bf', light: '#ffffff', dark: '#e67700', accent: '#f783ac' },
    ],
    base: { hp: 82, atk: 101, def: 69, spd: 90 },
    desc: 'ほしから おちてきた ひかりのスライム。ノーミスが つづくほど かがやきを ます。',
    forms: [
      {
        trait: { name: 'きらきらリズム', desc: 'ノーミスで お題を打ち切るたび こうげき +5% (最大 +25%)。ミスで もとにもどる', streakStep: 0.05, streakMax: 0.25 },
        skill: { name: 'スターシュート', desc: '威力 220 のほしを とばす。きらきらリズムの ボーナスも のる', power: 220, barrier: 0, charge: 1 },
      },
      {
        trait: { name: 'きらきらリズム+', desc: 'ノーミスで 1 回ごとに +5% (最大 +30%)', streakStep: 0.05, streakMax: 0.3 },
        skill: { name: 'スターシャワー', desc: '威力 300。リズムの ボーナスも のる。ゲージ +5%', power: 300, barrier: 0, charge: 1.05 },
      },
      {
        trait: { name: 'プリズムリズム', desc: 'ノーミスで 1 回ごとに +6% (最大 +36%)', streakStep: 0.06, streakMax: 0.36 },
        skill: { name: 'プリズムレイ', desc: '威力 370。リズムの ボーナスも のり、ひかりのかべで 1 回ふせぐ。ゲージ +10%', power: 370, barrier: 1, charge: 1.1 },
      },
      {
        trait: { name: 'ほしのリズム', desc: 'ノーミスで 1 回ごとに +6% (最大 +42%)', streakStep: 0.06, streakMax: 0.42 },
        skill: { name: 'ステラノヴァ', desc: '威力 440。リズムの ボーナスも のり、かべで 1 回ふせぐ。ゲージ +15%', power: 440, barrier: 1, charge: 1.15 },
      },
      {
        trait: { name: 'ぎんがのリズム', desc: 'ノーミスで 1 回ごとに +7% (最大 +49%)', streakStep: 0.07, streakMax: 0.49 },
        skill: { name: 'ルミナスギャラクシー', desc: '威力 510。リズムの ボーナスも のり、かべで 2 回ふせぐ。ゲージ +20%', power: 510, barrier: 2, charge: 1.2 },
      },
    ],
  },
  koorin: {
    id: 'koorin',
    gacha: true,
    names: ['こおりん', 'こおりりん', 'フロストこおりん', 'ブリザードこおりん', 'ダイヤモンドこおりん'],
    type: 'こおり',
    role: 'カウンター型',
    colors: { main: '#74c0fc', light: '#e7f5ff', dark: '#1864ab', accent: '#ffffff' },
    stageColors: [
      { main: '#74c0fc', light: '#e7f5ff', dark: '#1864ab', accent: '#ffffff' },
      { main: '#66d9e8', light: '#e3fafc', dark: '#0b7285', accent: '#ffffff' },
      { main: '#91a7ff', light: '#edf2ff', dark: '#364fc7', accent: '#e3fafc' },
      { main: '#4dabf7', light: '#ffffff', dark: '#0b3d6b', accent: '#99e9f2' },
      { main: '#e7f5ff', light: '#ffffff', dark: '#1971c2', accent: '#74c0fc' },
    ],
    base: { hp: 87, atk: 89, def: 81, spd: 68 },
    desc: 'こおりの けっしょうから うまれた スライム。こうげきされると ひんやり やりかえす。',
    forms: [
      { trait: { name: 'ひんやりボディ', desc: '攻撃を うけると 25% で 敵の 攻撃ゲージを 35% もどす', counter: 0.25, pushback: 0.35, statusCut: 0 },
        skill: { name: 'ダイヤモンドダスト', desc: '威力 200。敵を 4 秒 こごえさせ、攻撃ゲージが 半分の 速さに', power: 200, chill: 4, charge: 1 } },
      { trait: { name: 'ひんやりボディ+', desc: '30% で 攻撃ゲージを 35% もどす。どく・やけどの時間が半分', counter: 0.3, pushback: 0.35, statusCut: 0.5 },
        skill: { name: 'ダイヤモンドダスト+', desc: '威力 270。4.5 秒 こごえさせる。ゲージ +5%', power: 270, chill: 4.5, charge: 1.05 } },
      { trait: { name: 'フロストアーマー', desc: '35% で 攻撃ゲージを 40% もどす。状態異常が きかない', counter: 0.35, pushback: 0.4, statusCut: 1 },
        skill: { name: 'フロストノヴァ', desc: '威力 340。5 秒 こごえさせる。ゲージ +10%', power: 340, chill: 5, charge: 1.1 } },
      { trait: { name: 'ブリザードアーマー', desc: '40% で 攻撃ゲージを 40% もどす。状態異常が きかない', counter: 0.4, pushback: 0.4, statusCut: 1 },
        skill: { name: 'ブリザード', desc: '威力 410。5.5 秒 こごえさせる。ゲージ +15%', power: 410, chill: 5.5, charge: 1.15 } },
      { trait: { name: 'えいきゅうとうど', desc: '45% で 攻撃ゲージを 45% もどす。状態異常が きかない', counter: 0.45, pushback: 0.45, statusCut: 1 },
        skill: { name: 'アブソリュートゼロ', desc: '威力 480。6 秒 こごえさせる。ゲージ +20%', power: 480, chill: 6, charge: 1.2 } },
    ],
  },
  fuwari: {
    id: 'fuwari',
    gacha: true,
    names: ['ふわり', 'ふわりん', 'ウィンドふわり', 'ストームふわり', 'テンペストふわり'],
    type: 'かぜ',
    role: 'れんげき型',
    colors: { main: '#96f2d7', light: '#f0fff9', dark: '#0ca678', accent: '#ffffff' },
    stageColors: [
      { main: '#96f2d7', light: '#f0fff9', dark: '#0ca678', accent: '#ffffff' },
      { main: '#8ce99a', light: '#ebfbee', dark: '#2b8a3e', accent: '#fff3bf' },
      { main: '#63e6be', light: '#e6fcf5', dark: '#087f5b', accent: '#e3fafc' },
      { main: '#38d9a9', light: '#ffffff', dark: '#054d3b', accent: '#fff3bf' },
      { main: '#c3fae8', light: '#ffffff', dark: '#0ca678', accent: '#ffd43b' },
    ],
    base: { hp: 74, atk: 91, def: 62, spd: 98 },
    desc: 'かぜに のって ただよう スライム。すばやく 2 回 こうげきする ことが ある。',
    forms: [
      { trait: { name: 'おいかぜ', desc: 'お題を 打ち切ると 15% で もう 1 回 おいうち (50% の ダメージ)', double: 0.15, statusCut: 0 },
        skill: { name: 'エアスラッシュ', desc: '威力 200。敵の 攻撃を 1 回 よける', power: 200, evade: 1, charge: 1 } },
      { trait: { name: 'おいかぜ+', desc: '20% で おいうち', double: 0.2, statusCut: 0 },
        skill: { name: 'エアスラッシュ+', desc: '威力 270。1 回 よける。ゲージ +5%', power: 270, evade: 1, charge: 1.05 } },
      { trait: { name: 'しっぷう', desc: '25% で おいうち。どく・やけどの時間が半分', double: 0.25, statusCut: 0.5 },
        skill: { name: 'ストームエッジ', desc: '威力 340。2 回 よける。ゲージ +10%', power: 340, evade: 2, charge: 1.1 } },
      { trait: { name: 'はやて', desc: '30% で おいうち。どく・やけどの時間が半分', double: 0.3, statusCut: 0.5 },
        skill: { name: 'テンペスト', desc: '威力 410。2 回 よける。ゲージ +15%', power: 410, evade: 2, charge: 1.15 } },
      { trait: { name: 'かみかぜ', desc: '35% で おいうち。状態異常が きかない', double: 0.35, statusCut: 1 },
        skill: { name: 'ゴッドウィンド', desc: '威力 480。3 回 よける。ゲージ +20%', power: 480, evade: 3, charge: 1.2 } },
    ],
  },
  metarun: {
    id: 'metarun',
    gacha: true,
    names: ['メタルン', 'メタルルン', 'アイアンメタルン', 'スチールメタルン', 'アダマンメタルン'],
    type: 'はがね',
    role: 'ためうち型',
    colors: { main: '#adb5bd', light: '#f8f9fa', dark: '#495057', accent: '#ffd43b' },
    stageColors: [
      { main: '#adb5bd', light: '#f8f9fa', dark: '#495057', accent: '#ffd43b' },
      { main: '#ced4da', light: '#ffffff', dark: '#343a40', accent: '#ff922b' },
      { main: '#868e96', light: '#dee2e6', dark: '#212529', accent: '#4dabf7' },
      { main: '#5c7cfa', light: '#dbe4ff', dark: '#1c2c80', accent: '#ffd43b' },
      { main: '#e9ecef', light: '#ffffff', dark: '#5f3dc4', accent: '#ffd43b' },
    ],
    base: { hp: 78, atk: 82, def: 77, spd: 45 },
    desc: 'てつで できた おもたい スライム。ながい お題を 打つほど パワーが たまる。',
    forms: [
      { trait: { name: 'ためうち', desc: '9 キー 以上の お題は 1 キー ふえるごとに +3% (最大 +30%)', longFrom: 8, longStep: 0.03, longMax: 0.3, pierce: false, statusCut: 0 },
        skill: { name: 'メタルブレイク', desc: '威力 210。敵を 5 秒 ブレイク (うける ダメージ +30%)', power: 210, brk: 5, charge: 1 } },
      { trait: { name: 'ためうち+', desc: '1 キー ごとに +3% (最大 +35%)', longFrom: 8, longStep: 0.03, longMax: 0.35, pierce: false, statusCut: 0.5 },
        skill: { name: 'メタルブレイク+', desc: '威力 280。5.5 秒 ブレイク。ゲージ +5%', power: 280, brk: 5.5, charge: 1.05 } },
      { trait: { name: 'てっけん', desc: '1 キー ごとに +3% (最大 +40%)。よろい・ガードを 半分 つらぬく', longFrom: 8, longStep: 0.03, longMax: 0.4, pierce: true, statusCut: 0.5 },
        skill: { name: 'アイアンクラッシュ', desc: '威力 350。6 秒 ブレイク。ゲージ +10%', power: 350, brk: 6, charge: 1.1 } },
      { trait: { name: 'こうてつ', desc: '1 キー ごとに +3% (最大 +45%)。よろい・ガードを 半分 つらぬく', longFrom: 8, longStep: 0.03, longMax: 0.45, pierce: true, statusCut: 1 },
        skill: { name: 'スチールクラッシュ', desc: '威力 420。6.5 秒 ブレイク。ゲージ +15%', power: 420, brk: 6.5, charge: 1.15 } },
      { trait: { name: 'アダマンタイト', desc: '1 キー ごとに +3% (最大 +50%)。よろい・ガードを 半分 つらぬく', longFrom: 8, longStep: 0.03, longMax: 0.5, pierce: true, statusCut: 1 },
        skill: { name: 'アダマンブレイク', desc: '威力 490。7 秒 ブレイク。ゲージ +20%', power: 490, brk: 7, charge: 1.2 } },
    ],
  },
  // ---- ここから しょうごうで ひらく キャラ ----
  onpuru: {
    id: 'onpuru',
    title: 'kpm250',
    names: ['おんぷる', 'おんぷるる', 'リズムおんぷる', 'ビートおんぷる', 'シンフォニーおんぷる'],
    type: 'おと',
    role: 'スピード型',
    colors: { main: '#ff8cc6', light: '#fff0f6', dark: '#a61e4d', accent: '#ffe066' },
    stageColors: [
      { main: '#ff8cc6', light: '#fff0f6', dark: '#a61e4d', accent: '#ffe066' },
      { main: '#f06595', light: '#ffdeeb', dark: '#870b3a', accent: '#63e6be' },
      { main: '#845ef7', light: '#e5dbff', dark: '#3b1c8c', accent: '#ffe066' },
      { main: '#4c6ef5', light: '#dbe4ff', dark: '#1c2c80', accent: '#ff8cc6' },
      { main: '#fcc2d7', light: '#ffffff', dark: '#c2255c', accent: '#ffd43b' },
    ],
    base: { hp: 80, atk: 101, def: 65, spd: 96 },
    desc: 'リズムに のって はずむ おとの スライム。はやく 打つほど ノリノリに なる。',
    forms: [
      { trait: { name: 'アップテンポ', desc: '1 秒に 5 打より 速く お題を 打つと、1 打 はやいごとに 攻撃 +8% (最大 +24%)', speedFrom: 5, speedStep: 0.08, speedMax: 0.24, statusCut: 0 },
        skill: { name: 'ソニックビート', desc: '威力 200。つぎの 3 お題の 攻撃が 1.4 倍', power: 200, tempo: 3, tempoMult: 1.4, charge: 1 } },
      { trait: { name: 'アップテンポ+', desc: '1 打 はやいごとに +8% (最大 +30%)', speedFrom: 5, speedStep: 0.08, speedMax: 0.3, statusCut: 0 },
        skill: { name: 'ソニックビート+', desc: '威力 270。つぎの 3 お題が 1.45 倍。ゲージ +5%', power: 270, tempo: 3, tempoMult: 1.45, charge: 1.05 } },
      { trait: { name: 'ハイテンポ', desc: '1 打 はやいごとに +9% (最大 +36%)。どく・やけどの時間が半分', speedFrom: 5, speedStep: 0.09, speedMax: 0.36, statusCut: 0.5 },
        skill: { name: 'ビートラッシュ', desc: '威力 340。つぎの 4 お題が 1.5 倍。ゲージ +10%', power: 340, tempo: 4, tempoMult: 1.5, charge: 1.1 } },
      { trait: { name: 'プレスト', desc: '1 打 はやいごとに +9% (最大 +42%)。どく・やけどの時間が半分', speedFrom: 5, speedStep: 0.09, speedMax: 0.42, statusCut: 0.5 },
        skill: { name: 'フォルテッシモ', desc: '威力 410。つぎの 4 お題が 1.55 倍。ゲージ +15%', power: 410, tempo: 4, tempoMult: 1.55, charge: 1.15 } },
      { trait: { name: 'ヴィヴァーチェ', desc: '1 打 はやいごとに +10% (最大 +48%)。状態異常が きかない', speedFrom: 5, speedStep: 0.1, speedMax: 0.48, statusCut: 1 },
        skill: { name: 'グランドフィナーレ', desc: '威力 480。つぎの 5 お題が 1.6 倍。ゲージ +20%', power: 480, tempo: 5, tempoMult: 1.6, charge: 1.2 } },
    ],
  },
  pitarin: {
    id: 'pitarin',
    title: 'acc100',
    names: ['ぴたりん', 'ぴたぴたりん', 'ムーンぴたりん', 'クレセントぴたりん', 'フルムーンぴたりん'],
    type: 'つき',
    role: 'せいかく型',
    colors: { main: '#91a7ff', light: '#edf2ff', dark: '#364fc7', accent: '#ffe066' },
    stageColors: [
      { main: '#91a7ff', light: '#edf2ff', dark: '#364fc7', accent: '#ffe066' },
      { main: '#748ffc', light: '#dbe4ff', dark: '#1c2c80', accent: '#fff3bf' },
      { main: '#5c7cfa', light: '#e7f5ff', dark: '#0b1a5c', accent: '#ffd43b' },
      { main: '#3b5bdb', light: '#bac8ff', dark: '#060e3a', accent: '#ffe066' },
      { main: '#e7f5ff', light: '#ffffff', dark: '#364fc7', accent: '#ffd43b' },
    ],
    base: { hp: 75, atk: 82, def: 65, spd: 70 },
    desc: 'つきの ひかりを あびた しずかな スライム。まちがえずに 打つと かならず 急所を つく。',
    forms: [
      { trait: { name: 'みきりの一撃', desc: 'ノーミスで 打ち切った お題は かならず 会心 (1.3 倍)', perfectCrit: 1.3, statusCut: 0 },
        skill: { name: 'ムーンリフレクト', desc: '威力 190。つぎの 敵の 攻撃を 1 回 はね返す', power: 190, reflect: 1, charge: 1 } },
      { trait: { name: 'みきりの一撃+', desc: 'ノーミスは かならず 会心 (1.35 倍)', perfectCrit: 1.35, statusCut: 0 },
        skill: { name: 'ムーンリフレクト+', desc: '威力 260。1 回 はね返す。ゲージ +5%', power: 260, reflect: 1, charge: 1.05 } },
      { trait: { name: 'つきよの みきり', desc: 'ノーミスは かならず 会心 (1.4 倍)。どく・やけどの時間が半分', perfectCrit: 1.4, statusCut: 0.5 },
        skill: { name: 'クレセントミラー', desc: '威力 330。2 回 はね返す。ゲージ +10%', power: 330, reflect: 2, charge: 1.1 } },
      { trait: { name: 'げっこうの みきり', desc: 'ノーミスは かならず 会心 (1.45 倍)。どく・やけどの時間が半分', perfectCrit: 1.45, statusCut: 0.5 },
        skill: { name: 'ルナミラー', desc: '威力 400。2 回 はね返す。ゲージ +15%', power: 400, reflect: 2, charge: 1.15 } },
      { trait: { name: 'まんげつの みきり', desc: 'ノーミスは かならず 会心 (1.5 倍)。状態異常が きかない', perfectCrit: 1.5, statusCut: 1 },
        skill: { name: 'フルムーンミラー', desc: '威力 470。3 回 はね返す。ゲージ +20%', power: 470, reflect: 3, charge: 1.2 } },
    ],
  },
  // ---- v5.3: ガチャ限定 1 たい・かくしステージ 2 たい・とびらの ミッション 1 たい ----
  dororin: {
    id: 'dororin',
    gacha: true,
    names: ['どろりん', 'どろどろりん', 'ポイズンどろりん', 'ベノムどろりん', 'カオスどろりん'],
    type: 'どく', role: 'じわじわ型',
    colors: { main: '#9775fa', light: '#e5dbff', dark: '#3b1c8c', accent: '#8ce99a' },
    stageColors: [
      { main: '#9775fa', light: '#e5dbff', dark: '#3b1c8c', accent: '#8ce99a' },
      { main: '#845ef7', light: '#d0bfff', dark: '#2b1a4a', accent: '#a9e34b' },
      { main: '#5f3dc4', light: '#b197fc', dark: '#1a0f3a', accent: '#94d82d' },
      { main: '#37b24d', light: '#b2f2bb', dark: '#0b3d16', accent: '#e599f7' },
      { main: '#212529', light: '#9775fa', dark: '#000000', accent: '#a9e34b' },
    ],
    base: { hp: 68, atk: 68, def: 60, spd: 75 },
    desc: 'ぬまの そこから うまれた どくの スライム。じわじわと 敵を よわらせる。',
    forms: [
      { trait: { name: 'どくのしずく', desc: 'お題を 打ち切るたび 敵に どくが 1 つ 重なる (最大 5)。1 つごとに 毎秒 敵の 最大HPの 0.35%', poisonPct: 0.0035, poisonMax: 5, statusCut: 0.5 },
        skill: { name: 'もうどく', desc: '威力 180。どく +3。敵の 攻撃を 5 秒 20% よわく', power: 180, addPoison: 3, weaken: 5, charge: 1 } },
      { trait: { name: 'どくのしずく+', desc: 'どく 最大 6。1 つ 毎秒 0.35%', poisonPct: 0.0035, poisonMax: 6, statusCut: 0.5 },
        skill: { name: 'もうどく+', desc: '威力 250。どく +3。5.5 秒 よわく。ゲージ +5%', power: 250, addPoison: 3, weaken: 5.5, charge: 1.05 } },
      { trait: { name: 'ポイズンボディ', desc: 'どく 最大 7。1 つ 毎秒 0.4%。どく・やけど・こごえが きかない', poisonPct: 0.004, poisonMax: 7, statusCut: 1 },
        skill: { name: 'ベノムショット', desc: '威力 320。どく +4。6 秒 よわく。ゲージ +10%', power: 320, addPoison: 4, weaken: 6, charge: 1.1 } },
      { trait: { name: 'ベノムボディ', desc: 'どく 最大 8。1 つ 毎秒 0.4%。状態異常が きかない', poisonPct: 0.004, poisonMax: 8, statusCut: 1 },
        skill: { name: 'ベノムレイン', desc: '威力 390。どく +4。6.5 秒 よわく。ゲージ +15%', power: 390, addPoison: 4, weaken: 6.5, charge: 1.15 } },
      { trait: { name: 'カオスボディ', desc: 'どく 最大 9。1 つ 毎秒 0.45%。状態異常が きかない', poisonPct: 0.0045, poisonMax: 9, statusCut: 1 },
        skill: { name: 'カオスミアズマ', desc: '威力 460。どく +5。7 秒 よわく。ゲージ +20%', power: 460, addPoison: 5, weaken: 7, charge: 1.2 } },
    ],
  },
  gorurin: {
    id: 'gorurin',
    special: true,
    names: ['ゴルりん', 'ゴルゴルりん', 'ゴールドりん', 'プラチナりん', 'エンペラーゴルりん'],
    type: 'きん', role: 'きゅうしゅう型',
    colors: { main: '#fcc419', light: '#fff9db', dark: '#8a5a00', accent: '#ffffff' },
    stageColors: [
      { main: '#fcc419', light: '#fff9db', dark: '#8a5a00', accent: '#ffffff' },
      { main: '#fab005', light: '#fff3bf', dark: '#7a4a00', accent: '#ff6b6b' },
      { main: '#f59f00', light: '#ffec99', dark: '#5c3c00', accent: '#4dabf7' },
      { main: '#dee2e6', light: '#ffffff', dark: '#495057', accent: '#fcc419' },
      { main: '#ffd43b', light: '#ffffff', dark: '#5c3c00', accent: '#e64980' },
    ],
    base: { hp: 84, atk: 86, def: 74, spd: 64 },
    desc: 'おうごんゴーレムが まもっていた きんいろの スライム。こうげきで 元気を すいとる。',
    forms: [
      { trait: { name: 'ゴールドドレイン', desc: 'あたえた ダメージの 6% 回復。バトルの コイン +20%', drain: 0.06, coinBonus: 0.2, statusCut: 0 },
        skill: { name: 'ゴールドラッシュ', desc: '威力 200。あたえた ダメージの 40% 回復', power: 200, skillDrain: 0.4, charge: 1 } },
      { trait: { name: 'ゴールドドレイン+', desc: '7% 回復。コイン +25%', drain: 0.07, coinBonus: 0.25, statusCut: 0 },
        skill: { name: 'ゴールドラッシュ+', desc: '威力 270。45% 回復。ゲージ +5%', power: 270, skillDrain: 0.45, charge: 1.05 } },
      { trait: { name: 'おうごんの からだ', desc: '8% 回復。コイン +30%。どく・やけどの時間が半分', drain: 0.08, coinBonus: 0.3, statusCut: 0.5 },
        skill: { name: 'ゴールドストーム', desc: '威力 340。50% 回復。ゲージ +10%', power: 340, skillDrain: 0.5, charge: 1.1 } },
      { trait: { name: 'プラチナの からだ', desc: '9% 回復。コイン +35%。どく・やけどの時間が半分', drain: 0.09, coinBonus: 0.35, statusCut: 0.5 },
        skill: { name: 'プラチナストーム', desc: '威力 410。55% 回復。ゲージ +15%', power: 410, skillDrain: 0.55, charge: 1.15 } },
      { trait: { name: 'おうごんの ていおう', desc: '10% 回復。コイン +40%。状態異常が きかない', drain: 0.1, coinBonus: 0.4, statusCut: 1 },
        skill: { name: 'エンペラーラッシュ', desc: '威力 480。60% 回復。ゲージ +20%', power: 480, skillDrain: 0.6, charge: 1.2 } },
    ],
  },
  yukidarun: {
    id: 'yukidarun',
    special: true,
    names: ['ゆきだるん', 'ゆきだるるん', 'スノーだるん', 'ブリザードだるん', 'ダイヤモンドだるん'],
    type: 'ゆき', role: 'ためこみ型',
    colors: { main: '#f8f9fa', light: '#ffffff', dark: '#74c0fc', accent: '#ff922b' },
    stageColors: [
      { main: '#f8f9fa', light: '#ffffff', dark: '#74c0fc', accent: '#ff922b' },
      { main: '#e7f5ff', light: '#ffffff', dark: '#4dabf7', accent: '#e03131' },
      { main: '#d0ebff', light: '#ffffff', dark: '#1c7ed6', accent: '#ff922b' },
      { main: '#a5d8ff', light: '#ffffff', dark: '#1864ab', accent: '#ffd43b' },
      { main: '#ffffff', light: '#ffffff', dark: '#3bc9db', accent: '#f783ac' },
    ],
    base: { hp: 94, atk: 78, def: 82, spd: 52 },
    desc: 'こおりの じょおうが のこした ゆきの スライム。ゆきだまを ためて みを まもる。',
    forms: [
      { trait: { name: 'ゆきだまアーマー', desc: 'お題を 打ち切るたび ゆきだま +1 (最大 3)。1 こ につき うける ダメージ -6%。攻撃を うけると 1 こ へる', snowMax: 3, snowCut: 0.06, statusCut: 0 },
        skill: { name: 'ゆきだまラッシュ', desc: '威力 170。ゆきだま 1 こ につき 威力 +25%', power: 170, snowBoost: 0.25, charge: 1 } },
      { trait: { name: 'ゆきだまアーマー+', desc: 'ゆきだま 最大 4', snowMax: 4, snowCut: 0.06, statusCut: 0.5 },
        skill: { name: 'ゆきだまラッシュ+', desc: '威力 240。1 こ につき +25%。ゲージ +5%', power: 240, snowBoost: 0.25, charge: 1.05 } },
      { trait: { name: 'スノーアーマー', desc: 'ゆきだま 最大 4。1 こ -7%。こごえが きかない', snowMax: 4, snowCut: 0.07, statusCut: 1 },
        skill: { name: 'スノーボム', desc: '威力 300。1 こ につき +30%。ゲージ +10%', power: 300, snowBoost: 0.3, charge: 1.1 } },
      { trait: { name: 'ブリザードアーマー', desc: 'ゆきだま 最大 5。1 こ -7%。状態異常が きかない', snowMax: 5, snowCut: 0.07, statusCut: 1 },
        skill: { name: 'ブリザードボム', desc: '威力 360。1 こ につき +30%。ゲージ +15%', power: 360, snowBoost: 0.3, charge: 1.15 } },
      { trait: { name: 'ダイヤモンドアーマー', desc: 'ゆきだま 最大 5。1 こ -8%。状態異常が きかない', snowMax: 5, snowCut: 0.08, statusCut: 1 },
        skill: { name: 'ダイヤモンドボム', desc: '威力 420。1 こ につき +35%。ゲージ +20%', power: 420, snowBoost: 0.35, charge: 1.2 } },
    ],
  },
  yuusharin: {
    id: 'yuusharin',
    special: true,
    names: ['ゆうしゃりん', 'ゆうしゃりんりん', 'せいけんゆうしゃりん', 'えいゆうりん', 'でんせつのゆうしゃりん'],
    type: 'でんせつ', role: 'オールラウンド型',
    colors: { main: '#4dabf7', light: '#e7f5ff', dark: '#1864ab', accent: '#ffd43b' },
    stageColors: [
      { main: '#4dabf7', light: '#e7f5ff', dark: '#1864ab', accent: '#ffd43b' },
      { main: '#339af0', light: '#d0ebff', dark: '#0b3d6b', accent: '#ff6b6b' },
      { main: '#228be6', light: '#a5d8ff', dark: '#082d52', accent: '#ffd43b' },
      { main: '#e03131', light: '#ffc9c9', dark: '#5c0f0f', accent: '#ffd43b' },
      { main: '#fff3bf', light: '#ffffff', dark: '#b8860b', accent: '#4dabf7' },
    ],
    base: { hp: 78, atk: 82, def: 69, spd: 72 },
    desc: 'むずかしい しょうごうを あつめた ものの まえに あらわれる ゆうしゃの スライム。なんでも できる。',
    forms: [
      { trait: { name: 'ゆうしゃの こころえ', desc: '会心率 12%・ダメージ 6% カット・コンボ倍率の 上限 1.55 倍', crit: 0.12, cut: 0.06, comboMax: 110, statusCut: 0 },
        skill: { name: 'ゆうしゃの いちげき', desc: '威力 200。HP 12% 回復。敵の 攻撃ゲージを 0 に', power: 200, heal: 0.12, charge: 1 } },
      { trait: { name: 'ゆうしゃの こころえ+', desc: '会心率 14%・カット 7%・上限 1.6 倍', crit: 0.14, cut: 0.07, comboMax: 120, statusCut: 0.5 },
        skill: { name: 'ゆうしゃの いちげき+', desc: '威力 260。HP 13% 回復。ゲージを 0 に。ゲージ +5%', power: 260, heal: 0.13, charge: 1.05 } },
      { trait: { name: 'せいけんの ちかい', desc: '会心率 16%・カット 8%・上限 1.65 倍。どく・やけどの時間が半分', crit: 0.16, cut: 0.08, comboMax: 130, statusCut: 0.5 },
        skill: { name: 'せいけんぎり', desc: '威力 320。HP 14% 回復。ゲージを 0 に。ゲージ +10%', power: 320, heal: 0.14, charge: 1.1 } },
      { trait: { name: 'えいゆうの ちかい', desc: '会心率 18%・カット 9%・上限 1.7 倍。状態異常が きかない', crit: 0.18, cut: 0.09, comboMax: 140, statusCut: 1 },
        skill: { name: 'えいゆうの つるぎ', desc: '威力 380。HP 15% 回復。ゲージを 0 に。ゲージ +15%', power: 380, heal: 0.15, charge: 1.15 } },
      { trait: { name: 'でんせつの ちかい', desc: '会心率 20%・カット 10%・上限 1.75 倍。状態異常が きかない', crit: 0.2, cut: 0.1, comboMax: 150, statusCut: 1 },
        skill: { name: 'でんせつの つるぎ', desc: '威力 440。HP 16% 回復。ゲージを 0 に。ゲージ +20%', power: 440, heal: 0.16, charge: 1.2 } },
    ],
  },
  fuerin: {
    id: 'fuerin',
    title: 'combo300',
    names: ['ふえりん', 'ふえふえりん', 'ぶんしんふえりん', 'ミリオンふえりん', 'インフィニふえりん'],
    type: 'ぶんれつ', role: 'コンボ型',
    colors: { main: '#94d82d', light: '#f4fce3', dark: '#2b8a3e', accent: '#ff8787' },
    stageColors: [
      { main: '#94d82d', light: '#f4fce3', dark: '#2b8a3e', accent: '#ff8787' },
      { main: '#69db7c', light: '#ebfbee', dark: '#1b6b30', accent: '#ffd43b' },
      { main: '#38d9a9', light: '#e6fcf5', dark: '#087f5b', accent: '#ff8787' },
      { main: '#3bc9db', light: '#e3fafc', dark: '#0b7285', accent: '#ffd43b' },
      { main: '#b2f2bb', light: '#ffffff', dark: '#2f9e44', accent: '#f783ac' },
    ],
    base: { hp: 89, atk: 96, def: 78, spd: 80 },
    desc: 'コンボマスターの まえに あらわれた、打つたびに ぶんれつして ふえる スライム。コンボが どんどん のびる。',
    forms: [
      { trait: { name: 'ぶんれつ', desc: '正しく 打つと コンボが 1.5 ふえる。ミスすると コンボは 0 に もどる', comboGain: 1.5, statusCut: 0 },
        skill: { name: 'ぶんしんアタック', desc: '威力 170。コンボ 1 につき 威力 +0.3% (最大 +60%)', power: 170, comboBoost: 0.003, boostMax: 0.6, charge: 1 } },
      { trait: { name: 'ぶんれつ+', desc: 'コンボが 1.6 ふえる', comboGain: 1.6, statusCut: 0 },
        skill: { name: 'ぶんしんアタック+', desc: '威力 240。コンボ 1 につき +0.3% (最大 +75%)。ゲージ +5%', power: 240, comboBoost: 0.003, boostMax: 0.75, charge: 1.05 } },
      { trait: { name: 'ぶんしんの じゅつ', desc: 'コンボが 1.7 ふえる。どく・やけどの時間が半分', comboGain: 1.7, statusCut: 0.5 },
        skill: { name: 'ぶんしんラッシュ', desc: '威力 300。コンボ 1 につき +0.3% (最大 +90%)。ゲージ +10%', power: 300, comboBoost: 0.003, boostMax: 0.9, charge: 1.1 } },
      { trait: { name: 'ミリオンぶんれつ', desc: 'コンボが 1.8 ふえる。どく・やけどの時間が半分', comboGain: 1.8, statusCut: 0.5 },
        skill: { name: 'ミリオンラッシュ', desc: '威力 360。コンボ 1 につき +0.3% (最大 +105%)。ゲージ +15%', power: 360, comboBoost: 0.003, boostMax: 1.05, charge: 1.15 } },
      { trait: { name: 'インフィニぶんれつ', desc: 'コンボが 2 ふえる。状態異常が きかない', comboGain: 2, statusCut: 1 },
        skill: { name: 'インフィニティラッシュ', desc: '威力 420。コンボ 1 につき +0.3% (最大 +120%)。ゲージ +20%', power: 420, comboBoost: 0.003, boostMax: 1.2, charge: 1.2 } },
    ],
  },
  // ---- ガチャ限定: スライムの かたちに とらわれない キャラ ----
  // トリオりん: 小さな 3 びきで 1 キャラ (絵は sprites.js の CUSTOM_BODY)。tri = 3 びきの 色 [いろ, ふち]
  torio: {
    id: 'torio',
    gacha: true,
    names: ['トリオりん', 'トリオりんりん', 'トリプルスター', 'トリニティ', 'トリオキング'],
    type: 'なかま', role: 'れんけい型',
    colors: { main: '#ff6b6b', light: '#ffe3e3', dark: '#862e2e', accent: '#ffd43b' },
    stageColors: [
      { main: '#ff6b6b', light: '#ffe3e3', dark: '#862e2e', accent: '#ffd43b', tri: [['#ff6b6b', '#a61e1e'], ['#ffd43b', '#b8860b'], ['#4dabf7', '#1864ab']] },
      { main: '#ff8787', light: '#fff5f5', dark: '#a61e1e', accent: '#ffe066', tri: [['#ff8787', '#c92a2a'], ['#ffe066', '#e67700'], ['#74c0fc', '#1971c2']] },
      { main: '#f06595', light: '#fff0f6', dark: '#a61e4d', accent: '#ffa94d', tri: [['#f06595', '#a61e4d'], ['#ffa94d', '#d9480f'], ['#63e6be', '#087f5b']] },
      { main: '#cc5de8', light: '#f8f0fc', dark: '#862e9c', accent: '#ff922b', tri: [['#cc5de8', '#862e9c'], ['#ff922b', '#c2410c'], ['#3bc9db', '#0b7285']] },
      { main: '#fff3bf', light: '#ffffff', dark: '#e67700', accent: '#ffd43b', tri: [['#fff3bf', '#e67700'], ['#ffc9c9', '#e03131'], ['#d0ebff', '#1c7ed6']] },
    ],
    base: { hp: 82, atk: 87, def: 68, spd: 78 },
    desc: 'いつも いっしょの 3 びきぐみ。ひとりでは よわいけど、3 びき そろうと むてき。',
    forms: [
      { trait: { name: 'れんけいプレイ', desc: 'お題を 打ち切ると 3 びきが じゅんに 攻撃 (会心は 1 ぴきずつ)。ノーミスで 3 つ つづけると 3 つめが +45%', trio: 0.45, statusCut: 0 },
        skill: { name: 'トリプルアタック', desc: '威力 170 を 3 かいに わけて 当てる。3 かいめは かならず 会心', power: 170, charge: 1 } },
      { trait: { name: 'れんけいプレイ+', desc: 'トリオボーナス +50%', trio: 0.5, statusCut: 0 },
        skill: { name: 'トリプルアタック+', desc: '威力 240。3 かいめは かならず 会心。ゲージ +5%', power: 240, charge: 1.05 } },
      { trait: { name: 'トリオの きずな', desc: 'トリオボーナス +55%。どく・やけどの時間が半分', trio: 0.55, statusCut: 0.5 },
        skill: { name: 'トリプルスター', desc: '威力 300。3 かいめは かならず 会心。ゲージ +10%', power: 300, charge: 1.1 } },
      { trait: { name: 'トリニティ', desc: 'トリオボーナス +60%。どく・やけどの時間が半分', trio: 0.6, statusCut: 0.5 },
        skill: { name: 'トリニティバースト', desc: '威力 360。3 かいめは かならず 会心。ゲージ +15%', power: 360, charge: 1.15 } },
      { trait: { name: 'トリオの おうさま', desc: 'トリオボーナス +70%。状態異常が きかない', trio: 0.7, statusCut: 1 },
        skill: { name: 'キング・オブ・トリオ', desc: '威力 420。3 かいめは かならず 会心。ゲージ +20%', power: 420, charge: 1.2 } },
    ],
  },
  // ゆらりん: クラゲの かたちの キャラ。ミスを なかったことに する
  yurarin: {
    id: 'yurarin',
    gacha: true,
    names: ['ゆらりん', 'ゆらゆらりん', 'ネオンゆらりん', 'オーロラゆらりん', 'ギャラクシーゆらりん'],
    type: 'くらげ', role: 'まもり型',
    colors: { main: '#a5d8ff', light: '#e7f5ff', dark: '#1971c2', accent: '#f783ac' },
    stageColors: [
      { main: '#a5d8ff', light: '#e7f5ff', dark: '#1971c2', accent: '#f783ac' },
      { main: '#d0bfff', light: '#f3f0ff', dark: '#6741d9', accent: '#63e6be' },
      { main: '#63e6be', light: '#e6fcf5', dark: '#087f5b', accent: '#ff8cc6' },
      { main: '#99e9f2', light: '#e3fafc', dark: '#0b7285', accent: '#d0bfff' },
      { main: '#5c3fb8', light: '#b197fc', dark: '#1e0f55', accent: '#ffe066' },
    ],
    base: { hp: 85, atk: 76, def: 74, spd: 70 },
    desc: 'よぞらの うみを ただよう クラゲ。ゆらゆら ゆれて、ちょっとの ミスなら なかったことに する。',
    forms: [
      { trait: { name: 'ゆらゆらガード', desc: 'お題ごとに さいしょの ミス 1 かいを なかったことに する。そのとき HP 1.5% 回復', forgive: 1, forgiveHeal: 0.015, statusCut: 0 },
        skill: { name: 'ゆらめきタッチ', desc: '威力 170。4 秒間 ミスが ぜんぶ なかったことに なる', power: 170, forgiveSecs: 4, charge: 1 } },
      { trait: { name: 'ゆらゆらガード+', desc: 'HP 2% 回復', forgive: 1, forgiveHeal: 0.02, statusCut: 0 },
        skill: { name: 'ゆらめきタッチ+', desc: '威力 240。4 秒間。ゲージ +5%', power: 240, forgiveSecs: 4, charge: 1.05 } },
      { trait: { name: 'ネオンベール', desc: 'HP 2% 回復。どく・やけどの時間が半分', forgive: 1, forgiveHeal: 0.02, statusCut: 0.5 },
        skill: { name: 'ネオンタッチ', desc: '威力 300。5 秒間。ゲージ +10%', power: 300, forgiveSecs: 5, charge: 1.1 } },
      { trait: { name: 'オーロラベール', desc: 'HP 2.5% 回復。状態異常が きかない', forgive: 1, forgiveHeal: 0.025, statusCut: 1 },
        skill: { name: 'オーロラタッチ', desc: '威力 360。5 秒間。ゲージ +15%', power: 360, forgiveSecs: 5, charge: 1.15 } },
      { trait: { name: 'ギャラクシーベール', desc: 'お題ごとに ミス 2 かいまで なかったことに。HP 2.5% 回復。状態異常が きかない', forgive: 2, forgiveHeal: 0.025, statusCut: 1 },
        skill: { name: 'ギャラクシータッチ', desc: '威力 420。6 秒間。ゲージ +20%', power: 420, forgiveSecs: 6, charge: 1.2 } },
    ],
  },
};

// とくべつな キャラ: ガチャ限定 = SSR / しょうごう・かくしステージ・ミッションで ひらく = とくべつ
// HP・こうげき・ぼうぎょが 5% 高く、カード・登場・ひっさつの 演出が はでに なる
const SPECIAL_STAT = 1.05;
function charRank(id) { const d = CHARACTERS[id]; return d.gacha ? 'ssr' : d.title || d.special ? 'special' : ''; }

// さいしょから つかえるキャラ (ガチャ限定・しょうごうや とびらで ひらく キャラを のぞく)
const STARTERS = Object.keys(CHARACTERS).filter(id => !CHARACTERS[id].gacha && !CHARACTERS[id].title && !CHARACTERS[id].special);

// ---------------- せんざいかくせい (ガチャで キャラが かぶると ★ が ふえる) ----------------
// ★ 1 つごとに: 能力値 +2%、レベルの上限 +1、そのキャラの とくせいが 少し のびる
const AWAKEN_MAX = 4;
const AWAKEN_STAT = 0.02;
const AWAKEN_BONUS = {
  purun: { desc: 'ノーミス回復 +0.4%', apply: (t, n) => ({ ...t, heal: t.heal + 0.004 * n }) },
  piriri: { desc: '会心率の上限 +2%', apply: (t, n) => ({ ...t, critMax: t.critMax + 0.02 * n }) },
  gotsun: { desc: 'ダメージカット +1%', apply: (t, n) => ({ ...t, cut: t.cut + 0.01 * n }) },
  homura: { desc: 'コンボ倍率の上限 +0.04', apply: (t, n) => ({ ...t, comboMax: t.comboMax + 8 * n }) },
  moririn: { desc: '3 秒ごとの回復 +0.1%', apply: (t, n) => ({ ...t, regen: t.regen + 0.001 * n }) },
  kagemaru: { desc: '敵の攻撃が さらに 1% おそく', apply: (t, n) => ({ ...t, slow: t.slow + 0.01 * n }) },
  ryumaru: { desc: 'いかりの こうげき +0.03 倍', apply: (t, n) => ({ ...t, rageMult: t.rageMult + 0.03 * n }) },
  kirari: { desc: 'リズムの上限 +3%', apply: (t, n) => ({ ...t, streakMax: t.streakMax + 0.03 * n }) },
  koorin: { desc: 'やりかえす 確率 +2%', apply: (t, n) => ({ ...t, counter: t.counter + 0.02 * n }) },
  fuwari: { desc: 'おいうちの 確率 +2%', apply: (t, n) => ({ ...t, double: t.double + 0.02 * n }) },
  metarun: { desc: 'ためうちの 上限 +3%', apply: (t, n) => ({ ...t, longMax: t.longMax + 0.03 * n }) },
  onpuru: { desc: 'テンポの 上限 +3%', apply: (t, n) => ({ ...t, speedMax: t.speedMax + 0.03 * n }) },
  pitarin: { desc: 'ノーミス会心 +0.03 倍', apply: (t, n) => ({ ...t, perfectCrit: t.perfectCrit + 0.03 * n }) },
  dororin: { desc: 'どくの 最大 +1', apply: (t, n) => ({ ...t, poisonMax: t.poisonMax + n }) },
  gorurin: { desc: 'ダメージ回復 +1%', apply: (t, n) => ({ ...t, drain: t.drain + 0.01 * n }) },
  yukidarun: { desc: 'ゆきだま 1 こ の カット +1%', apply: (t, n) => ({ ...t, snowCut: t.snowCut + 0.01 * n }) },
  yuusharin: { desc: '会心率 +1%', apply: (t, n) => ({ ...t, crit: t.crit + 0.01 * n }) },
  fuerin: { desc: 'コンボの ふえかた +0.05', apply: (t, n) => ({ ...t, comboGain: t.comboGain + 0.05 * n }) },
  torio: { desc: 'トリオボーナス +3%', apply: (t, n) => ({ ...t, trio: t.trio + 0.03 * n }) },
  yurarin: { desc: 'ミスを ふせいだ ときの 回復 +0.3%', apply: (t, n) => ({ ...t, forgiveHeal: t.forgiveHeal + 0.003 * n }) },
};

// サバイバルでの とくせい (進化の 段階ごと)。説明文も ここから 作る
const SV_CHAR = {
  purun: { regen: [3.5, 3.2, 2.9, 2.6, 2.3] },    // 何秒ごとに HP 1 回復
  moririn: { regen: [2.6, 2.3, 2.0, 1.7, 1.4] },
  piriri: { speed: [1.15, 1.18, 1.21, 1.24, 1.27] }, // 足の速さ
  homura: { dmg: [1.1, 1.14, 1.18, 1.22, 1.26] },    // 武器の ダメージ
  gotsun: { hurt: [0.75, 0.72, 0.69, 0.66, 0.63] },  // うける ダメージの 倍率
  kagemaru: { inv: [1.0, 1.1, 1.2, 1.3, 1.4] },      // うけたあとの むてき時間 (ふつうは 0.8 秒)
  kirari: { cd: [0.9, 0.88, 0.86, 0.84, 0.82] },     // 武器を うつ 間かく
  koorin: { eslow: [0.94, 0.92, 0.9, 0.88, 0.86] },  // 敵の 動く 速さ
  fuwari: { magnet: [1.3, 1.4, 1.5, 1.6, 1.7] },     // ジェムを すいよせる 範囲
  metarun: { hp: [1.15, 1.2, 1.25, 1.3, 1.35] },     // 最大HP
  onpuru: { speed: [1.1, 1.12, 1.14, 1.16, 1.18] },  // 足の速さ
  pitarin: { crit: [0.15, 0.18, 0.21, 0.24, 0.27] }, // 武器が 会心 (ダメージ 2 倍) に なる 確率
  dororin: { aura: [4, 5, 6, 7, 8] },                // ちかくの 敵に 0.5 秒ごと どくの ダメージ
  gorurin: { coin: [1.2, 1.25, 1.3, 1.35, 1.4] },    // サバイバルの コイン
  yukidarun: { chill: [0.8, 0.9, 1.0, 1.1, 1.2] },   // ふれた 敵が おそくなる 秒数
  yuusharin: { dmg: [1.06, 1.08, 1.1, 1.12, 1.14], hurt: [0.94, 0.92, 0.9, 0.88, 0.86] }, // 武器の ダメージ / うける ダメージ
  fuerin: { cd: [0.92, 0.9, 0.88, 0.86, 0.84] },     // 武器を うつ 間かく
  torio: { dmg: [1.08, 1.1, 1.12, 1.14, 1.16] },     // 武器の ダメージ
  yurarin: { hurt: [0.86, 0.84, 0.82, 0.8, 0.78] },  // うける ダメージの 倍率
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
  // うらの せかい (敵と 同じ レベル・220 打鍵で ふつう 7〜8 わり、ボス 4.5〜6 わり)
  v_bat: 86, v_mush: 121, v_goblin: 96, v_jelly: 107, v_golem: 119, v_dragon: 74,
  v_penguin: 137, v_yukionna: 124, v_raijin: 92, v_wyvern: 113, v_galaxyrobo: 145, v_demon: 49,
};

// E(id, 名前, 体つき, 攻撃間隔ms, 特殊能力, 能力の説明, 敵の説明, その他)
const E = (id, name, type, interval, ability, abilityDesc, desc, extra = {}) => ({ id, name, type, interval, ability, abilityDesc, desc, ...extra });

const WORLD_DEFS = [
  { id: 'grass', name: 'そうげん', diff: 'normal', enemies: [
    E('bat', 'コウモリン', 'fast', 4200, null, 'とくになし', 'どうくつにすむ小さなコウモリ。最初の相手にぴったり。', { diff: 'easy', bg: 'cave', lv: 1 }),
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
    E('yukionna', 'ユキオンナ', 'fast', 4400, 'freeze', 'つめたいいき: 攻撃をうけると 4 秒間 こごえて 攻撃が 3 わり 弱くなる', 'ゆきやまに あらわれる ゆうれい。'),
    E('wolf', 'アイスウルフ', 'fast', 4200, 'freeze', 'こおりのいき: 攻撃をうけると 4 秒間 こごえて 攻撃が 3 わり 弱くなる', 'こおりの いきを はく オオカミ。'),
    E('icegolem', 'アイスゴーレム', 'tank', 5600, 'armor', 'こおりのよろい: コンボ 30 未満だと ダメージ半減', 'こおりで できた きょじん。'),
    E('yeti', 'イエティ', 'boss', 5400, 'blizzard', 'ふぶき: ときどき 漢字とかなが見えなくなる。攻撃で こごえさせて 攻撃を 弱くする', 'ゆきやまの ぬし。ふぶきを よびおこす。'),
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
    E('demon', 'まおう', 'boss', 5600, 'demon', 'まおうのちから: HP 2/3 で やみ (ガイドが消える)、1/3 で 攻撃が速くなり ひっさつゲージをうばう', 'マグマのしろの あるじ。', { final: true }),
  ] },
  // ---- ここから うらの せかい (Lv100 より 上)。敵の 絵は 今ある 敵を つかい回して 色を かえた「へんい種」 ----
  { id: 'shade', name: 'かげのもり', diff: 'hard', enemies: [
    E('v_bat', 'かげコウモリン', 'fast', 3800, ['poison', 'fade'], 'かげのキバ: どくに して、ときどき ローマ字ガイドを かくす', 'かげに そまった コウモリン。すばやい。', { sprite: 'bat', lv: 101 }),
    E('v_mush', 'かげドクキノコ', 'normal', 4600, ['poison', 'regen'], 'かげのほうし: どくに して、ときどき HP を 回復する', 'かげの もりで ふえつづける キノコ。', { sprite: 'mush', lv: 103 }),
    E('v_goblin', 'かげゴブリン', 'normal', 4400, ['rage', 'charge'], 'かげのこんぼう: 3 回に 1 回 ためこうげき。HP 半分で 速くなる', 'かげの ちからで 強くなった ゴブリン。', { sprite: 'goblin', lv: 104 }),
    E('v_jelly', 'かげクラゲール', 'normal', 4800, ['shock', 'sweet'], 'かげのしょくしゅ: ミスすると 自分が ダメージを うけ、敵が 回復する', 'やみの 水に ただよう クラゲ。まちがえると こわい。', { sprite: 'jelly', lv: 106 }),
    E('v_golem', 'かげゴーレム', 'tank', 5400, ['armor', 'regen'], 'かげのよろい: コンボ 30 未満だと ダメージ半減。ときどき 回復する', 'かげの いしで できた きょじん。', { sprite: 'golem', lv: 107 }),
    E('v_dragon', 'かげドラゴン', 'boss', 5200, ['dragon', 'fade', 'poison'], 'やみのりゅう: HP 半分で 速くなり ブレス。ガイドを かくし、どくも ある', 'かげの もりの ぬし。まおうより 強い という うわさ。', { sprite: 'dragon', lv: 110 }),
  ] },
  { id: 'void', name: 'ほしのはて', diff: 'hard', enemies: [
    E('v_penguin', 'ほしのペンギナイト', 'normal', 4600, ['shell', 'freeze'], 'ほしのたて: ときどき 3 秒間 ダメージ大はばダウン。攻撃で こごえさせる', 'ほしの はてを まもる きし。', { sprite: 'penguin', lv: 110 }),
    E('v_yukionna', 'うつろなユキオンナ', 'fast', 4200, ['freeze', 'fade'], 'うつろないき: 攻撃で こごえさせ、ときどき ガイドを かくす', 'ほしの かぜに のって あらわれる ゆうれい。', { sprite: 'yukionna', lv: 112 }),
    E('v_raijin', 'ほしのライジン', 'normal', 4800, ['thunder', 'shock'], 'ほしのいかずち: 落雷の予告。ミスすると 自分が ダメージを うける', 'ほしの ちからを えた かみなりさま。', { sprite: 'raijin', lv: 113 }),
    E('v_wyvern', 'こくうのワイバーン', 'fast', 4200, ['wind', 'rage'], 'こくうのつばさ: 風で 文字を ゆらす。HP 半分で 速くなる', 'なにもない そらを とぶ りゅう。', { sprite: 'wyvern', lv: 115 }),
    E('v_galaxyrobo', 'ほしのきょじんロボ', 'tank', 5400, ['armor', 'shell'], 'ほしのそうこう: コンボ 30 未満だと ダメージ半減。ときどき ガードも かたくなる', 'ほしを まもる さいごの ロボット。', { sprite: 'galaxyrobo', lv: 117 }),
    E('v_demon', 'しんまおう', 'boss', 5400, ['demon', 'thunder'], 'しんまおうのちから: まおうの ちからに くわえて、落雷の予告も してくる', 'ほしの はてで めざめた ほんとうの まおう。さいごの てき。', { sprite: 'demon', lv: 124, last: true }),
  ] },
];

// へんい種の 見た目 (もとの 絵に 色の フィルターを かけるだけなので 軽い)
const VARIANT_FILTER = {
  shade: 'hue-rotate(250deg) saturate(1.5) brightness(.8) contrast(1.15)',
  void: 'hue-rotate(150deg) saturate(1.7) brightness(1.05)',
};

// ワールドの一覧
const WORLDS = WORLD_DEFS.map(w => ({ id: w.id, name: w.name }));

// 敵の一覧 (ステージ順)。レベル・経験値は 通し番号から決める
const ENEMIES = [];
WORLD_DEFS.forEach((w, wi) => {
  w.enemies.forEach((e, i) => {
    const g = ENEMIES.length;
    const boss = i === w.enemies.length - 1;
    const lv = e.lv || (e.final ? 99 : Math.round(2 + g * 1.46) + (boss ? 2 : 0));
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
// メインの ステージの 数 (かくしステージを のぞく)
const MAIN_STAGES = ENEMIES.length;

// ---------------- かくしステージ ----------------
// メインの ステージで 何かを たっせいすると、マップの host ワールドの from ばんめの マスから 道が ひらく
// たおすと ぼうけんのとびらで キャラが ひらく。ENEMIES の さいごに 足すが、ワールドの ステージ一覧には 入れない
const nomissCount = w => worldStages(w).filter(g => (Save.data.nomiss || {})[g]).length;
const HIDDEN_DEFS = [
  { host: 1, from: 5, e: E('h_goldgolem', 'おうごんゴーレム', 'tank', 5000, ['armor', 'regen'], 'おうごんの よろい: コンボ 30 未満だと ダメージ半減。ときどき 回復する',
      'どくぬまの おくに かくれていた きんいろの きょじん。', { sprite: 'golem', filter: 'sepia(1) saturate(5) hue-rotate(-12deg) brightness(1.15)', lv: 24, bg: 'ruins' }),
    reveal: { text: 'どくぬまの ステージを 3 つ ノーミスで クリアする', check: () => nomissCount(1) >= 3, progress: () => `${nomissCount(1)}/3` } },
  { host: 7, from: 5, e: E('h_icequeen', 'こおりの じょおう', 'boss', 4800, ['blizzard', 'freeze', 'charge'], 'えいきゅうとうど: ふぶきで 漢字と かなを かくし、こごえさせ、ためこうげきも してくる',
      'ゆきやまの いただきで ねむっていた こおりの じょおう。', { sprite: 'yukionna', filter: 'hue-rotate(185deg) saturate(2.2) brightness(1.25)', lv: 82, bg: 'snow' }),
    reveal: { text: 'ゆきやまの ボス イエティを 上級者で たおす', check: () => stageBest(worldStages(7).slice(-1)[0]) >= 3, progress: () => 'まだ' } },
];
for (const h of HIDDEN_DEFS) {
  const e = h.e;
  h.idx = ENEMIES.length;
  ENEMIES.push({ ...e, hidden: true, host: h.host, world: -1, boss: e.type === 'boss', lv: e.lv, base: { ...ENEMY_TYPES[e.type] }, power: 40,
    exp: 0, diff: 'hard', bg: e.bg, abilities: [].concat(e.ability || []) });
}
// かくしステージの 道が ひらいているか / たおしたか
function hiddenOpen(h) { try { return !!(Save.data.hiddenOpen || {})[h.e.id] || h.reveal.check(); } catch (err) { return false; } }
function hiddenCleared(h) { return !!(Save.data.hiddenClear || {})[h.e.id]; }
const hiddenOf = idx => HIDDEN_DEFS.find(h => h.idx === idx);

// へんい種・かくしステージ: id → { もとの 敵, フィルター }
const ENEMY_VARIANT = {};
for (const e of ENEMIES) if (e.sprite) ENEMY_VARIANT[e.id] = { base: e.sprite, filter: e.filter || VARIANT_FILTER[WORLD_DEFS[e.world].id] };

// バトルに 勝ったときの 経験値: このステージの レベルから つぎの ステージの レベルまでの 6 わり
// (推奨レベルで 勝ちすすむと つぎの 推奨レベルの すこし 手前に なる。れんしゅうで おいつく)
function stageExp(i) {
  const lv = ENEMIES[i].lv;
  const next = i + 1 < MAIN_STAGES ? Math.max(ENEMIES[i + 1].lv, lv + 1) : lv + 2;
  return (expForLevel(next) - expForLevel(lv)) * 0.6;
}

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
  if (e.hidden) return `${e.host + 1}-かくし`;
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
  module.exports = { SPECIAL_STAT, charRank, MAIN_STAGES, HIDDEN_DEFS, levelNeed, stageExp, STARTERS, AWAKEN_BONUS, expForLevel, levelFromExp, calcStats, calcDamage, wordPower, evoStage, CHARACTERS, ENEMIES, ENEMY_POWER, applyEnemyPower, BATTLE_HP_SCALE, ENEMY_HP_SCALE, WORLDS, MAX_LV };
}
