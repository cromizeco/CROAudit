import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

function createJsonResponse(data: any, status = 200) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
  })
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log(`Fetching audit from Supabase: ${params.id}`)

    const { data: audit, error } = await supabase.from("audits").select("*").eq("id", params.id).single()

    if (error) {
      console.error("Supabase error:", error)
      if (error.code === "PGRST116") {
        return createJsonResponse({ error: "Audit not found" }, 404)
      }
      return createJsonResponse({ error: "Database error" }, 500)
    }

    if (!audit) {
      return createJsonResponse({ error: "Audit not found" }, 404)
    }

    console.log(`Audit found: ${audit.id}, status: ${audit.status}`)
    return createJsonResponse(audit)
  } catch (error) {
    console.error("Error in audit fetch API:", error)
    return createJsonResponse(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    )
  }
}
