// ============================================================
//  モンスターずかん と しょうごう (実績)
// ============================================================

// ---------------- ずかん の記録 ----------------
function dexEntry(id) {
  Save.data.dex = Save.data.dex || {};
  return (Save.data.dex[id] = Save.data.dex[id] || { seen: false, wins: 0, best: null });
}
function dexSeen(id) { dexEntry(id).seen = true; Save.save(); }
function dexWin(id, secs) {
  const d = dexEntry(id);
  d.seen = true; d.wins++;
  if (d.best == null || secs < d.best) d.best = Math.round(secs * 10) / 10;
  Save.save();
}
function dexCount() { return ENEMIES.filter(e => Save.data.dex && Save.data.dex[e.id] && Save.data.dex[e.id].wins > 0).length; }

Screens.dex = {
  enter() {
    const n = dexCount();
    $('#dex-desc').innerHTML = `たおした モンスター <b>${n}</b> / ${ENEMIES.length} (${Math.round(n / ENEMIES.length * 100)}%)`;
    $('#dex-list').innerHTML = WORLDS.map((w, wi) => {
      const cells = worldStages(wi).map(g => {
        const e = ENEMIES[g];
        const d = (Save.data.dex || {})[e.id] || {};
        const st = d.wins > 0 ? 'won' : d.seen ? 'seen' : 'none';
        return `<button class="dex-cell ${st} ${e.boss ? 'boss' : ''}" data-g="${g}">
          <span class="dex-no">No.${String(g + 1).padStart(2, '0')}</span>
          <div class="dex-sprite">${enemySVG(e.id)}</div>
          <div class="dex-name">${st === 'none' ? '？？？' : e.name}</div></button>`;
      }).join('');
      return `<div class="dex-world w-${w.id}">ワールド ${wi + 1}　${w.name}</div><div class="dex-grid">${cells}</div>`;
    }).join('');
    $('#dex-list').querySelectorAll('.dex-cell').forEach(b => { b.onclick = () => this.show(+b.dataset.g); });
    $('#btn-dex-back').onclick = () => App.show('home');
    this.show(null);
  },

  show(g) {
    const box = $('#dex-detail');
    if (g == null) { box.innerHTML = '<div class="dex-hint">モンスターを えらぶと くわしく見られます</div>'; return; }
    SFX.select();
    $('#dex-list').querySelectorAll('.dex-cell').forEach(b => b.classList.toggle('on', +b.dataset.g === g));
    const e = ENEMIES[g];
    const d = (Save.data.dex || {})[e.id] || {};
    if (!d.seen) {
      box.innerHTML = `<div class="dd-sprite none">${enemySVG(e.id)}</div><div class="dd-name">？？？</div>
        <div class="dd-desc">まだ であっていない モンスター。<br>${stageLabel(g)} で であえるかも…</div>`;
      return;
    }
    box.innerHTML = `<div class="dd-sprite ${d.wins > 0 ? '' : 'seen'}">${enemySVG(e.id)}</div>
      <div class="dd-name">${e.name} ${e.boss ? '<span class="badge boss">BOSS</span>' : ''}</div>
      <div class="dd-meta">No.${String(g + 1).padStart(2, '0')} ・ ${stageLabel(g)} ${WORLDS[e.world].name} ・ Lv.${e.lv}</div>
      <p class="dd-desc">${e.desc}</p>
      <div class="dd-ability">${e.abilityDesc}</div>
      <div class="dd-stats">
        <div><span>たおした回数</span><b>${d.wins || 0}</b></div>
        <div><span>さいそく撃破</span><b>${d.best != null ? d.best + ' 秒' : '—'}</b></div>
      </div>`;
  },

  onKey(e) { if (e.key === 'Escape') App.show('home'); },
};

