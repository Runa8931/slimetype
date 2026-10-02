// ============================================================
//  れんしゅうモード
// ============================================================

const DIFFS = {
  easy: { name: '簡単', mult: 1.0, desc: '短い単語', ex: { ja: 'ねこ / 電車 / 学校', en: 'cat / slime / magic' } },
  normal: { name: '普通', mult: 1.2, desc: '少し長い言葉', ex: { ja: '新幹線 / 必殺技', en: 'keyboard / adventure' } },
  hard: { name: '難しい', mult: 1.5, desc: 'ことわざ・文章', ex: { ja: '急がば回れ', en: 'practice makes perfect' } },
  long: { name: '長文', mult: 1.6, desc: '「、」「。」の入った長い文', ex: { ja: '雨が上がると、空に大きな虹がかかった。', en: 'accuracy first, then speed will follow.' } },
  symbol: { name: '記号・数字', mult: 1.4, desc: '数字や記号の混じったお題', ex: { ja: '3時15分に集合！', en: "it's 3:15 pm." } },
  weak: { name: '苦手キー特訓', mult: 1.2, desc: '苦手なキーをたくさん使うお題', ex: { ja: '', en: '' } },
};

// にがてなキー (記録が少ないうちは まちがえやすい キーで練習する)
function practiceWeakKeys() {
  const wk = weakKeys(6).map(([k]) => k).filter(k => /^[a-z]$/.test(k));
  return wk.length >= 3 ? { keys: wk, fromRecord: true } : { keys: ['q', 'z', 'x', 'p', 'y', 'b'], fromRecord: false };
}

// にがてなキーを 多くふくむ お題を あつめた山札
class WeakDeck {
  constructor(lang, keys) {
    const all = lang === 'en'
      ? [...WORDS_EN.easy, ...WORDS_EN.normal, ...WORDS_EN.hard].map(w => ({ t: w, k: w }))
      : [...WORDS_JA.easy, ...WORDS_JA.normal, ...WORDS_JA.hard];
    // ローマ字にしたとき にがてなキーが どれだけ出てくるかで 点数をつける
    const scored = all.map(w => {
      const roma = new TypingTarget(w.k).guide().rest;
      const hits = [...roma].filter(ch => keys.includes(ch)).length;
      return { w, hits, score: hits / Math.sqrt(roma.length) };
    }).filter(o => o.hits >= 2);
    scored.sort((a, b) => b.score - a.score);
    let pool = scored.slice(0, 150).map(o => o.w);
    if (pool.length < 10) pool = all;
    this.deck = new NoRepeatDeck(pool); // 1 回の れんしゅうで 同じ お題を 出さない
  }
  next() { return this.deck.next(); }
}

Screens.psetup = {
  enter() {
    const s = Save.data.settings;
    const wk = practiceWeakKeys();
    DIFFS.weak.ex = { ja: wk.keys.map(k => k.toUpperCase()).join(' '), en: wk.keys.map(k => k.toUpperCase()).join(' ') };
    DIFFS.weak.desc = wk.fromRecord ? '記録した苦手キーをたくさん使う' : '記録が少ないので間違えやすいキーで';
    $('#diff-grid').innerHTML = Object.entries(DIFFS).map(([k, d], i) => `
      <button class="diff-card ${s.diff === k ? 'on' : ''} ${k === 'weak' && !doorOpen('weak') ? 'locked' : ''}" data-k="${k}">
        <span class="mc-key">${i + 1}</span>
        <div class="dc-name">${d.name}</div>
        <div class="dc-desc">${d.desc}</div>
        <div class="dc-ex">${d.ex[s.lang]}</div>
        <div class="dc-mult">${k === 'weak' && !doorOpen('weak') ? lockNote('weak') : `EXP ×${d.mult.toFixed(1)}`}</div>
      </button>`).join('');
    $('#diff-grid').querySelectorAll('.diff-card').forEach(b => { b.onclick = () => this.setDiff(b.dataset.k); });
    document.querySelectorAll('#time-seg button').forEach(b => {
      b.classList.toggle('on', +b.dataset.v === s.time);
      b.onclick = () => { s.time = +b.dataset.v; Save.save(); SFX.select(); this.enter(); };
    });
    $('#btn-psetup-back').onclick = () => App.show('home');
    $('#btn-psetup-start').onclick = () => App.show('practice');
  },
  setDiff(k) {
    if (k === 'weak' && !doorOpen('weak')) { SFX.miss(); toast(lockNote('weak')); return; }
    Save.data.settings.diff = k; Save.save(); SFX.select(); this.enter();
  },
  onKey(e) {
    const keys = Object.keys(DIFFS);
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= keys.length) this.setDiff(keys[n - 1]);
    // WASD で えらぶ (3 れつ ならび: A/D で となり、W/S で 上下)。ひらいていない ものは とばす
    const mv = { a: -1, d: 1, w: -3, s: 3 }[e.key.toLowerCase()];
    if (mv) {
      let i = keys.indexOf(Save.data.settings.diff) + mv;
      while (i >= 0 && i < keys.length && keys[i] === 'weak' && !doorOpen('weak')) i += Math.sign(mv);
      if (i >= 0 && i < keys.length) this.setDiff(keys[i]);
      return;
    }
    if (e.key === ' ' || e.key === 'Enter') App.show('practice');
    if (e.key === 'Escape') App.show('home');
  },
};

