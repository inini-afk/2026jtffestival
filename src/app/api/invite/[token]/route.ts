import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types";

// Use service role for reading invite info (no RLS restrictions)
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase configuration missing");
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = getSupabaseAdmin();

    // Find ticket by invite token
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("*, ticket_types(*), profiles!tickets_purchaser_id_fkey(*)")
      .eq("invite_token", token)
      .eq("status", "invited")
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: "招待が見つからないか、既に使用されています" },
        { status: 404 }
      );
    }

    const ticketType = ticket.ticket_types as { name: string } | null;
    const purchaser = ticket.profiles as { name: string } | null;

    return NextResponse.json({
      ticketNumber: ticket.ticket_number,
      ticketTypeName: ticketType?.name || "不明",
      purchaserName: purchaser?.name || "不明",
      inviteEmail: ticket.invite_email,
    });
  } catch (error) {
    console.error("Error fetching invite:", error);
    return NextResponse.json(
      { error: "招待情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}
