"use client";

import { useState } from "react";
import { usePromoCode, getDiscountDescription } from "@/lib/hooks/usePromoCode";

interface PromoCodeInputProps {
  onApply?: (promoCode: ReturnType<typeof usePromoCode>["promoCode"]) => void;
  onClear?: () => void;
}

export function PromoCodeInput({ onApply, onClear }: PromoCodeInputProps) {
  const [inputValue, setInputValue] = useState("");
  const { promoCode, isLoading, error, validateCode, clearPromoCode } =
    usePromoCode();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await validateCode(inputValue);
    if (isValid && onApply) {
      // promoCode will be set after validateCode succeeds
      // We need to get it from the hook after state updates
    }
  };

  const handleClear = () => {
    setInputValue("");
    clearPromoCode();
    onClear?.();
  };

  // Call onApply when promoCode changes
  if (promoCode && onApply) {
    onApply(promoCode);
  }

  return (
    <div className="w-full">
      {!promoCode ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.toUpperCase())}
              placeholder="プロモーションコードを入力"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                確認中
              </span>
            ) : (
              "適用"
            )}
          </button>
        </form>
      ) : (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-green-800">
                {promoCode.name}
              </p>
              <p className="text-xs text-green-600">
                {getDiscountDescription(promoCode)}
              </p>
            </div>
          </div>
          <button
            onClick={handleClear}
            className="text-sm text-green-700 hover:text-green-900 underline"
          >
            取消
          </button>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
