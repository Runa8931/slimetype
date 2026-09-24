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
      chars: { purun: { exp: 0 }, piriri: { exp: 0 }, gotsun: { exp: 0 } },
      cleared: 0,
      best: {},
      settings: { lang: 'ja', sound: true, diff: 'easy', time: 60, lite: false },
      missKeys: {},
      totals: { keys: 0, plays: 0, wins: 0 },
    };
  },

  load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(this.KEY)); } catch (e) { /* 読めなければ新規 */ }
    const f = this.fresh();
    this.data = d ? {
      ...f, ...d,
      chars: { ...f.chars, ...(d.chars || {}) },
      settings: { ...f.settings, ...(d.settings || {}) },
      totals: { ...f.totals, ...(d.totals || {}) },
    } : f;
  },

  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) { /* 保存できない環境でも遊べる */ }
  },
};

// キャラの現在の状態をまとめて返す
function charInfo(id) {
  const def = CHARACTERS[id];
  const exp = Save.data.chars[id].exp;
  const L = levelFromExp(exp);
  const stage = evoStage(L);
  return {
    id, def, exp, L, stage,
    name: def.names[stage],
    // 進化段階に合わせた とくせい・ひっさつ
    trait: def.forms[stage].trait,
    skill: def.forms[stage].skill,
    stats: calcStats(def.base, L),
    curLvExp: expForLevel(L),
    nextLvExp: L >= MAX_LV ? null : expForLevel(L + 1),
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

// 練習モードと同じ式で「打鍵から得られる経験値」を計算する
function typingExp(correct, miss, seconds, mult = 1) {
  if (correct <= 0) return 0;
  const acc = correct / (correct + miss);
  const kpm = correct / (seconds / 60);
  return Math.round(correct * acc * acc * (1 + kpm / 300) * mult);
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
  const keys = ['oni', 'hard', 'normal', 'easy'];
  const names = { easy: 'かんたん', normal: 'ふつう', hard: 'むずかしい', oni: 'おに' };
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
    const prev = Screens[this.current];
    if (prev && prev.leave) prev.leave();
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $('#scr-' + name).classList.add('active');
    this.current = name;
    this.shownAt = performance.now();
    if (Screens[name] && Screens[name].enter) Screens[name].enter(arg);
  },

  boot() {
    Save.load();
    SFX.enabled = Save.data.settings.sound;
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
    $('#title-slimes').innerHTML = Object.keys(CHARACTERS)
      .map((id, i) => `<div class="sprite bounce d${i}">${slimeSVG(id, 0)}</div>`).join('');
    $('#btn-start').onclick = () => this.go();
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
    $('#select-grid').innerHTML = ids.map((id, i) => {
      const c = charInfo(id);
      const d = c.def;
      return `<button class="char-card ${Save.data.active === id ? 'current' : ''}" data-id="${id}" style="--cc:${d.colors.main};--cd:${d.colors.dark}">
        <span class="mc-key">${i + 1}</span>
        <div class="sprite bounce d${i}">${slimeSVG(id, c.stage)}</div>
        <div class="cc-name">${c.name} <small>Lv.${c.L}</small></div>
        <div class="badges"><span class="badge type-${id}">${d.type}</span><span class="badge">${d.role}</span></div>
        <p class="cc-desc">${d.desc}</p>
        <div class="stats">${statBars(d.base, 100)}</div>
        <div class="ability"><b>とくせい「${c.trait.name}」</b><span>${c.trait.desc}</span></div>
        <div class="ability"><b>ひっさつ「${c.skill.name}」</b><span>${c.skill.desc}</span></div>
        <div class="evo-note">Lv.10 と Lv.20 で進化すると とくせい・ひっさつも パワーアップ</div>
      </button>`;
    }).join('');
    $('#select-grid').querySelectorAll('.char-card').forEach(b => { b.onclick = () => this.pick(b.dataset.id); });
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
    if (n >= 1 && n <= ids.length) this.pick(ids[n - 1]);
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
    $('#go-survival').onclick = () => { SFX.select(); App.show('survival'); };
    document.querySelectorAll('#set-lang button').forEach(b => {
      b.onclick = () => { Save.data.settings.lang = b.dataset.v; Save.save(); SFX.select(); this.render(); };
    });
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
    const nextEvo = c.L < 10 ? 'Lv.10 で進化！' : c.L < 20 ? 'Lv.20 で最終進化！' : 'さいごの すがた';
    $('#home-char').style.setProperty('--cc', d.colors.main);
    $('#home-char').innerHTML = `
      <div class="hc-top">
        <div class="sprite big bounce">${slimeSVG(c.id, c.stage)}</div>
        <div class="hc-id">
          <div class="hc-name">${c.name}</div>
          <div class="badges"><span class="badge type-${c.id}">${d.type}</span><span class="badge">${d.role}</span><span class="badge evo">${nextEvo}</span></div>
          <div class="hc-lv">Lv.<b>${c.L}</b></div>
          <div class="expbar"><div class="exp-fill" style="width:${expPct}%"></div></div>
          <div class="exp-text">${c.nextLvExp ? `つぎのレベルまで あと <b>${c.nextLvExp - c.exp}</b> EXP` : 'レベル MAX！'}</div>
        </div>
      </div>
      <div class="stats">${statBars(c.stats, Math.max(60, c.stats.hp))}</div>
      <div class="ability"><b>とくせい「${c.trait.name}」</b><span>${c.trait.desc}</span></div>
      <div class="ability"><b>ひっさつ「${c.skill.name}」</b><span>${c.skill.desc}</span></div>
      ${c.stage < 2 ? `<div class="next-evo"><b>Lv.${c.stage === 0 ? 10 : 20} で進化すると…</b>
        <span>とくせい「${d.forms[c.stage + 1].trait.name}」: ${d.forms[c.stage + 1].trait.desc}</span>
        <span>ひっさつ「${d.forms[c.stage + 1].skill.name}」: ${d.forms[c.stage + 1].skill.desc}</span></div>` : ''}`;

    const best = Save.data.best;
    const lang = s.lang;
    const diffName = { easy: 'かんたん', normal: 'ふつう', hard: 'むずかしい' };
    const wk = weakKeys(5);
    $('#home-records').innerHTML = `
      <h3>きろく <small>(${lang === 'en' ? 'English' : '日本語'})</small></h3>
      <div class="rec-grid">
        ${Object.keys(diffName).map(k => `<div><span>${diffName[k]}</span><b>${best[lang + '-' + k] ?? '—'}</b></div>`).join('')}
        <div><span>バトル突破</span><b>${Save.data.cleared}/${ENEMIES.length}</b></div>
        <div><span>サバイバル</span><b>${svRecord(best)}</b></div>
      </div>
      <div class="weak"><span>苦手なキー</span>${wk.length ? wk.map(([k, n]) => `<kbd>${k === ';' ? ';' : k.toUpperCase()}</kbd><small>${n}</small>`).join('') : '<small>まだデータがありません</small>'}</div>`;
  },

  onKey(e) {
    if (e.key === '1') $('#go-practice').click();
    if (e.key === '2') $('#go-battle').click();
    if (e.key === '3') $('#go-survival').click();
    if (e.key === '4') $('#go-select').click();
    if (e.key === 'Escape') App.show('title');
  },
};
