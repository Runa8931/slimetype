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
      settings: { lang: 'ja', sound: true, volume: 0.8, diff: 'easy', time: 60, lite: false },
      missKeys: {},
      totals: { keys: 0, plays: 0, wins: 0 },
      coins: START_COINS,
      gacha: { items: {}, chars: {}, awaken: {}, shards: 0, pulls: 0, ssr: 0 },
      wear: {},
      doors: {},
    };
  },

  load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(this.KEY)); } catch (e) { /* 読めなければ新規 */ }
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
  },

  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) { /* 保存できない環境でも遊べる */ }
  },
};

// いま えらんでいる バトルの 難易度
function battleDiffKey() { const k = Save.data.settings.bdiff; return BATTLE_DIFFS[k] ? k : 'beg'; }
function setBattleDiff(k) { if (BATTLE_DIFFS[k]) { Save.data.settings.bdiff = k; Save.save(); SFX.select(); } }
// ステージごとに クリアした いちばん 上の 難易度 (0 = まだ / 1 = 初心者 / 2 = 中級者 / 3 = 上級者)
function stageBest(i) { return (Save.data.bbest || {})[i] || 0; }
function diffBadges(i) {
  const b = stageBest(i);
  return BATTLE_DIFF_KEYS.map((k, j) => `<span class="dmark ${b > j ? 'on' : ''}" style="--dc:${BATTLE_DIFFS[k].color}" title="${BATTLE_DIFFS[k].name}">${BATTLE_DIFFS[k].name[0]}</span>`).join('');
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
    stats: Object.fromEntries(Object.entries(raw).map(([key, v]) => [key, Math.round(v * k)])),
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
  const r = root.getBoundingClientRect(); // お題の 枠の 左上 (PERFECT! や ひっさつ欄と かさならない)
  floatText(r.left + 90, r.top + 2, `${kps.toFixed(1)} 打/秒${extra}`, 'kps-pop' + (hot ? ' hot' : ''));
}

