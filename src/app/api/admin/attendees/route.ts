import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
  if (!adminEmails.includes(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: tickets, error } = await admin
    .from("tickets")
    .select(
      "*, ticket_types!tickets_ticket_type_id_fkey(*), purchaser:profiles!tickets_purchaser_id_fkey(*), attendee:profiles!tickets_attendee_id_fkey(*)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  interface TicketTypeRow { name?: string; includes_onsite?: boolean; includes_online?: boolean }
  interface ProfileRow { name?: string; email?: string; company?: string }

  const result = (tickets || []).map((t) => {
    const ticketType = t.ticket_types as unknown as TicketTypeRow | null;
    const purchaser = t.purchaser as unknown as ProfileRow | null;
    const attendee = t.attendee as unknown as ProfileRow | null;
    return {
      ticket_id: t.id,
      ticket_number: t.ticket_number,
      ticket_type_name: ticketType?.name || "",
      includes_onsite: ticketType?.includes_onsite || false,
      includes_online: ticketType?.includes_online || false,
      status: t.status,
      purchaser_name: purchaser?.name || "",
      purchaser_email: purchaser?.email || "",
      attendee_name: attendee?.name || null,
      attendee_email: attendee?.email || null,
      attendee_company: attendee?.company || null,
      is_purchaser: !t.attendee_id || t.attendee_id === t.purchaser_id,
    };
  });

  return NextResponse.json(result);
}
