// ============================================================
//  お題の 追加ぶん (v4.6)
//  words.js の リストに 足す。同じ お題は 自動で 1 つに まとめる
// ============================================================

(() => {
  const J = s => s.trim().split(/\s+/).map(x => { const [t, k] = x.split('/'); return { t, k: k || t }; });
  const EN = s => s.trim().split(/\s*\|\s*/);

  const addJa = {
    easy: J(`
      いちご かえる くつした/くつした 帽子/ぼうし 手袋/てぶくろ 窓/まど 橋/はし 川/かわ 森/もり 池/いけ
      石/いし 砂/すな 波/なみ 雲/くも 虹/にじ 春/はる 秋/あき 昼/ひる 夕方/ゆうがた 今日/きょう
      明日/あした 昨日/きのう 家/いえ 庭/にわ 畑/はたけ 駅/えき 道/みち 町/まち 村/むら 島/しま
      牛/うし 馬/うま 豚/ぶた 羊/ひつじ 猿/さる 熊/くま 象/ぞう 亀/かめ 蛇/へび 蟹/かに
      ぶどう もも なし かき くり ばなな めろん れもん とまと なす きゅうり にんじん だいこん
      ピアノ ギター ボール ノート ペン カメラ テレビ ラジオ ロボット ケーキ プリン ゼリー
      米/こめ 肉/にく 塩/しお 砂糖/さとう 水/みず 火/ひ 氷/こおり 油/あぶら 紙/かみ 糸/いと
      青/あお 赤/あか 白/しろ 黒/くろ 黄色/きいろ 緑/みどり 目/め 耳/みみ 口/くち 手/て 足/あし
      頭/あたま 顔/かお 歯/は 声/こえ 心/こころ 夢/ゆめ 力/ちから 絵/え 歌/うた 旅/たび
      船/ふね 飛行機/ひこうき 地図/ちず 切符/きっぷ 財布/さいふ 鏡/かがみ 箱/はこ 鍵/かぎ
      盾/たて 弓/ゆみ 城/しろ 王様/おうさま 姫/ひめ 竜/りゅう 宝石/ほうせき 薬草/やくそう 呪文/じゅもん
      ほうき やかん おちゃ みそしる おでん すし てんぷら ぎょうざ らーめん かれー
    `),
    normal: J(`
      遊園地/ゆうえんち 観覧車/かんらんしゃ 消しゴム/けしごむ 鉛筆削り/えんぴつけずり 体育館/たいいくかん
      給食当番/きゅうしょくとうばん 算数の宿題/さんすうのしゅくだい 理科の実験/りかのじっけん 音楽室/おんがくしつ
      冷蔵庫/れいぞうこ 洗濯機/せんたくき 掃除機/そうじき 電子レンジ/でんしれんじ 扇風機/せんぷうき
      信号機/しんごうき 横断歩道/おうだんほどう 消防車/しょうぼうしゃ 救急車/きゅうきゅうしゃ 飛行船/ひこうせん
      宇宙飛行士/うちゅうひこうし 天体観測/てんたいかんそく 流れ星/ながれぼし 北極星/ほっきょくせい 天の川/あまのがわ
      雪だるま/ゆきだるま 紅葉狩り/もみじがり 海水浴/かいすいよく 夏祭り/なつまつり 盆踊り/ぼんおどり
      お正月/おしょうがつ 年賀状/ねんがじょう 節分/せつぶん 七夕/たなばた 大掃除/おおそうじ
      焼きそば/やきそば お好み焼き/おこのみやき たこ焼き/たこやき 卵焼き/たまごやき 唐揚げ/からあげ
      カレーライス/かれーらいす ハンバーグ/はんばーぐ オムライス/おむらいす スパゲッティ/すぱげってぃ ホットケーキ/ほっとけーき
      シャボン玉/しゃぼんだま 紙飛行機/かみひこうき 鬼ごっこ/おにごっこ かくれんぼ 縄跳び/なわとび
      秘密基地/ひみつきち 宝の地図/たからのちず 伝説の剣/でんせつのけん 魔法の杖/まほうのつえ 勇者の盾/ゆうしゃのたて
      必殺技/ひっさつわざ 経験値/けいけんち 回復魔法/かいふくまほう 最終決戦/さいしゅうけっせん 冒険者/ぼうけんしゃ
      ドラゴン退治/どらごんたいじ 魔王の城/まおうのしろ 空飛ぶ絨毯/そらとぶじゅうたん 秘密の扉/ひみつのとびら
      スマートフォン/すまーとふぉん コンピューター/こんぴゅーたー インターネット/いんたーねっと プログラミング/ぷろぐらみんぐ
      キーボード練習/きーぼーどれんしゅう ホームポジション/ほーむぽじしょん ブラインドタッチ/ぶらいんどたっち
      ちょっと待って/ちょっとまって びっくり箱/びっくりばこ しっかり者/しっかりもの きゃっちぼーる ぎゅうどん
      じゃがいも しゃっくり ちゃんぽん にょろにょろ ぴょんぴょん ふわふわ もぐもぐ きらきら
    `),
    hard: J(`
      石の上にも三年/いしのうえにもさんねん 猿も木から落ちる/さるもきからおちる 花より団子/はなよりだんご
      早起きは三文の徳/はやおきはさんもんのとく 塵も積もれば山となる/ちりもつもればやまとなる
      犬も歩けば棒に当たる/いぬもあるけばぼうにあたる 七転び八起き/ななころびやおき 雨降って地固まる/あめふってじかたまる
      急がば回れ/いそがばまわれ 案ずるより産むが易し/あんずるよりうむがやすし 笑う門には福来る/わらうかどにはふくきたる
      失敗は成功のもと/しっぱいはせいこうのもと 好きこそものの上手なれ/すきこそもののじょうずなれ
      井の中の蛙大海を知らず/いのなかのかわずたいかいをしらず 転ばぬ先の杖/ころばぬさきのつえ
      三人寄れば文殊の知恵/さんにんよればもんじゅのちえ 百聞は一見にしかず/ひゃくぶんはいっけんにしかず
      勇者は仲間とともに旅に出た/ゆうしゃはなかまとともにたびにでた 毎日少しずつ練習しよう/まいにちすこしずつれんしゅうしよう
      スライムがぷるぷるふるえている/すらいむがぷるぷるふるえている 今日はいい天気なので散歩に行こう/きょうはいいてんきなのでさんぽにいこう
      正しい指でキーを打つと速くなる/ただしいゆびできーをうつとはやくなる 宝箱の中には金色のかぎがあった/たからばこのなかにはきんいろのかぎがあった
      夜空に大きな流れ星が見えた/よぞらにおおきなながれぼしがみえた 魔王をたおして平和を取りもどそう/まおうをたおしてへいわをとりもどそう
      ドラゴンは口から炎をはいた/どらごんはくちからほのおをはいた 図書館で冒険の本を借りた/としょかんでぼうけんのほんをかりた
      あきらめなければ夢はかなう/あきらめなければゆめはかなう 雪の日は温かいスープがおいしい/ゆきのひはあたたかいすーぷがおいしい
      画面を見ないで打てるようになった/がめんをみないでうてるようになった 深い森の奥に古い城がある/ふかいもりのおくにふるいしろがある
    `),
  };

  const addEn = {
    easy: EN(`dog | sun | moon | star | tree | fish | bird | cake | milk | rain | snow | wind | fire | king | frog | ring | map | key | box | hat |
      red | blue | gold | pink | jump | run | swim | fly | play | sing | book | desk | door | lamp | ship | road | rock | leaf | seed | bell |
      apple | lemon | grape | peach | bread | juice | sword | magic | quest | hero | music | happy | light | dream | ocean | river | cloud | storm | tiger | panda |
      bear | duck | goat | lamb | owl | bee | ant | cow | pig | fox | cat | bat | hen | yak | seal | deer | mole | worm | crow | swan |
      cup | pot | pan | fork | bowl | bed | sofa | rug | bag | coin | gem | axe | bow | shield | cape | boot | sock | coat | belt | glove |
      home | park | shop | farm | hill | lake | pond | cave | nest | tent | cake | soup | rice | corn | bean | pie | tea | salt | honey | nut |
      big | small | fast | slow | hot | cold | warm | cool | soft | hard | new | old | good | kind | brave | calm | quiet | loud | funny | lucky`),
    normal: EN(`treasure | dragon | wizard | castle | monster | journey | victory | crystal | lightning | rainbow |
      keyboard | computer | practice | homework | birthday | holiday | festival | umbrella | penguin | dolphin |
      butterfly | elephant | kangaroo | pineapple | chocolate | sandwich | spaghetti | pancake | strawberry | blueberry |
      adventure | champion | midnight | sunshine | waterfall | mountain | volcano | galaxy | universe | satellite |
      typing speed | home row | secret door | magic wand | brave heart | final boss | level up | power up | game over | high score`),
    hard: EN(`practice makes perfect | the early bird catches the worm | slow and steady wins the race |
      actions speak louder than words | every cloud has a silver lining | time flies when you are having fun |
      the slime jumped over the sleeping dragon | keep your fingers on the home row | a journey of a thousand miles begins with one step |
      the hero opened the golden treasure chest | stars are shining brightly in the night sky | never give up on your dreams |
      the wizard cast a powerful spell | type without looking at the keyboard | the castle stands on top of the hill`),
  };

  // ワールドにちなんだ お題 (うらの せかいの ぶんも)
  const addTheme = {
    shade: { ja: J(`かげ 暗闇/くらやみ 月明かり/つきあかり 影法師/かげぼうし 迷いの森/まよいのもり 紫の霧/むらさきのきり 黒い翼/くろいつばさ 夜の森/よるのもり ふくろう 真夜中/まよなか`),
      en: EN(`shadow | darkness | moonlight | owl | midnight | purple fog | black wing | lost forest`) },
    void: { ja: J(`星くず/ほしくず 銀河/ぎんが 宇宙の果て/うちゅうのはて 流星群/りゅうせいぐん 無重力/むじゅうりょく ブラックホール/ぶらっくほーる 光の道/ひかりのみち 真の魔王/しんのまおう 最後の戦い/さいごのたたかい 永遠/えいえん`),
      en: EN(`stardust | galaxy | black hole | meteor shower | zero gravity | endless space | final battle | true demon king`) },
    grass: { ja: J(`草原/そうげん たんぽぽ 風車/ふうしゃ 牧場/ぼくじょう ひつじ雲/ひつじぐも 小川/おがわ 花畑/はなばたけ`), en: EN(`meadow | windmill | farm | flower field | green hill`) },
  };

  const merge = (list, add) => {
    const seen = new Set(list.map(w => (typeof w === 'string' ? w : w.t)));
    for (const w of add) { const key = typeof w === 'string' ? w : w.t; if (!seen.has(key)) { seen.add(key); list.push(w); } }
  };
  for (const d of Object.keys(addJa)) merge(WORDS_JA[d], addJa[d]);
  for (const d of Object.keys(addEn)) merge(WORDS_EN[d], addEn[d]);
  for (const [th, v] of Object.entries(addTheme)) {
    WORDS_THEME[th] = WORDS_THEME[th] || { ja: [], en: [] };
    merge(WORDS_THEME[th].ja, v.ja);
    merge(WORDS_THEME[th].en, v.en);
  }
})();
