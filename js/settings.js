// ============================================================
//  設定画面 (どの画面からでも 開ける 小さな 窓)
//  開き方: 0 キー (タイトル・ホーム・マップ など) / ホームの ⚙️ ボタン /
//         バトル・サバイバル・練習の 最中は Esc (ゲームが 止まり、下に「再開」「やめる」が 出る)
//  W/S で 項目を えらび、A/D で 変える。Esc で 閉じる (ポーズ中なら 再開)
// ============================================================

// 0 キーで 開ける 画面 (タイピング中の 画面は のぞく。そこでは ポーズ中に S)
const SETTINGS_KEY_SCREENS = ['title', 'home', 'select', 'psetup', 'stages', 'dex', 'ach', 'doors', 'gacha', 'wardrobe', 'result', 'growth', 'challenge'];

const SETTING_ROWS = [
  { id: 'volume', label: '🔊 マスター音量', kind: 'vol', note: 'すべての音の大きさ' },
  { id: 'seVol', label: '🎵 効果音', kind: 'vol', note: '攻撃・必殺・ガチャなどの音' },
  { id: 'keyVol', label: '⌨️ 打鍵音', kind: 'vol', note: 'キーを打ったときの音' },
  { id: 'sound', label: '🔈 音', kind: 'bool', on: 'ON', off: 'OFF' },
  { id: 'lang', label: '🌐 お題の言語', kind: 'pick', options: [['ja', '日本語'], ['en', 'English']] },
  { id: 'lite', label: '✨ エフェクト', kind: 'bool', on: '控えめ', off: '普通', note: 'パソコンが熱くなるときは「控えめ」' },
  { id: 'shake', label: '📳 画面の揺れ', kind: 'bool', on: 'あり', off: 'なし' },
  { id: 'kps', label: '⏱️ 打/秒の表示', kind: 'bool', on: 'あり', off: 'なし', note: 'お題を打ち終わったときの速さ' },
  { id: 'kb', label: '🎹 練習のキーボード', kind: 'bool', on: 'あり', off: 'なし', note: '練習の画面の下のキーボード' },
  // セーブの 書き出し・読み込み (ポーズ中は 出さない)
  { id: 'export', label: '💾 セーブを保存', kind: 'action', btn: 'ファイルに保存', note: 'パソコンを変える前や、新しい版にする前に', noPause: true, fn: () => exportSave() },
  { id: 'import', label: '📂 セーブを読み込む', kind: 'action', btn: 'ファイルを選ぶ', note: '保存したファイルから続きを遊ぶ（今のセーブは上書き）', noPause: true, fn: () => importSave() },
];

