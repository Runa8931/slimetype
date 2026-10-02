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
  beg: { name: '初心者', k: 0.5, reward: 1, kpm: 100, color: '#69db7c', note: '1分100打鍵くらい向け' },
  mid: { name: '中級者', k: 0.9, reward: 1.3, kpm: 200, color: '#ffd43b', note: '1分200打鍵くらい向け' },
  adv: { name: '上級者', k: 1.65, ramp: 0.8, reward: 2, kpm: 350, missDmg: 0.01, color: '#ff6b6b', note: '1分350打鍵くらい向け・ミスでHPが1%減る' },
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
    type: '水',
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
    desc: 'どこにでもいる、ぷるぷるの水スライム。何でもそつなくこなす。',
    // 進化段階ごとの とくせい・ひっさつ (数値はバトルで使う)
    forms: [
      {
        trait: { name: 'うるおいボディ', desc: 'ノーミスでお題を打ち切るとHPが3%回復する', heal: 0.03, statusCut: 0 },
        skill: { name: 'アクアヒール', desc: 'HPを35%回復し、毒・やけどを消す。次の攻撃が1.5倍', heal: 0.35, boost: 1.5, barrier: 0, charge: 1 },
      },
      {
        trait: { name: 'うるおいボディ+', desc: 'ノーミスでHP3.5%回復。毒・やけどの時間が半分', heal: 0.035, statusCut: 0.5 },
        skill: { name: 'アクアヒール+', desc: 'HPを40%回復して状態異常を消す。次の攻撃が1.8倍。ゲージ+10%', heal: 0.4, boost: 1.8, barrier: 0, charge: 1.1 },
      },
      {
        trait: { name: 'キングのうるおい', desc: 'ノーミスでHP4%回復。毒・やけど・氷が効かない', heal: 0.04, statusCut: 1 },
        skill: { name: 'ロイヤルアクア', desc: 'HPを42%回復。次の攻撃が2.2倍。水のバリアで1回防ぐ。ゲージ+15%', heal: 0.42, boost: 2.2, barrier: 1, charge: 1.15 },
      },
      {
        trait: { name: '潮騒の恵み', desc: 'ノーミスでHP4.5%回復。状態異常が効かない', heal: 0.045, statusCut: 1 },
        skill: { name: 'タイダルウェーブ', desc: 'HPを44%回復。次の攻撃が2.5倍。バリア1回。ゲージ+25%', heal: 0.44, boost: 2.5, barrier: 1, charge: 1.25 },
      },
      {
        trait: { name: '海の神', desc: 'ノーミスでHP6%回復。状態異常が効かない', heal: 0.06, statusCut: 1 },
        skill: { name: 'リヴァイアサン', desc: 'HPを46%回復。次の攻撃が2.8倍。バリア2回。ゲージ+30%', heal: 0.46, boost: 2.8, barrier: 2, charge: 1.3 },
      },
    ],
  },
  piriri: {
    id: 'piriri',
    names: ['ぴりり', 'ぴりりん', 'ライジンぴりり', 'サンダーロード', 'ゼウスぴりり'],
    type: '電気',
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
    desc: 'いつもビリビリしている雷スライム。打つのが速いほど強くなる。',
    forms: [
      {
        trait: { name: '電光石火', desc: 'お題を速く打ち切るほど会心率アップ（最大55%・会心1.5倍）', critMax: 0.55, critMult: 1.5, dodge: 0, shockImmune: false },
        skill: { name: 'サンダーボルト', desc: '威力230の雷を落とす', power: 230, resetGauge: false, charge: 1 },
      },
      {
        trait: { name: '電光石火+', desc: '会心率最大62%・会心1.6倍。10%の確率で攻撃をよける', critMax: 0.62, critMult: 1.6, dodge: 0.1, shockImmune: false },
        skill: { name: 'ギガボルト', desc: '威力300の大稲妻。ゲージ+5%', power: 300, resetGauge: false, charge: 1.05 },
      },
      {
        trait: { name: 'ライジン', desc: '会心率最大68%・会心1.7倍。20%でよける。しびれが効かない', critMax: 0.68, critMult: 1.7, dodge: 0.2, shockImmune: true },
        skill: { name: 'ライジンサンダー', desc: '威力370。敵の攻撃ゲージを0に戻す。ゲージ+10%', power: 370, resetGauge: true, charge: 1.1 },
      },
      {
        trait: { name: '雷鳴の速さ', desc: '会心率最大72%・会心1.8倍。25%でよける。しびれが効かない', critMax: 0.72, critMult: 1.8, dodge: 0.25, shockImmune: true },
        skill: { name: 'ボルテックス', desc: '威力440。攻撃ゲージを0に。ゲージ+15%', power: 440, resetGauge: true, charge: 1.15 },
      },
      {
        trait: { name: '雷の神', desc: '会心率最大76%・会心1.9倍。30%でよける。しびれが効かない', critMax: 0.76, critMult: 1.9, dodge: 0.3, shockImmune: true },
        skill: { name: 'ゼウスのいかずち', desc: '威力510。攻撃ゲージを0に。ゲージ+20%', power: 510, resetGauge: true, charge: 1.2 },
      },
    ],
  },
  gotsun: {
    id: 'gotsun',
    names: ['ごつん', 'ごつごつん', 'ガンセキごつん', 'ダイヤごつん', 'タイタンごつん'],
    type: '岩',
    role: '防御型',
    colors: { main: '#b08a64', light: '#dcc3a3', dark: '#6e5238', accent: '#9be7a0' },
    stageColors: [
      { main: '#b08a64', light: '#dcc3a3', dark: '#6e5238', accent: '#9be7a0' },
      { main: '#8f959e', light: '#d6dae0', dark: '#50565e', accent: '#8fe08a' },
      { main: '#5b5f78', light: '#a4aac6', dark: '#2b2e42', accent: '#c58bff' },
      { main: '#a5d8ff', light: '#ffffff', dark: '#4c6ef5', accent: '#e599f7' },
      { main: '#495057', light: '#adb5bd', dark: '#212529', accent: '#ffd43b' },
    ],
    base: { hp: 83, atk: 55, def: 74, spd: 45 },
    desc: '硬くて重たい岩スライム。のんびり屋だけど、とにかくタフ。',
    forms: [
      {
        trait: { name: '硬い体', desc: '受けるダメージ15%カット。ミスしてもコンボが半分残る。毒・やけどの時間が4割短い', cut: 0.15, comboKeep: 0.5, freezeImmune: false },
        skill: { name: 'ロックシールド', desc: '敵の攻撃を2回防ぎ、そのたびに威力80の岩で反撃', guards: 2, power: 80, heal: 0, charge: 1 },
      },
      {
        trait: { name: '頑丈ボディ', desc: '受けるダメージ16%カット。ミスしてもコンボが6割残る。毒・やけどの時間が4割短い', cut: 0.16, comboKeep: 0.6, freezeImmune: false },
        skill: { name: 'ロックシールド+', desc: '2回防ぎ、威力110で反撃。防ぐたびにHP2%回復', guards: 2, power: 110, heal: 0.02, charge: 1 },
      },
      {
        trait: { name: '岩石のよろい', desc: '受けるダメージ17%カット。コンボが7割残る。氷・やけどが効かない', cut: 0.17, comboKeep: 0.7, freezeImmune: true },
        skill: { name: '岩石とりで', desc: '2回防ぎ、威力140で反撃。防ぐたびにHP3%回復', guards: 2, power: 140, heal: 0.03, charge: 1 },
      },
      {
        trait: { name: 'ダイヤの体', desc: '受けるダメージ17%カット。コンボが8割残る。氷・やけどが効かない', cut: 0.17, comboKeep: 0.8, freezeImmune: true },
        skill: { name: 'ダイヤモンドウォール', desc: '2回防ぎ、威力160で反撃。防ぐたびにHP3%回復', guards: 2, power: 160, heal: 0.03, charge: 1 },
      },
      {
        trait: { name: '巨人の力', desc: '受けるダメージ18%カット。コンボが9割残る。氷・やけどが効かない', cut: 0.18, comboKeep: 0.9, freezeImmune: true },
        skill: { name: 'タイタンフォートレス', desc: '2回防ぎ、威力180で反撃。防ぐたびにHP4%回復', guards: 2, power: 180, heal: 0.04, charge: 1 },
      },
    ],
  },
  homura: {
    id: 'homura',
    names: ['ほむら', 'ほむらん', 'フレイムほむら', 'インフェルノ', 'フェニックスほむら'],
    type: '炎',
    role: '攻撃型',
    colors: { main: '#ff6b35', light: '#ffd8a8', dark: '#c92a2a', accent: '#ffe066' },
    stageColors: [
      { main: '#ff6b35', light: '#ffd8a8', dark: '#c92a2a', accent: '#ffe066' },
      { main: '#ff922b', light: '#ffe8cc', dark: '#d9480f', accent: '#fff3bf' },
      { main: '#f03e3e', light: '#ffc9c9', dark: '#862e2e', accent: '#ffd43b' },
      { main: '#e8590c', light: '#ffec99', dark: '#5c1a00', accent: '#ff8787' },
      { main: '#fab005', light: '#fff9db', dark: '#c92a2a', accent: '#ff6b6b' },
    ],
    base: { hp: 78, atk: 98, def: 64, spd: 75 },
    desc: '熱い心の炎スライム。コンボが続くほど手がつけられなくなる。',
    forms: [
      {
        trait: { name: '熱血', desc: 'コンボ倍率の上限が1.7倍に上がる（普通は1.5倍）。やけどが効かない', burnImmune: true, statusCut: 0, comboMax: 140 },
        skill: { name: 'ファイアブレス', desc: '威力220の炎。敵を5秒間やけど（毎秒HP3%ダメージ）', power: 220, burn: 5, charge: 1 },
      },
      {
        trait: { name: '熱血+', desc: 'コンボ倍率の上限が1.8倍。やけどが効かない', burnImmune: true, statusCut: 0, comboMax: 160 },
        skill: { name: 'フレイムバースト', desc: '威力300。敵を6秒間やけど。ゲージ+5%', power: 300, burn: 6, charge: 1.05 },
      },
      {
        trait: { name: '燃え上がる魂', desc: 'コンボ倍率の上限が1.9倍。やけどが効かない。毒の時間が半分', burnImmune: true, statusCut: 0.5, comboMax: 180 },
        skill: { name: 'ボルケーノ', desc: '威力380。敵を7秒間やけど。ゲージ+10%', power: 380, burn: 7, charge: 1.1 },
      },
      {
        trait: { name: '業火', desc: 'コンボ倍率の上限が2.0倍。やけどが効かない。毒の時間が半分', burnImmune: true, statusCut: 0.5, comboMax: 200 },
        skill: { name: 'インフェルノ', desc: '威力460。敵を8秒間やけど。ゲージ+15%', power: 460, burn: 8, charge: 1.15 },
      },
      {
        trait: { name: '不死鳥', desc: 'コンボ倍率の上限が2.1倍。やけど・毒が効かない', burnImmune: true, statusCut: 1, comboMax: 220 },
        skill: { name: 'フェニックスフレア', desc: '威力540。敵を9秒間やけど。ゲージ+20%', power: 540, burn: 9, charge: 1.2 },
      },
    ],
  },
  moririn: {
    id: 'moririn',
    names: ['もりりん', 'もりもりん', 'ジャングルもりりん', 'せいれいもりりん', 'ユグドラもりりん'],
    type: '草',
    role: '回復型',
    colors: { main: '#51cf66', light: '#d3f9d8', dark: '#2b8a3e', accent: '#ffd43b' },
    stageColors: [
      { main: '#51cf66', light: '#d3f9d8', dark: '#2b8a3e', accent: '#ffd43b' },
      { main: '#40c057', light: '#ebfbee', dark: '#1b5e20', accent: '#ff8fab' },
      { main: '#2f9e44', light: '#b2f2bb', dark: '#0b3d16', accent: '#ffe066' },
      { main: '#20c997', light: '#c3fae8', dark: '#087f5b', accent: '#fff3bf' },
      { main: '#94d82d', light: '#f4fce3', dark: '#2b8a3e', accent: '#ffd43b' },
    ],
    base: { hp: 84, atk: 69, def: 71, spd: 60 },
    desc: '森に住む草スライム。日なたぼっこでいつの間にか元気になる。',
    forms: [
      {
        trait: { name: '光合成', desc: '3秒ごとにHPが1%回復する', regen: 0.01, statusCut: 0 },
        skill: { name: '宿り木のタネ', desc: '威力160で攻撃し、自分のHPを20%回復', power: 160, heal: 0.2, charge: 1 },
      },
      {
        trait: { name: '光合成+', desc: '3秒ごとにHPが1.2%回復。毒・やけどの時間が半分', regen: 0.012, statusCut: 0.5 },
        skill: { name: 'ギガドレイン', desc: '威力220で攻撃し、HPを22%回復', power: 220, heal: 0.22, charge: 1.05 },
      },
      {
        trait: { name: '森の恵み', desc: '3秒ごとにHPが1.4%回復。毒・やけど・氷が効かない', regen: 0.014, statusCut: 1 },
        skill: { name: 'ジャングルドレイン', desc: '威力280で攻撃し、HPを24%回復。ゲージ+10%', power: 280, heal: 0.24, charge: 1.1 },
      },
      {
        trait: { name: '精霊の息吹', desc: '3秒ごとにHPが1.6%回復。状態異常が効かない', regen: 0.016, statusCut: 1 },
        skill: { name: '精霊のしずく', desc: '威力340で攻撃し、HPを26%回復。ゲージ+15%', power: 340, heal: 0.26, charge: 1.15 },
      },
      {
        trait: { name: '世界樹', desc: '3秒ごとにHPが1.8%回復。状態異常が効かない', regen: 0.018, statusCut: 1 },
        skill: { name: 'ユグドラシル', desc: '威力400で攻撃し、HPを28%回復。ゲージ+20%', power: 400, heal: 0.28, charge: 1.2 },
      },
    ],
  },
  kagemaru: {
    id: 'kagemaru',
    names: ['かげまる', 'かげまるん', 'シャドウかげまる', 'ナイトメア', 'ダークロードかげまる'],
    type: '影',
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
    desc: '影に隠れる忍者スライム。正確に打つほど敵の動きを鈍らせる。',
    forms: [
      {
        trait: { name: '影ぬい', desc: '影で敵の足を縛り、敵の攻撃が12%遅くなる', slow: 0.12 },
        skill: { name: 'シャドウバインド', desc: '威力150で攻撃し、敵の攻撃ゲージを4秒間止める。ゲージ+10%', power: 150, bind: 4, charge: 1.1 },
      },
      {
        trait: { name: '影ぬい+', desc: '影で敵の足を縛り、敵の攻撃が15%遅くなる', slow: 0.15 },
        skill: { name: '影縛り', desc: '威力210。敵を4.5秒間止める。ゲージ+15%', power: 210, bind: 4.5, charge: 1.15 },
      },
      {
        trait: { name: '闇の忍び', desc: '影で敵の足を縛り、敵の攻撃が18%遅くなる', slow: 0.18 },
        skill: { name: 'シャドウロック', desc: '威力270。敵を5秒間止める。ゲージ+20%', power: 270, bind: 5, charge: 1.2 },
      },
      {
        trait: { name: '悪夢', desc: '影で敵の足を縛り、敵の攻撃が21%遅くなる', slow: 0.21 },
        skill: { name: 'ナイトメアバインド', desc: '威力330。敵を5.5秒間止める。ゲージ+25%', power: 330, bind: 5.5, charge: 1.25 },
      },
      {
        trait: { name: '闇の王', desc: '影で敵の足を縛り、敵の攻撃が24%遅くなる', slow: 0.24 },
        skill: { name: 'ダークエンド', desc: '威力390。敵を6秒間止める。ゲージ+30%', power: 390, bind: 6, charge: 1.3 },
      },
    ],
  },
  // ---- ここから ガチャ限定のキャラ (ガチャで出るまで つかえない) ----
  ryumaru: {
    id: 'ryumaru',
    gacha: true,
    names: ['りゅうまる', 'りゅうりゅん', 'ドラゴまる', 'ワイバーンまる', 'りゅうじんまる'],
    type: 'ドラゴン',
    role: '逆転型',
    colors: { main: '#e8590c', light: '#ffd8a8', dark: '#7c2d12', accent: '#ffd43b' },
    stageColors: [
      { main: '#e8590c', light: '#ffd8a8', dark: '#7c2d12', accent: '#ffd43b' },
      { main: '#d6336c', light: '#ffdeeb', dark: '#6b1030', accent: '#ffd43b' },
      { main: '#ae3ec9', light: '#f3d9fa', dark: '#4a1260', accent: '#ffe066' },
      { main: '#c92a2a', light: '#ffc9c9', dark: '#4d0a0a', accent: '#ffd43b' },
      { main: '#1c7ed6', light: '#d0ebff', dark: '#0b2c55', accent: '#ffd43b' },
    ],
    base: { hp: 82, atk: 88, def: 65, spd: 60 },
    desc: '竜の血を引くスライム。ピンチになるほど力がわいてくる。',
    forms: [
      {
        trait: { name: '竜の怒り', desc: 'HPが半分を切ると攻撃1.2倍', rageAt: 0.5, rageMult: 1.2, statusCut: 0 },
        skill: { name: 'ドラゴンブレス', desc: '威力230のブレス。自分のHPが減っているほど強い（最大1.6倍）', power: 230, lowBoost: 0.6, charge: 1 },
      },
      {
        trait: { name: '竜の怒り+', desc: 'HPが半分を切ると攻撃1.25倍。やけどの時間が半分', rageAt: 0.5, rageMult: 1.25, statusCut: 0.5 },
        skill: { name: 'ドラゴンブレス+', desc: '威力310。HPが減っているほど強い（最大1.7倍）。ゲージ+5%', power: 310, lowBoost: 0.7, charge: 1.05 },
      },
      {
        trait: { name: '逆鱗', desc: 'HPが6割を切ると攻撃1.3倍。毒・やけどの時間が半分', rageAt: 0.6, rageMult: 1.3, statusCut: 0.5 },
        skill: { name: 'ドラゴンダイブ', desc: '威力390。HPが減っているほど強い（最大1.8倍）。ゲージ+10%', power: 390, lowBoost: 0.8, charge: 1.1 },
      },
      {
        trait: { name: '飛竜', desc: 'HPが6割を切ると攻撃1.35倍。毒・やけど・氷が効かない', rageAt: 0.6, rageMult: 1.35, statusCut: 1 },
        skill: { name: 'ワイバーンストーム', desc: '威力470。HPが減っているほど強い（最大1.9倍）。ゲージ+15%', power: 470, lowBoost: 0.9, charge: 1.15 },
      },
      {
        trait: { name: '竜神', desc: 'HPが7割を切ると攻撃1.4倍。状態異常が効かない', rageAt: 0.7, rageMult: 1.4, statusCut: 1 },
        skill: { name: '竜神の裁き', desc: '威力550。HPが減っているほど強い（最大2倍）。ゲージ+20%', power: 550, lowBoost: 1.0, charge: 1.2 },
      },
    ],
  },
  kirari: {
    id: 'kirari',
    gacha: true,
    names: ['きらり', 'きららん', 'プリズムきらり', 'ステラきらり', 'ルミナスきらり'],
    type: '光',
    role: '連続型',
    colors: { main: '#f783ac', light: '#fff0f6', dark: '#a61e4d', accent: '#fff3bf' },
    stageColors: [
      { main: '#f783ac', light: '#fff0f6', dark: '#a61e4d', accent: '#fff3bf' },
      { main: '#faa2c1', light: '#ffffff', dark: '#c2255c', accent: '#99e9f2' },
      { main: '#b197fc', light: '#f3f0ff', dark: '#5f3dc4', accent: '#ffec99' },
      { main: '#66d9e8', light: '#ffffff', dark: '#0b7285', accent: '#fcc2d7' },
      { main: '#fff3bf', light: '#ffffff', dark: '#e67700', accent: '#f783ac' },
    ],
    base: { hp: 82, atk: 101, def: 69, spd: 90 },
    desc: '星から落ちてきた光のスライム。ノーミスが続くほど輝きを増す。',
    forms: [
      {
        trait: { name: 'きらきらリズム', desc: 'ノーミスでお題を打ち切るたび攻撃+5%（最大+25%）。ミスで元に戻る', streakStep: 0.05, streakMax: 0.25 },
        skill: { name: 'スターシュート', desc: '威力220の星を飛ばす。きらきらリズムのボーナスも乗る', power: 220, barrier: 0, charge: 1 },
      },
      {
        trait: { name: 'きらきらリズム+', desc: 'ノーミスで1回ごとに+5%（最大+30%）', streakStep: 0.05, streakMax: 0.3 },
        skill: { name: 'スターシャワー', desc: '威力300。リズムのボーナスも乗る。ゲージ+5%', power: 300, barrier: 0, charge: 1.05 },
      },
      {
        trait: { name: 'プリズムリズム', desc: 'ノーミスで1回ごとに+6%（最大+36%）', streakStep: 0.06, streakMax: 0.36 },
        skill: { name: 'プリズムレイ', desc: '威力370。リズムのボーナスも乗り、光の壁で1回防ぐ。ゲージ+10%', power: 370, barrier: 1, charge: 1.1 },
      },
      {
        trait: { name: '星のリズム', desc: 'ノーミスで1回ごとに+6%（最大+42%）', streakStep: 0.06, streakMax: 0.42 },
        skill: { name: 'ステラノヴァ', desc: '威力440。リズムのボーナスも乗り、壁で1回防ぐ。ゲージ+15%', power: 440, barrier: 1, charge: 1.15 },
      },
      {
        trait: { name: '銀河のリズム', desc: 'ノーミスで1回ごとに+7%（最大+49%）', streakStep: 0.07, streakMax: 0.49 },
        skill: { name: 'ルミナスギャラクシー', desc: '威力510。リズムのボーナスも乗り、壁で2回防ぐ。ゲージ+20%', power: 510, barrier: 2, charge: 1.2 },
      },
    ],
  },
  koorin: {
    id: 'koorin',
    gacha: true,
    names: ['こおりん', 'こおりりん', 'フロストこおりん', 'ブリザードこおりん', 'ダイヤモンドこおりん'],
    type: '氷',
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
    desc: '氷の結晶から生まれたスライム。攻撃されるとひんやりやり返す。',
    forms: [
      { trait: { name: 'ひんやりボディ', desc: '攻撃を受けると25%で敵の攻撃ゲージを35%戻す', counter: 0.25, pushback: 0.35, statusCut: 0 },
        skill: { name: 'ダイヤモンドダスト', desc: '威力200。敵を4秒こごえさせ、攻撃ゲージが半分の速さに', power: 200, chill: 4, charge: 1 } },
      { trait: { name: 'ひんやりボディ+', desc: '30%で攻撃ゲージを35%戻す。毒・やけどの時間が半分', counter: 0.3, pushback: 0.35, statusCut: 0.5 },
        skill: { name: 'ダイヤモンドダスト+', desc: '威力270。4.5秒こごえさせる。ゲージ+5%', power: 270, chill: 4.5, charge: 1.05 } },
      { trait: { name: 'フロストアーマー', desc: '35%で攻撃ゲージを40%戻す。状態異常が効かない', counter: 0.35, pushback: 0.4, statusCut: 1 },
        skill: { name: 'フロストノヴァ', desc: '威力340。5秒こごえさせる。ゲージ+10%', power: 340, chill: 5, charge: 1.1 } },
      { trait: { name: 'ブリザードアーマー', desc: '40%で攻撃ゲージを40%戻す。状態異常が効かない', counter: 0.4, pushback: 0.4, statusCut: 1 },
        skill: { name: 'ブリザード', desc: '威力410。5.5秒こごえさせる。ゲージ+15%', power: 410, chill: 5.5, charge: 1.15 } },
      { trait: { name: '永久凍土', desc: '45%で攻撃ゲージを45%戻す。状態異常が効かない', counter: 0.45, pushback: 0.45, statusCut: 1 },
        skill: { name: 'アブソリュートゼロ', desc: '威力480。6秒こごえさせる。ゲージ+20%', power: 480, chill: 6, charge: 1.2 } },
    ],
  },
  fuwari: {
    id: 'fuwari',
    gacha: true,
    names: ['ふわり', 'ふわりん', 'ウィンドふわり', 'ストームふわり', 'テンペストふわり'],
    type: '風',
    role: '連撃型',
    colors: { main: '#96f2d7', light: '#f0fff9', dark: '#0ca678', accent: '#ffffff' },
    stageColors: [
      { main: '#96f2d7', light: '#f0fff9', dark: '#0ca678', accent: '#ffffff' },
      { main: '#8ce99a', light: '#ebfbee', dark: '#2b8a3e', accent: '#fff3bf' },
      { main: '#63e6be', light: '#e6fcf5', dark: '#087f5b', accent: '#e3fafc' },
      { main: '#38d9a9', light: '#ffffff', dark: '#054d3b', accent: '#fff3bf' },
      { main: '#c3fae8', light: '#ffffff', dark: '#0ca678', accent: '#ffd43b' },
    ],
    base: { hp: 74, atk: 91, def: 62, spd: 98 },
    desc: '風に乗って漂うスライム。素早く2回攻撃することがある。',
    forms: [
      { trait: { name: '追い風', desc: 'お題を打ち切ると15%でもう1回追い打ち（50%のダメージ）', double: 0.15, statusCut: 0 },
        skill: { name: 'エアスラッシュ', desc: '威力200。敵の攻撃を1回よける', power: 200, evade: 1, charge: 1 } },
      { trait: { name: '追い風+', desc: '20%で追い打ち', double: 0.2, statusCut: 0 },
        skill: { name: 'エアスラッシュ+', desc: '威力270。1回よける。ゲージ+5%', power: 270, evade: 1, charge: 1.05 } },
      { trait: { name: '疾風', desc: '25%で追い打ち。毒・やけどの時間が半分', double: 0.25, statusCut: 0.5 },
        skill: { name: 'ストームエッジ', desc: '威力340。2回よける。ゲージ+10%', power: 340, evade: 2, charge: 1.1 } },
      { trait: { name: 'はやて', desc: '30%で追い打ち。毒・やけどの時間が半分', double: 0.3, statusCut: 0.5 },
        skill: { name: 'テンペスト', desc: '威力410。2回よける。ゲージ+15%', power: 410, evade: 2, charge: 1.15 } },
      { trait: { name: '神風', desc: '35%で追い打ち。状態異常が効かない', double: 0.35, statusCut: 1 },
        skill: { name: 'ゴッドウィンド', desc: '威力480。3回よける。ゲージ+20%', power: 480, evade: 3, charge: 1.2 } },
    ],
  },
  metarun: {
    id: 'metarun',
    gacha: true,
    names: ['メタルン', 'メタルルン', 'アイアンメタルン', 'スチールメタルン', 'アダマンメタルン'],
    type: '鋼',
    role: 'ため打ち型',
    colors: { main: '#adb5bd', light: '#f8f9fa', dark: '#495057', accent: '#ffd43b' },
    stageColors: [
      { main: '#adb5bd', light: '#f8f9fa', dark: '#495057', accent: '#ffd43b' },
      { main: '#ced4da', light: '#ffffff', dark: '#343a40', accent: '#ff922b' },
      { main: '#868e96', light: '#dee2e6', dark: '#212529', accent: '#4dabf7' },
      { main: '#5c7cfa', light: '#dbe4ff', dark: '#1c2c80', accent: '#ffd43b' },
      { main: '#e9ecef', light: '#ffffff', dark: '#5f3dc4', accent: '#ffd43b' },
    ],
    base: { hp: 78, atk: 82, def: 77, spd: 45 },
    desc: '鉄でできた重たいスライム。長いお題を打つほどパワーがたまる。',
    forms: [
      { trait: { name: 'ため打ち', desc: '9キー以上のお題は1キー増えるごとに+3%（最大+30%）', longFrom: 8, longStep: 0.03, longMax: 0.3, pierce: false, statusCut: 0 },
        skill: { name: 'メタルブレイク', desc: '威力210。敵を5秒ブレイク（受けるダメージ+30%）', power: 210, brk: 5, charge: 1 } },
      { trait: { name: 'ため打ち+', desc: '1キーごとに+3%（最大+35%）', longFrom: 8, longStep: 0.03, longMax: 0.35, pierce: false, statusCut: 0.5 },
        skill: { name: 'メタルブレイク+', desc: '威力280。5.5秒ブレイク。ゲージ+5%', power: 280, brk: 5.5, charge: 1.05 } },
      { trait: { name: '鉄拳', desc: '1キーごとに+3%（最大+40%）。よろい・ガードを半分貫く', longFrom: 8, longStep: 0.03, longMax: 0.4, pierce: true, statusCut: 0.5 },
        skill: { name: 'アイアンクラッシュ', desc: '威力350。6秒ブレイク。ゲージ+10%', power: 350, brk: 6, charge: 1.1 } },
      { trait: { name: '鋼鉄', desc: '1キーごとに+3%（最大+45%）。よろい・ガードを半分貫く', longFrom: 8, longStep: 0.03, longMax: 0.45, pierce: true, statusCut: 1 },
        skill: { name: 'スチールクラッシュ', desc: '威力420。6.5秒ブレイク。ゲージ+15%', power: 420, brk: 6.5, charge: 1.15 } },
      { trait: { name: 'アダマンタイト', desc: '1キーごとに+3%（最大+50%）。よろい・ガードを半分貫く', longFrom: 8, longStep: 0.03, longMax: 0.5, pierce: true, statusCut: 1 },
        skill: { name: 'アダマンブレイク', desc: '威力490。7秒ブレイク。ゲージ+20%', power: 490, brk: 7, charge: 1.2 } },
    ],
  },
  // ---- ここから しょうごうで ひらく キャラ ----
  onpuru: {
    id: 'onpuru',
    title: 'kpm250',
    names: ['おんぷる', 'おんぷるる', 'リズムおんぷる', 'ビートおんぷる', 'シンフォニーおんぷる'],
    type: '音',
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
    desc: 'リズムに乗って弾む音のスライム。速く打つほどノリノリになる。',
    forms: [
      { trait: { name: 'アップテンポ', desc: '1秒に5打より速くお題を打つと、1打速いごとに攻撃+8%（最大+24%）', speedFrom: 5, speedStep: 0.08, speedMax: 0.24, statusCut: 0 },
        skill: { name: 'ソニックビート', desc: '威力200。次の3お題の攻撃が1.4倍', power: 200, tempo: 3, tempoMult: 1.4, charge: 1 } },
      { trait: { name: 'アップテンポ+', desc: '1打速いごとに+8%（最大+30%）', speedFrom: 5, speedStep: 0.08, speedMax: 0.3, statusCut: 0 },
        skill: { name: 'ソニックビート+', desc: '威力270。次の3お題が1.45倍。ゲージ+5%', power: 270, tempo: 3, tempoMult: 1.45, charge: 1.05 } },
      { trait: { name: 'ハイテンポ', desc: '1打速いごとに+9%（最大+36%）。毒・やけどの時間が半分', speedFrom: 5, speedStep: 0.09, speedMax: 0.36, statusCut: 0.5 },
        skill: { name: 'ビートラッシュ', desc: '威力340。次の4お題が1.5倍。ゲージ+10%', power: 340, tempo: 4, tempoMult: 1.5, charge: 1.1 } },
      { trait: { name: 'プレスト', desc: '1打速いごとに+9%（最大+42%）。毒・やけどの時間が半分', speedFrom: 5, speedStep: 0.09, speedMax: 0.42, statusCut: 0.5 },
        skill: { name: 'フォルテッシモ', desc: '威力410。次の4お題が1.55倍。ゲージ+15%', power: 410, tempo: 4, tempoMult: 1.55, charge: 1.15 } },
      { trait: { name: 'ヴィヴァーチェ', desc: '1打速いごとに+10%（最大+48%）。状態異常が効かない', speedFrom: 5, speedStep: 0.1, speedMax: 0.48, statusCut: 1 },
        skill: { name: 'グランドフィナーレ', desc: '威力480。次の5お題が1.6倍。ゲージ+20%', power: 480, tempo: 5, tempoMult: 1.6, charge: 1.2 } },
    ],
  },
  pitarin: {
    id: 'pitarin',
    title: 'acc100',
    names: ['ぴたりん', 'ぴたぴたりん', 'ムーンぴたりん', 'クレセントぴたりん', 'フルムーンぴたりん'],
    type: '月',
    role: '正確型',
    colors: { main: '#91a7ff', light: '#edf2ff', dark: '#364fc7', accent: '#ffe066' },
    stageColors: [
      { main: '#91a7ff', light: '#edf2ff', dark: '#364fc7', accent: '#ffe066' },
      { main: '#748ffc', light: '#dbe4ff', dark: '#1c2c80', accent: '#fff3bf' },
      { main: '#5c7cfa', light: '#e7f5ff', dark: '#0b1a5c', accent: '#ffd43b' },
      { main: '#3b5bdb', light: '#bac8ff', dark: '#060e3a', accent: '#ffe066' },
      { main: '#e7f5ff', light: '#ffffff', dark: '#364fc7', accent: '#ffd43b' },
    ],
    base: { hp: 75, atk: 82, def: 65, spd: 70 },
    desc: '月の光を浴びた静かなスライム。間違えずに打つと必ず急所を突く。',
    forms: [
      { trait: { name: '見切りの一撃', desc: 'ノーミスで打ち切ったお題は必ず会心（1.3倍）', perfectCrit: 1.3, statusCut: 0 },
        skill: { name: 'ムーンリフレクト', desc: '威力190。次の敵の攻撃を1回はね返す', power: 190, reflect: 1, charge: 1 } },
      { trait: { name: '見切りの一撃+', desc: 'ノーミスは必ず会心（1.35倍）', perfectCrit: 1.35, statusCut: 0 },
        skill: { name: 'ムーンリフレクト+', desc: '威力260。1回はね返す。ゲージ+5%', power: 260, reflect: 1, charge: 1.05 } },
      { trait: { name: '月夜の見切り', desc: 'ノーミスは必ず会心（1.4倍）。毒・やけどの時間が半分', perfectCrit: 1.4, statusCut: 0.5 },
        skill: { name: 'クレセントミラー', desc: '威力330。2回はね返す。ゲージ+10%', power: 330, reflect: 2, charge: 1.1 } },
      { trait: { name: '月光の見切り', desc: 'ノーミスは必ず会心（1.45倍）。毒・やけどの時間が半分', perfectCrit: 1.45, statusCut: 0.5 },
        skill: { name: 'ルナミラー', desc: '威力400。2回はね返す。ゲージ+15%', power: 400, reflect: 2, charge: 1.15 } },
      { trait: { name: '満月の見切り', desc: 'ノーミスは必ず会心（1.5倍）。状態異常が効かない', perfectCrit: 1.5, statusCut: 1 },
        skill: { name: 'フルムーンミラー', desc: '威力470。3回はね返す。ゲージ+20%', power: 470, reflect: 3, charge: 1.2 } },
    ],
  },
  // ---- v5.3: ガチャ限定 1 たい・かくしステージ 2 たい・とびらの ミッション 1 たい ----
  dororin: {
    id: 'dororin',
    gacha: true,
    names: ['どろりん', 'どろどろりん', 'ポイズンどろりん', 'ベノムどろりん', 'カオスどろりん'],
    type: '毒', role: 'じわじわ型',
    colors: { main: '#9775fa', light: '#e5dbff', dark: '#3b1c8c', accent: '#8ce99a' },
    stageColors: [
      { main: '#9775fa', light: '#e5dbff', dark: '#3b1c8c', accent: '#8ce99a' },
      { main: '#845ef7', light: '#d0bfff', dark: '#2b1a4a', accent: '#a9e34b' },
      { main: '#5f3dc4', light: '#b197fc', dark: '#1a0f3a', accent: '#94d82d' },
      { main: '#37b24d', light: '#b2f2bb', dark: '#0b3d16', accent: '#e599f7' },
      { main: '#212529', light: '#9775fa', dark: '#000000', accent: '#a9e34b' },
    ],
    base: { hp: 68, atk: 68, def: 60, spd: 75 },
    desc: '沼の底から生まれた毒のスライム。じわじわと敵を弱らせる。',
    forms: [
      { trait: { name: '毒のしずく', desc: 'お題を打ち切るたび敵に毒が1つ重なる（最大5）。1つごとに毎秒敵の最大HPの0.35%', poisonPct: 0.0035, poisonMax: 5, statusCut: 0.5 },
        skill: { name: '猛毒', desc: '威力180。毒+3。敵の攻撃を5秒20%弱く', power: 180, addPoison: 3, weaken: 5, charge: 1 } },
      { trait: { name: '毒のしずく+', desc: '毒最大6。1つ毎秒0.35%', poisonPct: 0.0035, poisonMax: 6, statusCut: 0.5 },
        skill: { name: '猛毒+', desc: '威力250。毒+3。5.5秒弱く。ゲージ+5%', power: 250, addPoison: 3, weaken: 5.5, charge: 1.05 } },
      { trait: { name: 'ポイズンボディ', desc: '毒最大7。1つ毎秒0.4%。毒・やけど・こごえが効かない', poisonPct: 0.004, poisonMax: 7, statusCut: 1 },
        skill: { name: 'ベノムショット', desc: '威力320。毒+4。6秒弱く。ゲージ+10%', power: 320, addPoison: 4, weaken: 6, charge: 1.1 } },
      { trait: { name: 'ベノムボディ', desc: '毒最大8。1つ毎秒0.4%。状態異常が効かない', poisonPct: 0.004, poisonMax: 8, statusCut: 1 },
        skill: { name: 'ベノムレイン', desc: '威力390。毒+4。6.5秒弱く。ゲージ+15%', power: 390, addPoison: 4, weaken: 6.5, charge: 1.15 } },
      { trait: { name: 'カオスボディ', desc: '毒最大9。1つ毎秒0.45%。状態異常が効かない', poisonPct: 0.0045, poisonMax: 9, statusCut: 1 },
        skill: { name: 'カオスミアズマ', desc: '威力460。毒+5。7秒弱く。ゲージ+20%', power: 460, addPoison: 5, weaken: 7, charge: 1.2 } },
    ],
  },
  gorurin: {
    id: 'gorurin',
    special: true,
    names: ['ゴルりん', 'ゴルゴルりん', 'ゴールドりん', 'プラチナりん', 'エンペラーゴルりん'],
    type: '金', role: '吸収型',
    colors: { main: '#fcc419', light: '#fff9db', dark: '#8a5a00', accent: '#ffffff' },
    stageColors: [
      { main: '#fcc419', light: '#fff9db', dark: '#8a5a00', accent: '#ffffff' },
      { main: '#fab005', light: '#fff3bf', dark: '#7a4a00', accent: '#ff6b6b' },
      { main: '#f59f00', light: '#ffec99', dark: '#5c3c00', accent: '#4dabf7' },
      { main: '#dee2e6', light: '#ffffff', dark: '#495057', accent: '#fcc419' },
      { main: '#ffd43b', light: '#ffffff', dark: '#5c3c00', accent: '#e64980' },
    ],
    base: { hp: 84, atk: 86, def: 74, spd: 64 },
    desc: '黄金ゴーレムが守っていた金色のスライム。攻撃で元気を吸い取る。',
    forms: [
      { trait: { name: 'ゴールドドレイン', desc: '与えたダメージの6%回復。バトルのコイン+20%', drain: 0.06, coinBonus: 0.2, statusCut: 0 },
        skill: { name: 'ゴールドラッシュ', desc: '威力200。与えたダメージの40%回復', power: 200, skillDrain: 0.4, charge: 1 } },
      { trait: { name: 'ゴールドドレイン+', desc: '7%回復。コイン+25%', drain: 0.07, coinBonus: 0.25, statusCut: 0 },
        skill: { name: 'ゴールドラッシュ+', desc: '威力270。45%回復。ゲージ+5%', power: 270, skillDrain: 0.45, charge: 1.05 } },
      { trait: { name: '黄金の体', desc: '8%回復。コイン+30%。毒・やけどの時間が半分', drain: 0.08, coinBonus: 0.3, statusCut: 0.5 },
        skill: { name: 'ゴールドストーム', desc: '威力340。50%回復。ゲージ+10%', power: 340, skillDrain: 0.5, charge: 1.1 } },
      { trait: { name: 'プラチナの体', desc: '9%回復。コイン+35%。毒・やけどの時間が半分', drain: 0.09, coinBonus: 0.35, statusCut: 0.5 },
        skill: { name: 'プラチナストーム', desc: '威力410。55%回復。ゲージ+15%', power: 410, skillDrain: 0.55, charge: 1.15 } },
      { trait: { name: '黄金の帝王', desc: '10%回復。コイン+40%。状態異常が効かない', drain: 0.1, coinBonus: 0.4, statusCut: 1 },
        skill: { name: 'エンペラーラッシュ', desc: '威力480。60%回復。ゲージ+20%', power: 480, skillDrain: 0.6, charge: 1.2 } },
    ],
  },
  yukidarun: {
    id: 'yukidarun',
    special: true,
    names: ['ゆきだるん', 'ゆきだるるん', 'スノーだるん', 'ブリザードだるん', 'ダイヤモンドだるん'],
    type: '雪', role: 'ため込み型',
    colors: { main: '#f8f9fa', light: '#ffffff', dark: '#74c0fc', accent: '#ff922b' },
    stageColors: [
      { main: '#f8f9fa', light: '#ffffff', dark: '#74c0fc', accent: '#ff922b' },
      { main: '#e7f5ff', light: '#ffffff', dark: '#4dabf7', accent: '#e03131' },
      { main: '#d0ebff', light: '#ffffff', dark: '#1c7ed6', accent: '#ff922b' },
      { main: '#a5d8ff', light: '#ffffff', dark: '#1864ab', accent: '#ffd43b' },
      { main: '#ffffff', light: '#ffffff', dark: '#3bc9db', accent: '#f783ac' },
    ],
    base: { hp: 94, atk: 78, def: 82, spd: 52 },
    desc: '氷の女王が残した雪のスライム。雪玉をためて身を守る。',
    forms: [
      { trait: { name: '雪玉アーマー', desc: 'お題を打ち切るたび雪玉+1（最大3）。1個につき受けるダメージ-6%。攻撃を受けると1個減る', snowMax: 3, snowCut: 0.06, statusCut: 0 },
        skill: { name: '雪玉ラッシュ', desc: '威力170。雪玉1個につき威力+25%', power: 170, snowBoost: 0.25, charge: 1 } },
      { trait: { name: '雪玉アーマー+', desc: '雪玉最大4', snowMax: 4, snowCut: 0.06, statusCut: 0.5 },
        skill: { name: '雪玉ラッシュ+', desc: '威力240。1個につき+25%。ゲージ+5%', power: 240, snowBoost: 0.25, charge: 1.05 } },
      { trait: { name: 'スノーアーマー', desc: '雪玉最大4。1個-7%。こごえが効かない', snowMax: 4, snowCut: 0.07, statusCut: 1 },
        skill: { name: 'スノーボム', desc: '威力300。1個につき+30%。ゲージ+10%', power: 300, snowBoost: 0.3, charge: 1.1 } },
      { trait: { name: 'ブリザードアーマー', desc: '雪玉最大5。1個-7%。状態異常が効かない', snowMax: 5, snowCut: 0.07, statusCut: 1 },
        skill: { name: 'ブリザードボム', desc: '威力360。1個につき+30%。ゲージ+15%', power: 360, snowBoost: 0.3, charge: 1.15 } },
      { trait: { name: 'ダイヤモンドアーマー', desc: '雪玉最大5。1個-8%。状態異常が効かない', snowMax: 5, snowCut: 0.08, statusCut: 1 },
        skill: { name: 'ダイヤモンドボム', desc: '威力420。1個につき+35%。ゲージ+20%', power: 420, snowBoost: 0.35, charge: 1.2 } },
    ],
  },
  yuusharin: {
    id: 'yuusharin',
    special: true,
    names: ['ゆうしゃりん', 'ゆうしゃりんりん', '聖剣ゆうしゃりん', 'えいゆうりん', '伝説のゆうしゃりん'],
    type: '伝説', role: 'オールラウンド型',
    colors: { main: '#4dabf7', light: '#e7f5ff', dark: '#1864ab', accent: '#ffd43b' },
    stageColors: [
      { main: '#4dabf7', light: '#e7f5ff', dark: '#1864ab', accent: '#ffd43b' },
      { main: '#339af0', light: '#d0ebff', dark: '#0b3d6b', accent: '#ff6b6b' },
      { main: '#228be6', light: '#a5d8ff', dark: '#082d52', accent: '#ffd43b' },
      { main: '#e03131', light: '#ffc9c9', dark: '#5c0f0f', accent: '#ffd43b' },
      { main: '#fff3bf', light: '#ffffff', dark: '#b8860b', accent: '#4dabf7' },
    ],
    base: { hp: 78, atk: 82, def: 69, spd: 72 },
    desc: '難しい称号を集めた者の前に現れる勇者のスライム。何でもできる。',
    forms: [
      { trait: { name: '勇者の心得', desc: '会心率12%・ダメージ6%カット・コンボ倍率の上限1.55倍', crit: 0.12, cut: 0.06, comboMax: 110, statusCut: 0 },
        skill: { name: '勇者の一撃', desc: '威力200。HP12%回復。敵の攻撃ゲージを0に', power: 200, heal: 0.12, charge: 1 } },
      { trait: { name: '勇者の心得+', desc: '会心率14%・カット7%・上限1.6倍', crit: 0.14, cut: 0.07, comboMax: 120, statusCut: 0.5 },
        skill: { name: '勇者の一撃+', desc: '威力260。HP13%回復。ゲージを0に。ゲージ+5%', power: 260, heal: 0.13, charge: 1.05 } },
      { trait: { name: '聖剣の誓い', desc: '会心率16%・カット8%・上限1.65倍。毒・やけどの時間が半分', crit: 0.16, cut: 0.08, comboMax: 130, statusCut: 0.5 },
        skill: { name: '聖剣斬り', desc: '威力320。HP14%回復。ゲージを0に。ゲージ+10%', power: 320, heal: 0.14, charge: 1.1 } },
      { trait: { name: '英雄の誓い', desc: '会心率18%・カット9%・上限1.7倍。状態異常が効かない', crit: 0.18, cut: 0.09, comboMax: 140, statusCut: 1 },
        skill: { name: '英雄の剣', desc: '威力380。HP15%回復。ゲージを0に。ゲージ+15%', power: 380, heal: 0.15, charge: 1.15 } },
      { trait: { name: '伝説の誓い', desc: '会心率20%・カット10%・上限1.75倍。状態異常が効かない', crit: 0.2, cut: 0.1, comboMax: 150, statusCut: 1 },
        skill: { name: '伝説の剣', desc: '威力440。HP16%回復。ゲージを0に。ゲージ+20%', power: 440, heal: 0.16, charge: 1.2 } },
    ],
  },
  fuerin: {
    id: 'fuerin',
    title: 'combo300',
    names: ['ふえりん', 'ふえふえりん', '分身ふえりん', 'ミリオンふえりん', 'インフィニふえりん'],
    type: '分裂', role: 'コンボ型',
    colors: { main: '#94d82d', light: '#f4fce3', dark: '#2b8a3e', accent: '#ff8787' },
    stageColors: [
      { main: '#94d82d', light: '#f4fce3', dark: '#2b8a3e', accent: '#ff8787' },
      { main: '#69db7c', light: '#ebfbee', dark: '#1b6b30', accent: '#ffd43b' },
      { main: '#38d9a9', light: '#e6fcf5', dark: '#087f5b', accent: '#ff8787' },
      { main: '#3bc9db', light: '#e3fafc', dark: '#0b7285', accent: '#ffd43b' },
      { main: '#b2f2bb', light: '#ffffff', dark: '#2f9e44', accent: '#f783ac' },
    ],
    base: { hp: 89, atk: 96, def: 78, spd: 80 },
    desc: 'コンボマスターの前に現れた、打つたびに分裂して増えるスライム。コンボがどんどん伸びる。',
    forms: [
      { trait: { name: '分裂', desc: '正しく打つとコンボが1.5増える。ミスするとコンボは0に戻る', comboGain: 1.5, statusCut: 0 },
        skill: { name: '分身アタック', desc: '威力170。コンボ1につき威力+0.3%（最大+60%）', power: 170, comboBoost: 0.003, boostMax: 0.6, charge: 1 } },
      { trait: { name: '分裂+', desc: 'コンボが1.6増える', comboGain: 1.6, statusCut: 0 },
        skill: { name: '分身アタック+', desc: '威力240。コンボ1につき+0.3%（最大+75%）。ゲージ+5%', power: 240, comboBoost: 0.003, boostMax: 0.75, charge: 1.05 } },
      { trait: { name: '分身の術', desc: 'コンボが1.7増える。毒・やけどの時間が半分', comboGain: 1.7, statusCut: 0.5 },
        skill: { name: '分身ラッシュ', desc: '威力300。コンボ1につき+0.3%（最大+90%）。ゲージ+10%', power: 300, comboBoost: 0.003, boostMax: 0.9, charge: 1.1 } },
      { trait: { name: 'ミリオン分裂', desc: 'コンボが1.8増える。毒・やけどの時間が半分', comboGain: 1.8, statusCut: 0.5 },
        skill: { name: 'ミリオンラッシュ', desc: '威力360。コンボ1につき+0.3%（最大+105%）。ゲージ+15%', power: 360, comboBoost: 0.003, boostMax: 1.05, charge: 1.15 } },
      { trait: { name: 'インフィニ分裂', desc: 'コンボが2増える。状態異常が効かない', comboGain: 2, statusCut: 1 },
        skill: { name: 'インフィニティラッシュ', desc: '威力420。コンボ1につき+0.3%（最大+120%）。ゲージ+20%', power: 420, comboBoost: 0.003, boostMax: 1.2, charge: 1.2 } },
    ],
  },
  // ---- ガチャ限定: スライムの かたちに とらわれない キャラ ----
  // トリオりん: 小さな 3 びきで 1 キャラ (絵は sprites.js の CUSTOM_BODY)。tri = 3 びきの 色 [いろ, ふち]
  torio: {
    id: 'torio',
    gacha: true,
    names: ['トリオりん', 'トリオりんりん', 'トリプルスター', 'トリニティ', 'トリオキング'],
    type: '仲間', role: '連携型',
    colors: { main: '#ff6b6b', light: '#ffe3e3', dark: '#862e2e', accent: '#ffd43b' },
    stageColors: [
      { main: '#ff6b6b', light: '#ffe3e3', dark: '#862e2e', accent: '#ffd43b', tri: [['#ff6b6b', '#a61e1e'], ['#ffd43b', '#b8860b'], ['#4dabf7', '#1864ab']] },
      { main: '#ff8787', light: '#fff5f5', dark: '#a61e1e', accent: '#ffe066', tri: [['#ff8787', '#c92a2a'], ['#ffe066', '#e67700'], ['#74c0fc', '#1971c2']] },
      { main: '#f06595', light: '#fff0f6', dark: '#a61e4d', accent: '#ffa94d', tri: [['#f06595', '#a61e4d'], ['#ffa94d', '#d9480f'], ['#63e6be', '#087f5b']] },
      { main: '#cc5de8', light: '#f8f0fc', dark: '#862e9c', accent: '#ff922b', tri: [['#cc5de8', '#862e9c'], ['#ff922b', '#c2410c'], ['#3bc9db', '#0b7285']] },
      { main: '#fff3bf', light: '#ffffff', dark: '#e67700', accent: '#ffd43b', tri: [['#fff3bf', '#e67700'], ['#ffc9c9', '#e03131'], ['#d0ebff', '#1c7ed6']] },
    ],
    base: { hp: 82, atk: 87, def: 68, spd: 78 },
    desc: 'いつも一緒の3匹組。1匹では弱いけど、3匹そろうと無敵。',
    forms: [
      { trait: { name: '連携プレイ', desc: 'お題を打ち切ると3匹が順に攻撃（会心は1匹ずつ）。ノーミスで3つ続けると3つ目が+45%', trio: 0.45, statusCut: 0 },
        skill: { name: 'トリプルアタック', desc: '威力170を3回に分けて当てる。3回目は必ず会心', power: 170, charge: 1 } },
      { trait: { name: '連携プレイ+', desc: 'トリオボーナス+50%', trio: 0.5, statusCut: 0 },
        skill: { name: 'トリプルアタック+', desc: '威力240。3回目は必ず会心。ゲージ+5%', power: 240, charge: 1.05 } },
      { trait: { name: 'トリオの絆', desc: 'トリオボーナス+55%。毒・やけどの時間が半分', trio: 0.55, statusCut: 0.5 },
        skill: { name: 'トリプルスター', desc: '威力300。3回目は必ず会心。ゲージ+10%', power: 300, charge: 1.1 } },
      { trait: { name: 'トリニティ', desc: 'トリオボーナス+60%。毒・やけどの時間が半分', trio: 0.6, statusCut: 0.5 },
        skill: { name: 'トリニティバースト', desc: '威力360。3回目は必ず会心。ゲージ+15%', power: 360, charge: 1.15 } },
      { trait: { name: 'トリオの王様', desc: 'トリオボーナス+70%。状態異常が効かない', trio: 0.7, statusCut: 1 },
        skill: { name: 'キング・オブ・トリオ', desc: '威力420。3回目は必ず会心。ゲージ+20%', power: 420, charge: 1.2 } },
    ],
  },
  // ゆらりん: クラゲの かたちの キャラ。ミスを なかったことに する
  yurarin: {
    id: 'yurarin',
    gacha: true,
    names: ['ゆらりん', 'ゆらゆらりん', 'ネオンゆらりん', 'オーロラゆらりん', 'ギャラクシーゆらりん'],
    type: 'クラゲ', role: '守り型',
    colors: { main: '#a5d8ff', light: '#e7f5ff', dark: '#1971c2', accent: '#f783ac' },
    stageColors: [
      { main: '#a5d8ff', light: '#e7f5ff', dark: '#1971c2', accent: '#f783ac' },
      { main: '#d0bfff', light: '#f3f0ff', dark: '#6741d9', accent: '#63e6be' },
      { main: '#63e6be', light: '#e6fcf5', dark: '#087f5b', accent: '#ff8cc6' },
      { main: '#99e9f2', light: '#e3fafc', dark: '#0b7285', accent: '#d0bfff' },
      { main: '#5c3fb8', light: '#b197fc', dark: '#1e0f55', accent: '#ffe066' },
    ],
    base: { hp: 85, atk: 76, def: 74, spd: 70 },
    desc: '夜空の海を漂うクラゲ。ゆらゆら揺れて、ちょっとのミスならなかったことにする。',
    forms: [
      { trait: { name: 'ゆらゆらガード', desc: 'お題ごとに最初のミス1回をなかったことにする。そのときHP1.5%回復', forgive: 1, forgiveHeal: 0.015, statusCut: 0 },
        skill: { name: 'ゆらめきタッチ', desc: '威力170。4秒間ミスが全部なかったことになる', power: 170, forgiveSecs: 4, charge: 1 } },
      { trait: { name: 'ゆらゆらガード+', desc: 'HP2%回復', forgive: 1, forgiveHeal: 0.02, statusCut: 0 },
        skill: { name: 'ゆらめきタッチ+', desc: '威力240。4秒間。ゲージ+5%', power: 240, forgiveSecs: 4, charge: 1.05 } },
      { trait: { name: 'ネオンベール', desc: 'HP2%回復。毒・やけどの時間が半分', forgive: 1, forgiveHeal: 0.02, statusCut: 0.5 },
        skill: { name: 'ネオンタッチ', desc: '威力300。5秒間。ゲージ+10%', power: 300, forgiveSecs: 5, charge: 1.1 } },
      { trait: { name: 'オーロラベール', desc: 'HP2.5%回復。状態異常が効かない', forgive: 1, forgiveHeal: 0.025, statusCut: 1 },
        skill: { name: 'オーロラタッチ', desc: '威力360。5秒間。ゲージ+15%', power: 360, forgiveSecs: 5, charge: 1.15 } },
      { trait: { name: 'ギャラクシーベール', desc: 'お題ごとにミス2回までなかったことに。HP2.5%回復。状態異常が効かない', forgive: 2, forgiveHeal: 0.025, statusCut: 1 },
        skill: { name: 'ギャラクシータッチ', desc: '威力420。6秒間。ゲージ+20%', power: 420, forgiveSecs: 6, charge: 1.2 } },
    ],
  },
  // サイコロりん: 立体の サイコロ。お題ごとに サイコロを ふって ダメージが かわる (dice = 1〜6 の 目の 倍率)
  saikoro: {
    id: 'saikoro',
    gacha: true,
    names: ['サイコロりん', 'サイコロりんりん', 'ラッキーダイス', 'ゴールデンダイス', 'ミラクルダイス'],
    type: '運試し', role: 'ギャンブル型',
    colors: { main: '#f8f9fa', light: '#ffffff', dark: '#495057', accent: '#e03131' },
    stageColors: [
      { main: '#f8f9fa', light: '#ffffff', dark: '#495057', accent: '#e03131' },
      { main: '#e7f5ff', light: '#ffffff', dark: '#1864ab', accent: '#1c7ed6' },
      { main: '#fff0f6', light: '#ffffff', dark: '#a61e4d', accent: '#e64980' },
      { main: '#fff3bf', light: '#fffbe6', dark: '#b8860b', accent: '#e67700' },
      { main: '#f3f0ff', light: '#ffffff', dark: '#5f3dc4', accent: '#f59f00' },
    ],
    base: { hp: 83, atk: 91, def: 71, spd: 74 },
    desc: 'ころころ転がるサイコロのスライム。強いか弱いかはサイコロ次第。',
    forms: [
      { trait: { name: 'サイコロ', desc: 'お題を打ち切るたびサイコロを振る。1:×0.6 2:×0.8 3:×1 4:×1.2 5:×1.4 6:×2', dice: [0.6, 0.8, 1, 1.2, 1.4, 2], statusCut: 0 },
        skill: { name: 'ダブルダイス', desc: '威力170。次の3回はサイコロ2個。ゾロ目で特大ダメージ（大きい目ほど強い）＋1回延長', power: 170, luck: 3, dice: 2, zoro: 0.2, charge: 1 } },
      { trait: { name: 'サイコロ+', desc: '1:×0.65 … 5:×1.45 6:×2.1', dice: [0.65, 0.8, 1, 1.2, 1.45, 2.1], statusCut: 0 },
        skill: { name: 'ダブルダイス+', desc: '威力240。次の3回はサイコロ2個。ゾロ目が少し強い。ゲージ+5%', power: 240, luck: 3, dice: 2, zoro: 0.22, charge: 1.05 } },
      { trait: { name: 'ラッキーダイス', desc: '1:×0.7 … 5:×1.5 6:×2.2。毒・やけどの時間が半分', dice: [0.7, 0.85, 1, 1.25, 1.5, 2.2], statusCut: 0.5 },
        skill: { name: 'トリプルダイス', desc: '威力300。次の4回はサイコロ3個。3つそろうとゾロ目のボーナス2倍。ゲージ+10%', power: 300, luck: 4, dice: 3, zoro: 0.25, charge: 1.1 } },
      { trait: { name: 'ゴールデンダイス', desc: '1:×0.7 … 5:×1.5 6:×2.35。毒・やけどの時間が半分', dice: [0.7, 0.9, 1.05, 1.25, 1.5, 2.35], statusCut: 0.5 },
        skill: { name: 'ゴールデントリプル', desc: '威力360。次の4回はサイコロ3個。ゲージ+15%', power: 360, luck: 4, dice: 3, zoro: 0.27, charge: 1.15 } },
      { trait: { name: 'ミラクルダイス', desc: '1:×0.75 … 5:×1.6 6:×2.5。状態異常が効かない', dice: [0.75, 0.9, 1.1, 1.3, 1.6, 2.5], statusCut: 1 },
        skill: { name: 'ミラクルトリプル', desc: '威力420。次の5回はサイコロ3個。ゲージ+20%', power: 420, luck: 5, dice: 3, zoro: 0.3, charge: 1.2 } },
    ],
  },
  // いもりん: 玉が つながった イモムシ。4 段階目から チョウチョに なる。お題ごとに 体が のびて 強く なる
  imomushi: {
    id: 'imomushi',
    gacha: true,
    names: ['いもりん', 'いもいもりん', 'ながいもりん', 'ちょうりん', '光ちょうりん'],
    type: '虫', role: 'ため込み型',
    colors: { main: '#94d82d', light: '#f4fce3', dark: '#2b8a3e', accent: '#ffd43b' },
    stageColors: [
      { main: '#94d82d', light: '#f4fce3', dark: '#2b8a3e', accent: '#ffd43b' },
      { main: '#69db7c', light: '#ebfbee', dark: '#1b5e20', accent: '#ff922b' },
      { main: '#38d9a9', light: '#e6fcf5', dark: '#087f5b', accent: '#f783ac' },
      { main: '#b197fc', light: '#f3f0ff', dark: '#5f3dc4', accent: '#74c0fc' },
      { main: '#ffd43b', light: '#fff9db', dark: '#b8860b', accent: '#ff8cc6' },
    ],
    base: { hp: 94, atk: 92, def: 81, spd: 70 },
    desc: '森の葉っぱをもぐもぐ食べて大きくなるイモムシ。いつかきれいなチョウになる夢を見ている。',
    forms: [
      { trait: { name: 'のびのび', desc: 'お題を打ち切るたび体が1つ伸びる（最大4）。1つにつき攻撃+6%。攻撃を受けると1つ縮む', segMax: 4, segStep: 0.06, statusCut: 0 },
        skill: { name: 'ぐるぐるアタック', desc: '威力170。伸びた体1つにつき威力+12%', power: 170, segBoost: 0.12, charge: 1 } },
      { trait: { name: 'のびのび+', desc: '1つにつき+6.5%', segMax: 4, segStep: 0.065, statusCut: 0 },
        skill: { name: 'ぐるぐるアタック+', desc: '威力240。1つにつき+12%。ゲージ+5%', power: 240, segBoost: 0.12, charge: 1.05 } },
      { trait: { name: '長々ボディ', desc: '最大5。1つにつき+7%。毒・やけどの時間が半分', segMax: 5, segStep: 0.07, statusCut: 0.5 },
        skill: { name: '長々アタック', desc: '威力300。1つにつき+13%。ゲージ+10%', power: 300, segBoost: 0.13, charge: 1.1 } },
      { trait: { name: 'はばたき', desc: '最大5。1つにつき+7.5%。毒・やけどの時間が半分', segMax: 5, segStep: 0.075, statusCut: 0.5 },
        skill: { name: 'りんぷんストーム', desc: '威力360。1つにつき+13%。ゲージ+15%', power: 360, segBoost: 0.13, charge: 1.15 } },
      { trait: { name: '光の羽', desc: '最大6。1つにつき+8%。状態異常が効かない', segMax: 6, segStep: 0.08, statusCut: 1 },
        skill: { name: '光のりんぷん', desc: '威力420。1つにつき+14%。ゲージ+20%', power: 420, segBoost: 0.14, charge: 1.2 } },
    ],
  },
  // ちょうちんりん: 一つ目の おばけちょうちん。敵の 攻撃ゲージが たまっているほど 強い (ぎりぎり型)
  chochin: {
    id: 'chochin',
    gacha: true,
    names: ['ちょうちんりん', 'ちょうちんりんりん', '火の玉りん', '鬼火りん', 'きつね火りん'],
    type: '灯火', role: 'ぎりぎり型',
    colors: { main: '#ff6b6b', light: '#fff5f5', dark: '#862e2e', accent: '#ffd43b' },
    stageColors: [
      { main: '#ff6b6b', light: '#fff5f5', dark: '#862e2e', accent: '#ffd43b' },
      { main: '#ff922b', light: '#fff4e6', dark: '#a63c06', accent: '#fff3bf' },
      { main: '#f783ac', light: '#fff0f6', dark: '#a61e4d', accent: '#74c0fc' },
      { main: '#845ef7', light: '#f3f0ff', dark: '#3b1c8c', accent: '#63e6be' },
      { main: '#fab005', light: '#fff9db', dark: '#8a5a00', accent: '#ff6bff' },
    ],
    base: { hp: 78, atk: 84, def: 65, spd: 72 },
    desc: 'お祭りの夜に生まれたおばけちょうちん。危ないときほど炎が燃え上がる。',
    forms: [
      { trait: { name: 'ぎりぎりの灯火', desc: '打ち切ったとき敵の攻撃ゲージがたまっているほど攻撃が強い（0で+0%・満タン前で+50%）', gaugeBoost: 0.5, statusCut: 0 },
        skill: { name: '人魂の舞', desc: '威力170。人魂が次の攻撃を1回防ぐ', power: 170, guard: 1, charge: 1 } },
      { trait: { name: 'ぎりぎりの灯火+', desc: '最大+55%', gaugeBoost: 0.55, statusCut: 0 },
        skill: { name: '人魂の舞+', desc: '威力240。1回防ぐ。ゲージ+5%', power: 240, guard: 1, charge: 1.05 } },
      { trait: { name: '燃え上がる炎', desc: '最大+60%。毒・やけどの時間が半分', gaugeBoost: 0.6, statusCut: 0.5 },
        skill: { name: '火の玉の舞', desc: '威力300。2回防ぐ。ゲージ+10%', power: 300, guard: 2, charge: 1.1 } },
      { trait: { name: '鬼火の炎', desc: '最大+65%。状態異常が効かない', gaugeBoost: 0.65, statusCut: 1 },
        skill: { name: '鬼火の舞', desc: '威力360。2回防ぐ。ゲージ+15%', power: 360, guard: 2, charge: 1.15 } },
      { trait: { name: 'きつね火の炎', desc: '最大+75%。状態異常が効かない', gaugeBoost: 0.75, statusCut: 1 },
        skill: { name: 'きつね火の舞', desc: '威力420。3回防ぐ。ゲージ+20%', power: 420, guard: 3, charge: 1.2 } },
    ],
  },
};

