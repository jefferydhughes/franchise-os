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

    const brandId = brandIdParam ?? (await resolveBrandId(orgId));
    if (!brandId) {
      return NextResponse.json(
        { error: "No brand found" },
        { status: 404 }
      );
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("initiatives")
      .select("*")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching initiatives:", error);
      return NextResponse.json(
        { error: "Failed to fetch initiatives", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      initiatives: data ?? [],
      count: data?.length ?? 0,
      brandId,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Initiatives GET error:", errMsg);
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
    const { title, type, description, territory_id } = body;

    if (!title || !type) {
      return NextResponse.json(
        { error: "Missing required fields: title, type" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("initiatives")
      .insert({
        brand_id: brandId,
        title,
        type,
        status: "detected",
        outcome: description ?? "",
        territory_id: territory_id ?? null,
        evidence: {},
        action_plan: {},
        kpis: {},
        data: { description: description ?? "" },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating initiative:", error);
      return NextResponse.json(
        { error: "Failed to create initiative", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ initiative: data }, { status: 201 });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Initiatives POST error:", errMsg);
    return NextResponse.json(
      { error: "Internal server error", detail: errMsg },
      { status: 500 }
    );
  }
}