const Settings = {
  isOpen: false,
  sel: 0,

  // 今 出す 項目 (ポーズ中は セーブの 項目を のぞく)
  rows() { return SETTING_ROWS.filter(r => !(r.noPause && this.opts && this.opts.onClose)); },

  // opts.title: 上の 見出し / opts.quit: { label, fn } やめる ボタン / opts.onClose: 閉じたあと (再開など)
  open(opts = {}) {
    if (this.isOpen) return;
    this.isOpen = true;
    this.opts = opts;
    this.sel = 0;
    let el = $('#settings');
    if (!el) {
      el = document.createElement('div');
      el.id = 'settings';
      el.className = 'settings-modal';
      document.body.appendChild(el);
      el.addEventListener('click', e => { if (e.target === el) this.close(); });
    }
    el.classList.add('show');
    SFX.select();
    this.render();
  },

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    $('#settings').classList.remove('show');
    SFX.select();
    const after = this.opts && this.opts.onClose;
    this.opts = null;
    if (after) after();
    if (App.current === 'home' && Screens.home.render) Screens.home.render(); // 言語の きろく 表示など
  },

  // 設定を 変えて すぐ 反映する
  set(id, v) {
    const s = Save.data.settings;
    s[id] = v;
    Save.save();
    applySettings();
    if (id === 'lite' && FX.resize) FX.resize(); // 光の 細かさを 変える
  },

  // A/D で 1 だん 変える
  step(row, d) {
    const s = Save.data.settings;
    if (row.kind === 'vol') this.set(row.id, Math.round(Math.max(0, Math.min(1, (s[row.id] ?? 1) + d * 0.05)) * 100) / 100);
    else if (row.kind === 'bool') this.set(row.id, d > 0); // 左 (A) が「なし」側、右 (D) が「あり」側
    else if (row.kind === 'action') return;
    else if (row.kind === 'pick') {
      const i = row.options.findIndex(([k]) => k === s[row.id]);
      this.set(row.id, row.options[(i + d + row.options.length) % row.options.length][0]);
    }
    if (row.id !== 'sound') SFX.key(); // 音量の ためしに 鳴らす
    this.render();
  },

  render() {
    const s = Save.data.settings;
    const list = this.rows();
    const rows = list.map((row, i) => {
      let ctrl = '';
      if (row.kind === 'action') ctrl = `<button class="st-opt st-act" data-i="${i}">${row.btn}</button>`;
      if (row.kind === 'vol') {
        const v = Math.round((s[row.id] ?? 1) * 100);
        ctrl = `<button class="st-btn" data-i="${i}" data-d="-1">◀</button>
          <input type="range" min="0" max="100" step="5" value="${v}" data-i="${i}" class="st-range">
          <b class="st-num">${v}%</b>
          <button class="st-btn" data-i="${i}" data-d="1">▶</button>`;
      } else if (row.kind === 'bool') {
        ctrl = [[false, row.off], [true, row.on]].map(([val, name]) =>
          `<button class="st-opt ${rowValue(row) === val ? 'on' : ''}" data-i="${i}" data-v="${val}">${name}</button>`).join('');
      } else if (row.kind === 'pick') {
        ctrl = row.options.map(([k, name]) => `<button class="st-opt ${s[row.id] === k ? 'on' : ''}" data-i="${i}" data-v="${k}">${name}</button>`).join('');
      }
      return `<div class="st-row ${i === this.sel ? 'sel' : ''}" data-i="${i}">
        <div class="st-label">${row.label}${row.note ? `<small>${row.note}</small>` : ''}</div>
        <div class="st-ctrl">${ctrl}</div></div>`;
    }).join('');
    const el = $('#settings');
    const o = this.opts || {};
    el.innerHTML = `<div class="st-box">
      <div class="st-title">${o.title ? `⏸️ ${o.title}` : '⚙️ 設定'}</div>
      <div class="st-rows">${rows}</div>
      <div class="st-help"><kbd>W</kbd><kbd>S</kbd> 選ぶ　<kbd>A</kbd><kbd>D</kbd> 変える　<kbd>Esc</kbd> ${o.onClose ? '再開' : '閉じる'}${o.quit ? `　<kbd>Enter</kbd> ${o.quit.label}` : ''}</div>
      <div class="set-actions">
        <button class="btn ${o.onClose ? 'big' : 'ghost'} st-close">${o.onClose ? '▶ 再開' : '閉じる'} <kbd>Esc</kbd></button>
        ${o.quit ? `<button class="btn ghost st-quit">${o.quit.label} <kbd>Enter</kbd></button>` : ''}</div></div>`;
    const selRow = el.querySelector('.st-row.sel');
    if (selRow) selRow.scrollIntoView({ block: 'nearest' }); // 下の 項目を えらんだら 見える ところまで 動かす
    el.querySelector('.st-close').onclick = () => this.close();
    if (o.quit) el.querySelector('.st-quit').onclick = () => this.quit();
    el.querySelectorAll('.st-row').forEach(r => { r.onmouseenter = () => { this.sel = +r.dataset.i; el.querySelectorAll('.st-row').forEach(x => x.classList.toggle('sel', x === r)); }; });
    el.querySelectorAll('.st-btn').forEach(b => { b.onclick = () => this.step(list[+b.dataset.i], +b.dataset.d); });
    el.querySelectorAll('.st-act').forEach(b => { b.onclick = () => { SFX.select(); list[+b.dataset.i].fn(); }; });
    el.querySelectorAll('.st-range').forEach(r => {
      r.oninput = () => { this.set(list[+r.dataset.i].id, r.value / 100); r.nextElementSibling.textContent = r.value + '%'; };
      r.onchange = () => SFX.key();
    });
    el.querySelectorAll('.st-opt:not(.st-act)').forEach(b => {
      b.onclick = () => {
        const row = list[+b.dataset.i];
        this.set(row.id, row.kind === 'bool' ? b.dataset.v === 'true' : b.dataset.v);
        SFX.select();
        this.render();
      };
    });
  },

  onKey(e) {
    const k = e.key.toLowerCase();
    e.preventDefault();
    if (e.key === 'Escape' || (e.key === '0' && !(this.opts && this.opts.onClose))) { this.close(); return; }
    if (e.key === 'Enter' && this.opts && this.opts.quit) { this.quit(); return; }
    const list = this.rows();
    if (k === 'w') { this.sel = (this.sel + list.length - 1) % list.length; SFX.select(); this.render(); }
    if (k === 's') { this.sel = (this.sel + 1) % list.length; SFX.select(); this.render(); }
    if (k === 'a') this.step(list[this.sel], -1);
    if (k === 'd') this.step(list[this.sel], 1);
    if (e.key === ' ' || (e.key === 'Enter' && !(this.opts && this.opts.quit))) {
      const row = list[this.sel];
      if (row.kind === 'action') { SFX.select(); row.fn(); }
      else if (row.kind === 'bool') { this.set(row.id, !rowValue(row)); SFX.select(); this.render(); }
      else this.step(row, 1);
    }
  },
};

