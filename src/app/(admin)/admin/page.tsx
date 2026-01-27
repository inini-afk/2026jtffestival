"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks";
import { getAdminStats } from "@/lib/services";
import { Navigation, BackgroundOrbs } from "@/components";
import type { AdminStats } from "@/lib/services/admin";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const data = await getAdminStats();
        setStats(data);
      } catch (error) {
        console.error("Error loading admin stats:", error);
      } finally {
        setDataLoading(false);
      }
    }
    if (!loading && user) loadData();
    else if (!loading) setDataLoading(false);
  }, [user, loading]);

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(price);

  return (
    <>
      <BackgroundOrbs />
      <Navigation />
      <main className="pt-24 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">管理画面</h1>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="info-card rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats?.totalOrders ?? 0}
              </div>
              <div className="text-sm text-gray-500">総注文数</div>
            </div>
            <div className="info-card rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {stats?.paidOrders ?? 0}
              </div>
              <div className="text-sm text-gray-500">支払済み注文</div>
            </div>
            <div className="info-card rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {stats ? formatPrice(stats.totalRevenue) : "¥0"}
              </div>
              <div className="text-sm text-gray-500">総売上</div>
            </div>
            <div className="info-card rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {stats?.totalAttendees ?? 0}
              </div>
              <div className="text-sm text-gray-500">総チケット数</div>
            </div>
          </div>

          {/* Ticket Status Breakdown */}
          {stats && (
            <div className="info-card rounded-2xl p-6 mb-8">
              <h2 className="font-bold mb-4">チケット状態</h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats.ticketsByStatus.unassigned}
                  </div>
                  <div className="text-sm text-gray-500">未割当</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.ticketsByStatus.invited}
                  </div>
                  <div className="text-sm text-gray-500">招待済み</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.ticketsByStatus.assigned}
                  </div>
                  <div className="text-sm text-gray-500">割当済み</div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/admin/orders"
              className="info-card rounded-2xl p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-receipt text-blue-600"></i>
                </div>
                <div>
                  <h3 className="font-bold mb-1 group-hover:text-blue-600 transition-colors">
                    注文一覧
                  </h3>
                  <p className="text-sm text-gray-500">全注文の確認</p>
                </div>
              </div>
            </Link>
            <Link
              href="/admin/attendees"
              className="info-card rounded-2xl p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-users text-green-600"></i>
                </div>
                <div>
                  <h3 className="font-bold mb-1 group-hover:text-green-600 transition-colors">
                    参加者一覧
                  </h3>
                  <p className="text-sm text-gray-500">全参加者の確認</p>
                </div>
              </div>
            </Link>
            <Link
              href="/admin/export"
              className="info-card rounded-2xl p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-file-csv text-purple-600"></i>
                </div>
                <div>
                  <h3 className="font-bold mb-1 group-hover:text-purple-600 transition-colors">
                    CSV出力
                  </h3>
                  <p className="text-sm text-gray-500">データのエクスポート</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
