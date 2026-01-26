import { createClient } from "@/lib/supabase/client";
import type { Profile, Order, Ticket } from "@/types";

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
 * Get the current user's orders with items
 */
export async function getOrders(): Promise<Order[]> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("purchaser_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }

  return data || [];
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
 * Get tickets assigned to the current user (as attendee)
 */
export async function getAssignedTickets(): Promise<Ticket[]> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("attendee_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching assigned tickets:", error);
    return [];
  }

  return data || [];
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
