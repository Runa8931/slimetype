// ============================================================
//  全体の管理: セーブデータ・画面切り替え・共通の部品
// ============================================================

const $ = sel => document.querySelector(sel);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------------- セーブデータ (ブラウザ内に保存) ----------------
const Save = {
  KEY: 'slime-typing-save-v1',
  data: null,

  fresh() {
    return {
      active: null,
      chars: Object.fromEntries(Object.keys(CHARACTERS).map(id => [id, { exp: 0 }])),
      cleared: 0,
      best: {},
      settings: { lang: 'ja', sound: true, volume: 0.8, seVol: 1, keyVol: 1, diff: 'easy', time: 60, lite: false, shake: true, kps: true, kb: true },
      missKeys: {},
      totals: { keys: 0, plays: 0, wins: 0 },
      coins: START_COINS,
      gacha: { items: {}, chars: {}, awaken: {}, shards: 0, pulls: 0, ssr: 0 },
      wear: {},
      doors: {},
    };
  },

  load() {
    let raw = null, d = null;
    try { raw = localStorage.getItem(this.KEY); } catch (e) { /* 読めない 環境 */ }
    try { d = JSON.parse(raw); } catch (e) { d = null; }
    // 起動する たびに 今の セーブを 控えに 残す (1 日 1 つ・版が 変わったとき)。壊れて 読めない ときも 控えに 逃がす
    if (raw) this.keepBackup(raw, d ? '' : '読めなかったセーブ');
    this.rev = (d && d._rev) || 0;
    this.noSave = !raw; // セーブが 見つからなかった (タイトルで 控えからの 復元を 案内する)
    // ぼうけんのとびら より 前の セーブ: つかったことの ある ものは ひらいた ことに する
    this.needDoorMigrate = !!d && !d.doors;
    // プレイ時間を 記録する 前の セーブ (打った キーの 数から 推定する)
    this.needPtEstimate = !!d && !d.playtime;
    const f = this.fresh();
    this.data = d ? {
      ...f, ...d,
      chars: { ...f.chars, ...(d.chars || {}) },
      settings: { ...f.settings, ...(d.settings || {}) },
      totals: { ...f.totals, ...(d.totals || {}) },
      gacha: { ...f.gacha, ...(d.gacha || {}) },
    } : f;
    // ほかの タブが セーブを 書いたら しらべる (古い タブが 新しい データを 上書きしないように)
    addEventListener('storage', e => { if (e.key === this.KEY) this.onOtherWrite(e.newValue); });
  },

  // 書いた 回数 (_rev) を セーブに 入れて おき、書く 前に「自分が 読んだ あとに ほかの タブが 書いていないか」を しらべる
  save() {
    if (this.locked || this.stale) return; // 読み込み中・ほかの タブの ほうが 新しい ときは 書かない
    try {
      const cur = readRev(localStorage.getItem(this.KEY));
      if (cur > this.rev) { this.markStale(); return; } // ほかの タブが 先に 進んでいる
      this.rev = Math.max(this.rev, cur) + 1;
      this.data._rev = this.rev;
      localStorage.setItem(this.KEY, JSON.stringify(this.data));
    } catch (e) { /* 保存できない環境でも遊べる */ }
  },

  // ほかの タブが セーブを 書いた
  onOtherWrite(val) {
    if (this.locked || this.stale) return;
    const r = readRev(val);
    if (r > this.rev) { this.markStale(); return; } // むこうの ほうが 新しい → この タブは 書くのを やめる
    // むこうが 古い (前の 版の タブなど) → この タブの データで すぐ 書きもどす
    try { this.data._rev = this.rev = Math.max(this.rev, r) + 1; localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) { /* */ }
    if (typeof toast === 'function') toast('ほかのタブで古いスライムタイピングが開いています。データが消えないよう、そのタブは閉じてください', 5000);
  },

  // この タブでは もう 書かない (再読み込みで 新しい データを 読む)
  markStale() {
    if (this.stale) return;
    this.stale = true;
    const el = document.createElement('div');
    el.className = 'stale-modal';
    el.innerHTML = `<div class="stale-box"><div class="stale-title">⚠️ ほかのタブでも遊んでいます</div>
      <p>スライムタイピングが別のタブ（ウィンドウ）でも開かれていて、そちらのほうが新しいデータです。<br>データが消えないように、このタブでは保存を止めました。</p>
      <p class="stale-sub">続けるときは、どちらか 1 つのタブだけで遊んでください。</p>
      <button class="btn big stale-reload">このタブを最新のデータで開きなおす</button></div>`;
    document.body.appendChild(el);
    el.querySelector('.stale-reload').onclick = () => location.reload();
  },

  // ---- 控え (自動バックアップ) ----
  BACKUP_KEY: 'slime-typing-save-v1-backups',
  BACKUP_MAX: 6,
  backups() { try { return JSON.parse(localStorage.getItem(this.BACKUP_KEY)) || []; } catch (e) { return []; } },
  keepBackup(raw, note = '') {
    if (!raw) return;
    const list = this.backups();
    const day = new Date().toLocaleDateString('ja-JP');
    const last = list[list.length - 1];
    if (!note && last && last.day === day && last.ver === GAME_VERSION) return; // 今日 この 版の 控えは もう ある
    if (last && last.raw === raw) return;
    list.push({ at: Date.now(), day, ver: GAME_VERSION, note, sum: saveSummary(raw), raw });
    while (list.length > this.BACKUP_MAX) list.shift();
    // 入りきらない ときは 古い 控えから 消す
    for (;;) {
      try { localStorage.setItem(this.BACKUP_KEY, JSON.stringify(list)); return; } catch (e) { if (list.length <= 1) return; list.shift(); }
    }
  },
};

