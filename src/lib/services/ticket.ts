import { createClient } from "@/lib/supabase/client";
import type { TicketType, Ticket } from "@/types";

export interface TicketWithType extends Ticket {
  ticket_type: TicketType;
}

/**
 * Get all active ticket types
 */
export async function getTicketTypes(): Promise<TicketType[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("ticket_types")
    .select("*")
    .eq("is_active", true)
    .order("price", { ascending: false });

  if (error) {
    console.error("Error fetching ticket types:", error);
    return [];
  }

  return data || [];
}

/**
 * Get a single ticket type by ID
 */
export async function getTicketType(id: string): Promise<TicketType | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("ticket_types")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching ticket type:", error);
    return null;
  }

  return data;
}

/**
 * Get tickets purchased by the current user that can be assigned
 */
export async function getMyTickets(): Promise<TicketWithType[]> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("tickets")
    .select("*, ticket_types(*)")
    .eq("purchaser_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tickets:", error);
    return [];
  }

  return (data || []).map((ticket) => ({
    ...ticket,
    ticket_type: ticket.ticket_types as unknown as TicketType,
  }));
}

/**
 * Get a single ticket by ID (must be owned by current user)
 */
export async function getTicketById(ticketId: string): Promise<TicketWithType | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("tickets")
    .select("*, ticket_types(*)")
    .eq("id", ticketId)
    .eq("purchaser_id", user.id)
    .single();

  if (error) {
    console.error("Error fetching ticket:", error);
    return null;
  }

  return {
    ...data,
    ticket_type: data.ticket_types as unknown as TicketType,
  };
}
