import { NextResponse } from "next/server"

// Ensure all responses are JSON
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
  console.log("=== HEALTH CHECK ===")

  try {
    const checks = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      node_version: process.version,
      uptime_seconds: Math.floor(process.uptime()),
      memory_usage: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    }

    console.log("Health check passed:", checks)
    return createJsonResponse(checks)
  } catch (error) {
    console.error("=== HEALTH CHECK ERROR ===")
    console.error("Error:", error)

    return createJsonResponse(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      500,
    )
  }
}