const GAME_VERSION = 'v5.17.2';
// セーブの 文字から 書いた 回数を 取り出す (全部 読まなくて よいように 文字で さがす)
function readRev(raw) { const m = raw && /"_rev":(\d+)/.exec(raw); return m ? +m[1] : 0; }
// 控えの 説明 (いちばん レベルの 高い キャラ・ステージ・コイン)
function saveSummary(raw) {
  try {
    const d = JSON.parse(raw);
    let best = null, bestExp = -1;
    for (const [id, c] of Object.entries(d.chars || {})) if (CHARACTERS[id] && (c.exp || 0) > bestExp) { bestExp = c.exp || 0; best = id; }
    const grown = Object.entries(d.chars || {}).filter(([id, c]) => CHARACTERS[id] && (c.exp || 0) > 0).length;
    // 解放した キャラ (hasChar と 同じ 決まり: ぷるん・ガチャで 出た・扉が 開いた)
    const gc = (d.gacha && d.gacha.chars) || {}, dr = d.doors || {};
    const owned = Object.keys(CHARACTERS).filter(id => !!gc[id] || (!CHARACTERS[id].gacha && (id === 'purun' || !!dr['ch_' + id]))).length;
    const pt = d.playtime ? Math.round((d.playtime.play || 0) + (d.playtime.est || 0)) : 0;
    return { lv: best ? levelFromExp(bestExp) : 1, ch: best ? CHARACTERS[best].names[0] : '', cleared: d.cleared || 0, coins: d.coins || 0, grown, owned, pt, ach: Object.keys(d.ach || {}).length };
  } catch (e) { return null; }
}

// いま えらんでいる バトルの 難易度
function battleDiffKey() { const k = Save.data.settings.bdiff; return BATTLE_DIFFS[k] ? k : 'beg'; }
function setBattleDiff(k) { if (BATTLE_DIFFS[k]) { Save.data.settings.bdiff = k; Save.save(); SFX.select(); } }
// ステージごとに クリアした いちばん 上の 難易度 (0 = まだ / 1 = 初心者 / 2 = 中級者 / 3 = 上級者)
function stageBest(i) { return (Save.data.bbest || {})[i] || 0; }
function diffBadges(i) {
  const b = stageBest(i);
  const st = i < MAIN_STAGES ? stageStars(i) : 0;
  return BATTLE_DIFF_KEYS.map((k, j) => `<span class="dmark ${b > j ? 'on' : ''}" style="--dc:${BATTLE_DIFFS[k].color}" title="${BATTLE_DIFFS[k].name}">${BATTLE_DIFFS[k].name[0]}</span>`).join('')
    + (st ? `<span class="smark" title="★評価">${stageStarText(st)}</span>` : '');
}

