# Sponsor Logos

スポンサーロゴの配置ディレクトリです。

## ディレクトリ構成

```
sponsors/
├── diamond/    # ダイヤモンドスポンサー
├── gold/       # ゴールドスポンサー
└── silver/     # シルバースポンサー
```

## 推奨画像サイズ

| ティア | 推奨サイズ | 最大表示サイズ |
|--------|-----------|---------------|
| Diamond | 640×320px | 320×160px |
| Gold | 448×224px | 224×112px |
| Silver | 352×176px | 176×88px |

## 画像形式

- **推奨**: PNG（透過背景）
- **代替**: SVG, WebP
- **ファイル名**: 英数字とハイフンのみ（例: `company-name.png`）

## 使用方法

1. 該当するティアのフォルダにロゴ画像を配置
2. `src/app/page.tsx` の SponsorLogo コンポーネントを更新
3. 必要に応じてリンクURL（`url`プロパティ）を追加

```tsx
<SponsorLogo
  tier="diamond"
  name="スポンサー名"
  logo="/sponsors/diamond/company-name.png"
  url="https://example.com"  // オプション
/>
```
