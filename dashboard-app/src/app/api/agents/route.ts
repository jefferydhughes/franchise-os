import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrgScopedClient, createServerClient } from "@/lib/supabase";

/**
 * Resolve the Clerk orgId to the brand UUID.
 * Uses the service role client (bypasses RLS) for the lookup.
 */
async function resolveBrandId(orgId: string): Promise<string | null> {
  const client = createServerClient();
  const { data } = await client
    .from("brands")
    .select("id")
    .eq("clerk_org_id", orgId)
    .single();
  return data?.id ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return NextResponse.json(
        { error: "Unauthorized — no organization context" },
        { status: 401 }
      );
    }

    const brandId = await resolveBrandId(orgId);
    if (!brandId) {
      return NextResponse.json(
        { error: "Brand not found for this organization" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);
    const status = searchParams.get("status");

    const supabase = await getOrgScopedClient(orgId);
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
        { error: "Failed to fetch agent events" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      events: data,
      count: data?.length ?? 0,
      brandId,
    });
  } catch (error) {
    console.error("Agents GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return NextResponse.json(
        { error: "Unauthorized — no organization context" },
        { status: 401 }
      );
    }

    const brandId = await resolveBrandId(orgId);
    if (!brandId) {
      return NextResponse.json(
        { error: "Brand not found for this organization" },
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

    const supabase = await getOrgScopedClient(orgId);
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
        { error: "Failed to create agent event" },
        { status: 500 }
      );
    }

    return NextResponse.json({ event: data }, { status: 201 });
  } catch (error) {
    console.error("Agents POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