// ガチャ限定キャラは ガチャで 出るまで つかえない
// さいしょの キャラは ぷるんだけ。ほかは ぼうけんのとびら (または ガチャ) で ひらく
function hasChar(id) {
  const got = !!(Save.data.gacha && Save.data.gacha.chars[id]);
  if (CHARACTERS[id].gacha) return got;
  return id === 'purun' || got || doorOpen('ch_' + id);
}
// せんざいかくせいの ★ の数 (0〜4)
function awakenOf(id) { return Math.min(AWAKEN_MAX, (Save.data.gacha && Save.data.gacha.awaken[id]) || 0); }

// とくべつな キャラの 能力 (キャラ選びで 見せる 基本の 数字) と バッジ
function rankBase(id) {
  const b = CHARACTERS[id].base;
  return charRank(id) ? { hp: Math.round(b.hp * SPECIAL_STAT), atk: Math.round(b.atk * SPECIAL_STAT), def: Math.round(b.def * SPECIAL_STAT), spd: b.spd } : b;
}
// とくべつな キャラの カードの かざり (四すみの ほし・ななめに 通る 光)
function rankFrame(id) {
  const r = charRank(id);
  if (!r) return '';
  const g = r === 'ssr' ? '✦' : '★';
  return `<i class="rank-frame"><b class="tl">${g}</b><b class="tr">${g}</b><b class="bl">${g}</b><b class="br">${g}</b><em class="rank-glint"></em></i>`;
}
function rankBadge(id) {
  const r = charRank(id);
  return r === 'ssr' ? '<span class="badge rank-ssr">✦ SSR</span>' : r === 'special' ? '<span class="badge rank-sp">★特別</span>' : '';
}

// 正しく 1 回 打ったときに ふえる コンボ (ふえりんは 1.5〜2 ずつ。はんぱは o.comboAcc に ためる)
function comboStep(o, trait) {
  if (!trait.comboGain) return 1;
  o.comboAcc = (o.comboAcc || 0) + trait.comboGain;
  const add = Math.floor(o.comboAcc);
  o.comboAcc -= add;
  return add;
}

// キャラの現在の状態をまとめて返す
function charInfo(id) {
  const def = CHARACTERS[id];
  const exp = Save.data.chars[id].exp;
  const awaken = awakenOf(id);
  const cap = MAX_LV + awaken; // ★ 1 つごとに レベルの上限 +1
  const L = levelFromExp(exp, cap);
  const stage = evoStage(L);
  const raw = calcStats(def.base, L);
  const k = 1 + AWAKEN_STAT * awaken;
  const trait = def.forms[stage].trait;
  return {
    id, def, exp, L, stage, awaken, cap,
    name: def.names[stage],
    // 進化段階に合わせた とくせい・ひっさつ (かくせいで とくせいが 少し のびる)
    trait: awaken && AWAKEN_BONUS[id] ? AWAKEN_BONUS[id].apply(trait, awaken) : trait,
    skill: def.forms[stage].skill,
    // とくべつな キャラは HP・こうげき・ぼうぎょ +5%
    stats: Object.fromEntries(Object.entries(raw).map(([key, v]) => [key, Math.round(v * k * (key !== 'spd' && charRank(id) ? SPECIAL_STAT : 1))])),
    curLvExp: expForLevel(L),
    nextLvExp: L >= cap ? null : expForLevel(L + 1),
  };
}

// 経験値を加算して、レベルアップの前後情報を返す
function grantExp(id, amount) {
  const before = charInfo(id);
  Save.data.chars[id].exp += amount;
  Save.save();
  const after = charInfo(id);
  return { before, after, amount, leveled: after.L > before.L, evolved: after.stage > before.stage };
}

