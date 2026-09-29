// キャラごとに 能力値 (HP・こうげき・ぼうぎょ) の 倍率を さがして 強さを そろえる
// つかいかた: node tools/bal.js onpuru pitarin   (名前を わたすと その キャラだけ)
// とくべつな キャラの +5% は のぞいて そろえる (そろえた あとに 5% ぶん 強く なる)
global.NO_SPECIAL = true;
const D = require('../js/data.js'); const { score } = require('./chars.js');
const one = (c, n) => { const s = score(c, n); return (s.beg.n + s.mid.n + s.adv.n + 1.5 * (s.beg.b + s.mid.b + s.adv.b)) / 7.5; };
const all = Object.keys(D.CHARACTERS);
const ref = all.filter(c => !process.argv.slice(2).includes(c)).map(c => one(c, 16)).sort((a, b) => a - b);
const target = ref[Math.floor(ref.length / 2)];
console.log('めやす (まんなかの キャラ):', Math.round(target * 100));
for (const c of (process.argv.length > 2 ? process.argv.slice(2) : all)) {
  const b0 = { ...D.CHARACTERS[c].base };
  let lo = 0.75, hi = 1.3;
  for (let it = 0; it < 7; it++) {
    const m = (lo + hi) / 2;
    D.CHARACTERS[c].base = { hp: b0.hp * m, atk: b0.atk * m, def: b0.def * m, spd: b0.spd };
    if (one(c, 14) > target) hi = m; else lo = m;
  }
  D.CHARACTERS[c].base = b0;
  const k = (lo + hi) / 2;
  console.log(c, 'ばいりつ', k.toFixed(3), '→', JSON.stringify({ hp: Math.round(b0.hp * k), atk: Math.round(b0.atk * k), def: Math.round(b0.def * k), spd: b0.spd }));
}
