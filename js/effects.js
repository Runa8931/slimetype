// ============================================================
//  エフェクト: 画面全体に重ねたキャンバスでパーティクルを描く
//  + DOM を使ったダメージ数字・画面揺れ・カットイン
// ============================================================

const FX = {
  cv: null, ctx: null, parts: [], running: false, dpr: 1,

  init() {
    this.cv = document.getElementById('fx');
    this.ctx = this.cv.getContext('2d');
    const resize = this.resize = () => {
      // 画面の細かさに上限をつける (高解像度の画面で重くならないように)
      this.dpr = Math.min(window.devicePixelRatio || 1, Save.data && Save.data.settings.lite ? 1 : 1.5);
      this.cv.width = innerWidth * this.dpr;
      this.cv.height = innerHeight * this.dpr;
    };
    resize();
    addEventListener('resize', resize);
  },

  add(p) {
    this.parts.push(p);
    if (!this.running) { this.running = true; requestAnimationFrame(() => this.loop()); }
  },

  center(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  },

  // 放射状に飛び散る粒
  burst(x, y, { colors = ['#fff'], count: countIn = 20, speed = 5, size = 4, life = 40, gravity = 0.12, shape = 'circle', text = '' } = {}) {
    const count = Save.data && Save.data.settings.lite ? Math.ceil(countIn / 2) : countIn;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.8);
      this.add({
        kind: 'dot', shape, x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - speed * 0.3,
        g: gravity, size: size * (0.6 + Math.random() * 0.8), life, max: life,
        color: colors[i % colors.length], rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, text,
      });
    }
  },

  // 広がる輪
  ring(x, y, color, maxR = 80, life = 24, width = 5) {
    this.add({ kind: 'ring', x, y, color, maxR, life, max: life, width });
  },

  // ギザギザの稲妻
  bolt(x1, y1, x2, y2, color = '#fff6a0', life = 14) {
    const pts = [];
    const n = 10;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const off = (i === 0 || i === n) ? 0 : (Math.random() - 0.5) * 50;
      pts.push({ x: x1 + (x2 - x1) * t + off, y: y1 + (y2 - y1) * t + (Math.random() - 0.5) * 10 });
    }
    this.add({ kind: 'bolt', pts, color, life, max: life });
  },

  // 飛んでいく弾 (到着したら onHit を呼ぶ)
  projectile(from, to, { color = '#fff', size = 10, frames = 22, arc = -60, trail = true, onHit, trailShape = 'circle', trailColors = null, trailText = '' } = {}) {
    this.add({ kind: 'proj', from, to, color, size, t: 0, frames, arc, trail, onHit, trailShape, trailColors, trailText, life: 1, max: 1 });
  },

  // 画面いっぱいに降る紙吹雪
  confetti() {
    const colors = ['#ff5d8f', '#ffd23f', '#4fb3ff', '#6dff8a', '#c38bff'];
    for (let i = 0; i < 120; i++) {
      this.add({
        kind: 'dot', shape: 'rect', x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.5,
        vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3, g: 0.03, size: 5 + Math.random() * 5,
        life: 180, max: 180, color: colors[i % colors.length], rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
      });
    }
  },

  loop() {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    const alive = [];
    for (const p of this.parts) {
      if (this.step(p, ctx)) alive.push(p);
    }
    this.parts = alive;
    if (this.parts.length) requestAnimationFrame(() => this.loop());
    else { this.running = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  },

  step(p, ctx) {
    const k = p.life / p.max;
    ctx.save();
    if (p.kind === 'dot') {
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life--;
      ctx.globalAlpha = Math.min(1, k * 1.5);
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      if (p.shape === 'rect') ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      else if (p.shape === 'star') this.star(ctx, p.size);
      else if (p.shape === 'heart') this.heart(ctx, p.size);
      else if (p.shape === 'petal') { ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2); ctx.fill(); }
      else if (p.shape === 'snow') {
        ctx.strokeStyle = p.color; ctx.lineWidth = Math.max(1.5, p.size / 4); ctx.lineCap = 'round';
        ctx.beginPath();
        for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; ctx.moveTo(-Math.cos(a) * p.size, -Math.sin(a) * p.size); ctx.lineTo(Math.cos(a) * p.size, Math.sin(a) * p.size); }
        ctx.stroke();
      } else if (p.shape === 'text') {
        ctx.rotate(-p.rot * 0.8);
        ctx.font = `bold ${Math.round(p.size * 2.4)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(p.text, 0, 0);
      } else { ctx.beginPath(); ctx.arc(0, 0, p.size * (0.5 + k * 0.5), 0, Math.PI * 2); ctx.fill(); }
    } else if (p.kind === 'ring') {
      p.life--;
      ctx.globalAlpha = k;
      ctx.strokeStyle = p.color; ctx.lineWidth = p.width * k + 1;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.maxR * (1 - k * k), 0, Math.PI * 2); ctx.stroke();
    } else if (p.kind === 'bolt') {
      p.life--;
      ctx.globalAlpha = k;
      for (const [w, c] of [[18, 'rgba(255,255,200,.25)'], [8, p.color], [3, '#fff']]) {
        ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineJoin = 'round';
        ctx.beginPath(); p.pts.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.stroke();
      }
    } else if (p.kind === 'proj') {
      p.t++;
      const t = p.t / p.frames;
      const x = p.from.x + (p.to.x - p.from.x) * t;
      const y = p.from.y + (p.to.y - p.from.y) * t + Math.sin(t * Math.PI) * p.arc;
      // ぼかし(shadowBlur)は重いので、うすい大きな円で光って見せる
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.arc(x, y, p.size * 1.9, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(x, y, p.size, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - p.size * 0.3, y - p.size * 0.3, p.size * 0.35, 0, Math.PI * 2); ctx.fill();
      if (p.trail && p.t % 2 === 0) {
        const tc = p.trailColors ? p.trailColors[p.t % p.trailColors.length] : p.color;
        this.parts.push({ kind: 'dot', shape: p.trailShape || 'circle', text: p.trailText, x, y, vx: (Math.random() - .5), vy: (Math.random() - .5), g: 0, size: p.trailShape && p.trailShape !== 'circle' ? p.size * 0.8 : p.size * 0.6, life: 16, max: 16, color: tc, rot: Math.random() * 6, vr: 0.1 });
      }
      if (p.t >= p.frames) { ctx.restore(); if (p.onHit) p.onHit(); return false; }
      ctx.restore();
      return true;
    }
    ctx.restore();
    return p.life > 0;
  },

  heart(ctx, r) {
    ctx.beginPath();
    ctx.moveTo(0, r * 0.9);
    ctx.bezierCurveTo(-r * 1.4, -r * 0.1, -r * 0.7, -r * 1.2, 0, -r * 0.45);
    ctx.bezierCurveTo(r * 0.7, -r * 1.2, r * 1.4, -r * 0.1, 0, r * 0.9);
    ctx.fill();
  },

  star(ctx, r) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? r * 0.45 : r;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath(); ctx.fill();
  },
};

// ------------ DOM を使うエフェクト ------------

// 数字や文字をふわっと浮かび上がらせる
function floatText(x, y, text, cls = '') {
  const el = document.createElement('div');
  el.className = 'float-text ' + cls;
  el.textContent = text;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

// CSS アニメーションをもう一度再生する
function replayAnim(el, cls, ms) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
  if (ms) setTimeout(() => el.classList.remove(cls), ms);
}

function shake(el, strong = false) { if (Save.data.settings.shake === false) return; replayAnim(el, strong ? 'shake-strong' : 'shake', 450); }

// 画面を横切る必殺技のカットイン
// rank: とくべつな キャラ ('ssr' / 'special') は 画面が 暗くなり、ふちが 光る 大きな カットインに なる
function cutin(title, sub, color, svgHtml, rank) {
  const el = document.createElement('div');
  el.className = 'cutin' + (rank ? ' cutin-rank cutin-' + rank : '');
  el.style.setProperty('--cut', color);
  const label = rank === 'ssr' ? '<div class="cutin-label">✦ SSR ✦</div>' : rank === 'special' ? '<div class="cutin-label">★ 特別 ★</div>' : '';
  el.innerHTML = `<div class="cutin-band">${rank ? '<div class="cutin-lines"></div>' : ''}<div class="cutin-sprite">${svgHtml || ''}</div>
    <div class="cutin-text">${label}<div class="cutin-sub">${sub}</div><div class="cutin-title">${title}</div></div></div>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), rank ? 1500 : 1300);
}

function toast(msg, ms = 2200) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('out'), ms);
  setTimeout(() => el.remove(), ms + 400);
}
