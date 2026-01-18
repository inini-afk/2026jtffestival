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
│  ホスティング: Vercel Pro ($20/月)                           │
└─────────────────────────────────────────────────────────────┘
      │         │         │         │         │
      ▼         ▼         ▼         ▼         ▼
┌────────┐┌────────┐┌────────┐┌──────────┐┌────────┐
│Supabase││ Stripe ││MicroCMS││Cloudflare││ Resend │
│認証・DB ││  決済  ││ニュース ││  Stream  ││ メール │
└────────┘└────────┘└────────┘└──────────┘└────────┘
```

### 各サービスの役割

| サービス | 役割 |
|----------|------|
| **Next.js (Vercel Pro)** | フロントエンド + API Routes |
| **Supabase** | 認証、ユーザーDB、注文・チケット管理 |
| **Stripe** | チケット決済 |
| **MicroCMS** | ニュース・セッション情報（継続利用） |
| **Cloudflare Stream** | オンデマンド動画配信（署名付きURL） |
| **Resend** | トランザクションメール（React Email） |

### メール送信タイミング

| タイミング | 内容 |
|------------|------|
| ユーザー登録時 | メールアドレス確認 |
| チケット購入時 | 購入完了通知、領収書 |
| 参加者招待時 | 招待リンク送信 |
| イベント前 | リマインダー |
| 動画公開時 | 視聴開始のお知らせ |

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

## Cost Optimization（コスト最適化方針）

イベント期間のみ有料サービスを利用し、終了後は静的ページに戻してコストを最小化する。

### イベント期間中（約3-4ヶ月）

| サービス | 月額 | 備考 |
|----------|------|------|
| Vercel Pro | $20 | 商用利用・API Routes |
| Supabase | $0〜25 | Free枠で収まる可能性大 |
| Stripe | 3.6% | 決済手数料のみ |
| Cloudflare Stream | $5〜 | 視聴時間従量課金 |
| Resend | $0 | 月3,000通まで無料 |

**想定月額: 約$25〜50（約4,000〜8,000円）**

### イベント終了後

| サービス | 月額 | 備考 |
|----------|------|------|
| GitHub Pages / Vercel Hobby | $0 | 静的ページのみ |

**月額: $0**

### 終了時の作業

#### 残すもの（静的アーカイブ）
- トップページ（アーカイブ版）
- セッション一覧（登壇者・資料リンク）
- 開催レポート・写真ギャラリー
- 過去のニュース記事

#### 停止するもの
- Vercel Pro → Hobbyにダウングレード
- Supabase → データエクスポート後に削除
- Cloudflare Stream → 配信期間終了後に停止
- マイページ機能 → 静的な「終了しました」ページに差し替え

#### データ保全
- 購入者リスト・参加者データをCSVエクスポート
- 問い合わせ履歴をバックアップ

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
