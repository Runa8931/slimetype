// ============================================================
//  バトルモード
//  ・お題を打ち切るとスライムが攻撃 (長いお題ほど強い、コンボで倍率アップ)
//  ・敵は攻撃ゲージがたまるたびに攻撃してくる
//  ・正しく打つと必殺技ゲージがたまり、満タンになると自動で発動
// ============================================================

const CHILL_MULT = 0.7; // こごえている あいだの 攻撃の 強さ

const DIFF_POOLS = { easy: ['easy'], normal: ['easy', 'normal', 'normal'], hard: ['normal', 'hard', 'hard'] };

Screens.battle = {
  // 前のバトルで飛んでいた攻撃が 次のバトルに届かないよう、バトルごとに番号をつける
  bid: 0,
  guard(fn) { const bid = this.bid; return (...a) => { if (bid === this.bid) fn(...a); }; },
  after(fn, ms) { return setTimeout(this.guard(fn), ms); },
  proj(from, to, opts) { return FX.projectile(from, to, { ...opts, onHit: opts.onHit && this.guard(opts.onHit) }); },

  // この敵が その特殊能力を もっているか
  has(a) { return this.ed.abilities.includes(a); },

  enter(idx) {
    this.bid++;
    this.idx = idx;
    this.dk = battleDiffKey();
    this.bd = BATTLE_DIFFS[this.dk];
    // 難易度で 敵の レベルが かわる
    this.ed = ENEMIES[idx];
    this.k = diffK(this.bd, idx); // 難易度と ステージで きまる 敵の 強さ
    const ch = charInfo(Save.data.active);
    this.ch = ch;
    const es = calcStats({ ...this.ed.base, spd: 50 }, this.ed.lv);

    this.p = { hp: ch.stats.hp * BATTLE_HP_SCALE, max: ch.stats.hp * BATTLE_HP_SCALE, skill: 0, shield: 0, barrier: 0, evade: 0, reflect: 0, boost: 1, poisonUntil: 0, nextPoison: 0 };
    const ehp = Math.round(es.hp * ENEMY_HP_SCALE * Math.pow(this.k, 0.7)); // 難易度で HP が かわる
    this.e = { hp: ehp, max: ehp, stats: es, gauge: 0, attacks: 0, angry: false, burnUntil: 0, bindUntil: 0, chillUntil: 0, breakUntil: 0, poison: 0, nextPoison: 0, weakUntil: 0 };
    this.nextRegenP = 3000; this._estatus = null;
    $('#b-estatus').innerHTML = '';
    this.combo = 0; this.maxCombo = 0; this.correct = 0; this.miss = 0; this.words = 0; this.streak = 0; this.bestKps = 0; this.tempo = 0; this.tempoMult = 1; this.snow = 0;
    this.wordMiss = false; this.wordStart = 0; this.fogUntil = 0; this.nextFog = 0;
    // 新しい敵の特殊能力で使う状態
    this.shellUntil = 0; this.nextShell = 4000; this.nextRegen = 8000;
    this.inkUntil = 0; this.nextInk = 5000; this.blizzUntil = 0; this.nextBlizz = 5000;
    this.frozenUntil = 0; this.demonPhase = 0; this.e2 = { double: false, heads: 1 };
    this.windUntil = 0; this.nextWind = 5000; this.thunderAt = 0; this.nextThunder = 5000; this.chargeWarned = false;
    this.missMap = {};
    this.state = 'ready';
    this.elapsed = 0;
    this.pending = 0; // 飛んでいる途中の攻撃

    this.deck = new WordDeck(Save.data.settings.lang, DIFF_POOLS[this.ed.diff], this.ed.bg);
    dexSeen(this.ed.id); // ずかん: であった

    const arena = $('#arena');
    arena.className = 'arena bg-' + this.ed.bg;
    $('#b-player').className = 'fighter player';
    $('#b-enemy').className = 'fighter enemy' + (this.ed.boss ? ' boss' : '') + (this.ed.sprite ? ' variant v-' + this.ed.bg : '');
    $('#b-psprite').innerHTML = slimeSVG(ch.id, ch.stage);
    $('#b-esprite').innerHTML = enemySVG(this.ed.id);
    $('#b-pname').textContent = ch.name;
    $('#b-plv').textContent = ` Lv.${ch.L}`;
    $('#b-ename').textContent = this.ed.name;
    $('#b-elv').textContent = ` Lv.${this.ed.lv}`;
    $('#b-skillname').textContent = ch.skill.name;
    $('#b-skill').style.setProperty('--cc', ch.def.colors.main);
    $('#b-log').innerHTML = '';
    $('#b-tp .tp-roma').classList.remove('hidden-guide');
    $('#b-tp').classList.remove('fog', 'inked', 'blizzard', 'frozen', 'windy');
    $('#b-thunder').className = 'thunder-warn';
    $('#b-ink').innerHTML = '';
    this._fog = false;

    this.nextWord();
    this.updateBars(true);
    this.updateCombo();
    this.overlay(`<div class="ov-box vs">
      <div class="vs-row"><div class="sprite">${slimeSVG(ch.id, ch.stage)}</div><div class="vs-text">VS</div><div class="sprite enemy-mini">${enemySVG(this.ed.id)}</div></div>
      <div class="ov-title">${this.ed.name} があらわれた！</div>
      <div class="ov-sub">${this.ed.abilityDesc}</div>
      <div class="ov-diff" id="b-diff"></div>
      <div class="ov-key"><kbd>Space</kbd> でバトル開始</div></div>`);
    this.renderDiff();
  },

  // バトル前に 難易度を えらぶ (1 / 2 / 3)
  renderDiff() {
    const box = $('#b-diff');
    if (!box) return;
    box.innerHTML = `<span>難易度</span>${BATTLE_DIFF_KEYS.map((k, i) => `<button class="${k === this.dk ? 'on' : ''}" data-k="${k}" style="--dc:${BATTLE_DIFFS[k].color}"><kbd>${i + 1}</kbd> ${BATTLE_DIFFS[k].name}</button>`).join('')}
      <small>推奨 Lv.${this.ed.lv}・敵の 攻撃 ×${this.k.toFixed(2)}・HP ×${Math.pow(this.k, 0.7).toFixed(2)}${this.bd.reward > 1 ? `・コイン ×${this.bd.reward}` : ''} (${this.bd.note})</small>`;
    box.querySelectorAll('button').forEach(b => { b.onclick = () => this.pickDiff(b.dataset.k); });
  },
  pickDiff(k) {
    if (this.state !== 'ready' || k === this.dk) return;
    setBattleDiff(k);
    this.enter(this.idx); // 敵の HP を 作りなおす
  },

  leave() { this.state = 'off'; this.bid++; cancelAnimationFrame(this.raf); },

  overlay(html) {
    const o = $('#b-overlay');
    o.innerHTML = html || '';
    o.classList.toggle('show', !!html);
  },

  log(msg, cls = '') {
    const el = document.createElement('div');
    el.className = 'log-line ' + cls;
    el.textContent = msg;
    const box = $('#b-log');
    box.appendChild(el);
    while (box.children.length > 3) box.firstChild.remove();
    this.after(() => el.classList.add('fade'), 2600);
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
    this.overlay('<div class="count go">FIGHT!</div>');
    SFX.go();
    this.after(() => { if (this.state === 'run') this.overlay(''); }, 450);
    this.state = 'run';
    this.last = performance.now();
    this.nextFog = 6000;
    this.raf = requestAnimationFrame(t => this.tick(t));
  },

  interval() {
    let iv = this.ed.interval / Math.pow(this.k, 0.25); // 難易度で 攻撃の 速さが かわる
    if (this.e.angry) iv *= this.has('dragon') ? 0.72 : 0.7;
    return iv;
  },

  // 毎フレームの処理: 敵の攻撃ゲージ・どく・きり
  tick(now) {
    if (this.state !== 'run') return;
    const dt = Math.min(50, now - this.last);
    this.last = now;
    this.elapsed += dt;

    // かげまる: ひっさつで しばっている間は 敵の攻撃ゲージが止まる / とくせいで 少しおそくなる
    // こおりん: ひっさつで こごえた 敵は 攻撃ゲージが 半分の 速さ
    if (!(this.e.bindUntil > this.elapsed)) this.e.gauge += dt / this.interval() * (1 - (this.ch.trait.slow || 0)) * (this.e.chillUntil > this.elapsed ? 0.5 : 1);
    if (this.e.gauge >= 1) { this.e.gauge = 0; this.enemyAttack(); }
    $('#b-atk').style.transform = `scaleX(${this.e.gauge})`;
    $('#b-atk').classList.toggle('danger', this.e.gauge > 0.8);

    // どく
    if (this.p.poisonUntil > this.elapsed) {
      if (this.elapsed >= this.p.nextPoison) {
        this.p.nextPoison = this.elapsed + 1000;
        const d = Math.max(1, Math.round(this.p.max * 0.025));
        this.damagePlayer(d, 'poison');
      }
    }
    const status = [
      this.p.poisonUntil > this.elapsed ? `<i class="st poison">${this.ed.statusName || 'どく'}</i>` : '',
      this.frozenUntil > this.elapsed ? '<i class="st frozen">こごえ</i>' : '',
      this.p.shield > 0 ? `<i class="st shield">シールド×${this.p.shield}</i>` : '',
      this.p.barrier > 0 ? `<i class="st barrier">バリア×${this.p.barrier}</i>` : '',
      this.p.evade > 0 ? `<i class="st evade">かわす×${this.p.evade}</i>` : '',
      this.p.reflect > 0 ? `<i class="st reflect">はね返し×${this.p.reflect}</i>` : '',
      this.tempo > 0 ? `<i class="st boost">テンポ×${this.tempo}</i>` : '',
      this.snow > 0 ? `<i class="st frozen">ゆきだま×${this.snow}</i>` : '',
      this.p.boost > 1 ? '<i class="st boost">こうげきUP</i>' : '',
      this.raging() ? '<i class="st rage">いかり</i>' : '',
      this.streakBonus() > 0 ? `<i class="st boost">リズム+${Math.round(this.streakBonus() * 100)}%</i>` : '',
    ].join('');
    // 変わったときだけ書きかえる (毎フレーム書きかえると重い)
    if (status !== this._status) { this._status = status; $('#b-pstatus').innerHTML = status; }

    // 敵のやけど (ほむらの ひっさつ)
    if (this.e.burnUntil > this.elapsed && this.elapsed >= (this.e.nextBurn || 0)) {
      this.e.nextBurn = this.elapsed + 1000;
      const d = Math.max(1, Math.round(this.e.max * 0.03));
      this.e.hp -= d;
      const ec = FX.center($('#b-esprite'));
      floatText(ec.x + (Math.random() - 0.5) * 30, ec.y - 30, d, 'dmg burn');
      SFX.impact('burn');
      this.updateBars();
      if (this.e.hp <= 0) { this.win(); return; }
    }
    // どろりん: 敵の どく (1 秒ごと、かさなった 数だけ)
    if (this.e.poison > 0 && this.elapsed >= this.e.nextPoison) {
      this.e.nextPoison = this.elapsed + 1000;
      const d = Math.max(1, Math.round(this.e.max * this.ch.trait.poisonPct * this.e.poison));
      this.e.hp -= d;
      const ec = FX.center($('#b-esprite'));
      floatText(ec.x + (Math.random() - 0.5) * 30, ec.y - 30, d, 'dmg poison');
      SFX.impact('poison');
      this.updateBars();
      if (this.e.hp <= 0) { this.win(); return; }
    }
    // もりりん: こうごうせい (3 秒ごとに回復)
    if (this.ch.trait.regen && this.elapsed >= (this.nextRegenP || 3000)) {
      this.nextRegenP = this.elapsed + 3000;
      if (this.p.hp < this.p.max) {
        const h = Math.max(1, Math.round(this.p.max * this.ch.trait.regen));
        this.p.hp = Math.min(this.p.max, this.p.hp + h);
        const pc = FX.center($('#b-psprite'));
        floatText(pc.x + 30, pc.y - 30, `+${h}`, 'heal');
        this.updateBars();
      }
    }
    const estatus = [
      this.e.burnUntil > this.elapsed ? '<i class="st burn">やけど</i>' : '',
      this.e.bindUntil > this.elapsed ? '<i class="st bind">しばり</i>' : '',
      this.e.chillUntil > this.elapsed ? '<i class="st frozen">こごえ</i>' : '',
      this.e.breakUntil > this.elapsed ? '<i class="st break">ブレイク</i>' : '',
      this.e.poison > 0 ? `<i class="st poison">どく×${this.e.poison}</i>` : '',
      this.e.weakUntil > this.elapsed ? '<i class="st bind">よわり</i>' : '',
    ].join('');
    if (estatus !== this._estatus) { this._estatus = estatus; $('#b-estatus').innerHTML = estatus; }
    $('#b-enemy').classList.toggle('bound', this.e.bindUntil > this.elapsed);

    this.tickAbilities();

    // ゆうれいのきり / かげろう / まおうのやみ
    if (this.has('fade') || (this.has('demon') && this.demonPhase >= 1)) {
      if (this.elapsed >= this.nextFog) {
        this.fogUntil = this.elapsed + 3500;
        this.nextFog = this.elapsed + 9000 + Math.random() * 3000;
        const fogMsg = { salamander: 'かげろうで ガイドが ゆらめいた！', demon: 'やみで ガイドを かくした！' }[this.ed.id] || 'きりをだした！';
        this.log(`${this.ed.name} は ${fogMsg}`, 'enemy');
        replayAnim($('#b-esprite'), 'cast', 600);
        this.render();
      }
    }
    const fog = this.fogUntil > this.elapsed;
    if (fog !== this._fog) { this._fog = fog; this.render(); $('#b-tp').classList.toggle('fog', fog); }

    this.raf = requestAnimationFrame(t => this.tick(t));
  },

  // 新しい敵の特殊能力 (毎フレーム)
  tickAbilities() {
    const now = this.elapsed;
    const ec = () => FX.center($('#b-esprite'));
    // からにこもる / こおりのたて
    if (this.has('shell') && now >= this.nextShell) {
      this.shellUntil = now + 3000;
      this.nextShell = now + 9000 + Math.random() * 2000;
      SFX.guard();
      this.log(`${this.ed.name} は みをまもっている！ (3秒間 ダメージ大はばダウン)`, 'enemy');
      const c = ec(); FX.ring(c.x, c.y, '#74c0fc', 120, 30, 8);
    }
    $('#b-enemy').classList.toggle('shelled', this.shellUntil > now);
    // ゆきだまり: 回復
    if (this.has('regen') && now >= this.nextRegen) {
      this.nextRegen = now + 8000;
      const heal = Math.round(this.e.max * 0.06);
      this.e.hp = Math.min(this.e.max, this.e.hp + heal);
      const c = ec();
      floatText(c.x, c.y - 60, `+${heal}`, 'heal');
      FX.ring(c.x, c.y, '#a5d8ff', 100, 26, 6);
      this.log(`${this.ed.name} は HP を 回復した！`, 'enemy');
      this.updateBars();
    }
    // すみはき
    if (this.has('ink') && now >= this.nextInk) {
      this.inkUntil = now + 4000;
      this.nextInk = now + 10000 + Math.random() * 2000;
      this.splashInk();
    }
    const inked = this.inkUntil > now;
    if (inked !== this._inked) { this._inked = inked; $('#b-tp').classList.toggle('inked', inked); if (!inked) $('#b-ink').innerHTML = ''; }
    // ふぶき
    const sand = this.has('sandstorm');
    if ((this.has('blizzard') || sand) && now >= this.nextBlizz) {
      this.blizzUntil = now + 4000;
      this.nextBlizz = now + (this.ed.boss ? 8000 : 11000) + Math.random() * 2000;
      this.log(`${sand ? 'すなあらし' : 'ふぶき'}で 漢字と かなが 見えない！ ローマ字を たよりに打とう`, 'enemy');
      replayAnim($('#b-esprite'), 'cast', 600);
      SFX.noise(0.8, { vol: 0.1, filter: 2500 });
    }
    const bl = this.blizzUntil > now;
    $('#b-tp').classList.toggle('blizzard', bl);
    $('#arena').classList.toggle('snowing', bl && !sand);
    $('#arena').classList.toggle('sanding', bl && sand);

    // かぜ: 文字がゆれる
    if (this.has('wind') && now >= this.nextWind) {
      this.windUntil = now + 4000;
      this.nextWind = now + 10000 + Math.random() * 2000;
      this.log('つよい風で 文字が ゆれている！', 'enemy');
      SFX.noise(0.6, { vol: 0.06, filter: 900 });
    }
    $('#b-tp').classList.toggle('windy', this.windUntil > now);

    // かみなりのよこく: 3 秒以内に お題を打ち切れば よけられる
    if (this.has('thunder') && !this.thunderAt && now >= this.nextThunder) {
      this.thunderAt = now + 3000;
      this.thunderWords = this.words;
      this.nextThunder = now + (this.ed.boss ? 7000 : 10000) + Math.random() * 2000;
      this.log('⚡ かみなりが くる！ 3 秒以内に お題を 打ち切れ！', 'enemy');
      SFX.charge();
    }
    const tw = $('#b-thunder');
    if (this.thunderAt) {
      const left = Math.max(0, this.thunderAt - now);
      tw.className = 'thunder-warn show';
      tw.innerHTML = `⚡ <b>${(left / 1000).toFixed(1)}</b>`;
      if (this.words > this.thunderWords) {
        this.thunderAt = 0;
        tw.className = 'thunder-warn';
        floatText(FX.center($('#b-psprite')).x, FX.center($('#b-psprite')).y - 60, 'かわした！', 'guard');
        this.log('かみなりを かわした！', 'good');
      } else if (left <= 0) {
        this.thunderAt = 0;
        tw.className = 'thunder-warn';
        const pc = FX.center($('#b-psprite'));
        FX.bolt(pc.x + 20, -20, pc.x, pc.y, '#fff27a', 16);
        replayAnim(document.body, 'flash-white', 300);
        SFX.thunder();
        this.damagePlayer(Math.max(1, Math.round(this.p.max * (this.ed.boss ? 0.15 : 0.12))), 'big');
        this.log('かみなりが おちた！', 'enemy');
      }
    }

    // ためこうげきの予告
    const charging = this.has('charge') && (this.e.attacks + 1) % 3 === 0 && this.e.gauge > 0.55;
    if (charging && !this.chargeWarned) { this.chargeWarned = true; this.log(`${this.ed.name} は 力を ためている！`, 'enemy'); }
    $('#b-enemy').classList.toggle('charging', charging);
    $('#b-tp').classList.toggle('frozen', this.frozenUntil > now);
  },

  // お題の上に すみを とばす
  splashInk() {
    const box = $('#b-ink');
    box.innerHTML = Array.from({ length: 6 }, () => {
      const x = 8 + Math.random() * 84, y = 35 + Math.random() * 55, r = 80 + Math.random() * 70;
      return `<i style="left:${x}%;top:${y}%;width:${r}px;height:${r * (0.7 + Math.random() * 0.4)}px"></i>`;
    }).join('');
    this.log(`${this.ed.name}が すみを はいた！`, 'enemy');
    SFX.noise(0.3, { vol: 0.12, filter: 600 });
    const c = FX.center($('#b-tp'));
    FX.burst(c.x, c.y, { colors: ['#10002b', '#3c096c'], count: 30, speed: 8, size: 7 });
  },

  nextWord() {
    this.word = this.deck.next();
    this.target = new TypingTarget(this.word.k);
    this.wordMiss = false;
    this.wordStart = 0;
    replayAnim($('#b-tp'), 'word-in', 300);
    this.render();
  },

  render() {
    renderTyping($('#b-tp'), this.word, this.target, { hideRoma: this.fogUntil > this.elapsed });
  },

  // りゅうまる: HP が へると こうげきアップ
  raging() { return this.ch.id === 'ryumaru' && this.p.hp / this.p.max < this.ch.trait.rageAt; },
  // きらり: ノーミスが つづいた 回数の ボーナス
  streakBonus() { return this.ch.id === 'kirari' ? Math.min(this.ch.trait.streakMax, this.streak * this.ch.trait.streakStep) : 0; },

  comboMult() { return 1 + Math.min(this.combo, this.ch.trait.comboMax || 100) / 200; },

  updateCombo() {
    $('#b-combo').textContent = this.combo;
    $('#b-mult').textContent = '×' + this.comboMult().toFixed(2);
    const box = $('#b-combo').parentElement;
    box.classList.toggle('hot', this.combo >= 30);
    box.classList.toggle('max', this.combo >= 100);
  },

  updateBars(instant) {
    const pp = clamp(this.p.hp / this.p.max, 0, 1) * 100;
    const ep = clamp(this.e.hp / this.e.max, 0, 1) * 100;
    $('#b-php').style.width = pp + '%';
    $('#b-ehp').style.width = ep + '%';
    $('#b-php').classList.toggle('low', pp < 30);
    $('#b-phpnum').textContent = `${Math.max(0, Math.ceil(this.p.hp))} / ${this.p.max}`;
    // 少し遅れてへる「ダメージ跡」
    const lagP = $('#b-php-lag'), lagE = $('#b-ehp-lag');
    if (instant) { lagP.style.width = pp + '%'; lagE.style.width = ep + '%'; }
    else {
      clearTimeout(this._lagT);
      this._lagT = this.after(() => { lagP.style.width = pp + '%'; lagE.style.width = ep + '%'; }, 450);
    }
    const sk = clamp(this.p.skill, 0, 100);
    $('#b-skillfill').style.width = sk + '%';
    const ready = sk >= 100;
    $('#b-skill').classList.toggle('ready', ready);
    $('#b-skillhint').innerHTML = ready ? '発動！' : `ためています… ${Math.floor(sk)}%`;
  },

  onKey(e) {
    if (this.state === 'ready') {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= BATTLE_DIFF_KEYS.length) { this.pickDiff(BATTLE_DIFF_KEYS[n - 1]); return; }
      if (e.key === ' ') this.countdown();
      if (e.key === 'Escape') App.show('stages');
      return;
    }
    if (this.state === 'pause') {
      if (e.key === ' ') { this.state = 'run'; this.overlay(''); this.last = performance.now(); this.raf = requestAnimationFrame(t => this.tick(t)); }
      if (e.key === 'Escape') App.show('stages');
      return;
    }
    if (this.state !== 'run') return;
    if (e.key === 'Escape') {
      this.state = 'pause';
      cancelAnimationFrame(this.raf);
      this.overlay('<div class="ov-box"><div class="ov-title">ポーズ中</div><div class="ov-key"><kbd>Space</kbd> で再開　<kbd>Esc</kbd> でにげる</div></div>');
      return;
    }
    if (e.key.length !== 1) return;

    const key = e.key.toLowerCase();
    if (!this.wordStart) this.wordStart = this.elapsed;
    const expected = this.target.nextKey();
    const r = this.target.input(key);
    if (r === 'miss') {
      this.miss++;
      this.wordMiss = true;
      this.missMap[expected] = (this.missMap[expected] || 0) + 1;
      recordMiss(expected);
      // ごつん: ミスしてもコンボが一部残る (進化すると多く残る)
      this.combo = this.ch.id === 'gotsun' ? Math.floor(this.combo * this.ch.trait.comboKeep) : 0;
      this.e.gauge = Math.min(0.99, this.e.gauge + 0.04);
      this.p.skill = Math.max(0, this.p.skill - 3);
      SFX.miss();
      replayAnim($('#b-tp'), 'miss-shake', 300);
      // あまいゆうわく: ミスすると 敵が回復
      if (this.has('sweet')) {
        const h = Math.max(1, Math.round(this.e.max * 0.015));
        this.e.hp = Math.min(this.e.max, this.e.hp + h);
        const ec = FX.center($('#b-esprite'));
        floatText(ec.x + 30, ec.y - 50, `+${h}`, 'heal');
      }
      // しびれ: ミスすると自分にダメージ
      if (this.has('shock') && !this.ch.trait.shockImmune) {
        const pc = FX.center($('#b-psprite'));
        FX.bolt(pc.x - 20, pc.y - 90, pc.x, pc.y, '#e0aaff', 10);
        this.damagePlayer(Math.max(1, Math.round(this.p.max * 0.03)), 'shock');
      }
    } else {
      this.correct++;
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      const before = this.p.skill;
      this.p.skill = Math.min(100, this.p.skill + (0.7 + this.ch.def.base.spd / 200) * this.ch.skill.charge);
      if (before < 100 && this.p.skill >= 100) { SFX.charge(); this.useSkill(); }
      SFX.key();
      if (r === 'done') wordFx($('#b-tp'));
      if (r === 'done') { this.wordDone(); }
    }
    this.updateCombo();
    this.updateBars();
    if (r !== 'done') this.render();
  },

  // ---------------- プレイヤーの攻撃 ----------------
  wordDone() {
    this.words++;
    const keys = this.target.totalKeys();
    const secs = Math.max(0.2, (this.elapsed - this.wordStart) / 1000);
    const kps = keys / secs;
    if (keys >= 4) this.bestKps = Math.max(this.bestKps, kps);
    // 打/秒を 出す。おんぷるは テンポの ボーナスが つく 速さなら 金色で「+○%」も
    const tr = this.ch.trait;
    const onBonus = this.ch.id === 'onpuru' && kps > tr.speedFrom ? Math.min(tr.speedMax, (kps - tr.speedFrom) * tr.speedStep) : 0;
    showKps($('#b-tp'), kps, onBonus ? ` +${Math.round(onBonus * 100)}%` : '', onBonus > 0);
    const perfect = !this.wordMiss;
    SFX.word();

    const st = this.ch.stats;
    let dmg = calcDamage(this.ch.L, wordPower(keys), st.atk, this.e.stats.def);
    dmg *= this.comboMult();
    dmg *= this.p.boost;
    // こごえ: 体が つめたくて 攻撃が 弱くなる (入力は できる)
    const chilled = this.frozenUntil > this.elapsed;
    if (chilled) dmg *= CHILL_MULT;
    const boosted = this.p.boost > 1;
    this.p.boost = 1;
    if (this.raging()) dmg *= this.ch.trait.rageMult;
    if (this.ch.id === 'kirari') {
      this.streak = perfect ? this.streak + 1 : 0;
      dmg *= 1 + this.streakBonus();
    }
    // おんぷる: 速く 打つほど 強い / ひっさつの あとは テンポアップ
    if (this.ch.id === 'onpuru' && kps > this.ch.trait.speedFrom) dmg *= 1 + Math.min(this.ch.trait.speedMax, (kps - this.ch.trait.speedFrom) * this.ch.trait.speedStep);
    const tempoHit = this.tempo > 0;
    if (tempoHit) { dmg *= this.tempoMult; this.tempo--; }
    // どろりん: 敵に どくが かさなる / ゆきだるん: ゆきだまが たまる
    if (this.ch.id === 'dororin') { this.e.poison = Math.min(this.ch.trait.poisonMax, this.e.poison + 1); if (!this.e.nextPoison || this.e.nextPoison < this.elapsed) this.e.nextPoison = this.elapsed + 1000; }
    if (this.ch.id === 'yukidarun') this.snow = Math.min(this.ch.trait.snowMax, this.snow + 1);
    // メタルン: ながい お題ほど 強い
    if (this.ch.id === 'metarun' && keys > this.ch.trait.longFrom) dmg *= 1 + Math.min(this.ch.trait.longMax, (keys - this.ch.trait.longFrom) * this.ch.trait.longStep);

    // 会心: ぴりりは速く打つほど出やすい (進化すると上限と倍率が上がる)
    let critRate = this.ch.trait.crit || 0.06, critMult = 1.5; // ゆうしゃりんは 会心率が 高い
    if (this.ch.id === 'piriri') {
      critRate = 0.1 + clamp((kps - 2) * 0.2, 0, this.ch.trait.critMax - 0.1);
      critMult = this.ch.trait.critMult;
    }
    // ぴたりん: ノーミスの お題は かならず 会心
    if (this.ch.id === 'pitarin' && perfect) { critRate = 1; critMult = this.ch.trait.perfectCrit; }
    const crit = Math.random() < critRate;
    if (crit) dmg *= critMult;

    // ゴーレムのよろい
    let armorMsg = '';
    if (this.has('armor')) {
      if (this.combo < 30) { dmg *= this.ch.trait.pierce ? 0.75 : 0.5; armorMsg = 'block'; } else armorMsg = 'break';
    }
    if (this.shellUntil > this.elapsed) { dmg *= this.ch.trait.pierce ? 0.6 : 0.3; armorMsg = 'shell'; }
    dmg = Math.max(1, Math.round(dmg * (0.9 + Math.random() * 0.1)));

    // うるおいボディ
    if (this.ch.id === 'purun' && perfect) {
      const heal = Math.max(1, Math.round(this.p.max * this.ch.trait.heal));
      if (this.p.hp < this.p.max) {
        this.p.hp = Math.min(this.p.max, this.p.hp + heal);
        const pc = FX.center($('#b-psprite'));
        floatText(pc.x + 30, pc.y - 20, `+${heal}`, 'heal');
      }
    }

    // ふつうと ちがう 攻撃の 音: りゅうまるの いかり / きらりの リズム (3 回 いじょう)
    const sound = this.raging() ? 'rage' : this.ch.id === 'kirari' && this.streak >= 3 ? 'sparkle:' + this.streak : tempoHit ? 'beat' : null;
    this.playerAttackFx(dmg, { crit, boosted, armorMsg, perfect, sound });
    // ふわり: ときどき もう 1 回 おいうち
    if (this.ch.id === 'fuwari' && Math.random() < this.ch.trait.double) {
      this.after(() => { if (this.state === 'run') { this.playerAttackFx(Math.max(1, Math.round(dmg * 0.5)), { crit: false, boosted: false, armorMsg: '', perfect: false, sound: 'swish' }); this.log('おいかぜで おいうち！', 'good'); } }, 180);
    }
    this.nextWord();
  },

  playerAttackFx(dmg, { crit, boosted, armorMsg, perfect, sound = null }) {
    const col = this.ch.def.colors;
    const ps = $('#b-psprite');
    replayAnim(ps, 'lunge-r', 350);
    const from = FX.center(ps);
    const to = FX.center($('#b-esprite'));
    if (perfect) {
      const tp = FX.center($('#b-tp .tp-roma'));
      floatText(tp.x + 200, tp.y - 60, 'PERFECT!', 'perfect');
    }
    this.pending++;
    const kinds = {
      purun: { color: col.main, size: 11, arc: -70 },
      piriri: { color: '#fff27a', size: 9, arc: -20, frames: 12 },
      gotsun: { color: col.dark, size: 14, arc: -100, frames: 26 },
      ryumaru: { color: '#ff922b', size: 13, arc: -40, frames: 18 },
      kirari: { color: '#fff3bf', size: 9, arc: -90, frames: 16 },
      koorin: { color: '#d0ebff', size: 10, arc: -50, frames: 18 },
      fuwari: { color: '#96f2d7', size: 8, arc: 40, frames: 12 },
      metarun: { color: '#868e96', size: 14, arc: -20, frames: 22 },
      onpuru: { color: '#ff8cc6', size: 9, arc: 60, frames: 14 },
      dororin: { color: '#8ce99a', size: 11, arc: -80, frames: 22 },
      gorurin: { color: '#ffd43b', size: 10, arc: -60, frames: 18 },
      yukidarun: { color: '#ffffff', size: 12, arc: -90, frames: 22 },
      yuusharin: { color: '#4dabf7', size: 10, arc: -20, frames: 14 },
      pitarin: { color: '#ffe066', size: 8, arc: -10, frames: 12 },
    };
    // きせかえの エフェクト: 攻撃の 弾が その形の 尾を ひいて 飛び、当たると はじける
    const f = fxStyle(this.ch.id);
    const look = f ? { color: f.colors[0], trailShape: f.shape, trailColors: f.colors, trailText: f.text } : {};
    this.proj({ x: from.x + 30, y: from.y }, to, {
      frames: 20, ...kinds[this.ch.id], ...look,
      onHit: () => {
        this.pending--;
        if (this.state !== 'run' && this.state !== 'pause') return;
        if (this.ch.id === 'piriri' || (f && f.bolt)) FX.bolt(to.x - 60, to.y - 40, to.x, to.y, '#fff27a', 10);
        if (f) FX.burst(to.x, to.y, { colors: f.colors, shape: f.shape, text: f.text, count: 14, speed: 6, size: f.size, gravity: f.gravity ?? 0.12 });
        this.hitEnemy(dmg, { crit, colors: f ? f.colors : [col.main, col.light, '#fff'], sound });
        if (this.ch.id === 'gorurin') this.healP(dmg * this.ch.trait.drain);
        if (boosted) this.log('アクアパワーで こうげきが 1.5ばい！', 'good');
        if (armorMsg === 'block') this.log('いしのよろいで ダメージがへった… (コンボ30で貫通)', 'enemy');
        if (armorMsg === 'break' && Math.random() < 0.4) this.log('コンボの力で よろいを つらぬいた！', 'good');
        if (armorMsg === 'shell' && Math.random() < 0.5) this.log('はじかれた！ ガードがとけるまで まとう', 'enemy');
      },
    });
  },

  // HP を 回復する (ゴルりん・ゆうしゃりん など)
  healP(amount) {
    const h = Math.max(1, Math.round(amount));
    if (this.p.hp >= this.p.max) return;
    this.p.hp = Math.min(this.p.max, this.p.hp + h);
    const pc = FX.center($('#b-psprite'));
    floatText(pc.x + 30, pc.y - 20, `+${h}`, 'heal');
    this.updateBars();
  },

  hitEnemy(dmg, { crit = false, colors = ['#fff'], big = false, sound = null } = {}) {
    const broken = this.e.breakUntil > this.elapsed;
    if (broken) dmg = Math.round(dmg * 1.3); // メタルンの ブレイク
    const es = $('#b-esprite');
    const c = FX.center(es);
    this.e.hp -= dmg;
    replayAnim(es, 'hit', 400);
    FX.burst(c.x, c.y, { colors, count: crit || big ? 40 : 18, speed: crit || big ? 8 : 5, size: crit ? 6 : 4 });
    FX.ring(c.x, c.y, crit ? '#ffd23f' : '#fff', crit ? 110 : 70);
    floatText(c.x + (Math.random() - 0.5) * 40, c.y - 40, dmg, crit ? 'dmg crit' : big ? 'dmg big' : 'dmg');
    // ふつうと ちがう 当たり方は 音も かえる (ブレイク中は おもい 音)
    const special = sound || (broken ? 'heavy' : null);
    if (special) SFX.impact(special);
    if (crit) { floatText(c.x, c.y - 90, 'かいしん！', 'crit-label'); SFX.crit(); shake($('#arena')); }
    else if (!special) SFX.hit();
    if (broken && !big) shake($('#arena'));
    if (big) shake($('#arena'), true);
    this.updateBars();
    this.checkPhase();
    if (this.e.hp <= 0) this.win();
  },

  checkPhase() {
    // ヒュドラ: HP がへるほど 首 (攻撃回数) がふえる
    if (this.has('hydra')) {
      const heads = this.e.hp <= this.e.max / 3 ? 3 : this.e.hp <= this.e.max * 2 / 3 ? 2 : 1;
      if (heads > this.e2.heads) {
        this.e2.heads = heads;
        $('#b-enemy').classList.add('angry');
        this.log(`ヒュドラの 首が ${heads} 本になった！ ${heads} 回 攻撃してくる！`, 'enemy');
        cutin(`首が ${heads} 本に！`, this.ed.name, '#7b2cbf', enemySVG(this.ed.id));
      }
    }
    // まおう: 3 段階
    if (this.has('demon')) {
      if (this.demonPhase === 0 && this.e.hp <= this.e.max * 2 / 3) {
        this.demonPhase = 1;
        this.nextFog = this.elapsed + 600;
        $('#arena').classList.add('dark');
        this.log('まおうが やみの ちからを つかった！', 'enemy');
        cutin('やみの ちから', this.ed.name, '#7b2cbf', enemySVG(this.ed.id));
        SFX.thunder();
      }
      if (this.demonPhase === 1 && this.e.hp <= this.e.max / 3) {
        this.demonPhase = 2;
        this.e.angry = true;
        $('#b-enemy').classList.add('angry');
        this.log('まおうが ほんきを だした！ ひっさつゲージが うばわれる！', 'enemy');
        cutin('まおう ほんきモード', this.ed.name, '#ff006e', enemySVG(this.ed.id));
        SFX.thunder();
      }
      return;
    }
    if (this.has('ink') && !this.e2.double && this.e.hp <= this.e.max / 2) {
      this.e2.double = true;
      $('#b-enemy').classList.add('angry');
      this.log(`${this.ed.name}が あばれだした！ 2 れんぞくで 攻撃してくる！`, 'enemy');
      cutin('あばれる', this.ed.name, '#c9184a', enemySVG(this.ed.id));
    }
    if (this.e.angry || this.e.hp > this.e.max / 2) return;
    if (this.has('rage')) {
      this.e.angry = true;
      $('#b-enemy').classList.add('angry');
      this.log(`${this.ed.name} はおこりだした！ 攻撃が速くなった！`, 'enemy');
      cutin('げきど！', this.ed.name, '#e0443e', enemySVG(this.ed.id));
    }
    if (this.has('dragon')) {
      this.e.angry = true;
      $('#b-enemy').classList.add('angry');
      this.log(`${this.ed.name}が ほんきを だした！`, 'enemy');
      cutin('ほんき モード', this.ed.name, '#ff6a00', enemySVG(this.ed.id));
      SFX.thunder();
    }
  },

  // ---------------- ひっさつわざ ----------------
  useSkill() {
    if (this.p.skill < 100) return;
    this.p.skill = 0;
    const ch = this.ch;
    const col = ch.def.colors;
    const sk = ch.skill;
    cutin(sk.name, ch.name, col.main, slimeSVG(ch.id, ch.stage));
    SFX.skill(ch.id); // キャラごとの ひっさつの 音
    const pc = FX.center($('#b-psprite'));

    if (ch.id === 'purun') {
      const heal = Math.round(this.p.max * sk.heal);
      this.after(() => {
        this.p.hp = Math.min(this.p.max, this.p.hp + heal);
        this.p.poisonUntil = 0;
        this.frozenUntil = 0;
        this.p.boost = sk.boost;
        if (sk.barrier) {
          this.p.barrier = sk.barrier;
          $('#b-player').classList.add('bubbled');
        }
        SFX.heal();
        for (let i = 0; i < 3; i++) this.after(() => FX.ring(pc.x, pc.y, col.accent, 90 + i * 20, 30), i * 150);
        for (let i = 0; i < 24; i++) {
          FX.add({ kind: 'dot', shape: 'circle', x: pc.x + (Math.random() - .5) * 100, y: pc.y + 40, vx: 0, vy: -1.5 - Math.random() * 2, g: -0.02, size: 3 + Math.random() * 5, life: 60, max: 60, color: i % 2 ? col.accent : '#fff', rot: 0, vr: 0 });
        }
        floatText(pc.x, pc.y - 60, `+${heal}`, 'heal big');
        replayAnim($('#b-psprite'), 'glow', 900);
        this.log(`${ch.name} の${sk.name}！ HP が ${heal} 回復した！${sk.barrier ? ' 水のバリアをはった！' : ''}`, 'good');
        this.updateBars();
      }, 700);
    }

    if (ch.id === 'piriri') {
      this.after(() => {
        const ec = FX.center($('#b-esprite'));
        replayAnim(document.body, 'flash-white', 400);
        SFX.thunder();
        for (let i = 0; i < 4; i++) {
          this.after(() => FX.bolt(ec.x + (Math.random() - .5) * 80, -20, ec.x + (Math.random() - .5) * 30, ec.y, '#fff27a', 16), i * 90);
        }
        const dmg = Math.round(calcDamage(ch.L, sk.power, ch.stats.atk, this.e.stats.def) * (0.92 + Math.random() * 0.08));
        this.after(() => {
          if (this.state !== 'run') return;
          FX.burst(ec.x, ec.y, { colors: ['#fff27a', '#ffd23f', '#fff'], count: 60, speed: 10, shape: 'star', size: 7 });
          this.hitEnemy(dmg, { big: true, colors: ['#fff27a', '#fff'] });
          this.log(`${sk.name}！ ${dmg} のダメージ！`, 'good');
          if (sk.resetGauge) { this.e.gauge = 0; this.log('いかずちで 敵の攻撃を とめた！', 'good'); }
        }, 250);
      }, 700);
    }

    // ほむら・もりりん・かげまる・りゅうまる・きらり: 攻撃 + それぞれの効果
    if (['homura', 'moririn', 'kagemaru', 'ryumaru', 'kirari', 'koorin', 'fuwari', 'metarun', 'onpuru', 'pitarin', 'dororin', 'gorurin', 'yukidarun', 'yuusharin'].includes(ch.id)) {
      this.after(() => {
        if (this.state !== 'run') return;
        const ec = FX.center($('#b-esprite'));
        let dmg = calcDamage(ch.L, sk.power, ch.stats.atk, this.e.stats.def) * (0.92 + Math.random() * 0.08);
        // りゅうまる: HP が へっているほど 強い / きらり: リズムの ボーナスが のる
        if (ch.id === 'ryumaru') dmg *= 1 + sk.lowBoost * (1 - clamp(this.p.hp / this.p.max, 0, 1));
        if (ch.id === 'kirari') dmg *= 1 + this.streakBonus();
        if (ch.id === 'yukidarun') dmg *= 1 + sk.snowBoost * this.snow; // ゆきだまが 多いほど 強い
        dmg = Math.round(dmg);
        const fxCol = { homura: ['#ff6b35', '#ffe066', '#fff'], moririn: ['#51cf66', '#d3f9d8', '#fff'], kagemaru: ['#7048e8', '#1a1a2e', '#e5dbff'],
          ryumaru: ['#ff922b', '#ffd43b', '#fff'], kirari: ['#f783ac', '#fff3bf', '#99e9f2'],
          koorin: ['#a5d8ff', '#e7f5ff', '#fff'], fuwari: ['#96f2d7', '#e6fcf5', '#fff'], metarun: ['#adb5bd', '#ffd43b', '#fff'],
          onpuru: ['#ff8cc6', '#ffe066', '#fff'], pitarin: ['#91a7ff', '#ffe066', '#fff'],
          dororin: ['#9775fa', '#8ce99a', '#fff'], gorurin: ['#ffd43b', '#fff9db', '#fff'], yukidarun: ['#ffffff', '#a5d8ff', '#ff922b'], yuusharin: ['#4dabf7', '#ffd43b', '#fff'] }[ch.id];
        for (let i = 0; i < 16; i++) {
          this.after(() => this.proj({ x: pc.x + 20, y: pc.y + (Math.random() - 0.5) * 40 }, { x: ec.x + (Math.random() - 0.5) * 60, y: ec.y + (Math.random() - 0.5) * 60 },
            { color: fxCol[i % 3], size: 5 + Math.random() * 7, frames: 16, arc: (Math.random() - 0.5) * 100, trail: false }), i * 20);
        }
        this.after(() => {
          if (this.state !== 'run') return;
          this.hitEnemy(dmg, { big: true, colors: fxCol, sound: 'skill-' + ch.id });
          if (ch.id === 'homura') { this.e.burnUntil = this.elapsed + sk.burn * 1000; this.e.nextBurn = this.elapsed + 1000; this.log(`${sk.name}！ ${dmg} のダメージ！ 敵が やけどした！`, 'good'); }
          if (ch.id === 'moririn') {
            const h = Math.round(this.p.max * sk.heal);
            this.p.hp = Math.min(this.p.max, this.p.hp + h); this.p.poisonUntil = 0;
            floatText(pc.x, pc.y - 60, `+${h}`, 'heal big');
            SFX.heal();
            this.log(`${sk.name}！ ${dmg} ダメージ、HP が ${h} 回復した！`, 'good');
            this.updateBars();
          }
          if (ch.id === 'ryumaru') this.log(`${sk.name}！ ${dmg} のダメージ！`, 'good');
          if (ch.id === 'koorin') { this.e.chillUntil = this.elapsed + sk.chill * 1000; this.log(`${sk.name}！ ${dmg} ダメージ、敵を ${sk.chill} 秒 こごえさせた！`, 'good'); }
          if (ch.id === 'fuwari') { this.p.evade = sk.evade; this.log(`${sk.name}！ ${dmg} ダメージ、つぎの 攻撃を ${sk.evade} 回 かわす！`, 'good'); }
          if (ch.id === 'dororin') { this.e.poison = Math.min(this.ch.trait.poisonMax + sk.addPoison, this.e.poison + sk.addPoison); this.e.nextPoison = this.elapsed + 1000; this.e.weakUntil = this.elapsed + sk.weaken * 1000; this.log(`${sk.name}！ ${dmg} ダメージ、どく×${this.e.poison}、敵の 攻撃が よわく なった！`, 'good'); }
          if (ch.id === 'gorurin') { this.healP(dmg * sk.skillDrain); this.log(`${sk.name}！ ${dmg} ダメージ、元気を すいとった！`, 'good'); }
          if (ch.id === 'yukidarun') this.log(`${sk.name}！ ゆきだま ${this.snow} こ で ${dmg} ダメージ！`, 'good');
          if (ch.id === 'yuusharin') { this.healP(this.p.max * sk.heal); this.e.gauge = 0; this.log(`${sk.name}！ ${dmg} ダメージ、HP 回復・敵の 攻撃を とめた！`, 'good'); }
          if (ch.id === 'onpuru') { this.tempo = sk.tempo; this.tempoMult = sk.tempoMult; this.log(`${sk.name}！ ${dmg} ダメージ、つぎの ${sk.tempo} お題が ${sk.tempoMult} 倍！`, 'good'); }
          if (ch.id === 'pitarin') { this.p.reflect = sk.reflect; this.log(`${sk.name}！ ${dmg} ダメージ、敵の 攻撃を ${sk.reflect} 回 はね返す！`, 'good'); }
          if (ch.id === 'metarun') { this.e.breakUntil = this.elapsed + sk.brk * 1000; this.log(`${sk.name}！ ${dmg} ダメージ、敵を ${sk.brk} 秒 ブレイク！`, 'good'); }
          if (ch.id === 'kirari') {
            if (sk.barrier) { this.p.barrier = Math.max(this.p.barrier, sk.barrier); $('#b-player').classList.add('bubbled'); }
            this.log(`${sk.name}！ ${dmg} のダメージ！${sk.barrier ? ' ひかりのかべを はった！' : ''}`, 'good');
          }
          if (ch.id === 'kagemaru') { this.e.bindUntil = this.elapsed + sk.bind * 1000; this.log(`${sk.name}！ ${dmg} ダメージ、敵を ${sk.bind} 秒 しばった！`, 'good'); }
        }, 420);
      }, 700);
    }

    if (ch.id === 'gotsun') {
      this.after(() => {
        this.p.shield = sk.guards;
        SFX.guard();
        $('#b-player').classList.add('shielded');
        FX.burst(pc.x, pc.y, { colors: [col.dark, col.main, col.accent], count: 30, speed: 6, shape: 'rect', size: 8 });
        FX.ring(pc.x, pc.y, col.accent, 100, 30, 8);
        this.log(`${ch.name} の${sk.name}！ ${sk.guards} 回 ふせぐ！`, 'good');
      }, 700);
    }
    this.updateBars();
  },

  // ---------------- 敵の攻撃 ----------------
  enemyAttack() {
    this.e.attacks++;
    const ed = this.ed;
    const breath = this.has('dragon') && this.e.angry && this.e.attacks % 3 === 0;
    const charged = this.has('charge') && this.e.attacks % 3 === 0;
    this.chargeWarned = false;
    let dmg = calcDamage(ed.lv, ed.power, this.e.stats.atk, this.ch.stats.def) * this.k * (0.85 + Math.random() * 0.15);
    if (breath) dmg *= 1.5;
    if (charged) dmg *= 1.8;
    if (this.ch.id === 'gotsun' || this.ch.id === 'yuusharin') dmg *= 1 - this.ch.trait.cut;
    if (this.ch.id === 'yukidarun') dmg *= 1 - this.ch.trait.snowCut * this.snow; // ゆきだまで ダメージが へる
    if (this.e.weakUntil > this.elapsed) dmg *= 0.8; // どろりんの ひっさつで よわっている
    dmg = Math.max(1, Math.round(dmg));

    const esEl = $('#b-esprite');
    replayAnim(esEl, 'lunge-l', 400);
    const from = FX.center(esEl);
    const to = FX.center($('#b-psprite'));

    const styles = {
      bat: { color: '#b48cff', size: 8, arc: 30, frames: 16 },
      mush: { color: '#a4e06a', size: 10, arc: -80, frames: 24 },
      ghost: { color: '#c9b8ff', size: 12, arc: 40, frames: 26 },
      goblin: { color: '#8a5a2b', size: 12, arc: -90, frames: 20 },
      golem: { color: '#8b8f99', size: 16, arc: -110, frames: 26 },
      dragon: { color: '#ff7a1a', size: 14, arc: 0, frames: 18 },
      crab: { color: '#e8452c', size: 12, arc: -60, frames: 20 },
      jelly: { color: '#e0aaff', size: 11, arc: 30, frames: 22 },
      shark: { color: '#5c85c4', size: 12, arc: -20, frames: 14 },
      kraken: { color: '#3c096c', size: 14, arc: -70, frames: 22 },
      penguin: { color: '#74c0fc', size: 10, arc: -10, frames: 14 },
      snowman: { color: '#ffffff', size: 13, arc: -90, frames: 24 },
      wolf: { color: '#a5d8ff', size: 11, arc: 0, frames: 14 },
      yeti: { color: '#d0ebff', size: 16, arc: -100, frames: 24 },
      imp: { color: '#ff7a1a', size: 11, arc: -40, frames: 18 },
      mgolem: { color: '#ff5400', size: 17, arc: -110, frames: 26 },
      salamander: { color: '#ffba08', size: 12, arc: -20, frames: 16 },
      demon: { color: '#9d4edd', size: 15, arc: -40, frames: 20 },
    };
    // 攻撃の弾の見た目 (決めていない敵は ワールドの色)
    const worldColor = { poison: '#b197fc', desert: '#e2b766', sea: '#4dabf7', candy: '#ff8fab', rain: '#74c0fc',
      factory: '#ff922b', snow: '#d0ebff', sky: '#ffffff', space: '#9775fa', magma: '#ff7a1a', shade: '#9d4edd', void: '#66d9e8' }[ed.bg] || '#ff6b6b';
    const s = styles[ed.sprite || ed.id] || { color: worldColor, size: ed.boss ? 15 : 12, arc: -40, frames: 20 };

    // ボスは たくさんの弾を いっせいに とばす (はで)
    if (ed.boss && ed.id !== 'dragon') {
      const n = 12;
      for (let i = 0; i < n; i++) {
        this.after(() => this.proj({ x: from.x - 40, y: from.y - 20 + (Math.random() - .5) * 60 },
          { x: to.x + (Math.random() - .5) * 70, y: to.y + (Math.random() - .5) * 70 },
          { color: i % 3 ? s.color : '#fff', size: 6 + Math.random() * 8, frames: 18, arc: (Math.random() - .5) * 120, trail: i % 2 === 0 }), i * 25);
      }
      this.after(() => this.resolveEnemyHit(dmg, true), 18 * 17 + 25 * n);
      if (this.e2.double) {
        this.after(() => {
          if (this.state !== 'run') return;
          this.proj({ x: from.x - 30, y: from.y }, to, { ...s, frames: 14, onHit: () => this.resolveEnemyHit(Math.round(dmg * 0.6), false) });
        }, 700);
      }
      return;
    }

    if (breath) {
      this.log('ドラゴンの ほのおのブレス！', 'enemy');
      for (let i = 0; i < 26; i++) {
        this.after(() => this.proj({ x: from.x - 60, y: from.y - 30 }, { x: to.x + (Math.random() - .5) * 60, y: to.y + (Math.random() - .5) * 60 },
          { color: i % 3 ? '#ff7a1a' : '#ffd23f', size: 6 + Math.random() * 8, frames: 16, arc: (Math.random() - .5) * 40, trail: false }), i * 18);
      }
      this.after(() => this.resolveEnemyHit(dmg, true), 16 * 18 + 260);
      return;
    }
    if (charged) {
      this.log(`${this.ed.name} の ためこうげき！`, 'enemy');
      this.proj({ x: from.x - 30, y: from.y }, to, { ...s, size: s.size * 1.8, onHit: () => this.resolveEnemyHit(dmg, true) });
      return;
    }
    this.proj({ x: from.x - 30, y: from.y }, to, { ...s, onHit: () => this.resolveEnemyHit(dmg, false) });
    // ヒュドラ: 首の数だけ 追加で攻撃 (1 発あたり 5 わり)
    for (let h = 1; h < (this.e2.heads || 1); h++) {
      this.after(() => {
        if (this.state !== 'run') return;
        this.proj({ x: from.x - 30, y: from.y - 30 + h * 20 }, to, { ...s, frames: 14, onHit: () => this.resolveEnemyHit(Math.round(dmg * 0.5), false) });
      }, 260 * h);
    }
  },

  resolveEnemyHit(dmg, big) {
    if (this.state !== 'run' && this.state !== 'pause') return;
    const pc = FX.center($('#b-psprite'));
    // ぷるん: 水のバリア
    if (this.p.barrier > 0) {
      this.p.barrier--;
      if (this.p.barrier === 0) $('#b-player').classList.remove('bubbled');
      SFX.guard();
      FX.ring(pc.x, pc.y, '#7cf0ff', 100, 22, 8);
      FX.burst(pc.x, pc.y, { colors: ['#7cf0ff', '#fff'], count: 20, speed: 5 });
      floatText(pc.x, pc.y - 50, 'バリア！', 'guard');
      return;
    }
    // ぴたりん: 敵の 攻撃を はね返す
    if (this.p.reflect > 0) {
      this.p.reflect--;
      floatText(pc.x, pc.y - 50, 'はね返した！', 'guard');
      const ec = FX.center($('#b-esprite'));
      this.proj(pc, ec, { color: '#ffe066', size: 12, frames: 14, arc: -30, onHit: () => { if (this.state === 'run') { this.hitEnemy(dmg, { colors: ['#ffe066', '#91a7ff', '#fff'], sound: 'reflect' }); this.log(`はね返して ${dmg} ダメージ！`, 'good'); } } });
      return;
    }
    // ふわり: ひっさつで 攻撃を かわす
    if (this.p.evade > 0) {
      this.p.evade--;
      replayAnim($('#b-psprite'), 'dodge', 400);
      floatText(pc.x, pc.y - 50, 'かわした！', 'guard');
      SFX.tone(1600, 0.08, { type: 'triangle', vol: 0.04, slide: 2400 });
      return;
    }
    // ぴりり: すばやく よける
    if (this.ch.id === 'piriri' && Math.random() < this.ch.trait.dodge) {
      replayAnim($('#b-psprite'), 'dodge', 400);
      floatText(pc.x, pc.y - 50, 'よけた！', 'guard');
      SFX.tone(1600, 0.08, { type: 'triangle', vol: 0.04, slide: 2400 });
      return;
    }
    if (this.p.shield > 0) {
      this.p.shield--;
      if (this.p.shield === 0) $('#b-player').classList.remove('shielded');
      SFX.guard();
      FX.ring(pc.x, pc.y, '#9be7a0', 90, 20, 8);
      floatText(pc.x, pc.y - 50, 'ガード！', 'guard');
      // 反撃: ふせいだダメージ + 岩の威力 (進化すると強くなる)
      const sk = this.ch.skill;
      const back = Math.round(dmg + calcDamage(this.ch.L, sk.power, this.ch.stats.atk, this.e.stats.def));
      if (sk.heal) {
        const h = Math.round(this.p.max * sk.heal);
        this.p.hp = Math.min(this.p.max, this.p.hp + h);
        floatText(pc.x + 40, pc.y - 20, `+${h}`, 'heal');
        this.updateBars();
      }
      const ec = FX.center($('#b-esprite'));
      this.proj(pc, ec, {
        color: this.ch.def.colors.dark, size: 14, frames: 18, arc: -60,
        onHit: () => { if (this.state === 'run') { this.hitEnemy(back, { colors: ['#b08a64', '#9be7a0', '#fff'], sound: 'rock' }); this.log(`はんげき！ ${back} ダメージ！`, 'good'); } },
      });
      return;
    }
    this.damagePlayer(dmg, big ? 'big' : 'normal');
    if (this.ch.id === 'yukidarun' && this.snow > 0) this.snow--; // うけると ゆきだまが 1 こ へる
    // こおりん: ときどき 敵を こおらせて 攻撃ゲージを もどす
    if (this.ch.id === 'koorin' && this.state === 'run' && Math.random() < this.ch.trait.counter) {
      this.e.gauge = Math.max(0, this.e.gauge - this.ch.trait.pushback);
      const ec = FX.center($('#b-esprite'));
      FX.burst(ec.x, ec.y, { colors: ['#d0ebff', '#fff', '#74c0fc'], count: 18, speed: 5, shape: 'snow', size: 6 });
      this.log('ひんやり やりかえした！ 敵の 攻撃が おくれる', 'good');
      SFX.impact('ice');
    }
    // 状態異常への強さ (進化で手に入る)
    const statusCut = this.ch.id === 'gotsun' ? (this.ch.trait.freezeImmune ? 1 : 0.4) : (this.ch.trait.statusCut || 0);
    const burnSafe = this.ch.trait.burnImmune && this.ed.statusName === 'やけど';
    if (this.has('poison') && this.p.poisonUntil <= this.elapsed && statusCut < 1 && !burnSafe) {
      this.p.poisonUntil = this.elapsed + 5000 * (1 - statusCut);
      this.p.nextPoison = this.elapsed + 1000;
      this.log(`${this.ed.statusName || 'どく'}を うけてしまった！`, 'enemy');
    }
    // ぬかるみ
    if (this.has('mud')) {
      this.fogUntil = this.elapsed + 2500;
      this.p.skill = Math.max(0, this.p.skill - 10);
      this.log('どろを かけられた！ ガイドが 見えにくい', 'enemy');
      this.updateBars();
    }
    // こおりのいき / ふぶき: しばらく こごえて 攻撃が 弱くなる
    if ((this.has('freeze') || this.has('blizzard')) && !this.ch.trait.freezeImmune && statusCut < 1) {
      this.frozenUntil = this.elapsed + (this.has('freeze') ? 4000 : 3000);
      this.log(`こごえてしまった！ ${this.has('freeze') ? 4 : 3} 秒間 攻撃が 弱くなる`, 'enemy');
      FX.burst(pc.x, pc.y, { colors: ['#d0ebff', '#fff', '#74c0fc'], count: 24, speed: 6, shape: 'star', size: 6 });
      SFX.tone(1800, 0.3, { type: 'sine', vol: 0.05, slide: 600 });
    }
    // まおう (ほんき): ひっさつゲージを うばう
    if (this.has('demon') && this.demonPhase >= 2 && this.p.skill > 0) {
      this.p.skill = Math.max(0, this.p.skill - 10);
      this.log('ひっさつゲージを うばわれた！', 'enemy');
      this.updateBars();
    }
  },

  damagePlayer(dmg, kind) {
    const pc = FX.center($('#b-psprite'));
    this.p.hp -= dmg;
    if (kind === 'poison' || kind === 'shock') {
      floatText(pc.x + 20, pc.y - 30, dmg, kind === 'shock' ? 'dmg shock' : 'dmg poison');
      replayAnim($('#b-psprite'), 'poisoned', 400);
    } else {
      SFX.hurt();
      replayAnim($('#b-psprite'), 'hurt', 450);
      replayAnim($('#scr-battle'), 'vignette', 500);
      shake($('#arena'), kind === 'big');
      FX.burst(pc.x, pc.y, { colors: ['#ff5d5d', '#fff'], count: kind === 'big' ? 36 : 16, speed: 5 });
      floatText(pc.x, pc.y - 40, dmg, 'dmg taken');
    }
    this.updateBars();
    if (this.p.hp <= 0) this.lose();
  },

  // ---------------- 決着 ----------------
  win() {
    if (this.state === 'end') return;
    this.state = 'end';
    cancelAnimationFrame(this.raf);
    const ec = FX.center($('#b-esprite'));
    $('#b-enemy').classList.add('defeated');
    FX.burst(ec.x, ec.y, { colors: ['#fff', '#ffd23f', '#ff5d8f', '#4fb3ff'], count: 80, speed: 10, shape: 'star', size: 7 });
    FX.ring(ec.x, ec.y, '#fff', 160, 40, 8);
    SFX.win();
    this.after(() => FX.confetti(), 400);
    this.overlay('<div class="count go win">WIN!</div>');
    this.after(() => this.finish(true), 1900);
  },

  lose() {
    if (this.state === 'end') return;
    this.state = 'end';
    cancelAnimationFrame(this.raf);
    $('#b-player').classList.add('defeated');
    SFX.lose();
    this.overlay('<div class="count lose">LOSE…</div>');
    this.after(() => this.finish(false), 1900);
  },

  finish(won) {
    const secs = Math.max(1, this.elapsed / 1000);
    // 格下をたおしたときは 経験値がへる (レベル差の補正)
    const gap = levelGapMult(this.ed.lv, this.ch.L);
    const rw = this.bd.reward; // 難易度が 高いほど コインが ふえる (経験値は どの 難易度でも おなじ)
    const typing = Math.round(typingExp(this.correct, this.miss, secs, 0.3, this.ch.L) * gap);
    const bonus = won ? Math.floor(stageExp(this.idx) * gap) : 0;
    if (won) {
      Save.data.bbest = Save.data.bbest || {};
      Save.data.bbest[this.idx] = Math.max(stageBest(this.idx), BATTLE_DIFF_KEYS.indexOf(this.dk) + 1);
    }
    const firstClear = won && !this.ed.hidden && this.idx === Save.data.cleared;
    if (firstClear) Save.data.cleared = Math.min(MAIN_STAGES, this.idx + 1);
    // ノーミスで 勝った ステージ (かくしステージの 道の 条件) / かくしステージを たおした
    if (won && this.miss === 0) (Save.data.nomiss = Save.data.nomiss || {})[this.idx] = 1;
    if (won && this.ed.hidden) (Save.data.hiddenClear = Save.data.hiddenClear || {})[this.ed.id] = Date.now();
    if (won) { Save.data.totals.wins++; dexWin(this.ed.id, secs); } // ずかん: たおした
    Save.data.totals.keys += this.correct;
    const expRes = grantExp(this.ch.id, typing + bonus);
    // コイン: 勝つと もらえる (格下では へる)。はじめて たおすと ボーナス
    const coinGap = Math.min(1.2, gap);
    const winCoins = Math.round((won ? (30 + this.idx * 2) * coinGap : this.correct / 15 * Math.min(1, gap)) * rw * (1 + (this.ch.trait.coinBonus || 0))); // ゴルりんは コインが ふえる
    const firstCoins = firstClear ? (this.ed.boss ? 200 : 50) : 0;
    const coins = grantCoins(winCoins + firstCoins);
    const acc = this.correct + this.miss ? this.correct / (this.correct + this.miss) : 0;
    App.show('result', {
      mode: 'battle', won, enemyIdx: this.idx, firstClear,
      hpLeft: Math.max(0, this.p.hp / this.p.max), playerLv: this.ch.L, enemyLv: this.ed.lv,
      correct: this.correct, miss: this.miss, acc,
      kpm: Math.round(this.correct / (secs / 60)), secs: Math.round(secs), kps: this.correct / secs, bestKps: this.bestKps,
      maxCombo: this.maxCombo, words: this.words, missMap: this.missMap, expRes,
      bdiff: this.dk, coins, coinNote: `${won ? `勝利 ${winCoins}` : `打鍵 ${winCoins}`}${rw > 1 ? ` (${this.bd.name} ×${rw})` : ''}${firstCoins ? ` + はじめて たおした ${firstCoins}` : ''}${gap < 1 ? '・格下なので へった' : ''}`,
      expBreakdown: [`タイピング ${typing}`, won ? `勝利ボーナス ${bonus} (Lv.${this.ed.lv} から つぎの ステージの レベルまでの 6 わり)` : '勝利ボーナスなし',
        `レベル差の補正 ×${gap.toFixed(2)} (敵 Lv.${this.ed.lv} / 自分 Lv.${this.ch.L}${gap < 1 ? '・格下なので へった' : gap > 1 ? '・格上なので ふえた' : ''})`],
    });
  },
};
