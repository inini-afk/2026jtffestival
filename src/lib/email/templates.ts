/**
 * Email Templates for JTF Translation Festival 2026
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Common styles
const styles = {
  container: `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 40px 20px;
    background-color: #ffffff;
  `,
  header: `
    text-align: center;
    margin-bottom: 40px;
  `,
  logo: `
    font-size: 24px;
    font-weight: bold;
    color: #0071e3;
  `,
  content: `
    padding: 0 20px;
  `,
  heading: `
    font-size: 24px;
    font-weight: bold;
    color: #1d1d1f;
    margin-bottom: 20px;
  `,
  paragraph: `
    font-size: 16px;
    line-height: 1.6;
    color: #424245;
    margin-bottom: 20px;
  `,
  button: `
    display: inline-block;
    background-color: #0071e3;
    color: #ffffff;
    padding: 14px 28px;
    border-radius: 12px;
    text-decoration: none;
    font-weight: 600;
    font-size: 16px;
  `,
  buttonContainer: `
    text-align: center;
    margin: 32px 0;
  `,
  footer: `
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #e5e5e5;
    text-align: center;
    font-size: 14px;
    color: #86868b;
  `,
  infoBox: `
    background-color: #f5f5f7;
    border-radius: 12px;
    padding: 20px;
    margin: 20px 0;
  `,
  infoLabel: `
    font-size: 12px;
    color: #86868b;
    margin-bottom: 4px;
  `,
  infoValue: `
    font-size: 16px;
    color: #1d1d1f;
    font-weight: 500;
  `,
};

/**
 * Base email template wrapper
 */
function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7;">
  <div style="${styles.container}">
    <div style="${styles.header}">
      <div style="${styles.logo}">JTF翻訳祭2026</div>
    </div>
    <div style="${styles.content}">
      ${content}
    </div>
    <div style="${styles.footer}">
      <p>一般社団法人日本翻訳連盟（JTF）</p>
      <p>〒104-0032 東京都中央区八丁堀2-8-1</p>
      <p>このメールに心当たりがない場合は、お手数ですがこのメールを削除してください。</p>
    </div>
  </div>
</body>
</html>
`;
}

// =============================================
// Invitation Email
// =============================================
export interface InviteEmailParams {
  inviteeName?: string;
  purchaserName: string;
  ticketTypeName: string;
  inviteToken: string;
}

export function inviteEmail(params: InviteEmailParams): { subject: string; html: string; text: string } {
  const { inviteeName, purchaserName, ticketTypeName, inviteToken } = params;
  const inviteUrl = `${BASE_URL}/invite/${inviteToken}`;

  const subject = `【JTF翻訳祭2026】${purchaserName}さんからチケットの招待が届いています`;

  const html = baseTemplate(`
    <h1 style="${styles.heading}">チケットの招待が届いています</h1>

    <p style="${styles.paragraph}">
      ${inviteeName ? `${inviteeName}様` : "こんにちは"}
    </p>

    <p style="${styles.paragraph}">
      <strong>${purchaserName}</strong>さんから、JTF翻訳祭2026のチケットに招待されました。
    </p>

    <div style="${styles.infoBox}">
      <div style="${styles.infoLabel}">チケット種別</div>
      <div style="${styles.infoValue}">${ticketTypeName}</div>
    </div>

    <p style="${styles.paragraph}">
      以下のボタンをクリックして、招待を受け取ってください。
      アカウントをお持ちでない場合は、新規登録が必要です。
    </p>

    <div style="${styles.buttonContainer}">
      <a href="${inviteUrl}" style="${styles.button}">招待を受け取る</a>
    </div>

    <p style="${styles.paragraph}; font-size: 14px; color: #86868b;">
      このリンクの有効期限は7日間です。期限が切れた場合は、招待者に再送をお願いしてください。
    </p>

    <p style="${styles.paragraph}; font-size: 14px; color: #86868b;">
      ボタンが機能しない場合は、以下のURLをブラウザに貼り付けてください：<br>
      <a href="${inviteUrl}" style="color: #0071e3; word-break: break-all;">${inviteUrl}</a>
    </p>
  `);

  const text = `
