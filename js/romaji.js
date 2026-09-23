// ============================================================
//  ローマ字入力判定エンジン
//  「し」= shi / si / ci のような表記ゆれ、「っ」「ん」の特殊処理に対応
// ============================================================

// 先頭の候補が画面に表示される「おすすめ入力」になる
const KANA_TABLE = {
  'あ': ['a'], 'い': ['i', 'yi'], 'う': ['u', 'wu', 'whu'], 'え': ['e'], 'お': ['o'],
  'か': ['ka', 'ca'], 'き': ['ki'], 'く': ['ku', 'cu', 'qu'], 'け': ['ke'], 'こ': ['ko', 'co'],
  'さ': ['sa'], 'し': ['si', 'shi', 'ci'], 'す': ['su'], 'せ': ['se', 'ce'], 'そ': ['so'],
  'た': ['ta'], 'ち': ['ti', 'chi'], 'つ': ['tsu', 'tu'], 'て': ['te'], 'と': ['to'],
  'な': ['na'], 'に': ['ni'], 'ぬ': ['nu'], 'ね': ['ne'], 'の': ['no'],
  'は': ['ha'], 'ひ': ['hi'], 'ふ': ['fu', 'hu'], 'へ': ['he'], 'ほ': ['ho'],
  'ま': ['ma'], 'み': ['mi'], 'む': ['mu'], 'め': ['me'], 'も': ['mo'],
  'や': ['ya'], 'ゆ': ['yu'], 'よ': ['yo'],
  'ら': ['ra'], 'り': ['ri'], 'る': ['ru'], 'れ': ['re'], 'ろ': ['ro'],
  'わ': ['wa'], 'を': ['wo'], 'ん': ['nn', 'xn'],
  'が': ['ga'], 'ぎ': ['gi'], 'ぐ': ['gu'], 'げ': ['ge'], 'ご': ['go'],
  'ざ': ['za'], 'じ': ['ji', 'zi'], 'ず': ['zu'], 'ぜ': ['ze'], 'ぞ': ['zo'],
  'だ': ['da'], 'ぢ': ['di'], 'づ': ['du'], 'で': ['de'], 'ど': ['do'],
  'ば': ['ba'], 'び': ['bi'], 'ぶ': ['bu'], 'べ': ['be'], 'ぼ': ['bo'],
  'ぱ': ['pa'], 'ぴ': ['pi'], 'ぷ': ['pu'], 'ぺ': ['pe'], 'ぽ': ['po'],
  'ぁ': ['xa', 'la'], 'ぃ': ['xi', 'li'], 'ぅ': ['xu', 'lu'], 'ぇ': ['xe', 'le'], 'ぉ': ['xo', 'lo'],
  'ゃ': ['xya', 'lya'], 'ゅ': ['xyu', 'lyu'], 'ょ': ['xyo', 'lyo'],
  'っ': ['xtu', 'ltu', 'xtsu', 'ltsu'], 'ゔ': ['vu'],
  'ー': ['-'], '、': [','], '。': ['.'], '！': ['!'], '？': ['?'], '　': [' '],
  // 拗音など 2 文字で 1 まとまり
  'きゃ': ['kya'], 'きゅ': ['kyu'], 'きょ': ['kyo'], 'きぇ': ['kye'],
  'しゃ': ['sha', 'sya'], 'しゅ': ['shu', 'syu'], 'しょ': ['sho', 'syo'], 'しぇ': ['she', 'sye'],
  'ちゃ': ['cha', 'tya', 'cya'], 'ちゅ': ['tyu', 'chu', 'cyu'], 'ちょ': ['cho', 'tyo', 'cyo'], 'ちぇ': ['che', 'tye', 'cye'],
  'にゃ': ['nya'], 'にゅ': ['nyu'], 'にょ': ['nyo'],
  'ひゃ': ['hya'], 'ひゅ': ['hyu'], 'ひょ': ['hyo'],
  'みゃ': ['mya'], 'みゅ': ['myu'], 'みょ': ['myo'],
  'りゃ': ['rya'], 'りゅ': ['ryu'], 'りょ': ['ryo'],
  'ぎゃ': ['gya'], 'ぎゅ': ['gyu'], 'ぎょ': ['gyo'],
  'じゃ': ['ja', 'zya', 'jya'], 'じゅ': ['ju', 'zyu', 'jyu'], 'じょ': ['jo', 'zyo', 'jyo'], 'じぇ': ['je', 'zye', 'jye'],
  'ぢゃ': ['dya'], 'ぢゅ': ['dyu'], 'ぢょ': ['dyo'],
  'びゃ': ['bya'], 'びゅ': ['byu'], 'びょ': ['byo'],
  'ぴゃ': ['pya'], 'ぴゅ': ['pyu'], 'ぴょ': ['pyo'],
  'ふぁ': ['fa'], 'ふぃ': ['fi'], 'ふぇ': ['fe'], 'ふぉ': ['fo'],
  'てぃ': ['thi'], 'でぃ': ['dhi'], 'でゅ': ['dhu'], 'とぅ': ['twu'], 'どぅ': ['dwu'],
  'うぃ': ['wi'], 'うぇ': ['we'], 'うぉ': ['who'],
  'ゔぁ': ['va'], 'ゔぃ': ['vi'], 'ゔぇ': ['ve'], 'ゔぉ': ['vo'],
  'つぁ': ['tsa'], 'しぃ': ['syi'],
};

