// ============================================================
//  キャラの くわしい 説明
//  バトル・サバイバルで じっさいに つかう 数値から 文章を 作る
//  (「どこから はじまって、どれだけ 上がるか」が わかるように)
// ============================================================

const pct = x => `${+(x * 100).toFixed(1)}%`;
const times = x => `${+x.toFixed(2)} 倍`;

// ふつうの キャラ (とくせい なし) の 基本
const BASE_RULES = [
  '会心率 6%・会心の ダメージ 1.5 倍',
  'コンボ倍率: 1 コンボごとに +0.5%、100 コンボで 最大 1.5 倍。ミスすると コンボは 0',
  'ふつうの 攻撃の 威力 = 10 + 打った キー数 × 6 (5 キーの お題で 40)',
  'どく・やけど: 5 秒間、毎秒 最大HPの 2.5% へる / こごえ: 3〜4 秒間 攻撃 × 0.7',
];

// 状態異常への 強さ (statusCut: 0 = ふつう / 0.5 = 半分 / 1 = きかない)
function statusLine(cut) {
  if (cut >= 1) return 'どく・やけど・こごえに ならない';
  if (cut > 0) return `どく・やけどの 時間が ${pct(cut)} みじかい (5 秒 → ${+(5 * (1 - cut)).toFixed(1)} 秒)`;
  return null;
}

// とくせい (バトル)
function traitLines(id, t) {
  const L = [];
  switch (id) {
    case 'purun':
      L.push(`ノーミスで お題を 打ち切るたび、最大HPの ${pct(t.heal)} 回復`);
      L.push(statusLine(t.statusCut));
      break;
    case 'piriri': {
      const full = 2 + (t.critMax - 0.1) / 0.2;
      L.push(`会心率が 打つ速さで 上がる (ふつうの キャラは 6%)`);
      L.push(`1 秒に 2 打で 10%、1 打 速くなるごとに +20%、1 秒に ${+full.toFixed(2)} 打 以上で 最大 ${pct(t.critMax)}`);
      L.push(`会心の ダメージ ${times(t.critMult)}${t.critMult > 1.5 ? ' (ふつうは 1.5 倍)' : ' (ふつうと 同じ)'}`);
      if (t.dodge) L.push(`敵の 攻撃を ${pct(t.dodge)} の 確率で よける`);
      if (t.shockImmune) L.push('しびれ (ミスで 自分に ダメージ) が きかない');
      break;
    }
    case 'gotsun':
      L.push(`敵から うける ダメージを ${pct(t.cut)} へらす`);
      L.push(`ミスしても コンボが ${pct(t.comboKeep)} のこる (ふつうは 0 に もどる)`);
      L.push(t.freezeImmune ? 'どく・やけど・こごえに ならない' : 'どく・やけどの 時間が 40% みじかい (5 秒 → 3 秒)');
      break;
    case 'homura':
      L.push(`コンボ倍率の 上限が ${times(1 + t.comboMax / 200)} (${t.comboMax} コンボで 最大)。ふつうは 1.5 倍 (100 コンボ)`);
      if (t.burnImmune) L.push('敵の やけどが きかない');
      if (t.statusCut >= 1) L.push('どくも きかない');
      else if (t.statusCut > 0) L.push(`どくの 時間が ${pct(t.statusCut)} みじかい`);
      break;
    case 'moririn':
      L.push(`3 秒ごとに 最大HPの ${pct(t.regen)} 回復 (1 分で ${pct(t.regen * 20)})`);
      L.push(statusLine(t.statusCut));
      break;
    case 'kagemaru':
      L.push(`敵の 攻撃ゲージが たまる 速さを ${pct(t.slow)} おそくする (攻撃される 回数が へる)`);
      break;
    case 'ryumaru':
      L.push(`HP が ${pct(t.rageAt)} より 少ないと、お題の 攻撃が ${times(t.rageMult)}`);
      L.push(statusLine(t.statusCut));
      break;
    case 'kirari': {
      const n = Math.ceil(t.streakMax / t.streakStep - 1e-9);
      L.push(`ノーミスで お題を 打ち切るたび 攻撃 +${pct(t.streakStep)} (${n} 回 つづけて 最大 +${pct(t.streakMax)})`);
      L.push('ミスした お題を 打ち切ると 0 に もどる');
      break;
    }
    case 'koorin':
      L.push(`攻撃を うけると ${pct(t.counter)} の 確率で やりかえし、敵の 攻撃ゲージを ${pct(t.pushback)} もどす (つぎの 攻撃が おそくなる)`);
      L.push(statusLine(t.statusCut));
      break;
    case 'fuwari':
      L.push(`お題を 打ち切ると ${pct(t.double)} の 確率で もう 1 回 おいうち (ダメージは 半分)`);
      L.push(statusLine(t.statusCut));
      break;
    case 'metarun': {
      const full = t.longFrom + Math.ceil(t.longMax / t.longStep - 1e-9);
      L.push(`${t.longFrom + 1} キー 以上の お題は、1 キー ふえるごとに 攻撃 +${pct(t.longStep)} (${full} キー 以上で 最大 +${pct(t.longMax)})`);
      if (t.pierce) L.push('よろい (ふつう ×0.5 → ×0.75)・ガード (×0.3 → ×0.6) を 半分 つらぬく');
      L.push(statusLine(t.statusCut));
      break;
    }
  }
  return L.filter(Boolean);
}