JTF翻訳祭2026 - チケットの招待が届いています

${inviteeName ? `${inviteeName}様` : "こんにちは"}

${purchaserName}さんから、JTF翻訳祭2026のチケットに招待されました。

チケット種別: ${ticketTypeName}

以下のURLをクリックして、招待を受け取ってください：
${inviteUrl}

このリンクの有効期限は7日間です。

---
一般社団法人日本翻訳連盟（JTF）
このメールに心当たりがない場合は、お手数ですがこのメールを削除してください。
`;

  return { subject, html, text };
}

// =============================================
// Purchase Confirmation Email
// =============================================
export interface PurchaseEmailParams {
  purchaserName: string;
  orderNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
}

export function purchaseConfirmationEmail(params: PurchaseEmailParams): { subject: string; html: string; text: string } {
  const { purchaserName, orderNumber, items, subtotal, tax, total, paymentMethod } = params;
  const mypageUrl = `${BASE_URL}/mypage`;

  const subject = `【JTF翻訳祭2026】ご購入ありがとうございます（注文番号: ${orderNumber}）`;

  const formatPrice = (price: number) => `¥${price.toLocaleString()}`;

  const paymentMethodLabel: Record<string, string> = {
    card: "クレジットカード",
    bank_transfer: "銀行振込",
    invoice: "請求書払い",
  };

  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">${item.name}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">${formatPrice(item.unitPrice * item.quantity)}</td>
      </tr>
    `
    )
    .join("");

  const html = baseTemplate(`
    <h1 style="${styles.heading}">ご購入ありがとうございます</h1>

    <p style="${styles.paragraph}">
      ${purchaserName}様
    </p>

    <p style="${styles.paragraph}">
      JTF翻訳祭2026のチケットをご購入いただき、ありがとうございます。
      ご注文内容は以下の通りです。
    </p>

    <div style="${styles.infoBox}">
      <div style="${styles.infoLabel}">注文番号</div>
      <div style="${styles.infoValue}">${orderNumber}</div>
      <div style="${styles.infoLabel}; margin-top: 12px;">決済方法</div>
      <div style="${styles.infoValue}">${paymentMethodLabel[paymentMethod] || paymentMethod}</div>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="border-bottom: 2px solid #1d1d1f;">
          <th style="text-align: left; padding: 12px 0; font-weight: 600;">商品</th>
          <th style="text-align: center; padding: 12px 0; font-weight: 600;">数量</th>
          <th style="text-align: right; padding: 12px 0; font-weight: 600;">金額</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding: 12px 0; text-align: right;">小計</td>
          <td style="padding: 12px 0; text-align: right;">${formatPrice(subtotal)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 12px 0; text-align: right;">消費税（10%）</td>
          <td style="padding: 12px 0; text-align: right;">${formatPrice(tax)}</td>
        </tr>
        <tr style="font-weight: bold; font-size: 18px;">
          <td colspan="2" style="padding: 12px 0; text-align: right;">合計</td>
          <td style="padding: 12px 0; text-align: right;">${formatPrice(total)}</td>
        </tr>
      </tfoot>
    </table>

    <p style="${styles.paragraph}">
      購入されたチケットは、マイページから参加者を招待することができます。
    </p>

    <div style="${styles.buttonContainer}">
      <a href="${mypageUrl}" style="${styles.button}">マイページを開く</a>
    </div>
  `);

  const itemsText = items
    .map((item) => `  - ${item.name} x ${item.quantity}: ${formatPrice(item.unitPrice * item.quantity)}`)
    .join("\n");

  const text = `
JTF翻訳祭2026 - ご購入ありがとうございます

${purchaserName}様

JTF翻訳祭2026のチケットをご購入いただき、ありがとうございます。

注文番号: ${orderNumber}
決済方法: ${paymentMethodLabel[paymentMethod] || paymentMethod}

【ご注文内容】
${itemsText}

小計: ${formatPrice(subtotal)}
消費税: ${formatPrice(tax)}
合計: ${formatPrice(total)}

購入されたチケットは、マイページから参加者を招待することができます。
${mypageUrl}

---
一般社団法人日本翻訳連盟（JTF）
`;

  return { subject, html, text };
}