// ---------------- しょうごう ----------------
// check(r): r は結果画面にわたす情報。r がなくても合計の記録で判定できるものもある
const maxCharLv = () => Math.max(...Object.keys(CHARACTERS).map(id => charInfo(id).L));
const ACHIEVEMENTS = [
  // れんしゅう
  { id: 'first_practice', name: 'はじめのいっぽ', desc: 'れんしゅうを 1 回 さいごまでやる', check: r => r && r.mode === 'practice' },
  { id: 'kpm150', name: 'はやうち見習い', desc: 'れんしゅうで 打鍵/分 150 以上', check: r => r && r.mode === 'practice' && r.kpm >= 150 },
  { id: 'kpm250', name: 'はやうち名人', desc: 'れんしゅうで 打鍵/分 250 以上', check: r => r && r.mode === 'practice' && r.kpm >= 250 },
  { id: 'kpm350', name: 'ひかりのゆび', desc: 'れんしゅうで 打鍵/分 350 以上', check: r => r && r.mode === 'practice' && r.kpm >= 350 },
  { id: 'acc100', name: 'かんぺき主義', desc: 'れんしゅうで 100 打鍵以上 ミス 0', check: r => r && r.mode === 'practice' && r.correct >= 100 && r.miss === 0 },
  { id: 'combo100', name: 'コンボつかい', desc: '最大コンボ 100 以上', check: r => r && r.maxCombo >= 100 },
  { id: 'combo300', name: 'コンボマスター', desc: '最大コンボ 300 以上', check: r => r && r.maxCombo >= 300 },
  { id: 'rankS', name: 'Sランクの うでまえ', desc: 'れんしゅうで ランク S 以上', check: r => r && r.mode === 'practice' && r.score >= 310 },
  { id: 'weak3', name: 'にがて こくふく', desc: 'にがてキー特訓を 3 回やる', check: () => (Save.data.totals.weakPlays || 0) >= 3 },
  // バトル
  { id: 'first_win', name: 'はじめての しょうり', desc: 'バトルで はじめて勝つ', check: r => r && r.mode === 'battle' && r.won },
  { id: 'no_miss_win', name: 'ノーミス勝利', desc: 'ミス 0 で バトルに勝つ', check: r => r && r.mode === 'battle' && r.won && r.miss === 0 && r.correct >= 20 },
  { id: 'hp90', name: 'よゆうの しょうり', desc: 'HP を 9 わり以上 のこして 勝つ', check: r => r && r.mode === 'battle' && r.won && r.hpLeft >= 0.9 },
  { id: 'fast20', name: 'しゅんさつ', desc: '20 秒以内に バトルに勝つ', check: r => r && r.mode === 'battle' && r.won && r.secs <= 20 },
  { id: 'giant', name: 'ジャイアントキリング', desc: '自分より 5 レベル以上 高い敵に勝つ', check: r => r && r.mode === 'battle' && r.won && r.enemyLv - r.playerLv >= 5 },
  { id: 'world3', name: 'たびびと', desc: 'ワールド 3 の ボスをたおす', check: () => Save.data.cleared > worldStages(2).slice(-1)[0] },
  { id: 'world6', name: 'ぼうけんか', desc: 'ワールド 6 の ボスをたおす', check: () => Save.data.cleared > worldStages(5).slice(-1)[0] },
  { id: 'world9', name: 'えいゆう', desc: 'ワールド 9 の ボスをたおす', check: () => Save.data.cleared > worldStages(8).slice(-1)[0] },
  { id: 'all_clear', name: 'でんせつの ゆうしゃ', desc: 'まおうを たおす', check: () => Save.data.cleared > ENEMIES.findIndex(e => e.final) },
  { id: 'world12', name: 'かげを こえし もの', desc: 'ワールド 12「かげのもり」の ボスを たおす', check: () => Save.data.cleared > worldStages(11).slice(-1)[0] },
  { id: 'world13', name: 'ほしのはての ゆうしゃ', desc: 'しんまおうを たおして ぜんぶ クリア', check: () => Save.data.cleared >= ENEMIES.length },
  { id: 'mid_boss', name: 'ちゅうきゅうの あかし', desc: '中級者で ワールドの ボスを たおす', check: r => r && r.mode === 'battle' && r.won && r.bdiff !== 'beg' && r.bdiff && ENEMIES[r.enemyIdx].boss },
  { id: 'adv_win', name: 'じょうきゅうへの いっぽ', desc: '上級者で バトルに 勝つ', check: r => r && r.mode === 'battle' && r.won && r.bdiff === 'adv' },
  { id: 'adv_demon', name: 'しんの ゆうしゃ', desc: '上級者で まおうを たおす', check: r => r && r.mode === 'battle' && r.won && r.bdiff === 'adv' && ENEMIES[r.enemyIdx].final },
  { id: 'adv_last', name: 'でんせつを こえし もの', desc: '上級者で しんまおうを たおす', check: r => r && r.mode === 'battle' && r.won && r.bdiff === 'adv' && ENEMIES[r.enemyIdx].last },
  { id: 'wins50', name: 'ベテラン', desc: 'バトルに 合計 50 回 勝つ', check: () => Save.data.totals.wins >= 50 },
  { id: 'wins200', name: 'バトルマスター', desc: 'バトルに 合計 200 回 勝つ', check: () => Save.data.totals.wins >= 200 },
  // サバイバル
  { id: 'sv_easy', name: 'サバイバー', desc: 'サバイバル かんたん を クリア', check: () => !!(Save.data.best['sv-easy'] || {}).cleared },
  { id: 'sv_normal', name: 'つわもの', desc: 'サバイバル ふつう を クリア', check: () => !!(Save.data.best['sv-normal'] || {}).cleared },
  { id: 'sv_hard', name: 'いくさの ゆうしゃ', desc: 'サバイバル むずかしい を クリア', check: () => !!(Save.data.best['sv-hard'] || {}).cleared },
  { id: 'sv_oni', name: 'おにごろし', desc: 'サバイバル おに を クリア', check: () => !!(Save.data.best['sv-oni'] || {}).cleared },
  { id: 'sv_hell', name: 'じごくの はてから かえった もの', desc: 'サバイバル じごく を クリア', check: () => !!(Save.data.best['sv-hell'] || {}).cleared },
  { id: 'sv_300', name: 'むそう', desc: 'サバイバル 1 回で 300 体 たおす', check: r => r && r.mode === 'survival' && r.kills >= 300 },
  // せいちょう
  { id: 'lv20', name: 'しんかの はじまり', desc: 'だれかを Lv20 にする', check: () => maxCharLv() >= 20 },
  { id: 'lv60', name: 'つばさを えた もの', desc: 'だれかを Lv60 にする', check: () => maxCharLv() >= 60 },
  { id: 'lv99', name: 'レベルマスター', desc: 'だれかを Lv99 にする', check: () => maxCharLv() >= 99 },
  { id: 'lv120', name: 'でんせつの スライム', desc: 'だれかを Lv120 にする', check: () => maxCharLv() >= 120 },
  { id: 'team20', name: 'なかま思い', desc: 'さいしょの 6 たい 全員を Lv20 以上に する', check: () => STARTERS.every(id => charInfo(id).L >= 20) },
  // ずかん・そのほか
  { id: 'dex_half', name: 'ずかん はかせ見習い', desc: 'ずかんに 33 しゅるい とうろく', check: () => dexCount() >= 33 },
  { id: 'dex_full', name: 'ずかん はかせ', desc: 'ずかんを コンプリート', check: () => dexCount() >= ENEMIES.length },
  { id: 'pt1h', name: 'スライムと なかよし', desc: 'プレイ時間 1 時間', check: () => PlayTime.total() >= 3600 },
  { id: 'pt10h', name: 'スライムの しんゆう', desc: 'プレイ時間 10 時間', check: () => PlayTime.total() >= 36000 },
  { id: 'pt30h', name: 'スライムの せかいの じゅうにん', desc: 'プレイ時間 30 時間', check: () => PlayTime.total() >= 108000 },
  { id: 'doors_all', name: 'とびらの かぎもち', desc: 'ぼうけんのとびらを ぜんぶ ひらく', check: () => doorCount() >= DOORS.length },
  { id: 'keys10k', name: 'タイピング だいすき', desc: '合計 1 万回 正しく打つ', check: () => Save.data.totals.keys >= 10000 },
  { id: 'keys100k', name: 'タイピングの たつじん', desc: '合計 10 万回 正しく打つ', check: () => Save.data.totals.keys >= 100000 },
  // ガチャ
  { id: 'gacha1', name: 'はじめての ガチャ', desc: 'ガチャを 1 回 引く', check: () => gachaData().pulls >= 1 },
  { id: 'gacha100', name: 'ガチャの たつじん', desc: 'ガチャを 合計 100 回 引く', check: () => gachaData().pulls >= 100 },
  { id: 'gacha_ssr', name: 'ひきが つよい', desc: 'ガチャで SSR を 引く', check: () => gachaData().ssr >= 1 },
  { id: 'gacha_friend', name: 'あたらしい なかま', desc: 'ガチャ限定の キャラを なかまにする', check: () => Object.keys(CHARACTERS).some(id => CHARACTERS[id].gacha && hasChar(id)) },
  { id: 'gacha_half', name: 'おしゃれさん', desc: 'ガチャの なかみを 半分 あつめる', check: () => collectCount().have * 2 >= collectCount().total },
  { id: 'gacha_all', name: 'コレクター', desc: 'ガチャの なかみを ぜんぶ あつめる', check: () => collectCount().have >= collectCount().total },
  // せんざいかくせい ★4 (キャラごと)
  ...Object.keys(CHARACTERS).map(id => ({
    id: 'aw4_' + id, name: `${CHARACTERS[id].names[0]}の しんゆう`, desc: `${CHARACTERS[id].names[0]}を かくせい ★4 に する`, check: () => awakenOf(id) >= AWAKEN_MAX,
  })),
];