// ポーズ中の「やめる」 (再開は しない)
Settings.quit = function () {
  const q = this.opts && this.opts.quit;
  this.opts = null; // onClose (再開) は よばない
  this.isOpen = false;
  $('#settings').classList.remove('show');
  SFX.select();
  if (q) q.fn();
};

// 「あり / なし」の いまの 値 (まだ 保存されて いない ものは あり あつかい。控えめ と 音は 保存された 値)
function rowValue(row) {
  const v = Save.data.settings[row.id];
  if (row.id === 'lite') return !!v;
  return v !== false;
}

// 設定を ゲームに 反映する (起動時と 変えたとき)
function applySettings() {
  const s = Save.data.settings;
  SFX.enabled = s.sound !== false;
  if (new URLSearchParams(location.search).has('mute')) SFX.enabled = false; // 動作確認用
  SFX.setVolume(s.volume ?? 0.8);
  SFX.seVol = s.seVol ?? 1;
  SFX.keyVol = s.keyVol ?? 1;
  document.body.classList.toggle('lite', !!s.lite);
  document.body.classList.toggle('no-kb', s.kb === false);
}

// ---- セーブの 書き出し・読み込み ----
// ブラウザの 中にしか ない セーブを ファイルに して、パソコンや ブラウザを 変えても 続きを 遊べるように する
function exportSave() {
  Save.save();
  const d = new Date(), pad = n => String(n).padStart(2, '0');
  const name = `slimetype-save-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.json`;
  const blob = new Blob([JSON.stringify({ app: 'slimetype', at: d.toISOString(), save: Save.data })], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  settingsToast(`「${name}」を保存しました`);
}

function importSave() {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = '.json,application/json';
  inp.onchange = () => {
    const f = inp.files && inp.files[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      let obj = null;
      try { obj = JSON.parse(rd.result); } catch (e) { /* 下で はじく */ }
      const data = obj && obj.app === 'slimetype' ? obj.save : obj;
      if (!data || typeof data !== 'object' || !data.chars || !data.settings) { settingsToast('このファイルはスライムタイピングのセーブではありません'); return; }
      const when = obj.at ? `（${new Date(obj.at).toLocaleString('ja-JP')} に保存）` : '';
      if (!confirm(`セーブを読み込みます${when}。\n今のセーブは上書きされます。よろしいですか？`)) return;
      try { localStorage.setItem(Save.KEY, JSON.stringify(data)); } catch (e) { settingsToast('読み込めませんでした'); return; }
      Save.locked = true;
      location.reload();
    };
    rd.readAsText(f);
  };
  inp.click();
}

// 設定画面の 下に 短い お知らせを 出す
function settingsToast(text) {
  const box = document.querySelector('#settings .st-box');
  if (!box) return;
  let t = box.querySelector('.st-toast');
  if (!t) { t = document.createElement('div'); t.className = 'st-toast'; box.appendChild(t); }
  t.textContent = text;
  clearTimeout(settingsToast.tm);
  settingsToast.tm = setTimeout(() => t.remove(), 4000);
}