// とくべつな キャラ: ガチャ限定 = SSR / しょうごう・かくしステージ・ミッションで ひらく = とくべつ
// HP・こうげき・ぼうぎょが 5% 高く、カード・登場・ひっさつの 演出が はでに なる
const SPECIAL_STAT = 1.05;
function charRank(id) { const d = CHARACTERS[id]; return d.gacha ? 'ssr' : d.title || d.special ? 'special' : ''; }

// ---------------- 進化で 必殺に 新しい 効果が 加わる ----------------
// [何段階目から (0〜4), 足す 値, 説明]。その段階から あとは ずっと つく (あとの 段階で 同じ 値を 書くと 上書き)
// 数字が 上がる だけでなく「できることが ふえる」 ように した。効果の 中身は battle.js の skillExtras など
const SKILL_UPS = {
  purun: [[3, { ward: 5 }, '必殺のあと5秒間、状態異常にならない'], [4, { refund: 0.25 }, '必殺ゲージが25%戻る']],
  piriri: [[4, { echo: 0.6 }, '雷がもう1回落ちる（60%のダメージ）']],
  gotsun: [[2, { guards: 3 }, 'ガードが3回に増える'], [4, { counterCrit: true }, '反撃が必ず会心（1.5倍）']],
  homura: [[2, { burnBoost: 0.15 }, 'やけど中の敵への攻撃+15%'], [4, { burnPct: 0.06 }, 'やけどのダメージが2倍（毎秒6%）']],
  moririn: [[2, { ward: 5 }, '必殺のあと5秒間、状態異常にならない'], [4, { regenBoost: 8 }, '8秒間、光合成の回復が2倍']],
  kagemaru: [[2, { bindBoost: 0.2 }, '縛っている間、敵が受けるダメージ+20%'], [4, { echo: 0.5 }, '影がもう1回攻撃（50%のダメージ）']],
  ryumaru: [[2, { lifesteal: 0.15 }, '与えたダメージの15%分HP回復'], [4, { rageSecs: 8 }, '8秒間、HPに関係なく怒り状態になる']],
  kirari: [[4, { streakGuard: 2 }, '次の2回のミスでリズムが消えない']],
  koorin: [[2, { chillWeak: 0.2 }, 'こごえている敵の攻撃-20%'], [4, { resetGauge: true }, '敵の攻撃ゲージを0に戻す']],
  fuwari: [[2, { evadeCounter: 80 }, 'かわすたびに威力80の風で反撃'], [4, { doubleSecs: 6 }, '6秒間、追い打ちが必ず出る']],
  metarun: [[2, { breakPierce: true }, 'ブレイク中は、よろい・殻を無視'], [4, { breakWeak: 0.3 }, 'ブレイク中、敵の攻撃-30%']],
  onpuru: [[2, { refund: 0.2 }, '必殺ゲージが20%戻る'], [4, { tempoCrit: true }, 'テンポアップ中のお題は必ず会心']],
  pitarin: [[4, { reflectMult: 2 }, 'はね返すダメージが2倍']],
  dororin: [[2, { poisonBoostSecs: 6 }, '6秒間、毒のダメージが2倍'], [4, { poisonFill: true }, '毒が一気に最大まで重なる']],
  gorurin: [[2, { drainSecs: 8 }, '8秒間、攻撃で吸い取る量が2倍'], [4, { addBarrier: 1 }, '金のバリアで敵の攻撃を1回防ぐ']],
  yukidarun: [[2, { addSnow: 2 }, '使ったあと雪玉+2'], [4, { chill: 5 }, '敵を5秒こごえさせる（攻撃ゲージが半分の速さ）']],
  yuusharin: [[2, { critSecs: 8, critAdd: 0.3 }, '8秒間、会心率+30%'], [4, { addBarrier: 1 }, '聖なる盾で敵の攻撃を1回防ぐ']],
  fuerin: [[2, { comboGuardSecs: 6 }, '6秒間、ミスしてもコンボが切れない'], [4, { comboAdd: 50 }, 'コンボ+50']],
  torio: [[2, { trioNext: true }, '次のお題で必ずトリオボーナス'], [4, { allCrit: true }, '3回とも必ず会心']],
  yurarin: [[2, { wardForgive: true }, 'ゆらめいている間、状態異常にならない'], [4, { addBarrier: 1 }, '敵の攻撃を1回防ぐ']],
  saikoro: [[1, { zoroRefund: 0.3 }, 'ゾロ目が出ると必殺ゲージが30%戻る'], [3, { weight: 1.6 }, '4・5・6の目が出やすい'], [4, { weight: 2.2, tripleMult: 3 }, '4・5・6がもっと出やすく、3つそろうとボーナス3倍']],
  imomushi: [[2, { segFill: true }, '体が一気に最大まで伸びる'], [4, { segGuardSecs: 8 }, '8秒間、攻撃を受けても体が縮まない']],
  chochin: [[2, { flareMax: true }, '人魂がいる間、ぎりぎりのボーナスが常に最大'], [4, { guardHit: 100 }, '人魂が防ぐたびに威力100で反撃']],
};
for (const [id, ups] of Object.entries(SKILL_UPS)) {
  CHARACTERS[id].forms.forEach((f, i) => {
    const list = []; // [値の キー, 説明]。あとの 段階で 同じ 値が 強く なったら 前の 説明は けす
    for (const [from, vals, text] of ups) if (i >= from) {
      Object.assign(f.skill, vals);
      const keys = Object.keys(vals);
      for (let k = list.length - 1; k >= 0; k--) if (list[k][0].some(x => keys.includes(x))) list.splice(k, 1);
      list.push([keys, text]);
    }
    f.skill.ups = list.map(x => x[1]);
  });
}

