import { createClient } from "@/lib/supabase/client";
import type { Profile, Order, Ticket, OrderItem, TicketType, TicketWithDetails } from "@/types";
import type { TicketWithType } from "./ticket";

export type { TicketWithType };

export interface OrderWithDetails extends Order {
  order_items: (OrderItem & { ticket_type: TicketType })[];
  tickets: Ticket[];
}

/**
 * Get the current user's profile
 */
export async function getProfile(): Promise<Profile | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data;
}

/**
 * Update the current user's profile
 */
export async function updateProfile(updates: {
  name?: string;
  company?: string | null;
}): Promise<Profile | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile:", error);
    return null;
  }

  return data;
}

/**
 * Get the current user's orders with items (all statuses except cancelled)
 */
export async function getOrders(): Promise<OrderWithDetails[]> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Get orders (exclude cancelled orders)
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("*")
    .eq("purchaser_id", user.id)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });

  if (ordersError || !orders) {
    console.error("Error fetching orders:", ordersError);
    return [];
  }

  // Get order items with ticket types for all orders
  const orderIds = orders.map((o) => o.id);
  if (orderIds.length === 0) return [];

  const { data: orderItems, error: itemsError } = await supabase
    .from("order_items")
    .select("*, ticket_types(*)")
    .in("order_id", orderIds);

  if (itemsError) {
    console.error("Error fetching order items:", itemsError);
    return [];
  }

  // Get tickets for all orders
  const { data: tickets, error: ticketsError } = await supabase
    .from("tickets")
    .select("*")
    .in("order_id", orderIds);

  if (ticketsError) {
    console.error("Error fetching tickets:", ticketsError);
  }

  // Combine data
  return orders.map((order) => ({
    ...order,
    order_items: (orderItems || [])
      .filter((item) => item.order_id === order.id)
      .map((item) => ({
        ...item,
        ticket_type: item.ticket_types as unknown as TicketType,
      })),
    tickets: (tickets || []).filter((t) => t.order_id === order.id),
  }));
}

/**
 * Get tickets purchased by the current user
 */
export async function getPurchasedTickets(): Promise<Ticket[]> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("purchaser_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching purchased tickets:", error);
    return [];
  }

  return data || [];
}

/**
 * Get tickets assigned to the current user (as attendee) with ticket type info
 */
export async function getAssignedTickets(): Promise<TicketWithType[]> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("tickets")
    .select("*, ticket_types(*)")
    .eq("attendee_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching assigned tickets:", error);
    return [];
  }

  return (data || []).map((t) => ({
    ...t,
    ticket_type: t.ticket_types as unknown as TicketType,
  }));
}

/**
 * Get dashboard stats for the current user
 */
export async function getDashboardStats(): Promise<{
  totalTickets: number;
  invitedTickets: number;
  assignedTickets: number;
}> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { totalTickets: 0, invitedTickets: 0, assignedTickets: 0 };
  }

  // Get tickets purchased by the user
  const { data: purchasedTickets, error: purchasedError } = await supabase
    .from("tickets")
    .select("status")
    .eq("purchaser_id", user.id);

  if (purchasedError) {
    console.error("Error fetching stats:", purchasedError);
    return { totalTickets: 0, invitedTickets: 0, assignedTickets: 0 };
  }

  const tickets = purchasedTickets || [];
  const totalTickets = tickets.length;
  const invitedTickets = tickets.filter((t) => t.status === "invited").length;
  const assignedTickets = tickets.filter((t) => t.status === "assigned").length;

  return { totalTickets, invitedTickets, assignedTickets };
}

/**
 * Get order by ID with items and tickets
 */
export async function getOrderById(orderId: string): Promise<OrderWithDetails | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("purchaser_id", user.id)
    .single();

  if (orderError || !order) {
    console.error("Error fetching order:", orderError);
    return null;
  }

  // Fetch order items with ticket types
  const { data: orderItems, error: itemsError } = await supabase
    .from("order_items")
    .select("*, ticket_types(*)")
    .eq("order_id", orderId);

  if (itemsError) {
    console.error("Error fetching order items:", itemsError);
    return null;
  }

  // Fetch tickets for this order
  const { data: tickets, error: ticketsError } = await supabase
    .from("tickets")
    .select("*")
    .eq("order_id", orderId);

  if (ticketsError) {
    console.error("Error fetching tickets:", ticketsError);
    return null;
  }

  // Transform order items to include ticket_type
  const transformedItems = (orderItems || []).map((item) => ({
    ...item,
    ticket_type: item.ticket_types as unknown as TicketType,
  }));

  return {
    ...order,
    order_items: transformedItems,
    tickets: tickets || [],
  };
}
