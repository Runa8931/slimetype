// ============================================================
//  キャラの くわしい 説明
//  バトル・サバイバルで じっさいに つかう 数値から 文章を 作る
//  (「どこから はじまって、どれだけ 上がるか」が わかるように)
// ============================================================

const pct = x => `${+(x * 100).toFixed(1)}%`;
const times = x => `${+x.toFixed(2)}倍`;

// ふつうの キャラ (とくせい なし) の 基本
const BASE_RULES = [
  '会心率6%・会心のダメージ1.5倍',
  'コンボ倍率: 1コンボごとに+0.5%、100コンボで最大1.5倍。ミスするとコンボは0',
  '普通の攻撃の威力 = 10 + 打ったキー数 × 6（5キーのお題で40）',
  '毒・やけど: 5秒間、毎秒最大HPの2.5%減る / こごえ: 3〜4秒間攻撃×0.7',
];

// 状態異常への 強さ (statusCut: 0 = ふつう / 0.5 = 半分 / 1 = きかない)
function statusLine(cut) {
  if (cut >= 1) return '毒・やけど・こごえにならない';
  if (cut > 0) return `毒・やけどの時間が${pct(cut)}短い（5秒→${+(5 * (1 - cut)).toFixed(1)}秒）`;
  return null;
}

// とくせい (バトル)
function traitLines(id, t) {
  const L = [];
  switch (id) {
    case 'purun':
      L.push(`ノーミスでお題を打ち切るたび、最大HPの${pct(t.heal)}回復`);
      L.push(statusLine(t.statusCut));
      break;
    case 'piriri': {
      const full = 2 + (t.critMax - 0.1) / 0.2;
      L.push(`会心率が打つ速さで上がる（普通のキャラは6%）`);
      L.push(`1秒に2打で10%、1打速くなるごとに+20%、1秒に${+full.toFixed(2)}打以上で最大${pct(t.critMax)}`);
      L.push(`会心のダメージ${times(t.critMult)}${t.critMult > 1.5 ? '（普通は1.5倍）' : '（普通と同じ）'}`);
      if (t.dodge) L.push(`敵の攻撃を${pct(t.dodge)}の確率でよける`);
      if (t.shockImmune) L.push('しびれ（ミスで自分にダメージ）が効かない');
      break;
    }
    case 'gotsun':
      L.push(`敵から受けるダメージを${pct(t.cut)}減らす`);
      L.push(`ミスしてもコンボが${pct(t.comboKeep)}残る（普通は0に戻る）`);
      L.push(t.freezeImmune ? '毒・やけど・こごえにならない' : '毒・やけどの時間が40%短い（5秒→3秒）');
      break;
    case 'homura':
      L.push(`コンボ倍率の上限が${times(1 + t.comboMax / 200)}（${t.comboMax}コンボで最大）。普通は1.5倍（100コンボ）`);
      if (t.burnImmune) L.push('敵のやけどが効かない');
      if (t.statusCut >= 1) L.push('毒も効かない');
      else if (t.statusCut > 0) L.push(`毒の時間が${pct(t.statusCut)}短い`);
      break;
    case 'moririn':
      L.push(`3秒ごとに最大HPの${pct(t.regen)}回復（1分で${pct(t.regen * 20)}）`);
      L.push(statusLine(t.statusCut));
      break;
    case 'kagemaru':
      L.push(`敵の攻撃ゲージがたまる速さを${pct(t.slow)}遅くする（攻撃される回数が減る）`);
      break;
    case 'ryumaru':
      L.push(`HPが${pct(t.rageAt)}より少ないと、お題の攻撃が${times(t.rageMult)}`);
      L.push(statusLine(t.statusCut));
      break;
    case 'kirari': {
      const n = Math.ceil(t.streakMax / t.streakStep - 1e-9);
      L.push(`ノーミスでお題を打ち切るたび攻撃+${pct(t.streakStep)}（${n}回続けて最大+${pct(t.streakMax)}）`);
      L.push('ミスしたお題を打ち切ると0に戻る');
      break;
    }
    case 'koorin':
      L.push(`攻撃を受けると${pct(t.counter)}の確率でやり返し、敵の攻撃ゲージを${pct(t.pushback)}戻す（次の攻撃が遅くなる）`);
      L.push(statusLine(t.statusCut));
      break;
    case 'fuwari':
      L.push(`お題を打ち切ると${pct(t.double)}の確率でもう1回追い打ち（ダメージは半分）`);
      L.push(statusLine(t.statusCut));
      break;
    case 'onpuru': {
      const full = t.speedFrom + t.speedMax / t.speedStep;
      L.push(`お題を1秒に${t.speedFrom}打より速く打つと、1打速いごとに攻撃+${pct(t.speedStep)}（1秒に${+full.toFixed(1)}打以上で最大+${pct(t.speedMax)}）`);
      L.push(statusLine(t.statusCut));
      break;
    }
    case 'dororin':
      L.push(`お題を打ち切るたび敵に毒が1つ重なる（最大${t.poisonMax}）。1つにつき毎秒敵の最大HPの${pct(t.poisonPct)}（最大で毎秒${pct(t.poisonPct * t.poisonMax)}）`);
      L.push(statusLine(t.statusCut));
      break;
    case 'gorurin':
      L.push(`与えたダメージの${pct(t.drain)}分HP回復`);
      L.push(`バトルのコイン+${pct(t.coinBonus)}`);
      L.push(statusLine(t.statusCut));
      break;
    case 'yukidarun':
      L.push(`お題を打ち切るたび雪玉+1（最大${t.snowMax}）。1個につき受けるダメージ-${pct(t.snowCut)}（最大-${pct(t.snowCut * t.snowMax)}）`);
      L.push('攻撃を受けると雪玉が1個減る');
      L.push(statusLine(t.statusCut));
      break;
    case 'saikoro':
      L.push(`お題を打ち切るたびサイコロを振る。出た目で攻撃が${t.dice.map((v, i) => `${i + 1}:×${+v.toFixed(2)}`).join('・')}`);
      L.push(`平均×${+(t.dice.reduce((a, b) => a + b, 0) / 6).toFixed(2)}`);
      L.push(statusLine(t.statusCut));
      break;
    case 'imomushi':
      L.push(`お題を打ち切るたび体が1つ伸びる（最大${t.segMax}）。1つにつき攻撃+${pct(t.segStep)}（最大+${pct(t.segStep * t.segMax)}）`);
      L.push('攻撃を受けると体が1つ縮む');
      L.push(statusLine(t.statusCut));
      break;
    case 'chochin':
      L.push(`お題を打ち切ったとき、敵の攻撃ゲージ（敵の下の「攻撃」のバー）がたまっているほど攻撃が強い。ゲージ0で+0%・半分で+${pct(t.gaugeBoost / 2)}・満タン前で+${pct(t.gaugeBoost)}`);
      L.push('敵の攻撃のすぐ後はボーナスが少ない。打つ速さとは関係ない（速く打てばお題の数が増えて得）');
      L.push(statusLine(t.statusCut));
      break;
    case 'torio':
      L.push('お題を打ち切ると3匹が順に攻撃。会心（6%・1.5倍）は1匹ずつ決まる');
      L.push(`ノーミスでお題を3つ続けて打ち切ると、3つ目の攻撃+${pct(t.trio)}（トリオボーナス）`);
      L.push(statusLine(t.statusCut));
      break;
    case 'yurarin':
      L.push(`お題ごとに最初のミス${t.forgive}回をなかったことにする（コンボも切れず、敵のゲージも増えない）`);
      L.push(`ミスをなかったことにしたときHP${pct(t.forgiveHeal)}回復`);
      L.push(statusLine(t.statusCut));
      break;
    case 'fuerin':
      L.push(`正しく1回打つとコンボが${+t.comboGain.toFixed(2)}増える（普通は1）。コンボ倍率の上限（1.5倍）に早く届く`);
      L.push('ミスするとコンボは0に戻る');
      L.push(statusLine(t.statusCut));
      break;
    case 'yuusharin':
      L.push(`会心率${pct(t.crit)}（普通は6%）・受けるダメージ-${pct(t.cut)}`);
      L.push(`コンボ倍率の上限${times(1 + t.comboMax / 200)}（${t.comboMax}コンボ）。普通は1.5倍`);
      L.push(statusLine(t.statusCut));
      break;
    case 'pitarin':
      L.push(`ノーミスで打ち切ったお題は必ず会心（ダメージ${times(t.perfectCrit)}）。ミスしたお題は普通と同じ6%・1.5倍`);
      L.push(statusLine(t.statusCut));
      break;
    case 'metarun': {
      const full = t.longFrom + Math.ceil(t.longMax / t.longStep - 1e-9);
      L.push(`${t.longFrom + 1}キー以上のお題は、1キー増えるごとに攻撃+${pct(t.longStep)}（${full}キー以上で最大+${pct(t.longMax)}）`);
      if (t.pierce) L.push('よろい（普通×0.5→×0.75）・ガード（×0.3→×0.6）を半分貫く');
      L.push(statusLine(t.statusCut));
      break;
    }
  }
  return L.filter(Boolean);
}

