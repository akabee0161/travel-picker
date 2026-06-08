# 子供と選ぶ旅行先サイト 設計書 v2

> Claude Code への実装指示書。前回のヒアリング結果を反映した確定寄りの版。残る `[要確認]` のみ後日調整。

---

## 1. 概要

子供（小学校低学年）が次の旅行先を自分で選ぶための Web サイト兼印刷用サイト。

- 日本地図上に旅行先候補を吹き出しで表示する地図ページが軸。
- 地図上の実際の場所に点を打ち、そこから引き出し線で吹き出しをつなぐ。吹き出しをクリックすると詳細ページへ。
- 旅行は複数回あるため、トップで旅行日を選び、旅行日ごとに別々の候補セットを持つ。
- 印刷ボタンで、その旅行分の地図＋全詳細をまとめた PDF をワンクリックでダウンロードできる（ビルド時に静的生成）。
- インフラは AWS CDK で構成し、S3 + CloudFront で配信する。

---

## 2. 確定した方針

| 項目 | 決定 |
|------|------|
| ページ構成 | **統合案**：`/trips/[tripId]/` 自体が地図ページ（上部に日付・タイトル、下に日本地図）。`/map/` は作らない |
| PDF 方式 | **ビルド時に静的 PDF を事前生成**（Playwright）。印刷ボタンはその PDF を `download` でDL |
| PDF の範囲 | 選択した1旅行分（地図＋その旅行の全詳細）を1ファイルに連結 |
| 子供の年齢 | 小学校低学年。漢字にふりがな（`<ruby>`）、短文、写真大きめ |
| 吹き出し | 緯度経度で配置（Leaflet）＋ 実位置の点から吹き出しへ引き出し線（`labelOffset` で微調整） |
| データ管理 | Markdown（frontmatter ＋ 本文） |
| インフラ | AWS CDK（S3 非公開 ＋ CloudFront OAC） |

---

## 3. サイトマップ / URL 設計

`next.config.js` で `trailingSlash: true`（S3 配信のため）。

```
/                                  トップ（旅行日を選ぶ）
/trips/[tripId]/                   地図ページ（=入口。日付/タイトル＋日本地図＋吹き出し）。直接URL可
/trips/[tripId]/spots/[spotId]/    詳細ページ（候補1件）
/trips/[tripId]/print/             印刷用ページ（地図＋全詳細を縦に連結。PDF生成元）
/pdf/[tripId].pdf                  ビルド時に生成した静的PDF（ダウンロード対象）
```

- `tripId` は任意 slug（例 `2026-summer`、`2027-spring`）。事前に日付を確定させず、管理者が命名する。
- すべて `generateStaticParams` で静的書き出し。
  - `/trips/[tripId]`：全 trip の id
  - `/trips/[tripId]/spots/[spotId]`：全 trip × spot の組み合わせ
  - `/trips/[tripId]/print`：全 trip の id
- 存在しない `tripId` / `spotId` は `not-found`（404）。

---

## 4. 画面仕様

### 4.1 トップ `/`
- 旅行（旅行日）の一覧を大きなカードで表示。各カードに日付・タイトル・候補数。
- クリックで `/trips/[tripId]/` へ。0件時の空表示も用意。

### 4.2 地図ページ `/trips/[tripId]/`（＝入口）
- 上部に「日付」「タイトル」「ひとこと」を大きく表示。
- 地図（Leaflet + OpenStreetMap、§6）を表示。候補ごとに次を描画：
  - 地図上の**実際の場所に点（マーカー）**。
  - 点から**吹き出しへ引き出し線**。
  - **吹き出し**（候補名＝ふりがな付き、子供がタップしやすい大きさ）。クリックで `/trips/[tripId]/spots/[spotId]/` へ。
- 「いんさつする」ボタン → `/pdf/[tripId].pdf` をDL。「もどる」→ トップ。
- 直接 URL で到達可能（要件）。

### 4.3 詳細ページ `/trips/[tripId]/spots/[spotId]/`
- 候補1件の詳細。表示項目：
  - 名前（ふりがな付き）／写真（複数枚・縦並び・大きめ）
  - ひとこと説明（本文 Markdown）
  - おすすめポイント（箇条書き）
  - だいたいの場所（都道府県・エリア）
  - 追加情報（`extras`）：アクセス・費用・季節など任意項目を箇条書き表示（省略可）
- 「ちずにもどる」→ 地図ページ。前後候補へのナビ（任意）。「いんさつする」ボタンあり。

