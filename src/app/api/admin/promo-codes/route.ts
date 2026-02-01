import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { PromoCategory } from "@/types";

// Check if user is admin
async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single();

  const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
  return adminEmails.includes(profile?.email || "");
}

// GET: List all promo codes
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(supabase, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const active = searchParams.get("active");

    let query = supabase
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (category) {
      query = query.eq("category", category as PromoCategory);
    }

    if (active !== null) {
      query = query.eq("is_active", active === "true");
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching promo codes:", error);
      return NextResponse.json(
        { error: "Failed to fetch promo codes" },
        { status: 500 }
      );
    }

    return NextResponse.json({ promoCodes: data });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create new promo code
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(supabase, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      code,
      name,
      description,
      discountType,
      fixedPrice,
      maxTotalUses,
      maxUsesPerUser,
      applicableTicketTypes,
      validFrom,
      validUntil,
      category,
      isActive,
    } = body;

    // Validate required fields
    if (!code || !name || !discountType) {
      return NextResponse.json(
        { error: "Code, name, and discount type are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("promo_codes")
      .insert({
        code: code.toUpperCase(),
        name,
        description,
        discount_type: discountType,
        fixed_price: fixedPrice,
        max_total_uses: maxTotalUses,
        max_uses_per_user: maxUsesPerUser,
        applicable_ticket_types: applicableTicketTypes,
        valid_from: validFrom,
        valid_until: validUntil,
        category,
        is_active: isActive ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating promo code:", error);
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A promo code with this code already exists" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Failed to create promo code" },
        { status: 500 }
      );
    }

    return NextResponse.json({ promoCode: data }, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Update promo code
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(supabase, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Promo code ID is required" },
        { status: 400 }
      );
    }

    // Convert camelCase to snake_case
    const dbUpdates: Record<string, unknown> = {};
    if (updates.code !== undefined) dbUpdates.code = updates.code.toUpperCase();
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.discountType !== undefined) dbUpdates.discount_type = updates.discountType;
    if (updates.fixedPrice !== undefined) dbUpdates.fixed_price = updates.fixedPrice;
    if (updates.maxTotalUses !== undefined) dbUpdates.max_total_uses = updates.maxTotalUses;
    if (updates.maxUsesPerUser !== undefined) dbUpdates.max_uses_per_user = updates.maxUsesPerUser;
    if (updates.applicableTicketTypes !== undefined) dbUpdates.applicable_ticket_types = updates.applicableTicketTypes;
    if (updates.validFrom !== undefined) dbUpdates.valid_from = updates.validFrom;
    if (updates.validUntil !== undefined) dbUpdates.valid_until = updates.validUntil;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

    const { data, error } = await supabase
      .from("promo_codes")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating promo code:", error);
      return NextResponse.json(
        { error: "Failed to update promo code" },
        { status: 500 }
      );
    }

    return NextResponse.json({ promoCode: data });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete promo code
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(supabase, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Promo code ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("promo_codes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting promo code:", error);
      return NextResponse.json(
        { error: "Failed to delete promo code" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
