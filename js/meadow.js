// ---------------- タイトル・ホームの 背景: 草原と 仲間の スライム ----------------
// 空の 色は パソコンの 時刻で かわる (朝・昼・夕方・夜)。手に 入れた キャラが 丘の 上を 歩く。
// クリックすると ぴょんと はねる。「ひかえめ」でも キャラは 歩く (雲は 止める)。
const Meadow = {
  walkers: [],
  on: false,

  // 時刻 → 時間帯
  timeOfDay() {
    const h = new Date().getHours();
    return h >= 5 && h < 10 ? 'morning' : h >= 10 && h < 16 ? 'day' : h >= 16 && h < 19 ? 'evening' : 'night';
  },

  build() {
    const el = $('#meadow');
    const clouds = [0, 1, 2, 3, 4].map(i => `<div class="md-cloud c${i}"><span></span><span></span><span></span></div>`).join('');
    // 丘は 3 だん (おくほど うすく)。前の 丘に 草と 花
    const flowers = Array.from({ length: 26 }, (_, i) => {
      const x = (i * 397) % 1600 + 20, y = 318 + ((i * 53) % 60);
      const c = ['#ff8fab', '#ffd43b', '#fff', '#b197fc'][i % 4];
      return i % 3 ? `<path d="M${x},${y} q3,-10 6,0 M${x + 6},${y} q3,-12 7,0" class="md-grass"/>`
        : `<circle cx="${x}" cy="${y - 4}" r="4" fill="${c}"/><circle cx="${x}" cy="${y - 4}" r="1.6" fill="#ffd43b"/>`;
    }).join('');
    el.innerHTML = `<div class="md-sun"></div>${clouds}
      <svg class="md-hills" viewBox="0 0 1600 400" preserveAspectRatio="none">
        <path class="h3" d="M0,170 C180,110 360,120 520,160 C700,205 860,95 1060,120 C1260,145 1420,90 1600,130 L1600,400 L0,400 Z"/>
        <path class="h2" d="M0,240 C220,180 420,215 640,235 C860,255 1000,180 1220,195 C1400,207 1500,230 1600,215 L1600,400 L0,400 Z"/>
        <path class="h1" d="M0,300 C260,265 520,290 800,285 C1080,280 1320,262 1600,285 L1600,400 L0,400 Z"/>
        ${flowers}
      </svg>`;
    // 歩く キャラは パネルに かくれないよう 画面の いちばん 手前の 層に おく
    const box = document.createElement('div');
    box.className = 'md-walkers'; box.id = 'md-walkers';
    document.body.appendChild(box);
  },

  // タイトル・ホームに 入ったとき
  // walkers: キャラを 歩かせるか (タイトルだけ。ホームでは 背景だけ)
  show(walkers) {
    if (!$('#meadow').firstChild) this.build();
    document.body.classList.toggle('md-walk', !!walkers);
    const t = this.timeOfDay();
    document.body.classList.add('scene-meadow');
    document.body.classList.toggle('md-night', t === 'night');
    $('#meadow').className = 'meadow t-' + t;
    if (!walkers) { this.hideWalkers(); return; }
    this.spawn();
    if (!this.on) { this.on = true; this.last = performance.now(); this.raf = requestAnimationFrame(n => this.tick(n)); }
  },
  hide() {
    document.body.classList.remove('scene-meadow', 'md-night', 'md-walk');
    this.hideWalkers();
  },
  hideWalkers() { this.on = false; cancelAnimationFrame(this.raf); },

  // 手に 入れた キャラを 出す (多すぎると じゃまなので 8 たいまで。えらんでいる キャラは かならず 出す)
  // z = おくゆき (0 = 山の おく、1 = いちばん 手前)。おくほど 小さく、画面の 上の ほうに 見える
  spawn() {
    let ids = Object.keys(CHARACTERS).filter(hasChar);
    const act = Save.data.active;
    ids = ids.filter(id => id !== act).sort(() => Math.random() - 0.5).slice(0, act ? 7 : 8);
    if (act && hasChar(act)) ids.unshift(act);
    const box = $('#md-walkers');
    box.innerHTML = '';
    // タイトルを ひらく たびに 山の おくから 1 ぴきずつ はねてきて、それぞれの 場所で その場で はねる
    // 場所は 横に ならべ、おくゆきを 2 れつに ずらす。まっすぐ 手前に くるので 道は かさならない
    const W = innerWidth, n = ids.length;
    const order = ids.map((_, i) => i).sort(() => Math.random() - 0.5); // 出てくる じゅんばんは ばらばらに
    this.walkers = ids.map((id, i) => {
      const d = document.createElement('div');
      d.className = 'md-walker';
      d.style.setProperty('--dl', -(Math.random() * 1.2).toFixed(2) + 's'); // その場で ゆれる タイミングを ずらす
      d.innerHTML = `<div class="sprite">${slimeSVG(id, charInfo(id).stage)}</div>`;
      box.appendChild(d);
      const x = (i + 0.5) / n * W + (Math.random() - 0.5) * 0.3 * W / n;
      const w = { el: d, id, x, z: 0, tz: i % 2 ? 0.62 + Math.random() * 0.1 : 0.88 + Math.random() * 0.12,
        y: 0, vy: 0, rest: 0, delay: 0.4 + order[i] * 0.7 + Math.random() * 0.3, dir: x < W / 2 ? 1 : -1 };
      this.place(w);
      return w;
    });
  },

  scaleOf(z) { return 0.3 + 0.7 * z; },

  place(w) {
    const k = this.scaleOf(w.z);
    const ground = innerHeight * (0.205 - 0.195 * w.z); // 足もとの 高さ (下から)
    w.el.style.transform = `translate(${w.x - 32}px, ${-(ground + w.y * k)}px) scale(${k})`;
    w.el.style.zIndex = Math.round(w.z * 100);
    // 山の おくでは すうっと あらわれる
    w.el.style.opacity = w.delay > 0 ? 0 : clamp(w.z / 0.12, 0, 1);
    w.el.classList.toggle('flip', w.dir < 0);
    w.el.classList.toggle('air', w.y > 0);
  },

  tick(now) {
    if (!this.on) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    // 「ひかえめ」でも 動かす (8 たい だけなので 軽い)
    for (const w of this.walkers) {
      if (w.delay > 0) { w.delay -= dt; continue; }
      // ジャンプ中
      if (w.y > 0 || w.vy > 0) {
        w.vy -= 1100 * dt; w.y = Math.max(0, w.y + w.vy * dt);
        if (w.y === 0) { w.vy = 0; w.rest = w.z < w.tz ? 0.35 + Math.random() * 0.3 : 0.6 + Math.random() * 1.2; } // 着地したら ひと息
      }
      if (w.y === 0) {
        w.rest -= dt;
        if (w.rest <= 0) {
          // 手前へ くる あいだは ぴょんぴょん、ついたら その場で ぴょん (ときどき 高く・ときどき 向きを かえる)
          const home = w.z >= w.tz;
          w.vy = home && Math.random() < 0.2 ? 440 : 300 + Math.random() * 60;
          if (home && Math.random() < 0.3) w.dir = -w.dir;
        }
      }
      // 空中に いる あいだだけ 手前へ すすむ (おくでは すこし ゆっくり 見える)
      if (w.z < w.tz && (w.y > 0 || w.vy > 0)) w.z = Math.min(w.tz, w.z + 0.5 * (0.45 + 0.55 * this.scaleOf(w.z)) * dt);
    }
    for (const w of this.walkers) this.place(w);
    this.raf = requestAnimationFrame(n => this.tick(n));
  },

  // クリックした ところに スライムが いたら はねる (ボタンや パネルの 上は のぞく)
  poke(e) {
    if (!document.body.classList.contains('md-walk')) return;
    if (e.target.closest('button, input, label, a, summary')) return;
    for (const w of this.walkers) {
      const r = w.el.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom && w.y === 0 && w.delay <= 0) {
        w.vy = 520; SFX.key();
        replayAnim(w.el.querySelector('.sprite'), 'md-squish', 400);
      }
    }
  },
};
document.addEventListener('pointerdown', e => Meadow.poke(e));

