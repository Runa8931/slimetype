// ============================================================
//  チャレンジ (クリア後の やりこみ)
//  ・ステージの ★評価: ★1 勝つ / ★2 正確率 95% 以上で 勝つ / ★3 上級者で 正確率 97% 以上・残り HP 30% 以上で 勝つ
//  ・ボスラッシュ: 全ワールドの ボス 13 体と 続けて 戦う。HP は 持ちこし (戦いの 間に 25% 回復)
//  ・今週の チャレンジ: 週ごとに 変わる ルールで ボスと 戦う。週に 1 回 ごほうび
//  バトルは battle.js を そのまま つかう (App.show('battle', { idx, rush / rule }))
// ============================================================

// ---------------- ★評価 ----------------
const STAR_RULES = ['勝つ', '正確率95%以上で勝つ', '上級者で、正確率97%以上・残りHP30%以上で勝つ'];
function starsFor(dk, acc, hpLeft) {
  let s = 1;
  if (acc >= 0.95) s = 2;
  if (s === 2 && dk === 'adv' && acc >= 0.97 && hpLeft >= 0.3) s = 3;
  return s;
}
function stageStars(i) { return (Save.data.stars || {})[i] || 0; }
function starTotal() { let n = 0; for (let i = 0; i < MAIN_STAGES; i++) n += stageStars(i); return n; }
function star3Count() { let n = 0; for (let i = 0; i < MAIN_STAGES; i++) if (stageStars(i) >= 3) n++; return n; }
function starText(n) { return '★'.repeat(n) + '☆'.repeat(3 - n); }

// ---------------- ボスラッシュ ----------------
const RUSH_LIST = WORLDS.map((w, i) => worldStages(i).slice(-1)[0]);
const RUSH_HEAL = 0.25;
const rushOpen = () => Save.data.cleared >= MAIN_STAGES;
function rushBest(dk) { return ((Save.data.rush || {})[dk]) || null; }

// ---------------- 今週の チャレンジ ----------------
const WEEKLY_RULES = [
  { id: 'nomiss', icon: '🎯', name: 'ノーミス勝負', desc: '1回でもミスしたら負け' },
  { id: 'long', icon: '📜', name: '長文バトル', desc: 'お題が全部「、」「。」の入った長い文になる' },
  { id: 'noguide', icon: '🙈', name: 'ガイドなし', desc: 'ローマ字のガイドが出ない' },
  { id: 'glass', icon: '💔', name: 'HP半分', desc: '自分のHPが半分から始まる' },
  { id: 'symbol', icon: '🔢', name: '記号・数字', desc: 'お題が全部、数字や記号の混じったものになる' },
];
const WEEKLY_REWARD = { coins: 600, shards: 20 };
// 2026-01-05 (月) から 数えた 週の 番号
function weekNo(t = Date.now()) { return Math.floor((t - new Date(2026, 0, 5).getTime()) / (7 * 86400000)); }
function weeklyInfo() {
  const w = weekNo();
  const rule = WEEKLY_RULES[((w % WEEKLY_RULES.length) + WEEKLY_RULES.length) % WEEKLY_RULES.length];
  // 相手は 倒したことの ある ワールドの ボスから 週ごとに えらぶ (まだ なければ ワールド 1 の ボス)
  const done = RUSH_LIST.filter(i => Save.data.cleared > i);
  const pool = done.length ? done : [RUSH_LIST[0]];
  const idx = pool[((w * 7) % pool.length + pool.length) % pool.length];
  const rec = Save.data.weekly || {};
  return { week: w, rule, idx, cleared: rec.week === w && rec.cleared };
}
// 週の 最後の 日 (日曜日。月曜日に 次の チャレンジに 変わる)
function weeklyEnds(w) { const d = new Date(new Date(2026, 0, 5).getTime() + ((w + 1) * 7 - 1) * 86400000); return `${d.getMonth() + 1}/${d.getDate()}`; }

