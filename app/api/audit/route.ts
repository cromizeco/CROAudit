
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import puppeteer from "puppeteer"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function createJsonResponse(data: any, status = 200) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
  })
}

export async function POST(request: NextRequest) {
  console.log("=== AUDIT API CALLED ===")

  try {
    const text = await request.text()
    const body = JSON.parse(text)
    const { url } = body

    if (!url) return createJsonResponse({ error: "URL is required" }, 400)

    try {
      new URL(url)
    } catch {
      return createJsonResponse({ error: "Invalid URL format" }, 400)
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: recentAudit } = await supabase
      .from("audits")
      .select("*")
      .eq("url", url)
      .gte("updated_at", oneHourAgo)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single()

    if (recentAudit) {
      console.log("Using cached audit result:", recentAudit.id)
      return createJsonResponse({ auditId: recentAudit.id })
    }

    console.log("🚀 Launching Puppeteer...")
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    })
    const page = await browser.newPage()

    await page.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/114 Safari/537.36")

    console.log("🌐 Navigating to page:", url)
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 })
    if (!response || !response.ok()) {
      await browser.close()
      throw new Error("Page failed to load or returned error status")
    }

    // Scroll to bottom to lazy-load content
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1500)

    console.log("📸 Taking screenshot...")
    const screenshotBuffer = await page.screenshot({ fullPage: true, type: "jpeg", quality: 80 })
    await browser.close()
    console.log("✅ Screenshot captured")

    // NOTE: Replace this with your GPT-4 Vision API logic
    console.log("🧠 Sending to GPT-4 Vision (mocked)...")
    const findings = {
      summary: "Sample AI feedback: Your CTA is below the fold. Move it up for higher conversions.",
      issues: [
        { element: "button", suggestion: "Place it higher", severity: "high" }
      ]
    }

    // Save screenshot to Supabase Storage (optional)
    const fileName = `screenshot-${Date.now()}.jpg`
    const { data: storageUpload, error: uploadError } = await supabase.storage
      .from("audits")
      .upload(fileName, screenshotBuffer, {
        contentType: "image/jpeg",
        upsert: true,
      })

    if (uploadError) {
      console.error("❌ Supabase upload error:", uploadError)
      return createJsonResponse({ error: "Failed to upload screenshot" }, 500)
    }

    const publicUrl = supabase.storage.from("audits").getPublicUrl(fileName).data.publicUrl

    const existing = await supabase
      .from("audits")
      .select("*")
      .eq("url", url)
      .single()

    if (existing.data) {
      const { error: updateError } = await supabase
        .from("audits")
        .update({
          updated_at: new Date().toISOString(),
          desktop_screenshot: publicUrl,
          findings,
          status: "completed",
        })
        .eq("id", existing.data.id)

      if (updateError) {
        console.error("❌ Update failed:", updateError)
        return createJsonResponse({ error: "Failed to update audit" }, 500)
      }

      return createJsonResponse({ message: "Audit refreshed", auditId: existing.data.id })
    } else {
      const { data: insertData, error: insertError } = await supabase.from("audits").insert({
        url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        desktop_screenshot: publicUrl,
        findings,
        status: "completed",
      }).select().single()

      if (insertError) {
        console.error("❌ Insert failed:", insertError)
        return createJsonResponse({ error: "Failed to save audit" }, 500)
      }

      return createJsonResponse({ message: "Audit created", auditId: insertData.id })
    }
  } catch (error: any) {
    console.error("🔥 Audit failed:", error)
    return createJsonResponse({
      error: "Audit failed unexpectedly",
      details: error.message || error.toString(),
    }, 500)
  }
}
