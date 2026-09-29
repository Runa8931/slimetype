// ============================================================
//  バトルの 簡易シミュレーター (強さの 調整用。ゲームでは つかわない)
//  battle.js の 計算を なぞる。13 キャラ・敵の 特殊能力・難易度に 対応
//  つかいかた: node tools/chars.js など
// ============================================================
const D = require('../js/data.js');
const KEYS = { easy: [7], normal: [7, 12, 12], hard: [12, 22, 22] };
const wordKeys = d => { const k = KEYS[d]; return k[Math.floor(Math.random() * k.length)]; };

// cid: キャラ / L: 自分の レベル / e: 敵 (power・interval は 難易度を かけた あと) / kpm: 1 分の 打鍵数 / acc: 正確率
function sim(cid, L, e, kpm, acc) {
  const c = D.CHARACTERS[cid], f = c.forms[D.evoStage(L)], tr = f.trait, sk = f.skill;
  const st = D.calcStats(c.base, L);
  if (global.STATK) for (const k in st) st[k] = Math.round(st[k] * global.STATK); // かくせいの ぶん
  if (!global.NO_SPECIAL && D.charRank(cid)) for (const k of ['hp', 'atk', 'def']) st[k] = Math.round(st[k] * D.SPECIAL_STAT); // とくべつな キャラ +5%
  const es = D.calcStats({ ...e.base, spd: 50 }, e.lv);
  const has = a => e.abilities.includes(a);
  const p = { hp: st.hp * 3, max: st.hp * 3, skill: 0, shield: 0, boost: 1, barrier: 0, evade: 0, reflect: 0, poison: 0 };
  const en = { hp: Math.round(es.hp * D.ENEMY_HP_SCALE), g: 0, atk: 0, angry: false, dbl: false, phase: 0, heads: 1 }; en.max = en.hp;
  let cacc = 0, t = 0, combo = 0, keys = wordKeys(e.diff), typed = 0, wstart = 0, wmiss = false, chill = 0, shell = 0, nextShell = 4, nextRegen = 8;
  let hidden = 0, nextHide = 6, wind = 0, nextWind = 5, words = 0, thunderAt = 0, thunderW = 0, nextThunder = 5;
  let burnUntil = 0, bindUntil = 0, nextRegenP = 3, eChill = 0, breakUntil = 0, streak = 0, tempo = 0, tempoMult = 1, ePoison = 0, weak = 0, snow = 0;
  const dt = 0.02, kps = kpm / 60; let keyT = 0;
  const statusCut = cid === 'gotsun' ? (tr.freezeImmune ? 1 : 0.4) : (tr.statusCut || 0);
  const skDmg = (mult = 1) => D.calcDamage(L, sk.power, st.atk, es.def) * 0.96 * mult * (breakUntil > t ? 1.3 : 1);
  while (t < 400) {
    t += dt;
    if (has('shell') && t >= nextShell) { shell = t + 3; nextShell = t + 10; }
    if (has('regen') && t >= nextRegen) { nextRegen += 8; en.hp = Math.min(en.max, en.hp + en.max * 0.06); }
    const hideAb = has('fade') || has('ink') || has('blizzard') || has('sandstorm') || (has('demon') && en.phase >= 1);
    if (hideAb && t >= nextHide) { hidden = t + 3.5; nextHide = t + (e.boss ? 9 : 10.5); }
    if (has('wind') && t >= nextWind) { wind = t + 4; nextWind = t + 11; }
    if (has('thunder') && !thunderAt && t >= nextThunder) { thunderAt = t + 3; thunderW = words; nextThunder = t + (e.boss ? 8 : 11); }
    if (thunderAt) { if (words > thunderW) thunderAt = 0; else if (t >= thunderAt) { thunderAt = 0; p.hp -= p.max * (e.boss ? 0.15 : 0.12); } }
    if (tr.regen && t >= nextRegenP) { nextRegenP += 3; p.hp = Math.min(p.max, p.hp + p.max * tr.regen); }
    const sec = Math.floor(t - dt) !== Math.floor(t);
    if (burnUntil > t && sec) en.hp -= Math.max(1, Math.round(en.max * 0.03));
    if (ePoison > 0 && sec) en.hp -= Math.max(1, Math.round(en.max * tr.poisonPct * ePoison));
    if (p.poison > t && sec) p.hp -= Math.max(1, Math.round(p.max * 0.025));
    let iv = e.interval / 1000; if (en.angry) iv *= has('dragon') ? 0.72 : 0.7;
    if (bindUntil <= t) en.g += dt / iv * (1 - (tr.slow || 0)) * (eChill > t ? 0.5 : 1);
    if (en.g >= 1) {
      en.g = 0; en.atk++;
      const breath = has('dragon') && en.angry && en.atk % 3 === 0, charged = has('charge') && en.atk % 3 === 0;
      let dmg = D.calcDamage(e.lv, e.power, es.atk, st.def) * (0.85 + Math.random() * 0.15);
      if (breath) dmg *= 1.5; if (charged) dmg *= 1.8;
      if (cid === 'gotsun' || cid === 'yuusharin') dmg *= 1 - tr.cut;
      if (cid === 'yukidarun') dmg *= 1 - tr.snowCut * snow;
      if (weak > t) dmg *= 0.8;
      const hits = [Math.max(1, Math.round(dmg))]; if (en.dbl) hits.push(Math.round(dmg * 0.6)); for (let h = 1; h < en.heads; h++) hits.push(Math.round(dmg * 0.5));
      for (const h of hits) {
        if (p.barrier > 0) { p.barrier--; continue; }
        if (p.reflect > 0) { p.reflect--; en.hp -= h; continue; }
        if (p.evade > 0) { p.evade--; continue; }
        if (cid === 'piriri' && Math.random() < tr.dodge) continue;
        if (p.shield > 0) { p.shield--; en.hp -= h + D.calcDamage(L, sk.power, st.atk, es.def); if (sk.heal) p.hp = Math.min(p.max, p.hp + p.max * sk.heal); continue; }
        p.hp -= h;
        if (cid === 'yukidarun' && snow > 0) snow--;
        if (cid === 'koorin' && Math.random() < tr.counter) en.g = Math.max(0, en.g - tr.pushback);
        if (has('poison') && statusCut < 1 && !(tr.burnImmune && e.statusName === 'やけど')) p.poison = t + 5 * (1 - statusCut);
        if ((has('freeze') || has('blizzard')) && statusCut < 1 && !tr.freezeImmune) chill = t + (has('freeze') ? 4 : 3);
        if (has('mud')) { hidden = Math.max(hidden, t + 2.5); p.skill = Math.max(0, p.skill - 10); }
        if (has('demon') && en.phase >= 2) p.skill = Math.max(0, p.skill - 10);
      }
    }
    if (p.hp <= 0) return { win: false, t, hp: 0 };
    let speed = hidden > t ? 0.75 : 1; if (wind > t) speed *= 0.85;
    keyT += dt * kps * speed;
    while (keyT >= 1) {
      keyT -= 1;
      if (typed === 0) wstart = t;
      if (Math.random() > acc) {
        wmiss = true; combo = cid === 'gotsun' ? Math.floor(combo * tr.comboKeep) : 0; cacc = 0; en.g = Math.min(0.99, en.g + 0.04); p.skill = Math.max(0, p.skill - 3);
        if (has('shock') && !(cid === 'piriri' && tr.shockImmune)) p.hp -= Math.max(1, Math.round(p.max * 0.03));
        if (has('sweet')) en.hp = Math.min(en.max, en.hp + en.max * 0.015);
        continue;
      }
      typed++;
      if (tr.comboGain) { cacc += tr.comboGain; const a = Math.floor(cacc); cacc -= a; combo += a; } else combo++; // ふえりん
      p.skill = Math.min(100, p.skill + (0.7 + c.base.spd / 200) * sk.charge);
      if (p.skill >= 100) {
        p.skill = 0;
        if (cid === 'purun') { p.hp = Math.min(p.max, p.hp + p.max * sk.heal); p.poison = 0; chill = 0; p.boost = sk.boost; p.barrier = sk.barrier; }
        if (cid === 'piriri') { en.hp -= skDmg(); if (sk.resetGauge) en.g = 0; }
        if (cid === 'gotsun') p.shield = sk.guards;
        if (cid === 'homura') { en.hp -= skDmg(); burnUntil = t + sk.burn; }
        if (cid === 'moririn') { en.hp -= skDmg(); p.hp = Math.min(p.max, p.hp + p.max * sk.heal); p.poison = 0; }
        if (cid === 'kagemaru') { en.hp -= skDmg(); bindUntil = t + sk.bind; }
        if (cid === 'ryumaru') en.hp -= skDmg(1 + sk.lowBoost * (1 - Math.max(0, p.hp / p.max)));
        if (cid === 'kirari') { en.hp -= skDmg(1 + Math.min(tr.streakMax, streak * tr.streakStep)); if (sk.barrier) p.barrier = Math.max(p.barrier, sk.barrier); }
        if (cid === 'koorin') { en.hp -= skDmg(); eChill = t + sk.chill; }
        if (cid === 'fuwari') { en.hp -= skDmg(); p.evade = sk.evade; }
        if (cid === 'metarun') { en.hp -= skDmg(); breakUntil = t + sk.brk; }
        if (cid === 'onpuru') { en.hp -= skDmg(); tempo = sk.tempo; tempoMult = sk.tempoMult; }
        if (cid === 'pitarin') { en.hp -= skDmg(); p.reflect = sk.reflect; }
        if (cid === 'dororin') { en.hp -= skDmg(); ePoison = Math.min(tr.poisonMax + sk.addPoison, ePoison + sk.addPoison); weak = t + sk.weaken; }
        if (cid === 'gorurin') { const d = skDmg(); en.hp -= d; p.hp = Math.min(p.max, p.hp + d * sk.skillDrain); }
        if (cid === 'yukidarun') en.hp -= skDmg(1 + sk.snowBoost * snow);
        if (cid === 'yuusharin') { en.hp -= skDmg(); p.hp = Math.min(p.max, p.hp + p.max * sk.heal); en.g = 0; }
        if (cid === 'fuerin') en.hp -= skDmg(1 + Math.min(sk.boostMax, combo * sk.comboBoost));
      }
      if (typed >= keys) {
        const secs = Math.max(0.2, t - wstart), kpsw = keys / secs;
        let dmg = D.calcDamage(L, D.wordPower(keys), st.atk, es.def) * (1 + Math.min(combo, tr.comboMax || 100) / 200) * p.boost; p.boost = 1;
        if (chill > t) dmg *= 0.7;
        if (cid === 'ryumaru' && p.hp / p.max < tr.rageAt) dmg *= tr.rageMult;
        if (cid === 'kirari') { streak = wmiss ? 0 : streak + 1; dmg *= 1 + Math.min(tr.streakMax, streak * tr.streakStep); }
        if (cid === 'onpuru' && kpsw > tr.speedFrom) dmg *= 1 + Math.min(tr.speedMax, (kpsw - tr.speedFrom) * tr.speedStep);
        if (tempo > 0) { dmg *= tempoMult; tempo--; }
        if (cid === 'metarun' && keys > tr.longFrom) dmg *= 1 + Math.min(tr.longMax, (keys - tr.longFrom) * tr.longStep);
        if (cid === 'dororin') ePoison = Math.min(tr.poisonMax, ePoison + 1);
        if (cid === 'yukidarun') snow = Math.min(tr.snowMax, snow + 1);
        let cr = tr.crit || 0.06, cm = 1.5;
        if (cid === 'piriri') { cr = 0.1 + Math.min(tr.critMax - 0.1, Math.max(0, (kpsw - 2) * 0.2)); cm = tr.critMult; }
        if (cid === 'pitarin' && !wmiss) { cr = 1; cm = tr.perfectCrit; }
        if (Math.random() < cr) dmg *= cm;
        if (has('armor') && combo < 30) dmg *= tr.pierce ? 0.75 : 0.5;
        if (shell > t) dmg *= tr.pierce ? 0.6 : 0.3;
        if (breakUntil > t) dmg *= 1.3;
        if (cid === 'fuwari' && Math.random() < tr.double) dmg *= 1.5;
        en.hp -= dmg * 0.95;
        if (cid === 'gorurin') p.hp = Math.min(p.max, p.hp + dmg * 0.95 * tr.drain);
        if (cid === 'purun' && !wmiss) p.hp = Math.min(p.max, p.hp + p.max * tr.heal);
        typed = 0; wmiss = false; words++; keys = wordKeys(e.diff);
      }
    }
    if (has('demon')) { if (en.phase === 0 && en.hp <= en.max * 2 / 3) en.phase = 1; if (en.phase === 1 && en.hp <= en.max / 3) { en.phase = 2; en.angry = true; } }
    if (has('ink') && en.hp <= en.max / 2) en.dbl = true;
    if (has('hydra')) en.heads = en.hp <= en.max / 3 ? 3 : en.hp <= en.max * 2 / 3 ? 2 : 1;
    if ((has('rage') || has('dragon')) && en.hp <= en.max / 2) en.angry = true;
    if (en.hp <= 0) return { win: true, t, hp: p.hp / p.max };
  }
  return { win: false, t, hp: p.hp / p.max };
}

function rate(cid, L, e, kpm, acc, n = 200) {
  let w = 0, hp = 0, tt = 0;
  for (let i = 0; i < n; i++) { const r = sim(cid, L, e, kpm, acc); if (r.win) { w++; hp += r.hp; } tt += r.t; }
  return { w: w / n, hp: w ? hp / w : 0, t: tt / n };
}

// 難易度を かけた 敵 (battle.js の diffK と おなじ)
const HP0 = D.ENEMY_HP_SCALE;
function diffEnemy(e0, g, bd) {
  const k = bd.k * (bd.ramp ? bd.ramp + (1 - bd.ramp) * g / (D.MAIN_STAGES - 1) : 1);
  D.ENEMY_HP_SCALE = HP0 * Math.pow(k, 0.7);
  return { ...e0, power: e0.power * k, interval: e0.interval / Math.pow(k, 0.25) };
}
const DIFFS = { beg: { k: 0.5, kpm: 100 }, mid: { k: 0.9, kpm: 200 }, adv: { k: 1.65, ramp: 0.8, kpm: 350 } };

module.exports = { sim, rate, diffEnemy, DIFFS };
