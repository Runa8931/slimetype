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

  noise(dur, { vol = 0.08, delay = 0, filter = 1200 } = {}) {
    if (!this.enabled || !this.ensure()) return;
    const t = this.ctx.currentTime + delay;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = filter;
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
  thunder() { this.noise(0.6, { vol: 0.25, filter: 4000 }); this.tone(90, 0.5, { type: 'sawtooth', vol: 0.06, slide: 40 }); },
  guard() { this.tone(300, 0.1, { vol: 0.06 }); this.tone(600, 0.2, { type: 'triangle', vol: 0.06, delay: 0.05 }); },
  charge() { this.tone(400, 0.25, { type: 'sine', vol: 0.05, slide: 1200 }); },
  levelup() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tone(f, 0.16, { vol: 0.05, delay: i * 0.09 })); },
  win() { [392, 523, 659, 784, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.2, { vol: 0.05, delay: i * 0.11 })); },
  lose() { [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.3, { type: 'triangle', vol: 0.06, delay: i * 0.2 })); },
  count() { this.tone(660, 0.1, { vol: 0.05 }); },
  go() { this.tone(1320, 0.25, { vol: 0.05 }); },
  select() { this.tone(900, 0.05, { vol: 0.04 }); this.tone(1200, 0.06, { vol: 0.04, delay: 0.04 }); },
};
