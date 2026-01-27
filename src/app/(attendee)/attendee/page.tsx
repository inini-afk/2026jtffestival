"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks";
import { createClient } from "@/lib/supabase/client";
import { Navigation, BackgroundOrbs } from "@/components";
import type { Ticket, TicketType } from "@/types";

interface TicketWithType extends Ticket {
  ticket_type: TicketType;
}

function AttendeeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [tickets, setTickets] = useState<TicketWithType[]>([]);
  const [loading, setLoading] = useState(true);

  const isWelcome = searchParams.get("welcome") === "true";

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  useEffect(() => {
    async function loadTickets() {
      if (!user) return;

      const supabase = createClient();
      const { data, error } = await supabase
        .from("tickets")
        .select("*, ticket_types(*)")
        .eq("attendee_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching tickets:", error);
      } else {
        setTickets(
          (data || []).map((t) => ({
            ...t,
            ticket_type: t.ticket_types as unknown as TicketType,
          }))
        );
      }
      setLoading(false);
    }

    if (!authLoading && user) {
      loadTickets();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const userName = user?.user_metadata?.name || "ゲスト";

  return (
    <>
      <BackgroundOrbs />
      <Navigation />

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Message */}
          {isWelcome && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-center gap-3">
              <i className="fas fa-check-circle text-xl"></i>
              <div>
                <p className="font-bold">登録完了</p>
                <p className="text-sm">
                  チケットを受け取りました。JTF翻訳祭2026へようこそ！
                </p>
              </div>
            </div>
          )}

          {/* User Header */}
          <div className="info-card rounded-3xl p-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-1">{userName} さん</h1>
                <p className="text-gray-500">参加者マイページ</p>
              </div>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-red-600 transition-colors"
              >
                ログアウト
              </button>
            </div>
          </div>

          {/* Tickets */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">
              あなたのチケット（{tickets.length}枚）
            </h2>

            {tickets.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
                <i className="fas fa-ticket-alt text-4xl text-gray-300 mb-4"></i>
                <p className="text-gray-500">チケットがありません</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="info-card rounded-2xl p-6"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-sm text-gray-500">
                            {ticket.ticket_number}
                          </span>
                          <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            有効
                          </span>
                        </div>
                        <h3 className="text-lg font-bold">
                          {ticket.ticket_type?.name}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {ticket.ticket_type?.includes_onsite && (
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                              会場参加
                            </span>
                          )}
                          {ticket.ticket_type?.includes_online && (
                            <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                              オンデマンド視聴
                            </span>
                          )}
                          {ticket.ticket_type?.includes_party && (
                            <span className="inline-block px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-full">
                              交流パーティー
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/sessions"
              className="info-card rounded-2xl p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-play-circle text-purple-600"></i>
                </div>
                <div>
                  <h3 className="font-bold mb-1 group-hover:text-purple-600 transition-colors">
                    セッション一覧
                  </h3>
                  <p className="text-sm text-gray-500">
                    登壇者とセッション内容を確認
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/date-venue"
              className="info-card rounded-2xl p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-map-marker-alt text-green-600"></i>
                </div>
                <div>
                  <h3 className="font-bold mb-1 group-hover:text-green-600 transition-colors">
                    日程・会場
                  </h3>
                  <p className="text-sm text-gray-500">
                    開催日時とアクセス情報
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

export default function AttendeePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <AttendeeContent />
    </Suspense>
  );
}
