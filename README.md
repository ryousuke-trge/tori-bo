# 鳥越家計簿 (Torigoe Budgeting App)

ミニマリスト向けに設計された、シンプルで美しいUIを持つ共有家計簿アプリケーションです。日々の収支を簡単に記録・管理できます。

## 🔧 技術スタック

*   **Frontend**: HTML, TypeScript (Vanilla), Tailwind CSS v3
*   **Build Tool**: Vite
*   **Backend / DB**: Supabase

## ✨ 主な機能

*   **カレンダー形式のメイン画面 (Home/Calendar)**: 月間カレンダーで日毎の収支を一目で確認。日付をクリックすると、その日の取引詳細（リスト表示）の確認や、新規登録が可能です。
*   **カテゴリ別統計画面 (Statistics)**: カテゴリごとの支出・収入ランキング表示や検索機能。
*   **設定画面 (Settings)**: カテゴリの管理（絵文字アイコン変更対応）、繰り返し発生する取引（固定費など）の管理。
*   **デザイン**: 白とライトグレーを基調としたクリーンで洗練されたレスポンシブUI。

## 📁 フォルダ構成

```text
/
├── .env                 # 環境変数 (Supabase URL, Key等)
├── index.html           # エントリーポイント / レイアウト
├── package.json         # 依存関係定義
├── tailwind.config.js   # Tailwindの設定
├── src/
│   ├── api.ts           # Supabase等のAPIとの通信処理
│   ├── main.ts          # 初期化・ルーティングのセットアップ
│   ├── style.css        # 全体スタイル集 / Tailwindインポート
│   ├── supabase.ts      # Supabaseクライアント設定
│   ├── types.ts         # TypeScriptの共通型定義ファイル
│   ├── components/      # UIコンポーネントディレクトリ
│   │   ├── BottomNav.ts             # 下部ナビゲーション
│   │   ├── Calendar.ts              # カレンダー描画ロジック
│   │   ├── DailyTransactionsList.ts # 日別詳細リスト
│   │   └── TransactionModal.ts      # トランザクション登録等モーダル
│   ├── pages/           # 各画面のロジックディレクトリ
│   │   ├── home.ts      # カレンダー／ホーム画面
│   │   ├── settings.ts  # 設定画面
│   │   └── stats.ts     # 統計画面
│   └── utils/           # ユーティリティ関数
│       └── date.ts      # 日付操作関連
```

## 🚀 開発の始め方

1. `npm install` または `npm i` で依存パッケージをインストール
2. `.env` ファイルにSupabaseのURL・キーなどを設定
3. `npm run dev` でローカルサーバーを起動