const VOWELS_Y_N = 'aiueoyn';

function uniq(arr) { return [...new Set(arr)]; }

function toChunkCands(ch) {
  if (KANA_TABLE[ch]) return KANA_TABLE[ch].slice();
  return [ch.toLowerCase()];
}

// カタカナの読みもひらがなとして扱う
function toHiragana(s) {
  return s.replace(/[\u30a1-\u30f6]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

// 読みがなを「入力のまとまり(チャンク)」に分解する
function buildChunks(kana) {
  kana = toHiragana(kana);
  const raw = [];
  let i = 0;
  while (i < kana.length) {
    const two = kana.substr(i, 2);
    if (two.length === 2 && KANA_TABLE[two]) {
      // 例: きゃ → kya のほかに ki + xya のような分割入力も許可
      const split = [];
      for (const a of toChunkCands(two[0])) for (const b of toChunkCands(two[1])) split.push(a + b);
      raw.push({ kana: two, cands: uniq([...KANA_TABLE[two], ...split]) });
      i += 2;
    } else {
      raw.push({ kana: kana[i], cands: toChunkCands(kana[i]) });
      i++;
    }
  }

  // 「っ」は次のまとまりと合体させて、子音を重ねる入力(tte など)を許可
  const merged = [];
  for (let k = 0; k < raw.length; k++) {
    const c = raw[k];
    const next = raw[k + 1];
    if (c.kana === 'っ' && next && next.kana !== 'っ' && next.kana !== 'ん') {
      const cands = [];
      for (const n of next.cands) {
        if (!VOWELS_Y_N.includes(n[0]) && /[a-z]/.test(n[0])) cands.push(n[0] + n);
        if (n.startsWith('ch')) cands.push('t' + n); // まっちゃ → matcha
      }
      for (const s of c.cands) for (const n of next.cands) cands.push(s + n);
      merged.push({ kana: c.kana + next.kana, cands: uniq(cands) });
      k++;
    } else {
      merged.push({ kana: c.kana, cands: c.cands.slice() });
    }
  }

  // 「ん」は後ろが子音なら n 1 回でも OK
  for (let k = 0; k < merged.length; k++) {
    const c = merged[k];
    if (c.kana !== 'ん') continue;
    const next = merged[k + 1];
    if (next && next.cands.some(n => !VOWELS_Y_N.includes(n[0]))) {
      c.cands = uniq(['nn', 'n', 'xn']);
      c.allowSingleN = true;
    }
  }
  return merged.map(c => ({ ...c, done: false, typed: '', matches: c.cands.slice() }));
}

// 1 つのお題を打ち切るまでの状態を管理するクラス
class TypingTarget {
  constructor(reading) {
    this.reading = reading;
    this.chunks = buildChunks(reading);
    this.idx = 0;
    this.buf = '';
    this.typedAll = '';
  }

  get finished() { return this.idx >= this.chunks.length; }

  _complete(chunk) {
    chunk.done = true;
    chunk.typed = this.buf;
    this.buf = '';
    this.idx++;
  }

  // 戻り値: 'ok' | 'miss' | 'done'
  input(key) {
    if (this.finished) return 'done';
    const chunk = this.chunks[this.idx];
    const nb = this.buf + key;
    const m = chunk.cands.filter(c => c.startsWith(nb));

    if (m.length > 0) {
      this.buf = nb;
      chunk.matches = m;
      this.typedAll += key;
      // 候補がちょうど 1 つに確定したら次へ
      if (m.length === 1 && m[0] === nb) this._complete(chunk);
      return this.finished ? 'done' : 'ok';
    }

    // 「ん」を n 1 回で確定させて、そのキーを次の文字として扱う
    if (chunk.allowSingleN && this.buf === 'n' && !VOWELS_Y_N.includes(key)) {
      const next = this.chunks[this.idx + 1];
      if (next && next.cands.some(c => c.startsWith(key))) {
        chunk.matches = ['n'];
        this._complete(chunk);
        return this.input(key);
      }
    }
    return 'miss';
  }

  // ガイド表示用: [{text, state:'done'|'rest'}]
  guide() {
    let done = '';
    let rest = '';
    this.chunks.forEach((c, i) => {
      if (c.done) done += c.typed;
      else if (i === this.idx) { done += this.buf; rest += c.matches[0].slice(this.buf.length); }
      else rest += c.cands[0];
    });
    return { done, rest };
  }

  // かな表示用: 何文字目まで打ち終えたか
  kanaDoneLength() {
    let n = 0;
    for (const c of this.chunks) { if (c.done) n += c.kana.length; else break; }
    return n;
  }

  nextKey() {
    const g = this.guide();
    return g.rest[0] || '';
  }

  // このお題を最短で打つのに必要なキー数(目安)
  totalKeys() { const g = this.guide(); return g.done.length + g.rest.length; }
}

if (typeof module !== 'undefined') module.exports = { TypingTarget, buildChunks };
