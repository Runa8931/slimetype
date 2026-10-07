// ============================================================
//  キャラごとの 熟練度
//  そのキャラで 遊ぶと 4 つの 課題が すすむ。1 つ 達成する ごとに 熟練度が 1 上がり (最大 4 = 極み)、
//  極みに なると そのキャラ だけの オーラが つく (sprites.js の look.master)
//  記録: Save.data.mastery[キャラ] = { keys, wins, skills, s3: { ステージ: 1 }, lv }
//  数える 場所: recordHit (正しく 打った キー)・battle.js (勝利・必殺・★3)
// ============================================================

const MASTERY_TASKS = [
  { id: 'keys', name: '正しく打った数', goal: 20000, unit: '打鍵', get: m => m.keys || 0 },
  { id: 'wins', name: 'バトルの勝利', goal: 30, unit: '回', get: m => m.wins || 0 },
  { id: 'skills', name: '必殺を使った数', goal: 150, unit: '回', get: m => m.skills || 0 },
  { id: 's3', name: '★3にしたステージ', goal: 5, unit: '個', get: m => Object.keys(m.s3 || {}).length },
];
const MASTERY_MAX = MASTERY_TASKS.length;
const MASTERY_COINS = 300; // 1 つ 上がる ごとの ごほうび

function masteryOf(id) {
  const all = Save.data.mastery = Save.data.mastery || {};
  return all[id] = all[id] || { keys: 0, wins: 0, skills: 0, s3: {}, lv: 0 };
}
function masteryLv(id) { return MASTERY_TASKS.filter(t => t.get(masteryOf(id)) >= t.goal).length; }
function masteredCount() { return Object.keys(CHARACTERS).filter(id => masteryLv(id) >= MASTERY_MAX).length; }

// 数を 足す (keys は 1 キーごとに よぶので 軽く する。上がった ことの 知らせは masteryCheck で)
function masteryAdd(id, key, n = 1) {
  if (!id || !CHARACTERS[id]) return;
  const m = masteryOf(id);
  m[key] = (m[key] || 0) + n;
}
function masteryStar3(id, idx) { if (id && CHARACTERS[id]) masteryOf(id).s3[idx] = 1; }

// 熟練度が 上がって いたら ごほうびと 知らせ (練習・バトルの 終わりに よぶ)
function masteryCheck(id) {
  if (!id || !CHARACTERS[id]) return;
  const m = masteryOf(id), lv = masteryLv(id);
  if (lv <= (m.lv || 0)) return;
  const up = lv - (m.lv || 0);
  m.lv = lv;
  grantCoins(MASTERY_COINS * up);
  const name = CHARACTERS[id].names[0];
  setTimeout(() => toast(lv >= MASTERY_MAX
    ? `✨ ${name}の熟練度が極みになった！ 専用のオーラがついた（🪙+${MASTERY_COINS * up}）`
    : `⭐ ${name}の熟練度が ${lv} になった！（🪙+${MASTERY_COINS * up}）`, 4200), 1500);
  Save.save();
}

// キャラ選びの カードに 出す 熟練度
function masteryHtml(id) {
  const m = masteryOf(id), lv = masteryLv(id);
  const rows = MASTERY_TASKS.map(t => {
    const v = Math.min(t.goal, t.get(m)), done = v >= t.goal;
    return `<div class="ms-row ${done ? 'done' : ''}"><span>${done ? '✔' : '・'} ${t.name}</span><span class="ms-bar"><i style="width:${(v / t.goal * 100).toFixed(1)}%"></i></span><small>${v.toLocaleString()}/${t.goal.toLocaleString()}${t.unit}</small></div>`;
  }).join('');
  return `<div class="mastery ${lv >= MASTERY_MAX ? 'max' : ''}"><div class="ms-head">熟練度 <b>${lv >= MASTERY_MAX ? '極み' : `${lv} / ${MASTERY_MAX}`}</b>${lv >= MASTERY_MAX ? ' ✨専用オーラ' : '<small>全部達成で専用オーラ</small>'}</div>${rows}</div>`;
}
