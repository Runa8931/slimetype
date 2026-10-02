// ============================================================
//  お題の 追加ぶん (v5.15)
//  long: 長い 文章 (読点・句点 つき) / symbol: 数字や 記号の まじった お題
//  練習の 難易度「長文」「記号・数字」と、今週の チャレンジで つかう
//  数字は そのまま 打つ (romaji.js は 表に ない 文字を そのまま 1 キーと して あつかう)
// ============================================================

(() => {
  const J = s => s.trim().split('\n').map(x => x.trim()).filter(Boolean).map(x => { const [t, k] = x.split('/'); return { t, k }; });
  const EN = s => s.trim().split('\n').map(x => x.trim()).filter(Boolean);

  WORDS_JA.long = J(`
    朝早く起きて、公園を一周走った。/あさはやくおきて、こうえんをいっしゅうはしった。
    雨が上がると、空に大きな虹がかかった。/あめがあがると、そらにおおきなにじがかかった。
    スライムは毎日少しずつ強くなっていく。/すらいむはまいにちすこしずつつよくなっていく。
    宿題を終わらせてから、ゲームをしよう。/しゅくだいをおわらせてから、げーむをしよう。
    図書館で借りた本を、夜おそくまで読んだ。/としょかんでかりたほんを、よるおそくまでよんだ。
    冬の朝は、布団から出るのがつらい。/ふゆのあさは、ふとんからでるのがつらい。
    遠くの山の上に、白い雲が浮かんでいる。/とおくのやまのうえに、しろいくもがうかんでいる。
    負けてもあきらめずに、もう一度挑戦しよう。/まけてもあきらめずに、もういちどちょうせんしよう。
    正しく打つことが、速く打つための近道だ。/ただしくうつことが、はやくうつためのちかみちだ。
    夏休みに家族で海へ行き、貝がらを拾った。/なつやすみにかぞくでうみへいき、かいがらをひろった。
    駅の前に新しいパン屋さんができた。/えきのまえにあたらしいぱんやさんができた。
    冷たい風がふいて、木の葉が舞い落ちた。/つめたいかぜがふいて、きのはがまいおちた。
    魔王の城は、深い森のさらに奥にある。/まおうのしろは、ふかいもりのさらにおくにある。
    勇者は仲間といっしょに、長い旅に出た。/ゆうしゃはなかまといっしょに、ながいたびにでた。
    この橋をわたれば、となりの町に着く。/このはしをわたれば、となりのまちにつく。
    星がきれいな夜は、望遠鏡で月を見る。/ほしがきれいなよるは、ぼうえんきょうでつきをみる。
    弟が作ったカレーは、少しからかった。/おとうとがつくったかれーは、すこしからかった。
    指の位置を覚えれば、画面を見ずに打てる。/ゆびのいちをおぼえれば、がめんをみずにうてる。
    昼休みに友だちとサッカーをして遊んだ。/ひるやすみにともだちとさっかーをしてあそんだ。
    お店の人に、道をていねいに教えてもらった。/おみせのひとに、みちをていねいにおしえてもらった。
    電車がおくれたので、少し走って学校へ向かった。/でんしゃがおくれたので、すこしはしってがっこうへむかった。
    砂漠の真ん中で、小さな泉を見つけた。/さばくのまんなかで、ちいさないずみをみつけた。
    ねむい目をこすりながら、日記を書いた。/ねむいめをこすりながら、にっきをかいた。
    明日の天気は、晴れのち曇りらしい。/あしたのてんきは、はれのちくもりらしい。
    練習を続けたら、前より速く打てるようになった。/れんしゅうをつづけたら、まえよりはやくうてるようになった。
    雪山の頂上には、氷の女王が住んでいる。/ゆきやまのちょうじょうには、こおりのじょおうがすんでいる。
    祭りの夜、たくさんの花火が空に咲いた。/まつりのよる、たくさんのはなびがそらにさいた。
    古い地図を手がかりに、宝箱をさがした。/ふるいちずをてがかりに、たからばこをさがした。
    ねこは日当たりのよい窓のそばで昼寝をする。/ねこはひあたりのよいまどのそばでひるねをする。
    料理を手伝ったら、母がとても喜んでくれた。/りょうりをてつだったら、ははがとてもよろこんでくれた。
    海の底には、まだ知られていない生き物がいる。/うみのそこには、まだしられていないいきものがいる。
    大事なのは、毎日少しでも続けることだ。/だいじなのは、まいにちすこしでもつづけることだ。
    宇宙船の窓から、青い地球が見えた。/うちゅうせんのまどから、あおいちきゅうがみえた。
    朝ごはんを食べないと、昼まで力が出ない。/あさごはんをたべないと、ひるまでちからがでない。
    先生の話を聞いて、みんな大きくうなずいた。/せんせいのはなしをきいて、みんなおおきくうなずいた。
    お菓子の国では、雲がわたあめでできている。/おかしのくにでは、くもがわたあめでできている。
    水たまりに映った空が、とても青かった。/みずたまりにうつったそらが、とてもあおかった。
    最後のボスを倒して、世界に平和がもどった。/さいごのぼすをたおして、せかいにへいわがもどった。
    バスに乗って、おばあちゃんの家へ遊びに行く。/ばすにのって、おばあちゃんのいえへあそびにいく。
    春になると、川沿いの桜がいっせいに咲く。/はるになると、かわぞいのさくらがいっせいにさく。
  `);

  WORDS_EN.long = EN(`
    the slime jumped over the fence and ran into the forest.
    after the rain stopped, a rainbow appeared in the sky.
    practice a little every day, and you will get faster.
    the brave hero opened the old door and stepped inside.
    my cat likes to sleep in the sun by the window.
    we walked along the beach and picked up shiny shells.
    the dragon guarded a mountain of gold in its cave.
    reading books is a good way to learn new words.
    do not look at the keyboard, look at the screen.
    the train was late, so we ran to the station.
    there is a hidden path behind the waterfall.
    she wrote a long letter to her friend in another town.
    the stars were bright, and the moon was full tonight.
    every mistake is a chance to learn something new.
    the robot cleaned the whole house in ten minutes.
    he made pancakes with honey for breakfast.
    the wind was cold, but the sun felt warm on my face.
    if you keep trying, you will reach your goal.
    the castle stood on a hill above the quiet village.
    we planted seeds in spring and picked tomatoes in summer.
    the little slime wanted to become the king of slimes.
    turn left at the corner, and the shop is on your right.
    the snow fell all night and covered the whole town.
    accuracy first, then speed will follow.
    the music started, and everyone began to dance.
  `);

  WORDS_JA.symbol = J(`
    3時15分に集合！/3じ15ふんにしゅうごう！
    1たす1は2/1たす1は2
    7月7日は七夕/7がつ7にちはたなばた
    100点を取った！/100てんをとった！
    明日は何時に起きる？/あしたはなんじにおきる？
    2024年の夏/2024ねんのなつ
    1、2、3、ジャンプ！/1、2、3、じゃんぷ！
    残りHP50%/のこりhp50%
    第1ステージ/だい1すてーじ
    5分で終わる？/5ふんでおわる？
    10回連続ノーミス！/10かいれんぞくのーみす！
    電話番号は090-1234-5678/でんわばんごうは090-1234-5678
    コンボ300達成！/こんぼ300たっせい！
    Lv.99まであと少し/lv.99まであとすこし
    気温は25度、晴れ。/きおんは25ど、はれ。
    12月25日はクリスマス/12がつ25にちはくりすます
    3びきで1キャラ/3びきで1きゃら
    1分に300打鍵/1ぷんに300だけん
    午後2時30分に出発/ごご2じ30ぷんにしゅっぱつ
    たまご6個とミルク1本/たまご6ことみるく1ぽん
    ガチャを10回引く！/がちゃを10かいひく！
    4月1日は始業式。/4がつ1にちはしぎょうしき。
    50メートル走は8秒/50めーとるそうは8びょう
    本当に？うそでしょ！/ほんとうに？うそでしょ！
    3、2、1、スタート！/3、2、1、すたーと！
    正確率98%以上/せいかくりつ98%いじょう
    ステージ1-1から出発/すてーじ1-1からしゅっぱつ
    家から駅まで800メートル/いえからえきまで800めーとる
  `);

  WORDS_EN.symbol = EN(`
    it's 3:15 pm.
    1 + 1 = 2
    hello, world!
    are you ready?
    level 99 slime
    combo x300!
    score: 12,500
    don't give up!
    e-mail me at 9:00.
    win 3 games in a row!
    hp 50% left...
    open door #7
    100% accuracy!
    stage 1-1 cleared!
    what's your best score?
    i can type 300 keys/min.
    (press space to start)
    buy 2 apples & 3 pears.
    it costs $5.
    10 + 20 = 30
    "hello," said the slime.
    tom's cat is 4 years old.
  `);
})();
