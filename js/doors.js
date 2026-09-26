// ============================================================
//  ぼうけんのとびら
//  ステージを すすめると モードや キャラが つかえるように なる (開放の 条件を ならべた 画面)
//  ・条件を みたすと とびらが ひらく (結果画面・ホームで 知らせる)
//  ・前から あそんでいる セーブデータは、もう つかったことの ある ものは ひらいた 状態から はじめる
// ============================================================

const bossCleared = w => Save.data.cleared > worldStages(w).slice(-1)[0];
const svCleared = k => !!(Save.data.best['sv-' + k] || {}).cleared;
const bossDoor = w => ({ text: `ワールド ${w + 1}「${WORLDS[w].name}」の ボスを たおす`, check: () => bossCleared(w), progress: () => `${Math.min(worldStages(w).length, Math.max(0, Save.data.cleared - worldStages(w)[0]))}/${worldStages(w).length} ステージ` });

const DOORS = [
  { id: 'survival', kind: 'mode', icon: '⚔️', name: 'サバイバル', what: 'WASD で うごいて 敵の 大群と たたかう モード', ...bossDoor(0) },
  { id: 'ch_piriri', kind: 'char', char: 'piriri', name: 'ぴりり', what: 'でんきの スピード型 スライム', ...bossDoor(0) },
  { id: 'gacha', kind: 'mode', icon: '🎰', name: 'ガチャ・きせかえ', what: 'コインで ガチャを 引いて、いろ・ぼうし・エフェクトで きせかえ', ...bossDoor(1) },
  { id: 'ch_gotsun', kind: 'char', char: 'gotsun', name: 'ごつん', what: 'いわの ぼうぎょ型 スライム', ...bossDoor(2) },
  { id: 'ch_homura', kind: 'char', char: 'homura', name: 'ほむら', what: 'ほのおの こうげき型 スライム', ...bossDoor(3) },
  { id: 'ch_moririn', kind: 'char', char: 'moririn', name: 'もりりん', what: 'くさの かいふく型 スライム', ...bossDoor(4) },
  { id: 'ch_kagemaru', kind: 'char', char: 'kagemaru', name: 'かげまる', what: 'かげの テクニック型 スライム', ...bossDoor(5) },
  { id: 'weak', kind: 'mode', icon: '🎯', name: 'にがてキー特訓', what: 'にがてな キーを たくさん つかう れんしゅう',
    text: 'れんしゅうを 3 回 さいごまで やる', check: () => Save.data.totals.plays >= 3, progress: () => `${Math.min(3, Save.data.totals.plays)}/3 回` },
  ...[['normal', 'easy'], ['hard', 'normal'], ['oni', 'hard'], ['hell', 'oni']].map(([k, prev]) => ({
    id: 'sv_' + k, kind: 'svdiff', icon: '💀', name: `サバイバル「${SV_DIFFS[k].name}」`, what: `ボスは ${SV_BOSS[SV_DIFFS[k].boss].name}。おすすめ ${SV_DIFFS[k].rec}`,
    text: `サバイバル「${SV_DIFFS[prev].name}」を クリアする`, check: () => svCleared(prev), progress: () => (svCleared(prev) ? 'クリア' : 'まだ'),
  })),
];

function doorOpen(id) { return !!(Save.data.doors || {})[id]; }
function doorOf(id) { return DOORS.find(d => d.id === id); }
function doorCount() { return DOORS.filter(d => doorOpen(d.id)).length; }

// 条件を みたした とびらを ひらいて、新しく ひらいた ものを 返す
function checkDoors() {
  Save.data.doors = Save.data.doors || {};
  const got = [];
  for (const d of DOORS) {
    if (doorOpen(d.id)) continue;
    let ok = false;
    try { ok = d.check(); } catch (e) { ok = false; }
    if (ok) { Save.data.doors[d.id] = Date.now(); got.push(d); }
  }
  if (got.length) Save.save();
  return got;
}

// 前の 版から あそんでいる セーブ: もう つかったことの ある ものは ひらいた ことに する
function migrateDoors() {
  const s = Save.data;
  s.doors = s.doors || {};
  const used = {
    survival: Object.keys(s.best).some(k => k.startsWith('sv-')),
    gacha: (s.gacha || {}).pulls > 0,
    weak: (s.totals.weakPlays || 0) > 0,
  };
  for (const id of STARTERS) if (s.chars[id] && (s.chars[id].exp > 0 || s.active === id)) used['ch_' + id] = true;
  for (const k of ['normal', 'hard', 'oni', 'hell']) if (s.best['sv-' + k]) used['sv_' + k] = true;
  for (const id of Object.keys(used)) if (used[id] && doorOf(id)) s.doors[id] = s.doors[id] || Date.now();
  checkDoors();
}

// 画面で つかう: ひらいていない ときの ひとこと
function lockNote(id) { const d = doorOf(id); return d ? `🔒 ${d.text}と ひらく` : ''; }
function doorIcon(d) { return d.kind === 'char' ? `<div class="sprite">${slimeSVG(d.char, 0, {})}</div>` : `<div class="door-emoji">${d.icon}</div>`; }

// 新しく ひらいた とびらを 知らせる (トースト)
function announceDoors(list, delay = 400) {
  list.forEach((d, i) => setTimeout(() => { toast(`🚪 ぼうけんのとびらが ひらいた！「${d.name}」`, 2800); SFX.levelup(); }, delay + i * 3000));
}

// ---------------- ぼうけんのとびらの 画面 ----------------
Screens.doors = {
  enter() {
    announceDoors(checkDoors(), 300);
    $('#btn-doors-back').onclick = () => App.show('home');
    this.render();
  },
  render() {
    $('#doors-desc').innerHTML = `ひらいた とびら <b>${doorCount()}</b> / ${DOORS.length}　・　ステージを すすめると あたらしい モードや スライムに であえる`;
    $('#doors-list').innerHTML = DOORS.map(d => {
      const open = doorOpen(d.id);
      return `<div class="door-card ${open ? 'open' : 'closed'}">
        <div class="door-frame">${open ? doorIcon(d) : '<div class="door-lock">🚪</div>'}</div>
        <div class="door-body">
          <div class="door-name">${d.name} ${open ? '<span class="door-ok">ひらいた！</span>' : ''}</div>
          <div class="door-what">${d.what}</div>
          <div class="door-cond ${open ? 'done' : ''}">${open ? '✔' : '🔑'} ${d.text}${!open && d.progress ? ` <small>(いま ${d.progress()})</small>` : ''}</div>
        </div></div>`;
    }).join('');
  },
  onKey(e) { if (e.key === 'Escape') App.show('home'); },
};
