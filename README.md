# 旅行先ピッカー

子供（小学校低学年）が旅行先を自分で選べる Web サイト。  
候補スポットを地図上に表示し、写真や特徴をカードで比較できます。

## 技術スタック

- **Next.js (App Router・SSG)**：静的サイト出力（`output: 'export'`）
- **Leaflet**：インタラクティブ地図
- **Tailwind CSS**：スタイリング
- **Playwright**：PDF 生成スクリプト
- **AWS CDK (S3 + CloudFront OAC)**：本番配信

---

## 開発・ビルド

```bash
npm install
npm run dev        # 開発サーバー http://localhost:3000
npm run build      # SSG ビルド → out/ に出力
```

---

## コンテンツの構成

```
content/
└── trips/
    └── <tripId>/          # 旅行ごとのフォルダ（例: 2026-summer）
        ├── trip.md        # 旅行のメタ情報
        └── spots/
            └── <spotId>.md  # 候補スポット（1ファイル＝1スポット）

public/
└── photos/
    └── <tripId>/
        └── <spotId>/
            ├── 1.jpg      # 写真（1.jpg, 2.jpg, … の連番）
            └── 2.jpg
```

---

## 旅行メタ情報：`trip.md`

`content/trips/<tripId>/trip.md` に以下の frontmatter のみを記述します（本文は不要）。

```yaml
---
id: "2026-summer"        # フォルダ名と一致させる
date: "2026年なつ"        # 表示用の日付ラベル
title: "なつやすみのりょこう"  # ページタイトル
message: "どこにいきたい？"   # トップページに表示するメッセージ
order: 1                 # 複数旅行がある場合の表示順（小さい順）
---
```

---

## スポット情報：`spots/<spotId>.md`

`content/trips/<tripId>/spots/<spotId>.md` に以下を記述します。

```yaml
---
id: "kaiyukan"           # ファイル名（.md を除く）と一致させる
name: "海遊館"            # スポット名（漢字 OK・ふりがなを ruby に別途指定）
ruby: "かいゆうかん"       # name のふりがな（全てひらがな）
area: "大阪府"            # 都道府県名または地域名
order: 1                 # 地図・一覧での表示順（小さい順）
latlng: [34.6549, 135.4290]   # 緯度・経度（10進数）
labelOffset: [-80, -40]  # 地図上の吹き出しオフセット [x, y]（ピクセル）
photos:
  - /photos/2026-summer/kaiyukan/1.jpg   # /photos/<tripId>/<spotId>/<番号>.<拡張子>
  - /photos/2026-summer/kaiyukan/2.jpg
points:
  - "おおきなジンベエザメがいる"   # 箇条書きのポイント（ひらがな主体）
  - "にほんさいだいきゅうのすいぞくかん"
extras:
  - "アクセス：くるまでやく1じかんはん"  # 補足情報（アクセス・季節など）
---
おおきなすいそうにおさかながたくさん！  # 本文（1〜2文のひらがな説明）
```

### フィールド詳細

| フィールド | 必須 | 説明 |
|-----------|------|------|
| `id` | ○ | ファイル名と同じ文字列（英数字・ハイフン） |
| `name` | ○ | スポット名（漢字・カタカナ可） |
| `ruby` | ○ | `name` のふりがな（全てひらがな） |
| `area` | ○ | 都道府県など地域名 |
| `order` | ○ | 表示順（数字が小さいほど先） |
| `latlng` | ○ | 緯度・経度の配列 `[緯度, 経度]` |
| `labelOffset` | ○ | 吹き出し位置調整 `[x, y]`（他の吹き出しと重なる場合に調整） |
| `photos` | ○ | 写真の **ルートからのフルパス** の配列（例: `/photos/2026-summer/kaiyukan/1.jpg`）。写真なしは `[]` |
| `points` | ○ | 特徴・見どころ（箇条書き・ひらがな主体） |
| `extras` | ○ | 補足情報（アクセス・季節など）。空配列 `[]` でも可 |
| 本文 | ○ | 1〜2文のひらがな説明文 |

---

## 写真の配置

```
public/photos/<tripId>/<spotId>/1.jpg
public/photos/<tripId>/<spotId>/2.webp
```

`photos` フィールドには **`/photos/` から始まるフルパス** を記述します。ファイル名だけでは表示されません。

```yaml
# ○ 正しい例
photos:
  - /photos/2026-summer/ayu-park/1.webp
  - /photos/2026-summer/ayu-park/2.webp

# × 間違い（ファイル名だけでは表示されない）
photos: [1, 2]
```

- 拡張子は `jpg` / `webp` どちらも使用可（大きすぎる場合は事前にリサイズ・圧縮しておく）
- 写真なしのスポットは `photos: []` とする

---

## 新しい旅行・スポットを追加する手順

### 旅行を追加する

1. `content/trips/<新しいtripId>/` フォルダを作成
2. `trip.md` を上記フォーマットで作成
3. `content/trips/<新しいtripId>/spots/` フォルダを作成

### スポットを追加する

1. `content/trips/<tripId>/spots/<spotId>.md` を作成
2. 写真がある場合は `public/photos/<tripId>/<spotId>/` に画像を配置
3. `npm run dev` で表示確認

---

## PDF 生成

印刷用 PDF を生成するには、ビルド後にローカルサーバーを立ち上げてから実行します。

```bash
npm run build
npx serve out -l 4000 &     # バックグラウンドでサーバー起動
node scripts/generate-pdf.mjs
```

生成された PDF は `out/` フォルダに出力されます。

---

## インフラ（AWS）

```bash
cd infra
npm install
npx cdk deploy
```

- S3 + CloudFront OAC で `out/` を静的配信
- 独自ドメインなし（`*.cloudfront.net` の URL で運用）
- `cloudfront-rewrite.js`（CloudFront Function）が `index.html` を正しく配信するために必要

---

## UI の方針

- 対象：小学校低学年
- テキストはひらがな主体・短文
- 漢字には `<ruby>` タグでふりがなを付ける（`name` フィールドのみ）
- 本文・`points`・`extras` はひらがなで記述する
