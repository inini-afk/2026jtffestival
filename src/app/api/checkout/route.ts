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
    const { items } = body as { items: CheckoutItem[] };

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "カートが空です" },
        { status: 400 }
      );
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

    const tax = Math.floor(subtotal * 0.1);
    const total = subtotal + tax;

    // Create order in database (pending status)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        purchaser_id: user.id,
        status: "pending",
        payment_method: "card",
        subtotal,
        tax,
        total,
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

    // Add tax as a separate line item
    lineItems.push({
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
      line_items: lineItems,
      success_url: `${baseUrl}/mypage/orders/${order.id}?success=true`,
      cancel_url: `${baseUrl}/ticket?cancelled=true`,
      customer_email: user.email,
      metadata: {
        order_id: order.id,
        user_id: user.id,
      },
      locale: "ja",
    });

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
