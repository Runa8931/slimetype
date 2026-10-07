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
    $('#dex-desc').innerHTML = `倒したモンスター <b>${n}</b> / ${ENEMIES.length}（${Math.round(n / ENEMIES.length * 100)}%）`;
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
      return `<div class="dex-world w-${w.id}">ワールド${wi + 1}　${w.name}</div><div class="dex-grid">${cells}</div>`;
    }).join('') + `<div class="dex-world w-hidden">隠しステージ</div><div class="dex-grid">${HIDDEN_DEFS.map(h => {
      const e = ENEMIES[h.idx], d = (Save.data.dex || {})[e.id] || {};
      const st = d.wins > 0 ? 'won' : d.seen ? 'seen' : 'none';
      return `<button class="dex-cell ${st} boss" data-g="${h.idx}"><span class="dex-no">隠し</span><div class="dex-sprite">${enemySVG(e.id)}</div><div class="dex-name">${st === 'none' ? '？？？' : e.name}</div></button>`;
    }).join('')}</div>`;
    $('#dex-list').querySelectorAll('.dex-cell').forEach(b => { b.onclick = () => this.show(+b.dataset.g); });
    $('#btn-dex-back').onclick = () => App.show('home');
    this.show(null);
  },

  show(g) {
    const box = $('#dex-detail');
    if (g == null) { box.innerHTML = '<div class="dex-hint">モンスターを選ぶと詳しく見られます</div>'; return; }
    SFX.select();
    $('#dex-list').querySelectorAll('.dex-cell').forEach(b => b.classList.toggle('on', +b.dataset.g === g));
    const e = ENEMIES[g];
    const d = (Save.data.dex || {})[e.id] || {};
    if (!d.seen) {
      box.innerHTML = `<div class="dd-sprite none">${enemySVG(e.id)}</div><div class="dd-name">？？？</div>
        <div class="dd-desc">まだ出会っていないモンスター。<br>${e.hidden ? `どこかに隠れている…（${hiddenOf(g).reveal.text}と道が開く）` : `${stageLabel(g)}で出会えるかも…`}</div>`;
      return;
    }
    box.innerHTML = `<div class="dd-sprite ${d.wins > 0 ? '' : 'seen'}">${enemySVG(e.id)}</div>
      <div class="dd-name">${e.name} ${e.boss ? '<span class="badge boss">BOSS</span>' : ''}</div>
      <div class="dd-meta">${e.hidden ? `隠しステージ・${WORLDS[e.host].name}` : `No.${String(g + 1).padStart(2, '0')} ・ ${stageLabel(g)} ${WORLDS[e.world].name}`} ・ Lv.${e.lv}</div>
      <p class="dd-desc">${e.desc}</p>
      <div class="dd-ability">${e.abilityDesc}</div>
      <div class="dd-stats">
        <div><span>倒した回数</span><b>${d.wins || 0}</b></div>
        <div><span>最速撃破</span><b>${d.best != null ? d.best + '秒' : '—'}</b></div>
      </div>`;
  },

  onKey(e) { if (e.key === 'Escape') App.show('home'); },
};

