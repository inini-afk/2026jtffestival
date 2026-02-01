"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/lib/hooks";
import { getProfile, getDashboardStats, getOrders, getAssignedTickets } from "@/lib/services";
import type { TicketWithType, OrderWithDetails } from "@/lib/services/profile";
import { Navigation, BackgroundOrbs } from "@/components";
import type { Profile } from "@/types";

function MyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [myTickets, setMyTickets] = useState<TicketWithType[]>([]);
  const [stats, setStats] = useState({
    totalTickets: 0,
    invitedTickets: 0,
    assignedTickets: 0,
  });
  const [dataLoading, setDataLoading] = useState(true);

  const isWelcome = searchParams.get("welcome") === "true";

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        const [profileData, statsData, ordersData, assignedTickets] = await Promise.all([
          getProfile(),
          getDashboardStats(),
          getOrders(),
          getAssignedTickets(),
        ]);

        setProfile(profileData);
        setStats(statsData);
        setOrders(ordersData);
        setMyTickets(assignedTickets);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setDataLoading(false);
      }
    }

    if (!loading && user) {
      loadData();
    } else if (!loading && !user) {
      setDataLoading(false);
    }
  }, [user, loading]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Use profile data if available, fallback to user metadata
  const userName = profile?.name || user?.user_metadata?.name || "ユーザー";
  const userCompany = profile?.company || user?.user_metadata?.company;
  const userEmail = profile?.email || user?.email;

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(price);
  };

  // Get status info based on order status and payment method
  const getOrderStatusInfo = (order: OrderWithDetails) => {
    if (order.status === "paid") {
      return {
        badge: "bg-green-100 text-green-800",
        label: "支払完了",
        icon: "✅",
        message: null,
        action: null,
      };
    }

    if (order.status === "pending") {
      // Bank transfer pending
      if (order.payment_method === "bank_transfer") {
        return {
          badge: "bg-yellow-100 text-yellow-800",
          label: "振込待ち",
          icon: "⏳",
          message: "銀行振込をお待ちしています（7日以内）",
          action: {
            label: "振込情報を確認",
            href: `/mypage/orders/${order.id}`,
            style: "bg-yellow-500 hover:bg-yellow-600 text-white",
          },
        };
      }

      // Invoice pending
      if (order.payment_method === "invoice") {
        return {
          badge: "bg-purple-100 text-purple-800",
          label: "請求書発行済",
          icon: "📄",
          message: "請求書をご確認ください（翌月末まで）",
          action: order.stripe_invoice_id ? {
            label: "請求書を開く",
            href: `/mypage/orders/${order.id}`,
            style: "bg-purple-500 hover:bg-purple-600 text-white",
          } : null,
        };
      }

      // Card payment pending (possibly failed)
      return {
        badge: "bg-red-100 text-red-800",
        label: "決済未完了",
        icon: "⚠️",
        message: "決済が完了していません",
        action: {
          label: "再試行する",
          href: "/ticket",
          style: "bg-red-500 hover:bg-red-600 text-white",
        },
      };
    }

    if (order.status === "refunded") {
      return {
        badge: "bg-gray-100 text-gray-800",
        label: "返金済み",
        icon: "↩️",
        message: null,
        action: null,
      };
    }

    return {
      badge: "bg-gray-100 text-gray-800",
      label: order.status,
      icon: "❓",
      message: null,
      action: null,
    };
  };

  return (
    <>
      <BackgroundOrbs />
      <Navigation />

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Message */}
          {isWelcome && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-center gap-3">
              <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
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
                {userCompany && (
                  <p className="text-gray-500">{userCompany}</p>
                )}
                <p className="text-sm text-gray-400 mt-1">{userEmail}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-red-600 transition-colors"
              >
                ログアウト
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="info-card rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats.totalTickets}
              </div>
              <div className="text-sm text-gray-500">購入チケット</div>
            </div>
            <div className="info-card rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {stats.invitedTickets}
              </div>
              <div className="text-sm text-gray-500">招待済み</div>
            </div>
            <div className="info-card rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {stats.assignedTickets}
              </div>
              <div className="text-sm text-gray-500">割当済み</div>
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* On-demand Streaming */}
            <Link
              href="/mypage/streaming"
              className="info-card rounded-2xl p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold mb-1 group-hover:text-red-600 transition-colors">
                    オンデマンド配信
                  </h3>
                  <p className="text-sm text-gray-500">
                    セッション動画を視聴
                  </p>
                </div>
              </div>
            </Link>

            {/* Buy Ticket */}
            <Link
              href="/ticket"
              className="info-card rounded-2xl p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold mb-1 group-hover:text-blue-600 transition-colors">
                    チケットを購入
                  </h3>
                  <p className="text-sm text-gray-500">
                    会場参加、オンデマンド視聴など
                  </p>
                </div>
              </div>
            </Link>

            {/* View Sessions */}
            <Link
              href="/sessions"
              className="info-card rounded-2xl p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold mb-1 group-hover:text-purple-600 transition-colors">
                    登壇者紹介
                  </h3>
                  <p className="text-sm text-gray-500">
                    セッション内容と登壇者を確認
                  </p>
                </div>
              </div>
            </Link>
          </div>

          {/* My Tickets (Assigned to me) */}
          {myTickets.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">
                あなたのチケット（{myTickets.length}枚）
              </h2>
              <div className="space-y-4">
                {myTickets.map((ticket) => (
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
            </div>
          )}

          {/* Order History */}
          {orders.length > 0 ? (
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">注文履歴</h2>
              <div className="space-y-4">
                {orders.map((order) => {
                  const statusInfo = getOrderStatusInfo(order);
                  return (
                    <div
                      key={order.id}
                      className="info-card rounded-2xl p-6"
                    >
                      {/* Order Header */}
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-mono text-sm text-gray-500">
                              {order.order_number}
                            </span>
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${statusInfo.badge}`}>
                              {statusInfo.icon} {statusInfo.label}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 mb-3">
                            {formatDate(order.created_at)}
                          </div>

                          {/* Order Items */}
                          <div className="space-y-1">
                            {order.order_items.map((item) => (
                              <div key={item.id} className="text-sm">
                                <span className="font-medium">{item.ticket_type?.name}</span>
                                <span className="text-gray-500"> × {item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xl font-bold">
                            {formatPrice(order.total)}
                          </div>
                          <div className="text-sm text-gray-500">
                            （税込）
                          </div>
                        </div>
                      </div>

                      {/* Status Message & Action */}
                      {(statusInfo.message || statusInfo.action) && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className={`p-3 rounded-xl ${
                            order.status === "paid"
                              ? "bg-green-50"
                              : order.status === "pending" && order.payment_method === "bank_transfer"
                              ? "bg-yellow-50"
                              : order.status === "pending" && order.payment_method === "invoice"
                              ? "bg-purple-50"
                              : "bg-red-50"
                          }`}>
                            {statusInfo.message && (
                              <p className="text-sm mb-2">{statusInfo.message}</p>
                            )}
                            {statusInfo.action && (
                              <Link
                                href={statusInfo.action.href}
                                className={`inline-block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusInfo.action.style}`}
                              >
                                {statusInfo.action.label}
                              </Link>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Paid Order Actions */}
                      {order.status === "paid" && (
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                          <Link
                            href={`/mypage/orders/${order.id}`}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            詳細を見る →
                          </Link>
                          <Link
                            href={`/mypage/orders/${order.id}`}
                            className="text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            チケットを管理
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* No Orders Message */
            <div className="mt-8 text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
              <i className="fas fa-ticket-alt text-4xl text-gray-300 mb-4"></i>
              <p className="text-gray-500 mb-4">
                まだチケットを購入していません
              </p>
              <Link
                href="/ticket"
                className="inline-block bg-[#0071e3] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#0077ed] transition-colors"
              >
                チケットを購入する
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function MyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <MyPageContent />
    </Suspense>
  );
}