### 4.4 印刷用ページ `/trips/[tripId]/print/`
- PDF 生成専用。1ページ目に地図、以降は候補ごとに詳細を縦連結。
- `@media print` ＋ `break-after: page;` でページ区切り。ナビ非表示。
- 詳細表示は画面用と同じ `SpotDetail` コンポーネントを共用。

---

## 5. データ設計（Markdown）

### 5.1 ディレクトリ
```
content/
  trips/
    2026-summer/
      trip.md                 # 旅行のメタ情報
      spots/
        okinawa.md            # 候補1件＝1ファイル
        hokkaido.md
        ...
public/
  photos/2026-summer/okinawa/1.jpg ...
```

### 5.2 `trip.md`（frontmatter のみ／本文は任意のひとこと）
```yaml
---
id: "2026-summer"
date: "2026年夏"        # 表示用の自由記述（実際の日付でなくてよい）
title: "なつやすみのりょこう"
message: "どこにいきたい？"
order: 1            # トップでの並び順
---
```

### 5.3 `spots/<spotId>.md`
```yaml
---
id: "okinawa"
name: "沖縄"
ruby: "おきなわ"
area: "沖縄県"
order: 1                       # 地図の重なり時の前面/背面、印刷・前後ナビの順序
latlng: [26.2, 127.7]          # 実際の緯度経度（Leaflet が地図座標へ変換）
labelOffset: [20, -50]         # マーカーからの吹き出しピクセルオフセット（近隣候補と重なる場合に調整）
photos:
  - /photos/2026-summer/okinawa/1.jpg
  - /photos/2026-summer/okinawa/2.jpg
points:
  - "うみがきれい"
  - "シーサーがいる"
extras:                         # 任意の追加情報を箇条書きで自由記述
  - "アクセス：飛行機で約2じかん"
  - "費用のめやす：ひとり5,000円くらい"
  - "おすすめの季節：なつ"
---
ここはあたたかくて、うみであそべるよ。
```
- `photos`：複数枚可。詳細ページで縦並びに大きめ表示。
- `order`：トップや印刷、前後ナビでの候補の並び順（昇順）。未指定時はファイル名昇順。
- `extras`：配列の各要素を `<li>` で箇条書き表示。項目名・内容ともに自由記述。空配列または省略で非表示。
- `latlng`：Leaflet が自動で地図上の正しい位置に配置するため、手動での x/y 座標合わせは不要。
- `labelOffset`：マーカーから吹き出しへの引き出し線の先（吹き出し位置）のピクセルオフセット。近隣候補と重なる場合のみ調整。

### 5.4 読み込み（ビルド時）
- `lib/content.ts` に `getAllTrips()` / `getTrip(id)` / `getSpots(tripId)` / `getSpot(tripId, spotId)` を実装。
- Node の `fs` で `content/` を走査（App Router のサーバコンポーネントから直接読み取り）。
- frontmatter は `gray-matter`、本文 Markdown は `react-markdown`（＋ `remark-gfm`）で描画。

---

## 6. 地図の実装（Leaflet + OpenStreetMap）

OpenStreetMap（OSM）を `react-leaflet` 経由で使用する。

### 採用理由と留意点

| 項目 | 内容 |
|------|------|
| メリット | 緯度経度から正確な地図位置へ自動変換。SVG を手作りせずに済む |
| メリット | 地名・道路・地形が入った見やすい地図が無償で利用可 |
| 注意点 | タイルを OSM サーバから実行時に取得するためネットワーク必須 |
| 注意点 | Leaflet は SSR 非対応のため `next/dynamic`（`ssr: false`）で読み込む |
| ライセンス | **「© OpenStreetMap contributors」の表示が必須**（Leaflet のデフォルト帰属表示で対応） |
| PDF 生成 | Playwright（Chromium）が実際にタイルを取得・描画する。`waitUntil: 'networkidle'` で読み込み完了を待つ |

### マーカー・吹き出し・引き出し線の実装方針

Leaflet のカスタム `DivIcon` を使い、1つの SVG アイコンの中に次の3要素をまとめて描画する（DOM が分散しない利点）。

```
┌─────────────────────────────────┐
│  DivIcon（SVG）                  │
│   ●  ←── 小さな丸（地図上の実際の場所、latlng のアンカー）
│   │  引き出し線                  │
│  ┌┴──────────────┐              │
│  │  おきなわ      │  ← 吹き出し（クリッカブル）
│  └───────────────┘              │
└─────────────────────────────────┘
```

