"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

interface SessionInfo {
  id: string;
  title: string;
  speaker: string;
  description: string;
}

// ダミーセッションデータ（MicroCMS接続後に置き換え）
const DUMMY_SESSIONS: Record<string, SessionInfo> = {
  "session-1": {
    id: "session-1",
    title: "AI時代の翻訳品質管理",
    speaker: "山田 太郎",
    description:
      "AI翻訳ツールの進化に伴い、翻訳品質管理のあり方も大きく変わりつつあります。本セッションでは、最新のQA手法と実践的なワークフローを紹介します。",
  },
  "session-2": {
    id: "session-2",
    title: "法律翻訳における最新トレンド",
    speaker: "佐藤 花子",
    description:
      "国際契約や法規制の翻訳における最新の動向と、実務で役立つテクニックを解説します。",
  },
  "session-3": {
    id: "session-3",
    title: "翻訳テクノロジーの未来",
    speaker: "鈴木 一郎",
    description:
      "機械翻訳、翻訳メモリ、用語管理など、翻訳テクノロジーの最新動向と今後の展望について議論します。",
  },
};

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const sessionId = params.sessionId as string;

  const [hasAccess, setHasAccess] = useState(false);
  const [checking, setChecking] = useState(true);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const session = DUMMY_SESSIONS[sessionId];

  const userId = user?.id;

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      setChecking(false);
      return;
    }

    // Prevent re-fetching if we already have a stream URL
    if (streamUrl) return;

    async function checkAccessAndGetStream() {
      try {
        // チケットのオンデマンド視聴権を確認
        const supabase = createClient();
        const { data: tickets, error: ticketError } = await supabase
          .from("tickets")
          .select("id, ticket_type_id, ticket_types!tickets_ticket_type_id_fkey(includes_online)")
          .or(`attendee_id.eq.${userId},purchaser_id.eq.${userId}`)
          .eq("ticket_types.includes_online", true);

        if (ticketError) {
          setError("チケット情報の取得に失敗しました。");
          setChecking(false);
          return;
        }

        const hasOnlineTicket = tickets && tickets.length > 0;
        if (!hasOnlineTicket) {
          setHasAccess(false);
          setChecking(false);
          return;
        }

        setHasAccess(true);

        // 署名付きURLを取得
        const res = await fetch(`/api/stream/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setStreamUrl(data.url);
        } else {
          setError("動画URLの取得に失敗しました。");
        }
      } catch {
        setError("エラーが発生しました。");
      } finally {
        setChecking(false);
      }
    }

    checkAccessAndGetStream();
  }, [userId, authLoading, sessionId, streamUrl]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-4">
            ログインが必要です
          </h1>
          <p className="text-gray-600 mb-6">
            動画を視聴するにはログインしてください。
          </p>
          <button
            onClick={() => router.push(`/login?redirect=/watch/${sessionId}`)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            ログインページへ
          </button>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-4">
            視聴権限がありません
          </h1>
          <p className="text-gray-600 mb-6">
            この動画を視聴するには、オンデマンド視聴権付きのチケットが必要です。
          </p>
          <button
            onClick={() => router.push("/ticket")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            チケット購入ページへ
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-red-600 mb-4">エラー</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* 動画プレイヤー */}
        <div className="bg-black rounded-lg overflow-hidden mb-6 aspect-video">
          {streamUrl ? (
            <iframe
              src={streamUrl}
              className="w-full h-full"
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <p>動画を読み込み中...</p>
            </div>
          )}
        </div>

        {/* セッション情報 */}
        {session ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {session.title}
            </h1>
            <p className="text-blue-600 font-medium mb-4">{session.speaker}</p>
            <p className="text-gray-600 leading-relaxed">
              {session.description}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              セッション: {sessionId}
            </h1>
            <p className="text-gray-500">セッション情報が見つかりません。</p>
          </div>
        )}

        {/* 戻るリンク */}
        <div className="mt-6">
          <button
            onClick={() => router.push("/sessions")}
            className="text-blue-600 hover:text-blue-800 transition"
          >
            ← セッション一覧に戻る
          </button>
        </div>
      </div>
    </div>
  );
}
