import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getVideoIdForSession, getSignedStreamUrl } from "@/lib/cloudflare-stream";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  // チケットのオンデマンド視聴権を確認
  const { data: tickets, error: ticketError } = await supabase
    .from("tickets")
    .select(
      "id, ticket_type_id, ticket_types!tickets_ticket_type_id_fkey(includes_online)"
    )
    .or(`attendee_id.eq.${user.id},purchaser_id.eq.${user.id}`)
    .eq("ticket_types.includes_online", true);

  if (ticketError) {
    return NextResponse.json(
      { error: "チケット情報の取得に失敗しました" },
      { status: 500 }
    );
  }

  if (!tickets || tickets.length === 0) {
    return NextResponse.json(
      { error: "オンデマンド視聴権がありません" },
      { status: 403 }
    );
  }

  // セッションIDからCloudflare StreamのVideo IDを取得
  const videoId = getVideoIdForSession(sessionId);

  if (!videoId) {
    return NextResponse.json(
      { error: "この動画はまだ公開されていません" },
      { status: 404 }
    );
  }

  // 署名付きURLを生成
  try {
    const url = await getSignedStreamUrl(videoId);
    return NextResponse.json({
      url,
      sessionId,
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return NextResponse.json(
      { error: "動画URLの生成に失敗しました" },
      { status: 500 }
    );
  }
}