- アイコン全体を `L.marker(latlng, { icon: customDivIcon })` で配置。`iconAnchor` を丸の中心に合わせる。
- `labelOffset` でどの方向・距離に吹き出しを置くかを調整。近くに別候補がある場合のみ値を変える。
- 吹き出しは DivIcon 内に実 URL の `<a href="/trips/[tripId]/spots/[spotId]/">` を置いてラップする。静的 export では実ファイルへのリンクになり、クリック遷移・キーボード操作・新規タブが自然に機能する（`router.push` は使わず素のリンクで十分）。

### コンポーネント構成

```tsx
// components/TripMap.tsx
'use client';
// → next/dynamic で lazy import（SSR 無効化）

// components/SpotMarker.tsx
// L.Marker + カスタム DivIcon（SVG）を生成
// DivIcon 内に <a href="/trips/[tripId]/spots/[spotId]/"> を配置して遷移
```

### 地図のサイズ・初期表示・レスポンシブ

- 地図コンテナは**固定の論理サイズ**（例 720×900px、日本列島が縦長に収まる比率）で描画し、画面幅に応じて CSS（`max-width: 100%` / `transform: scale()`）で全体を縮小する。
- 固定サイズ ＋ ズーム/パン無効化により、`labelOffset`（ピクセル指定）が全画面サイズで一貫し、画面表示と印刷PDFのレイアウトも一致する。
- 初期表示は中心・ズームの直接固定ではなく、**北海道〜沖縄を含む矩形 `JAPAN_BOUNDS` に `map.fitBounds()`** で合わせる。列島の収まりが画面サイズに依存せず安定する。

```ts
const JAPAN_BOUNDS: LatLngBoundsExpression = [
  [24.0, 122.0],  // 南西（沖縄方面）
  [46.0, 146.0],  // 北東（北海道方面）
];
```

ズーム操作・パン操作は**無効化**（`dragging: false, zoomControl: false, scrollWheelZoom: false, doubleClickZoom: false, touchZoom: false, keyboard: false`）。子供が地図を動かして吹き出し位置が分からなくなることを防ぐ。

---

## 7. PDF 生成（ビルド時・静的）

静的ホスティング（S3+CloudFront、サーバ実行なし）のため、PDF はビルド時に事前生成する。

1. `next build`（`output: 'export'`）で `out/` を生成。
2. ローカルで `out/` を配信（例 `npx serve out -l 4000`）。
3. `scripts/generate-pdf.mjs`（Playwright/Chromium）で各 `/trips/[tripId]/print/` を開き、`out/pdf/[tripId].pdf` を生成。
   - **地図描画の完了を明示的に待つ**：print ページで Leaflet マップの `whenReady` とタイルの `load` イベントを監視し `window.__mapReady = true` を立て、Playwright 側で `await page.waitForFunction(() => window.__mapReady)` を待ってから `page.pdf()` を呼ぶ。`waitUntil: 'networkidle'` だけではタイル描画前に進み、地図が白紙のまま PDF 化される恐れがある。
   - `page.pdf({ format: 'A4', printBackground: true })`。
   - 日本語フォントをビルド環境に導入（または print ページで Web フォントを読み込み埋め込み）。未導入だと文字が豆腐（□）になる。
   - **OSM 公式タイル（tile.openstreetmap.org）の利用規約**：大量・自動の一括取得は禁止。本用途（少数の旅行 × 限られたタイル）は問題ないが、旅行・候補が大きく増える場合はタイルプロバイダ（MapTiler 等）の利用を検討する。
4. 「いんさつする」ボタンは `<a href="/pdf/[tripId].pdf" download>` でワンクリックDL。

> 補足：内容は静的なので事前生成で十分。`window.print()` 方式（ダイアログでPDF保存）も技術的には可能だが、ワンクリックDL要件を満たす本方式を採用。

---

## 8. 技術スタック

| 区分 | 採用 | 備考 |
|------|------|------|
| フレームワーク | Next.js（App Router）/ `output: 'export'` | SSG |
| 言語 | TypeScript | |
| スタイル | Tailwind CSS | 子供向けの大ボタン・余白を素早く調整 |
| コンテンツ | Markdown ＋ gray-matter ＋ react-markdown | §5 |
| 地図 | react-leaflet ＋ OpenStreetMap タイル | §6。`next/dynamic`（`ssr: false`）で読み込み |
| PDF | Playwright（ビルド時） | §7 |
| インフラ | AWS CDK（TypeScript） | §10 |
| ホスティング | S3（非公開）＋ CloudFront（OAC） | |
| 画像 | `public/` 配下の静的ファイル | `images.unoptimized: true` |

