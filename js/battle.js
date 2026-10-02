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

  // arg: ステージ番号、または { idx, rush (ボスラッシュの 途中経過), rule (今週の チャレンジの ルール) }
  enter(arg) {
    const opt = arg && typeof arg === 'object' ? arg : { idx: arg };
    const idx = opt.idx;
    this.arg = opt; this.rush = opt.rush || null; this.rule = opt.rule || null;
    this.bid++;
    this.idx = idx;
    this.dk = battleDiffKey();
    this.bd = BATTLE_DIFFS[this.dk];
    // 難易度で 敵の レベルが かわる
    this.ed = ENEMIES[idx];
    this.k = diffK(this.bd, idx); // 難易度と ステージで きまる 敵の 強さ
    const ch = charInfo(Save.data.active);
    this.ch = ch;
    // ダイヤマイマイ: いどんだ キャラの レベルに あわせて つよく なる
    if (this.ed.matchLv) this.ed = { ...this.ed, lv: Math.max(this.ed.lv, ch.L + this.ed.matchLv) };
    const es = calcStats({ ...this.ed.base, spd: 50 }, this.ed.lv);

    this.p = { hp: ch.stats.hp * BATTLE_HP_SCALE, max: ch.stats.hp * BATTLE_HP_SCALE, skill: 0, shield: 0, barrier: 0, evade: 0, reflect: 0, boost: 1, poisonUntil: 0, nextPoison: 0 };
    // ボスラッシュ: 前の 戦いの HP を 持ちこす (間に 少し 回復) / 今週の チャレンジ「HP半分」
    if (this.rush && this.rush.hpFrac != null) this.p.hp = Math.round(this.p.max * Math.min(1, this.rush.hpFrac + RUSH_HEAL));
    if (this.rule === 'glass') this.p.hp = Math.round(this.p.max / 2);
    const ehp = Math.round(es.hp * ENEMY_HP_SCALE * Math.pow(this.k, 0.7) * (this.ed.hpMult || 1)); // 難易度で HP が かわる (こうてつマイマイは とても 多い)
    this.e = { hp: ehp, max: ehp, stats: es, gauge: 0, attacks: 0, angry: false, burnUntil: 0, bindUntil: 0, chillUntil: 0, breakUntil: 0, poison: 0, nextPoison: 0, weakUntil: 0 };
    this.nextRegenP = 3000; this._estatus = null;
    $('#b-estatus').innerHTML = '';
    this.combo = 0; this.comboAcc = 0; this.maxCombo = 0; this.trioStreak = 0; this.forgiven = 0; this.forgiveUntil = 0; this.correct = 0; this.miss = 0; this.words = 0; this.streak = 0; this.bestKps = 0; this.tempo = 0; this.tempoMult = 1; this.snow = 0; this.seg = 0; this.luck = 0;
    // 進化で ふえた 必殺の 効果 (skillExtras) の 時間・回数
    this.wardUntil = 0; this.critUntil = 0; this.critAdd = 0; this.rageUntil = 0; this.regenUntil = 0; this.streakGuard = 0;
    this.doubleUntil = 0; this.poisonBoostUntil = 0; this.drainUntil = 0; this.comboGuardUntil = 0; this.trioNext = false; this.segGuardUntil = 0;
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

    this.deck = new WordDeck(Save.data.settings.lang, this.rule === 'long' || this.rule === 'symbol' ? [this.rule] : DIFF_POOLS[this.ed.diff], this.ed.bg);
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
    $('#b-tp').classList.toggle('noguide', this.rule === 'noguide');
    $('#b-thunder').className = 'thunder-warn';
    $('#b-ink').innerHTML = '';
    this._fog = false;

    this.nextWord();
    this.updateBars(true);
    this.updateCombo();
    this.overlay(`<div class="ov-box vs">
      <div class="vs-row"><div class="sprite">${slimeSVG(ch.id, ch.stage)}</div><div class="vs-text">VS</div><div class="sprite enemy-mini">${enemySVG(this.ed.id)}</div></div>
      ${this.challengeBanner()}
      <div class="ov-title">${this.ed.name}が現れた！</div>
      <div class="ov-sub">${this.ed.abilityDesc}</div>
      <div class="ov-diff" id="b-diff"></div>
      <div class="ov-key"><kbd>A</kbd><kbd>D</kbd>で難易度　<kbd>Space</kbd>でバトル開始</div></div>`);
    this.renderDiff();
  },

  // バトル前に 難易度を えらぶ (1 / 2 / 3)
  renderDiff() {
    const box = $('#b-diff');
    if (!box) return;
    box.innerHTML = `<span>難易度</span>${BATTLE_DIFF_KEYS.map((k, i) => `<button class="${k === this.dk ? 'on' : ''}" data-k="${k}" style="--dc:${BATTLE_DIFFS[k].color}"><kbd>${i + 1}</kbd> ${BATTLE_DIFFS[k].name}</button>`).join('')}
      <small>推奨Lv.${this.ed.lv}・敵の攻撃×${this.k.toFixed(2)}・HP×${Math.pow(this.k, 0.7).toFixed(2)}${this.bd.reward > 1 ? `・コイン×${this.bd.reward}` : ''}（${this.bd.note}）</small>`;
    box.querySelectorAll('button').forEach(b => { b.onclick = () => this.pickDiff(b.dataset.k); });
  },
  pickDiff(k) {
    if (this.state !== 'ready' || k === this.dk) return;
    if (this.rush && this.rush.i > 0) { SFX.miss(); return; } // ボスラッシュの 途中では 変えられない
    setBattleDiff(k);
    this.enter(this.arg); // 敵の HP を 作りなおす
  },

  // バトル前の 画面に 出す チャレンジの 見出し
  challengeBanner() {
    if (this.rush) return `<div class="ov-challenge">👑 ボスラッシュ ${this.rush.i + 1} / ${RUSH_LIST.length}${this.rush.hpFrac != null ? `　HP ${Math.round(this.p.hp / this.p.max * 100)}%で続ける` : ''}</div>`;
    const r = this.rule && WEEKLY_RULES.find(x => x.id === this.rule);
    return r ? `<div class="ov-challenge">${r.icon} 今週のチャレンジ「${r.name}」: ${r.desc}</div>` : '';
  },
  backScreen() { return this.rush || this.rule ? 'challenge' : 'stages'; },

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
    this.entrance();
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

  // とくべつな キャラの 登場: 光の 柱が 立って 上から ふってくる
  entrance() {
    const r = charRank(this.ch.id);
    if (!r) return;
    const el = $('#b-player');
    el.classList.remove('entry', 'entry-ssr', 'entry-special');
    void el.offsetWidth;
    el.classList.add('entry', 'entry-' + r);
    this.after(() => el.classList.remove('entry', 'entry-ssr', 'entry-special'), 1900);
    SFX.entrance();
    this.after(() => {
      const pc = FX.center($('#b-psprite'));
      const colors = r === 'ssr' ? ['#ffd43b', '#fff3bf', '#fff'] : ['#ff8787', '#ffd43b', '#69db7c', '#4dabf7', '#b197fc'];
      FX.burst(pc.x, pc.y + 30, { colors, count: 40, shape: 'star', size: 7, speed: 7 });
      FX.ring(pc.x, pc.y + 50, colors[0], 110, 30, 6);
    }, 650);
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
      this.p.poisonUntil > this.elapsed ? `<i class="st poison">${this.ed.statusName || '毒'}</i>` : '',
      this.frozenUntil > this.elapsed ? '<i class="st frozen">こごえ</i>' : '',
      this.p.shield > 0 ? `<i class="st shield">シールド×${this.p.shield}</i>` : '',
      this.p.barrier > 0 ? `<i class="st barrier">バリア×${this.p.barrier}</i>` : '',
      this.p.evade > 0 ? `<i class="st evade">かわす×${this.p.evade}</i>` : '',
      this.p.reflect > 0 ? `<i class="st reflect">はね返し×${this.p.reflect}</i>` : '',
      this.tempo > 0 ? `<i class="st boost">テンポ×${this.tempo}</i>` : '',
      this.snow > 0 ? `<i class="st frozen">雪玉×${this.snow}</i>` : '',
      this.seg > 0 ? `<i class="st boost">体×${this.seg}</i>` : '',
      this.luck > 0 ? `<i class="st boost">🎲×${this.diceN} あと${this.luck}回</i>` : '',
      this.p.boost > 1 ? '<i class="st boost">攻撃UP</i>' : '',
      this.raging() ? '<i class="st rage">怒り</i>' : '',
      this.streakBonus() > 0 ? `<i class="st boost">リズム+${Math.round(this.streakBonus() * 100)}%</i>` : '',
    ].join('');
    // 変わったときだけ書きかえる (毎フレーム書きかえると重い)
    if (status !== this._status) { this._status = status; $('#b-pstatus').innerHTML = status; }

    // 敵のやけど (ほむらの ひっさつ)
    if (this.e.burnUntil > this.elapsed && this.elapsed >= (this.e.nextBurn || 0)) {
      this.e.nextBurn = this.elapsed + 1000;
      const d = Math.max(1, Math.round(this.e.max * (this.ch.skill.burnPct || 0.03))); // ほむら 最終進化は 2 倍
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
      const d = Math.max(1, Math.round(this.e.max * this.ch.trait.poisonPct * this.e.poison * (this.poisonBoostUntil > this.elapsed ? 2 : 1)));
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
        const h = Math.max(1, Math.round(this.p.max * this.ch.trait.regen * (this.regenUntil > this.elapsed ? 2 : 1)));
        this.p.hp = Math.min(this.p.max, this.p.hp + h);
        const pc = FX.center($('#b-psprite'));
        floatText(pc.x + 30, pc.y - 30, `+${h}`, 'heal');
        this.updateBars();
      }
    }
    const estatus = [
      this.e.burnUntil > this.elapsed ? '<i class="st burn">やけど</i>' : '',
      this.e.bindUntil > this.elapsed ? '<i class="st bind">縛り</i>' : '',
      this.e.chillUntil > this.elapsed ? '<i class="st frozen">こごえ</i>' : '',
      this.e.breakUntil > this.elapsed ? '<i class="st break">ブレイク</i>' : '',
      this.e.poison > 0 ? `<i class="st poison">毒×${this.e.poison}</i>` : '',
      this.e.weakUntil > this.elapsed ? '<i class="st bind">弱り</i>' : '',
    ].join('');
    if (estatus !== this._estatus) { this._estatus = estatus; $('#b-estatus').innerHTML = estatus; }
    $('#b-enemy').classList.toggle('bound', this.e.bindUntil > this.elapsed);

    this.tickAbilities();

    // ゆうれいのきり / かげろう / まおうのやみ
    if (this.has('fade') || (this.has('demon') && this.demonPhase >= 1)) {
      if (this.elapsed >= this.nextFog) {
        this.fogUntil = this.elapsed + 3500;
        this.nextFog = this.elapsed + 9000 + Math.random() * 3000;
        const fogMsg = { salamander: 'かげろうでガイドが揺らめいた！', demon: '闇でガイドを隠した！' }[this.ed.id] || '霧を出した！';
        this.log(`${this.ed.name}は${fogMsg}`, 'enemy');
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
      this.log(`${this.ed.name}は身を守っている！（3秒間ダメージ大幅ダウン）`, 'enemy');
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
      this.log(`${this.ed.name}はHPを回復した！`, 'enemy');
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
      this.log(`${sand ? '砂嵐' : '吹雪'}で漢字とかなが見えない！ ローマ字を頼りに打とう`, 'enemy');
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
      this.log('強い風で文字が揺れている！', 'enemy');
      SFX.noise(0.6, { vol: 0.06, filter: 900 });
    }
    $('#b-tp').classList.toggle('windy', this.windUntil > now);

    // かみなりのよこく: 3 秒以内に お題を打ち切れば よけられる
    if (this.has('thunder') && !this.thunderAt && now >= this.nextThunder) {
      this.thunderAt = now + 3000;
      this.thunderWords = this.words;
      this.nextThunder = now + (this.ed.boss ? 7000 : 10000) + Math.random() * 2000;
      this.log('⚡ 雷が来る！ 3秒以内にお題を打ち切れ！', 'enemy');
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
        this.log('雷をかわした！', 'good');
      } else if (left <= 0) {
        this.thunderAt = 0;
        tw.className = 'thunder-warn';
        const pc = FX.center($('#b-psprite'));
        FX.bolt(pc.x + 20, -20, pc.x, pc.y, '#fff27a', 16);
        replayAnim(document.body, 'flash-white', 300);
        SFX.thunder();
        this.damagePlayer(Math.max(1, Math.round(this.p.max * (this.ed.boss ? 0.15 : 0.12))), 'big');
        this.log('雷が落ちた！', 'enemy');
      }
    }

    // ためこうげきの予告
    const charging = this.has('charge') && (this.e.attacks + 1) % 3 === 0 && this.e.gauge > 0.55;
    if (charging && !this.chargeWarned) { this.chargeWarned = true; this.log(`${this.ed.name}は力をためている！`, 'enemy'); }
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
    this.log(`${this.ed.name}が墨を吐いた！`, 'enemy');
    SFX.noise(0.3, { vol: 0.12, filter: 600 });
    const c = FX.center($('#b-tp'));
    FX.burst(c.x, c.y, { colors: ['#10002b', '#3c096c'], count: 30, speed: 8, size: 7 });
  },

  nextWord() {
    this.word = this.deck.next();
    this.target = new TypingTarget(this.word.k);
    this.wordMiss = false;
    this.wordStart = 0;
    this.forgiven = 0; // ゆらりん: お題ごとに ミスを ふせげる
    replayAnim($('#b-tp'), 'word-in', 300);
    this.render();
  },

  render() {
    renderTyping($('#b-tp'), this.word, this.target, { hideRoma: this.fogUntil > this.elapsed });
  },

  // りゅうまる: HP が へると こうげきアップ
  raging() { return this.ch.id === 'ryumaru' && (this.p.hp / this.p.max < this.ch.trait.rageAt || this.rageUntil > this.elapsed); },
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
      // A/D (W/S) で 難易度を ひとつ ずらす
      const dk = { a: -1, w: -1, d: 1, s: 1 }[e.key.toLowerCase()];
      if (dk) { const i = BATTLE_DIFF_KEYS.indexOf(this.dk) + dk; if (i >= 0 && i < BATTLE_DIFF_KEYS.length) this.pickDiff(BATTLE_DIFF_KEYS[i]); return; }
      if (e.key === ' ') this.countdown();
      if (e.key === 'Escape') App.show(this.backScreen());
      return;
    }
    // ボスラッシュの 戦いの 間 / チャレンジの 結果
    if (this.state === 'between') { if (e.key === ' ') this.betweenNext(); return; }
    if (this.state === 'chend') {
      if (e.key === ' ' || e.key === 'Escape') App.show('challenge');
      if (e.key.toLowerCase() === 'r' && this.rule) App.show('battle', { ...this.arg });
      return;
    }
    if (this.state === 'pause') return; // ポーズ中は 設定画面が キーを うけとる
    if (this.state !== 'run') return;
    if (e.key === 'Escape') {
      // ポーズして 設定を 開く (閉じると 再開・Enter で 逃げる)
      this.state = 'pause';
      cancelAnimationFrame(this.raf);
      this.overlay('<div class="ov-box"><div class="ov-title">ポーズ中</div></div>');
      Settings.open({ title: 'ポーズ中', quit: { label: this.rush || this.rule ? 'やめる（チャレンジへ）' : '逃げる（マップへ）', fn: () => this.rush ? this.challengeFinish(false) : App.show(this.backScreen()) }, onClose: () => this.resume() });
      return;
    }
    if (e.key.length !== 1) return;

    const key = e.key.toLowerCase();
    if (!this.wordStart) this.wordStart = this.elapsed;
    const expected = this.target.nextKey();
    const r = this.target.input(key);
    if (r === 'miss' && this.forgive(expected)) {
      // ゆらりん: この ミスは なかったことに (コンボ・敵の ゲージ・ひっさつ ゲージは そのまま)
    } else if (r === 'miss') {
      this.miss++;
      this.wordMiss = true;
      this.missMap[expected] = (this.missMap[expected] || 0) + 1;
      recordMiss(expected);
      // ごつん: ミスしてもコンボが一部残る (進化すると多く残る)
      if (this.comboGuardUntil > this.elapsed) { /* ふえりん: しばらく コンボが 切れない */ }
      else this.combo = this.ch.id === 'gotsun' ? Math.floor(this.combo * this.ch.trait.comboKeep) : 0;
      this.comboAcc = 0;
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
      // 今週の チャレンジ「ノーミス勝負」: ミスしたら 負け
      if (this.rule === 'nomiss' && this.state === 'run') { this.log('ミスしてしまった！', 'enemy'); this.p.hp = 0; this.updateBars(); this.lose(); return; }
      // 上級者: ミスすると 自分に 少し ダメージ (速さだけで なく 正確さも 求める)
      if (this.bd.missDmg && this.state === 'run' && this.p.hp > 0) this.damagePlayer(Math.max(1, Math.round(this.p.max * this.bd.missDmg)), 'miss');
    } else {
      this.correct++;
      recordHit(key);
      this.combo += comboStep(this, this.ch.trait);
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

  // ゆらりん: お題ごとに さいしょの ミス (ひっさつの あとは しばらく ぜんぶ) を なかったことに する
  forgive(expected) {
    const tr = this.ch.trait;
    if (!tr.forgive) return false;
    const always = this.forgiveUntil > this.elapsed;
    if (!always && this.forgiven >= tr.forgive) return false;
    if (!always) this.forgiven++;
    this.miss++; // きろくには のこす
    this.missMap[expected] = (this.missMap[expected] || 0) + 1;
    recordMiss(expected);
    const pc = FX.center($('#b-psprite'));
    floatText(pc.x, pc.y - 70, 'セーフ！', 'guard');
    this.healP(this.p.max * tr.forgiveHeal);
    SFX.tone(700, 0.12, { type: 'sine', vol: 0.04, slide: 1100 });
    replayAnim($('#b-tp'), 'word-in', 200);
    return true;
  },

  // ポーズから 再開
  resume() {
    if (this.state !== 'pause') return;
    this.state = 'run';
    this.overlay('');
    this.last = performance.now();
    this.raf = requestAnimationFrame(t => this.tick(t));
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
      if (perfect) this.streak++;
      else if (this.streakGuard > 0) this.streakGuard--; // 最終進化: ミスしても リズムが 消えない
      else this.streak = 0;
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

    // いもりん: のびた 体 1 つ につき 強い (打ち切るたび のびる)
    if (this.ch.id === 'imomushi') { dmg *= 1 + this.seg * this.ch.trait.segStep; this.seg = Math.min(this.ch.trait.segMax, this.seg + 1); }
    // ちょうちんりん: 敵の 攻撃ゲージが たまっているほど 強い
    let flare = 0;
    if (this.ch.id === 'chochin') { flare = (this.ch.skill.flareMax && this.p.barrier > 0 ? 1 : clamp(this.e.gauge, 0, 1)) * this.ch.trait.gaugeBoost; dmg *= 1 + flare; }
    // サイコロりん: サイコロを ふる (必殺の あとは 2〜3 個。ゾロ目で 特大ダメージ＋1回 延長)
    let roll = null, extended = false;
    if (this.ch.id === 'saikoro') {
      const multi = this.luck > 0;
      roll = rollDice(this.ch.trait, multi ? this.diceN : 1, multi ? this.diceZoro : 0, multi ? this.diceWeight : 1, multi ? this.diceTriple : 2);
      if (multi && roll.zoro && this.ch.skill.zoroRefund) { this.p.skill = Math.min(99, this.p.skill + this.ch.skill.zoroRefund * 100); this.updateBars(); }
      if (multi) {
        this.luck--;
        if (roll.zoro && this.diceExt < 3) { this.luck++; this.diceExt++; extended = true; } // ゾロ目で 延長 (最大 3 回)
      }
      dmg *= roll.mult;
    }

    // トリオりん: ノーミスで 3 つ つづけると 3 つめが トリオボーナス
    let trioHit = false;
    if (this.ch.id === 'torio') {
      this.trioStreak = perfect ? this.trioStreak + 1 : 0;
      if ((this.trioStreak > 0 && this.trioStreak % 3 === 0) || this.trioNext) { dmg *= 1 + this.ch.trait.trio; trioHit = true; this.trioNext = false; }
    }

    // 会心: ぴりりは速く打つほど出やすい (進化すると上限と倍率が上がる)
    let critRate = this.ch.trait.crit || 0.06, critMult = 1.5; // ゆうしゃりんは 会心率が 高い
    if (this.ch.id === 'piriri') {
      critRate = 0.1 + clamp((kps - 2) * 0.2, 0, this.ch.trait.critMax - 0.1);
      critMult = this.ch.trait.critMult;
    }
    // ぴたりん: ノーミスの お題は かならず 会心
    if (this.ch.id === 'pitarin' && perfect) { critRate = 1; critMult = this.ch.trait.perfectCrit; }
    if (this.critUntil > this.elapsed) critRate += this.critAdd;            // ゆうしゃりん: 会心アップ
    if (tempoHit && this.ch.skill.tempoCrit) critRate = 1;                   // おんぷる 最終進化
    let crit;
    if (this.ch.id === 'torio') {
      // 3 びきが じゅんに 攻撃: 会心は 1 ぴきずつ きまる
      const k = [0, 1, 2].filter(() => Math.random() < critRate).length;
      dmg *= (3 - k + k * critMult) / 3;
      crit = k > 0;
    } else {
      crit = Math.random() < critRate;
      if (crit) dmg *= critMult;
    }

    // ゴーレムのよろい
    let armorMsg = '';
    const pierceAll = this.ch.skill.breakPierce && this.e.breakUntil > this.elapsed;
    if (this.has('armor') && !pierceAll) {
      if (this.combo < 30) { dmg *= this.ch.trait.pierce ? 0.75 : 0.5; armorMsg = 'block'; } else armorMsg = 'break';
    }
    if (this.shellUntil > this.elapsed && !pierceAll) { dmg *= this.ch.trait.pierce ? 0.6 : 0.3; armorMsg = 'shell'; }
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
    const sound = this.raging() ? 'rage' : this.ch.id === 'kirari' && this.streak >= 3 ? 'sparkle:' + this.streak : tempoHit ? 'beat' : trioHit ? 'sparkle:6' : null;
    this.playerAttackFx(dmg, { crit, boosted, armorMsg, perfect, sound });
    if (roll) {
      const pc = FX.center($('#b-psprite'));
      const txt = roll.faces.map(f => '🎲' + f).join(' ');
      if (roll.zoro) {
        floatText(pc.x + 50, pc.y - 60, `${txt} ${roll.triple ? 'トリプル' : 'ゾロ目'}！`, 'crit-label');
        floatText(pc.x + 50, pc.y - 95, `+${Math.round(roll.bonus * 100)}%`, 'crit-label');
        this.log(`🎲 ${roll.zoro}の${roll.triple ? 'トリプル' : 'ゾロ目'}！ ${dmg}ダメージ${extended ? '・1回延長' : ''}`, 'good');
        SFX.levelup();
      } else {
        const f = roll.faces.length === 1 ? roll.faces[0] : 0;
        floatText(pc.x + 50, pc.y - 60, txt, f === 6 ? 'crit-label' : f && f <= 2 ? 'dmg poison' : 'combo-pop');
        if (f === 6) this.log(`🎲 6の目！ ${dmg}ダメージ`, 'good');
      }
    }
    if (flare >= 0.3) {
      const pc = FX.center($('#b-psprite'));
      floatText(pc.x, pc.y - 80, `ぎりぎり +${Math.round(flare * 100)}%`, 'crit-label');
    }
    if (trioHit) {
      const pc = FX.center($('#b-psprite'));
      floatText(pc.x, pc.y - 80, 'トリオボーナス！', 'crit-label');
      this.log(`3匹の連携！ トリオボーナスで${dmg}ダメージ`, 'good');
    }
    // ふわり: ときどき もう 1 回 おいうち
    if (this.ch.id === 'fuwari' && (this.doubleUntil > this.elapsed || Math.random() < this.ch.trait.double)) {
      this.after(() => { if (this.state === 'run') { this.playerAttackFx(Math.max(1, Math.round(dmg * 0.5)), { crit: false, boosted: false, armorMsg: '', perfect: false, sound: 'swish' }); this.log('追い風で追い打ち！', 'good'); } }, 180);
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
      fuerin: { color: '#94d82d', size: 9, arc: -60, frames: 14 },
      torio: { color: '#ffd43b', size: 9, arc: -70, frames: 14 },
      saikoro: { color: '#e03131', size: 10, arc: -90, frames: 16 },
      imomushi: { color: '#94d82d', size: 9, arc: -30, frames: 14 },
      chochin: { color: '#ffd43b', size: 11, arc: -40, frames: 16 },
      yurarin: { color: '#a5d8ff', size: 10, arc: 50, frames: 16 },
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
        if (this.ch.id === 'gorurin') this.healP(dmg * this.ch.trait.drain * (this.drainUntil > this.elapsed ? 2 : 1));
        if (boosted) this.log('アクアパワーで攻撃が強くなった！', 'good');
        if (armorMsg === 'block') this.log('石のよろいでダメージが減った…（コンボ30で貫通）', 'enemy');
        if (armorMsg === 'break' && Math.random() < 0.4) this.log('コンボの力でよろいを貫いた！', 'good');
        if (armorMsg === 'shell' && Math.random() < 0.5) this.log('はじかれた！ ガードが解けるまで待とう', 'enemy');
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
    const sk0 = this.ch.skill;
    if (sk0.bindBoost && this.e.bindUntil > this.elapsed) dmg = Math.round(dmg * (1 + sk0.bindBoost)); // かげまる: 縛り中
    if (sk0.burnBoost && this.e.burnUntil > this.elapsed) dmg = Math.round(dmg * (1 + sk0.burnBoost)); // ほむら: やけど中
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
    if (crit) { floatText(c.x, c.y - 90, '会心！', 'crit-label'); SFX.crit(); shake($('#arena')); }
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
        this.log(`ヒュドラの首が${heads}本になった！ ${heads}回攻撃してくる！`, 'enemy');
        cutin(`首が${heads}本に！`, this.ed.name, '#7b2cbf', enemySVG(this.ed.id));
      }
    }
    // まおう: 3 段階
    if (this.has('demon')) {
      if (this.demonPhase === 0 && this.e.hp <= this.e.max * 2 / 3) {
        this.demonPhase = 1;
        this.nextFog = this.elapsed + 600;
        $('#arena').classList.add('dark');
        this.log('魔王が闇の力を使った！', 'enemy');
        cutin('闇の力', this.ed.name, '#7b2cbf', enemySVG(this.ed.id));
        SFX.thunder();
      }
      if (this.demonPhase === 1 && this.e.hp <= this.e.max / 3) {
        this.demonPhase = 2;
        this.e.angry = true;
        $('#b-enemy').classList.add('angry');
        this.log('魔王が本気を出した！ 必殺ゲージが奪われる！', 'enemy');
        cutin('魔王 本気モード', this.ed.name, '#ff006e', enemySVG(this.ed.id));
        SFX.thunder();
      }
      return;
    }
    if (this.has('ink') && !this.e2.double && this.e.hp <= this.e.max / 2) {
      this.e2.double = true;
      $('#b-enemy').classList.add('angry');
      this.log(`${this.ed.name}が暴れ出した！ 2連続で攻撃してくる！`, 'enemy');
      cutin('暴れる', this.ed.name, '#c9184a', enemySVG(this.ed.id));
    }
    if (this.e.angry || this.e.hp > this.e.max / 2) return;
    if (this.has('rage')) {
      this.e.angry = true;
      $('#b-enemy').classList.add('angry');
      this.log(`${this.ed.name}は怒り出した！ 攻撃が速くなった！`, 'enemy');
      cutin('激怒！', this.ed.name, '#e0443e', enemySVG(this.ed.id));
    }
    if (this.has('dragon')) {
      this.e.angry = true;
      $('#b-enemy').classList.add('angry');
      this.log(`${this.ed.name}が本気を出した！`, 'enemy');
      cutin('本気モード', this.ed.name, '#ff6a00', enemySVG(this.ed.id));
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
    cutin(sk.name, ch.name, col.main, slimeSVG(ch.id, ch.stage), charRank(ch.id));
    if (charRank(ch.id)) SFX.rankCut();
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
        this.log(`${ch.name}の${sk.name}！ HPが${heal}回復した！${sk.barrier ? ' 水のバリアを張った！' : ''}`, 'good');
        this.updateBars();
        this.skillExtras(sk, 0);
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
          this.log(`${sk.name}！ ${dmg}のダメージ！`, 'good');
          if (sk.resetGauge) { this.e.gauge = 0; this.log('いかずちで敵の攻撃を止めた！', 'good'); }
          this.skillExtras(sk, dmg, ['#fff27a', '#fff']);
        }, 250);
      }, 700);
    }

    // ほむら・もりりん・かげまる・りゅうまる・きらり: 攻撃 + それぞれの効果
    if (['homura', 'moririn', 'kagemaru', 'ryumaru', 'kirari', 'koorin', 'fuwari', 'metarun', 'onpuru', 'pitarin', 'dororin', 'gorurin', 'yukidarun', 'yuusharin', 'fuerin', 'torio', 'yurarin', 'saikoro', 'imomushi', 'chochin'].includes(ch.id)) {
      this.after(() => {
        if (this.state !== 'run') return;
        const ec = FX.center($('#b-esprite'));
        let dmg = calcDamage(ch.L, sk.power, ch.stats.atk, this.e.stats.def) * (0.92 + Math.random() * 0.08);
        // りゅうまる: HP が へっているほど 強い / きらり: リズムの ボーナスが のる
        if (ch.id === 'ryumaru') dmg *= 1 + sk.lowBoost * (1 - clamp(this.p.hp / this.p.max, 0, 1));
        if (ch.id === 'kirari') dmg *= 1 + this.streakBonus();
        if (ch.id === 'yukidarun') dmg *= 1 + sk.snowBoost * this.snow; // ゆきだまが 多いほど 強い
        if (ch.id === 'fuerin') dmg *= 1 + Math.min(sk.boostMax, this.combo * sk.comboBoost); // コンボが 多いほど 強い
        if (ch.id === 'torio') dmg *= sk.allCrit ? 1.5 : (2 + 1.5) / 3; // 3 かいに わけて、3 かいめは かならず 会心 (最終進化は 3 回とも)
        if (ch.id === 'imomushi') dmg *= 1 + this.seg * sk.segBoost; // のびた 体が 多いほど 強い
        dmg = Math.round(dmg);
        const fxCol = { homura: ['#ff6b35', '#ffe066', '#fff'], moririn: ['#51cf66', '#d3f9d8', '#fff'], kagemaru: ['#7048e8', '#1a1a2e', '#e5dbff'],
          ryumaru: ['#ff922b', '#ffd43b', '#fff'], kirari: ['#f783ac', '#fff3bf', '#99e9f2'],
          koorin: ['#a5d8ff', '#e7f5ff', '#fff'], fuwari: ['#96f2d7', '#e6fcf5', '#fff'], metarun: ['#adb5bd', '#ffd43b', '#fff'],
          onpuru: ['#ff8cc6', '#ffe066', '#fff'], pitarin: ['#91a7ff', '#ffe066', '#fff'],
          dororin: ['#9775fa', '#8ce99a', '#fff'], gorurin: ['#ffd43b', '#fff9db', '#fff'], yukidarun: ['#ffffff', '#a5d8ff', '#ff922b'], yuusharin: ['#4dabf7', '#ffd43b', '#fff'], fuerin: ['#94d82d', '#ff8787', '#fff'], torio: ['#ff6b6b', '#ffd43b', '#4dabf7'], yurarin: ['#a5d8ff', '#f783ac', '#fff'], saikoro: ['#fff', '#e03131', '#ffd43b'], imomushi: ['#94d82d', '#ffd43b', '#fff'], chochin: ['#ffd43b', '#74c0fc', '#ff6b6b'] }[ch.id];
        for (let i = 0; i < 16; i++) {
          this.after(() => this.proj({ x: pc.x + 20, y: pc.y + (Math.random() - 0.5) * 40 }, { x: ec.x + (Math.random() - 0.5) * 60, y: ec.y + (Math.random() - 0.5) * 60 },
            { color: fxCol[i % 3], size: 5 + Math.random() * 7, frames: 16, arc: (Math.random() - 0.5) * 100, trail: false }), i * 20);
        }
        this.after(() => {
          if (this.state !== 'run') return;
          this.hitEnemy(dmg, { big: true, colors: fxCol, sound: 'skill-' + ch.id });
          if (ch.id === 'homura') { this.e.burnUntil = this.elapsed + sk.burn * 1000; this.e.nextBurn = this.elapsed + 1000; this.log(`${sk.name}！ ${dmg}のダメージ！ 敵がやけどした！`, 'good'); }
          if (ch.id === 'moririn') {
            const h = Math.round(this.p.max * sk.heal);
            this.p.hp = Math.min(this.p.max, this.p.hp + h); this.p.poisonUntil = 0;
            floatText(pc.x, pc.y - 60, `+${h}`, 'heal big');
            SFX.heal();
            this.log(`${sk.name}！ ${dmg}ダメージ、HPが${h}回復した！`, 'good');
            this.updateBars();
          }
          if (ch.id === 'ryumaru') this.log(`${sk.name}！ ${dmg}のダメージ！`, 'good');
          if (ch.id === 'koorin') { this.e.chillUntil = this.elapsed + sk.chill * 1000; this.log(`${sk.name}！ ${dmg}ダメージ、敵を${sk.chill}秒こごえさせた！`, 'good'); }
          if (ch.id === 'fuwari') { this.p.evade = sk.evade; this.log(`${sk.name}！ ${dmg}ダメージ、次の攻撃を${sk.evade}回かわす！`, 'good'); }
          if (ch.id === 'dororin') { this.e.poison = Math.min(this.ch.trait.poisonMax + sk.addPoison, this.e.poison + sk.addPoison); this.e.nextPoison = this.elapsed + 1000; this.e.weakUntil = this.elapsed + sk.weaken * 1000; this.log(`${sk.name}！ ${dmg}ダメージ、毒×${this.e.poison}、敵の攻撃が弱くなった！`, 'good'); }
          if (ch.id === 'gorurin') { this.healP(dmg * sk.skillDrain); this.log(`${sk.name}！ ${dmg}ダメージ、元気を吸い取った！`, 'good'); }
          if (ch.id === 'yukidarun') this.log(`${sk.name}！ 雪玉${this.snow}個で${dmg}ダメージ！`, 'good');
          if (ch.id === 'yuusharin') { this.healP(this.p.max * sk.heal); this.e.gauge = 0; this.log(`${sk.name}！ ${dmg}ダメージ、HP回復・敵の攻撃を止めた！`, 'good'); }
          if (ch.id === 'saikoro') { this.luck = sk.luck; this.diceN = sk.dice; this.diceZoro = sk.zoro; this.diceExt = 0; this.diceWeight = sk.weight || 1; this.diceTriple = sk.tripleMult || 2; this.log(`${sk.name}！ ${dmg}ダメージ、次の${sk.luck}回はサイコロ${sk.dice}個！ ゾロ目をねらえ！`, 'good'); }
          if (ch.id === 'imomushi') this.log(`${sk.name}！ 体${this.seg}つ分で${dmg}ダメージ！`, 'good');
          if (ch.id === 'chochin') { this.p.barrier = Math.max(this.p.barrier, sk.guard); $('#b-player').classList.add('bubbled'); this.log(`${sk.name}！ ${dmg}ダメージ、人魂が${sk.guard}回守る！`, 'good'); }
          if (ch.id === 'torio') this.log(`${sk.name}！ 3匹の3連撃で${dmg}ダメージ！`, 'good');
          if (ch.id === 'yurarin') { this.forgiveUntil = this.elapsed + sk.forgiveSecs * 1000; this.log(`${sk.name}！ ${dmg}ダメージ、${sk.forgiveSecs}秒間ミスがなかったことになる！`, 'good'); }
          if (ch.id === 'fuerin') this.log(`${sk.name}！ ${this.combo}コンボの分身で${dmg}ダメージ！`, 'good');
          if (ch.id === 'onpuru') { this.tempo = sk.tempo; this.tempoMult = sk.tempoMult; this.log(`${sk.name}！ ${dmg}ダメージ、次の${sk.tempo}お題が${sk.tempoMult}倍！`, 'good'); }
          if (ch.id === 'pitarin') { this.p.reflect = sk.reflect; this.log(`${sk.name}！ ${dmg}ダメージ、敵の攻撃を${sk.reflect}回はね返す！`, 'good'); }
          if (ch.id === 'metarun') { this.e.breakUntil = this.elapsed + sk.brk * 1000; this.log(`${sk.name}！ ${dmg}ダメージ、敵を${sk.brk}秒ブレイク！`, 'good'); }
          if (ch.id === 'kirari') {
            if (sk.barrier) { this.p.barrier = Math.max(this.p.barrier, sk.barrier); $('#b-player').classList.add('bubbled'); }
            this.log(`${sk.name}！ ${dmg}のダメージ！${sk.barrier ? ' 光の壁を張った！' : ''}`, 'good');
          }
          if (ch.id === 'kagemaru') { this.e.bindUntil = this.elapsed + sk.bind * 1000; this.log(`${sk.name}！ ${dmg}ダメージ、敵を${sk.bind}秒縛った！`, 'good'); }
          this.skillExtras(sk, dmg, fxCol);
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
        this.log(`${ch.name}の${sk.name}！ ${sk.guards}回防ぐ！`, 'good');
        this.skillExtras(sk, 0);
      }, 700);
    }
    this.updateBars();
  },

  // 進化で ふえた 必殺の 効果 (data.js の SKILL_UPS)。必殺が 当たった あとに よぶ
  skillExtras(sk, dmg, colors = ['#fff']) {
    const T = s => this.elapsed + s * 1000;
    const tr = this.ch.trait;
    if (sk.refund) { this.p.skill = Math.max(this.p.skill, sk.refund * 100); this.updateBars(); }
    if (sk.echo && dmg) this.after(() => { if (this.state === 'run') { this.hitEnemy(Math.round(dmg * sk.echo), { colors }); this.log(`追撃！ ${Math.round(dmg * sk.echo)}ダメージ`, 'good'); } }, 450);
    if (sk.resetGauge && this.ch.id !== 'piriri') { this.e.gauge = 0; this.log('敵の攻撃ゲージを0に戻した！', 'good'); }
    if (sk.ward) this.wardUntil = T(sk.ward);
    if (sk.wardForgive) this.wardUntil = T(sk.forgiveSecs);
    if (sk.critSecs) { this.critUntil = T(sk.critSecs); this.critAdd = sk.critAdd; }
    if (sk.rageSecs) { this.rageUntil = T(sk.rageSecs); this.log('竜の怒りが目覚めた！', 'good'); }
    if (sk.regenBoost) this.regenUntil = T(sk.regenBoost);
    if (sk.streakGuard) this.streakGuard = sk.streakGuard;
    if (sk.doubleSecs) this.doubleUntil = T(sk.doubleSecs);
    if (sk.poisonBoostSecs) this.poisonBoostUntil = T(sk.poisonBoostSecs);
    if (sk.poisonFill) this.e.poison = Math.max(this.e.poison, tr.poisonMax + (sk.addPoison || 0));
    if (sk.drainSecs) this.drainUntil = T(sk.drainSecs);
    if (sk.lifesteal && dmg) this.healP(dmg * sk.lifesteal);
    if (sk.addBarrier) { this.p.barrier = Math.max(this.p.barrier, sk.addBarrier); $('#b-player').classList.add('bubbled'); }
    if (sk.addSnow) this.snow = Math.min(tr.snowMax, this.snow + sk.addSnow);
    if (sk.chill && this.ch.id !== 'koorin') this.e.chillUntil = T(sk.chill);
    if (sk.comboGuardSecs) this.comboGuardUntil = T(sk.comboGuardSecs);
    if (sk.comboAdd) { this.combo += sk.comboAdd; this.maxCombo = Math.max(this.maxCombo, this.combo); this.updateCombo(); }
    if (sk.trioNext) this.trioNext = true;
    if (sk.segFill) this.seg = tr.segMax;
    if (sk.segGuardSecs) this.segGuardUntil = T(sk.segGuardSecs);
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
    const sk1 = this.ch.skill;
    if (sk1.chillWeak && this.e.chillUntil > this.elapsed) dmg *= 1 - sk1.chillWeak;   // こおりん: こごえた 敵
    if (sk1.breakWeak && this.e.breakUntil > this.elapsed) dmg *= 1 - sk1.breakWeak;   // メタルン: ブレイク中
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
      this.log('ドラゴンの炎のブレス！', 'enemy');
      for (let i = 0; i < 26; i++) {
        this.after(() => this.proj({ x: from.x - 60, y: from.y - 30 }, { x: to.x + (Math.random() - .5) * 60, y: to.y + (Math.random() - .5) * 60 },
          { color: i % 3 ? '#ff7a1a' : '#ffd23f', size: 6 + Math.random() * 8, frames: 16, arc: (Math.random() - .5) * 40, trail: false }), i * 18);
      }
      this.after(() => this.resolveEnemyHit(dmg, true), 16 * 18 + 260);
      return;
    }
    if (charged) {
      this.log(`${this.ed.name}のため攻撃！`, 'enemy');
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
      if (this.ch.skill.guardHit) this.counterHit(this.ch.skill.guardHit, ['#ffd43b', '#74c0fc', '#fff']); // ちょうちんりん 最終進化
      return;
    }
    // ぴたりん: 敵の 攻撃を はね返す
    if (this.p.reflect > 0) {
      this.p.reflect--;
      floatText(pc.x, pc.y - 50, 'はね返した！', 'guard');
      const ec = FX.center($('#b-esprite'));
      const rdmg = Math.round(dmg * (this.ch.skill.reflectMult || 1)); // ぴたりん 最終進化は 2 倍
      this.proj(pc, ec, { color: '#ffe066', size: 12, frames: 14, arc: -30, onHit: () => { if (this.state === 'run') { this.hitEnemy(rdmg, { colors: ['#ffe066', '#91a7ff', '#fff'], sound: 'reflect' }); this.log(`はね返して${rdmg}ダメージ！`, 'good'); } } });
      return;
    }
    // ふわり: ひっさつで 攻撃を かわす
    if (this.p.evade > 0) {
      this.p.evade--;
      replayAnim($('#b-psprite'), 'dodge', 400);
      floatText(pc.x, pc.y - 50, 'かわした！', 'guard');
      SFX.tone(1600, 0.08, { type: 'triangle', vol: 0.04, slide: 2400 });
      if (this.ch.skill.evadeCounter) this.counterHit(this.ch.skill.evadeCounter, ['#96f2d7', '#fff']); // ふわり: かわして 反撃
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
      const back = Math.round((dmg + calcDamage(this.ch.L, sk.power, this.ch.stats.atk, this.e.stats.def)) * (sk.counterCrit ? 1.5 : 1)); // 最終進化は 会心
      if (sk.heal) {
        const h = Math.round(this.p.max * sk.heal);
        this.p.hp = Math.min(this.p.max, this.p.hp + h);
        floatText(pc.x + 40, pc.y - 20, `+${h}`, 'heal');
        this.updateBars();
      }
      const ec = FX.center($('#b-esprite'));
      this.proj(pc, ec, {
        color: this.ch.def.colors.dark, size: 14, frames: 18, arc: -60,
        onHit: () => { if (this.state === 'run') { this.hitEnemy(back, { colors: ['#b08a64', '#9be7a0', '#fff'], sound: 'rock' }); this.log(`反撃！ ${back}ダメージ！`, 'good'); } },
      });
      return;
    }
    this.damagePlayer(dmg, big ? 'big' : 'normal');
    if (this.ch.id === 'yukidarun' && this.snow > 0) this.snow--; // うけると ゆきだまが 1 こ へる
    if (this.ch.id === 'imomushi' && this.seg > 0 && !(this.segGuardUntil > this.elapsed)) this.seg--; // いもりん: うけると 体が 1 つ ちぢむ
    // こおりん: ときどき 敵を こおらせて 攻撃ゲージを もどす
    if (this.ch.id === 'koorin' && this.state === 'run' && Math.random() < this.ch.trait.counter) {
      this.e.gauge = Math.max(0, this.e.gauge - this.ch.trait.pushback);
      const ec = FX.center($('#b-esprite'));
      FX.burst(ec.x, ec.y, { colors: ['#d0ebff', '#fff', '#74c0fc'], count: 18, speed: 5, shape: 'snow', size: 6 });
      this.log('ひんやりやり返した！ 敵の攻撃が遅れる', 'good');
      SFX.impact('ice');
    }
    // 状態異常への強さ (進化で手に入る)
    const statusCut = this.wardUntil > this.elapsed ? 1 : this.ch.id === 'gotsun' ? (this.ch.trait.freezeImmune ? 1 : 0.4) : (this.ch.trait.statusCut || 0);
    const burnSafe = this.ch.trait.burnImmune && this.ed.statusName === 'やけど';
    if (this.has('poison') && this.p.poisonUntil <= this.elapsed && statusCut < 1 && !burnSafe) {
      this.p.poisonUntil = this.elapsed + 5000 * (1 - statusCut);
      this.p.nextPoison = this.elapsed + 1000;
      this.log(`${this.ed.statusName || '毒'}を受けてしまった！`, 'enemy');
    }
    // ぬかるみ
    if (this.has('mud')) {
      this.fogUntil = this.elapsed + 2500;
      this.p.skill = Math.max(0, this.p.skill - 10);
      this.log('泥をかけられた！ ガイドが見えにくい', 'enemy');
      this.updateBars();
    }
    // こおりのいき / ふぶき: しばらく こごえて 攻撃が 弱くなる
    if ((this.has('freeze') || this.has('blizzard')) && !this.ch.trait.freezeImmune && statusCut < 1) {
      this.frozenUntil = this.elapsed + (this.has('freeze') ? 4000 : 3000);
      this.log(`こごえてしまった！ ${this.has('freeze') ? 4 : 3}秒間攻撃が弱くなる`, 'enemy');
      FX.burst(pc.x, pc.y, { colors: ['#d0ebff', '#fff', '#74c0fc'], count: 24, speed: 6, shape: 'star', size: 6 });
      SFX.tone(1800, 0.3, { type: 'sine', vol: 0.05, slide: 600 });
    }
    // まおう (ほんき): ひっさつゲージを うばう
    if (this.has('demon') && this.demonPhase >= 2 && this.p.skill > 0) {
      this.p.skill = Math.max(0, this.p.skill - 10);
      this.log('必殺ゲージを奪われた！', 'enemy');
      this.updateBars();
    }
  },

  // 反撃 (威力 power の 小さな 攻撃)
  counterHit(power, colors) {
    const pc = FX.center($('#b-psprite')), ec = FX.center($('#b-esprite'));
    const d = Math.round(calcDamage(this.ch.L, power, this.ch.stats.atk, this.e.stats.def));
    this.proj(pc, ec, { color: colors[0], size: 10, frames: 14, arc: -40, onHit: () => { if (this.state === 'run') this.hitEnemy(d, { colors }); } });
  },

  damagePlayer(dmg, kind) {
    const pc = FX.center($('#b-psprite'));
    this.p.hp -= dmg;
    if (kind === 'poison' || kind === 'shock' || kind === 'miss') {
      floatText(pc.x + 20, pc.y - 30, dmg, kind === 'poison' ? 'dmg poison' : 'dmg shock');
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

  // ボスラッシュ・今週の チャレンジの 終わり (ふつうの 結果画面は つかわず、この 画面の 上に 出す)
  challengeFinish(won) {
    this.leave(); this.state = 'chend';
    const secs = Math.max(1, this.elapsed / 1000);
    const acc = this.correct + this.miss ? this.correct / (this.correct + this.miss) : 0;
    // 経験値は タイピングの ぶんだけ (勝利ボーナスなし)
    const exp = Math.round(typingExp(this.correct, this.miss, secs, 0.3, this.ch.L));
    grantExp(this.ch.id, exp);
    Save.data.totals.keys += this.correct;
    if (won) { Save.data.totals.wins++; dexWin(this.ed.id, secs); }
    const bd = this.bd;
    let html;
    if (this.rush) {
      const r = { ...this.rush, n: this.rush.n + (won ? 1 : 0), secs: this.rush.secs + secs, correct: this.rush.correct + this.correct, miss: this.rush.miss + this.miss, exp: (this.rush.exp || 0) + exp };
      if (won && r.i + 1 < RUSH_LIST.length) {
        // 次の ボスへ (HP を 持ちこす)
        r.i++; r.hpFrac = Math.max(0, this.p.hp / this.p.max);
        this.nextRush = r;
        this.state = 'between';
        const ne = ENEMIES[RUSH_LIST[r.i]];
        Save.save();
        this.overlay(`<div class="ov-box"><div class="ov-challenge">👑 ボスラッシュ ${r.n} / ${RUSH_LIST.length}体</div>
          <div class="ov-title">${this.ed.name}を倒した！</div>
          <div class="ov-sub">次の相手: <b>${ne.name}</b>（Lv.${ne.lv}）　HP ${Math.round(r.hpFrac * 100)}% → ${Math.round(Math.min(1, r.hpFrac + RUSH_HEAL) * 100)}%</div>
          <div class="ov-key"><kbd>Space</kbd>で次へ</div></div>`);
        return;
      }
      // おわり: 倒した ボスの 数で コイン、記録を 残す
      const all = r.n >= RUSH_LIST.length;
      const coins = grantCoins(Math.round(RUSH_LIST.slice(0, r.n).reduce((t, i, j) => t + 80 + j * 25, 0) * bd.reward));
      const rec = Save.data.rush = Save.data.rush || {};
      const prev = rec[this.dk];
      const better = !prev || r.n > prev.n || (r.n === prev.n && all && r.secs < prev.secs);
      if (better) rec[this.dk] = { n: r.n, secs: Math.round(r.secs), at: Date.now() };
      const racc = r.correct + r.miss ? r.correct / (r.correct + r.miss) : 0;
      html = `<div class="ov-box"><div class="ov-challenge">👑 ボスラッシュ（${bd.name}）</div>
        <div class="ov-title">${all ? '全部のボスを倒した！' : `${r.n}体のボスを倒した`}</div>
        <div class="ov-sub">${all ? `タイム ${fmtHMS(Math.round(r.secs))}・` : ''}正確率 ${(racc * 100).toFixed(1)}%　🪙 +${coins}　EXP +${r.exp}${better ? '<br><b class="ch-new">最高記録！</b>' : ''}</div>
        <div class="ov-key"><kbd>Space</kbd>でチャレンジへ</div></div>`;
    } else {
      const wk = weeklyInfo();
      const rule = WEEKLY_RULES.find(x => x.id === this.rule);
      const first = won && this.arg.week === wk.week && !wk.cleared;
      let rw = '';
      if (won) {
        const rec = Save.data.weekly = Save.data.weekly && Save.data.weekly.week === this.arg.week ? Save.data.weekly : { week: this.arg.week };
        if (!rec.cleared) { rec.cleared = true; Save.data.weeklyClears = (Save.data.weeklyClears || 0) + 1; }
      }
      if (first) { grantCoins(WEEKLY_REWARD.coins); gachaData().shards += WEEKLY_REWARD.shards; rw = `<br>🎁 今週のごほうび: 🪙 ${WEEKLY_REWARD.coins}・💎 ${WEEKLY_REWARD.shards}`; }
      html = `<div class="ov-box"><div class="ov-challenge">${rule.icon} 今週のチャレンジ「${rule.name}」</div>
        <div class="ov-title">${won ? `${this.ed.name}を倒した！` : `${this.ch.name}は倒れてしまった…`}</div>
        <div class="ov-sub">正確率 ${(acc * 100).toFixed(1)}%・${Math.round(this.correct / (secs / 60))}打鍵/分　EXP +${exp}${rw}</div>
        <div class="ov-key"><kbd>R</kbd>でもう一度　<kbd>Space</kbd>でチャレンジへ</div></div>`;
    }
    Save.save();
    this.overlay(html);
  },
  betweenNext() {
    const r = this.nextRush;
    if (!r) return;
    this.nextRush = null;
    SFX.select();
    this.enter({ idx: RUSH_LIST[r.i], rush: r });
  },

  finish(won) {
    if (this.rush || this.rule) { this.challengeFinish(won); return; }
    const secs = Math.max(1, this.elapsed / 1000);
    // 格下をたおしたときは 経験値がへる (レベル差の補正)
    const gap = levelGapMult(this.ed.lv, this.ch.L);
    const rw = this.bd.reward; // 難易度が 高いほど コインが ふえる (経験値は どの 難易度でも おなじ)
    const typing = Math.round(typingExp(this.correct, this.miss, secs, 0.3, this.ch.L) * gap);
    const bonus = won ? Math.floor(stageExp(this.idx) * gap) : 0;
    const acc0 = this.correct + this.miss ? this.correct / (this.correct + this.miss) : 0;
    const hpLeft0 = Math.max(0, this.p.hp / this.p.max);
    let stars = 0, prevStars = 0;
    if (won) {
      Save.data.bbest = Save.data.bbest || {};
      Save.data.bbest[this.idx] = Math.max(stageBest(this.idx), BATTLE_DIFF_KEYS.indexOf(this.dk) + 1);
      // ★評価 (メインの ステージだけ)
      if (!this.ed.hidden) {
        stars = starsFor(this.dk, acc0, hpLeft0); prevStars = stageStars(this.idx);
        if (stars > prevStars) (Save.data.stars = Save.data.stars || {})[this.idx] = stars;
      }
    }
    const firstClear = won && !this.ed.hidden && this.idx === Save.data.cleared;
    if (firstClear) Save.data.cleared = Math.min(MAIN_STAGES, this.idx + 1);
    // ノーミスで 勝った ステージ (かくしステージの 道の 条件) / かくしステージを たおした
    if (won && this.miss === 0) (Save.data.nomiss = Save.data.nomiss || {})[this.idx] = 1;
    // かくしステージを はじめて たおすと ごほうび (コインと かけら)
    const hdef = this.ed.hidden ? hiddenOf(this.idx) : null;
    const hiddenReward = won && hdef && hdef.reward && !hiddenCleared(hdef) ? hdef.reward : null;
    if (won && this.ed.hidden) (Save.data.hiddenClear = Save.data.hiddenClear || {})[this.ed.id] = Date.now();
    if (hiddenReward) { gachaData().shards += hiddenReward.shards; setTimeout(() => toast(`🎁 隠しステージのごほうび: 🪙 ${hiddenReward.coins}・💎 ${hiddenReward.shards}`, 3200), 1200); }
    if (won) { Save.data.totals.wins++; dexWin(this.ed.id, secs); } // ずかん: たおした
    Save.data.totals.keys += this.correct;
    const expRes = grantExp(this.ch.id, typing + bonus);
    // コイン: 勝つと もらえる (格下では へる)。はじめて たおすと ボーナス
    const coinGap = Math.min(1.2, gap);
    const winCoins = Math.round((won ? (30 + this.idx * 2) * coinGap : this.correct / 15 * Math.min(1, gap)) * rw * (1 + (this.ch.trait.coinBonus || 0))); // ゴルりんは コインが ふえる
    const firstCoins = firstClear ? (this.ed.boss ? 200 : 50) : hiddenReward ? hiddenReward.coins : 0;
    const coins = grantCoins(winCoins + firstCoins);
    const acc = this.correct + this.miss ? this.correct / (this.correct + this.miss) : 0;
    App.show('result', {
      mode: 'battle', won, enemyIdx: this.idx, firstClear, stars, prevStars,
      hpLeft: Math.max(0, this.p.hp / this.p.max), playerLv: this.ch.L, enemyLv: this.ed.lv,
      correct: this.correct, miss: this.miss, acc,
      kpm: Math.round(this.correct / (secs / 60)), secs: Math.round(secs), kps: this.correct / secs, bestKps: this.bestKps,
      maxCombo: this.maxCombo, words: this.words, missMap: this.missMap, expRes,
      bdiff: this.dk, coins, coinNote: `${won ? `勝利 ${winCoins}` : `打鍵 ${winCoins}`}${rw > 1 ? ` (${this.bd.name} ×${rw})` : ''}${firstCoins ? ` + ${hiddenReward ? '隠しステージのごほうび' : '初めて倒した'} ${firstCoins}` : ''}${gap < 1 ? '・格下なので減った' : ''}`,
      expBreakdown: [`タイピング ${typing}`, won ? `勝利ボーナス ${bonus}（Lv.${this.ed.lv}から次のステージのレベルまでの6割）` : '勝利ボーナスなし',
        `レベル差の補正 ×${gap.toFixed(2)}（敵Lv.${this.ed.lv} / 自分Lv.${this.ch.L}${gap < 1 ? '・格下なので減った' : gap > 1 ? '・格上なので増えた' : ''}）`],
    });
  },
};
