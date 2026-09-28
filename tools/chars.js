// ゲーム ぜんたいで キャラの 強さを くらべる (推奨レベル・むいている 打鍵数・正確率 93%)
// つかいかた: node tools/chars.js
const D = require('../js/data.js'); const { rate, diffEnemy, DIFFS } = require('./bsim.js');
const pick = D.ENEMIES.map((e, g) => ({ e, g })).filter(x => x.g % 4 === 0 || x.e.boss);
function score(c, n = 30) {
  const res = {};
  for (const [dk, bd] of Object.entries(DIFFS)) {
    let w = 0, m = 0, bw = 0, b = 0;
    for (const { e: e0, g } of pick) {
      const e = diffEnemy(e0, g, bd); global.STATK = e.lv > 120 ? 1 + 0.02 * (e.lv - 120) : 1;
      const r = rate(c, e.lv, e, bd.kpm, 0.93, n); if (e.boss) { bw += r.w; b++; } else { w += r.w; m++; }
    }
    res[dk] = { n: w / m, b: bw / b };
  }
  return res;
}
module.exports = { score };
if (require.main === module) {
  console.log('キャラ      初心者(ふつう/ボス)  中級者         上級者');
  const f = x => `${String(Math.round(x.n * 100)).padStart(3)}%/${String(Math.round(x.b * 100)).padStart(3)}%`;
  for (const c of Object.keys(D.CHARACTERS)) { const s = score(c); console.log(c.padEnd(10), f(s.beg).padEnd(14), f(s.mid).padEnd(14), f(s.adv)); }
}
