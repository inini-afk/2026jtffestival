"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
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
  tags: string[];
  type: "seminar" | "sponsor";
}

// ダミーセッションデータ（MicroCMS接続後に置き換え）
const SESSIONS: Session[] = [
  {
    id: "session-1",
    title: "AIと共存する翻訳者のキャリア戦略",
    speaker: "山田 太郎",
    description: "生成AI時代における翻訳者の新しい役割と価値創造について語ります。",
    duration: "45分",
    thumbnail: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&h=450&fit=crop",
    tags: ["基調講演", "キャリア", "AI"],
    type: "seminar",
  },
  {
    id: "session-2",
    title: "グローバル企業のローカライゼーション戦略",
    speaker: "Sarah Johnson",
    description: "多言語展開とブランド一貫性の両立について、実践的な知見を共有します。",
    duration: "50分",
    thumbnail: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&h=450&fit=crop",
    tags: ["基調講演", "ローカライゼーション", "グローバル"],
    type: "seminar",
  },
  {
    id: "session-3",
    title: "医薬翻訳における品質管理の最前線",
    speaker: "鈴木 美咲",
    description: "規制要件を満たしながら効率的に高品質な翻訳を提供するためのワークフローを解説します。",
    duration: "60分",
    thumbnail: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=450&fit=crop",
    tags: ["医薬", "品質管理", "ワークショップ"],
    type: "seminar",
  },
  {
    id: "session-4",
    title: "大規模言語モデルと翻訳の未来",
    speaker: "Michael Chen",
    description: "GPTやその他のLLMが翻訳業界に与える影響と、今後5年間の技術トレンドを予測します。",
    duration: "55分",
    thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=450&fit=crop",
    tags: ["AI", "LLM", "テクノロジー"],
    type: "seminar",
  },
  {
    id: "session-5",
    title: "特許翻訳のクオリティコントロール",
    speaker: "田中 健一",
    description: "技術文書の正確性と法的要件を両立させる手法について、具体的な事例とともに解説します。",
    duration: "50分",
    thumbnail: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&h=450&fit=crop",
    tags: ["特許", "品質管理", "法務"],
    type: "seminar",
  },
  {
    id: "session-6",
    title: "機械翻訳APIの実践的活用法",
    speaker: "David Kim",
    description: "MT APIを業務に統合するためのベストプラクティスとピットフォールを共有します。",
    duration: "45分",
    thumbnail: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&h=450&fit=crop",
    tags: ["AI", "機械翻訳", "API"],
    type: "seminar",
  },
  // スポンサーセミナー
  {
    id: "sponsor-1",
    title: "次世代翻訳支援ツールの紹介",
    speaker: "株式会社トランステック",
    description: "最新のCAT機能と生成AI統合による翻訳ワークフローの革新をご紹介します。",
    duration: "30分",
    thumbnail: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=450&fit=crop",
    tags: ["ツール", "CAT", "生成AI"],
    type: "sponsor",
  },
  {
    id: "sponsor-2",
    title: "クラウド翻訳管理システムの最新動向",
    speaker: "グローバルワークス株式会社",
    description: "リモートワーク時代に対応した翻訳プロジェクト管理の新しいアプローチ。",
    duration: "30分",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop",
    tags: ["クラウド", "プロジェクト管理", "リモートワーク"],
    type: "sponsor",
  },
  {
    id: "sponsor-3",
    title: "品質評価AIの実用化に向けて",
    speaker: "AIトランスレーション株式会社",
    description: "AIによる翻訳品質の自動評価技術の現状と今後の展望。",
    duration: "30分",
    thumbnail: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=450&fit=crop",
    tags: ["AI", "品質評価", "自動化"],
    type: "sponsor",
  },
];

// 全タグを抽出
const ALL_TAGS = Array.from(new Set(SESSIONS.flatMap((s) => s.tags))).sort();

function SessionCard({ session }: { session: Session }) {
  return (
    <Link
      href={`/watch/${session.id}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-gray-100">
        <img
          src={session.thumbnail}
          alt={session.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Duration badge */}
        <div className="absolute bottom-3 right-3 bg-black/80 text-white text-xs px-2 py-1 rounded-md font-medium">
          {session.duration}
        </div>
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg">
            <svg className="w-6 h-6 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {session.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
          {session.title}
        </h3>

        {/* Speaker */}
        <p className="text-sm text-gray-500">{session.speaker}</p>
      </div>
    </Link>
  );
}

export default function StreamingPage() {
  const { user, loading: authLoading } = useAuth();
  const [hasOnlineAccess, setHasOnlineAccess] = useState(false);
  const [checking, setChecking] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"seminar" | "sponsor">("seminar");

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

  // Filter sessions
  const filteredSessions = useMemo(() => {
    return SESSIONS.filter((session) => {
      // Type filter
      if (session.type !== activeTab) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          session.title.toLowerCase().includes(query) ||
          session.speaker.toLowerCase().includes(query) ||
          session.description.toLowerCase().includes(query) ||
          session.tags.some((tag) => tag.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Tag filter
      if (selectedTags.length > 0) {
        const hasSelectedTag = selectedTags.some((tag) =>
          session.tags.includes(tag)
        );
        if (!hasSelectedTag) return false;
      }

      return true;
    });
  }, [searchQuery, selectedTags, activeTab]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTags([]);
  };

  // Count by type
  const seminarCount = SESSIONS.filter((s) => s.type === "seminar").length;
  const sponsorCount = SESSIONS.filter((s) => s.type === "sponsor").length;

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
    <>
      <BackgroundOrbs />
      <Navigation />

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/mypage"
              className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              マイページに戻る
            </Link>
            <h1 className="text-3xl font-bold">オンデマンド配信</h1>
            <p className="text-gray-500 mt-2">
              全{SESSIONS.length}セッションをいつでも視聴できます
            </p>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
            {/* Search bar */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="セッションを検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {ALL_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedTags.includes(tag)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tag}
                </button>
              ))}
              {(searchQuery || selectedTags.length > 0) && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 rounded-full text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  クリア
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setActiveTab("seminar")}
              className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                activeTab === "seminar"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              セミナープログラム
              <span className={`ml-2 text-sm ${activeTab === "seminar" ? "text-blue-200" : "text-gray-400"}`}>
                ({seminarCount})
              </span>
            </button>
            <button
              onClick={() => setActiveTab("sponsor")}
              className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                activeTab === "sponsor"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              スポンサーセミナー
              <span className={`ml-2 text-sm ${activeTab === "sponsor" ? "text-blue-200" : "text-gray-400"}`}>
                ({sponsorCount})
              </span>
            </button>
          </div>

          {/* Results count */}
          {(searchQuery || selectedTags.length > 0) && (
            <p className="text-sm text-gray-500 mb-4">
              {filteredSessions.length}件のセッションが見つかりました
            </p>
          )}

          {/* Session Grid */}
          {filteredSessions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-500 mb-4">条件に一致するセッションが見つかりませんでした</p>
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:underline"
              >
                フィルターをクリア
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
