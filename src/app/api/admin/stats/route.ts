import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  // Verify admin
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

  const [{ data: orders }, { data: tickets }] = await Promise.all([
    admin.from("orders").select("status, total"),
    admin.from("tickets").select("status"),
  ]);

  const orderList = orders || [];
  const ticketList = tickets || [];
  const paidOrders = orderList.filter((o) => o.status === "paid");

  return NextResponse.json({
    totalOrders: orderList.length,
    paidOrders: paidOrders.length,
    totalRevenue: paidOrders.reduce((sum, o) => sum + o.total, 0),
    totalAttendees: ticketList.length,
    ticketsByStatus: {
      unassigned: ticketList.filter((t) => t.status === "unassigned").length,
      invited: ticketList.filter((t) => t.status === "invited").length,
      assigned: ticketList.filter((t) => t.status === "assigned").length,
    },
  });
}