// さいしょから つかえるキャラ (ガチャ限定・しょうごうや とびらで ひらく キャラを のぞく)
const STARTERS = Object.keys(CHARACTERS).filter(id => !CHARACTERS[id].gacha && !CHARACTERS[id].title && !CHARACTERS[id].special);

// ---------------- せんざいかくせい (ガチャで キャラが かぶると ★ が ふえる) ----------------
// ★ 1 つごとに: 能力値 +2%、レベルの上限 +1、そのキャラの とくせいが 少し のびる
const AWAKEN_MAX = 4;
const AWAKEN_STAT = 0.02;
const AWAKEN_BONUS = {
  purun: { desc: 'ノーミス回復+0.4%', apply: (t, n) => ({ ...t, heal: t.heal + 0.004 * n }) },
  piriri: { desc: '会心率の上限+2%', apply: (t, n) => ({ ...t, critMax: t.critMax + 0.02 * n }) },
  gotsun: { desc: 'ダメージカット+1%', apply: (t, n) => ({ ...t, cut: t.cut + 0.01 * n }) },
  homura: { desc: 'コンボ倍率の上限+0.04', apply: (t, n) => ({ ...t, comboMax: t.comboMax + 8 * n }) },
  moririn: { desc: '3秒ごとの回復+0.1%', apply: (t, n) => ({ ...t, regen: t.regen + 0.001 * n }) },
  kagemaru: { desc: '敵の攻撃がさらに1%遅く', apply: (t, n) => ({ ...t, slow: t.slow + 0.01 * n }) },
  ryumaru: { desc: '怒りの攻撃+0.03倍', apply: (t, n) => ({ ...t, rageMult: t.rageMult + 0.03 * n }) },
  kirari: { desc: 'リズムの上限+3%', apply: (t, n) => ({ ...t, streakMax: t.streakMax + 0.03 * n }) },
  koorin: { desc: 'やり返す確率+2%', apply: (t, n) => ({ ...t, counter: t.counter + 0.02 * n }) },
  fuwari: { desc: '追い打ちの確率+2%', apply: (t, n) => ({ ...t, double: t.double + 0.02 * n }) },
  metarun: { desc: 'ため打ちの上限+3%', apply: (t, n) => ({ ...t, longMax: t.longMax + 0.03 * n }) },
  onpuru: { desc: 'テンポの上限+3%', apply: (t, n) => ({ ...t, speedMax: t.speedMax + 0.03 * n }) },
  pitarin: { desc: 'ノーミス会心+0.03倍', apply: (t, n) => ({ ...t, perfectCrit: t.perfectCrit + 0.03 * n }) },
  dororin: { desc: '毒の最大+1', apply: (t, n) => ({ ...t, poisonMax: t.poisonMax + n }) },
  gorurin: { desc: 'ダメージ回復+1%', apply: (t, n) => ({ ...t, drain: t.drain + 0.01 * n }) },
  yukidarun: { desc: '雪玉1個のカット+1%', apply: (t, n) => ({ ...t, snowCut: t.snowCut + 0.01 * n }) },
  yuusharin: { desc: '会心率+1%', apply: (t, n) => ({ ...t, crit: t.crit + 0.01 * n }) },
  fuerin: { desc: 'コンボの増え方+0.05', apply: (t, n) => ({ ...t, comboGain: t.comboGain + 0.05 * n }) },
  torio: { desc: 'トリオボーナス+3%', apply: (t, n) => ({ ...t, trio: t.trio + 0.03 * n }) },
  yurarin: { desc: 'ミスを防いだときの回復+0.3%', apply: (t, n) => ({ ...t, forgiveHeal: t.forgiveHeal + 0.003 * n }) },
  saikoro: { desc: '6の目の倍率+0.05', apply: (t, n) => ({ ...t, dice: t.dice.map((v, i) => (i === 5 ? v + 0.05 * n : v)) }) },
  imomushi: { desc: '体1つの攻撃+0.5%', apply: (t, n) => ({ ...t, segStep: t.segStep + 0.005 * n }) },
  chochin: { desc: 'ぎりぎりの攻撃+3%', apply: (t, n) => ({ ...t, gaugeBoost: t.gaugeBoost + 0.03 * n }) },
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
  saikoro: { crit: [0.15, 0.17, 0.19, 0.21, 0.24] }, // 武器が 会心 (ダメージ 2 倍) に なる 確率
  imomushi: { hp: [1.15, 1.2, 1.25, 1.3, 1.35] },    // 最大HP
  chochin: { dmg: [1.08, 1.1, 1.12, 1.14, 1.17] },   // 武器の ダメージ
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
  { id: 'grass', name: '草原', diff: 'normal', enemies: [
    E('bat', 'コウモリン', 'fast', 4200, null, '特になし', '洞くつに住む小さなコウモリ。最初の相手にぴったり。', { diff: 'easy', bg: 'cave', lv: 1 }),
    E('mush', 'ドクキノコ', 'normal', 4800, 'poison', '毒: 攻撃を受けると5秒間HPが減り続ける', '森の毒キノコ。攻撃を受けると、毒になってしまう。', { diff: 'easy', bg: 'forest' }),
    E('ghost', 'ユウレイン', 'fast', 4200, 'fade', '幽霊の霧: 時々ローマ字ガイドが見えなくなる', '墓地をさまようおばけ。ローマ字のガイドを隠してくる。', { bg: 'grave' }),
    E('goblin', 'ゴブリン', 'normal', 4600, 'rage', '激怒: HPが半分を切ると攻撃が速くなる', 'こん棒を振り回す乱暴者。追い詰めると怒り出す。', { bg: 'plain' }),
    E('golem', 'ストーンゴーレム', 'tank', 5600, 'armor', '石のよろい: コンボ30未満だとダメージ半減', '遺跡を守る石の巨人。とても硬い。', { bg: 'ruins' }),
    E('dragon', 'ドラゴン', 'boss', 5400, 'dragon', '本気: HP半分で攻撃が速くなり、3回に1回炎のブレス', '草原の果てに住む竜。HPが半分を切ると本気を出す。', { bg: 'volcano' }),
  ] },
  { id: 'poison', name: '毒沼', diff: 'normal', enemies: [
    E('pbat', 'ドクコウモリ', 'fast', 4000, 'poison', '毒の牙: 攻撃を受けると毒になる', '沼の上を飛び回る毒のコウモリ。'),
    E('frog', 'ドクガエル', 'normal', 4600, 'mud', 'ぬかるみ: 攻撃を受けるとガイドが泥で見えにくくなり、ゲージが減る', '泥を飛ばしてくるカエル。'),
    E('bee', 'ドクバチ', 'fast', 3800, 'poison', '毒針: 攻撃を受けると毒になる', 'ぶんぶんうるさい毒のハチ。'),
    E('swampmush', 'ヌマダケ', 'normal', 5000, 'regen', '沼の恵み: 時々HPを回復する', '沼に生える紫のキノコ。'),
    E('zombie', 'ゾンビ', 'tank', 5400, 'regen', 'しぶとい: 時々HPを回復する', '何度でも起き上がる沼のゾンビ。'),
    E('hydra', 'ヒュドラ', 'boss', 5600, ['hydra', 'poison'], '三つ首: HPが減るたびに1回の攻撃回数が増える。毒もある', '三つの首を持つ毒沼の主。'),
  ] },
  { id: 'desert', name: '砂漠', diff: 'normal', enemies: [
    E('scorpion', 'サソリン', 'fast', 4000, 'poison', '毒針: 攻撃を受けると毒になる', '砂の中から飛び出すサソリ。'),
    E('cactus', 'サボテンマン', 'tank', 5400, 'shell', 'トゲガード: 時々3秒間受けるダメージが大きく減る', 'トゲだらけのサボテン。'),
    E('snake', 'スナヘビ', 'fast', 4000, 'rage', 'しっぽ: HPが半分を切ると攻撃が速くなる', '砂の上を滑るように進むヘビ。'),
    E('mummy', 'ミイラン', 'normal', 5000, 'sandstorm', '砂嵐: 時々漢字とかなが見えなくなる', 'ピラミッドから出てきたミイラ。'),
    E('dgoblin', 'サバクゴブリン', 'normal', 4400, 'charge', 'ため攻撃: 3回に1回、力をためた強い攻撃', '砂漠の盗賊ゴブリン。'),
    E('sphinx', 'スフィンクス', 'boss', 5400, ['sandstorm', 'rage'], '謎の力: 砂嵐を起こし、HP半分で攻撃が速くなる', 'ピラミッドを守る謎の番人。'),
  ] },
  { id: 'sea', name: '海', diff: 'hard', enemies: [
    E('crab', 'カニッパ', 'tank', 5200, 'shell', '殻にこもる: 時々3秒間受けるダメージが大きく減る', '硬い甲羅の大きなカニ。', { diff: 'normal' }),
    E('jelly', 'クラゲール', 'normal', 5000, 'shock', 'しびれ: ミスすると自分がダメージを受ける', 'ビリビリするクラゲ。間違えて触るとしびれる。'),
    E('puffer', 'フグリン', 'normal', 4800, 'shock', 'トゲトゲ: ミスすると自分がダメージを受ける', '怒ると膨らむフグ。'),
    E('shark', 'サメキバ', 'fast', 4400, 'rage', '血のにおい: HPが半分を切ると攻撃が速くなる', '海のハンター。弱ってくると獰猛になる。'),
    E('pirate', 'ガイコツ船長', 'normal', 5000, 'charge', '大砲: 3回に1回、力をためた強い攻撃', '幽霊船の船長。'),
    E('kraken', 'クラーケン', 'boss', 5400, 'ink', '墨吐き: 時々お題が墨で見えにくくなる。HP半分から2連続攻撃', '深海の主。墨を吐いて邪魔をしてくる。'),
  ] },
  { id: 'candy', name: 'お菓子の国', diff: 'hard', enemies: [
    E('gummy', 'グミベア', 'normal', 4600, 'sweet', '甘い誘惑: ミスすると敵のHPが回復する', 'ぷにぷにのグミのクマ。'),
    E('lolli', 'ペロペロン', 'fast', 4000, 'rage', 'あまのじゃく: HPが半分を切ると攻撃が速くなる', 'ぐるぐる渦巻きのキャンディ。'),
    E('cake', 'ショートケーキン', 'normal', 5000, 'sweet', '甘い誘惑: ミスすると敵のHPが回復する', 'イチゴを乗せたケーキのモンスター。'),
    E('mallow', 'マシュマロおばけ', 'fast', 4400, 'fade', 'ふわふわ: 時々ローマ字ガイドが見えなくなる', 'ふわふわのマシュマロのおばけ。'),
    E('chocogolem', 'チョコゴーレム', 'tank', 5600, 'armor', 'チョコのよろい: コンボ30未満だとダメージ半減', 'チョコレートでできた巨人。'),
    E('pudding', 'ジャイアントプリン', 'boss', 5600, ['sweet', 'charge'], '甘いわな: ミスすると回復し、3回に1回ため攻撃をしてくる', 'お菓子の国の女王様。'),
  ] },
  { id: 'rain', name: '雨の森', diff: 'hard', enemies: [
    E('snail', 'カタツムリン', 'tank', 5600, 'shell', '殻にこもる: 時々3秒間受けるダメージが大きく減る', '雨の日に出てくるカタツムリ。'),
    E('kappa', 'カッパ', 'normal', 4600, 'fade', '水しぶき: 時々ローマ字ガイドが見えなくなる', '川に住むいたずら者。'),
    E('rainfrog', 'アマガエル', 'fast', 4200, 'mud', 'ぬかるみ: 攻撃を受けるとガイドが泥で見えにくくなり、ゲージが減る', '雨が大好きなカエル。'),
    E('rainmush', 'アメフラシダケ', 'normal', 5000, 'regen', '雨の恵み: 時々HPを回復する', '雨を呼ぶキノコ。'),
    E('tbat', 'イナズマコウモリ', 'fast', 4000, 'thunder', '雷の予告: 時々落雷の予告。3秒以内にお題を打ち切らないと大ダメージ', '雷をまとうコウモリ。'),
    E('raijin', 'ライジン', 'boss', 5200, ['thunder', 'rage'], '雷様: 落雷の予告が多い。HP半分で攻撃が速くなる', '太鼓をたたく雷の神。'),
  ] },
  { id: 'factory', name: '機械の工場', diff: 'hard', enemies: [
    E('robot', 'ロボッタ', 'tank', 5400, 'armor', '鉄鋼: コンボ30未満だとダメージ半減', '工場を見張るロボット。'),
    E('drone', 'ドローン', 'fast', 3800, 'charge', 'レーザーため打ち: 3回に1回、力をためた強い攻撃', 'ぶーんと飛び回るドローン。'),
    E('bomb', 'バクダンくん', 'normal', 4800, 'charge', '爆発: 3回に1回、力をためた強い攻撃', 'いつ爆発するかわからない。'),
    E('mgoblin', 'メカゴブリン', 'normal', 4400, 'rage', 'オーバーヒート: HPが半分を切ると攻撃が速くなる', '機械の体になったゴブリン。'),
    E('geargolem', 'ギアゴーレム', 'tank', 5600, 'shell', 'ギアガード: 時々3秒間受けるダメージが大きく減る', '歯車で動く巨人。'),
    E('mechadragon', 'メカドラゴン', 'boss', 5200, ['dragon', 'charge'], 'メカの本気: HP半分で速くなりブレス。ため攻撃もある', '工場で作られた機械の竜。'),
  ] },
  { id: 'snow', name: '雪山', diff: 'hard', enemies: [
    E('penguin', 'ペンギナイト', 'normal', 4800, 'shell', '氷の盾: 時々3秒間受けるダメージが大きく減る', '盾とやりを持ったペンギンの騎士。'),
    E('snowman', 'ユキダルマン', 'tank', 5000, 'regen', '雪だまり: 時々HPを回復する', '動く雪だるま。雪を集めて回復する。'),
    E('yukionna', 'ユキオンナ', 'fast', 4400, 'freeze', '冷たい息: 攻撃を受けると4秒間こごえて攻撃が3割弱くなる', '雪山に現れる幽霊。'),
    E('wolf', 'アイスウルフ', 'fast', 4200, 'freeze', '氷の息: 攻撃を受けると4秒間こごえて攻撃が3割弱くなる', '氷の息を吐くオオカミ。'),
    E('icegolem', 'アイスゴーレム', 'tank', 5600, 'armor', '氷のよろい: コンボ30未満だとダメージ半減', '氷でできた巨人。'),
    E('yeti', 'イエティ', 'boss', 5400, 'blizzard', '吹雪: 時々漢字とかなが見えなくなる。攻撃でこごえさせて攻撃を弱くする', '雪山の主。吹雪を呼び起こす。'),
  ] },
  { id: 'sky', name: '天空', diff: 'hard', enemies: [
    E('skybird', 'ソラドリ', 'fast', 3800, 'wind', '風起こし: 時々風で文字が揺れる', '雲の上を飛ぶ鳥。'),
    E('cloud', 'カミナリグモ', 'normal', 4800, 'thunder', '雷の予告: 3秒以内にお題を打ち切らないと落雷', '雷を呼ぶ雲。'),
    E('wbat', 'シロコウモリ', 'fast', 4000, 'rage', '天空の牙: HPが半分を切ると攻撃が速くなる', '真っ白なコウモリ。'),
    E('skygolem', 'スカイゴーレム', 'tank', 5600, 'armor', '光のよろい: コンボ30未満だとダメージ半減', '空の城を守る巨人。'),
    E('wyvern', 'ワイバーン', 'normal', 4600, 'wind', '羽ばたき: 時々風で文字が揺れる', '空を駆ける小さな竜。'),
    E('skydragon', '天空竜', 'boss', 5200, ['dragon', 'wind'], '天空の王: 風で文字を揺らし、HP半分で速くなりブレス', '雲の上の王様竜。'),
  ] },
  { id: 'space', name: '宇宙', diff: 'hard', enemies: [
    E('alien', 'エイリアン', 'normal', 4600, 'fade', 'テレパシー: 時々ローマ字ガイドが見えなくなる', '遠い星から来た宇宙人。'),
    E('ufo', 'ユーフォー', 'fast', 4000, 'charge', 'ビームため打ち: 3回に1回、力をためた強い攻撃', '不思議な光の乗り物。'),
    E('meteor', 'メテオン', 'tank', 5600, 'shell', '岩の体: 時々3秒間受けるダメージが大きく減る', '宇宙を漂う隕石。'),
    E('star', 'スターン', 'fast', 4200, 'shock', '星くず: ミスすると自分がダメージを受ける', 'きらきら光る星の子。'),
    E('galaxyrobo', 'ギャラクシーロボ', 'tank', 5400, 'armor', '宇宙合金: コンボ30未満だとダメージ半減', '宇宙船を守るロボット。'),
    E('alienking', 'ギャラクシーキング', 'boss', 5200, ['fade', 'charge'], '宇宙の王: ガイドを隠し、ため攻撃もしてくる', '宇宙人たちの王様。'),
  ] },
  { id: 'magma', name: 'マグマの城', diff: 'hard', enemies: [
    E('imp', 'ファイアインプ', 'fast', 4400, 'poison', 'やけど: 攻撃を受けると5秒間HPが減り続ける', '城を守る炎の小悪魔。', { statusName: 'やけど' }),
    E('hellhound', 'ヘルハウンド', 'fast', 4000, 'rage', '地獄の牙: HPが半分を切ると攻撃が速くなる', '炎を吐く地獄の犬。'),
    E('mgolem', 'マグマゴーレム', 'tank', 5600, 'armor', 'マグマのよろい: コンボ30未満だとダメージ半減', '溶岩でできた巨人。とても硬い。'),
    E('darkknight', 'ダークナイト', 'normal', 4800, 'shell', '闇の盾: 時々3秒間受けるダメージが大きく減る', '魔王に仕える闇の騎士。'),
    E('salamander', 'サラマンダー', 'normal', 4600, 'fade', 'かげろう: 時々ローマ字ガイドが揺らめいて見えなくなる', '炎をまとうトカゲ。'),
    E('demon', '魔王', 'boss', 5600, 'demon', '魔王の力: HP2/3で闇（ガイドが消える）、1/3で攻撃が速くなり必殺ゲージを奪う', 'マグマの城の主。', { final: true }),
  ] },
  // ---- ここから うらの せかい (Lv100 より 上)。敵の 絵は 今ある 敵を つかい回して 色を かえた「へんい種」 ----
  { id: 'shade', name: '影の森', diff: 'hard', enemies: [
    E('v_bat', '影コウモリン', 'fast', 3800, ['poison', 'fade'], '影の牙: 毒にして、時々ローマ字ガイドを隠す', '影に染まったコウモリン。素早い。', { sprite: 'bat', lv: 101 }),
    E('v_mush', '影ドクキノコ', 'normal', 4600, ['poison', 'regen'], '影の胞子: 毒にして、時々HPを回復する', '影の森で増え続けるキノコ。', { sprite: 'mush', lv: 103 }),
    E('v_goblin', '影ゴブリン', 'normal', 4400, ['rage', 'charge'], '影のこん棒: 3回に1回ため攻撃。HP半分で速くなる', '影の力で強くなったゴブリン。', { sprite: 'goblin', lv: 104 }),
    E('v_jelly', '影クラゲール', 'normal', 4800, ['shock', 'sweet'], '影の触手: ミスすると自分がダメージを受け、敵が回復する', '闇の水に漂うクラゲ。間違えると怖い。', { sprite: 'jelly', lv: 106 }),
    E('v_golem', '影ゴーレム', 'tank', 5400, ['armor', 'regen'], '影のよろい: コンボ30未満だとダメージ半減。時々回復する', '影の石でできた巨人。', { sprite: 'golem', lv: 107 }),
    E('v_dragon', '影ドラゴン', 'boss', 5200, ['dragon', 'fade', 'poison'], '闇の竜: HP半分で速くなりブレス。ガイドを隠し、毒もある', '影の森の主。魔王より強いといううわさ。', { sprite: 'dragon', lv: 110 }),
  ] },
  { id: 'void', name: '星の果て', diff: 'hard', enemies: [
    E('v_penguin', '星のペンギナイト', 'normal', 4600, ['shell', 'freeze'], '星の盾: 時々3秒間ダメージ大幅ダウン。攻撃でこごえさせる', '星の果てを守る騎士。', { sprite: 'penguin', lv: 110 }),
    E('v_yukionna', 'うつろなユキオンナ', 'fast', 4200, ['freeze', 'fade'], 'うつろな息: 攻撃でこごえさせ、時々ガイドを隠す', '星の風に乗って現れる幽霊。', { sprite: 'yukionna', lv: 112 }),
    E('v_raijin', '星のライジン', 'normal', 4800, ['thunder', 'shock'], '星のいかずち: 落雷の予告。ミスすると自分がダメージを受ける', '星の力を得た雷様。', { sprite: 'raijin', lv: 113 }),
    E('v_wyvern', '虚空のワイバーン', 'fast', 4200, ['wind', 'rage'], '虚空の翼: 風で文字を揺らす。HP半分で速くなる', '何もない空を飛ぶ竜。', { sprite: 'wyvern', lv: 115 }),
    E('v_galaxyrobo', '星の巨人ロボ', 'tank', 5400, ['armor', 'shell'], '星の装甲: コンボ30未満だとダメージ半減。時々ガードも硬くなる', '星を守る最後のロボット。', { sprite: 'galaxyrobo', lv: 117 }),
    E('v_demon', '真魔王', 'boss', 5400, ['demon', 'thunder'], '真魔王の力: 魔王の力に加えて、落雷の予告もしてくる', '星の果てで目覚めた本当の魔王。最後の敵。', { sprite: 'demon', lv: 124, last: true }),
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
  { host: 1, from: 5, e: E('h_goldgolem', '黄金ゴーレム', 'tank', 5000, ['armor', 'regen'], '黄金のよろい: コンボ30未満だとダメージ半減。時々回復する',
      '毒沼の奥に隠れていた金色の巨人。', { sprite: 'golem', filter: 'sepia(1) saturate(5) hue-rotate(-12deg) brightness(1.15)', lv: 24, bg: 'ruins' }),
    reveal: { text: '毒沼のステージを3つノーミスでクリアする', check: () => nomissCount(1) >= 3, progress: () => `${nomissCount(1)}/3` } },
  { host: 7, from: 5, e: E('h_icequeen', '氷の女王', 'boss', 4800, ['blizzard', 'freeze', 'charge'], '永久凍土: 吹雪で漢字とかなを隠し、こごえさせ、ため攻撃もしてくる',
      '雪山の頂で眠っていた氷の女王。', { sprite: 'yukionna', filter: 'hue-rotate(185deg) saturate(2.2) brightness(1.25)', lv: 82, bg: 'snow' }),
    reveal: { text: '雪山のボス・イエティを上級者で倒す', check: () => stageBest(worldStages(7).slice(-1)[0]) >= 3, progress: () => 'まだ' } },
  // ---- ここから: はじめて たおすと コインと かけらが もらえる (reward) ----
  // こうてつマイマイ: HP が とても 多い かわりに 攻撃は ゆっくり・よわい。300 コンボを ねらえる ながい たたかい
  { host: 3, from: 3, e: E('h_ironsnail', '鋼鉄マイマイ', 'tank', 7000, ['armor'], '鋼鉄の殻: コンボ30未満だとダメージ半減。HPがとても多い（攻撃は弱い）',
      '海の底で何百年も眠っていた鋼のカタツムリ。どれだけたたいてもびくともしない。', { sprite: 'snail', filter: 'grayscale(1) brightness(1.15) contrast(1.25)', lv: 40, bg: 'sea', hpMult: 2.8, power: 30 }),
    reward: { coins: 600, shards: 20 },
    reveal: { text: '称号「コンボ使い」（最大コンボ100）を取る', check: () => !!(Save.data.ach || {}).combo100, progress: () => 'まだ' } },
  { host: 4, from: 3, e: E('h_candywitch', 'わたあめゴースト', 'boss', 4600, ['sweet', 'ink'], '甘い誘惑: ミスすると回復し、HP半分から墨でガイドを隠し2回攻撃',
      'お菓子の国のお祭りで生まれたふわふわのおばけ。甘い香りでミスを誘う。', { sprite: 'yukionna', filter: 'hue-rotate(115deg) saturate(2.6) brightness(1.05)', lv: 48, bg: 'candy', power: 45 }),
    reward: { coins: 800, shards: 25 },
    reveal: { text: 'お菓子の国のステージを3つ上級者でクリアする', check: () => worldStages(4).filter(g => stageBest(g) >= 3).length >= 3, progress: () => `${worldStages(4).filter(g => stageBest(g) >= 3).length}/3` } },
  { host: 8, from: 3, e: E('h_thundercloud', '雷雲の主', 'boss', 4400, ['thunder', 'wind'], '雷雲: 落雷の予告（次のお題を打ち切れないと大ダメージ）と、風で文字を揺らす',
      '天空の一番上でうなる金色の雷雲。', { sprite: 'cloud', filter: 'sepia(1) saturate(4) hue-rotate(5deg) brightness(1.1)', lv: 95, bg: 'sky', power: 75 }),
    reward: { coins: 1500, shards: 40 },
    reveal: { text: 'サバイバル「難しい」をクリアする', check: () => svCleared('hard'), progress: () => 'まだ' } },
  // ダイヤマイマイ: 終盤の こうてつマイマイ。いどんだ キャラの レベル +3 に あわせて つよく なる (matchLv) ので、
  // Lv100 を こえた キャラでも ながい たたかいに なり 300 コンボを ねらえる
  { host: 12, from: 3, e: E('h_diamondsnail', 'ダイヤマイマイ', 'tank', 7000, ['armor'], 'ダイヤの殻: コンボ30未満だとダメージ半減。相手のレベルに合わせて強くなり、HPがとても多い（攻撃は弱い）',
      '星の果てで光るダイヤモンドのカタツムリ。挑んだ者と同じだけ強くなる。', { sprite: 'snail', filter: 'hue-rotate(170deg) saturate(1.8) brightness(1.35)', lv: 110, matchLv: 3, bg: 'void', hpMult: 3.4, power: 30 }),
    reward: { coins: 3000, shards: 60 },
    reveal: { text: '星の果てのステージを1つクリアする', check: () => Save.data.cleared > worldStages(12)[0], progress: () => 'まだ' } },
];
for (const h of HIDDEN_DEFS) {
  const e = h.e;
  h.idx = ENEMIES.length;
  ENEMIES.push({ ...e, hidden: true, host: h.host, world: -1, boss: e.type === 'boss', lv: e.lv, base: { ...ENEMY_TYPES[e.type] }, power: e.power || 40,
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

// サイコロりん: サイコロを n 個 ふって 攻撃の 倍率を きめる (バトルと 計算道具で つかう)
// 倍率は 出た 目の 平均。2 個 以上 おなじ 目 (ゾロ目) なら「目 × zoro」の ボーナス (大きい 目ほど 強い)。3 個 そろうと ボーナス 2 倍
// weight: 4・5・6 の 出やすさ (1 = ふつう) / tripleMult: 3 つ そろった ときの ボーナスの 倍率
function rollDice(trait, n = 1, zoro = 0, weight = 1, tripleMult = 2) {
  const one = () => { let r = Math.random() * (3 + 3 * weight); return r < 3 ? 1 + Math.floor(r) : 4 + Math.min(2, Math.floor((r - 3) / weight)); };
  const faces = Array.from({ length: n }, one);
  let mult = faces.reduce((a, f) => a + trait.dice[f - 1], 0) / n;
  const count = {};
  for (const f of faces) count[f] = (count[f] || 0) + 1;
  let face = 0, same = 0;
  for (const [f, c] of Object.entries(count)) if (c >= 2 && (c > same || (c === same && +f > face))) { face = +f; same = c; }
  const bonus = face ? zoro * face * (same >= 3 ? tripleMult : 1) : 0;
  mult *= 1 + bonus;
  return { faces, mult, zoro: face, triple: same >= 3, bonus };
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
  if (e.hidden) return `${e.host + 1}-隠し`;
  return `${e.world + 1}-${worldStages(e.world).indexOf(i) + 1}`;
}

// タイピングの成績評価 (e-typing のスコア式「WPM × 正確率^3」を参考に、ここでは WPM = 1 分あたりの打鍵数)
const RANKS = [
  { min: 0, name: 'E', label: 'スライムの卵' },
  { min: 80, name: 'D', label: '見習いスライム' },
  { min: 130, name: 'C', label: 'ぷるぷるスライム' },
  { min: 180, name: 'B', label: 'いっぱしスライム' },
  { min: 240, name: 'A', label: '早打ちスライム' },
  { min: 310, name: 'S', label: 'スライムナイト' },
  { min: 400, name: 'SS', label: 'スライムマスター' },
  { min: 500, name: 'SSS', label: '伝説のスライム' },
];

function rankFor(score) {
  let r = RANKS[0];
  for (const x of RANKS) if (score >= x.min) r = x;
  return r;
}

if (typeof module !== 'undefined') {
  module.exports = { rollDice, SPECIAL_STAT, charRank, MAIN_STAGES, HIDDEN_DEFS, levelNeed, stageExp, STARTERS, AWAKEN_BONUS, expForLevel, levelFromExp, calcStats, calcDamage, wordPower, evoStage, CHARACTERS, ENEMIES, ENEMY_POWER, applyEnemyPower, BATTLE_HP_SCALE, ENEMY_HP_SCALE, WORLDS, MAX_LV };
}
