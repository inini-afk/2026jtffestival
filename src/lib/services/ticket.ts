import { createClient } from "@/lib/supabase/client";
import type { TicketType } from "@/types";

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