`next.config.js`（要点）:
```js
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
};
```

---

## 9. ディレクトリ構成（案）

```
.
├─ app/
│  ├─ page.tsx                         # トップ
│  ├─ not-found.tsx
│  └─ trips/[tripId]/
│     ├─ page.tsx                      # 地図ページ（=入口）
│     ├─ spots/[spotId]/page.tsx       # 詳細
│     └─ print/page.tsx                # 印刷用
├─ components/
│  ├─ TripMap.tsx                      # Leaflet地図＋カスタムマーカー（next/dynamicでlazy import）
│  ├─ SpotMarker.tsx                   # DivIconマーカー（丸＋引き出し線＋吹き出し）
│  ├─ SpotDetail.tsx                   # 詳細表示（画面/印刷で共用）
│  ├─ PrintButton.tsx
│  └─ TripCard.tsx
├─ lib/content.ts                      # Markdown読み込み
├─ content/trips/...                   # §5
├─ public/
│  └─ photos/...                       # 候補写真（静的）
├─ out/pdf/                            # ビルド後にgenerate-pdfが出力（next buildの後に生成）
├─ scripts/generate-pdf.mjs            # Playwright
├─ infra/                              # AWS CDK アプリ（§10）
│  ├─ bin/app.ts
│  ├─ lib/site-stack.ts
│  └─ cloudfront-rewrite.js            # CloudFront Function
├─ next.config.js
└─ package.json
```

---

## 10. インフラ（AWS CDK）

CDK（TypeScript）で以下を1スタックに構成：

- **S3 バケット**：`blockPublicAccess: BLOCK_ALL`、公開しない。
- **CloudFront Distribution**：
  - オリジン＝上記 S3 を **OAC（Origin Access Control）** 経由で参照。
  - `defaultRootObject: 'index.html'`。
  - **CloudFront Function（viewer-request）** で末尾 `/` や拡張子なしパスに `index.html` を付与（`trailingSlash: true` の SSG を S3 配信する定番対応）。
  - エラー応答：403・404 → `/404.html`（HTTP 404）。404 ページは「ページが見つかりません。」とトップへのリンクのみ表示。
- **デプロイ＆無効化**：`aws-s3-deployment.BucketDeployment` で `../out` を配置し、`distribution` ＋ `distributionPaths: ['/*']` でキャッシュ無効化を自動化。

CloudFront Function（`infra/cloudfront-rewrite.js`）:
```js
function handler(event) {
  var request = event.request;
  var uri = request.uri;
  if (uri.endsWith('/')) {
    request.uri += 'index.html';
  } else if (!uri.includes('.')) {
    request.uri += '/index.html';
  }
  return request;
}
```

ビルド〜デプロイ手順:
```bash
next build                       # → out/
node scripts/generate-pdf.mjs    # → out/pdf/*.pdf
cd infra && cdk deploy           # BucketDeployment が out/ を配置し無効化まで実施
```

独自ドメインは使用しない。CloudFront が発行するデフォルト URL（`*.cloudfront.net`）で運用する。ACM 証明書・Route53 の追加設定は不要。

---

## 11. 非機能・UX（小学校低学年向け）

- 漢字には `<ruby>` でふりがな。文は短く、1画面の情報量を絞る。
  - ただし `<ruby>` が自動で付くのは `name`（`ruby` フィールド）のみ。本文・`title`・`message`・`extras` の漢字にはふりがなが付かないため、**これらは対象年齢に合わせてひらがな主体で記述する**運用とする（将来的に本文の ruby 記法対応は拡張余地）。
- 大きなタップ領域・高コントラスト・写真主役。
- 画像 `alt` を平易に。タップ／キーボード両対応。
- SSG により初回表示は静的 HTML のみ。画像は事前に適切なサイズへ最適化。

---

## 12. 受け入れ基準（抜粋）

- [ ] トップで旅行日を選ぶと `/trips/[tripId]/`（地図）へ遷移する。
- [ ] `/trips/[tripId]/` に直接 URL で到達でき、いきなり地図が見える。
- [ ] 地図上の点から吹き出しへ引き出し線が描かれ、吹き出しクリックで詳細へ遷移する。
- [ ] 詳細ページから地図へ戻れる。
- [ ] 印刷ボタンで、その旅行の地図＋全詳細を含む PDF をワンクリックでDLできる。
- [ ] `cdk deploy` 後、S3+CloudFront でクリーン URL として閲覧できる。

---

## 13. 未決事項

なし。全項目確定済み。設計書をそのまま Claude Code への実装指示として使用できる。