// 打鍵から 得られる 経験値 (れんしゅう・バトル 共通)
//   打鍵 × 正確率² × (1 + 打鍵/分 ÷ 300) を「いまの レベルの 1 レベルぶん」に 対する わりあいに する
//   → 60 秒・1 分 200 打鍵で だいたい 0.5 レベルぶん。レベルが ひくくても 高くても 同じ ペースで 上がる
function typingPerf(correct, miss, seconds) {
  if (correct <= 0) return 0;
  const acc = correct / (correct + miss);
  const kpm = correct / (seconds / 60);
  return correct * acc * acc * (1 + kpm / 300) / 600;
}
function typingExp(correct, miss, seconds, mult = 1, L = 1) {
  const p = typingPerf(correct, miss, seconds);
  return p > 0 ? Math.max(1, Math.round(levelNeed(L) * p * mult)) : 0;
}

// お題を 打ち終わったとき「5.8 打/秒」を お題の 枠の 左上に 出す (hot: おんぷるの ボーナスが つく 速さ)
function showKps(root, kps, extra = '', hot = false) {
  if (Save.data.settings.kps === false) return; // 設定で 表示しない
  const r = root.getBoundingClientRect(); // お題の 枠の 左上 (PERFECT! や ひっさつ欄と かさならない)
  floatText(r.left + 90, r.top + 2, `${kps.toFixed(1)}打/秒${extra}`, 'kps-pop' + (hot ? ' hot' : ''));
}

// PERFECT! を お題の 枠の 外 (右上) に 出す (次の お題の 文字に かぶらない ように)
function perfectPop(root) {
  const r = root.getBoundingClientRect();
  floatText(r.right - 70, r.top - 14, 'PERFECT!', 'perfect');
}

function recordMiss(key) {
  if (!key || key === ' ') return;
  Save.data.missKeys[key] = (Save.data.missKeys[key] || 0) + 1;
  // 成長記録用 (hitKeys と 同じ 時から 数える)
  const m = Save.data.keyMiss = Save.data.keyMiss || {};
  m[key] = (m[key] || 0) + 1;
}

// 正しく 打った キーの 数 (成長記録の キーボードで、ミスの わりあいを 出す)
function recordHit(key) {
  if (!key || key === ' ') return;
  const h = Save.data.hitKeys = Save.data.hitKeys || {};
  h[key] = (h[key] || 0) + 1;
  if (typeof masteryAdd === 'function') masteryAdd(Save.data.active, 'keys'); // 熟練度: 正しく 打った 数
}

function weakKeys(n = 5) {
  return Object.entries(Save.data.missKeys).sort((a, b) => b[1] - a[1]).slice(0, n);
}

// ---------------- お題表示 (練習・バトル共通) ----------------
function renderTyping(root, word, target, { hideRoma = false } = {}) {
  const en = Save.data.settings.lang === 'en';
  root.classList.toggle('en', en);
  const disp = root.querySelector('.tp-display');
  const kana = root.querySelector('.tp-kana');
  const roma = root.querySelector('.tp-roma');
  if (disp.dataset.word !== word.t) { disp.textContent = en ? '' : word.t; disp.dataset.word = word.t; }
  if (!en) {
    const n = target.kanaDoneLength();
    kana.innerHTML = `<span class="done">${esc(word.k.slice(0, n))}</span>${esc(word.k.slice(n))}`;
  } else kana.innerHTML = '';
  const g = target.guide();
  const vis = s => esc(s).replace(/ /g, '<span class="sp">␣</span>');
  roma.innerHTML = `<span class="done">${vis(g.done)}</span><span class="next">${vis(g.rest.slice(0, 1))}</span><span class="rest">${vis(g.rest.slice(1))}</span>`;
  roma.classList.toggle('hidden-guide', hideRoma);
}

// サバイバルの記録: クリアした一番むずかしい難易度 (なければ 一番長く生きのこった時間)
function svRecord(best) {
  const keys = ['hell', 'oni', 'hard', 'normal', 'easy'];
  const names = { easy: '簡単', normal: '普通', hard: '難しい', oni: '鬼', hell: '地獄' };
  const c = keys.find(k => best['sv-' + k] && best['sv-' + k].cleared);
  if (c) return `<small>${names[c]}</small>クリア`;
  const t = keys.map(k => best['sv-' + k]).filter(Boolean).sort((a, b) => b.time - a.time)[0];
  return t ? fmtTime(t.time) : '—';
}