function recordMiss(key) {
  if (!key || key === ' ') return;
  Save.data.missKeys[key] = (Save.data.missKeys[key] || 0) + 1;
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
  const names = { easy: 'かんたん', normal: 'ふつう', hard: 'むずかしい', oni: 'おに', hell: 'じごく' };
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
    PlayTime.init(Save.needPtEstimate);
    SFX.enabled = Save.data.settings.sound;
    SFX.setVolume(Save.data.settings.volume);
    // 動作確認用: アドレスに ?mute=1 を付けたときは音を出さない (設定は保存しない)
    if (new URLSearchParams(location.search).has('mute')) SFX.enabled = false;
    document.body.classList.toggle('lite', !!Save.data.settings.lite);
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
  const labels = { hp: 'HP', atk: 'こうげき', def: 'ぼうぎょ', spd: 'すばやさ' };
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
        return `<button class="char-card locked" data-id="${id}" disabled>
          <span class="mc-key">${i + 1}</span>
          <div class="sprite">${slimeSVG(id, 0, {})}</div>
          <div class="cc-name">？？？</div>
          <div class="badges">${d.gacha ? '<span class="badge gacha">ガチャ限定</span>' : '<span class="badge door">🚪 とびら</span>'}<span class="badge">${d.role}</span></div>
          <p class="cc-desc">${d.gacha ? 'ガチャで であえる ふしぎな スライム。こうかんじょで かけらと こうかんも できる。' : lockNote('ch_' + id)}</p>
        </button>`;
      }
      return `<button class="char-card ${Save.data.active === id ? 'current' : ''}" data-id="${id}" style="--cc:${d.colors.main};--cd:${d.colors.dark}">
        <span class="mc-key">${i + 1}</span>
        <div class="sprite bounce d${i}">${slimeSVG(id, c.stage)}</div>
        <div class="cc-name">${c.name} <small>Lv.${c.L}</small></div>
        ${c.awaken ? `<div class="cc-stars">${starText(c.awaken)}</div>` : ''}
        <div class="badges"><span class="badge type-${id}">${d.type}</span><span class="badge">${d.role}</span></div>
        <p class="cc-desc">${d.desc}</p>
        <div class="stats">${statBars(d.base, 100)}</div>
        ${abilityHtml(c)}
        <div class="evo-note">Lv.20・40・60・80 で進化すると とくせい・ひっさつも パワーアップ</div>
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
    // これまでの記録で とれる しょうごうが あれば 知らせる
    announceDoors(checkDoors(), 300);
    checkAchievements(null).forEach((a, i) => setTimeout(() => toast(`🏅 しょうごう「${a.name}」を 手に入れた！ (🪙+${ACH_COINS})`, 2600), 400 + i * 2800));
    document.querySelectorAll('#set-lang button').forEach(b => {
      b.onclick = () => { Save.data.settings.lang = b.dataset.v; Save.save(); SFX.select(); this.render(); };
    });
    // 音量つまみ (動かすと ためしに音が鳴る)
    const vol = $('#set-vol');
    vol.value = Math.round(Save.data.settings.volume * 100);
    $('#set-vol-num').textContent = vol.value + '%';
    vol.oninput = () => {
      Save.data.settings.volume = vol.value / 100;
      SFX.setVolume(Save.data.settings.volume);
    // 動作確認用: アドレスに ?mute=1 を付けたときは音を出さない (設定は保存しない)
    if (new URLSearchParams(location.search).has('mute')) SFX.enabled = false;
      $('#set-vol-num').textContent = vol.value + '%';
      clearTimeout(this._volT);
      this._volT = setTimeout(() => { Save.save(); SFX.select(); }, 120);
    };

    // エフェクトの量 (ひかえめ = パソコンへの負担を減らす)
    $('#set-lite').onclick = () => {
      Save.data.settings.lite = !Save.data.settings.lite;
      document.body.classList.toggle('lite', Save.data.settings.lite);
      FX.resize();
      Save.save(); SFX.select(); this.render();
      toast(Save.data.settings.lite ? 'エフェクトを ひかえめにしました (パソコンが熱くなりにくい)' : 'エフェクトを ふつうに もどしました');
    };
    $('#set-sound').onclick = () => {
      Save.data.settings.sound = !Save.data.settings.sound;
      SFX.enabled = Save.data.settings.sound;
      Save.save(); SFX.select(); this.render();
    };
  },

  render() {
    const c = charInfo(Save.data.active);
    const d = c.def;
    const s = Save.data.settings;
    document.querySelectorAll('#set-lang button').forEach(b => b.classList.toggle('on', b.dataset.v === s.lang));
    $('#set-sound').textContent = s.sound ? '♪ 効果音 ON' : '♪ 効果音 OFF';
    $('#set-lite').textContent = s.lite ? '✨ エフェクト ひかえめ' : '✨ エフェクト ふつう';
    $('#set-lite').classList.toggle('on', !!s.lite);

    const expPct = c.nextLvExp ? (c.exp - c.curLvExp) / (c.nextLvExp - c.curLvExp) * 100 : 100;
    const nextEvo = c.stage < EVO_LEVELS.length ? `Lv.${EVO_LEVELS[c.stage]} で${c.stage === EVO_LEVELS.length - 1 ? '最終' : ''}進化！` : 'さいごの すがた';
    $('#home-char').style.setProperty('--cc', d.colors.main);
    $('#home-char').innerHTML = `
      <div class="hc-top">
        <div class="sprite big bounce">${slimeSVG(c.id, c.stage)}</div>
        <div class="hc-id">
          <div class="hc-name">${c.name}${c.awaken ? ` <span class="hc-stars">${starText(c.awaken)}</span>` : ''}</div>
          ${currentTitle() ? `<div class="hc-title">🏅 ${currentTitle()}</div>` : ''}
          <div class="badges"><span class="badge type-${c.id}">${d.type}</span><span class="badge">${d.role}</span><span class="badge evo">${nextEvo}</span></div>
          <div class="hc-lv">Lv.<b>${c.L}</b></div>
          <div class="expbar"><div class="exp-fill" style="width:${expPct}%"></div></div>
          <div class="exp-text">${c.nextLvExp ? `つぎのレベルまで あと <b>${c.nextLvExp - c.exp}</b> EXP` : 'レベル MAX！'}</div>
        </div>
      </div>
      <div class="stats">${statBars(c.stats, Math.max(60, c.stats.hp))}</div>
      ${abilityHtml(c)}
      ${c.stage < EVO_LEVELS.length ? (() => {
        // 進化したときの すがた (かくせいの ぶんも ふくめる)
        const nt = d.forms[c.stage + 1].trait;
        const next = { ...c, stage: c.stage + 1, trait: c.awaken ? AWAKEN_BONUS[c.id].apply(nt, c.awaken) : nt, skill: d.forms[c.stage + 1].skill };
        return `<div class="next-evo"><b>Lv.${EVO_LEVELS[c.stage]} で「${d.names[c.stage + 1]}」に進化すると…</b>${abilityHtml(next)}</div>`;
      })() : ''}
      <details class="base-rules"><summary>ふつうの キャラの 基本 (くらべる ための 数字)</summary><ul>${BASE_RULES.map(x => `<li>${x}</li>`).join('')}</ul></details>`;

    $('#dex-count').textContent = `${dexCount()}/${ENEMIES.length}`;
    $('#ach-count').textContent = `${achCount()}/${ACHIEVEMENTS.length}`;
    $('#home-coins').textContent = Save.data.coins || 0;
    $('#doors-count').textContent = `${doorCount()}/${DOORS.length}`;
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
    const best = Save.data.best;
    const lang = s.lang;
    const diffName = { easy: 'かんたん', normal: 'ふつう', hard: 'むずかしい' };
    const wk = weakKeys(5);
    $('#home-records').innerHTML = `
      <h3>きろく <small>(${lang === 'en' ? 'English' : '日本語'})</small></h3>
      <div class="rec-grid">
        ${Object.keys(diffName).map(k => `<div><span>${diffName[k]}</span><b>${best[lang + '-' + k] ?? '—'}</b></div>`).join('')}
        <div><span>バトル突破</span><b>${Save.data.cleared}/${MAIN_STAGES}</b></div>
        <div><span>サバイバル</span><b>${svRecord(best)}</b></div>
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
    if (e.key === 'Escape') App.show('title');
  },
};
