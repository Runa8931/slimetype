// ============================================================
//  れんしゅうモード
// ============================================================

const DIFFS = {
  easy: { name: 'かんたん', mult: 1.0, desc: '短い単語', ex: { ja: 'ねこ / 電車 / 学校', en: 'cat / slime / magic' } },
  normal: { name: 'ふつう', mult: 1.2, desc: '少し長いことば', ex: { ja: '新幹線 / 必殺技', en: 'keyboard / adventure' } },
  hard: { name: 'むずかしい', mult: 1.5, desc: 'ことわざ・文章', ex: { ja: '急がば回れ', en: 'practice makes perfect' } },
};

Screens.psetup = {
  enter() {
    const s = Save.data.settings;
    $('#diff-grid').innerHTML = Object.entries(DIFFS).map(([k, d], i) => `
      <button class="diff-card ${s.diff === k ? 'on' : ''}" data-k="${k}">
        <span class="mc-key">${i + 1}</span>
        <div class="dc-name">${d.name}</div>
        <div class="dc-desc">${d.desc}</div>
        <div class="dc-ex">${d.ex[s.lang]}</div>
        <div class="dc-mult">EXP ×${d.mult.toFixed(1)}</div>
      </button>`).join('');
    $('#diff-grid').querySelectorAll('.diff-card').forEach(b => { b.onclick = () => this.setDiff(b.dataset.k); });
    document.querySelectorAll('#time-seg button').forEach(b => {
      b.classList.toggle('on', +b.dataset.v === s.time);
      b.onclick = () => { s.time = +b.dataset.v; Save.save(); SFX.select(); this.enter(); };
    });
    $('#btn-psetup-back').onclick = () => App.show('home');
    $('#btn-psetup-start').onclick = () => App.show('practice');
  },
  setDiff(k) { Save.data.settings.diff = k; Save.save(); SFX.select(); this.enter(); },
  onKey(e) {
    const keys = Object.keys(DIFFS);
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 3) this.setDiff(keys[n - 1]);
    if (e.key === ' ' || e.key === 'Enter') App.show('practice');
    if (e.key === 'Escape') App.show('home');
  },
};

Screens.practice = {
  enter() {
    const s = Save.data.settings;
    this.char = charInfo(Save.data.active);
    this.diff = s.diff;
    this.duration = s.time;
    this.deck = new WordDeck(s.lang, [s.diff]);
    this.state = 'ready';
    this.correct = 0; this.miss = 0; this.combo = 0; this.maxCombo = 0; this.words = 0;
    this.wordMiss = false;
    this.missMap = {};
    this.timeLeft = this.duration;

    $('#p-sprite').innerHTML = slimeSVG(this.char.id, this.char.stage);
    $('#p-name').textContent = `${this.char.name} Lv.${this.char.L}`;
    buildKeyboard($('#p-kb'));
    this.nextWord();
    this.updateHud();
    $('#p-timebar').style.width = '100%';
    this.overlay(`<div class="ov-box"><div class="ov-title">${DIFFS[this.diff].name} ・ ${this.duration}秒</div>
      <div class="ov-sub">ホームポジションに指をおいて…</div><div class="ov-key"><kbd>Space</kbd> でスタート</div></div>`);
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
    $('#p-exp').textContent = typingExp(this.correct, this.miss, Math.max(this.elapsed(), 5), DIFFS[this.diff].mult, this.char.L);
  },

  onKey(e) {
    if (e.key === 'Escape') { App.show('psetup'); return; }
    if (this.state === 'ready') { if (e.key === ' ') this.countdown(); return; }
    if (this.state !== 'run' || e.key.length !== 1) return;

    const key = e.key.toLowerCase();
    const expected = this.target.nextKey();
    const r = this.target.input(key);
    if (r === 'miss') {
      this.miss++; this.combo = 0; this.wordMiss = true;
      this.missMap[expected] = (this.missMap[expected] || 0) + 1;
      recordMiss(expected);
      SFX.miss();
      pressKey($('#p-kb'), key, true);
      replayAnim($('#p-tp'), 'miss-shake', 300);
    } else {
      this.correct++; this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      SFX.key();
      pressKey($('#p-kb'), key, false);
      if (this.combo > 0 && this.combo % 50 === 0) this.comboFx();
      if (r === 'done') { this.wordDone(); return; }
    }
    this.render();
    this.updateHud();
  },

  // お題を打ち切ったら、経験値の玉がスライムに飛んでいく
  wordDone() {
    this.words++;
    SFX.word();
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

  comboFx() {
    const p = FX.center($('#p-combo'));
    floatText(p.x, p.y + 30, `${this.combo} COMBO!`, 'combo-pop');
    FX.burst(p.x, p.y, { colors: ['#ffd23f', '#ff5d8f', '#fff'], count: 24, shape: 'star', size: 6 });
  },

  finish() {
    this.state = 'done';
    cancelAnimationFrame(this.raf);
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
    const expRes = grantExp(this.char.id, exp);

    this.overlay('<div class="count go">FINISH!</div>');
    SFX.win();
    setTimeout(() => App.show('result', {
      mode: 'practice', diff: this.diff, correct, miss, acc, kpm, score, newBest,
      maxCombo: this.maxCombo, words: this.words, missMap: this.missMap, expRes,
      expBreakdown: [`打鍵 ${correct} × 正確率² × (1 + ${kpm}/300) × 難易度 ${DIFFS[this.diff].mult} × レベル補正 ${(1 + this.char.L / 15).toFixed(1)}`],
    }), 1100);
  },
};
