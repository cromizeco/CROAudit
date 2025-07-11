import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import puppeteer from "puppeteer-core"
import chromium from "@sparticuz/chromium"

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

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    })

    const page = await browser.newPage()
    await page.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/114 Safari/537.36")

    // Desktop Screenshot
    console.log("🌐 Navigating (Desktop):", url)
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 })
    if (!response || !response.ok()) throw new Error("Failed to load desktop version")
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1500)
    const desktopScreenshot = await page.screenshot({ fullPage: true, type: "jpeg", quality: 80 })

    // Mobile Screenshot
    await page.setViewport({ width: 375, height: 812 })
    await page.reload({ waitUntil: "domcontentloaded" })
    await page.waitForTimeout(1500)
    const mobileScreenshot = await page.screenshot({ fullPage: true, type: "jpeg", quality: 80 })
    await browser.close()

    // Upload to Supabase
    const timestamp = Date.now()
    const desktopPath = `screenshot-desktop-${timestamp}.jpg`
    const mobilePath = `screenshot-mobile-${timestamp}.jpg`

    const uploadImage = async (path: string, buffer: Buffer) => {
      const { error } = await supabase.storage.from("audits").upload(path, buffer, {
        contentType: "image/jpeg",
        upsert: true,
      })
      if (error) throw error
      return supabase.storage.from("audits").getPublicUrl(path).data.publicUrl
    }

    const desktopUrl = await uploadImage(desktopPath, desktopScreenshot)
    const mobileUrl = await uploadImage(mobilePath, mobileScreenshot)

    // Send to GPT-4 Vision (using desktop only for now)
    const { text: summary } = await generateText({
      model: openai.chat("gpt-4-vision-preview"),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Audit this page for UI/UX, CTA placement, spacing, contrast, speed, etc." },
            { type: "image_url", image_url: { url: desktopUrl } },
          ],
        },
      ],
    })

    const findings = {
      summary,
      issues: [], // optional structured issue list (future enhancement)
    }

    const { data: existing } = await supabase
      .from("audits")
      .select("*")
      .eq("url", url)
      .single()

    if (existing) {
      const { error } = await supabase
        .from("audits")
        .update({
          updated_at: new Date().toISOString(),
          desktop_screenshot: desktopUrl,
          mobile_screenshot: mobileUrl,
          findings,
          status: "completed",
        })
        .eq("id", existing.id)

      if (error) throw error
      return createJsonResponse({ message: "Audit refreshed", auditId: existing.id })
    }

    const { data: inserted, error } = await supabase
      .from("audits")
      .insert({
        url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        desktop_screenshot: desktopUrl,
        mobile_screenshot: mobileUrl,
        findings,
        status: "completed",
      })
      .select()
      .single()

    if (error) throw error

    return createJsonResponse({ message: "Audit created", auditId: inserted.id })
  } catch (err: any) {
    console.error("🔥 Audit failed:", err)
    return createJsonResponse({
      error: "Audit failed unexpectedly",
      details: err.message || err.toString(),
    }, 500)
  }
}
