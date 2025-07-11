import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    id: "test",
    status: "completed",
    url: "https://www.setget.com/",
    findings: {
      summary: "Test data",
      issues: [],
    },
  });
}
