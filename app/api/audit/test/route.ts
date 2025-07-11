import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    id: "test",
    status: "completed",
    url: "https://example.com",
    findings: {
      summary: "Test data",
      issues: [],
    },
  });
}