function fmtTime(sec) {
  sec = Math.max(0, Math.floor(sec));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

function esc(s) {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// ---------------- 画面下のキーボード ----------------
const KB_ROWS = ['1234567890-', 'qwertyuiop', 'asdfghjkl;', 'zxcvbnm,./'];
const FINGER = {};
[['1qaz', 0], ['2wsx', 1], ['3edc', 2], ['45rtfgvb', 3], ['67yuhjnm', 4], ['8ik,', 5], ['9ol.', 6], ['0-p;/', 7]]
  .forEach(([ks, f]) => [...ks].forEach(k => { FINGER[k] = f; }));

function buildKeyboard(el) {
  el.innerHTML = KB_ROWS.map((row, i) =>
    `<div class="kb-row r${i}">${[...row].map(k => `<div class="key f${FINGER[k]}" data-k="${esc(k)}">${k === ';' ? ';' : k.toUpperCase()}</div>`).join('')}</div>`
  ).join('') + '<div class="kb-row"><div class="key space f8" data-k=" ">SPACE</div></div>';
}

function highlightKey(el, k) {
  el.querySelectorAll('.key.next').forEach(x => x.classList.remove('next'));
  const t = el.querySelector(`.key[data-k="${CSS.escape(k)}"]`);
  if (t) t.classList.add('next');
}

function pressKey(el, k, miss) {
  const t = el.querySelector(`.key[data-k="${CSS.escape(k)}"]`);
  if (t) replayAnim(t, miss ? 'pressed-miss' : 'pressed', 150);
}

// ---------------- 画面の切り替え ----------------
const Screens = {};

const App = {
  current: null,

  show(name, arg) {
    PlayTime.flush(); // 画面を かえる 前に その モードの 時間を 足す
    const prev = Screens[this.current];
    if (prev && prev.leave) prev.leave();
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $('#scr-' + name).classList.add('active');
    this.current = name;
    this.shownAt = performance.now();
    if (Screens[name] && Screens[name].enter) Screens[name].enter(arg);
    // タイトルは 草原の 背景 (ホームは もとの 星空)
    if (name === 'title') Meadow.show(true); else Meadow.hide();
  },

  boot() {
    Save.load();
    if (Save.needDoorMigrate) migrateDoors();
    if (refundDailyOnce()) setTimeout(() => toast('🎁 毎日タイピングガチャの今日の分をもう一度遊べるようにしました（ガチャ画面から）', 6000), 1500);
    PlayTime.init(Save.needPtEstimate);
    applySettings(); // 音量・エフェクトなど (settings.js)
    // セーブが 見つからないのに 控えが ある: 消えた ときの 戻し方を 知らせる
    if (Save.noSave && Save.backups().length) setTimeout(() => toast('セーブが見つかりませんでした。設定（0キー）の「🕘 前のセーブに戻す」から前のデータに戻せます', 8000), 1200);
    FX.init();

    document.addEventListener('keydown', e => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // 押しっぱなしによる連続入力と、画面を切り替えた直後の入力は無視する
      if (e.repeat || performance.now() - this.shownAt < 250) { e.preventDefault(); return; }
      if (e.key === 'Process' || e.isComposing || /^[Ａ-ｚ]$/.test(e.key)) {
        toast('日本語入力(IME)がオンになっています。「英数」キーで半角英数にしてください');
        e.preventDefault();
        return;
      }
      // 設定画面が 開いている あいだは 設定画面だけが キーを うけとる
      if (Settings.isOpen) { Settings.onKey(e); return; }
      if (e.key === '0' && SETTINGS_KEY_SCREENS.includes(this.current)) { Settings.open(); return; }
      const s = Screens[this.current];
      if (e.key === 'Tab') e.preventDefault();
      if (s && s.onKey) {
        const handled = s.onKey(e);
        if (handled !== false && (e.key === ' ' || e.key === 'Tab' || e.key === "'" || e.key === '/')) e.preventDefault();
      }
    });

    // キーを離したとき (移動の操作で使う)
    document.addEventListener('keyup', e => {
      const s = Screens[this.current];
      if (s && s.onKeyUp) s.onKeyUp(e);
    });
    addEventListener('blur', () => {
      const s = Screens[this.current];
      if (s && s.onBlur) s.onBlur();
    });

    this.show('title');
  },
};

// ---------------- タイトル ----------------
Screens.title = {
  enter() {
    $('#title-slimes').innerHTML = Object.keys(CHARACTERS).filter(hasChar)
      .map((id, i) => `<div class="sprite bounce d${i}">${slimeSVG(id, 0)}</div>`).join('');
    $('#btn-start').onclick = () => this.go();
    typeTitle();
  },
  go() {
    SFX.select();
    App.show(Save.data.active ? 'home' : 'select');
  },
  onKey(e) { if (e.key === ' ' || e.key === 'Enter') this.go(); },
};

// ---------------- キャラクター選択 ----------------
function statBars(stats, max) {
  const labels = { hp: 'HP', atk: '攻撃', def: '防御', spd: '素早さ' };
  return Object.keys(labels).map(k =>
    `<div class="stat"><span>${labels[k]}</span><div class="stat-bar"><div class="stat-fill s-${k}" style="width:${clamp(stats[k] / max * 100, 4, 100)}%"></div></div><b>${stats[k]}</b></div>`
  ).join('');
}

Screens.select = {
  enter() {
    const ids = Object.keys(CHARACTERS);
    $('#base-rules').innerHTML = BASE_RULES.map(x => `<li>${x}</li>`).join('');
    $('#select-grid').innerHTML = ids.map((id, i) => {
      const c = charInfo(id);
      const d = c.def;
      if (!hasChar(id)) {
        return `<button class="char-card locked ${charRank(id) ? 'rank-' + charRank(id) : ''}" data-id="${id}" disabled>
          <span class="mc-key">${i + 1}</span>
          <div class="sprite">${slimeSVG(id, 0, {})}</div>
          <div class="cc-name">？？？</div>
          <div class="badges">${d.gacha ? '<span class="badge gacha">ガチャ限定</span>' : '<span class="badge door">🚪 扉</span>'}<span class="badge">${d.role}</span></div>
          <p class="cc-desc">${d.gacha ? 'ガチャで出会える不思議なスライム。交換所でかけらと交換もできる。' : lockNote('ch_' + id)}</p>
        </button>`;
      }
      return `<button class="char-card ${Save.data.active === id ? 'current' : ''} ${charRank(id) ? 'rank-' + charRank(id) : ''}" data-id="${id}" style="--cc:${d.colors.main};--cd:${d.colors.dark}">
        ${rankFrame(id)}<span class="mc-key">${i + 1}</span>
        <div class="sprite bounce d${i}">${slimeSVG(id, c.stage)}</div>
        <div class="cc-name">${c.name} <small>Lv.${c.L}</small></div>
        ${c.awaken ? `<div class="cc-stars">${starText(c.awaken)}</div>` : ''}
        <div class="badges">${rankBadge(id)}<span class="badge type-${id}">${d.type}</span><span class="badge">${d.role}</span></div>
        <p class="cc-desc">${d.desc}</p>
        <div class="stats">${statBars(rankBase(id), 100)}</div>
        ${abilityHtml(c)}
        ${masteryHtml(id)}
        <div class="evo-note">Lv.20・40・60・80で進化すると特性・必殺もパワーアップ</div>
      </button>`;
    }).join('');
    $('#select-grid').querySelectorAll('.char-card:not(.locked)').forEach(b => { b.onclick = () => this.pick(b.dataset.id); });
    $('#btn-select-back').onclick = () => this.back();
  },
  pick(id) {
    Save.data.active = id;
    Save.save();
    SFX.select();
    const card = document.querySelector(`.char-card[data-id="${id}"] .sprite`);
    const p = FX.center(card);
    FX.burst(p.x, p.y, { colors: [CHARACTERS[id].colors.main, '#fff'], count: 30, shape: 'star', size: 6 });
    setTimeout(() => App.show('home'), 350);
  },
  back() { App.show(Save.data.active ? 'home' : 'title'); },
  onKey(e) {
    const ids = Object.keys(CHARACTERS);
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= ids.length && hasChar(ids[n - 1])) this.pick(ids[n - 1]);
    if (e.key === 'Escape') this.back();
  },
};

