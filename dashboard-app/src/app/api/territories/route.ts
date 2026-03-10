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
      .from("territories")
      .select("*")
      .eq("brand_id", brandId)
      .order("score", { ascending: false });

    if (error) {
      console.error("Error fetching territories:", error);
      return NextResponse.json(
        { error: "Failed to fetch territories", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      territories: data ?? [],
      count: data?.length ?? 0,
      brandId,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Territories GET error:", errMsg);
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
    const { name, region, geo_data, demographics } = body;

    if (!name || !region) {
      return NextResponse.json(
        { error: "Missing required fields: name, region" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("territories")
      .insert({
        brand_id: brandId,
        name,
        region,
        geo_data: geo_data ?? {},
        demographics: demographics ?? {},
        score: 0,
        grade: "C",
        status: "available",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating territory:", error);
      return NextResponse.json(
        { error: "Failed to create territory", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ territory: data }, { status: 201 });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Territories POST error:", errMsg);
    return NextResponse.json(
      { error: "Internal server error", detail: errMsg },
      { status: 500 }
    );
  }
}