// ---------------- しょうごう ----------------
// check(r): r は結果画面にわたす情報。r がなくても合計の記録で判定できるものもある
const maxCharLv = () => Math.max(...Object.keys(CHARACTERS).map(id => charInfo(id).L));
const ACHIEVEMENTS = [
  // れんしゅう
  { id: 'first_practice', name: '初めの一歩', desc: '練習を1回最後までやる', check: r => r && r.mode === 'practice' },
  { id: 'kpm150', name: '早打ち見習い', desc: '練習で打鍵/分150以上', check: r => r && r.mode === 'practice' && r.kpm >= 150 },
  { id: 'kpm250', name: '早打ち名人', desc: '練習で打鍵/分250以上', check: r => r && r.mode === 'practice' && r.kpm >= 250 },
  { id: 'kpm350', name: '光の指', desc: '練習で打鍵/分350以上', check: r => r && r.mode === 'practice' && r.kpm >= 350 },
  { id: 'acc100', name: '完璧主義', desc: '練習で100打鍵以上ミス0', check: r => r && r.mode === 'practice' && r.correct >= 100 && r.miss === 0 },
  { id: 'combo100', name: 'コンボ使い', desc: '最大コンボ100以上', check: r => r && r.maxCombo >= 100 },
  { id: 'combo300', name: 'コンボマスター', desc: '最大コンボ300以上', check: r => r && r.maxCombo >= 300 },
  { id: 'rankS', name: 'Sランクの腕前', desc: '練習でランクS以上', check: r => r && r.mode === 'practice' && r.score >= 310 },
  { id: 'weak3', name: '苦手克服', desc: '苦手キー特訓を3回やる', check: () => (Save.data.totals.weakPlays || 0) >= 3 },
  // バトル
  { id: 'first_win', name: '初めての勝利', desc: 'バトルで初めて勝つ', check: r => r && r.mode === 'battle' && r.won },
  { id: 'no_miss_win', name: 'ノーミス勝利', desc: 'ミス0でバトルに勝つ', check: r => r && r.mode === 'battle' && r.won && r.miss === 0 && r.correct >= 20 },
  { id: 'hp90', name: '余裕の勝利', desc: 'HPを9割以上残して勝つ', check: r => r && r.mode === 'battle' && r.won && r.hpLeft >= 0.9 },
  { id: 'fast20', name: '瞬殺', desc: '20秒以内にバトルに勝つ', check: r => r && r.mode === 'battle' && r.won && r.secs <= 20 },
  { id: 'giant', name: 'ジャイアントキリング', desc: '自分より5レベル以上高い敵に勝つ', check: r => r && r.mode === 'battle' && r.won && r.enemyLv - r.playerLv >= 5 },
  { id: 'world3', name: '旅人', desc: 'ワールド3のボスを倒す', check: () => Save.data.cleared > worldStages(2).slice(-1)[0] },
  { id: 'world6', name: '冒険家', desc: 'ワールド6のボスを倒す', check: () => Save.data.cleared > worldStages(5).slice(-1)[0] },
  { id: 'world9', name: '英雄', desc: 'ワールド9のボスを倒す', check: () => Save.data.cleared > worldStages(8).slice(-1)[0] },
  { id: 'all_clear', name: '伝説の勇者', desc: '魔王を倒す', check: () => Save.data.cleared > ENEMIES.findIndex(e => e.final) },
  { id: 'world12', name: '影を越えし者', desc: 'ワールド12「影の森」のボスを倒す', check: () => Save.data.cleared > worldStages(11).slice(-1)[0] },
  { id: 'world13', name: '星の果ての勇者', desc: '真魔王を倒して全部クリア', check: () => Save.data.cleared >= MAIN_STAGES },
  { id: 'mid_boss', name: '中級の証', desc: '中級者でワールドのボスを倒す', check: r => r && r.mode === 'battle' && r.won && r.bdiff !== 'beg' && r.bdiff && ENEMIES[r.enemyIdx].boss },
  { id: 'adv_win', name: '上級への一歩', desc: '上級者でバトルに勝つ', check: r => r && r.mode === 'battle' && r.won && r.bdiff === 'adv' },
  { id: 'adv_demon', name: '真の勇者', desc: '上級者で魔王を倒す', check: r => r && r.mode === 'battle' && r.won && r.bdiff === 'adv' && ENEMIES[r.enemyIdx].final },
  { id: 'adv_last', name: '伝説を越えし者', desc: '上級者で真魔王を倒す', check: r => r && r.mode === 'battle' && r.won && r.bdiff === 'adv' && ENEMIES[r.enemyIdx].last },
  { id: 'wins50', name: 'ベテラン', desc: 'バトルに合計50回勝つ', check: () => Save.data.totals.wins >= 50 },
  { id: 'wins200', name: 'バトルマスター', desc: 'バトルに合計200回勝つ', check: () => Save.data.totals.wins >= 200 },
  // サバイバル
  { id: 'sv_easy', name: 'サバイバー', desc: 'サバイバル「簡単」をクリア', check: () => !!(Save.data.best['sv-easy'] || {}).cleared },
  { id: 'sv_normal', name: 'つわもの', desc: 'サバイバル「普通」をクリア', check: () => !!(Save.data.best['sv-normal'] || {}).cleared },
  { id: 'sv_hard', name: '戦の勇者', desc: 'サバイバル「難しい」をクリア', check: () => !!(Save.data.best['sv-hard'] || {}).cleared },
  { id: 'sv_oni', name: '鬼殺し', desc: 'サバイバル「鬼」をクリア', check: () => !!(Save.data.best['sv-oni'] || {}).cleared },
  { id: 'sv_hell', name: '地獄の果てから帰った者', desc: 'サバイバル「地獄」をクリア', check: () => !!(Save.data.best['sv-hell'] || {}).cleared },
  { id: 'sv_300', name: '無双', desc: 'サバイバル1回で300体倒す', check: r => r && r.mode === 'survival' && r.kills >= 300 },
  // せいちょう
  { id: 'lv20', name: '進化の始まり', desc: '誰かをLv20にする', check: () => maxCharLv() >= 20 },
  { id: 'lv60', name: '翼を得た者', desc: '誰かをLv60にする', check: () => maxCharLv() >= 60 },
  { id: 'lv99', name: 'レベルマスター', desc: '誰かをLv99にする', check: () => maxCharLv() >= 99 },
  { id: 'lv120', name: '伝説のスライム', desc: '誰かをLv120にする', check: () => maxCharLv() >= 120 },
  { id: 'team20', name: '仲間思い', desc: '最初の6体全員をLv20以上にする', check: () => STARTERS.every(id => charInfo(id).L >= 20) },
  // ずかん・そのほか
  { id: 'dex_half', name: '図鑑博士見習い', desc: '図鑑に33種類登録', check: () => dexCount() >= 33 },
  { id: 'dex_full', name: '図鑑博士', desc: '図鑑をコンプリート', check: () => dexCount() >= ENEMIES.length },
  { id: 'pt1h', name: 'スライムと仲良し', desc: 'プレイ時間1時間', check: () => PlayTime.total() >= 3600 },
  { id: 'pt10h', name: 'スライムの親友', desc: 'プレイ時間10時間', check: () => PlayTime.total() >= 36000 },
  { id: 'pt30h', name: 'スライムの世界の住人', desc: 'プレイ時間30時間', check: () => PlayTime.total() >= 108000 },
  // ---- ★ むずかしい しょうごう ----
  { id: 'kpm400', hard: true, name: '光を越えし指', desc: '練習で打鍵/分400以上', check: r => r && r.mode === 'practice' && r.kpm >= 400 },
  { id: 'rankSSS', hard: true, name: '伝説のタイパー', desc: '練習でランクSSS（スコア500以上）', check: r => r && r.mode === 'practice' && r.score >= 500 },
  { id: 'acc300', hard: true, name: '真の完璧', desc: '練習で300打鍵以上ミス0', check: r => r && r.mode === 'practice' && r.correct >= 300 && r.miss === 0 },
  { id: 'combo500', hard: true, name: 'コンボの神様', desc: '最大コンボ500以上', check: r => r && r.maxCombo >= 500 },
  { id: 'nohit_boss', hard: true, name: '無傷の勇者', desc: 'HPを8割以上残してボスに勝つ（推奨レベル以下で）', check: r => r && r.mode === 'battle' && r.won && r.hpLeft >= 0.8 && ENEMIES[r.enemyIdx].boss && r.playerLv <= r.enemyLv },
  { id: 'adv_w6', hard: true, name: '上級勇者', desc: '上級者でワールド6のボスを倒す', check: r => r && r.mode === 'battle' && r.won && r.bdiff === 'adv' && r.enemyIdx === worldStages(5).slice(-1)[0] },
  { id: 'sv_500', hard: true, name: '殲滅のスライム', desc: 'サバイバル1回で300体倒す', check: r => r && r.mode === 'survival' && r.kills >= 300 },
  { id: 'lv124', hard: true, name: '極めし者', desc: '誰かをLv124にする（Lv120＋覚醒★4）', check: () => maxCharLv() >= 124 },
  { id: 'keys300k', hard: true, name: 'タイピングの神様', desc: '合計30万回正しく打つ', check: () => Save.data.totals.keys >= 300000 },
  { id: 'hidden_all', hard: true, name: '秘密を暴く者', desc: '隠しステージを全部クリア', check: () => HIDDEN_DEFS.every(hiddenCleared) },
  { id: 'doors_all', name: '扉の鍵持ち', desc: '冒険の扉を全部開く', check: () => doorCount() >= DOORS.length },
  { id: 'keys10k', name: 'タイピング大好き', desc: '合計1万回正しく打つ', check: () => Save.data.totals.keys >= 10000 },
  { id: 'keys100k', name: 'タイピングの達人', desc: '合計10万回正しく打つ', check: () => Save.data.totals.keys >= 100000 },
  // ガチャ
  { id: 'gacha1', name: '初めてのガチャ', desc: 'ガチャを1回引く', check: () => gachaData().pulls >= 1 },
  { id: 'gacha100', name: 'ガチャの達人', desc: 'ガチャを合計100回引く', check: () => gachaData().pulls >= 100 },
  { id: 'gacha_ssr', name: '引きが強い', desc: 'ガチャでSSRを引く', check: () => gachaData().ssr >= 1 },
  { id: 'gacha_friend', name: '新しい仲間', desc: 'ガチャ限定のキャラを仲間にする', check: () => Object.keys(CHARACTERS).some(id => CHARACTERS[id].gacha && hasChar(id)) },
  { id: 'gacha_half', name: 'おしゃれさん', desc: 'ガチャの中身を半分集める', check: () => collectCount().have * 2 >= collectCount().total },
  { id: 'gacha_all', name: 'コレクター', desc: 'ガチャの中身を全部集める', check: () => collectCount().have >= collectCount().total },
  // チャレンジ (★評価・ボスラッシュ・今週の チャレンジ)
  { id: 'star3_10', name: '星集め', desc: '★3のステージを10個にする', check: () => star3Count() >= 10 },
  { id: 'star3_all', name: '満天の星', desc: '全部のステージを★3にする', hard: true, check: () => star3Count() >= MAIN_STAGES },
  { id: 'rush_all', name: 'ボスハンター', desc: 'ボスラッシュで全部のボスを倒す', check: () => Object.values(Save.data.rush || {}).some(r => r.n >= RUSH_LIST.length) },
  { id: 'rush_adv', name: '覇者', desc: '上級者のボスラッシュで全部のボスを倒す', hard: true, check: () => ((Save.data.rush || {}).adv || {}).n >= RUSH_LIST.length },
  { id: 'weekly3', name: '週ごとの挑戦者', desc: '今週のチャレンジを3週クリアする', check: () => (Save.data.weeklyClears || 0) >= 3 },
  // 熟練度
  { id: 'master_1', name: '極めし者', desc: 'どれか1体の熟練度を極みにする', check: () => masteredCount() >= 1 },
  { id: 'master_5', name: '五つの極み', desc: '5体の熟練度を極みにする', check: () => masteredCount() >= 5 },
  { id: 'master_all', name: 'スライムの師匠', desc: '全員の熟練度を極みにする', hard: true, check: () => masteredCount() >= Object.keys(CHARACTERS).length },
  // 段位認定
  { id: 'dan_1', name: '有段者', desc: '段位認定で初段に合格する', check: () => danRank() >= 10 },
  { id: 'dan_5', name: '五段の指', desc: '段位認定で五段に合格する', hard: true, check: () => danRank() >= 14 },
  { id: 'dan_10', name: 'タイピング名人', desc: '段位認定で十段に合格する', hard: true, check: () => danRank() >= 19 },
  // せんざいかくせい ★4 (キャラごと)
  ...Object.keys(CHARACTERS).map(id => ({
    id: 'aw4_' + id, name: `${CHARACTERS[id].names[0]}の親友`, desc: `${CHARACTERS[id].names[0]}を覚醒★4にする`, check: () => awakenOf(id) >= AWAKEN_MAX,
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
function hardAchCount() { return ACHIEVEMENTS.filter(a => a.hard && (Save.data.ach || {})[a.id]).length; }
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
    $('#ach-desc').innerHTML = `${playTimeHtml()}集めた称号 <b>${achCount()}</b> / ${ACHIEVEMENTS.length}　・　取った称号をクリックするとホームに飾れます`;
    $('#ach-list').innerHTML = ACHIEVEMENTS.map(a => {
      const ok = !!have[a.id];
      const on = Save.data.title === a.id;
      return `<button class="ach-card ${ok ? 'got' : 'locked'} ${on ? 'on' : ''}" data-id="${a.id}" ${ok ? '' : 'disabled'}>
        <div class="ach-icon">${ok ? '🏅' : '🔒'}</div>
        <div class="ach-body"><div class="ach-name">${a.hard ? '<span class="ach-hard">★難しい</span> ' : ''}${ok ? a.name : '？？？'}</div><div class="ach-desc">${a.desc}${ok ? '' : ` <small class="ach-coin">🪙${ACH_COINS}</small>`}</div></div>
        ${on ? '<div class="ach-on">飾り中</div>' : ''}</button>`;
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
