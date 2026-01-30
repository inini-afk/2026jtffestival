"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks";
import { createClient } from "@/lib/supabase/client";
import { Navigation, BackgroundOrbs } from "@/components";

interface Session {
  id: string;
  title: string;
  speaker: string;
  description: string;
  duration: string;
  thumbnail: string;
  category: string;
  categoryLabel: string;
}

// ダミーセッションデータ（MicroCMS接続後に置き換え）
const SESSIONS: Session[] = [
  {
    id: "session-1",
    title: "AIと共存する翻訳者のキャリア戦略",
    speaker: "山田 太郎",
    description:
      "20年以上の翻訳業界経験を持ち、テクノロジーと人間の協働について研究。生成AI時代における翻訳者の新しい役割と価値創造について語ります。",
    duration: "45分",
    thumbnail: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&h=450&fit=crop",
    category: "keynote",
    categoryLabel: "基調講演",
  },
  {
    id: "session-2",
    title: "グローバル企業のローカライゼーション戦略",
    speaker: "Sarah Johnson",
    description:
      "Fortune 500企業でのローカライゼーション戦略を15年間リード。多言語展開とブランド一貫性の両立について、実践的な知見を共有します。",
    duration: "50分",
    thumbnail: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&h=450&fit=crop",
    category: "keynote",
    categoryLabel: "基調講演",
  },
  {
    id: "session-3",
    title: "医薬翻訳における品質管理の最前線",
    speaker: "鈴木 美咲",
    description:
      "医薬品の承認申請書類翻訳のスペシャリスト。規制要件を満たしながら効率的に高品質な翻訳を提供するためのワークフローを解説します。",
    duration: "60分",
    thumbnail: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=450&fit=crop",
    category: "workshop",
    categoryLabel: "ワークショップ",
  },
  {
    id: "session-4",
    title: "大規模言語モデルと翻訳の未来",
    speaker: "Michael Chen",
    description:
      "最先端のNLP研究者として、GPTやその他のLLMが翻訳業界に与える影響と、今後5年間の技術トレンドを予測します。",
    duration: "55分",
    thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=450&fit=crop",
    category: "ai",
    categoryLabel: "AI・テクノロジー",
  },
  {
    id: "session-5",
    title: "特許翻訳のクオリティコントロール",
    speaker: "田中 健一",
    description:
      "30年以上の特許翻訳経験を活かし、技術文書の正確性と法的要件を両立させる手法について、具体的な事例とともに解説します。",
    duration: "50分",
    thumbnail: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&h=450&fit=crop",
    category: "workshop",
    categoryLabel: "ワークショップ",
  },
];

function getCategoryColor(category: string) {
  switch (category) {
    case "keynote":
      return "bg-red-100 text-red-600";
    case "panel":
      return "bg-purple-100 text-purple-600";
    case "workshop":
      return "bg-green-100 text-green-600";
    case "ai":
      return "bg-blue-100 text-blue-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export default function StreamingPage() {
  const { user, loading: authLoading } = useAuth();
  const [hasOnlineAccess, setHasOnlineAccess] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setChecking(false);
      return;
    }

    async function checkAccess() {
      if (!user) return;
      try {
        const supabase = createClient();
        const { data: tickets } = await supabase
          .from("tickets")
          .select(
            "id, ticket_type_id, ticket_types!tickets_ticket_type_id_fkey(includes_online)"
          )
          .or(`attendee_id.eq.${user.id},purchaser_id.eq.${user.id}`)
          .eq("ticket_types.includes_online", true);

        setHasOnlineAccess(tickets !== null && tickets.length > 0);
      } catch (error) {
        console.error("Error checking access:", error);
      } finally {
        setChecking(false);
      }
    }

    checkAccess();
  }, [user, authLoading]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <BackgroundOrbs />
        <Navigation />
        <main className="pt-24 pb-20 px-6">
          <div className="max-w-md mx-auto text-center">
            <div className="info-card rounded-3xl p-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-bold mb-4">ログインが必要です</h1>
              <p className="text-gray-500 mb-6">
                オンデマンド配信を視聴するにはログインしてください。
              </p>
              <Link
                href="/login?redirect=/mypage/streaming"
                className="inline-block bg-[#0071e3] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#0077ed] transition-colors"
              >
                ログインする
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!hasOnlineAccess) {
    return (
      <>
        <BackgroundOrbs />
        <Navigation />
        <main className="pt-24 pb-20 px-6">
          <div className="max-w-md mx-auto text-center">
            <div className="info-card rounded-3xl p-8">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-bold mb-4">
                オンデマンド視聴権がありません
              </h1>
              <p className="text-gray-500 mb-6">
                オンデマンド配信を視聴するには、オンデマンド視聴権付きのチケットが必要です。
              </p>
              <div className="space-y-3">
                <Link
                  href="/ticket"
                  className="block bg-[#0071e3] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#0077ed] transition-colors"
                >
                  チケットを購入する
                </Link>
                <Link
                  href="/mypage"
                  className="block text-gray-500 hover:text-gray-700 transition-colors"
                >
                  マイページに戻る
                </Link>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <BackgroundOrbs />
      <Navigation />

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/mypage"
              className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
            >
              ← マイページに戻る
            </Link>
            <h1 className="text-3xl font-bold mb-2">オンデマンド配信</h1>
            <p className="text-gray-500">
              すべてのセッションをいつでもご視聴いただけます。
            </p>
          </div>

          {/* Sessions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SESSIONS.map((session) => (
              <Link
                key={session.id}
                href={`/watch/${session.id}`}
                className="info-card rounded-2xl overflow-hidden group hover:shadow-lg transition-all"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gray-100 overflow-hidden">
                  <img
                    src={session.thumbnail}
                    alt={session.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-gray-900 ml-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  {/* Duration badge */}
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {session.duration}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <span
                    className={`inline-block text-xs px-2 py-1 rounded-full font-medium mb-2 ${getCategoryColor(
                      session.category
                    )}`}
                  >
                    {session.categoryLabel}
                  </span>
                  <h3 className="font-bold text-lg mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {session.title}
                  </h3>
                  <p className="text-sm text-blue-600 mb-2">{session.speaker}</p>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {session.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
