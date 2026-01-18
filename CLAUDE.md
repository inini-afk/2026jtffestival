# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JTF翻訳祭2026（第35回JTF Translation Festival）のティザーサイト。単一HTMLファイルで構成された静的ウェブサイト。

## Technology Stack

- **HTML5** with embedded CSS and JavaScript
- **Tailwind CSS** (CDN版)
- **Google Fonts**: Inter (英語), Noto Sans JP (日本語)
- **FontAwesome** (アイコン)
- **MicroCMS**: ニュース記事の取得（Fetch API経由）

## Development

ビルドツールなし。`index.html`をブラウザで直接開くか、任意のローカルサーバーで確認。

```bash
# 例: Pythonの簡易サーバー
python -m http.server 8000
```

## MicroCMS Configuration

`index.html`内の`CMS_CONFIG`オブジェクト（354-357行目付近）でAPIキーを設定：

```javascript
const CMS_CONFIG = {
    serviceDomain: 'YOUR_DOMAIN',
    apiKey: 'YOUR_API_KEY',
};
```

APIキー未設定時はダミーデータが表示される。

## Key Sections

- **Hero**: メインビジュアルとCTA
- **Concept**: イベントコンセプト説明
- **Features**: Bento Gridレイアウトの特徴紹介
- **News**: MicroCMSから取得したニュース一覧
- **Archive**: 開催情報（時期・場所・主催）
- **Footer**: ニュースレター登録フォーム（デモ用）

## CSS Architecture

- カスタムCSSは`<style>`タグ内に記述
- `.reveal`クラス: Intersection Observerによるスクロールアニメーション
- `.bento-card`: ホバーエフェクト付きカード
- `.orb`: 背景のパララックスエフェクト
