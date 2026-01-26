"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks";
import { getProfile, getDashboardStats, getOrders } from "@/lib/services";
import { Navigation, BackgroundOrbs } from "@/components";
import type { Profile, Order } from "@/types";

export default function MyPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    totalTickets: 0,
    invitedTickets: 0,
    assignedTickets: 0,
  });
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        const [profileData, statsData, ordersData] = await Promise.all([
          getProfile(),
          getDashboardStats(),
          getOrders(),
        ]);

        setProfile(profileData);
        setStats(statsData);
        setOrders(ordersData);
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

  // Get status badge
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      cancelled: "bg-gray-100 text-gray-800",
      refunded: "bg-red-100 text-red-800",
    };
    const labels: Record<string, string> = {
      pending: "支払い待ち",
      paid: "支払い済み",
      cancelled: "キャンセル",
      refunded: "返金済み",
    };
    return (
      <span
        className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.pending}`}
      >
        {labels[status] || status}
      </span>
    );
  };

  return (
    <>
      <BackgroundOrbs />
      <Navigation />

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Buy Ticket */}
            <Link
              href="/ticket"
              className="info-card rounded-2xl p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-ticket-alt text-blue-600"></i>
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
          </div>

          {/* Order History */}
          {orders.length > 0 ? (
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">注文履歴</h2>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="info-card rounded-2xl p-6"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm text-gray-500">
                            {order.order_number}
                          </span>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(order.created_at)}
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
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                      <Link
                        href={`/mypage/orders/${order.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        詳細を見る →
                      </Link>
                    </div>
                  </div>
                ))}
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
