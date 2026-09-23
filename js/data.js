// ============================================================
//  キャラクター・敵・成長の計算式
//  経験値テーブル/能力値/ダメージ式はポケモンの公式(第3世代以降)を
//  このゲーム向けに簡略化したもの
// ============================================================

const MAX_LV = 50;
const BATTLE_HP_SCALE = 3;       // バトルを長めに楽しめるよう HP を 3 倍にする
const ENEMY_HP_SCALE = 3.6;      // 敵はさらに少し多め

// 必要経験値: 「中速グループ」の Lv^3 を 0.8 倍 (Lv10 = 800, Lv20 = 6400)
function expForLevel(L) { return L <= 1 ? 0 : Math.floor(0.8 * L * L * L); }

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

// 1 お題あたりの攻撃の威力: 打ったキー数が多いほど強い
function wordPower(keys) { return 10 + keys * 6; }

// 進化段階 (見た目と名前が変わる)
function evoStage(L) { return L >= 20 ? 2 : L >= 10 ? 1 : 0; }

const CHARACTERS = {
  purun: {
    id: 'purun',
    names: ['ぷるん', 'ぷるるん', 'キングぷるん'],
    type: 'みず',
    role: 'バランス型',
    colors: { main: '#4fb3ff', light: '#b5e3ff', dark: '#1f6fc4', accent: '#7cf0ff' },
    // 進化段階ごとの体の色 (ぷるん → ぷるるん → キングぷるん)
    stageColors: [
      { main: '#4fb3ff', light: '#b5e3ff', dark: '#1f6fc4', accent: '#7cf0ff' },
      { main: '#2fd0c8', light: '#c2fff6', dark: '#0f8a8f', accent: '#9bfff0' },
      { main: '#5a6dff', light: '#cfd6ff', dark: '#2a2fa8', accent: '#ffe27a' },
    ],
    base: { hp: 75, atk: 65, def: 65, spd: 65 },
    desc: 'どこにでもいる、ぷるぷるのみずスライム。なんでもそつなくこなす。',
    trait: { name: 'うるおいボディ', desc: 'ノーミスでお題を打ち切ると HP が 4% 回復する' },
    skill: { name: 'アクアヒール', desc: 'HP を 40% 回復し、どくを消す。次の攻撃が 1.5 倍になる' },
  },
  piriri: {
    id: 'piriri',
    names: ['ぴりり', 'ぴりりん', 'ライジンぴりり'],
    type: 'でんき',
    role: 'スピード型',
    colors: { main: '#ffd23f', light: '#fff2a8', dark: '#d99a00', accent: '#fff' },
    stageColors: [
      { main: '#ffd23f', light: '#fff2a8', dark: '#d99a00', accent: '#fff' },
      { main: '#ffa62b', light: '#ffe2a8', dark: '#c45f00', accent: '#fff6a0' },
      { main: '#fff27a', light: '#ffffff', dark: '#d9a800', accent: '#7cf0ff' },
    ],
    base: { hp: 55, atk: 85, def: 45, spd: 95 },
    desc: 'いつもビリビリしているかみなりスライム。打つのが速いほど強くなる。',
    trait: { name: 'でんこうせっか', desc: 'お題を速く打ち切るほど会心率アップ (最大 55%)' },
    skill: { name: 'サンダーボルト', desc: '威力 280 のかみなりを落とす大ダメージ攻撃' },
  },
  gotsun: {
    id: 'gotsun',
    names: ['ごつん', 'ごつごつん', 'ガンセキごつん'],
    type: 'いわ',
    role: 'ぼうぎょ型',
    colors: { main: '#b08a64', light: '#dcc3a3', dark: '#6e5238', accent: '#9be7a0' },
    stageColors: [
      { main: '#b08a64', light: '#dcc3a3', dark: '#6e5238', accent: '#9be7a0' },
      { main: '#8f959e', light: '#d6dae0', dark: '#50565e', accent: '#8fe08a' },
      { main: '#5b5f78', light: '#a4aac6', dark: '#2b2e42', accent: '#c58bff' },
    ],
    base: { hp: 95, atk: 60, def: 90, spd: 45 },
    desc: 'かたくて重たいいわスライム。のんびりやだけど、とにかくタフ。',
    trait: { name: 'かたいからだ', desc: '受けるダメージ 20% カット。ミスしてもコンボが半分残る' },
    skill: { name: 'ロックシールド', desc: '敵の攻撃を 2 回ふせぎ、そのたびに岩で反撃する (ふせいだダメージの 1.5 倍 + 威力 120)' },
  },
};