// ひっさつ (バトル)
function skillLines(id, s, def) {
  const L = [];
  const pw = s.power ? `威力${s.power}（普通の攻撃は5キーのお題で40）` : '';
  switch (id) {
    case 'purun':
      L.push(`HPを最大HPの${pct(s.heal)}回復し、毒・やけど・こごえを消す`);
      L.push(`次の1回の攻撃が${times(s.boost)}`);
      if (s.barrier) L.push(`水のバリア: 敵の攻撃を${s.barrier}回まるごと防ぐ`);
      break;
    case 'piriri':
      L.push(`雷で${pw}`);
      if (s.resetGauge) L.push('敵の攻撃ゲージを0に戻す');
      break;
    case 'gotsun':
      L.push(`ガード${s.guards}回: 敵の攻撃をまるごと防ぐ`);
      L.push(`防ぐたびに「防いだダメージ+威力${s.power}」の岩で反撃`);
      if (s.heal) L.push(`防ぐたびに最大HPの${pct(s.heal)}回復`);
      break;
    case 'homura':
      L.push(`炎で${pw}`);
      L.push(`敵を${s.burn}秒やけど: 毎秒敵の最大HPの3%（合計${s.burn * 3}%）`);
      break;
    case 'moririn':
      L.push(`${pw}で攻撃`);
      L.push(`HPを最大HPの${pct(s.heal)}回復し、毒・やけどを消す`);
      break;
    case 'kagemaru':
      L.push(`${pw}で攻撃`);
      L.push(`敵の攻撃ゲージを${s.bind}秒止める`);
      break;
    case 'ryumaru':
      L.push(`ブレスで${pw}`);
      L.push(`HPが減っているほど強い: HP半分で${times(1 + s.lowBoost / 2)}、残りわずかで最大${times(1 + s.lowBoost)}`);
      break;
    case 'kirari':
      L.push(`星で${pw}`);
      L.push('特性のリズムのボーナスも乗る');
      if (s.barrier) L.push(`光の壁: 敵の攻撃を${s.barrier}回まるごと防ぐ`);
      break;
    case 'koorin':
      L.push(`氷で${pw}`);
      L.push(`敵を${s.chill}秒こごえさせる: その間敵の攻撃ゲージが半分の速さ`);
      break;
    case 'fuwari':
      L.push(`風の刃で${pw}`);
      L.push(`次の敵の攻撃を${s.evade}回かわす`);
      break;
    case 'onpuru':
      L.push(`音の波で${pw}`);
      L.push(`次の${s.tempo}お題の攻撃が${times(s.tempoMult)}（テンポアップ）`);
      break;
    case 'dororin':
      L.push(`毒のしずくで${pw}`);
      L.push(`敵の毒+${s.addPoison}（最大より多くなれる）、${s.weaken}秒敵の攻撃を20%弱くする`);
      break;
    case 'gorurin':
      L.push(`金の嵐で${pw}`);
      L.push(`与えたダメージの${pct(s.skillDrain)}分HP回復`);
      break;
    case 'yukidarun':
      L.push(`雪玉で${pw}`);
      L.push(`雪玉1個につき威力+${pct(s.snowBoost)}（雪玉は減らない）`);
      break;
    case 'saikoro':
      L.push(`転がる体当たりで${pw}`);
      L.push(`次の${s.luck}回はサイコロで4・5・6の目しか出ない`);
      break;
    case 'imomushi':
      L.push(`体をぐるぐる回して${pw}`);
      L.push(`伸びた体1つにつき威力+${pct(s.segBoost)}`);
      break;
    case 'chochin':
      L.push(`人魂で${pw}`);
      L.push(`人魂が次の敵の攻撃を${s.guard}回防ぐ`);
      break;
    case 'torio':
      L.push(`3匹の3連撃で${pw}`);
      L.push('3回目は必ず会心（1.5倍）。合わせて約1.17倍');
      break;
    case 'yurarin':
      L.push(`しびれる触手で${pw}`);
      L.push(`${s.forgiveSecs}秒間ミスが全部なかったことになる`);
      break;
    case 'fuerin':
      L.push(`分身の体当たりで${pw}`);
      L.push(`今のコンボ1につき威力+${pct(s.comboBoost)}（最大+${pct(s.boostMax)}。コンボ${Math.round(s.boostMax / s.comboBoost)}で最大）`);
      break;
    case 'yuusharin':
      L.push(`剣で${pw}`);
      L.push(`HPを最大HPの${pct(s.heal)}回復し、敵の攻撃ゲージを0に戻す`);
      break;
    case 'pitarin':
      L.push(`月の光で${pw}`);
      L.push(`次の敵の攻撃を${s.reflect}回はね返す（受けるはずのダメージを敵に返す）`);
      break;
    case 'metarun':
      L.push(`鉄の拳で${pw}`);
      L.push(`敵を${s.brk}秒ブレイク: その間敵が受けるダメージ+30%`);
      break;
  }
  // ゲージの たまりかた
  const per = (0.7 + def.base.spd / 200) * s.charge;
  L.push(`ゲージ: 正しく1打つごとに${+per.toFixed(2)}%（約${Math.ceil(100 / per)}打で自動発動）。ミスで-3%${s.charge > 1 ? `。他より${pct(s.charge - 1)}早くたまる` : ''}`);
  return L.filter(Boolean);
}