// しょうごうを 1 つ とるたびに もらえる コイン
const ACH_COINS = 100;

// まだ持っていない しょうごうを しらべて、新しく とれたものを返す
function checkAchievements(r) {
  Save.data.ach = Save.data.ach || {};
  const got = [];
  for (const a of ACHIEVEMENTS) {
    if (Save.data.ach[a.id]) continue;
    let ok = false;
    try { ok = a.check(r); } catch (e) { ok = false; }
    if (ok) { Save.data.ach[a.id] = Date.now(); got.push(a); }
  }
  if (got.length) grantCoins(ACH_COINS * got.length);
  return got;
}
function achCount() { return Object.keys(Save.data.ach || {}).length; }
function currentTitle() {
  const a = ACHIEVEMENTS.find(x => x.id === Save.data.title);
  return a && (Save.data.ach || {})[a.id] ? a.name : null;
}

Screens.ach = {
  enter() {
    this.render();
    $('#btn-ach-back').onclick = () => App.show('home');
  },
  render() {
    const have = Save.data.ach || {};
    $('#ach-desc').innerHTML = `${playTimeHtml()}あつめた しょうごう <b>${achCount()}</b> / ${ACHIEVEMENTS.length}　・　とった しょうごうを クリックすると ホームに かざれます`;
    $('#ach-list').innerHTML = ACHIEVEMENTS.map(a => {
      const ok = !!have[a.id];
      const on = Save.data.title === a.id;
      return `<button class="ach-card ${ok ? 'got' : 'locked'} ${on ? 'on' : ''}" data-id="${a.id}" ${ok ? '' : 'disabled'}>
        <div class="ach-icon">${ok ? '🏅' : '🔒'}</div>
        <div class="ach-body"><div class="ach-name">${ok ? a.name : '？？？'}</div><div class="ach-desc">${a.desc}${ok ? '' : ` <small class="ach-coin">🪙${ACH_COINS}</small>`}</div></div>
        ${on ? '<div class="ach-on">かざり中</div>' : ''}</button>`;
    }).join('');
    $('#ach-list').querySelectorAll('.ach-card.got').forEach(b => {
      b.onclick = () => {
        Save.data.title = Save.data.title === b.dataset.id ? null : b.dataset.id;
        Save.save(); SFX.select(); this.render();
      };
    });
  },
  onKey(e) { if (e.key === 'Escape') App.show('home'); },
};
