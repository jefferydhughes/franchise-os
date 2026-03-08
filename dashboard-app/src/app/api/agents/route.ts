import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get("brand_id");
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);
    const status = searchParams.get("status");

    if (!brandId) {
      return NextResponse.json(
        { error: "Missing required query param: brand_id" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
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

    return NextResponse.json({ events: data, count: data?.length ?? 0 });
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
    const body = await req.json();
    const { brand_id, agent_name, event_type, payload } = body;

    if (!brand_id || !agent_name || !event_type) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: brand_id, agent_name, event_type",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("agent_events")
      .insert({
        brand_id,
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
