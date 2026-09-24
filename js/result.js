// ============================================================
//  結果画面 (れんしゅう・バトル共通)
// ============================================================

Screens.result = {
  enter(r) {
    this.r = r;
    this.busy = true;
    this.enterAt = performance.now();
    const ex = r.expRes;
    const ch = ex.before;
    const d = ch.def;

    let head = '';
    if (r.mode === 'practice') {
      const rank = rankFor(r.score);
      head = `<div class="res-head">
        <div class="res-title">れんしゅう けっか <small>${DIFFS[r.diff].name}</small></div>
        <div class="rank-box"><div class="rank rank-${rank.name}">${rank.name}</div><div class="rank-label">${rank.label}</div></div>
        <div class="score">スコア <b>${r.score}</b>${r.newBest ? '<span class="new">NEW RECORD!</span>' : ''}</div>
        <div class="score-note">スコア = 打鍵/分 × 正確率³</div>
      </div>`;
    } else if (r.mode === 'survival') {
      head = `<div class="res-head ${r.won ? 'won' : 'lost'}">
        <div class="res-title">${r.won ? `サバイバル クリア！ ${SV_BOSS[r.boss].name}を たおした！` : `${ch.name} は たおれてしまった…`}</div>
        <div class="res-diff" style="color:${r.diffColor}">難易度: ${r.diffName}</div>
        <div class="score">生きのこった時間 <b>${fmtTime(r.time)}</b>${r.newBest ? '<span class="new">NEW RECORD!</span>' : ''}</div>
        <div class="sv-res-weapons">${r.weapons.map(w => `<div class="sv-w" style="--wc:${SV_WEAPONS[w.id].color}">${SV_WEAPONS[w.id].icon}<small>${w.lv >= SV_MAX_LV ? 'MAX' : 'Lv' + w.lv}</small></div>`).join('')}</div>
        ${!r.won ? '<div class="tip">ヒント: 宝箱をたくさん拾って武器をそろえよう。タイピングでレベルを上げると HP と攻撃力も上がるよ</div>' : ''}
      </div>`;
    } else {
      const e = ENEMIES[r.enemyIdx];
      head = `<div class="res-head ${r.won ? 'won' : 'lost'}">
        <div class="res-title">${r.won ? `${e.name} をたおした！` : `${ch.name} はたおれてしまった…`}</div>
        <div class="res-enemy ${r.won ? '' : 'gray'}">${enemySVG(e.id)}</div>
        ${r.firstClear && r.enemyIdx + 1 < ENEMIES.length ? (ENEMIES[r.enemyIdx + 1].world !== e.world
          ? `<div class="unlock">ワールド ${e.world + 2}「${WORLDS[e.world + 1].name}」への ゲートが ひらいた！</div>`
          : `<div class="unlock">あたらしいあいて「${ENEMIES[r.enemyIdx + 1].name}」があらわれた！</div>`) : ''}
        ${r.firstClear && r.enemyIdx + 1 >= ENEMIES.length ? '<div class="unlock">まおうを たおした！ ぜんぶのワールドを クリア！ おめでとう！</div>' : ''}
        ${!r.won ? '<div class="tip">ヒント: れんしゅうでレベルを上げたり、コンボを切らさないように打つと有利だよ</div>' : ''}
      </div>`;
    }

    const misses = Object.entries(r.missMap || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const statsHtml = r.mode === 'survival' ? `<div class="res-stats">
      <div><span>じかん</span><b>${fmtTime(r.time)}</b></div>
      <div><span>たおした数</span><b>${r.kills}</b></div>
      <div><span>ジェム</span><b>${r.gems}</b></div>
    </div>` : `<div class="res-stats">
      <div><span>打鍵/分</span><b>${r.kpm}</b></div>
      <div><span>正確率</span><b>${(r.acc * 100).toFixed(1)}%</b></div>
      <div><span>正しく打った数</span><b>${r.correct}</b></div>
      <div><span>ミス</span><b>${r.miss}</b></div>
      <div><span>最大コンボ</span><b>${r.maxCombo}</b></div>
      <div><span>打ったお題</span><b>${r.words}</b></div>
    </div>
    <div class="res-weak"><span>今回ミスしたキー</span>${misses.length ? misses.map(([k, n]) => `<kbd>${k === ' ' ? '␣' : k.toUpperCase()}</kbd><small>×${n}</small>`).join('') : '<small>ノーミス！すごい！</small>'}</div>`;

    const expHtml = `<div class="res-exp panel" style="--cc:${d.colors.main}">
      <div class="re-sprite sprite bounce" id="re-sprite">${slimeSVG(ch.id, ch.stage)}</div>
      <div class="re-body">
        <div class="re-name"><span id="re-name">${ch.name}</span> <span class="re-lv">Lv.<b id="re-lv">${ch.L}</b></span></div>
        <div class="re-gain">+<b id="re-gain">0</b> EXP</div>
        <div class="expbar"><div class="exp-fill" id="re-bar"></div></div>
        <div class="re-break">${r.expBreakdown.join('　/　')}</div>
        <div class="re-up" id="re-up"></div>
      </div>
    </div>`;

    $('#result-wrap').innerHTML = head + `<div class="res-cols"><div class="panel">${statsHtml}</div>${expHtml}</div>
      <div class="bottom-bar">
        <button class="btn ghost" id="res-home">ホームへ <kbd>Esc</kbd></button>
        <button class="btn big" id="res-again">${r.mode === 'practice' ? 'もういちど' : r.mode === 'survival' ? 'もういちど' : r.won ? 'マップへ' : 'リベンジ'} <kbd>Space</kbd></button>
      </div>`;
    // しょうごう: 新しく とれたものを 知らせる
    const got = checkAchievements(r);
    if (got.length) {
      $('#result-wrap').insertAdjacentHTML('afterbegin', `<div class="ach-get">${got.map(a => `<div>🏅 しょうごう「<b>${a.name}</b>」ゲット！<small>${a.desc}</small></div>`).join('')}</div>`);
      setTimeout(() => { SFX.levelup(); FX.confetti(); }, 600);
    }
    $('#res-home').onclick = () => this.home();
    $('#res-again').onclick = () => this.again();
    this.animateExp();
  },

  // 経験値バーを 1 レベルずつ伸ばしていく
  async animateExp() {
    const ex = this.r.expRes;
    const bar = $('#re-bar');
    const setBar = (L, exp) => {
      const lo = expForLevel(L), hi = L >= MAX_LV ? lo + 1 : expForLevel(L + 1);
      bar.style.width = clamp((exp - lo) / (hi - lo) * 100, 0, 100) + '%';
    };
    bar.style.transition = 'none';
    setBar(ex.before.L, ex.before.exp);
    await sleep(500);
    bar.style.transition = '';

    // 数字のカウントアップ
    const gainEl = $('#re-gain');
    const t0 = performance.now();
    const countUp = now => {
      const k = Math.min(1, (now - t0) / 900);
      gainEl.textContent = Math.round(ex.amount * k);
      if (k < 1 && App.current === 'result') requestAnimationFrame(countUp);
    };
    requestAnimationFrame(countUp);

    let L = ex.before.L;
    while (L < ex.after.L) {
      if (App.current !== 'result') return;
      bar.style.width = '100%';
      await sleep(550);
      L++;
      this.levelUpFx(L);
      bar.style.transition = 'none';
      bar.style.width = '0%';
      void bar.offsetWidth;
      bar.style.transition = '';
      await sleep(250);
    }
    setBar(ex.after.L, ex.after.exp);

    if (ex.leveled) {
      const b = ex.before.stats, a = ex.after.stats;
      const names = { hp: 'HP', atk: 'こうげき', def: 'ぼうぎょ', spd: 'すばやさ' };
      $('#re-up').innerHTML = `<div class="up-table">${Object.keys(names).map(k =>
        `<div><span>${names[k]}</span><b>${b[k]}</b>→<b class="up">${a[k]}</b><small>+${a[k] - b[k]}</small></div>`).join('')}</div>`;
    }
    if (ex.evolved) {
      await sleep(600);
      this.evolveFx();
    }
    this.busy = false;
  },

  levelUpFx(L) {
    SFX.levelup();
    $('#re-lv').textContent = L;
    const sp = $('#re-sprite');
    const c = FX.center(sp);
    replayAnim(sp, 'jump', 600);
    FX.burst(c.x, c.y, { colors: ['#ffd23f', '#fff', this.r.expRes.before.def.colors.main], count: 36, shape: 'star', size: 7, speed: 7 });
    FX.ring(c.x, c.y, '#ffd23f', 120, 30, 6);
    floatText(c.x, c.y - 70, 'LEVEL UP!', 'levelup');
  },

  async evolveFx() {
    const ex = this.r.expRes;
    const sp = $('#re-sprite');
    const c = FX.center(sp);
    sp.classList.add('evolving');
    SFX.charge();
    await sleep(1400);
    sp.classList.remove('evolving');
    sp.innerHTML = slimeSVG(ex.after.id, ex.after.stage);
    $('#re-name').textContent = ex.after.name;
    replayAnim(document.body, 'flash-white', 400);
    SFX.win();
    FX.burst(c.x, c.y, { colors: ['#fff', '#ffd23f', ex.after.def.colors.accent], count: 80, shape: 'star', size: 8, speed: 10 });
    FX.confetti();
    cutin(`${ex.after.name} に進化！`, `${ex.before.name} のようすが…？`, ex.after.def.colors.main, slimeSVG(ex.after.id, ex.after.stage));
    // とくせい・ひっさつの パワーアップを知らせる
    $('#re-up').insertAdjacentHTML('beforeend', `<div class="evo-up">
      <div><b>とくせい</b> ${ex.before.trait.name} → <em>${ex.after.trait.name}</em><small>${ex.after.trait.desc}</small></div>
      <div><b>ひっさつ</b> ${ex.before.skill.name} → <em>${ex.after.skill.name}</em><small>${ex.after.skill.desc}</small></div></div>`);
  },

  again() {
    const r = this.r;
    if (r.mode === 'practice') App.show('practice');
    else if (r.mode === 'survival') App.show('survival');
    else if (r.won) App.show('stages', { justCleared: r.firstClear ? r.enemyIdx : null });
    else App.show('battle', r.enemyIdx);
  },

  home() { App.show('home'); },

  onKey(e) {
    // 打ち終わった直後の押しまちがいで先に進まないよう、少し待つ
    if (performance.now() - this.enterAt < 900) return;
    if (e.key === ' ' || e.key === 'Enter') this.again();
    if (e.key === 'Escape') this.home();
  },
};
