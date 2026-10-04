# eitango

Next.jsとNeonで作った、ターゲット1900（6訂版）のシンプルな英単語アプリ。

- 1〜200、201〜400、…、1601〜1800、1801〜1900の10区分から選択。
- 英単語を表示し、1つの学習ボタンで「意味を見る → 次の単語へ」を繰り返す。
- 範囲の最後に完了画面を表示し、同じボタンで再学習。
- スマートフォン・キーボードでの操作に対応。

学習中の位置は画面を開いている間だけ保持します。再読み込み時は選択した範囲の最初に戻ります。ログインや学習履歴の保存はありません。

## 起動

Node.js 22以上を使います。

```sh
npm ci
npm run dev
```

[http://localhost:3000](http://localhost:3000)を開きます。

## 環境変数

プロジェクトのルートに`.env.local`を作成し、Neon ConsoleのConnectから取得した接続URLを設定します。

```dotenv
DATABASE_URL="アプリ用のNeon接続URL"
DATABASE_URL_UNPOOLED="マイグレーション用のNeon直接接続URL"
```

`DATABASE_URL`は`-pooler`を含むホスト名の接続URL、`DATABASE_URL_UNPOOLED`は`-pooler`を含まない同じブランチへの直接接続URLです。

`.env`で始まるファイルはすべてGitの対象から除外しています。接続URLをソースコードに書いたり、`NEXT_PUBLIC_`を付けたりしないでください。ホスティング先にも環境変数として設定します。

## マイグレーション・単語の取り込み

初回に次の順番で実行します。

```sh
npm run import:words -- --dry-run
npm run db:migrate
npm run import:words
npm run db:verify
```

取得元は[受かる英語の単語一覧](https://ukaru-eigo.com/target-1900-word-list/)。dry-runは1900件、番号の連続性・重複・空欄を検証し、DBには接続しません。取り込みでは意味の注釈も保持します。

単語帳を`vocabulary_books`、単語を`vocabulary_words`に保存します。単語帳と掲載番号を一意にし、再実行しても重複しません。既存の単語ID・作成日時を維持し、変更のある内容だけを更新します。全件を同一トランザクションで処理するため、途中失敗時は取り込み全体をロールバックします。

データベースへの接続はサーバー側のみで行い、選択した範囲の100〜200語だけをクライアントに渡します。

スキーマは`db/schema.ts`、マイグレーションは`drizzle/`、取得・取り込み処理は`scripts/`で管理しています。スキーマ変更後は`npm run db:generate`で追加マイグレーションを生成し、開発ブランチで確認してから適用します。

## 検証・本番起動

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

テストでは10区分とボタンの状態遷移、HTML抽出時の異常検出、ID・学習履歴の維持、取り込みのロールバックを確認します。テストのDBにはPGliteのPostgresエンジンを使い、Neonの接続情報は不要です。

GitHubへ送る前に`npm run check:secrets`でGitの登録ファイルを確認できます。環境変数ファイル・接続URL・設定済みパスワードが含まれている場合は失敗します。

技術構成: Next.js App Router、React、TypeScript、CSS、Drizzle ORM、node-postgres、Neon。
