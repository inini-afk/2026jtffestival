import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
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

    // Get the order and verify ownership
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("purchaser_id", user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "注文が見つかりません" },
        { status: 404 }
      );
    }

    // Only allow cancellation of pending orders
    if (order.status !== "pending") {
      return NextResponse.json(
        { error: "この注文はキャンセルできません" },
        { status: 400 }
      );
    }

    // Delete associated order items first (foreign key constraint)
    const { error: itemsError } = await supabase
      .from("order_items")
      .delete()
      .eq("order_id", orderId);

    if (itemsError) {
      console.error("Error deleting order items:", itemsError);
      return NextResponse.json(
        { error: "注文明細の削除に失敗しました" },
        { status: 500 }
      );
    }

    // Delete promo code usage if exists
    await supabase
      .from("promo_code_uses")
      .delete()
      .eq("order_id", orderId);

    // Delete the order
    const { error: deleteError } = await supabase
      .from("orders")
      .delete()
      .eq("id", orderId);

    if (deleteError) {
      console.error("Error deleting order:", deleteError);
      return NextResponse.json(
        { error: "注文の削除に失敗しました" },
        { status: 500 }
      );
    }

    console.log(`Order ${orderId} deleted by user ${user.id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel order error:", error);
    return NextResponse.json(
      { error: "キャンセル処理でエラーが発生しました" },
      { status: 500 }
    );
  }
}
