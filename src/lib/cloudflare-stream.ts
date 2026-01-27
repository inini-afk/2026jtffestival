const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const API_TOKEN = process.env.CLOUDFLARE_STREAM_API_TOKEN!;

// セッションID → Cloudflare Stream Video ID のマッピング
// MicroCMSまたはDBから取得する想定。暫定的にここで定義。
const SESSION_VIDEO_MAP: Record<string, string> = {
  "session-1": "20dd2d05323138ce5cde1f45bab5e606",
};

/**
 * セッションIDからCloudflare StreamのVideo IDを取得
 */
export function getVideoIdForSession(sessionId: string): string | null {
  return SESSION_VIDEO_MAP[sessionId] || null;
}

/**
 * Cloudflare Stream APIで署名付きトークンを取得（有効期限: 4時間）
 */
async function generateSignedToken(videoId: string): Promise<string> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/${videoId}/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        exp: Math.floor(Date.now() / 1000) + 4 * 60 * 60,
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudflare token API error: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.result.token;
}

/**
 * 署名付きiframe URLを生成
 */
export async function getSignedStreamUrl(videoId: string): Promise<string> {
  const token = await generateSignedToken(videoId);
  return `https://iframe.videodelivery.net/${token}`;
}
