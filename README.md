# GitHub Pages テスト (GitHub Actions ワークフロー編)

このリポジトリは、GitHub Pages のデプロイ方法として **GitHub Actions ワークフロー** を採用する手順を解説するサンプルプロジェクトです。
ワークフローを使用することで、ビルドプロセスのカスタマイズや、環境変数埋め込みといった高度な処理が可能になります。

## 📂 ディレクトリ構成例

ワークフローでデプロイする場合、公開用ファイルを `public` ディレクトリに分離する構成が推奨します。
これにより、`README.md` や設定ファイルが誤って公開されるのを防ぐことができます。

```text
.
├── .github/
│   └── workflows/
│       └── deploy.yml  # デプロイ定義ファイル（解説は後述）
├── public/             # 公開用ディレクトリ
│   └── index.html
└── README.md           # 公開サイトには含まれません
```

---

## 🚀 基本的な設定手順

GitHub Actions を使ったデプロイを有効にするための手順です。
ここでは、ワークフロー活用の具体例として**「環境変数の埋め込み」**を行う場合の設定も合わせて紹介します。

### 1. 活用例：ソースコードの準備

埋め込みたい環境変数はソースコード内に **`${環境変数名}`** の形式でプレースホルダーを記述しておきます。
デプロイワークフローの処理の中で、実際の値に置換します。

```html
    <!-- HTMLのテキストとして直接埋め込む例 -->
    <p>現在のバージョン: <b>${APP_VERSION}</b></p>
```

### 2. 活用例：環境変数 (Secrets) の設定

埋め込みたい値を GitHub リポジトリに登録します。

1. リポジトリの **[Settings]** タブを開きます。
2. 左メニューの **[Secrets and variables]** > **[Actions]** を選択します。
3. **[New repository secret]** をクリックし、値を登録します。

| 環境変数例 | 設定例 | 説明 |
| :--- | :--- | :--- |
| `API_BASE_URL` | `https://api.example.com/v1` | 接続先URL |
| `APP_VERSION` | `v1.2.0` | バージョン情報 |

### 3. デプロイ設定の変更

GitHub Pages のデプロイ元を「ブランチ」から「Actions」に切り替えます。

1. リポジトリの **[Settings]** タブを開きます。
2. 左メニューの **[Pages]** を選択します。
3. **Build and deployment** > **Source** を `Deploy from a branch` から **`GitHub Actions`** に変更します。

---

## 🛠 ワークフローの解説

個のリポジトリのデプロイ設定ファイルは **[.github/workflows/deploy.yml](.github/workflows/deploy.yml)** です。
このファイルの中で、ワークフローデプロイにおいて特に重要なポイントを解説します。

#### A. 権限の設定 (`permissions`)

```yaml
permissions:
  contents: read
  pages: write      # Pagesへの書き込み権限
  id-token: write   # OIDC認証用
```
GitHub Actions から Pages へデプロイするためには、`pages: write` と `id-token: write` の権限付与が必須です。これがないとデプロイ時にエラーが発生します。

#### B. 活用例：環境変数の埋め込み処理 (`Inject Environment Variables`)

このステップでは、ソースコード内のプレースホルダー（例: `${API_BASE_URL}`）を、Secrets に登録した実際の値に書き換える処理を行っています。

```yaml
      - name: Inject Environment Variables
        env:
          # ここで定義した変数が、下の run スクリプト内で参照可能になります
          API_BASE_URL: ${{ secrets.API_BASE_URL }}
        run: |
          # public以下の全ファイルを検索し、${API_BASE_URL} を実際の値に置換
          # 注意: ${...} を文字として扱うため、\${...} とエスケープしています
          find ./public -type f -exec sed -i "s|\${API_BASE_URL}|$API_BASE_URL|g" {} +
```
*   **ポイント1 (エスケープ)**: シェルスクリプトにおいて `${...}` は変数を意味するため、文字として検索させるために `\` でエスケープし、`\${...}` と記述しています。
*   **ポイント2 (対象検索)**: `find` コマンドを使うことで、サブディレクトリを含むすべてのファイルを対象に一括置換を行っています。

> **💡 対象ファイルの制御について**
> デフォルトでは画像ファイルなどもスキャン対象になり、破損のリスクがあります。
> 安全のため、以下のように拡張子を指定することを推奨します。
> ```bash
> # .html, .js, .css のみ対象にする例
> find ./public -type f \( -name "*.html" -o -name "*.js" -o -name "*.css" \) \
>   -exec sed -i "s|\${API_BASE_URL}|$API_BASE_URL|g" {} +
> ```

#### C. 公開ディレクトリの指定 (`Upload artifact`)

```yaml
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          # リポジトリルートではなく 'public' ディレクトリを指定
          path: './public'
```
ワークフローデプロイの大きな利点です。リポジトリ全体ではなく、指定したディレクトリ（ここでは `public`）の中身だけをきれいに公開できます。これにより、設定ファイルなどが誤って公開されるのを防ぎます。

---

## ✅ 動作確認

1. 設定完了後、`main` ブランチへプッシュします。
2. GitHub の **[Actions]** タブで、ワークフローが実行され成功（緑色のチェック）することを確認します。
3. 公開されたページ（`https://[User].github.io/[Repo]/`）にアクセスし、以下の点を確認します。
    *   ページが正しく表示されているか。
    *   （埋め込みを行った場合）`${API_BASE_URL}` などの記述が実際の値に変わっているか。

---

## ⚠️ セキュリティに関する重要な注意

環境変数埋め込みを行う場合、値は **HTML/JS ソースコードの中に平文で書き込まれます。**

ブラウザの「ページのソースを表示」機能を使えば、**世界中の誰でもその値を見ることができます。**

### ✅ 公開して良いもの (Safe)
フロントエンドから直接アクセスする必要がある情報。
*   **公開APIのエンドポイント URL** (例: `https://api.myapp.com`)
*   **公開用クライアントキー / Anon Key** (例: Firebase Config, Supabase Anon Key)
    *   *注: バックエンド側（RLS等）でのアクセス制御が必須です*
*   **アプリケーションバージョン**
*   **Google Analytics ID**

### ❌ 公開してはいけないもの (Unsafe)
サーバーサイドでのみ使用すべき情報。
*   **データベースの接続パスワード**
*   **AWS Secret Access Key**
*   **Admin権限を持つAPIトークン**

**絶対に秘密情報を埋め込まないように注意してください。**
