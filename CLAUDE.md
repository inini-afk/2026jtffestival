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
      │         │         │         │         │         │
      ▼         ▼         ▼         ▼         ▼         ▼
┌────────┐┌────────┐┌────────┐┌──────────┐┌────────┐┌────────┐
│Supabase││ Stripe ││MicroCMS││Cloudflare││ Resend ││ freee  │
│認証・DB ││  決済  ││ニュース ││  Stream  ││ メール ││請求書  │
└────────┘└────────┘└────────┘└──────────┘└────────┘└────────┘
```

### 各サービスの役割

| サービス | 役割 |
|----------|------|
| **Next.js (Vercel Pro)** | フロントエンド + API Routes |
| **Supabase** | 認証、ユーザーDB、注文・チケット管理 |
| **Stripe** | チケット決済（クレカ・銀行振込）、領収書発行 |
| **MicroCMS** | ニュース・セッション情報（継続利用） |
| **Cloudflare Stream** | オンデマンド動画配信（署名付きURL） |
| **Resend** | トランザクションメール（React Email） |
| **freee** | 法人向け請求書・領収書発行 |

### メール送信タイミング

| タイミング | 内容 |
|------------|------|
| ユーザー登録時 | メールアドレス確認 |
| チケット購入時 | 購入完了通知、領収書 |
| 参加者招待時 | 招待リンク送信 |
| イベント前 | リマインダー |
| 動画公開時 | 視聴開始のお知らせ |

## Application Architecture（アプリケーション構成）

### リポジトリ構成

**単一リポジトリ（モノレポ）** を採用。認証・型定義・UIコンポーネントを共有し、イベント終了後の一括アーカイブを容易にする。

### ディレクトリ構成（Next.js App Router）

```
/app
  /(public)                    # 公開ページ（認証不要）
    /page.tsx                  # LP（トップ）
    /sessions/page.tsx         # セッション一覧
    /ticket/page.tsx           # チケット案内
    /date-venue/page.tsx       # 日程・会場

  /(auth)                      # 認証系（未ログイン専用）
    /login/page.tsx            # ログイン
    /register/page.tsx         # 新規登録
    /invite/[token]/page.tsx   # 招待リンク

  /(purchaser)                 # 申込者マイページ
    /mypage/page.tsx           # ダッシュボード
    /mypage/orders/page.tsx    # 注文履歴
    /mypage/invite/page.tsx    # 参加者招待

  /(attendee)                  # 参加者マイページ
    /attendee/page.tsx         # ダッシュボード
    /attendee/tickets/page.tsx # チケット確認

  /(streaming)                 # オンデマンド配信
    /watch/[sessionId]/page.tsx

  /(admin)                     # 事務局管理画面
    /admin/page.tsx            # ダッシュボード
    /admin/orders/page.tsx     # 注文一覧
    /admin/attendees/page.tsx  # 参加者一覧
    /admin/export/page.tsx     # CSV出力

  /api                         # API Routes
    /auth/
    /checkout/
    /webhook/
    /admin/export/

/components                    # 共有コンポーネント
/lib                          # ユーティリティ
/types                        # 型定義
```

### Route Groups とアクセス制御

| Route Group | 認証 | 必要なロール |
|-------------|------|-------------|
| `(public)` | 不要 | - |
| `(auth)` | 未ログイン専用 | - |
| `(purchaser)` | 必要 | purchaser |
| `(attendee)` | 必要 | attendee |
| `(streaming)` | 必要 | チケット所有確認 |
| `(admin)` | 必要 | 管理者メールアドレス |

## Admin Panel（事務局管理画面）

### 役割分担

| 機能 | 担当システム |
|------|-------------|
| 入金確認・返金処理 | Stripe Dashboard |
| 銀行振込の消込 | Stripe Bank Transfer（自動） |
| 売上レポート・CSV | Stripe Dashboard |
| 参加者名簿 | 自作管理画面 |
| 名簿CSV出力 | 自作管理画面 |
| チケット状態管理 | 自作管理画面 |
| 招待メール再送 | 自作管理画面 |

### 管理者認証

管理者メールアドレスのリストで制御（環境変数で管理）:

```typescript
// 環境変数: ADMIN_EMAILS=admin@jtf.jp,staff1@jtf.jp,staff2@jtf.jp
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || []

export async function isAdmin(email: string) {
  return ADMIN_EMAILS.includes(email)
}
```

### CSV出力機能

| CSV種類 | 内容 |
|---------|------|
| 注文一覧.csv | 注文ID, 申込者, チケット種別, 金額, 支払状態, 日時 |
| 参加者名簿.csv | 名前, メール, 所属, チケット種別, 申込者/招待者区分 |
| 会場参加者.csv | 当日受付用（会場参加権のある人のみ） |

### Stripeチームメンバー

事務局スタッフをStripe Dashboardに招待（**Support**または**Analyst**権限）。

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
| 9 | 管理画面（名簿・CSV出力） | 未着手 |

## Data Model（予定）

```
User（ユーザー）
├── id, email, name, role (purchaser/attendee)
│
Order（注文）
├── id, user_id, status, payment_intent_id, promo_code_id, created_at
│
Ticket（チケット）
├── id, order_id, ticket_type, assigned_to (user_id)
├── status (unassigned/invited/registered)
├── invite_token, invite_email
│
PromoCode（プロモーションコード）
├── id, code, name, discount_type, fixed_price
├── max_total_uses, max_uses_per_user
├── category, is_active, valid_from, valid_until
│
PromoCodeUse（使用履歴）
├── id, promo_code_id, user_id, order_id, used_at
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

