import { useState, useCallback } from "react";

export type DiscountType =
  | "free_all"
  | "member_price"
  | "free_venue"
  | "free_ondemand"
  | "exclude_party"
  | "fixed_price";

export interface PromoCode {
  id: string;
  code: string;
  name: string;
  discountType: DiscountType;
  fixedPrice?: number;
  category?: string;
}

interface UsePromoCodeResult {
  promoCode: PromoCode | null;
  isLoading: boolean;
  error: string | null;
  validateCode: (code: string) => Promise<boolean>;
  clearPromoCode: () => void;
  setPromoCodeDirectly: (code: PromoCode) => void;
}

export function usePromoCode(): UsePromoCodeResult {
  const [promoCode, setPromoCode] = useState<PromoCode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateCode = useCallback(async (code: string): Promise<boolean> => {
    if (!code.trim()) {
      setError("プロモーションコードを入力してください");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/promo-code/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "コードの検証に失敗しました");
        setPromoCode(null);
        return false;
      }

      if (!data.valid) {
        setError(data.error || "無効なプロモーションコードです");
        setPromoCode(null);
        return false;
      }

      setPromoCode(data.promoCode);
      return true;
    } catch (err) {
      console.error("Promo code validation error:", err);
      setError("コードの検証中にエラーが発生しました");
      setPromoCode(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearPromoCode = useCallback(() => {
    setPromoCode(null);
    setError(null);
  }, []);

  const setPromoCodeDirectly = useCallback((code: PromoCode) => {
    setPromoCode(code);
    setError(null);
  }, []);

  return {
    promoCode,
    isLoading,
    error,
    validateCode,
    clearPromoCode,
    setPromoCodeDirectly,
  };
}

// Helper function to calculate discounted price
export function calculateDiscountedPrice(
  originalPrice: number,
  memberPrice: number,
  promoCode: PromoCode | null
): number {
  if (!promoCode) return originalPrice;

  switch (promoCode.discountType) {
    case "free_all":
      return 0;
    case "member_price":
      return memberPrice;
    case "fixed_price":
      return promoCode.fixedPrice ?? originalPrice;
    case "free_venue":
    case "free_ondemand":
    case "exclude_party":
      // These need more context about ticket composition
      // Handle in the specific checkout logic
      return originalPrice;
    default:
      return originalPrice;
  }
}

// Helper function to get discount description
export function getDiscountDescription(promoCode: PromoCode): string {
  switch (promoCode.discountType) {
    case "free_all":
      return "全額無料";
    case "member_price":
      return "会員価格適用";
    case "free_venue":
      return "会場参加無料";
    case "free_ondemand":
      return "オンデマンド視聴無料";
    case "exclude_party":
      return "パーティー以外無料";
    case "fixed_price":
      return `${promoCode.fixedPrice?.toLocaleString()}円`;
    default:
      return "";
  }
}
