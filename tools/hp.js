// 全キャラの「勝率」と「勝ったときの のこり HP」を 難易度ごとに 出す
// (推奨レベル・むいている 打鍵数・正確率 93%。SSR の +5% も ゲームと おなじく ふくむ)
// つかいかた: node tools/hp.js [回数=60] [キャラ...]
const D = require('../js/data.js'); const { rate, diffEnemy, DIFFS } = require('./bsim.js');
const n = +process.argv[2] || 60;
const only = process.argv.slice(3);
const pick = D.ENEMIES.map((e, g) => ({ e, g })).filter(x => x.g % 4 === 0 || x.e.boss);
function score(c) {
  const res = {};
  for (const [dk, bd] of Object.entries(DIFFS)) {
    const a = { n: { w: 0, hp: 0, c: 0 }, b: { w: 0, hp: 0, c: 0 } };
    for (const { e: e0, g } of pick) {
      const e = diffEnemy(e0, g, bd); global.STATK = e.lv > 120 ? 1 + 0.02 * (e.lv - 120) : 1;
      const r = rate(c, e.lv, e, bd.kpm, 0.93, n); const x = e.boss ? a.b : a.n;
      x.w += r.w; x.hp += r.hp * r.w; x.c++;
    }
    res[dk] = {}; for (const k of ['n', 'b']) res[dk][k] = { w: a[k].w / a[k].c, hp: a[k].w ? a[k].hp / a[k].w : 0 };
  }
  return res;
}
module.exports = { score };
if (require.main === module) {
  const f = x => `${String(Math.round(x.w * 100)).padStart(3)}% 残${String(Math.round(x.hp * 100)).padStart(2)}%`;
  console.log('キャラ      難易度   ふつうの敵(勝率 残りHP)  ボス');
  for (const c of only.length ? only : Object.keys(D.CHARACTERS)) {
    const s = score(c);
    for (const dk of Object.keys(DIFFS)) console.log((dk === 'beg' ? c : '').padEnd(11), dk.padEnd(6), f(s[dk].n).padEnd(14), f(s[dk].b));
  }
}