// ひっさつ (バトル)
function skillLines(id, s, def) {
  const L = [];
  const pw = s.power ? `威力 ${s.power} (ふつうの 攻撃は 5 キーの お題で 40)` : '';
  switch (id) {
    case 'purun':
      L.push(`HP を 最大HPの ${pct(s.heal)} 回復し、どく・やけど・こごえを 消す`);
      L.push(`つぎの 1 回の 攻撃が ${times(s.boost)}`);
      if (s.barrier) L.push(`水のバリア: 敵の 攻撃を ${s.barrier} 回 まるごと ふせぐ`);
      break;
    case 'piriri':
      L.push(`かみなりで ${pw}`);
      if (s.resetGauge) L.push('敵の 攻撃ゲージを 0 に もどす');
      break;
    case 'gotsun':
      L.push(`ガード ${s.guards} 回: 敵の 攻撃を まるごと ふせぐ`);
      L.push(`ふせぐたびに「ふせいだ ダメージ + 威力 ${s.power}」の 岩で 反撃`);
      if (s.heal) L.push(`ふせぐたびに 最大HPの ${pct(s.heal)} 回復`);
      break;
    case 'homura':
      L.push(`ほのおで ${pw}`);
      L.push(`敵を ${s.burn} 秒 やけど: 毎秒 敵の 最大HPの 3% (合計 ${s.burn * 3}%)`);
      break;
    case 'moririn':
      L.push(`${pw} で 攻撃`);
      L.push(`HP を 最大HPの ${pct(s.heal)} 回復し、どく・やけどを 消す`);
      break;
    case 'kagemaru':
      L.push(`${pw} で 攻撃`);
      L.push(`敵の 攻撃ゲージを ${s.bind} 秒 とめる`);
      break;
    case 'ryumaru':
      L.push(`ブレスで ${pw}`);
      L.push(`HP が へっているほど 強い: HP 半分で ${times(1 + s.lowBoost / 2)}、のこり わずかで 最大 ${times(1 + s.lowBoost)}`);
      break;
    case 'kirari':
      L.push(`ほしで ${pw}`);
      L.push('とくせいの リズムの ボーナスも のる');
      if (s.barrier) L.push(`ひかりのかべ: 敵の 攻撃を ${s.barrier} 回 まるごと ふせぐ`);
      break;
    case 'koorin':
      L.push(`こおりで ${pw}`);
      L.push(`敵を ${s.chill} 秒 こごえさせる: その間 敵の 攻撃ゲージが 半分の 速さ`);
      break;
    case 'fuwari':
      L.push(`かぜの 刃で ${pw}`);
      L.push(`つぎの 敵の 攻撃を ${s.evade} 回 かわす`);
      break;
    case 'metarun':
      L.push(`てつの こぶしで ${pw}`);
      L.push(`敵を ${s.brk} 秒 ブレイク: その間 敵が うける ダメージ +30%`);
      break;
  }
  // ゲージの たまりかた
  const per = (0.7 + def.base.spd / 200) * s.charge;
  L.push(`ゲージ: 正しく 1 打つごとに ${+per.toFixed(2)}% (約 ${Math.ceil(100 / per)} 打で 自動発動)。ミスで -3%${s.charge > 1 ? `。ほかより ${pct(s.charge - 1)} はやく たまる` : ''}`);
  return L.filter(Boolean);
}

// サバイバルでの とくせい
function survivalLine(id, stage, t) {
  const sv = SV_CHAR[id] || {};
  const w = typeof SV_WEAPONS !== 'undefined' && SV_WEAPONS[SV_START_WEAPON[id]];
  let x = '';
  if (id === 'purun' || id === 'moririn') x = `${sv.regen[stage]} 秒ごとに HP 1 回復`;
  if (id === 'piriri') x = `足の 速さ ${times(sv.speed[stage])}`;
  if (id === 'homura') x = `武器の ダメージ ${times(sv.dmg[stage])}`;
  if (id === 'gotsun') x = `うける ダメージ ${pct(1 - sv.hurt[stage])} カット`;
  if (id === 'kagemaru') x = `攻撃を うけたあと ${sv.inv[stage]} 秒 むてき (ふつうは 0.8 秒)`;
  if (id === 'ryumaru') x = `HP が ${pct(t.rageAt)} より 少ないと 武器の ダメージ ${times(t.rageMult)}`;
  if (id === 'kirari') x = `武器を うつ 間かくが ${pct(1 - sv.cd[stage])} みじかい`;
  if (id === 'koorin') x = `敵の 動きが ${pct(1 - sv.eslow[stage])} おそい`;
  if (id === 'fuwari') x = `ジェムを すいよせる 範囲 ${times(sv.magnet[stage])}`;
  if (id === 'metarun') x = `最大HP ${times(sv.hp[stage])}`;
  return `${x}${w ? `。さいしょの 武器「${w.name}」` : ''}`;
}

// 画面に 出す HTML
function abilityHtml(c) {
  const li = a => a.map(x => `<li>${x}</li>`).join('');
  const aw = c.awaken ? `<li class="aw-note">かくせい ★${c.awaken} の ぶん (${AWAKEN_BONUS[c.id].desc} × ${c.awaken}) を ふくむ</li>` : '';
  return `<div class="ability"><b>とくせい「${c.trait.name}」</b><ul>${li(traitLines(c.id, c.trait))}${aw}</ul></div>
    <div class="ability"><b>ひっさつ「${c.skill.name}」</b><ul>${li(skillLines(c.id, c.skill, c.def))}</ul></div>
    <div class="ability sv"><b>サバイバル</b><ul><li>${survivalLine(c.id, c.stage, c.trait)}</li></ul></div>`;
}
