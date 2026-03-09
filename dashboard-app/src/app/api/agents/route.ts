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
      .single();
    if (data?.id) return data.id;
  }

  // Fallback: default brand
  const { data } = await client
    .from("brands")
    .select("id")
    .eq("slug", "skill-samurai")
    .single();

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
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);
    const status = searchParams.get("status");

    const supabase = createServerClient();
    let query = supabase
      .from("agent_events")
      .select("*")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching agent events:", error);
      return NextResponse.json(
        { error: "Failed to fetch agent events", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      events: data,
      count: data?.length ?? 0,
      brandId,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Agents GET error:", errMsg);
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
    const { agent_name, event_type, payload } = body;

    if (!agent_name || !event_type) {
      return NextResponse.json(
        { error: "Missing required fields: agent_name, event_type" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("agent_events")
      .insert({
        brand_id: brandId,
        agent_name,
        event_type,
        payload: payload ?? {},
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating agent event:", error);
      return NextResponse.json(
        { error: "Failed to create agent event", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ event: data }, { status: 201 });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Agents POST error:", errMsg);
    return NextResponse.json(
      { error: "Internal server error", detail: errMsg },
      { status: 500 }
    );
  }
}
