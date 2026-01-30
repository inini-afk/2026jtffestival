import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types";
import { sendEmail, inviteAcceptedEmail } from "@/lib/email";

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

    // Find ticket by invite token with related data
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("*, ticket_type:ticket_types(*), purchaser:profiles!tickets_purchaser_id_fkey(*)")
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

    // Update user profile to add attendee role and get attendee info
    const { data: attendeeProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (attendeeProfile) {
      const currentRoles = attendeeProfile.roles || [];
      if (!currentRoles.includes("attendee")) {
        await supabase
          .from("profiles")
          .update({
            roles: [...currentRoles, "attendee"],
          })
          .eq("id", userId);
      }

      // Send notification email to purchaser
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const purchaser = ticket.purchaser as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ticketType = ticket.ticket_type as any;

      if (purchaser?.email) {
        const emailContent = inviteAcceptedEmail({
          purchaserName: purchaser.name || "購入者",
          attendeeName: attendeeProfile.name || "参加者",
          attendeeEmail: attendeeProfile.email,
          ticketTypeName: ticketType?.name || "チケット",
        });

        await sendEmail({
          to: purchaser.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });
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
