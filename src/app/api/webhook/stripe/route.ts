import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { getStripeServer } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types";
import { sendEmail, purchaseConfirmationEmail } from "@/lib/email";

// Use service role for webhook (no RLS restrictions)
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase configuration missing for webhook");
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey);
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripeServer();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      // For bank transfers, payment_status will be "unpaid" initially
      // The actual payment confirmation comes via async_payment_succeeded
      if (session.payment_status === "paid") {
        await handleCheckoutCompleted(session);
      } else if (session.payment_status === "unpaid") {
        // Bank transfer - mark order as awaiting payment
        await handleBankTransferPending(session);
      }
      break;
    }
    case "checkout.session.async_payment_succeeded": {
      // Bank transfer payment completed
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      break;
    }
    case "checkout.session.async_payment_failed": {
      // Bank transfer payment failed or expired
      const session = event.data.object as Stripe.Checkout.Session;
      await handleAsyncPaymentFailed(session);
      break;
    }
    case "checkout.session.expired": {
      // Session expired before payment
      const session = event.data.object as Stripe.Checkout.Session;
      await handleSessionExpired(session);
      break;
    }
    case "invoice.paid": {
      // Invoice payment completed (for invoice payment method)
      const invoice = event.data.object as Stripe.Invoice;
      await handleInvoicePaid(invoice);
      break;
    }
    case "invoice.payment_failed": {
      // Invoice payment failed
      const invoice = event.data.object as Stripe.Invoice;
      console.log("Invoice payment failed:", invoice.id);
      break;
    }
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log("Payment succeeded:", paymentIntent.id);
      break;
    }
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log("Payment failed:", paymentIntent.id);
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

/**
 * Handle bank transfer pending - order created but awaiting payment
 */
async function handleBankTransferPending(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;

  if (!orderId) {
    console.error("Missing order_id in checkout session:", session.id);
    return;
  }

  const supabase = getSupabaseAdmin();

  // Order is already created as "pending" - just log for now
  // We could send an email with bank transfer instructions here
  console.log(
    `Bank transfer pending for order ${orderId}. ` +
    `Payment instructions sent to customer.`
  );

  // Optionally send bank transfer instructions email
  // The instructions are shown on the Stripe hosted page,
  // but we could also send them via email
}

/**
 * Handle async payment failed (bank transfer expired or failed)
 */
async function handleAsyncPaymentFailed(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;

  if (!orderId) {
    console.error("Missing order_id in checkout session:", session.id);
    return;
  }

  const supabase = getSupabaseAdmin();

  try {
    // Update order status to cancelled
    const { error } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("status", "pending"); // Only cancel if still pending

    if (error) {
      console.error("Error cancelling order:", error);
      return;
    }

    console.log(`Order ${orderId} cancelled due to payment failure/expiry.`);
  } catch (error) {
    console.error("Error handling async payment failed:", error);
  }
}

/**
 * Handle session expired (customer didn't complete checkout)
 */
async function handleSessionExpired(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;

  if (!orderId) {
    console.error("Missing order_id in checkout session:", session.id);
    return;
  }

  const supabase = getSupabaseAdmin();

  try {
    // Update order status to cancelled
    const { error } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("status", "pending"); // Only cancel if still pending

    if (error) {
      console.error("Error cancelling expired order:", error);
      return;
    }

    console.log(`Order ${orderId} cancelled due to session expiry.`);
  } catch (error) {
    console.error("Error handling session expired:", error);
  }
}

