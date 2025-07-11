import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Reusable response wrapper
function createJsonResponse(data: any, status = 200) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
  });
}

// Main GET handler
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auditId = params.id;

  // Validate UUID format
  const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!UUID_REGEX.test(auditId)) {
    return createJsonResponse(
      { error: "Invalid audit ID format" },
      400
    );
  }

  try {
    console.log(`🔍 Fetching audit from Supabase: ${auditId}`);

    const { data: audit, error } = await supabase
      .from("audits")
      .select("*")
      .eq("id", auditId)
      .single();

    if (error) {
      console.error("❌ Supabase error:", error);
      if (error.code === "PGRST116") {
        return createJsonResponse({ error: "Audit not found" }, 404);
      }
      return createJsonResponse({ error: "Database error" }, 500);
    }

    if (!audit) {
      return createJsonResponse({ error: "Audit not found" }, 404);
    }

    console.log(`✅ Audit found: ${audit.id}, status: ${audit.status}`);
    return createJsonResponse(audit);
  } catch (err) {
    console.error("🔥 Error in audit fetch API:", err);
    return createJsonResponse(
      {
        error: "Internal server error",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      500
    );
  }
}
