import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types";

// Use service role for accepting invite (no RLS restrictions)
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase configuration missing");
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { userId } = body as { userId: string };

    if (!userId) {
      return NextResponse.json(
        { error: "ユーザーIDが必要です" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Find ticket by invite token
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("*")
      .eq("invite_token", token)
      .eq("status", "invited")
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: "招待が見つからないか、既に使用されています" },
        { status: 404 }
      );
    }

    // Update ticket to assign to user
    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        status: "assigned",
        attendee_id: userId,
        assigned_at: new Date().toISOString(),
        invite_token: null, // Clear token after use
      })
      .eq("id", ticket.id);

    if (updateError) {
      console.error("Error updating ticket:", updateError);
      return NextResponse.json(
        { error: "チケットの割り当てに失敗しました" },
        { status: 500 }
      );
    }

    // Update user profile to add attendee role
    const { data: profile } = await supabase
      .from("profiles")
      .select("roles")
      .eq("id", userId)
      .single();

    if (profile) {
      const currentRoles = profile.roles || [];
      if (!currentRoles.includes("attendee")) {
        await supabase
          .from("profiles")
          .update({
            roles: [...currentRoles, "attendee"],
          })
          .eq("id", userId);
      }
    }

    return NextResponse.json({
      success: true,
      message: "チケットを受け取りました",
      ticketId: ticket.id,
    });
  } catch (error) {
    console.error("Error accepting invite:", error);
    return NextResponse.json(
      { error: "招待の受け入れに失敗しました" },
      { status: 500 }
    );
  }
}