Screens.practice = {
  // arg.daily: まいにち タイピングガチャ (30 秒・お題は ふつう。経験値の かわりに ガチャの 回数が ふえる)
  enter(arg) {
    const s = Save.data.settings;
    this.daily = !!(arg && arg.daily);
    this.char = charInfo(Save.data.active);
    this.diff = this.daily ? 'normal' : s.diff;
    this.duration = this.daily ? DAILY_SECS : s.time;
    this.weak = !this.daily && s.diff === 'weak' ? practiceWeakKeys() : null;
    this.deck = this.weak ? new WeakDeck(s.lang, this.weak.keys) : new WordDeck(s.lang, [s.diff]);
    this.state = 'ready';
    this.correct = 0; this.miss = 0; this.combo = 0; this.comboAcc = 0; this.maxCombo = 0; this.words = 0; this.bestKps = 0;
    this.wordMiss = false;
    this.missMap = {};
    this.timeLeft = this.duration;

    $('#p-sprite').innerHTML = slimeSVG(this.char.id, this.char.stage);
    $('#p-name').textContent = `${this.char.name} Lv.${this.char.L}`;
    buildKeyboard($('#p-kb'));
    // にがてキー特訓: 特訓するキーに しるしをつける
    if (this.weak) this.weak.keys.forEach(k => { const el = $(`#p-kb .key[data-k="${k}"]`); if (el) el.classList.add('weak'); });
    this.nextWord();
    this.updateHud();
    $('#p-timebar').style.width = '100%';
    $('#p-exp').previousElementSibling.textContent = this.daily ? 'ガチャ' : '獲得EXP';
    this.overlay(this.daily
      ? `<div class="ov-box"><div class="ov-title">⌨️ 毎日タイピングガチャ・${this.duration}秒</div>
        <div class="ov-sub">打ち切ったお題1つにつきガチャ${DAILY_PER_WORD}回！（お題は普通）</div><div class="ov-key"><kbd>Space</kbd>でスタート</div></div>`
      : `<div class="ov-box"><div class="ov-title">${DIFFS[this.diff].name}・${this.duration}秒</div>
      <div class="ov-sub">ホームポジションに指を置いて…</div><div class="ov-key"><kbd>Space</kbd>でスタート</div></div>`);
  },

  leave() { this.state = 'off'; cancelAnimationFrame(this.raf); },

  overlay(html) {
    const o = $('#p-overlay');
    o.innerHTML = html || '';
    o.classList.toggle('show', !!html);
  },

  async countdown() {
    this.state = 'count';
    for (const n of ['3', '2', '1']) {
      if (this.state !== 'count') return;
      this.overlay(`<div class="count">${n}</div>`);
      SFX.count();
      await sleep(600);
    }
    if (this.state !== 'count') return;
    this.overlay(`<div class="count go">GO!</div>`);
    SFX.go();
    setTimeout(() => { if (this.state === 'run') this.overlay(''); }, 400);
    this.state = 'run';
    this.startAt = performance.now();
    this.raf = requestAnimationFrame(t => this.tick(t));
  },

  // ポーズから 再開 (止まっていた 時間は 数えない)
  resume() {
    if (this.state !== 'pause') return;
    const d = performance.now() - this.pausedAt;
    this.startAt += d;
    if (this.wordStart) this.wordStart += d;
    this.state = 'run';
    this.overlay(''); // 「GO!」が 出ている うちに 止めた ときも 消す
    this.raf = requestAnimationFrame(t => this.tick(t));
  },

  tick(now) {
    if (this.state !== 'run') return;
    const el = (now - this.startAt) / 1000;
    this.timeLeft = Math.max(0, this.duration - el);
    $('#p-time').textContent = Math.ceil(this.timeLeft);
    $('#p-timebar').style.width = (this.timeLeft / this.duration * 100) + '%';
    $('#p-timebar').classList.toggle('low', this.timeLeft < 10);
    if (this.timeLeft <= 0) { this.finish(); return; }
    this.raf = requestAnimationFrame(t => this.tick(t));
  },

  nextWord() {
    this.word = this.deck.next();
    this.target = new TypingTarget(this.word.k);
    this.wordMiss = false;
    this.wordStart = 0;
    const tp = $('#p-tp');
    replayAnim(tp, 'word-in', 300);
    this.render();
  },

  render() {
    renderTyping($('#p-tp'), this.word, this.target);
    highlightKey($('#p-kb'), this.target.nextKey());
  },

  elapsed() { return this.state === 'run' || this.state === 'done' ? this.duration - this.timeLeft : 0; },

  updateHud() {
    const el = Math.max(1, this.elapsed());
    const kpm = Math.round(this.correct / (el / 60));
    const acc = this.correct + this.miss ? this.correct / (this.correct + this.miss) : 1;
    $('#p-kpm').textContent = this.elapsed() > 0 ? kpm : 0;
    $('#p-acc').textContent = Math.floor(acc * 100) + '%';
    $('#p-combo').textContent = this.combo;
    $('#p-exp').textContent = this.daily ? `${this.words * DAILY_PER_WORD}回` : typingExp(this.correct, this.miss, Math.max(this.elapsed(), 5), DIFFS[this.diff].mult, this.char.L);
  },

  onKey(e) {
    // まいにちガチャは とちゅうで やめても それまでの ぶんは 回せる
    const quit = () => App.show(this.daily ? 'gacha' : 'psetup', this.daily ? { daily: this.words * DAILY_PER_WORD } : undefined);
    if (e.key === 'Escape') {
      if (this.state !== 'run') { quit(); return; }
      // 打っている とちゅう: ポーズして 設定を 開く (閉じると 再開・Enter で やめる)
      this.state = 'pause';
      this.pausedAt = performance.now();
      cancelAnimationFrame(this.raf);
      Settings.open({ title: 'ポーズ中', quit: { label: this.daily ? 'やめてガチャへ' : 'やめる', fn: quit }, onClose: () => this.resume() });
      return;
    }
    if (this.state === 'ready') { if (e.key === ' ') this.countdown(); return; }
    if (this.state !== 'run' || e.key.length !== 1) return;

    const key = e.key.toLowerCase();
    if (!this.wordStart) this.wordStart = performance.now();
    const expected = this.target.nextKey();
    const r = this.target.input(key);
    if (r === 'miss') {
      this.miss++; this.combo = 0; this.comboAcc = 0; this.wordMiss = true;
      this.missMap[expected] = (this.missMap[expected] || 0) + 1;
      recordMiss(expected);
      SFX.miss();
      pressKey($('#p-kb'), key, true);
      replayAnim($('#p-tp'), 'miss-shake', 300);
    } else {
      const prev = this.combo;
      this.correct++; this.combo += comboStep(this, this.char.trait); // ふえりんは 1 回で 2 ふえる ことも ある
      recordHit(key);
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      SFX.key();
      pressKey($('#p-kb'), key, false);
      if (Math.floor(this.combo / 50) > Math.floor(prev / 50)) this.comboFx(Math.floor(this.combo / 50) * 50);
      if (r === 'done') wordFx($('#p-tp'));
      if (r === 'done') { this.wordDone(); return; }
    }
    this.render();
    this.updateHud();
  },

  // お題を打ち切ったら、経験値の玉がスライムに飛んでいく
  wordDone() {
    this.words++;
    SFX.word();
    // 打/秒 (バトルと おなじ 計算)
    const keys = this.target.totalKeys(), kps = keys / Math.max(0.2, (performance.now() - this.wordStart) / 1000);
    if (keys >= 4) this.bestKps = Math.max(this.bestKps, kps);
    const tr = this.char.trait;
    showKps($('#p-tp'), kps, '', this.char.id === 'onpuru' && kps > tr.speedFrom);
    const from = FX.center($('#p-tp .tp-roma'));
    const sprite = $('#p-sprite');
    const to = FX.center(sprite);
    const col = this.char.def.colors;
    const gain = this.target.totalKeys();
    FX.burst(from.x, from.y, { colors: [col.main, '#fff', col.accent], count: this.wordMiss ? 10 : 22, speed: 4 });
    FX.projectile(from, to, {
      color: col.accent, size: 7, frames: 20, arc: -80,
      onHit: () => {
        replayAnim(sprite, 'gulp', 400);
        FX.ring(to.x, to.y, col.main, 60, 18, 4);
        floatText(to.x, to.y - 50, `+${gain}`, 'exp-pop');
      },
    });
    if (!this.wordMiss) floatText(from.x + 200, from.y - 70, 'PERFECT!', 'perfect');
    this.nextWord();
    this.updateHud();
  },

  comboFx(n = this.combo) {
    const p = FX.center($('#p-combo'));
    floatText(p.x, p.y + 30, `${n} COMBO!`, 'combo-pop');
    FX.burst(p.x, p.y, { colors: ['#ffd23f', '#ff5d8f', '#fff'], count: 24, shape: 'star', size: 6 });
  },

  finish() {
    this.state = 'done';
    cancelAnimationFrame(this.raf);
    if (this.daily) {
      // まいにちガチャ: 経験値・きろくの かわりに ガチャへ
      Save.data.totals.keys += this.correct;
      Save.save();
      this.overlay(`<div class="count go">FINISH!</div>`);
      SFX.win();
      const n = this.words * DAILY_PER_WORD;
      setTimeout(() => App.show('gacha', { daily: n }), 1100);
      return;
    }
    const secs = this.duration;
    const correct = this.correct, miss = this.miss;
    const acc = correct + miss ? correct / (correct + miss) : 0;
    const kpm = Math.round(correct / (secs / 60));
    const score = Math.round(kpm * acc ** 3);
    const exp = typingExp(correct, miss, secs, DIFFS[this.diff].mult, this.char.L);

    const lang = Save.data.settings.lang;
    const bestKey = lang + '-' + this.diff;
    const prevBest = Save.data.best[bestKey] || 0;
    const newBest = score > prevBest;
    if (newBest) Save.data.best[bestKey] = score;
    Save.data.totals.keys += correct;
    Save.data.totals.plays++;
    if (this.diff === 'weak') Save.data.totals.weakPlays = (Save.data.totals.weakPlays || 0) + 1;
    // 成長記録: 練習 1 回ごとの 速さと 正確さ (古い ものから 消して 500 回分まで)
    const hist = Save.data.history = Save.data.history || [];
    hist.push({ t: Date.now(), kpm, acc: Math.round(acc * 1000) / 1000, diff: this.diff, lang, secs });
    if (hist.length > 500) hist.splice(0, hist.length - 500);
    const expRes = grantExp(this.char.id, exp);
    const coins = grantCoins(correct / 8 * acc * acc * DIFFS[this.diff].mult);

    this.overlay('<div class="count go">FINISH!</div>');
    SFX.win();
    setTimeout(() => App.show('result', {
      mode: 'practice', diff: this.diff, correct, miss, acc, kpm, score, newBest, kps: correct / secs, bestKps: this.bestKps,
      maxCombo: this.maxCombo, words: this.words, missMap: this.missMap, expRes,
      coins, coinNote: '打鍵÷8×正確率²×難易度',
      expBreakdown: [`1レベル分${levelNeed(this.char.L)}×（打鍵${correct}×正確率²×（1＋${kpm}/300）÷600）×難易度${DIFFS[this.diff].mult}`],
    }), 1100);
  },
};
