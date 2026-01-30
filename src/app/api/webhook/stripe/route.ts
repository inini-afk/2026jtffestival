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
      await handleCheckoutCompleted(session);
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

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;
  const userId = session.metadata?.user_id;

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
