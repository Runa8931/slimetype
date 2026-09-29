// ---------------- タイトル・ホームの 背景: 草原と 仲間の スライム ----------------
// 空の 色は パソコンの 時刻で かわる (朝・昼・夕方・夜)。手に 入れた キャラが 丘の 上を 歩く。
// クリックすると ぴょんと はねる。「ひかえめ」の ときは 動かさない。
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
  show() {
    if (!$('#meadow').firstChild) this.build();
    const t = this.timeOfDay();
    document.body.classList.add('scene-meadow');
    document.body.classList.toggle('md-night', t === 'night');
    $('#meadow').className = 'meadow t-' + t;
    this.spawn();
    if (!this.on) { this.on = true; this.last = performance.now(); this.raf = requestAnimationFrame(n => this.tick(n)); }
  },
  hide() {
    document.body.classList.remove('scene-meadow', 'md-night');
    this.on = false; cancelAnimationFrame(this.raf);
  },

  // 手に 入れた キャラを 丘に ならべる (多すぎると じゃまなので 8 たいまで。えらんでいる キャラは かならず 出す)
  spawn() {
    let ids = Object.keys(CHARACTERS).filter(hasChar);
    const act = Save.data.active;
    ids = ids.filter(id => id !== act).sort(() => Math.random() - 0.5).slice(0, act ? 7 : 8);
    if (act && hasChar(act)) ids.unshift(act);
    const key = ids.slice().sort().join(',') + ids.map(id => charInfo(id).stage).join('');
    if (key === this.key) return; // 前と 同じ なら 歩いている 位置を そのまま
    this.key = key;
    const W = innerWidth;
    const box = $('#md-walkers');
    this.walkers = ids.map((id, i) => {
      const d = document.createElement('div');
      d.className = 'md-walker';
      d.innerHTML = `<div class="sprite">${slimeSVG(id, charInfo(id).stage)}</div>`;
      return { el: d, id, x: (i + 0.5) / ids.length * W + (Math.random() - 0.5) * 60, y: 0, vy: 0,
        dir: Math.random() < 0.5 ? -1 : 1, speed: 22 + Math.random() * 22, wait: Math.random() * 3,
        lane: 0.6 + (i % 3) * 1.6 }; // 足もとの 高さ (vh)。3 れつに ずらす
    });
    box.innerHTML = '';
    this.walkers.forEach(w => { box.appendChild(w.el); this.place(w); });
  },

  place(w) {
    w.el.style.transform = `translate(${w.x - 32}px, ${-w.y}px)`;
    w.el.style.bottom = w.lane + 'vh';
    w.el.classList.toggle('flip', w.dir < 0);
    w.el.classList.toggle('walking', w.wait <= 0 && w.y === 0);
  },

  tick(now) {
    if (!this.on) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (!document.body.classList.contains('lite')) {
      const W = innerWidth;
      for (const w of this.walkers) {
        // ジャンプ中
        if (w.y > 0 || w.vy > 0) {
          w.vy -= 1400 * dt; w.y = Math.max(0, w.y + w.vy * dt);
          if (w.y === 0) w.vy = 0;
        }
        if (w.wait > 0) {
          // ひとやすみ。ときどき その場で ぴょん
          w.wait -= dt;
          if (w.wait <= 0) { w.dir = Math.random() < 0.5 ? -1 : 1; w.walk = 2 + Math.random() * 5; }
          else if (w.y === 0 && Math.random() < dt * 0.25) w.vy = 300;
        } else {
          w.x += w.dir * w.speed * dt;
          w.walk -= dt;
          if (w.x < 30) { w.x = 30; w.dir = 1; }
          if (w.x > W - 30) { w.x = W - 30; w.dir = -1; }
          if (w.walk <= 0) w.wait = 1 + Math.random() * 3;
        }
        this.place(w);
      }
    }
    this.raf = requestAnimationFrame(n => this.tick(n));
  },

  // クリックした ところに スライムが いたら はねる (ボタンや パネルの 上は のぞく)
  poke(e) {
    if (!document.body.classList.contains('scene-meadow')) return;
    if (e.target.closest('button, input, label, a, summary')) return;
    for (const w of this.walkers) {
      const r = w.el.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom && w.y === 0) {
        w.vy = 520; SFX.key();
        replayAnim(w.el.querySelector('.sprite'), 'md-squish', 400);
      }
    }
  },
};
document.addEventListener('pointerdown', e => Meadow.poke(e));

// ---------------- タイトルの 文字を 1 文字ずつ 打つ ----------------
// ローマ字が 打たれていき、1 音 そろうと カナが ぽんと 出る
const TITLE_UNITS = [['ス', 'su'], ['ラ', 'ra'], ['イ', 'i'], ['ム', 'mu'], null, ['タ', 'ta'], ['イ', 'i'], ['ピ', 'pi'], ['ン', 'nn'], ['グ', 'gu']];
function typeTitle() {
  const logo = $('#logo-text'), roma = $('#logo-roma');
  logo.innerHTML = TITLE_UNITS.map(u => u ? `<span class="ch">${u[0]}</span>` : '<br>').join('');
  const chars = [...logo.querySelectorAll('.ch')];
  const units = TITLE_UNITS.filter(Boolean);
  const all = units.map(u => u[1]);
  // ガイド: まだ 打っていない ところは うすく
  const draw = (u, n) => {
    roma.innerHTML = all.map((r, k) => k < u ? `<b>${r}</b>` : k === u ? `<b>${r.slice(0, n)}</b>${r.slice(n)}` : r)
      .map((s, k) => k === 3 ? s + '&nbsp;' : s).join('') + '<i class="logo-caret"></i>';
  };
  clearTimeout(typeTitle.t);
  let u = 0, n = 0;
  draw(0, 0);
  const step = () => {
    if (!$('#scr-title').classList.contains('active')) return;
    n++;
    SFX.key();
    if (n >= units[u][1].length) {
      chars[u].classList.add('on');
      u++; n = 0;
    }
    draw(u, n);
    if (u < units.length) typeTitle.t = setTimeout(step, 90 + Math.random() * 110 + (n === 0 ? 70 : 0));
    else { roma.classList.add('done'); $('#scr-title').classList.add('typed'); }
  };
  roma.classList.remove('done');
  $('#scr-title').classList.remove('typed');
  typeTitle.t = setTimeout(step, 600);
}
