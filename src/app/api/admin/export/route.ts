import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  // Verify authenticated user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify admin
  const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
  if (!adminEmails.includes(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const type = request.nextUrl.searchParams.get("type");

  if (type === "orders") {
    return await exportOrders(admin);
  } else if (type === "attendees") {
    return await exportAttendees(admin);
  } else if (type === "onsite") {
    return await exportOnsite(admin);
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toCsv(headers: string[], rows: string[][]): string {
  const escape = (val: string) => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };
  const lines = [headers.map(escape).join(",")];
  for (const row of rows) {
    lines.push(row.map((v) => escape(v ?? "")).join(","));
  }
  return "\uFEFF" + lines.join("\r\n");
}

function csvResponse(csv: string, filename: string) {
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function exportOrders(supabase: any) {
  const { data: orders } = await supabase
    .from("orders")
    .select("*, profiles!orders_purchaser_id_fkey(name, email)")
    .order("created_at", { ascending: false });

  const statusLabels: Record<string, string> = {
    pending: "支払い待ち",
    paid: "支払い済み",
    cancelled: "キャンセル",
    refunded: "返金済み",
  };
  const methodLabels: Record<string, string> = {
    card: "クレジットカード",
    bank_transfer: "銀行振込",
    invoice: "請求書払い",
  };

  const headers = ["注文番号", "申込者名", "メール", "支払方法", "小計", "税", "合計", "状態", "注文日"];
  const rows = (orders || []).map((o: Record<string, unknown>) => {
    const p = o.profiles as Record<string, string> | null;
    return [
      String(o.order_number || ""),
      p?.name || "",
      p?.email || "",
      methodLabels[o.payment_method as string] || String(o.payment_method || "-"),
      String(o.subtotal),
      String(o.tax),
      String(o.total),
      statusLabels[o.status as string] || String(o.status),
      String(o.created_at || ""),
    ];
  });

  return csvResponse(toCsv(headers, rows), "orders.csv");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function exportAttendees(supabase: any) {
  const { data: tickets } = await supabase
    .from("tickets")
    .select(
      "*, ticket_types!tickets_ticket_type_id_fkey(name), purchaser:profiles!tickets_purchaser_id_fkey(name, email), attendee:profiles!tickets_attendee_id_fkey(name, email, company)"
    )
    .order("created_at", { ascending: false });

  const statusLabels: Record<string, string> = {
    unassigned: "未割当",
    invited: "招待済み",
    assigned: "割当済み",
  };

  const headers = ["チケット番号", "参加者名", "メール", "所属", "チケット種別", "区分", "状態"];
  const rows = (tickets || []).map((t: Record<string, unknown>) => {
    const purchaser = t.purchaser as Record<string, string> | null;
    const attendee = t.attendee as Record<string, string> | null;
    const ticketType = t.ticket_types as Record<string, string> | null;
    const isPurchaser = !t.attendee_id || t.attendee_id === t.purchaser_id;
    return [
      String(t.ticket_number || ""),
      attendee?.name || purchaser?.name || "",
      attendee?.email || purchaser?.email || "",
      attendee?.company || "",
      ticketType?.name || "",
      isPurchaser ? "申込者" : "招待者",
      statusLabels[t.status as string] || String(t.status),
    ];
  });

  return csvResponse(toCsv(headers, rows), "attendees.csv");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function exportOnsite(supabase: any) {
  const { data: tickets } = await supabase
    .from("tickets")
    .select(
      "*, ticket_types!tickets_ticket_type_id_fkey(name, includes_onsite), purchaser:profiles!tickets_purchaser_id_fkey(name, email), attendee:profiles!tickets_attendee_id_fkey(name, email, company)"
    )
    .order("created_at", { ascending: false });

  const onsiteTickets = (tickets || []).filter(
    (t: Record<string, unknown>) => {
      const tt = t.ticket_types as Record<string, unknown> | null;
      return tt?.includes_onsite === true;
    }
  );

  const headers = ["チケット番号", "参加者名", "メール", "所属", "チケット種別", "状態"];
  const rows = onsiteTickets.map((t: Record<string, unknown>) => {
    const purchaser = t.purchaser as Record<string, string> | null;
    const attendee = t.attendee as Record<string, string> | null;
    const ticketType = t.ticket_types as Record<string, string> | null;
    const statusLabels: Record<string, string> = {
      unassigned: "未割当",
      invited: "招待済み",
      assigned: "割当済み",
    };
    return [
      String(t.ticket_number || ""),
      attendee?.name || purchaser?.name || "",
      attendee?.email || purchaser?.email || "",
      attendee?.company || "",
      ticketType?.name || "",
      statusLabels[t.status as string] || String(t.status),
    ];
  });

  return csvResponse(toCsv(headers, rows), "onsite_attendees.csv");
}
