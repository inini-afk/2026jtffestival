"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks";
import { getTicketTypes, getProfile, getOrders } from "@/lib/services";
import { Navigation, BackgroundOrbs, PromoCodeInput } from "@/components";
import { usePromoCode, calculateDiscountedPrice, getDiscountDescription } from "@/lib/hooks/usePromoCode";
import type { TicketType, Profile } from "@/types";
import type { PromoCode } from "@/lib/hooks/usePromoCode";

interface CartItem {
  ticketType: TicketType;
  quantity: number;
}

interface CompanyInfo {
  companyName: string;
  companyCountry: string;
  companyPostalCode: string;
  companyAddress: string;
  companyPhone: string;
}

// Common countries for the dropdown
const COUNTRIES = [
  { code: "JP", name: "日本" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "CN", name: "China" },
  { code: "KR", name: "Korea" },
  { code: "TW", name: "Taiwan" },
  { code: "SG", name: "Singapore" },
  { code: "AU", name: "Australia" },
  { code: "CA", name: "Canada" },
  { code: "OTHER", name: "その他 / Other" },
];

type PaymentMethodOption = "card" | "bank_transfer" | "invoice";

export default function TicketPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedPromoCode, setAppliedPromoCode] = useState<PromoCode | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodOption>("card");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    companyName: "",
    companyCountry: "JP",
    companyPostalCode: "",
    companyAddress: "",
    companyPhone: "",
  });
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [existingTicketCount, setExistingTicketCount] = useState(0);

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

  // Load user profile for account type check
  useEffect(() => {
    async function loadProfile() {
      if (user) {
        try {
          const [userProfile, orders] = await Promise.all([
            getProfile(),
            getOrders(),
          ]);
          setProfile(userProfile);
          // Pre-fill company info if available
          if (userProfile) {
            setCompanyInfo({
              companyName: userProfile.company || "",
              companyCountry: userProfile.company_country || "JP",
              companyPostalCode: userProfile.company_postal_code || "",
              companyAddress: userProfile.company_address || "",
              companyPhone: userProfile.company_phone || "",
            });
          }
          // Count existing tickets (from paid orders and pending orders)
          const ticketCount = orders.reduce((sum, order) => {
            return sum + order.order_items.reduce((itemSum, item) => itemSum + item.quantity, 0);
          }, 0);
          setExistingTicketCount(ticketCount);
        } catch (err) {
          console.error("Error loading profile:", err);
        }
      }
    }
    loadProfile();
  }, [user]);

  // Restore promo code from localStorage after login
  useEffect(() => {
    const savedPromoCode = localStorage.getItem("pendingPromoCode");
    if (savedPromoCode && !appliedPromoCode) {
      try {
        const parsed = JSON.parse(savedPromoCode);
        setAppliedPromoCode(parsed);
        localStorage.removeItem("pendingPromoCode");
      } catch {
        localStorage.removeItem("pendingPromoCode");
      }
    }
  }, [appliedPromoCode]);

  // Save promo code to localStorage when applied (for persistence across login)
  const handlePromoCodeApply = (code: PromoCode | null) => {
    setAppliedPromoCode(code);
    if (code) {
      localStorage.setItem("pendingPromoCode", JSON.stringify(code));
    }
  };

  const handlePromoCodeClear = () => {
    setAppliedPromoCode(null);
    localStorage.removeItem("pendingPromoCode");
  };

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

  // Individual account restrictions
  const isIndividual = profile?.account_type !== "company";
  const hasExistingTickets = existingTicketCount > 0;
  const canAddMoreTickets = !isIndividual || (!hasExistingTickets && totalTickets < 1);

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

    // Validate invoice payment requirements
    if (paymentMethod === "invoice") {
      if (!companyInfo.companyName) {
        setError("請求書宛先（会社名）を入力してください");
        return;
      }
      if (!companyInfo.companyAddress) {
        setError("会社・団体所在地を入力してください");
        return;
      }
      if (!companyInfo.companyPhone) {
        setError("電話番号を入力してください");
        return;
      }
    }

    setCheckoutLoading(true);
    setError(null);

    try {
      const requestBody: {
        items: { ticketTypeId: string; quantity: number }[];
        promoCodeId?: string;
        paymentMethod: PaymentMethodOption;
        companyInfo?: CompanyInfo;
      } = {
        items: cart.map((item) => ({
          ticketTypeId: item.ticketType.id,
          quantity: item.quantity,
        })),
        promoCodeId: appliedPromoCode?.id,
        paymentMethod,
      };

      // Include company info for invoice payments
      if (paymentMethod === "invoice") {
        requestBody.companyInfo = companyInfo;
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "チェックアウトに失敗しました");
      }

      // Handle invoice response
      if (paymentMethod === "invoice" && data.invoiceUrl) {
        // Redirect to invoice page
        window.location.href = data.invoiceUrl;
      } else if (data.url) {
        // Redirect to Stripe Checkout
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

          {/* Individual Account Restriction Message */}
          {user && isIndividual && (
            <div className={`mb-6 p-4 rounded-xl ${hasExistingTickets ? "bg-yellow-50 border border-yellow-200" : "bg-blue-50 border border-blue-200"}`}>
              {hasExistingTickets ? (
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-bold text-yellow-800">既にチケットをお持ちです</p>
                    <p className="text-sm text-yellow-700">
                      個人アカウントは1枚のみ購入可能です。追加購入するには
                      <a href="/mypage/settings" className="underline hover:text-yellow-900">法人アカウントに変更</a>
                      してください。
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-bold text-blue-800">個人アカウントは1枚のみ購入可能です</p>
                    <p className="text-sm text-blue-700">
                      複数枚購入するには、新規登録時に法人アカウントを選択するか、設定から変更してください。
                    </p>
                  </div>
                </div>
              )}
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
                          disabled={!canAddMoreTickets}
                          className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                    onApply={handlePromoCodeApply}
                    onClear={handlePromoCodeClear}
                    initialCode={appliedPromoCode}
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

                {/* Payment Method Selection */}
                {cart.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-3">お支払い方法</p>
                    <div className="space-y-2">
                      <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                        paymentMethod === "card"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="card"
                          checked={paymentMethod === "card"}
                          onChange={() => {
                            setPaymentMethod("card");
                            setShowCompanyForm(false);
                          }}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === "card" ? "border-blue-500" : "border-gray-300"
                        }`}>
                          {paymentMethod === "card" && (
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            <span className="font-medium text-sm">クレジットカード</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">即時決済</p>
                        </div>
                      </label>

                      <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                        paymentMethod === "bank_transfer"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="bank_transfer"
                          checked={paymentMethod === "bank_transfer"}
                          onChange={() => {
                            setPaymentMethod("bank_transfer");
                            setShowCompanyForm(false);
                          }}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === "bank_transfer" ? "border-blue-500" : "border-gray-300"
                        }`}>
                          {paymentMethod === "bank_transfer" && (
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                            </svg>
                            <span className="font-medium text-sm">銀行振込</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">7日以内にお振込み</p>
                        </div>
                      </label>

                      {/* Invoice Payment - Corporate Only */}
                      {profile?.account_type === "company" && (
                        <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                          paymentMethod === "invoice"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}>
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="invoice"
                            checked={paymentMethod === "invoice"}
                            onChange={() => {
                              setPaymentMethod("invoice");
                              setShowCompanyForm(true);
                            }}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            paymentMethod === "invoice" ? "border-blue-500" : "border-gray-300"
                          }`}>
                            {paymentMethod === "invoice" && (
                              <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="font-medium text-sm">請求書払い</span>
                              <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">法人</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">翌月末までにお振込み</p>
                          </div>
                        </label>
                      )}
                    </div>

                    {/* Company Info Form for Invoice */}
                    {paymentMethod === "invoice" && showCompanyForm && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-3">
                        <p className="text-sm font-medium text-gray-700">請求書送付先情報</p>

                        {/* Company Name / Invoice Recipient */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">請求書宛先 *</label>
                          <input
                            type="text"
                            value={companyInfo.companyName}
                            onChange={(e) => setCompanyInfo({ ...companyInfo, companyName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="株式会社○○"
                          />
                        </div>

                        {/* Country Selector */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">国・地域 *</label>
                          <select
                            value={companyInfo.companyCountry}
                            onChange={(e) => setCompanyInfo({ ...companyInfo, companyCountry: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            {COUNTRIES.map((country) => (
                              <option key={country.code} value={country.code}>
                                {country.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Postal Code - Only for Japan */}
                        {companyInfo.companyCountry === "JP" && (
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">郵便番号</label>
                            <input
                              type="text"
                              value={companyInfo.companyPostalCode}
                              onChange={(e) => setCompanyInfo({ ...companyInfo, companyPostalCode: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="100-0001"
                            />
                          </div>
                        )}

                        {/* Address */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">会社・団体所在地 *</label>
                          <textarea
                            value={companyInfo.companyAddress}
                            onChange={(e) => setCompanyInfo({ ...companyInfo, companyAddress: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows={2}
                            placeholder={companyInfo.companyCountry === "JP" ? "東京都千代田区丸の内1-1-1" : "123 Main Street, Suite 100, City, State"}
                          />
                        </div>

                        {/* Phone */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">電話番号 *</label>
                          <input
                            type="tel"
                            value={companyInfo.companyPhone}
                            onChange={(e) => setCompanyInfo({ ...companyInfo, companyPhone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={companyInfo.companyCountry === "JP" ? "03-1234-5678" : "+1-234-567-8900"}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

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
                          <span>
                            {paymentMethod === "bank_transfer"
                              ? `振込情報を取得（${totalTickets}枚）`
                              : paymentMethod === "invoice"
                              ? `請求書を発行（${totalTickets}枚）`
                              : `購入手続きへ（${totalTickets}枚）`}
                          </span>
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
                    {paymentMethod === "bank_transfer"
                      ? "振込先は次の画面で表示されます"
                      : paymentMethod === "invoice"
                      ? "請求書PDFがメールで送信されます"
                      : "決済はStripeで安全に処理されます"}
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