// 敵キャラクター (ステージ順)
const ENEMIES = [
  {
    id: 'bat', world: 0, name: 'コウモリン', lv: 3, base: { hp: 45, atk: 45, def: 40 },
    power: 36, interval: 4200, exp: 280, diff: 'easy', bg: 'cave',
    desc: 'どうくつにすむ小さなコウモリ。最初の相手にぴったり。',
    ability: null, abilityDesc: 'とくになし',
  },
  {
    id: 'mush', world: 0, name: 'ドクキノコ', lv: 6, base: { hp: 60, atk: 50, def: 55 },
    power: 40, interval: 4400, exp: 320, diff: 'easy', bg: 'forest',
    desc: 'もりのどくキノコ。攻撃をうけると、どくになってしまう。',
    ability: 'poison', abilityDesc: 'どく: 攻撃をうけると 5 秒間 HP がへりつづける',
  },
  {
    id: 'ghost', world: 0, name: 'ユウレイン', lv: 10, base: { hp: 60, atk: 65, def: 50 },
    power: 44, interval: 4200, exp: 360, diff: 'normal', bg: 'grave',
    desc: 'ぼちをさまようおばけ。ローマ字のガイドをかくしてくる。',
    ability: 'fade', abilityDesc: 'ゆうれいのきり: ときどきローマ字ガイドが見えなくなる',
  },
  {
    id: 'goblin', world: 0, name: 'ゴブリン', lv: 15, base: { hp: 80, atk: 80, def: 60 },
    power: 40, interval: 4600, exp: 400, diff: 'normal', bg: 'plain',
    desc: 'こんぼうをふりまわす らんぼうもの。追いつめるとおこりだす。',
    ability: 'rage', abilityDesc: 'げきど: HP が半分をきると攻撃が速くなる',
  },
  {
    id: 'golem', world: 0, name: 'ストーンゴーレム', lv: 21, base: { hp: 95, atk: 85, def: 95 },
    power: 44, interval: 5600, exp: 460, diff: 'hard', bg: 'ruins',
    desc: 'いせきを守るいしのきょじん。とてもかたい。',
    ability: 'armor', abilityDesc: 'いしのよろい: コンボ 30 未満だとダメージ半減',
  },
  {
    id: 'dragon', world: 0, name: 'ドラゴン', lv: 28, base: { hp: 125, atk: 100, def: 90 },
    power: 46, interval: 5400, exp: 600, diff: 'hard', bg: 'volcano', boss: true,
    desc: 'かざんのおうじゃ。HP が半分をきると本気をだす。',
    ability: 'dragon', abilityDesc: 'ほんき: HP 半分で攻撃が速くなり、3 回に 1 回ほのおのブレス',
  },

  // ---------- ワールド 2: うみ ----------
  {
    id: 'crab', world: 1, name: 'カニッパ', lv: 31, base: { hp: 80, atk: 95, def: 105 },
    power: 46, interval: 5200, exp: 480, diff: 'normal', bg: 'sea',
    desc: 'かたいこうらの大きなカニ。ときどき からに とじこもる。',
    ability: 'shell', abilityDesc: 'からにこもる: ときどき 3 秒間 うけるダメージが大きくへる',
  },
  {
    id: 'jelly', world: 1, name: 'クラゲール', lv: 33, base: { hp: 85, atk: 100, def: 80 },
    power: 46, interval: 5000, exp: 500, diff: 'hard', bg: 'sea',
    desc: 'ビリビリするクラゲ。まちがえて さわると しびれる。',
    ability: 'shock', abilityDesc: 'しびれ: ミスすると 自分が ダメージをうける',
  },
  {
    id: 'shark', world: 1, name: 'サメキバ', lv: 35, base: { hp: 100, atk: 115, def: 85 },
    power: 48, interval: 4600, exp: 520, diff: 'hard', bg: 'sea',
    desc: 'うみのハンター。弱ってくると どうもうになる。',
    ability: 'rage', abilityDesc: 'ちのにおい: HP が半分をきると 攻撃が速くなる',
  },
  {
    id: 'kraken', world: 1, name: 'クラーケン', lv: 38, base: { hp: 130, atk: 110, def: 100 },
    power: 48, interval: 5400, exp: 700, diff: 'hard', bg: 'sea', boss: true,
    desc: 'しんかいの ぬし。すみを はいて じゃまをしてくる。',
    ability: 'ink', abilityDesc: 'すみはき: ときどき お題が すみで見えにくくなる。HP 半分から 2 れんぞく攻撃',
  },

  // ---------- ワールド 3: ゆきやま ----------
  {
    id: 'penguin', world: 2, name: 'ペンギナイト', lv: 40, base: { hp: 90, atk: 105, def: 100 },
    power: 46, interval: 4800, exp: 540, diff: 'hard', bg: 'snow',
    desc: 'たてと やりを もったペンギンの きし。',
    ability: 'shell', abilityDesc: 'こおりのたて: ときどき 3 秒間 うけるダメージが大きくへる',
  },
  {
    id: 'snowman', world: 2, name: 'ユキダルマン', lv: 42, base: { hp: 100, atk: 100, def: 100 },
    power: 46, interval: 5000, exp: 560, diff: 'hard', bg: 'snow',
    desc: 'うごく ゆきだるま。ゆきを あつめて 回復する。',
    ability: 'regen', abilityDesc: 'ゆきだまり: ときどき HP を回復する',
  },
  {
    id: 'wolf', world: 2, name: 'アイスウルフ', lv: 44, base: { hp: 100, atk: 115, def: 90 },
    power: 46, interval: 4400, exp: 580, diff: 'hard', bg: 'snow',
    desc: 'こおりの いきを はく オオカミ。',
    ability: 'freeze', abilityDesc: 'こおりのいき: 攻撃をうけると 1 秒間 こおって 入力できない',
  },
  {
    id: 'yeti', world: 2, name: 'イエティ', lv: 47, base: { hp: 130, atk: 115, def: 105 },
    power: 48, interval: 5400, exp: 760, diff: 'hard', bg: 'snow', boss: true,
    desc: 'ゆきやまの ぬし。ふぶきを よびおこす。',
    ability: 'blizzard', abilityDesc: 'ふぶき: ときどき 漢字とかなが見えなくなる。攻撃で こおらせてくる',
  },

  // ---------- ワールド 4: マグマのしろ ----------
  {
    id: 'imp', world: 3, name: 'ファイアインプ', lv: 48, base: { hp: 100, atk: 115, def: 95 },
    power: 46, interval: 4600, exp: 600, diff: 'hard', bg: 'magma',
    desc: 'しろを まもる ほのおの こあくま。',
    ability: 'poison', statusName: 'やけど', abilityDesc: 'やけど: 攻撃をうけると 5 秒間 HP がへりつづける',
  },
  {
    id: 'mgolem', world: 3, name: 'マグマゴーレム', lv: 50, base: { hp: 105, atk: 115, def: 115 },
    power: 46, interval: 5600, exp: 620, diff: 'hard', bg: 'magma',
    desc: 'ようがんで できた きょじん。とても かたい。',
    ability: 'armor', abilityDesc: 'マグマのよろい: コンボ 30 未満だと ダメージ半減',
  },
  {
    id: 'salamander', world: 3, name: 'サラマンダー', lv: 51, base: { hp: 100, atk: 120, def: 100 },
    power: 48, interval: 4600, exp: 640, diff: 'hard', bg: 'magma',
    desc: 'ほのおを まとう トカゲ。かげろうで 目をくらます。',
    ability: 'fade', abilityDesc: 'かげろう: ときどき ローマ字ガイドが ゆらめいて見えなくなる',
  },
  {
    id: 'demon', world: 3, name: 'まおう', lv: 54, base: { hp: 140, atk: 120, def: 110 },
    power: 50, interval: 5600, exp: 1000, diff: 'hard', bg: 'magma', boss: true, final: true,
    desc: 'マグマのしろの あるじ。さいごの てき。',
    ability: 'demon', abilityDesc: 'まおうのちから: HP 2/3 で やみ (ガイドが消える)、1/3 で 攻撃が速くなり ひっさつゲージをうばう',
  },
];

// ワールド (マップ) の一覧
const WORLDS = [
  { id: 'grass', name: 'そうげん' },
  { id: 'sea', name: 'うみ' },
  { id: 'snow', name: 'ゆきやま' },
  { id: 'magma', name: 'マグマのしろ' },
];

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
  module.exports = { expForLevel, levelFromExp, calcStats, calcDamage, wordPower, CHARACTERS, ENEMIES, BATTLE_HP_SCALE, ENEMY_HP_SCALE, WORLDS };
}
