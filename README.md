# 鳥越家計簿 (Torigoe Budgeting App)

ミニマリスト向けに設計された、シンプルで美しいUIを持つ共有家計簿アプリケーションです。日々の収支を簡単に記録・管理できます。

## 🔧 技術スタック

*   **Frontend**: HTML, TypeScript (Vanilla), Tailwind CSS v3
*   **Build Tool**: Vite
*   **Backend / DB**: Supabase

## ✨ 主な機能と特徴

*   **カレンダー形式のメイン画面 (Home/Calendar)**
    *   月間カレンダーで日毎の収支を一目で確認。
    *   日付をクリックすると、その日の取引詳細（リスト表示）の確認や、新規登録が可能です。選択した日付は自動的に入力フォームに同期されます。
*   **カテゴリ別統計画面 (Statistics)**
    *   カテゴリごとの支出・収入ランキング表示や検索機能。
*   **設定画面 (Settings)**
    *   カテゴリの管理（絵文字アイコン変更対応）。
    *   繰り返し発生する取引（固定費など）の管理。
*   **パフォーマンス・UXの最適化**
    *   ローディング時の白い画面（フリーズ）を防ぐため、UIの初期描画とデータ取得処理を非同期に分離し、即座に操作可能な状態を提供しています。
    *   キャッシュ機構（`localStorage`）を活用した高速な画面遷移。
    *   モバイル端末でのスクロール問題にも対応したレスポンシブな設計。
*   **クリーンなデザイン**
    *   白とライトグレーを基調とした洗練されたUI。

## 📁 フォルダ構成

```text
/
├── .env                 # 環境変数 (Supabase URL, Key等)
├── index.html           # エントリーポイント / レイアウト
├── package.json         # 依存関係定義
├── tailwind.config.js   # Tailwindの設定
├── src/
│   ├── api.ts           # Supabase・キャッシュ関連のAPI通信処理
│   ├── main.ts          # 初期化・ルーティングのセットアップ
│   ├── style.css        # 全体スタイル集 / Tailwindインポート
│   ├── seed.ts          # 初期化時のデフォルトカテゴリ投入処理
│   ├── supabase.ts      # Supabaseクライアント設定
│   ├── types.ts         # TypeScriptの共通型定義ファイル
│   ├── components/      # UIコンポーネントディレクトリ
│   │   ├── BottomNav.ts             # 下部ナビゲーション
│   │   ├── Calendar.ts              # カレンダー描画ロジック
│   │   ├── DailyTransactionsList.ts # 日別詳細リスト
│   │   └── TransactionModal.ts      # トランザクション登録等入力モーダル
│   ├── pages/           # 各画面のロジックディレクトリ
│   │   ├── home.ts      # カレンダー／ホーム画面
│   │   ├── settings.ts  # 設定と繰り返しタスク画面
│   │   └── stats.ts     # ランキング・統計画面
│   └── utils/           # ユーティリティ関数
│       └── date.ts      # 日付操作関連
```

## 🚀 開発の始め方

1. `npm install` または `npm i` で依存パッケージをインストール
2. `.env` ファイル作成し、SupabaseのURL・キーなどを設定
3. `npm run dev` でローカルサーバーを起動
