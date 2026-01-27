"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks";
import { getAllOrders } from "@/lib/services";
import { Navigation, BackgroundOrbs } from "@/components";
import type { AdminOrder } from "@/lib/services/admin";

export default function AdminOrdersPage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const data = await getAllOrders();
        setOrders(data);
      } catch (error) {
        console.error("Error loading orders:", error);
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

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(price);

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

  const getPaymentMethodLabel = (method: string | null) => {
    const labels: Record<string, string> = {
      card: "クレジットカード",
      bank_transfer: "銀行振込",
      invoice: "請求書払い",
    };
    return method ? labels[method] || method : "-";
  };

  return (
    <>
      <BackgroundOrbs />
      <Navigation />
      <main className="pt-24 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">注文一覧</h1>
            <Link href="/admin" className="text-sm text-blue-600 hover:text-blue-800">
              ← 管理画面に戻る
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
              <p className="text-gray-500">注文データがありません</p>
            </div>
          ) : (
            <div className="info-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/50">
                      <th className="text-left p-4 font-medium text-gray-600">注文番号</th>
                      <th className="text-left p-4 font-medium text-gray-600">申込者</th>
                      <th className="text-left p-4 font-medium text-gray-600">支払方法</th>
                      <th className="text-right p-4 font-medium text-gray-600">金額</th>
                      <th className="text-center p-4 font-medium text-gray-600">状態</th>
                      <th className="text-left p-4 font-medium text-gray-600">日時</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="p-4 font-mono text-xs">{order.order_number}</td>
                        <td className="p-4">
                          <div>{order.purchaser?.name || "-"}</div>
                          <div className="text-xs text-gray-400">{order.purchaser?.email}</div>
                        </td>
                        <td className="p-4">{getPaymentMethodLabel(order.payment_method)}</td>
                        <td className="p-4 text-right font-medium">{formatPrice(order.total)}</td>
                        <td className="p-4 text-center">{getStatusBadge(order.status)}</td>
                        <td className="p-4 text-gray-500">{formatDate(order.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
