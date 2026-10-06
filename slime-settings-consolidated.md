---
name: slime-settings-consolidated
description: スライムタイピングの設定は設定画面 (js/settings.js) の1か所にまとめる。画面の外に設定ボタンを並べない
metadata:
  node_type: memory
  type: feedback
  originSessionId: c39678a8-ad29-4b84-afcd-545b14b09047
  modified: 2026-10-02T03:02:48.760Z
---

音量・言語・エフェクトなどの設定は、すべて設定画面（js/settings.js の SETTING_ROWS）に入れる。ホームの右上には「⚙️ 設定」ボタンだけを置く。開き方は 0 キー（タイトル・ホーム・マップなど SETTINGS_KEY_SCREENS）、バトル・練習・サバイバルの最中は Esc でポーズ＋設定（Esc で再開、Enter でやめる）。

**Why:** 設定画面を作ったあと、ユーザーが「今まであったエフェクト控えめなどは全てそこに入れて外に出ているものは消して」「バトル中などもEscを押して設定できるように」と言った。

**How to apply:** 新しい設定（表示の ON/OFF など）は SETTING_ROWS に 1 行足し、Main の初期値（Save の settings）と applySettings に反映を書く。画面に別の切りかえボタンを足さない。関連: [[slime-typing-project]]

2026-10-06: ポーズ中の「やめる」は 2 回押しにした（誤動作を防ぐため、とユーザーの希望）。1 回目で「⚠️ 本当に〜？」と quit.warn の説明を出し、もう一度 Enter でやめる。Esc は再開、ほかのキーで取り消し。新しくポーズ・やめるを足すときは Settings.open の quit に warn（何が失われるか）を書く。毎日ガチャは 3・2・1 の間の Esc を受け付けない（今日の分を使ったあとなので）。
