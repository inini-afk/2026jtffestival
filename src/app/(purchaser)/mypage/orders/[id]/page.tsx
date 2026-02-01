"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks";
import { getOrderById, OrderWithDetails } from "@/lib/services";
import { Navigation, BackgroundOrbs } from "@/components";

export default function OrderDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const orderId = params.id as string;
  const isSuccess = searchParams.get("success") === "true";

  const handleCancelOrder = async () => {
    if (!confirm("この注文をキャンセルしますか？この操作は取り消せません。")) {
      return;
    }

    setCancelling(true);
    setCancelError(null);

    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "キャンセルに失敗しました");
      }

      // Redirect to mypage after successful cancellation
      router.push("/mypage");
      router.refresh();
    } catch (err) {
      console.error("Cancel error:", err);
      setCancelError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    async function loadOrder() {
      if (!user || !orderId) return;

      try {
        const orderData = await getOrderById(orderId);
        if (!orderData) {
          setError("注文が見つかりません");
        } else {
          setOrder(orderData);
        }
      } catch (err) {
        console.error("Error loading order:", err);
        setError("注文の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      loadOrder();
    } else if (!authLoading && !user) {
      setLoading(false);
      setError("ログインが必要です");
    }
  }, [user, authLoading, orderId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(price);
  };

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
        className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${styles[status] || styles.pending}`}
      >
        {labels[status] || status}
      </span>
    );
  };

  const getTicketStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      unassigned: "bg-gray-100 text-gray-800",
      invited: "bg-blue-100 text-blue-800",
      assigned: "bg-green-100 text-green-800",
    };
    const labels: Record<string, string> = {
      unassigned: "未割当",
      invited: "招待中",
      assigned: "割当済",
    };
    return (
      <span
        className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.unassigned}`}
      >
        {labels[status] || status}
      </span>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <BackgroundOrbs />
        <Navigation />
        <main className="pt-24 pb-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="info-card rounded-2xl p-12">
              <i className="fas fa-exclamation-circle text-4xl text-red-400 mb-4"></i>
              <h1 className="text-xl font-bold mb-2">{error}</h1>
              <Link
                href="/mypage"
                className="text-blue-600 hover:text-blue-800"
              >
                マイページに戻る
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <>
      <BackgroundOrbs />
      <Navigation />

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Success Message */}
          {isSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-center gap-3">
              <i className="fas fa-check-circle text-xl"></i>
              <div>
                <p className="font-bold">お支払いが完了しました</p>
                <p className="text-sm">
                  ご購入ありがとうございます。チケットが発行されました。
                </p>
              </div>
            </div>
          )}

          {/* Breadcrumb */}
          <div className="mb-6">
            <Link
              href="/mypage"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← マイページに戻る
            </Link>
          </div>

          {/* Order Header */}
          <div className="info-card rounded-3xl p-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">注文詳細</h1>
                  {getStatusBadge(order.status)}
                </div>
                <p className="font-mono text-gray-500">{order.order_number}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {formatDate(order.created_at)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{formatPrice(order.total)}</div>
                <div className="text-sm text-gray-500">（税込）</div>
              </div>
            </div>

          </div>

          {/* Payment Status for Pending Orders */}
          {order.status === "pending" && (
            <div className="info-card rounded-2xl p-6 mb-8">
              {/* Bank Transfer Info */}
              {order.payment_method === "bank_transfer" && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-yellow-800">銀行振込をお待ちしています</h3>
                      <p className="text-sm text-yellow-600">7日以内にお振込みください</p>
                    </div>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-4 mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      決済画面で表示された振込先に、下記の金額をお振込みください。
                      お振込み確認後、自動的にチケットが発行されます。
                    </p>
                    <div className="text-center py-3">
                      <p className="text-sm text-gray-500">お振込み金額</p>
                      <p className="text-2xl font-bold text-yellow-800">{formatPrice(order.total)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    ※ 振込先情報は、お申込み時に表示された画面およびメールでご確認ください。
                  </p>
                </div>
              )}

              {/* Invoice Info */}
              {order.payment_method === "invoice" && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-purple-800">請求書を発行しました</h3>
                      <p className="text-sm text-purple-600">翌月末までにお支払いください</p>
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 mb-4">
                    <p className="text-sm text-gray-600 mb-4">
                      請求書をメールで送信しました。請求書に記載の振込先へ、期日までにお支払いください。
                    </p>
                    <div className="text-center py-3">
                      <p className="text-sm text-gray-500">ご請求金額</p>
                      <p className="text-2xl font-bold text-purple-800">{formatPrice(order.total)}</p>
                    </div>
                    {order.stripe_invoice_id && (
                      <div className="text-center mt-4">
                        <a
                          href={`https://invoice.stripe.com/i/${order.stripe_invoice_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          請求書を表示
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Card Payment Failed */}
              {order.payment_method === "card" && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-red-800">決済が完了していません</h3>
                      <p className="text-sm text-red-600">再度お試しください</p>
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4 mb-4">
                    <p className="text-sm text-gray-600">
                      クレジットカード決済が完了していません。再度チケット購入ページからお手続きください。
                    </p>
                  </div>
                  <div className="text-center">
                    <a
                      href="/ticket"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      再度購入する
                    </a>
                  </div>
                </div>
              )}

              {/* Cancel Button */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                {cancelError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {cancelError}
                  </div>
                )}
                <div className="flex justify-end">
                  <button
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {cancelling ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        キャンセル中...
                      </span>
                    ) : (
                      "注文をキャンセル"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="info-card rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-bold mb-4">注文内容</h2>
            <div className="space-y-4">
              {order.order_items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="font-medium">{item.ticket_type?.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatPrice(item.unit_price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-bold">
                    {formatPrice(item.unit_price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>小計</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>消費税（10%）</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                <span>合計</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Tickets */}
          {order.tickets.length > 0 && (
            <div className="info-card rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4">
                発行済みチケット（{order.tickets.length}枚）
              </h2>
              <div className="space-y-3">
                {order.tickets.map((ticket) => {
                  const ticketType = order.order_items.find(
                    (item) => item.ticket_type_id === ticket.ticket_type_id
                  )?.ticket_type;

                  return (
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm">
                            {ticket.ticket_number}
                          </span>
                          {getTicketStatusBadge(ticket.status)}
                        </div>
                        <p className="text-sm text-gray-500">
                          {ticketType?.name}
                        </p>
                      </div>
                      {ticket.status === "unassigned" && (
                        <button className="text-sm text-blue-600 hover:text-blue-800">
                          参加者を招待
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment Info */}
          {order.paid_at && (
            <div className="mt-6 text-center text-sm text-gray-500">
              支払い完了: {formatDate(order.paid_at)}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
