import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get promo code from request body
    const { code } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Promo code is required" },
        { status: 400 }
      );
    }

    // Validate the promo code using the database function
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

    if (!result || !result.is_valid) {
      return NextResponse.json(
        {
          valid: false,
          error: result?.error_message || "Invalid promo code",
        },
        { status: 200 }
      );
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
  } catch (error) {
    console.error("Promo code validation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