// ---------------- ホーム ----------------
Screens.home = {
  enter() {
    this.render();
    $('#go-practice').onclick = () => { SFX.select(); App.show('psetup'); };
    $('#go-battle').onclick = () => { SFX.select(); App.show('stages'); };
    $('#go-select').onclick = () => { SFX.select(); App.show('select'); };
    // まだ ひらいていない モードは 条件を 知らせる
    const gate = (door, go) => () => { if (doorOpen(door)) { SFX.select(); go(); } else { SFX.miss(); toast(lockNote(door), 2600); } };
    $('#go-survival').onclick = gate('survival', () => App.show('survival'));
    $('#go-dex').onclick = () => { SFX.select(); App.show('dex'); };
    $('#go-ach').onclick = () => { SFX.select(); App.show('ach'); };
    $('#go-gacha').onclick = gate('gacha', () => App.show('gacha'));
    $('#go-wardrobe').onclick = gate('gacha', () => App.show('wardrobe'));
    $('#go-doors').onclick = () => { SFX.select(); App.show('doors'); };
    $('#go-growth').onclick = () => { SFX.select(); App.show('growth'); };
    $('#go-challenge').onclick = () => { SFX.select(); App.show('challenge'); };
    $('#go-dan').onclick = () => { SFX.select(); Screens.dan.from = 'home'; App.show('dan'); };
    // これまでの記録で とれる しょうごうが あれば 知らせる
    announceDoors(checkDoors(), 300);
    checkAchievements(null).forEach((a, i) => setTimeout(() => toast(`🏅 称号「${a.name}」を手に入れた！（🪙+${ACH_COINS}）`, 2600), 400 + i * 2800));
    // 音量・エフェクト・言語などは 設定画面 (settings.js) で 変える
    $('#go-settings').onclick = () => Settings.open();
  },

  render() {
    const c = charInfo(Save.data.active);
    const d = c.def;
    const s = Save.data.settings;

    const expPct = c.nextLvExp ? (c.exp - c.curLvExp) / (c.nextLvExp - c.curLvExp) * 100 : 100;
    const nextEvo = c.stage < EVO_LEVELS.length ? `Lv.${EVO_LEVELS[c.stage]}で${c.stage === EVO_LEVELS.length - 1 ? '最終' : ''}進化！` : '最後の姿';
    $('#home-char').style.setProperty('--cc', d.colors.main);
    $('#home-char').className = 'panel home-char' + (charRank(c.id) ? ' rank-' + charRank(c.id) : '');
    $('#home-char').innerHTML = `${rankFrame(c.id)}
      <div class="hc-top">
        <div class="sprite big bounce">${slimeSVG(c.id, c.stage)}</div>
        <div class="hc-id">
          <div class="hc-name">${c.name}${c.awaken ? ` <span class="hc-stars">${starText(c.awaken)}</span>` : ''}</div>
          ${currentTitle() ? `<div class="hc-title">🏅 ${currentTitle()}</div>` : ''}
          <div class="badges">${rankBadge(c.id)}<span class="badge type-${c.id}">${d.type}</span><span class="badge">${d.role}</span><span class="badge evo">${nextEvo}</span></div>
          <div class="hc-lv">Lv.<b>${c.L}</b></div>
          <div class="expbar"><div class="exp-fill" style="width:${expPct}%"></div></div>
          <div class="exp-text">${c.nextLvExp ? `次のレベルまであと <b>${c.nextLvExp - c.exp}</b> EXP` : 'レベルMAX！'}</div>
        </div>
      </div>
      <div class="stats">${statBars(c.stats, Math.max(60, c.stats.hp))}</div>
      ${abilityHtml(c)}
      ${c.stage < EVO_LEVELS.length ? (() => {
        // 進化したときの すがた (かくせいの ぶんも ふくめる)
        const nt = d.forms[c.stage + 1].trait;
        const next = { ...c, stage: c.stage + 1, trait: c.awaken ? AWAKEN_BONUS[c.id].apply(nt, c.awaken) : nt, skill: d.forms[c.stage + 1].skill };
        return `<div class="next-evo"><b>Lv.${EVO_LEVELS[c.stage]}で「${d.names[c.stage + 1]}」に進化すると…</b>${abilityHtml(next)}</div>`;
      })() : ''}
      <details class="base-rules"><summary>普通のキャラの基本（比べるための数字）</summary><ul>${BASE_RULES.map(x => `<li>${x}</li>`).join('')}</ul></details>`;

    $('#dex-count').textContent = `${dexCount()}/${ENEMIES.length}`;
    $('#ach-count').textContent = `${achCount()}/${ACHIEVEMENTS.length}`;
    $('#home-coins').textContent = Save.data.coins || 0;
    $('#doors-count').textContent = `${doorCount()}/${DOORS.length}`;
    $('#ch-count').textContent = `★${starTotal()}`;
    $('#dan-count').textContent = danRank() >= 0 ? danName() : '';
    // ひらいていない モードの カード
    for (const [el, door] of [['#go-survival', 'survival'], ['#go-gacha', 'gacha'], ['#go-wardrobe', 'gacha']]) {
      const card = $(el), open = doorOpen(door);
      card.classList.toggle('locked', !open);
      let note = card.querySelector('.lock-note');
      if (!open && !note) { note = document.createElement('span'); note.className = 'lock-note'; card.appendChild(note); }
      if (note) note.textContent = open ? '' : lockNote(door);
    }
    $('#home-shards').textContent = gachaData().shards;
    const cc = collectCount();
    $('#gacha-count').textContent = `${cc.have}/${cc.total}`;
    $('#gacha-daily').textContent = doorOpen('gacha') && !dailyDone() ? '⌨️ 毎日ガチャOK！' : '';
    const best = Save.data.best;
    const lang = s.lang;
    const diffName = { easy: '簡単', normal: '普通', hard: '難しい' };
    const wk = weakKeys(5);
    $('#home-records').innerHTML = `
      <h3>記録 <small>（${lang === 'en' ? 'English' : '日本語'}）</small></h3>
      <div class="rec-grid">
        ${Object.keys(diffName).map(k => `<div><span>${diffName[k]}</span><b>${best[lang + '-' + k] ?? '—'}</b></div>`).join('')}
        <div><span>バトル突破</span><b>${Save.data.cleared}/${MAIN_STAGES}</b></div>
        <div><span>サバイバル</span><b>${svRecord(best)}</b></div>
        <div><span>段位</span><b>${danName()}</b></div>
        <div><span>プレイ時間</span><b>${(PlayTime.flush(), fmtHMS(PlayTime.total()))}</b></div>
      </div>
      <div class="weak"><span>苦手なキー</span>${wk.length ? wk.map(([k, n]) => `<kbd>${k === ';' ? ';' : k.toUpperCase()}</kbd><small>${n}</small>`).join('') : '<small>まだデータがありません</small>'}</div>`;
  },

  onKey(e) {
    if (e.key === '1') $('#go-practice').click();
    if (e.key === '2') $('#go-battle').click();
    if (e.key === '3') $('#go-survival').click();
    if (e.key === '4') $('#go-select').click();
    if (e.key === '5') $('#go-dex').click();
    if (e.key === '6') $('#go-ach').click();
    if (e.key === '7') $('#go-gacha').click();
    if (e.key === '8') $('#go-wardrobe').click();
    if (e.key === '9') $('#go-doors').click();
    if (e.key.toLowerCase() === 'r') $('#go-growth').click();
    if (e.key.toLowerCase() === 'c') $('#go-challenge').click();
    if (e.key.toLowerCase() === 'd') $('#go-dan').click();
    // 0 は 設定 (App の キー処理で 開く)
    if (e.key === 'Escape') App.show('title');
  },
};
