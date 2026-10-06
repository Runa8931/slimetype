---
name: slime-typing-project
description: スライムタイピング (Documents/type/)。今のしくみ・GitHub公開手順(Runa8931/slimetype、版ごとタグ、READMEも更新)・確認方法・気をつけること
metadata:
  node_type: memory
  type: project
  originSessionId: c39678a8-ad29-4b84-afcd-545b14b09047
  modified: 2026-10-02T03:03:16.991Z
---

タイピングでスライムを育てて戦うブラウザゲーム。場所は `/Users/ryouga/Documents/type/`。index.html を開くだけで動く（HTML/CSS/素の JS、モジュールなし）。2026-09-23 着手、2026-10-02 時点で v5.16。ゲームの説明は README.md にまとまっている（2026-10-02 に v5.14 の内容へ書き直した）。

## 今のしくみ（v5.16）
- キャラ 23 体・5 段階進化（Lv20/40/60/80）・最大 Lv120（覚醒★1 つごとに +1）。最初の 6 体は STARTERS。
  - ガチャ限定 11 体（CHARACTERS の gacha:true、1 体 1%）。称号で開く: おんぷる・ぴたりん・ふえりん（combo300）。かくしステージ: ゴルりん・ゆきだるん。ミッション: ゆうしゃりん。
  - 形の違うキャラ（トリオりん・ゆらりん・サイコロりん・いもりん・ちょうちんりん）は sprites.js の CUSTOM_BODY、顔は FACES。サイコロは data.js の rollDice。
  - 進化で必殺に新効果: data.js の SKILL_UPS と battle.js の skillExtras。SSR・解放キャラは charRank で能力 +5% と金/虹の枠。
- バトル: 13 ワールド × 6 = 78 ステージ ＋ かくしステージ 6 つ（data.js の HIDDEN_DEFS。鋼鉄マイマイ = hpMult、ダイヤマイマイ = matchLv で挑戦キャラ Lv+3）。難易度 3 つ = BATTLE_DIFFS（詳しくは [[slime-typing-difficulty]]）。裏の世界の変異種は既存の敵の絵 + 色フィルター、敵の絵は polishEnemy で立体感。
- サバイバル: 難易度 5 つ（地獄 = hell）・武器 19 種。
- ガチャ（js/gacha.js）: コイン・色/帽子/エフェクト/お供・かぶり → 潜在覚醒★1〜4（AWAKEN_BONUS）→ かけら → 交換所・着せ替え。毎日タイピングガチャ（DAILY_*）。★4 の色はレア度 EX「★4 限定」。
- v5.15 で追加: セーブの保存・読み込み（settings.js の exportSave/importSave。読み込み中は Save.locked で pagehide の自動保存を止める）・成長記録 = js/growth.js（Save.data.history、ミスの割合は keyMiss/hitKeys）・チャレンジ = js/challenge.js（★評価 Save.data.stars、ボスラッシュ Save.data.rush、今週のチャレンジ WEEKLY_RULES・Save.data.weekly。battle.js の enter は { idx, rush, rule } も受け取り、終わりは challengeFinish）・お題 js/words3.js（WORDS_JA/EN の long・symbol、練習の難易度「長文」「記号・数字」）。
- v5.16 セーブの守り（main.js の Save）: セーブに書いた回数 `_rev` を入れ、書く前に localStorage の _rev と比べる。ほかのタブのほうが新しければこのタブは stale になり保存を止めて案内を出す。古い版のタブ（_rev なし・小さい）が書いたら storage イベントですぐ書きもどす。起動時に今のセーブを控え（`slime-typing-save-v1-backups`、1 日 1 つ＋版が変わったとき、最大 6）。設定「🕘 前のセーブに戻す」。セーブがないのに控えがあれば起動時に案内。2026-10-02 にユーザーが「更新したあとたまにデータが消える」と言ったので作った（原因は古いタブの 30 秒ごとの自動保存による上書きと考えた。開き方やフォルダーが変わると保存場所も変わる）。
- そのほか: 称号 89 個（★難しい 12・覚醒★4 の称号 23。数は ACHIEVEMENTS.length をブラウザで確かめる）・お題約 900・冒険の扉 = js/doors.js・プレイ時間 = js/playtime.js・設定画面 = js/settings.js（[[slime-settings-consolidated]]）・タイトルだけ草原の背景 = js/meadow.js（ホームは星空のまま、がユーザーの希望）。