## Payment Methods（決済方法）

| 対象 | 決済方法 | フロー |
|------|----------|--------|
| 個人・法人 | クレジットカード | Stripe即時決済 → 領収書（Stripe） |
| 個人・法人 | 銀行振込 | Stripe Bank Transfer → 自動消込 → 領収書（Stripe） |
| 法人のみ | 請求書払い | freee請求書発行 → 入金確認 → freee領収書発行 |

### 請求書・領収書の発行元

| 書類 | 発行元 | 備考 |
|------|--------|------|
| 領収書（クレカ・振込） | Stripe | 決済完了時に自動発行 |
| 請求書（法人向け） | freee | 支払期日: 申込日の翌月末 |
| 領収書（請求書払い） | freee | 入金確認後に発行 |

### Stripe Bank Transfer

- 申込者ごとに専用の振込先口座番号を発行
- 入金を自動で照合（消込）
- 入金確認後、自動で領収書発行

### freee連携（法人請求書払い）

```
申込（法人・請求書払い選択）
    ↓
freee APIで請求書作成（支払期日: 翌月末）
    ↓
請求書PDFをメール送信
    ↓
入金確認（freee側 or Webhook）
    ↓
freee APIで領収書作成・送信
    ↓
Supabaseの注文ステータスを更新
```

## Promo Code System（プロモーションコード）

### 割引タイプ

| discount_type | 説明 | 適用ロジック |
|---------------|------|--------------|
| `free_all` | 全チケット無料 | 金額を0円に |
| `member_price` | 会員価格適用 | 会員価格に変更 |
| `free_venue` | 会場参加無料 | 会場分を0円に |
| `free_ondemand` | オンデマンド無料 | オンデマンド分を0円に |
| `exclude_party` | パーティー以外無料 | パーティー代のみ請求 |
| `fixed_price` | 固定価格 | 指定金額に変更 |

### カテゴリ分類

| category | 対象 | 例 |
|----------|------|-----|
| `member` | JTF会員 | 個人会員、法人会員 |
| `sponsor` | スポンサー | ダイヤモンド、ゴールド、シルバー |
| `speaker` | 登壇者 | 会場登壇、オンデマンド登壇 |
| `partner` | 後援・提携団体 | TC協会、IR協議会、JEMIMA |
| `school` | 教育機関 | 横浜国立大学、翻訳学校 |
| `staff` | 事務局・委員 | 事務局、委員 |
| `test` | テスト用 | 決済テスト |

### データベース設計

```sql
-- プロモーションコード
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,        -- コード文字列
  name VARCHAR(100) NOT NULL,              -- 表示名
  description TEXT,                        -- 備考

  -- 割引タイプ
  discount_type VARCHAR(50) NOT NULL,      -- 上記タイプ
  fixed_price INTEGER,                     -- fixed_price時の金額（円）

  -- 使用制限
  max_total_uses INTEGER,                  -- 総使用回数上限（NULL=無制限）
  max_uses_per_user INTEGER DEFAULT 1,     -- 1人あたり使用回数

  -- 対象チケット（NULL=全チケット対象）
  applicable_ticket_types TEXT[],          -- ['venue', 'online', 'party', 'full']

  -- 有効期間
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,

  -- メタ情報
  category VARCHAR(50),                    -- カテゴリ
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 使用履歴
CREATE TABLE promo_code_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID REFERENCES promo_codes(id),
  user_id UUID REFERENCES users(id),
  order_id UUID REFERENCES orders(id),
  used_at TIMESTAMP DEFAULT NOW()
);
```

### コード例（2026年度）

| コード | 名前 | 割引 | 制限 |
|--------|------|------|------|
| JTF2026-PERSONAL | JTF個人会員用 | 会員価格 | 1人1回 |
| JTF2026-CORP | JTF法人会員用 | 会員価格 | 無制限 |
| SPEAKER-2026 | 登壇者用 | 全額無料 | 1人1回 |
| DIAMOND-XXXX | ダイヤモンドスポンサー | 全額無料 | 3名まで |
| GOLD-XXXX | ゴールドスポンサー | 全額無料 | 2名まで |
| SILVER-XXXX | シルバースポンサー | 全額無料 | 1名まで |
| STUDENT-2026 | 学生プロモーション | 会員価格 | 1人1回 |
| TEST2026 | テスト用 | 1,000円固定 | 無制限 |

### 管理画面機能

- プロモーションコードのCRUD
- CSVインポート/エクスポート
- 使用状況の確認（使用数/上限）
- 有効/無効の切り替え

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

## SEO / クローラー設定

### 現在の設定（開発・テスト環境）
- `robots.txt`: 全クローラーをブロック
- 全HTMLファイルに `<meta name="robots" content="noindex, nofollow">` を設定

### 本番公開時の作業（TODO）
1. `robots.txt` を削除または以下に変更:
   ```
   User-agent: *
   Allow: /
   ```
2. 全HTMLファイルから `<meta name="robots" content="noindex, nofollow">` を削除
3. 必要に応じて `sitemap.xml` を作成

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
