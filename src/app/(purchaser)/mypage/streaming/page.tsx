"use client";

import { useEffect, useState, useRef } from "react";
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
  {
    id: "session-6",
    title: "機械翻訳APIの実践的活用法",
    speaker: "David Kim",
    description:
      "翻訳テクノロジー企業の技術責任者として、MT APIを業務に統合するためのベストプラクティスとピットフォールを共有します。",
    duration: "45分",
    thumbnail: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&h=450&fit=crop",
    category: "ai",
    categoryLabel: "AI・テクノロジー",
  },
];

const CATEGORIES = [
  { id: "keynote", label: "基調講演", icon: "🎤" },
  { id: "workshop", label: "ワークショップ", icon: "🛠" },
  { id: "ai", label: "AI・テクノロジー", icon: "🤖" },
];

function getCategoryColor(category: string) {
  switch (category) {
    case "keynote":
      return "bg-red-500";
    case "workshop":
      return "bg-green-500";
    case "ai":
      return "bg-blue-500";
    default:
      return "bg-gray-500";
  }
}

// Horizontal scroll carousel component
function SessionCarousel({
  title,
  icon,
  sessions,
}: {
  title: string;
  icon: string;
  sessions: Session[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener("scroll", checkScroll);
      return () => ref.removeEventListener("scroll", checkScroll);
    }
  }, []);

  if (sessions.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span>{icon}</span>
          {title}
          <span className="text-sm font-normal text-gray-400 ml-2">
            {sessions.length}本
          </span>
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              canScrollLeft
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-white/5 text-gray-600 cursor-not-allowed"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              canScrollRight
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-white/5 text-gray-600 cursor-not-allowed"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-6 px-6"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {sessions.map((session) => (
          <Link
            key={session.id}
            href={`/watch/${session.id}`}
            className="flex-shrink-0 w-[300px] group"
            style={{ scrollSnapAlign: "start" }}
          >
            <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-800 mb-3">
              <img
                src={session.thumbnail}
                alt={session.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform">
                  <svg className="w-6 h-6 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
              </div>

              {/* Duration */}
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded font-medium">
                {session.duration}
              </div>

              {/* Category indicator */}
              <div className={`absolute top-2 left-2 w-1 h-8 rounded-full ${getCategoryColor(session.category)}`} />
            </div>

            <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2 mb-1">
              {session.title}
            </h3>
            <p className="text-sm text-gray-400">{session.speaker}</p>
          </Link>
        ))}
      </div>
    </section>
  );
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

  // Featured session (first keynote)
  const featuredSession = SESSIONS.find((s) => s.category === "keynote");

  // Sessions grouped by category
  const sessionsByCategory = CATEGORIES.map((cat) => ({
    ...cat,
    sessions: SESSIONS.filter((s) => s.category === cat.id),
  }));

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
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
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold mb-4">ログインが必要です</h1>
              <p className="text-gray-500 mb-6">オンデマンド配信を視聴するにはログインしてください。</p>
              <Link href="/login?redirect=/mypage/streaming" className="inline-block bg-[#0071e3] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#0077ed] transition-colors">
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
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold mb-4">オンデマンド視聴権がありません</h1>
              <p className="text-gray-500 mb-6">オンデマンド配信を視聴するには、オンデマンド視聴権付きのチケットが必要です。</p>
              <div className="space-y-3">
                <Link href="/ticket" className="block bg-[#0071e3] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#0077ed] transition-colors">
                  チケットを購入する
                </Link>
                <Link href="/mypage" className="block text-gray-500 hover:text-gray-700 transition-colors">
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
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navigation />

      <main className="pt-20 pb-20">
        {/* Hero Section - Featured Session */}
        {featuredSession && (
          <section className="relative h-[70vh] min-h-[500px] mb-12">
            {/* Background image */}
            <div className="absolute inset-0">
              <img
                src={featuredSession.thumbnail}
                alt={featuredSession.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/30" />
            </div>

            {/* Content */}
            <div className="relative h-full max-w-7xl mx-auto px-6 flex items-center">
              <div className="max-w-2xl">
                <Link href="/mypage" className="text-sm text-gray-400 hover:text-white mb-6 inline-flex items-center gap-2 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  マイページに戻る
                </Link>

                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded">
                    注目
                  </span>
                  <span className="text-gray-300 text-sm">
                    {featuredSession.categoryLabel}
                  </span>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                  {featuredSession.title}
                </h1>

                <p className="text-lg text-gray-300 mb-2">
                  {featuredSession.speaker}
                </p>

                <p className="text-gray-400 mb-8 line-clamp-3 max-w-xl">
                  {featuredSession.description}
                </p>

                <div className="flex items-center gap-4">
                  <Link
                    href={`/watch/${featuredSession.id}`}
                    className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                    再生する
                  </Link>
                  <span className="text-gray-400 text-sm">
                    {featuredSession.duration}
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Category Carousels */}
        <div className="max-w-7xl mx-auto px-6">
          {/* Stats bar */}
          <div className="flex items-center gap-6 mb-8 pb-6 border-b border-white/10">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{SESSIONS.length}</div>
              <div className="text-xs text-gray-400">セッション</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {SESSIONS.reduce((acc, s) => acc + parseInt(s.duration), 0)}分
              </div>
              <div className="text-xs text-gray-400">総収録時間</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{CATEGORIES.length}</div>
              <div className="text-xs text-gray-400">カテゴリー</div>
            </div>
          </div>

          {/* Carousels by category */}
          {sessionsByCategory.map((category) => (
            <SessionCarousel
              key={category.id}
              title={category.label}
              icon={category.icon}
              sessions={category.sessions}
            />
          ))}
        </div>
      </main>

      {/* Custom scrollbar hide style */}
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