## GitHub
https://github.com/Runa8931/slimetype （公開）。版ごとに 1 コミット + 注釈付きタグ、説明は日本語。作者メールは匿名 `220501357+Runa8931@users.noreply.github.com`（type/.git の local config に設定済み、gmail は載せない）。`_backup/`・`.claude/`・`images.jpeg`（他社ゲームの画像）は .gitignore で除外。gh は未インストール、https の push は通る。公開の頻度は [[github-push-cadence]]。

**Why:** ユーザーは版を重ねるたびに履歴を GitHub で見せたい（「バージョン毎に説明付きで」）。

## How to apply
- 変更前に `_backup/<日時>/` へ控え（CLAUDE.md のルール）。
- index.html の `?v=...` を変更のたびに更新しないと、ブラウザが古い JS を使う。版を上げたら main.js の `GAME_VERSION` も上げる（自動の控えが版ごとに作られる）。
- 確認で localStorage を消すときは `Save.locked = true` にしてから（pagehide の自動保存が書きもどすため）。
- **公開するときは README.md も直す。** キャラ・ステージ・称号・ガチャの数や、新しいモード・設定・ファイルが増えたら README に反映してからコミットする。2026-10-02 に見たら v4 ごろの内容のまま（ガチャ限定 2 体・かくしステージ 2 つなど）で大きくずれていた。README の文章も [[slime-text-style]] の書き方にする。
- 確認は Bash で `python3 -m http.server 8765`（preview_start は Documents の権限で失敗する）→ `index.html?mute=1` を開き、終わったらサーバーを止める。[[mute-browser-tests]]
- 強さ調整の計算道具はプロジェクトの tools/ にある（bsim.js・chars.js・bal.js・hp.js = 勝率と残り HP の一覧）。scratchpad には作らない（消える）。
- 新しいキャラの手順は [[slime-new-character-checklist]]。人に送る方法は [[slime-typing-sharing]]。

## 気をつけること
- 内蔵ブラウザが隠れていると requestAnimationFrame が止まり、裏に回ると setTimeout もほぼ止まって画面が 0×0 になる（サバイバルの drawImage エラーはこれが原因で、本物のバグではない）。自動テストは setTimeout に差し替えるか、`Screens.battle.after = fn => this.guard(fn)()` と `proj` で onHit をすぐ呼ぶように差し替えて同期で確かめる。スクリーンショットは 1 回目が古いことがあるので 2 回撮る。
- CSS のクラス名がほかの画面とぶつかる事故があった（.st-actions）。新しい部品は他とかぶらない名前にする。
- **JS の関数名もぶつかる**（モジュールなしなので全部グローバル。あとから読むファイルが黙って上書きする）。v5.15 で challenge.js の starText が gacha.js の starText（覚醒★、最大 4）を上書きし、覚醒★4 のキャラがいると '☆'.repeat(-1) で止まって「スライムを変える」画面のボタンが全部効かなくなった（v5.15.1 で stageStarText に改名）。新しいファイルを足したら `grep -ohE "^(function|const|let|var|class) +[A-Za-z_$][A-Za-z0-9_$]*" js/*.js | awk '{print $2}' | sort | uniq -d` で重なりがないか確かめる。テスト用のセーブも覚醒・全キャラ所持など遊び込んだ状態で確かめる。
- 文章を大量に置きかえるときは「古い⇒新しい」を 1 行ずつ読む小さな python が速い。ただし複数行にまたがる置きかえには使わない（こわれる）。
- ユーザーは入力が止まるギミックを嫌う（こおりは入力停止をやめ「こごえ = 攻撃 ×0.7」にした）。キャラの目がみな同じだと飽きる、とも言った。好みと却下した案の一覧は [[slime-user-preferences]]。
