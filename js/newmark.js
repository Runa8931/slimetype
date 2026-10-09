// ============================================================
//  NEW の 印 と 称号の お知らせ
//  新しく 手に 入れた もの (称号・キャラ・着せ替えアイテム・図鑑の 敵・冒険の 扉) に「NEW」を つける。
//  一覧で その ものを 1 回 押すと 消える。ホームの ボタンにも 種類ごとに NEW を 出す
//  記録: Save.data.newMarks = { 'ach:ID': 1, 'char:ID': 1, 'item:ID': 1, 'dex:ID': 1, 'door:ID': 1 }
// ============================================================

function markNew(key) { (Save.data.newMarks = Save.data.newMarks || {})[key] = 1; }
function isNew(key) { return !!(Save.data.newMarks || {})[key]; }
// 押した ときに 消す (消したら true)
function clearNew(key) {
  if (!isNew(key)) return false;
  delete Save.data.newMarks[key];
  Save.save();
  return true;
}
function newCount(kind) { return Object.keys(Save.data.newMarks || {}).filter(k => k.startsWith(kind + ':')).length; }
function newTag(key) { return isNew(key) ? '<span class="new-tag">NEW</span>' : ''; }

// ---------------- 称号の お知らせ ----------------
// 画面の 上に 大きめの 帯で 1 つずつ 出す (いくつ とれても 順番に)
const AchNotice = {
  queue: [],
  busy: false,
  push(list) {
    this.queue.push(...list);
    if (!this.busy) this.next();
  },
  next() {
    const a = this.queue.shift();
    if (!a) { this.busy = false; return; }
    this.busy = true;
    const el = document.createElement('div');
    el.className = 'ach-notice' + (a.hard ? ' hard' : '');
    el.innerHTML = `<div class="an-icon">🏅</div><div class="an-body"><small>${a.hard ? '★難しい称号' : '新しい称号'}を手に入れた！　🪙+${ACH_COINS}</small><b>${a.name}</b><span>${a.desc}</span></div><span class="new-tag">NEW</span>`;
    document.body.appendChild(el);
    if (typeof SFX !== 'undefined' && SFX.levelup) SFX.levelup();
    setTimeout(() => el.classList.add('out'), 2800);
    setTimeout(() => { el.remove(); this.next(); }, 3200);
  },
};
