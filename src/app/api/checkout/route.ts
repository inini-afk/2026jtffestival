import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripeServer } from "@/lib/stripe";

interface CheckoutItem {
  ticketTypeId: string;
  quantity: number;
}

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
        { error: "ログインが必要です" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { items, promoCodeId } = body as { items: CheckoutItem[]; promoCodeId?: string };

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "カートが空です" },
        { status: 400 }
      );
    }

    // Validate promo code if provided
    let promoCode = null;
    if (promoCodeId) {
      const { data: promoData, error: promoError } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("id", promoCodeId)
        .eq("is_active", true)
        .single();

      if (promoError || !promoData) {
        return NextResponse.json(
          { error: "無効なプロモーションコードです" },
          { status: 400 }
        );
      }

      // Check usage limits
      if (promoData.max_total_uses !== null && promoData.current_uses >= promoData.max_total_uses) {
        return NextResponse.json(
          { error: "このプロモーションコードは使用上限に達しました" },
          { status: 400 }
        );
      }

      if (promoData.max_uses_per_user !== null) {
        const { count } = await supabase
          .from("promo_code_uses")
          .select("*", { count: "exact", head: true })
          .eq("promo_code_id", promoCodeId)
          .eq("user_id", user.id);

        if (count !== null && count >= promoData.max_uses_per_user) {
          return NextResponse.json(
            { error: "このプロモーションコードは既に使用済みです" },
            { status: 400 }
          );
        }
      }

      promoCode = promoData;
    }

    // Fetch ticket types from database
    const ticketTypeIds = items.map((item) => item.ticketTypeId);
    const { data: ticketTypes, error: ticketError } = await supabase
      .from("ticket_types")
      .select("*")
      .in("id", ticketTypeIds)
      .eq("is_active", true);

    if (ticketError || !ticketTypes) {
      console.error("Error fetching ticket types:", ticketError);
      return NextResponse.json(
        { error: "チケット情報の取得に失敗しました" },
        { status: 500 }
      );
    }

    // Validate all items exist
    const ticketTypeMap = new Map(ticketTypes.map((t) => [t.id, t]));
    for (const item of items) {
      if (!ticketTypeMap.has(item.ticketTypeId)) {
        return NextResponse.json(
          { error: `無効なチケット種別: ${item.ticketTypeId}` },
          { status: 400 }
        );
      }
    }

    // Calculate totals
    let subtotal = 0;
    const lineItems = items.map((item) => {
      const ticketType = ticketTypeMap.get(item.ticketTypeId)!;
      subtotal += ticketType.price * item.quantity;

      return {
        price_data: {
          currency: "jpy",
          product_data: {
            name: ticketType.name,
            description: ticketType.description || undefined,
          },
          unit_amount: ticketType.price,
        },
        quantity: item.quantity,
      };
    });

    // Calculate discount based on promo code
    let discountAmount = 0;
    if (promoCode) {
      switch (promoCode.discount_type) {
        case "free_all":
          discountAmount = subtotal;
          break;
        case "member_price":
          // 20% discount for member price
          discountAmount = Math.floor(subtotal * 0.2);
          break;
        case "fixed_price":
          if (promoCode.fixed_price !== null) {
            discountAmount = Math.max(0, subtotal - promoCode.fixed_price);
          }
          break;
        // Add more cases as needed
      }
    }

    const discountedSubtotal = subtotal - discountAmount;
    const tax = Math.floor(discountedSubtotal * 0.1);
    const total = discountedSubtotal + tax;

    // Create order in database (pending status)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        purchaser_id: user.id,
        status: "pending",
        payment_method: "card",
        subtotal: discountedSubtotal,
        tax,
        total,
        promo_code_id: promoCode?.id || null,
        discount_amount: discountAmount,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Error creating order:", orderError);
      return NextResponse.json(
        { error: "注文の作成に失敗しました" },
        { status: 500 }
      );
    }

    // Create order items
    const orderItems = items.map((item) => {
      const ticketType = ticketTypeMap.get(item.ticketTypeId)!;
      return {
        order_id: order.id,
        ticket_type_id: item.ticketTypeId,
        quantity: item.quantity,
        unit_price: ticketType.price,
      };
    });

    const { error: orderItemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (orderItemsError) {
      console.error("Error creating order items:", orderItemsError);
      // Cleanup: delete the order
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { error: "注文明細の作成に失敗しました" },
        { status: 500 }
      );
    }

    // Create Stripe Checkout Session
    const stripe = getStripeServer();

    // Handle discount - recreate line items with adjusted prices if there's a discount
    let stripeLineItems = lineItems;

    if (discountAmount > 0 && promoCode) {
      // Calculate discount ratio
      const discountRatio = discountAmount / subtotal;

      // Create adjusted line items with proportional discount
      stripeLineItems = items.map((item) => {
        const ticketType = ticketTypeMap.get(item.ticketTypeId)!;
        const originalPrice = ticketType.price;
        const discountedPrice = Math.floor(originalPrice * (1 - discountRatio));

        return {
          price_data: {
            currency: "jpy",
            product_data: {
              name: `${ticketType.name}（${promoCode.name}適用）`,
              description: ticketType.description || undefined,
            },
            unit_amount: discountedPrice,
          },
          quantity: item.quantity,
        };
      });
    }

    // Add tax as a separate line item
    stripeLineItems.push({
      price_data: {
        currency: "jpy",
        product_data: {
          name: "消費税（10%）",
          description: undefined,
        },
        unit_amount: tax,
      },
      quantity: 1,
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: stripeLineItems,
      success_url: `${baseUrl}/mypage/orders/${order.id}?success=true`,
      cancel_url: `${baseUrl}/ticket?cancelled=true`,
      customer_email: user.email,
      metadata: {
        order_id: order.id,
        user_id: user.id,
        promo_code_id: promoCode?.id || "",
      },
      locale: "ja",
    });

    // Record promo code usage
    if (promoCode) {
      await supabase.rpc("use_promo_code", {
        p_promo_code_id: promoCode.id,
        p_user_id: user.id,
        p_order_id: order.id,
      });
    }

    // Update order with Stripe session ID
    await supabase
      .from("orders")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", order.id);

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "チェックアウト処理でエラーが発生しました" },
      { status: 500 }
    );
  }
}
