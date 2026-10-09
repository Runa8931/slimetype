// ============================================================
//  ぼうけんのとびら
//  ステージを すすめると モードや キャラが つかえるように なる (開放の 条件を ならべた 画面)
//  ・条件を みたすと とびらが ひらく (結果画面・ホームで 知らせる)
//  ・前から あそんでいる セーブデータは、もう つかったことの ある ものは ひらいた 状態から はじめる
// ============================================================

const bossCleared = w => Save.data.cleared > worldStages(w).slice(-1)[0];
const svCleared = k => !!(Save.data.best['sv-' + k] || {}).cleared;
const bossDoor = w => ({ text: `ワールド${w + 1}「${WORLDS[w].name}」のボスを倒す`, check: () => bossCleared(w), progress: () => `${Math.min(worldStages(w).length, Math.max(0, Save.data.cleared - worldStages(w)[0]))}/${worldStages(w).length}ステージ` });

const DOORS = [
  { id: 'survival', kind: 'mode', icon: '⚔️', name: 'サバイバル', what: 'WASDで動いて敵の大群と戦うモード', ...bossDoor(0) },
  { id: 'ch_piriri', kind: 'char', char: 'piriri', name: 'ぴりり', what: '電気のスピード型スライム', ...bossDoor(0) },
  { id: 'gacha', kind: 'mode', icon: '🎰', name: 'ガチャ・着せ替え', what: 'コインでガチャを引いて、色・帽子・エフェクトで着せ替え', ...bossDoor(1) },
  { id: 'ch_gotsun', kind: 'char', char: 'gotsun', name: 'ごつん', what: '岩の防御型スライム', ...bossDoor(2) },
  { id: 'ch_homura', kind: 'char', char: 'homura', name: 'ほむら', what: '炎の攻撃型スライム', ...bossDoor(3) },
  { id: 'ch_moririn', kind: 'char', char: 'moririn', name: 'もりりん', what: '草の回復型スライム', ...bossDoor(4) },
  { id: 'ch_kagemaru', kind: 'char', char: 'kagemaru', name: 'かげまる', what: '影のテクニック型スライム', ...bossDoor(5) },
  // しょうごうで ひらく キャラ
  ...['onpuru', 'pitarin', 'fuerin'].map(id => {
    const ach = () => ACHIEVEMENTS.find(x => x.id === CHARACTERS[id].title);
    return { id: 'ch_' + id, kind: 'char', char: id, name: CHARACTERS[id].names[0], what: `${CHARACTERS[id].type}の${CHARACTERS[id].role}スライム`,
      get text() { const a = ach(); return `称号「${a.name}」を取る（${a.desc}）`; },
      check: () => !!(Save.data.ach || {})[CHARACTERS[id].title], progress: () => 'まだ' };
  }),
  // かくしステージを たおすと ひらく キャラ
  ...[['gorurin', 'h_goldgolem'], ['yukidarun', 'h_icequeen']].map(([id, hid]) => {
    const h = HIDDEN_DEFS.find(x => x.e.id === hid);
    return { id: 'ch_' + id, kind: 'char', char: id, hidden: hid, name: CHARACTERS[id].names[0], what: `${CHARACTERS[id].type}の${CHARACTERS[id].role}スライム`,
      text: `隠しステージ「${h.e.name}」を倒す（道の開き方: ${h.reveal.text}）`, check: () => hiddenCleared(h),
      progress: () => { if (hiddenOpen(h)) return '道は開いている'; const p = h.reveal.progress(); return `道はまだ${p !== 'まだ' ? ` … ${p}` : ''}`; } };
  }),
  // むずかしい しょうごうの ミッション
  { id: 'ch_yuusharin', kind: 'char', char: 'yuusharin', name: 'ゆうしゃりん', what: '伝説のオールラウンド型スライム',
    text: '★難しい称号を3個取る', check: () => hardAchCount() >= 3, progress: () => `${hardAchCount()}/3個` },
  { id: 'pet_phoenix', kind: 'item', give: 'p_phoenix', icon: '🔥', name: 'お供「不死鳥」', what: 'ここでしか手に入らないお供',
    text: '称号を40個取る（★難しいもの5個以上を含む）', check: () => achCount() >= 40 && hardAchCount() >= 5,
    progress: () => `${achCount()}/40個・★${hardAchCount()}/5個` },
  { id: 'weak', kind: 'mode', icon: '🎯', name: '苦手キー特訓', what: '苦手なキーをたくさん使う練習',
    text: '練習を3回最後までやる', check: () => Save.data.totals.plays >= 3, progress: () => `${Math.min(3, Save.data.totals.plays)}/3回` },
  ...[['normal', 'easy'], ['hard', 'normal'], ['oni', 'hard'], ['hell', 'oni']].map(([k, prev]) => ({
    id: 'sv_' + k, kind: 'svdiff', icon: '💀', name: `サバイバル「${SV_DIFFS[k].name}」`, what: `ボスは${SV_BOSS[SV_DIFFS[k].boss].name}。おすすめ${SV_DIFFS[k].rec}`,
    text: `サバイバル「${SV_DIFFS[prev].name}」をクリアする`, check: () => svCleared(prev), progress: () => (svCleared(prev) ? 'クリア' : 'まだ'),
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
    if (ok) {
      Save.data.doors[d.id] = Date.now(); got.push(d); markNew('door:' + d.id);
      if (d.char) markNew('char:' + d.char);
      if (d.give) { gachaData().items[d.give] = Date.now(); markNew('item:' + d.give); }
    }
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
function lockNote(id) { const d = doorOf(id); return d ? `🔒 ${d.text}と開く` : ''; }
function doorIcon(d) { if (d.give) return `<div class="sprite pet-icon">${itemIcon(ITEM_BY_ID[d.give])}</div>`; return d.kind === 'char' ? `<div class="sprite">${slimeSVG(d.char, 0, {})}</div>` : `<div class="door-emoji">${d.icon}</div>`; }

// 新しく ひらいた とびらを 知らせる (トースト)
function announceDoors(list, delay = 400) {
  list.forEach((d, i) => setTimeout(() => { toast(`🚪 冒険の扉が開いた！「${d.name}」`, 2800); SFX.levelup(); }, delay + i * 3000));
}

// ---------------- ぼうけんのとびらの 画面 ----------------
Screens.doors = {
  enter() {
    announceDoors(checkDoors(), 300);
    $('#btn-doors-back').onclick = () => App.show('home');
    this.render();
  },
  render() {
    $('#doors-desc').innerHTML = `開いた扉 <b>${doorCount()}</b> / ${DOORS.length}　・　ステージを進めると新しいモードやスライムに出会える`;
    $('#doors-list').innerHTML = DOORS.map(d => {
      const open = doorOpen(d.id);
      return `<div class="door-card ${open ? 'open' : 'closed'} ${isNew('door:' + d.id) ? 'is-new' : ''}" data-id="${d.id}">${newTag('door:' + d.id)}
        <div class="door-frame">${open ? doorIcon(d) : '<div class="door-lock">🚪</div>'}</div>
        <div class="door-body">
          <div class="door-name">${d.name} ${open ? '<span class="door-ok">開いた！</span>' : ''}</div>
          <div class="door-what">${d.what}</div>
          <div class="door-cond ${open ? 'done' : ''}">${open ? '✔' : '🔑'} ${d.text}${!open && d.progress ? ` <small>（今 ${d.progress()}）</small>` : ''}</div>
        </div></div>`;
    }).join('');
    $('#doors-list').querySelectorAll('.door-card.is-new').forEach(c => { c.onclick = () => { clearNew('door:' + c.dataset.id); SFX.select(); this.render(); }; });
  },
  onKey(e) { if (e.key === 'Escape') App.show('home'); },
};
