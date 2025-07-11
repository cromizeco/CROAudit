import { NextResponse } from "next/server"
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

export async function GET() {
  try {
    const { data: audits, error } = await supabase
      .from("audits")
      .select("id, url, status, created_at, updated_at, findings")
      .order("updated_at", { ascending: false })
      .limit(10)

    if (error) {
      console.error("Error fetching recent audits:", error)
      return createJsonResponse({ error: "Failed to fetch recent audits" }, 500)
    }

    return createJsonResponse({ audits: audits || [] })
  } catch (error) {
    console.error("Error in recent audits API:", error)
    return createJsonResponse({ error: "Internal server error" }, 500)
  }
}