// サバイバルでの とくせい
function survivalLine(id, stage, t) {
  const sv = SV_CHAR[id] || {};
  const w = typeof SV_WEAPONS !== 'undefined' && SV_WEAPONS[SV_START_WEAPON[id]];
  let x = '';
  if (id === 'purun' || id === 'moririn') x = `${sv.regen[stage]}秒ごとにHP1回復`;
  if (id === 'piriri') x = `足の速さ${times(sv.speed[stage])}`;
  if (id === 'homura') x = `武器のダメージ${times(sv.dmg[stage])}`;
  if (id === 'gotsun') x = `受けるダメージ${pct(1 - sv.hurt[stage])}カット`;
  if (id === 'kagemaru') x = `攻撃を受けたあと${sv.inv[stage]}秒無敵（普通は0.8秒）`;
  if (id === 'ryumaru') x = `HPが${pct(t.rageAt)}より少ないと武器のダメージ${times(t.rageMult)}`;
  if (id === 'kirari') x = `武器を撃つ間隔が${pct(1 - sv.cd[stage])}短い`;
  if (id === 'koorin') x = `敵の動きが${pct(1 - sv.eslow[stage])}遅い`;
  if (id === 'fuwari') x = `ジェムを吸い寄せる範囲${times(sv.magnet[stage])}`;
  if (id === 'metarun') x = `最大HP${times(sv.hp[stage])}`;
  if (id === 'onpuru') x = `足の速さ${times(sv.speed[stage])}`;
  if (id === 'dororin') x = `近くの敵に0.5秒ごと${sv.aura[stage]}の毒ダメージ`;
  if (id === 'gorurin') x = `コイン${times(sv.coin[stage])}`;
  if (id === 'yukidarun') x = `触れた敵が${sv.chill[stage]}秒遅くなる`;
  if (id === 'yuusharin') x = `武器のダメージ${times(sv.dmg[stage])}・受けるダメージ${pct(1 - sv.hurt[stage])}カット`;
  if (id === 'saikoro') x = `武器が${pct(sv.crit[stage])}の確率で会心（ダメージ2倍）`;
  if (id === 'imomushi') x = `最大HP${times(sv.hp[stage])}`;
  if (id === 'chochin') x = `武器のダメージ${times(sv.dmg[stage])}`;
  if (id === 'torio') x = `武器のダメージ${times(sv.dmg[stage])}`;
  if (id === 'yurarin') x = `受けるダメージ${pct(1 - sv.hurt[stage])}カット`;
  if (id === 'fuerin') x = `武器を撃つ間隔が${pct(1 - sv.cd[stage])}短い`;
  if (id === 'pitarin') x = `武器が${pct(sv.crit[stage])}の確率で会心（ダメージ2倍）`;
  return `${x}${w ? `。最初の武器「${w.name}」` : ''}`;
}

// 画面に 出す HTML
function abilityHtml(c) {
  const li = a => a.map(x => `<li>${x}</li>`).join('');
  const aw = c.awaken ? `<li class="aw-note">覚醒★${c.awaken}の分（${AWAKEN_BONUS[c.id].desc}×${c.awaken}）を含む</li>` : '';
  return `<div class="ability"><b>特性「${c.trait.name}」</b><ul>${li(traitLines(c.id, c.trait))}${aw}</ul></div>
    <div class="ability"><b>必殺「${c.skill.name}」</b><ul>${li(skillLines(c.id, c.skill, c.def))}</ul></div>
    <div class="ability sv"><b>サバイバル</b><ul><li>${survivalLine(c.id, c.stage, c.trait)}</li></ul></div>`;
}