Screens.challenge = {
  enter() {
    $('#btn-ch-back').onclick = () => App.show('home');
    checkAchievements(null).forEach((a, i) => setTimeout(() => toast(`🏅 称号「${a.name}」を手に入れた！（🪙+${ACH_COINS}）`, 2600), 400 + i * 2800));
    this.render();
  },

  render() {
    const dk = battleDiffKey(), bd = BATTLE_DIFFS[dk];
    const wk = weeklyInfo(), we = ENEMIES[wk.idx];
    const rb = rushBest(dk);
    const diffSel = `<div class="ch-diff">難易度 ${BATTLE_DIFF_KEYS.map((k, i) => `<button class="${k === dk ? 'on' : ''}" data-k="${k}" style="--dc:${BATTLE_DIFFS[k].color}"><kbd>${i + 1}</kbd> ${BATTLE_DIFFS[k].name}</button>`).join('')}</div>`;
    $('#ch-desc').innerHTML = `ステージを全部クリアしたあとも遊べるやりこみ　・　${diffSel}`;
    $('#ch-list').innerHTML = `
      <div class="ch-card rush ${rushOpen() ? '' : 'locked'}">
        <div class="ch-icon">👑</div>
        <div class="ch-body">
          <div class="ch-name"><kbd>B</kbd> ボスラッシュ</div>
          <div class="ch-text">全ワールドのボス${RUSH_LIST.length}体と続けて戦う。HPは持ちこし（戦いの間に${RUSH_HEAL * 100}%回復）。倒したボスの数だけコインがもらえる</div>
          <div class="ch-rec">${rushOpen() ? (rb ? `${bd.name}の最高記録: <b>${rb.n}/${RUSH_LIST.length}体</b>${rb.n >= RUSH_LIST.length ? `（${fmtHMS(rb.secs)}）` : ''}` : `${bd.name}ではまだ挑戦していない`) : '🔒 全部のステージをクリアすると開く'}</div>
        </div>
      </div>
      <div class="ch-card weekly">
        <div class="ch-icon">${wk.rule.icon}</div>
        <div class="ch-body">
          <div class="ch-name"><kbd>W</kbd> 今週のチャレンジ「${wk.rule.name}」 <small>${weeklyEnds(wk.week)}まで</small></div>
          <div class="ch-text">${wk.rule.desc}。相手は <b>${we.name}</b>（推奨Lv.${we.lv}）</div>
          <div class="ch-rec">${wk.cleared ? '✔ 今週はクリア済み（何度でも挑戦できる）' : `ごほうび: 🪙 ${WEEKLY_REWARD.coins}・💎 ${WEEKLY_REWARD.shards}（週に1回）`}</div>
        </div>
      </div>
      <div class="ch-card stars">
        <div class="ch-icon">⭐</div>
        <div class="ch-body">
          <div class="ch-name">ステージの★評価 <small>${starTotal()} / ${MAIN_STAGES * 3}</small></div>
          <div class="ch-text">${STAR_RULES.map((t, i) => `${starText(i + 1)} ${t}`).join('<br>')}</div>
          <div class="ch-rec">★3のステージ: <b>${star3Count()} / ${MAIN_STAGES}</b>　・　マップのステージ情報に★が出る</div>
        </div>
      </div>`;
    $('#ch-desc').querySelectorAll('.ch-diff button').forEach(b => { b.onclick = () => { setBattleDiff(b.dataset.k); this.render(); }; });
    $('#ch-list .rush').onclick = () => this.startRush();
    $('#ch-list .weekly').onclick = () => this.startWeekly();
  },

  startRush() {
    if (!rushOpen()) { SFX.miss(); toast('ボスラッシュは全部のステージをクリアすると開く'); return; }
    SFX.select();
    App.show('battle', { idx: RUSH_LIST[0], rush: { i: 0, n: 0, secs: 0, correct: 0, miss: 0, hpFrac: null } });
  },
  startWeekly() {
    const wk = weeklyInfo();
    SFX.select();
    App.show('battle', { idx: wk.idx, rule: wk.rule.id, week: wk.week });
  },

  onKey(e) {
    const k = e.key.toLowerCase();
    if (e.key === 'Escape') App.show('home');
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= BATTLE_DIFF_KEYS.length) { setBattleDiff(BATTLE_DIFF_KEYS[n - 1]); this.render(); }
    if (k === 'b') this.startRush();
    if (k === 'w') this.startWeekly();
  },
};