// ---------------- タイトルの 文字を 1 文字ずつ 打つ ----------------
// キーを 打つ 音と いっしょに カナが 1 文字ずつ ぽんと 出る。うしろで カーソルが 点滅する
const TITLE_UNITS = [['ス', 'su'], ['ラ', 'ra'], ['イ', 'i'], ['ム', 'mu'], null, ['タ', 'ta'], ['イ', 'i'], ['ピ', 'pi'], ['ン', 'nn'], ['グ', 'gu']];
function typeTitle() {
  const logo = $('#logo-text');
  logo.innerHTML = TITLE_UNITS.map(u => u ? `<span class="ch">${u[0]}</span>` : '<br>').join('');
  const chars = [...logo.querySelectorAll('.ch')];
  const units = TITLE_UNITS.filter(Boolean);
  const caret = document.createElement('i');
  caret.className = 'logo-caret';
  logo.insertBefore(caret, chars[0]);
  clearTimeout(typeTitle.t);
  const scr = $('#scr-title');
  scr.classList.remove('typed');
  let u = 0, n = 0;
  const step = () => {
    if (!scr.classList.contains('active')) return;
    n++;
    SFX.key();
    if (n >= units[u][1].length) {
      chars[u].classList.add('on');
      chars[u].after(caret);
      u++; n = 0;
    }
    if (u < units.length) typeTitle.t = setTimeout(step, 90 + Math.random() * 110 + (n === 0 ? 70 : 0));
    else typeTitle.t = setTimeout(() => { scr.classList.add('typed'); }, 250);
  };
  typeTitle.t = setTimeout(step, 600);
}
