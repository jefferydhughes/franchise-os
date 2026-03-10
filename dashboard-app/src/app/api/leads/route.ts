import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase";

/**
 * Resolve the brand for the current user.
 * If the user belongs to a Clerk org, look up by clerk_org_id.
 * Otherwise, fall back to the default brand (skill-samurai).
 */
async function resolveBrandId(orgId: string | null | undefined): Promise<string | null> {
  const client = createServerClient();

  if (orgId) {
    const { data } = await client
      .from("brands")
      .select("id")
      .eq("clerk_org_id", orgId)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  // Fallback: default brand
  const { data } = await client
    .from("brands")
    .select("id")
    .eq("slug", "skill-samurai")
    .maybeSingle();

  return data?.id ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized — please sign in" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const brandIdParam = searchParams.get("brandId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);
    const offset = (page - 1) * limit;

    const brandId = brandIdParam ?? (await resolveBrandId(orgId));
    if (!brandId) {
      return NextResponse.json(
        { error: "No brand found" },
        { status: 404 }
      );
    }

    const supabase = createServerClient();

    let query = supabase
      .from("leads")
      .select("*", { count: "exact" })
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching leads:", error);
      return NextResponse.json(
        { error: "Failed to fetch leads", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      leads: data ?? [],
      total: count ?? 0,
      page,
      limit,
      brandId,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Leads GET error:", errMsg);
    return NextResponse.json(
      { error: "Internal server error", detail: errMsg },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized — please sign in" },
        { status: 401 }
      );
    }

    const brandId = await resolveBrandId(orgId);
    if (!brandId) {
      return NextResponse.json(
        { error: "No brand found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name, email, phone, source, territory_id } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Missing required fields: name, email" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("leads")
      .insert({
        brand_id: brandId,
        name,
        email,
        phone: phone ?? "",
        source: source ?? "manual",
        territory_id: territory_id ?? null,
        persona: "",
        score: 0,
        status: "new",
        data: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating lead:", error);
      return NextResponse.json(
        { error: "Failed to create lead", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ lead: data }, { status: 201 });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Leads POST error:", errMsg);
    return NextResponse.json(
      { error: "Internal server error", detail: errMsg },
      { status: 500 }
    );
  }
}
