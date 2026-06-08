# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## プロジェクト概要

子供（小学校低学年）が旅行先を選ぶ Web サイト。Next.js (App Router) + SSG + Leaflet 地図 + Playwright PDF 生成。AWS CDK (S3 + CloudFront OAC) で静的配信。

## コマンド

```bash
npm run dev           # 開発サーバー (localhost:3000)
npm run build         # SSG ビルド → out/

# PDF 生成は2ステップ（ローカル HTTP サーバーが先に必要）
npm run build
npx serve out -l 4000 &   # バックグラウンドで起動
node scripts/generate-pdf.mjs

# インフラ（infra/ 配下で実行）
cd infra && npx cdk deploy
```

## アーキテクチャの制約

- **Static Export のみ**：`output: 'export'` のため `/api/` Route は使用不可。すべてのルートに `generateStaticParams` が必要。
- **Leaflet は Client-Only**：`next/dynamic` + `ssr: false` で読み込む（SSR 不可）。地図コンポーネントを新規作成する場合も同様。
- **末尾スラッシュ必須**：`trailingSlash: true` のため、内部リンクはすべて `/trips/[tripId]/` のように末尾 `/` をつける。
- **マーカーのリンクは素の `<a>` タグ**：`SpotMarker.tsx` の DivIcon 内では `router.push()` でなく `<a href="/.../">` を使う（静的 export との親和性のため）。

## コンテンツの追加方法

```
content/trips/<tripId>/trip.md            # 旅行のメタ情報（frontmatter のみ）
content/trips/<tripId>/spots/<spotId>.md  # 候補スポット
public/photos/<tripId>/<spotId>/*.jpg     # 写真（`images.unoptimized: true` のため手動で最適化）
```

スキーマは `lib/content.ts` の `Trip` / `Spot` インターフェースを参照。

## PDF 生成の注意点

- `window.__mapReady` フラグが `true` になるまで Leaflet タイルの描画完了を待機する（`TripMapInner.tsx` が立てる）。このフラグがないと地図が白紙のまま PDF 化される。
- PDF 生成環境に日本語フォントがないと文字が □（豆腐）になる。

## インフラ

- `infra/` は独立した npm プロジェクト。`package.json` が別なので `cd infra && npm install` が必要。
- `cloudfront-rewrite.js`（CloudFront Function / viewer-request）が `trailingSlash: true` で生成した `index.html` を S3 から正しく配信するために必須。
- 独自ドメインは不使用。`*.cloudfront.net` のデフォルト URL で運用。

## UI の方針

- 対象は小学校低学年。テキストはひらがな主体で短文。
- 漢字には `<ruby>` でふりがなを付ける（`name` フィールドのみ。本文・`extras` はひらがなで記述）。
- タップ領域は大きめ（ボタンは `text-xl` 以上、`px-6 py-3` 以上）。
