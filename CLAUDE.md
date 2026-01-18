# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JTF翻訳祭2026（第35回JTF Translation Festival）の公式サイト。
現在は静的HTMLで構成されているが、今後Next.jsへ移行予定。

## Current Technology Stack（現行）

- **HTML5** with embedded CSS and JavaScript
- **Tailwind CSS** (CDN版)
- **Google Fonts**: Inter (英語), Noto Sans JP (日本語)
- **FontAwesome** (アイコン)
- **MicroCMS**: ニュース記事の取得（Fetch API経由）
- **GitHub Pages**: ホスティング（暫定）

## Target Technology Stack（移行後）

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js (App Router + TypeScript)                         │
│  ホスティング: Vercel                                        │
└─────────────────────────────────────────────────────────────┘
          │           │           │           │
          ▼           ▼           ▼           ▼
    ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────┐
    │Supabase │ │ Stripe  │ │MicroCMS │ │ Cloudflare   │
    │認証・DB │ │  決済   │ │ニュース │ │   Stream     │
    └─────────┘ └─────────┘ └─────────┘ └──────────────┘
```

### 各サービスの役割

| サービス | 役割 |
|----------|------|
| **Next.js (Vercel)** | フロントエンド + API Routes |
| **Supabase** | 認証、ユーザーDB、注文・チケット管理 |
| **Stripe** | チケット決済 |
| **MicroCMS** | ニュース・セッション情報（継続利用） |
| **Cloudflare Stream** | オンデマンド動画配信（署名付きURL） |

## Development Phases

| Phase | 内容 | 状態 |
|-------|------|------|
| 1 | Next.js化（現在のHTMLを移行） | 未着手 |
| 2 | Supabase認証（ユーザー登録・ログイン） | 未着手 |
| 3 | DB設計・実装（ユーザー・注文・チケット） | 未着手 |
| 4 | マイページ実装（申込者/参加者） | 未着手 |
| 5 | Stripe決済（チケット購入フロー） | 未着手 |
| 6 | 招待機能（メール送信・招待リンク） | 未着手 |
| 7 | Cloudflare Stream連携（動画アップロード） | 未着手 |
| 8 | 視聴ページ（チケット確認→動画再生） | 未着手 |

## Data Model（予定）

```
User（ユーザー）
├── id, email, name, role (purchaser/attendee)
│
Order（注文）
├── id, user_id, status, payment_intent_id, created_at
│
Ticket（チケット）
├── id, order_id, ticket_type, assigned_to (user_id)
├── status (unassigned/invited/registered)
├── invite_token, invite_email
│
Session（セッション）※MicroCMSで管理
├── id, title, speaker, description, video_id
```

## Authentication Flow

1. **申込者**: メール+パスワードで登録 → チケット購入 → 参加者を招待
2. **参加者**: 招待リンクからアカウント作成 → チケット受取

## Video Streaming Flow

1. ユーザーがログイン
2. チケット種別を確認（オンデマンド視聴権があるか）
3. 権限があれば署名付きURLを発行（有効期限: 数時間）
4. Cloudflare Streamで動画再生

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
