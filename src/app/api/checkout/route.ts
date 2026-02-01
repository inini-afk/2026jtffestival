import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripeServer, getOrCreateStripeCustomer } from "@/lib/stripe";
import type { PaymentMethod } from "@/types";
import Stripe from "stripe";

interface CheckoutItem {
  ticketTypeId: string;
  quantity: number;
}

interface CompanyInfo {
  companyName: string;
  companyCountry: string;
  companyPostalCode?: string;
  companyAddress: string;
  companyPhone: string;
}

type CheckoutPaymentMethod = "card" | "bank_transfer" | "invoice";

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
    const { items, promoCodeId, paymentMethod = "card", companyInfo } = body as {
      items: CheckoutItem[];
      promoCodeId?: string;
      paymentMethod?: CheckoutPaymentMethod;
      companyInfo?: CompanyInfo;
    };

    // Validate invoice payment requirements
    if (paymentMethod === "invoice") {
      // Get user profile to check account type
      const { data: profileCheck } = await supabase
        .from("profiles")
        .select("account_type, company")
        .eq("id", user.id)
        .single();

      if (profileCheck?.account_type !== "company") {
        return NextResponse.json(
          { error: "請求書払いは法人のみご利用いただけます" },
          { status: 400 }
        );
      }

      if (!companyInfo?.companyName || !companyInfo?.companyAddress || !companyInfo?.companyPhone) {
        return NextResponse.json(
          { error: "請求書払いには請求書宛先、所在地、電話番号が必要です" },
          { status: 400 }
        );
      }
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "カートが空です" },
        { status: 400 }
      );
    }

    // Get user profile for account type check
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("account_type")
      .eq("id", user.id)
      .single();

    // Individual accounts can only purchase 1 ticket total
    if (userProfile?.account_type !== "company") {
      // Count tickets in current cart
      const cartTicketCount = items.reduce((sum, item) => sum + item.quantity, 0);

      if (cartTicketCount > 1) {
        return NextResponse.json(
          { error: "個人アカウントは1枚のみ購入可能です。複数枚購入するには法人アカウントに変更してください。" },
          { status: 400 }
        );
      }

      // Check if user already has purchased tickets (paid or pending orders)
      const { count: existingTicketCount } = await supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("purchaser_id", user.id);

      // Also check pending orders (tickets not yet created)
      const { data: pendingOrders } = await supabase
        .from("orders")
        .select("id")
        .eq("purchaser_id", user.id)
        .eq("status", "pending");

      let pendingTicketCount = 0;
      if (pendingOrders && pendingOrders.length > 0) {
        const pendingOrderIds = pendingOrders.map((o) => o.id);
        const { data: pendingItems } = await supabase
          .from("order_items")
          .select("quantity")
          .in("order_id", pendingOrderIds);

        pendingTicketCount = pendingItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      }

      const totalExistingTickets = (existingTicketCount || 0) + pendingTicketCount;

      if (totalExistingTickets > 0) {
        return NextResponse.json(
          { error: "個人アカウントは1枚のみ購入可能です。既にチケットをお持ちです。" },
          { status: 400 }
        );
      }
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

    // Map checkout payment method to database payment method
    const dbPaymentMethod: PaymentMethod =
      paymentMethod === "bank_transfer" ? "bank_transfer" :
      paymentMethod === "invoice" ? "invoice" : "card";

    // Create order in database (pending status)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        purchaser_id: user.id,
        status: "pending",
        payment_method: dbPaymentMethod,
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

    // Get user profile for name and company info
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, company, account_type, company_country, company_postal_code, company_address, company_phone, company_registration_number")
      .eq("id", user.id)
      .single();

    // Get or create Stripe Customer
    const stripeCustomerId = await getOrCreateStripeCustomer(
      user.id,
      user.email || "",
      profile?.name || undefined
    );

    // Handle invoice payment separately
    if (paymentMethod === "invoice") {
      // Update company info in profile if provided
      if (companyInfo) {
        await supabase
          .from("profiles")
          .update({
            account_type: "company",
            company: companyInfo.companyName,
            company_country: companyInfo.companyCountry,
            company_postal_code: companyInfo.companyPostalCode || null,
            company_address: companyInfo.companyAddress,
            company_phone: companyInfo.companyPhone,
          })
          .eq("id", user.id);
      }

      // Build address for Stripe
      const stripeAddress: Stripe.AddressParam = {
        line1: companyInfo?.companyAddress || profile?.company_address || "",
        country: companyInfo?.companyCountry || profile?.company_country || "JP",
      };
      if (companyInfo?.companyPostalCode || profile?.company_postal_code) {
        stripeAddress.postal_code = companyInfo?.companyPostalCode || profile?.company_postal_code || undefined;
      }

      // Update Stripe Customer with company information and Japanese locale
      await stripe.customers.update(stripeCustomerId, {
        name: companyInfo?.companyName || profile?.company || profile?.name || undefined,
        address: stripeAddress,
        phone: companyInfo?.companyPhone || profile?.company_phone || undefined,
        preferred_locales: ["ja"], // Japanese invoices
      });

      // Calculate due date (end of next month)
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0); // Last day of next month
      const dueDate = Math.floor(nextMonth.getTime() / 1000);

      // Create invoice items
      for (const item of items) {
        const ticketType = ticketTypeMap.get(item.ticketTypeId)!;
        let unitPrice = ticketType.price;

        // Apply discount if promo code
        if (discountAmount > 0 && promoCode) {
          const discountRatio = discountAmount / subtotal;
          unitPrice = Math.floor(ticketType.price * (1 - discountRatio));
        }

        // Total amount for this line item (unit price * quantity)
        const lineAmount = unitPrice * item.quantity;

        await stripe.invoiceItems.create({
          customer: stripeCustomerId,
          amount: lineAmount,
          currency: "jpy",
          description: promoCode
            ? `${ticketType.name}（${promoCode.name}適用）× ${item.quantity}`
            : `${ticketType.name} × ${item.quantity}`,
        });
      }

      // Add tax as invoice item
      await stripe.invoiceItems.create({
        customer: stripeCustomerId,
        amount: tax,
        currency: "jpy",
        description: "消費税（10%）",
      });

      // JTF's Qualified Invoice Issuer Number (適格請求書発行事業者番号)
      const JTF_INVOICE_REGISTRATION_NUMBER = "T1234567890123";

      // Create and finalize the invoice
      const invoice = await stripe.invoices.create({
        customer: stripeCustomerId,
        collection_method: "send_invoice",
        due_date: dueDate,
        auto_advance: true, // Auto-finalize
        metadata: {
          order_id: order.id,
          user_id: user.id,
          promo_code_id: promoCode?.id || "",
        },
        custom_fields: [
          {
            name: "注文番号",
            value: order.order_number,
          },
          {
            name: "登録番号",
            value: JTF_INVOICE_REGISTRATION_NUMBER,
          },
        ],
        footer: `一般社団法人日本翻訳連盟\n適格請求書発行事業者登録番号: ${JTF_INVOICE_REGISTRATION_NUMBER}`,
      });

      // Finalize and send the invoice
      const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
      await stripe.invoices.sendInvoice(invoice.id);

      // Update order with Stripe invoice ID
      await supabase
        .from("orders")
        .update({ stripe_invoice_id: invoice.id })
        .eq("id", order.id);

      return NextResponse.json({
        invoiceId: invoice.id,
        invoiceUrl: finalizedInvoice.hosted_invoice_url,
        invoicePdf: finalizedInvoice.invoice_pdf,
      });
    }

    // Configure payment methods based on selected payment method
    const paymentMethodTypes: ("card" | "customer_balance")[] =
      paymentMethod === "bank_transfer"
        ? ["customer_balance"]
        : ["card"];

    // Build session options
    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      payment_method_types: paymentMethodTypes,
      line_items: stripeLineItems,
      success_url: `${baseUrl}/mypage/orders/${order.id}?success=true`,
      cancel_url: `${baseUrl}/ticket?cancelled=true`,
      customer: stripeCustomerId,
      metadata: {
        order_id: order.id,
        user_id: user.id,
        promo_code_id: promoCode?.id || "",
        payment_method: paymentMethod,
      },
      locale: "ja",
    };

    // Add bank transfer specific options
    if (paymentMethod === "bank_transfer") {
      sessionOptions.payment_method_options = {
        customer_balance: {
          funding_type: "bank_transfer",
          bank_transfer: {
            type: "jp_bank_transfer",
          },
        },
      };
      // Set expiration for bank transfer (7 days)
      sessionOptions.expires_at = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
    }

    const session = await stripe.checkout.sessions.create(sessionOptions);

    // Note: Promo code usage is recorded in the webhook when payment completes
    // This prevents codes from being marked as used when payment is cancelled

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
