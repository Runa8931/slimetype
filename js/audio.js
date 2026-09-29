// ============================================================
//  効果音 (音声ファイルを使わず、ブラウザの音源機能で合成する)
// ============================================================

const SFX = {
  ctx: null,
  enabled: true,
  volume: 0.8,   // 全体の音量 (0〜1)
  master: null,  // すべての音が通る「音量つまみ」

  ensure() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.volume;
        this.master.connect(this.ctx.destination);
      } catch (e) { this.enabled = false; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },

  tone(freq, dur, { type = 'square', vol = 0.05, slide = null, delay = 0 } = {}) {
    if (!this.enabled || !this.ensure()) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t); o.stop(t + dur + 0.02);
  },

  // type: 'lowpass' (こもった 音) / 'bandpass' (風のような 音) / 'highpass' (シャリシャリした 音)。sweep で 音の 高さが うごく
  noise(dur, { vol = 0.08, delay = 0, filter = 1200, type = 'lowpass', sweep = null, q = 1 } = {}) {
    if (!this.enabled || !this.ensure()) return;
    const t = this.ctx.currentTime + delay;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(filter, t);
    if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + dur);
    const g = this.ctx.createGain();
    g.gain.value = vol;
    src.connect(f).connect(g).connect(this.master);
    src.start(t);
  },

  // 音量を変える (0〜1)
  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master) this.master.gain.value = this.volume;
  },

  key() { this.tone(1200 + Math.random() * 200, 0.03, { type: 'triangle', vol: 0.04 }); },
  miss() { this.tone(160, 0.14, { type: 'sawtooth', vol: 0.05, slide: 90 }); },
  word() { this.tone(880, 0.06, { vol: 0.04 }); this.tone(1320, 0.08, { vol: 0.04, delay: 0.05 }); },
  hit() { this.noise(0.15, { vol: 0.12, filter: 1800 }); this.tone(220, 0.12, { vol: 0.05, slide: 80 }); },
  crit() { this.noise(0.18, { vol: 0.05, filter: 2400 }); this.tone(660, 0.16, { vol: 0.03, slide: 1320 }); },
  hurt() { this.noise(0.2, { vol: 0.14, filter: 700 }); this.tone(140, 0.2, { type: 'sawtooth', vol: 0.05, slide: 60 }); },
  heal() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.18, { type: 'sine', vol: 0.06, delay: i * 0.07 })); },
  thunder() { this.noise(0.5, { vol: 0.08, filter: 3000 }); this.tone(90, 0.4, { type: 'sawtooth', vol: 0.03, slide: 40 }); },
  guard() { this.tone(300, 0.1, { vol: 0.06 }); this.tone(600, 0.2, { type: 'triangle', vol: 0.06, delay: 0.05 }); },
  charge() { this.tone(400, 0.25, { type: 'sine', vol: 0.05, slide: 1200 }); },
  levelup() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tone(f, 0.16, { vol: 0.05, delay: i * 0.09 })); },
  win() { [392, 523, 659, 784, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.2, { vol: 0.05, delay: i * 0.11 })); },
  lose() { [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.3, { type: 'triangle', vol: 0.06, delay: i * 0.2 })); },
  count() { this.tone(660, 0.1, { vol: 0.05 }); },
  go() { this.tone(1320, 0.25, { vol: 0.05 }); },
  // ---- キャラの ひっさつを 出したとき (カットインと いっしょ) ----
  skill(id) {
    const T = (f, d, o) => this.tone(f, d, o), N = (d, o) => this.noise(d, o);
    switch (id) {
      case 'purun': [0, 0.07, 0.14].forEach((d, i) => T(500 + i * 250, 0.1, { type: 'sine', vol: 0.04, slide: 1400, delay: d })); N(0.35, { vol: 0.04, filter: 700, type: 'bandpass', sweep: 2600, q: 2 }); break;
      case 'piriri': N(0.35, { vol: 0.04, filter: 5000, type: 'highpass' }); T(180, 0.35, { type: 'sawtooth', vol: 0.02, slide: 1500 }); break;
      case 'gotsun': T(70, 0.5, { type: 'triangle', vol: 0.06, slide: 45 }); N(0.45, { vol: 0.05, filter: 300 }); break;
      case 'homura': N(0.6, { vol: 0.06, filter: 300, type: 'bandpass', sweep: 3200, q: 1.5 }); T(110, 0.5, { type: 'sawtooth', vol: 0.02, slide: 230 }); break;
      case 'moririn': N(0.5, { vol: 0.035, filter: 3000, type: 'bandpass', sweep: 1500, q: 3 }); [784, 988, 1175].forEach((f, i) => T(f, 0.25, { type: 'sine', vol: 0.03, delay: 0.1 + i * 0.07 })); break;
      case 'kagemaru': T(700, 0.45, { type: 'sine', vol: 0.035, slide: 110 }); T(350, 0.45, { type: 'triangle', vol: 0.025, slide: 60, delay: 0.05 }); N(0.3, { vol: 0.03, filter: 600 }); break;
      case 'ryumaru': T(90, 0.7, { type: 'sawtooth', vol: 0.04, slide: 170 }); T(140, 0.6, { type: 'sawtooth', vol: 0.025, slide: 70, delay: 0.1 }); N(0.6, { vol: 0.04, filter: 700 }); break;
      case 'kirari': [1319, 1568, 1976, 2637].forEach((f, i) => T(f, 0.28, { type: 'sine', vol: 0.03, delay: i * 0.06 })); break;
      case 'koorin': N(0.4, { vol: 0.035, filter: 6000, type: 'highpass' }); T(1600, 0.5, { type: 'sine', vol: 0.025, slide: 800 }); [2093, 2637, 3136].forEach((f, i) => T(f, 0.12, { type: 'sine', vol: 0.02, delay: 0.1 + i * 0.05 })); break;
      case 'fuwari': N(0.7, { vol: 0.055, filter: 400, type: 'bandpass', sweep: 2600, q: 2 }); break;
      case 'onpuru': [523, 659, 784, 1047, 784, 1047].forEach((f, i) => T(f, 0.12, { type: 'triangle', vol: 0.035, delay: i * 0.07 })); break;
      case 'pitarin': T(1760, 0.8, { type: 'sine', vol: 0.03 }); T(2637, 0.6, { type: 'sine', vol: 0.02, delay: 0.1 }); N(0.5, { vol: 0.025, filter: 6000, type: 'highpass' }); break;
      case 'dororin': N(0.6, { vol: 0.05, filter: 500, type: 'bandpass', sweep: 200, q: 3 }); [300, 250, 200].forEach((f, i) => T(f, 0.15, { type: 'sine', vol: 0.03, slide: f * 1.6, delay: i * 0.1 })); break;
      case 'gorurin': [1319, 1568, 1319, 2093].forEach((f, i) => T(f, 0.12, { type: 'square', vol: 0.02, delay: i * 0.06 })); N(0.2, { vol: 0.03, filter: 6000, type: 'highpass', delay: 0.2 }); break;
      case 'yukidarun': T(900, 0.4, { type: 'sine', vol: 0.03, slide: 1400 }); N(0.4, { vol: 0.03, filter: 5000, type: 'highpass' }); break;
      case 'fuerin': [0, 0.06, 0.12, 0.18, 0.24].forEach((d, i) => T(600 + i * 180, 0.08, { type: 'sine', vol: 0.035, slide: 900 + i * 200, delay: d })); N(0.3, { vol: 0.03, filter: 900, type: 'bandpass', sweep: 2400, q: 2 }); break;
      case 'yuusharin': [523, 659, 784, 1047].forEach((f, i) => T(f, 0.2, { type: 'square', vol: 0.025, delay: i * 0.08 })); T(1047, 0.5, { type: 'triangle', vol: 0.03, delay: 0.32 }); break;
      case 'metarun': T(420, 0.6, { type: 'square', vol: 0.025, slide: 400 }); T(627, 0.5, { type: 'square', vol: 0.018 }); T(1180, 0.35, { type: 'triangle', vol: 0.02 }); N(0.12, { vol: 0.05, filter: 4000 }); break;
    }
  },

  // ---- ふつうと ちがう 当たり方を したとき (ひっさつの 当たり・ブレイク中・いかり など) ----
  impact(kind) {
    const T = (f, d, o) => this.tone(f, d, o), N = (d, o) => this.noise(d, o);
    const [k, n] = String(kind).split(':');
    switch (k) {
      case 'heavy': T(60, 0.35, { type: 'sine', vol: 0.09, slide: 35 }); N(0.25, { vol: 0.08, filter: 450 }); T(180, 0.12, { type: 'square', vol: 0.025, slide: 90 }); break; // メタルン: ブレイク中の おもい 一撃
      case 'rage': T(120, 0.22, { type: 'sawtooth', vol: 0.04, slide: 60 }); N(0.2, { vol: 0.07, filter: 1200 }); break;     // りゅうまる: いかり
      case 'sparkle': T(1000 + Math.min(10, +n || 3) * 110, 0.14, { type: 'sine', vol: 0.035 }); N(0.08, { vol: 0.04, filter: 4000, type: 'highpass' }); break; // きらり: リズム
      case 'swish': N(0.14, { vol: 0.05, filter: 2500, type: 'bandpass', sweep: 7000, q: 2 }); break;                         // ふわり: おいうち
      case 'rock': T(90, 0.25, { type: 'triangle', vol: 0.06, slide: 50 }); N(0.2, { vol: 0.07, filter: 600 }); break;         // ごつん: はんげき
      case 'ice': N(0.15, { vol: 0.045, filter: 7000, type: 'highpass' }); T(2600, 0.15, { type: 'sine', vol: 0.025, slide: 1800 }); break; // こおりん: やりかえし
      case 'burn': N(0.12, { vol: 0.03, filter: 2500, type: 'bandpass', q: 2 }); break;                                        // ほむら: やけど
      // ひっさつが 当たったとき
      case 'skill-homura': N(0.35, { vol: 0.07, filter: 1500 }); T(160, 0.25, { type: 'sawtooth', vol: 0.03, slide: 80 }); break;
      case 'skill-moririn': T(110, 0.2, { type: 'triangle', vol: 0.05, slide: 70 }); N(0.3, { vol: 0.04, filter: 2500, type: 'bandpass', sweep: 1200 }); break;
      case 'skill-kagemaru': T(200, 0.3, { type: 'sine', vol: 0.05, slide: 70 }); N(0.2, { vol: 0.05, filter: 500 }); break;
      case 'skill-ryumaru': N(0.5, { vol: 0.09, filter: 900 }); T(80, 0.45, { type: 'sine', vol: 0.06, slide: 40 }); break;
      case 'skill-kirari': [1760, 2217, 2637].forEach((f, i) => T(f, 0.2, { type: 'sine', vol: 0.03, delay: i * 0.04 })); N(0.2, { vol: 0.05, filter: 5000, type: 'highpass' }); break;
      case 'skill-koorin': N(0.3, { vol: 0.06, filter: 5000, type: 'highpass' }); [3136, 2637, 2093].forEach((f, i) => T(f, 0.12, { type: 'sine', vol: 0.025, delay: i * 0.04 })); break;
      case 'skill-fuwari': N(0.25, { vol: 0.07, filter: 1800, type: 'bandpass', sweep: 7000, q: 1.5 }); break;
      case 'skill-metarun': T(55, 0.4, { type: 'sine', vol: 0.09, slide: 32 }); T(470, 0.4, { type: 'square', vol: 0.02, slide: 440 }); N(0.3, { vol: 0.08, filter: 600 }); break;
      case 'poison': N(0.1, { vol: 0.025, filter: 700, type: 'bandpass', q: 3 }); T(260, 0.08, { type: 'sine', vol: 0.02, slide: 380 }); break; // どろりん: どく
      case 'skill-dororin': N(0.4, { vol: 0.06, filter: 500, type: 'bandpass', sweep: 180, q: 2 }); T(120, 0.3, { type: 'sine', vol: 0.05, slide: 70 }); break;
      case 'skill-gorurin': [2093, 2637, 3136].forEach((f, i) => T(f, 0.1, { type: 'square', vol: 0.02, delay: i * 0.03 })); N(0.2, { vol: 0.06, filter: 3000 }); break;
      case 'skill-yukidarun': N(0.35, { vol: 0.08, filter: 1200 }); T(90, 0.3, { type: 'sine', vol: 0.06, slide: 50 }); break;
      case 'skill-fuerin': [0, 0.05, 0.1].forEach(d => { N(0.12, { vol: 0.05, filter: 1200, delay: d }); T(300, 0.1, { type: 'sine', vol: 0.04, slide: 160, delay: d }); }); break;
      case 'skill-yuusharin': N(0.2, { vol: 0.06, filter: 2500, type: 'bandpass', sweep: 8000 }); T(1568, 0.3, { type: 'triangle', vol: 0.03, slide: 784 }); break;
      case 'beat': T(220, 0.08, { type: 'square', vol: 0.035 }); T(440, 0.08, { type: 'square', vol: 0.03, delay: 0.06 }); N(0.08, { vol: 0.05, filter: 3000 }); break; // おんぷる: テンポアップ中
      case 'reflect': T(1400, 0.2, { type: 'sine', vol: 0.04, slide: 500 }); N(0.15, { vol: 0.06, filter: 2500 }); break; // ぴたりん: はね返し
      case 'skill-onpuru': [784, 1047, 1319].forEach((f, i) => T(f, 0.12, { type: 'square', vol: 0.025, delay: i * 0.04 })); N(0.2, { vol: 0.06, filter: 2000 }); break;
      case 'skill-pitarin': T(2093, 0.3, { type: 'sine', vol: 0.035, slide: 1047 }); N(0.25, { vol: 0.06, filter: 4000, type: 'highpass' }); break;
      default: this.hit();
    }
  },

  // とくべつな キャラの 登場 (ファンファーレ) と ひっさつの カットイン (キラーン)
  entrance() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.18, { type: 'triangle', vol: 0.045, delay: 0.25 + i * 0.07 })); this.noise(0.6, { vol: 0.03, filter: 5000, type: 'highpass', delay: 0.6 }); },
  rankCut() { [2093, 2637, 3136, 4186].forEach((f, i) => this.tone(f, 0.12, { type: 'sine', vol: 0.025, delay: i * 0.04 })); this.noise(0.25, { vol: 0.03, filter: 6000, type: 'highpass' }); },
  select() { this.tone(900, 0.05, { vol: 0.04 }); this.tone(1200, 0.06, { vol: 0.04, delay: 0.04 }); },
};
