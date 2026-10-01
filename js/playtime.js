// ============================================================
//  プレイ時間
//  ・画面が 見えている 時間 = プレイ時間 / ほかの タブや アプリに かえて 見えていない 時間 = 裏画面
//  ・毎フレーム 数えるのではなく「見えた・かくれた・画面を かえた」ときの 時刻の 差を 足すだけ (かるい)
//  ・30 秒に 1 回 セーブに 書く
//  ・プレイ時間を 記録する 前の セーブは、正しく 打った キーの 数から おおよその 時間を 出す (推定)
// ============================================================

const PT_MODES = {
  practice: '練習', psetup: '練習',
  battle: 'バトル', stages: 'バトル',
  survival: 'サバイバル',
  gacha: 'ガチャ・着せ替え', wardrobe: 'ガチャ・着せ替え',
};
const PT_SAVE_MS = 30000;
const PT_MAX_STEP = 60; // 見えている ときに 60 秒 以上 あいたら (パソコンの スリープ など) 数えない

const PlayTime = {
  last: 0,
  visible: true,

  data() {
    const t = Save.data.playtime = Save.data.playtime || { play: 0, bg: 0, modes: {}, est: 0 };
    t.modes = t.modes || {};
    return t;
  },

  init(estimateOld) {
    const t = this.data();
    // プレイ時間を 記録する 前の セーブ: 1 分 200 打鍵 として、メニューや マップの 時間も ふくめて 1.6 倍
    if (estimateOld) t.est = Math.round((Save.data.totals.keys || 0) / 200 * 60 * 1.6);
    this.visible = document.visibilityState !== 'hidden';
    this.last = performance.now();
    document.addEventListener('visibilitychange', () => {
      this.flush();
      this.visible = document.visibilityState !== 'hidden';
      Save.save();
    });
    addEventListener('pagehide', () => { this.flush(); Save.save(); });
    setInterval(() => { this.flush(); Save.save(); }, PT_SAVE_MS);
  },

  // 前に 数えた ときから の 時間を 足す (画面を かえる 前にも よぶ)
  flush() {
    if (!Save.data) return;
    const now = performance.now();
    const dt = (now - this.last) / 1000;
    this.last = now;
    if (!(dt > 0)) return;
    const t = this.data();
    if (this.visible) {
      if (dt > PT_MAX_STEP) return;
      t.play += dt;
      const m = PT_MODES[App.current] || 'その他';
      t.modes[m] = (t.modes[m] || 0) + dt;
    } else {
      t.bg += dt;
    }
  },

  // 推定を ふくめた プレイ時間 (秒)
  total() { const t = this.data(); return t.play + (t.est || 0); },
};

// 1:23:45 のような 表示
function fmtHMS(sec) {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, s = sec % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// くわしい 内わけ (しょうごうの 画面で 出す)
function playTimeHtml() {
  PlayTime.flush();
  const t = PlayTime.data();
  const modes = Object.entries(t.modes).sort((a, b) => b[1] - a[1]);
  return `<div class="pt-box">
    <div class="pt-main"><span>🎮 プレイ時間</span><b>${fmtHMS(PlayTime.total())}</b></div>
    <div class="pt-row"><span>🌙 裏画面（他のタブやアプリ）</span><b>${fmtHMS(t.bg)}</b></div>
    ${t.est ? `<div class="pt-row"><span>📜 記録する前の分（打ったキーの数からの推定）</span><b>約${fmtHMS(t.est)}</b></div>` : ''}
    <div class="pt-modes">${modes.map(([m, s]) => `<div><span>${m}</span><b>${fmtHMS(s)}</b></div>`).join('')}</div>
  </div>`;
}
