import type { Order, Profile } from "@/types";

export interface AdminOrder extends Order {
  purchaser: Profile;
}

export interface AdminAttendee {
  ticket_id: string;
  ticket_number: string;
  ticket_type_name: string;
  includes_onsite: boolean;
  includes_online: boolean;
  status: string;
  purchaser_name: string;
  purchaser_email: string;
  attendee_name: string | null;
  attendee_email: string | null;
  attendee_company: string | null;
  is_purchaser: boolean;
}

export interface AdminStats {
  totalOrders: number;
  paidOrders: number;
  totalRevenue: number;
  totalAttendees: number;
  ticketsByStatus: { unassigned: number; invited: number; assigned: number };
}

/**
 * Get admin dashboard stats (via API Route to bypass RLS)
 */
export async function getAdminStats(): Promise<AdminStats> {
  const res = await fetch("/api/admin/stats");
  if (!res.ok) throw new Error("Failed to fetch admin stats");
  return res.json();
}

/**
 * Get all orders with purchaser profile (via API Route to bypass RLS)
 */
export async function getAllOrders(): Promise<AdminOrder[]> {
  const res = await fetch("/api/admin/orders");
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
}

/**
 * Get all attendees (via API Route to bypass RLS)
 */
export async function getAllAttendees(): Promise<AdminAttendee[]> {
  const res = await fetch("/api/admin/attendees");
  if (!res.ok) throw new Error("Failed to fetch attendees");
  return res.json();
}
