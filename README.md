# とりーぼ (Tori-bo)

ミニマリスト向けに設計された、シンプルで美しいUIを持つ共有家計簿アプリケーションです。日々の収支を家族やパートナーと簡単に共有・記録・管理できます。

## 🔧 技術スタック

*   **Frontend**: HTML, TypeScript (Vanilla), Tailwind CSS v3
*   **Build Tool**: Vite
*   **Backend / DB / Auth**: Supabase

## ✨ 主な機能と特徴

*   **認証機能 (Login)**
    *   Supabase Authを利用したセキュアなログイン。
*   **カレンダー形式のメイン画面 (Home/Calendar)**
    *   月間カレンダーで日毎の収支を一目で確認。
    *   インタラクティブな月選択機能 (Month Picker) で簡単に過去・未来の月に移動可能。
    *   日付をクリックすると、その日の取引詳細（リスト表示）の確認や新規登録が可能。
*   **カテゴリ別統計画面 (Statistics)**
    *   月単位でのカテゴリ別支出・収入ランキングや回数を表示。
    *   家族全体 (Group) と個別のユーザー (Personal) ごとに集計を切り替え可能。
    *   ランキングの項目をクリックすると、そのカテゴリの該当する取引一覧へドリルダウンして詳細を確認可能。
*   **設定・拡張機能 (Settings & Assets)**
    *   カテゴリのカスタマイズ（絵文字アイコンや名称変更）。
    *   繰り返し発生する取引（固定費など）の自動管理。
    *   現在の資産残高の確認 (Assets)。
*   **パフォーマンス・UXの最適化**
    *   入力モーダルを開いた際の自動スクロールや、データ取得処理の非同期化による快適な操作感。
    *   キャッシュ機構を使った高速な画面遷移と、モバイル対応のレスポンシブデザイン。
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
│   ├── seed.ts          # 初期化時のデフォルトデータ投入処理
│   ├── supabase.ts      # Supabaseクライアント設定
│   ├── types.ts         # TypeScriptの共通型定義ファイル
│   ├── components/      # UIコンポーネントディレクトリ
│   │   ├── BottomNav.ts                 # 下部ナビゲーション
│   │   ├── Calendar.ts                  # カレンダー描画ロジック
│   │   ├── CategoryTransactionsModal.ts # 統計画面用の取引リストモーダル
│   │   ├── DailyTransactionsList.ts     # 日別詳細リスト
│   │   ├── MonthPicker.ts               # 月選択UI
│   │   └── TransactionModal.ts          # 取引登録・編集入力モーダル
│   ├── pages/           # 各画面のロジックディレクトリ
│   │   ├── assets.ts    # 資産表示画面
│   │   ├── home.ts      # カレンダー／ホーム画面
│   │   ├── login.ts     # ログイン画面
│   │   ├── settings.ts  # 設定画面 (カテゴリ・繰り返し取引等)
│   │   └── stats.ts     # ランキング・統計画面
│   └── utils/           # ユーティリティ関数
```

## 🚀 開発の始め方

1. `npm install` または `npm i` で依存パッケージをインストール
2. `.env` ファイル作成し、SupabaseのURL・キーなどを設定
3. `npm run dev` でローカルサーバーを起動
