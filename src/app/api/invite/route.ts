import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";
import { sendEmail, inviteEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "ログインが必要です" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { ticketId, email } = body as { ticketId: string; email: string };

    if (!ticketId || !email) {
      return NextResponse.json(
        { error: "チケットIDとメールアドレスが必要です" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "有効なメールアドレスを入力してください" },
        { status: 400 }
      );
    }

    // Get the ticket with ticket type info and verify ownership
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("*, ticket_type:ticket_types(*)")
      .eq("id", ticketId)
      .eq("purchaser_id", user.id)
      .single();

    // Get purchaser profile
    const { data: purchaserProfile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: "チケットが見つかりません" },
        { status: 404 }
      );
    }

    // Check if ticket is already assigned or invited
    if (ticket.status !== "unassigned") {
      return NextResponse.json(
        { error: "このチケットは既に招待済みまたは割当済みです" },
        { status: 400 }
      );
    }

    // Generate invite token
    const inviteToken = randomBytes(32).toString("hex");

    // Update ticket with invite info
    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        status: "invited",
        invite_email: email,
        invite_token: inviteToken,
        invite_sent_at: new Date().toISOString(),
      })
      .eq("id", ticketId);

    if (updateError) {
      console.error("Error updating ticket:", updateError);
      return NextResponse.json(
        { error: "招待の送信に失敗しました" },
        { status: 500 }
      );
    }

    // Send invitation email using Resend
    const purchaserName = purchaserProfile?.name || "JTF翻訳祭2026参加者";
    const ticketTypeName = ticket.ticket_type?.name || "チケット";

    const emailContent = inviteEmail({
      purchaserName,
      ticketTypeName,
      inviteToken,
    });

    const emailResult = await sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (!emailResult.success) {
      console.error("[Invite] Email send failed:", emailResult.error);
      // Note: We don't fail the request since the ticket is already updated.
      // The invite can be resent later if needed.
    }

    // Generate invite URL for logging/response
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const inviteUrl = `${baseUrl}/invite/${inviteToken}`;

    // Log invite URL in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[Invite] URL for ${email}: ${inviteUrl}`);
    }

    return NextResponse.json({
      success: true,
      message: "招待を送信しました",
      // Include invite URL in dev mode for testing
      ...(process.env.NODE_ENV === "development" && { inviteUrl }),
    });
  } catch (error) {
    console.error("Invite error:", error);
    return NextResponse.json(
      { error: "招待処理でエラーが発生しました" },
      { status: 500 }
    );
  }
}
