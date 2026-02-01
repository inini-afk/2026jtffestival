import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user (optional - validation works without login)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get promo code from request body
    const { code } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Promo code is required" },
        { status: 400 }
      );
    }

    // If user is logged in, use the full validation with per-user checks
    if (user) {
      const { data, error } = await supabase.rpc("validate_promo_code", {
        p_code: code.toUpperCase(),
        p_user_id: user.id,
      });

      if (error) {
        console.error("Promo code validation error:", error);
        return NextResponse.json(
          { error: "Failed to validate promo code" },
          { status: 500 }
        );
      }

      const result = data?.[0];

      if (!result || !result.is_valid || !result.promo_code_id) {
        return NextResponse.json({
          valid: false,
          error: result?.error_message || "無効なプロモーションコードです",
        });
      }

      // Get full promo code details
      const { data: promoCode } = await supabase
        .from("promo_codes")
        .select("id, code, name, discount_type, fixed_price, category")
        .eq("id", result.promo_code_id)
        .single();

      return NextResponse.json({
        valid: true,
        promoCode: {
          id: promoCode?.id,
          code: promoCode?.code,
          name: promoCode?.name,
          discountType: promoCode?.discount_type,
          fixedPrice: promoCode?.fixed_price,
          category: promoCode?.category,
        },
      });
    }

    // Not logged in - basic validation for display purposes only
    const { data: promoData, error: promoError } = await supabase
      .from("promo_codes")
      .select("id, code, name, discount_type, fixed_price, category, is_active, max_total_uses, current_uses")
      .eq("code", code.toUpperCase())
      .eq("is_active", true)
      .single();

    if (promoError || !promoData) {
      return NextResponse.json({
        valid: false,
        error: "無効なプロモーションコードです",
      });
    }

    // Check total usage limit
    if (promoData.max_total_uses !== null && promoData.current_uses >= promoData.max_total_uses) {
      return NextResponse.json({
        valid: false,
        error: "このプロモーションコードは使用上限に達しました",
      });
    }

    // Return as valid for display (per-user check will happen at checkout)
    return NextResponse.json({
      valid: true,
      promoCode: {
        id: promoData.id,
        code: promoData.code,
        name: promoData.name,
        discountType: promoData.discount_type,
        fixedPrice: promoData.fixed_price,
        category: promoData.category,
      },
    });
  } catch (error) {
    console.error("Promo code validation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
