"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks";
import { getTicketTypes } from "@/lib/services";
import { Navigation, BackgroundOrbs, PromoCodeInput } from "@/components";
import { usePromoCode, calculateDiscountedPrice, getDiscountDescription } from "@/lib/hooks/usePromoCode";
import type { TicketType } from "@/types";
import type { PromoCode } from "@/lib/hooks/usePromoCode";

interface CartItem {
  ticketType: TicketType;
  quantity: number;
}

export default function TicketPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedPromoCode, setAppliedPromoCode] = useState<PromoCode | null>(null);

  useEffect(() => {
    async function loadTicketTypes() {
      try {
        const types = await getTicketTypes();
        setTicketTypes(types);
      } catch (err) {
        console.error("Error loading ticket types:", err);
        setError("チケット情報の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    }
    loadTicketTypes();
  }, []);

  const updateQuantity = (ticketTypeId: string, delta: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.ticketType.id === ticketTypeId);
      const ticketType = ticketTypes.find((t) => t.id === ticketTypeId);

      if (!ticketType) return prev;

      if (existing) {
        const newQuantity = existing.quantity + delta;
        if (newQuantity <= 0) {
          return prev.filter((item) => item.ticketType.id !== ticketTypeId);
        }
        return prev.map((item) =>
          item.ticketType.id === ticketTypeId
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else if (delta > 0) {
        return [...prev, { ticketType, quantity: delta }];
      }
      return prev;
    });
  };

  const getQuantity = (ticketTypeId: string) => {
    return cart.find((item) => item.ticketType.id === ticketTypeId)?.quantity || 0;
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.ticketType.price * item.quantity,
    0
  );

  // Calculate discount based on promo code
  const calculateDiscount = () => {
    if (!appliedPromoCode) return 0;

    switch (appliedPromoCode.discountType) {
      case "free_all":
        return subtotal;
      case "member_price":
        // Assume 20% discount for member price (adjust as needed)
        return Math.floor(subtotal * 0.2);
      case "fixed_price":
        if (appliedPromoCode.fixedPrice !== undefined) {
          return Math.max(0, subtotal - appliedPromoCode.fixedPrice);
        }
        return 0;
      default:
        return 0;
    }
  };

  const discount = calculateDiscount();
  const discountedSubtotal = subtotal - discount;
  const tax = Math.floor(discountedSubtotal * 0.1);
  const total = discountedSubtotal + tax;
  const totalTickets = cart.reduce((sum, item) => sum + item.quantity, 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(price);
  };

  const handleCheckout = async () => {
    if (!user) {
      router.push("/login?redirect=/ticket");
      return;
    }

    if (cart.length === 0) {
      setError("カートにチケットを追加してください");
      return;
    }

    setCheckoutLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cart.map((item) => ({
            ticketTypeId: item.ticketType.id,
            quantity: item.quantity,
          })),
          promoCodeId: appliedPromoCode?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "チェックアウトに失敗しました");
      }

      // Redirect to Stripe Checkout using URL from session
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("チェックアウトURLの取得に失敗しました");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <BackgroundOrbs />
      <Navigation />

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold mb-4">チケット購入</h1>
            <p className="text-gray-500">
              第35回JTF翻訳祭2026のチケットをお選びください
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Ticket Types */}
            <div className="lg:col-span-2 space-y-6">
              {ticketTypes.map((ticketType) => (
                <div
                  key={ticketType.id}
                  className="info-card rounded-2xl p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{ticketType.name}</h3>
                      <p className="text-gray-500 text-sm mb-3">
                        {ticketType.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {ticketType.includes_onsite && (
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            会場参加
                          </span>
                        )}
                        {ticketType.includes_online && (
                          <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                            オンデマンド視聴
                          </span>
                        )}
                        {ticketType.includes_party && (
                          <span className="inline-block px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-full">
                            交流パーティー
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {formatPrice(ticketType.price)}
                        </div>
                        <div className="text-xs text-gray-500">（税別）</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(ticketType.id, -1)}
                          disabled={getQuantity(ticketType.id) === 0}
                          className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <i className="fas fa-minus text-sm"></i>
                        </button>
                        <span className="w-8 text-center font-bold">
                          {getQuantity(ticketType.id)}
                        </span>
                        <button
                          onClick={() => updateQuantity(ticketType.id, 1)}
                          className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                          <i className="fas fa-plus text-sm"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <div className="info-card rounded-2xl p-6 sticky top-24">
                <h3 className="text-lg font-bold mb-4">注文内容</h3>

                {cart.length === 0 ? (
                  <p className="text-gray-500 text-sm mb-6">
                    チケットを選択してください
                  </p>
                ) : (
                  <div className="space-y-3 mb-6">
                    {cart.map((item) => (
                      <div
                        key={item.ticketType.id}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          {item.ticketType.name} × {item.quantity}
                        </span>
                        <span>
                          {formatPrice(item.ticketType.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Promo Code Input */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">プロモーションコード</p>
                  <PromoCodeInput
                    onApply={(code) => setAppliedPromoCode(code)}
                    onClear={() => setAppliedPromoCode(null)}
                  />
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>小計</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>割引（{appliedPromoCode?.name}）</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>消費税（10%）</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                    <span>合計</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {user ? (
                    <button
                      onClick={handleCheckout}
                      disabled={cart.length === 0 || checkoutLoading}
                      className="w-full bg-[#0071e3] text-white py-3 rounded-xl font-medium hover:bg-[#0077ed] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {checkoutLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>処理中...</span>
                        </>
                      ) : (
                        <>
                          <i className="fas fa-lock"></i>
                          <span>購入手続きへ（{totalTickets}枚）</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <Link
                      href="/login?redirect=/ticket"
                      className="w-full bg-[#0071e3] text-white py-3 rounded-xl font-medium hover:bg-[#0077ed] transition-colors flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-sign-in-alt"></i>
                      <span>ログインして購入</span>
                    </Link>
                  )}

                  <p className="text-xs text-gray-500 text-center">
                    決済はStripeで安全に処理されます
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