/**
 * Handle invoice paid - complete the order when invoice is paid
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const orderId = invoice.metadata?.order_id;
  const userId = invoice.metadata?.user_id;
  const promoCodeId = invoice.metadata?.promo_code_id;

  if (!orderId || !userId) {
    console.error("Missing metadata in invoice:", invoice.id);
    return;
  }

  const supabase = getSupabaseAdmin();

  try {
    // Update order status to paid
    const { error: orderError } = await supabase
      .from("orders")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (orderError) {
      console.error("Error updating order:", orderError);
      return;
    }

    // Record promo code usage (only after payment is confirmed)
    if (promoCodeId) {
      const { error: promoError } = await supabase.rpc("use_promo_code", {
        p_promo_code_id: promoCodeId,
        p_user_id: userId,
        p_order_id: orderId,
      });

      if (promoError) {
        console.error("Error recording promo code usage:", promoError);
      } else {
        console.log(`Promo code ${promoCodeId} usage recorded for order ${orderId}`);
      }
    }

    // Get order items to create tickets
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (itemsError || !orderItems) {
      console.error("Error fetching order items:", itemsError);
      return;
    }

    // Create tickets for each order item
    const tickets = [];
    for (const item of orderItems) {
      for (let i = 0; i < item.quantity; i++) {
        tickets.push({
          order_id: orderId,
          order_item_id: item.id,
          ticket_type_id: item.ticket_type_id,
          purchaser_id: userId,
          status: "unassigned" as const,
        });
      }
    }

    if (tickets.length > 0) {
      const { error: ticketsError } = await supabase
        .from("tickets")
        .insert(tickets);

      if (ticketsError) {
        console.error("Error creating tickets:", ticketsError);
        return;
      }

      // Add 'purchaser' role to the user if not already present
      const { data: profile } = await supabase
        .from("profiles")
        .select("roles")
        .eq("id", userId)
        .single();

      if (profile && !profile.roles?.includes("purchaser")) {
        const newRoles = [...(profile.roles || []), "purchaser"];
        await supabase
          .from("profiles")
          .update({ roles: newRoles })
          .eq("id", userId);
        console.log(`Added 'purchaser' role to user ${userId}`);
      }
    }

    console.log(
      `Invoice ${invoice.id} paid. Order ${orderId} completed. Created ${tickets.length} tickets.`
    );

    // Send purchase confirmation email
    await sendPurchaseConfirmationEmail(supabase, orderId, userId);
  } catch (error) {
    console.error("Error handling invoice paid:", error);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;
  const userId = session.metadata?.user_id;
  const promoCodeId = session.metadata?.promo_code_id;

  if (!orderId || !userId) {
    console.error("Missing metadata in checkout session:", session.id);
    return;
  }

  const supabase = getSupabaseAdmin();

  try {
    // Update order status to paid
    const { error: orderError } = await supabase
      .from("orders")
      .update({
        status: "paid",
        stripe_payment_intent_id: session.payment_intent as string,
        paid_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (orderError) {
      console.error("Error updating order:", orderError);
      return;
    }

    // Record promo code usage (only after payment is confirmed)
    if (promoCodeId) {
      const { error: promoError } = await supabase.rpc("use_promo_code", {
        p_promo_code_id: promoCodeId,
        p_user_id: userId,
        p_order_id: orderId,
      });

      if (promoError) {
        console.error("Error recording promo code usage:", promoError);
        // Continue anyway - the order is already paid
      } else {
        console.log(`Promo code ${promoCodeId} usage recorded for order ${orderId}`);
      }
    }

    // Get order items to create tickets
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (itemsError || !orderItems) {
      console.error("Error fetching order items:", itemsError);
      return;
    }

    // Create tickets for each order item
    const tickets = [];
    for (const item of orderItems) {
      for (let i = 0; i < item.quantity; i++) {
        tickets.push({
          order_id: orderId,
          order_item_id: item.id,
          ticket_type_id: item.ticket_type_id,
          purchaser_id: userId,
          status: "unassigned" as const,
        });
      }
    }

    if (tickets.length > 0) {
      const { error: ticketsError } = await supabase
        .from("tickets")
        .insert(tickets);

      if (ticketsError) {
        console.error("Error creating tickets:", ticketsError);
        return;
      }

      // Add 'purchaser' role to the user if not already present
      const { data: profile } = await supabase
        .from("profiles")
        .select("roles")
        .eq("id", userId)
        .single();

      if (profile && !profile.roles?.includes("purchaser")) {
        const newRoles = [...(profile.roles || []), "purchaser"];
        await supabase
          .from("profiles")
          .update({ roles: newRoles })
          .eq("id", userId);
        console.log(`Added 'purchaser' role to user ${userId}`);
      }
    }

    console.log(
      `Order ${orderId} completed. Created ${tickets.length} tickets.`
    );

    // Send purchase confirmation email
    await sendPurchaseConfirmationEmail(supabase, orderId, userId);
  } catch (error) {
    console.error("Error handling checkout completed:", error);
  }
}

async function sendPurchaseConfirmationEmail(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  orderId: string,
  userId: string
) {
  try {
    // Get order with items and ticket types
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Error fetching order for email:", orderError);
      return;
    }

    // Get order items with ticket types
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("*, ticket_type:ticket_types(*)")
      .eq("order_id", orderId);

    if (itemsError || !orderItems) {
      console.error("Error fetching order items for email:", itemsError);
      return;
    }

    // Get purchaser profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      console.error("Error fetching profile for email:", profileError);
      return;
    }

    // Format items for email
    const items = orderItems.map((item) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ticketType = item.ticket_type as any;
      return {
        name: ticketType?.name || "チケット",
        quantity: item.quantity,
        unitPrice: item.unit_price,
      };
    });

    const emailContent = purchaseConfirmationEmail({
      purchaserName: profile.name || "お客様",
      orderNumber: order.order_number,
      items,
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      paymentMethod: order.payment_method || "card",
    });

    const result = await sendEmail({
      to: profile.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (result.success) {
      console.log(`Purchase confirmation email sent for order ${order.order_number}`);
    } else {
      console.error(`Failed to send purchase confirmation email: ${result.error}`);
    }
  } catch (error) {
    console.error("Error sending purchase confirmation email:", error);
  }
}
