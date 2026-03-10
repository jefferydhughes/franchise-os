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

    const brandId = await resolveBrandId(orgId);
    if (!brandId) {
      return NextResponse.json(
        { error: "No brand found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const layer = searchParams.get("layer");

    const supabase = createServerClient();
    let query = supabase
      .from("memory_entries")
      .select("*")
      .eq("brand_id", brandId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(100);

    if (layer) {
      query = query.eq("layer", layer);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching memory entries:", error);
      return NextResponse.json(
        { error: "Failed to fetch memory entries", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      entries: data ?? [],
      count: data?.length ?? 0,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Memory GET error:", errMsg);
    return NextResponse.json(
      { error: "Internal server error", detail: errMsg },
      { status: 500 }
    );
  }
}