// =============================================
// Welcome Email (after registration)
// =============================================
export interface WelcomeEmailParams {
  name: string;
}

export function welcomeEmail(params: WelcomeEmailParams): { subject: string; html: string; text: string } {
  const { name } = params;
  const ticketUrl = `${BASE_URL}/ticket`;

  const subject = `【JTF翻訳祭2026】ご登録ありがとうございます`;

  const html = baseTemplate(`
    <h1 style="${styles.heading}">ようこそ、JTF翻訳祭2026へ</h1>

    <p style="${styles.paragraph}">
      ${name}様
    </p>

    <p style="${styles.paragraph}">
      JTF翻訳祭2026へのご登録ありがとうございます。
      アカウントの作成が完了しました。
    </p>

    <p style="${styles.paragraph}">
      チケットを購入して、翻訳業界最大級のイベントにご参加ください。
    </p>

    <div style="${styles.buttonContainer}">
      <a href="${ticketUrl}" style="${styles.button}">チケットを購入する</a>
    </div>

    <div style="${styles.infoBox}">
      <p style="margin: 0; font-size: 14px;">
        <strong>開催日時:</strong> 2026年11月（詳細は後日発表）<br>
        <strong>会場:</strong> 東京（詳細は後日発表）<br>
        <strong>形式:</strong> 会場参加＋オンデマンド配信
      </p>
    </div>
  `);

  const text = `
JTF翻訳祭2026 - ご登録ありがとうございます

${name}様

JTF翻訳祭2026へのご登録ありがとうございます。
アカウントの作成が完了しました。

チケットを購入して、翻訳業界最大級のイベントにご参加ください。
${ticketUrl}

開催日時: 2026年11月（詳細は後日発表）
会場: 東京（詳細は後日発表）
形式: 会場参加＋オンデマンド配信

---
一般社団法人日本翻訳連盟（JTF）
`;

  return { subject, html, text };
}

// =============================================
// Invite Accepted Email (to purchaser)
// =============================================
export interface InviteAcceptedEmailParams {
  purchaserName: string;
  attendeeName: string;
  attendeeEmail: string;
  ticketTypeName: string;
}

export function inviteAcceptedEmail(params: InviteAcceptedEmailParams): { subject: string; html: string; text: string } {
  const { purchaserName, attendeeName, attendeeEmail, ticketTypeName } = params;
  const mypageUrl = `${BASE_URL}/mypage`;

  const subject = `【JTF翻訳祭2026】${attendeeName}さんが招待を受け取りました`;

  const html = baseTemplate(`
    <h1 style="${styles.heading}">招待が受け取られました</h1>

    <p style="${styles.paragraph}">
      ${purchaserName}様
    </p>

    <p style="${styles.paragraph}">
      お送りいただいた招待が受け取られました。
    </p>

    <div style="${styles.infoBox}">
      <div style="${styles.infoLabel}">参加者名</div>
      <div style="${styles.infoValue}">${attendeeName}</div>
      <div style="${styles.infoLabel}; margin-top: 12px;">メールアドレス</div>
      <div style="${styles.infoValue}">${attendeeEmail}</div>
      <div style="${styles.infoLabel}; margin-top: 12px;">チケット種別</div>
      <div style="${styles.infoValue}">${ticketTypeName}</div>
    </div>

    <div style="${styles.buttonContainer}">
      <a href="${mypageUrl}" style="${styles.button}">マイページで確認</a>
    </div>
  `);

  const text = `
JTF翻訳祭2026 - 招待が受け取られました

${purchaserName}様

お送りいただいた招待が受け取られました。

参加者名: ${attendeeName}
メールアドレス: ${attendeeEmail}
チケット種別: ${ticketTypeName}

マイページで確認: ${mypageUrl}

---
一般社団法人日本翻訳連盟（JTF）
`;

  return { subject, html, text };
}
