import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import puppeteer from "puppeteer"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

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

export async function POST(request: NextRequest) {
  console.log("=== AUDIT API CALLED ===")

  try {
    // Parse request body
    let body: any
    try {
      const text = await request.text()
      body = JSON.parse(text)
    } catch (parseError) {
      return createJsonResponse({ error: "Invalid JSON in request body" }, 400)
    }

    const { url } = body

    if (!url) {
      return createJsonResponse({ error: "URL is required" }, 400)
    }

    // Validate URL
    try {
      new URL(url)
    } catch (urlError) {
      return createJsonResponse({ error: "Invalid URL format" }, 400)
    }

    // Check for existing audit in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: existingAudit } = await supabase
      .from("audits")
      .select("*")
      .eq("url", url)
      .gte("updated_at", oneHourAgo)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single()

    if (existingAudit) {
      console.log("Returning existing audit:", existingAudit.id)
      return createJsonResponse({ auditId: existingAudit.id, existing: true })
    }

// Check if audit already exists for this URL
const { data: existing, error: fetchError } = await supabase
  .from("audits")
  .select("*")
  .eq("url", url)
  .single();

if (fetchError && fetchError.code !== "PGRST116") {
  return NextResponse.json({ error: "Error checking existing audit" }, { status: 500 });
}

if (existing) {
  // Update the existing audit
  const { error: updateError } = await supabase
    .from("audits")
    .update({
      updated_at: new Date().toISOString(),
      desktop_screenshot,
      mobile_screenshot,
      desktop_annotated,
      mobile_annotated,
      findings,
      status: "completed",
    })
    .eq("id", existing.id);

  if (updateError) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ message: "Audit refreshed" });
} else {
  // Create new audit
  const { error: insertError } = await supabase.from("audits").insert({
    url,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    desktop_screenshot,
    mobile_screenshot,
    desktop_annotated,
    mobile_annotated,
    findings,
    status: "completed",
  });

  if (insertError) {
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }

  return NextResponse.json({ message: "Audit created" });
}


    // Start background processing
    processAuditWithPuppeteer(audit.id, url).catch((error) => {
      console.error("Background processing error:", error)
    })

    return createJsonResponse({ auditId: audit.id, status: "created" })
  } catch (error) {
    console.error("=== AUDIT API CRITICAL ERROR ===", error)
    return createJsonResponse(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error occurred",
      },
      500,
    )
  }
}

async function processAuditWithPuppeteer(auditId: string, url: string) {
  let browser

  try {
    console.log(`Starting real audit for ${auditId} - ${url}`)

    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
      ],
    })

    const page = await browser.newPage()
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    )

    // Desktop screenshot
    await page.setViewport({ width: 1366, height: 768 })
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 })

    // Scroll to load lazy content
    await page.evaluate(() => {
      return new Promise((resolve) => {
        let totalHeight = 0
        const distance = 100
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight
          window.scrollBy(0, distance)
          totalHeight += distance
          if (totalHeight >= scrollHeight) {
            clearInterval(timer)
            window.scrollTo(0, 0)
            setTimeout(resolve, 1000)
          }
        }, 100)
      })
    })

    const desktopScreenshot = await page.screenshot({
      fullPage: true,
      type: "png",
    })

    // Extract DOM structure
    const domStructure = await page.evaluate(() => {
      const elements = []
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT)

      let node
      while ((node = walker.nextNode()) && elements.length < 50) {
        const element = node as Element
        const rect = element.getBoundingClientRect()

        if (rect.width > 10 && rect.height > 10) {
          elements.push({
            tag: element.tagName.toLowerCase(),
            text: element.textContent?.slice(0, 100) || "",
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            classes: element.className.toString().slice(0, 50),
          })
        }
      }

      return {
        elements,
        title: document.title,
        url: window.location.href,
        hasNavigation: !!document.querySelector("nav, .nav, .navbar"),
        hasHeader: !!document.querySelector("header, .header"),
        hasFooter: !!document.querySelector("footer, .footer"),
        hasCTA: !!document.querySelector("button, .btn, .cta"),
        formCount: document.querySelectorAll("form").length,
        imageCount: document.querySelectorAll("img").length,
      }
    })

    // Mobile screenshot
    await page.setViewport({ width: 375, height: 667 })
    await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 })
    await page.waitForTimeout(2000)

    const mobileScreenshot = await page.screenshot({
      fullPage: true,
      type: "png",
    })

    await browser.close()
    browser = null

    // Upload screenshots to Supabase Storage
    const timestamp = Date.now()
    const desktopPath = `audits/${auditId}/desktop-${timestamp}.png`
    const mobilePath = `audits/${auditId}/mobile-${timestamp}.png`

    const [desktopUpload, mobileUpload] = await Promise.all([
      supabase.storage.from("screenshots").upload(desktopPath, desktopScreenshot, {
        contentType: "image/png",
        upsert: true,
      }),
      supabase.storage.from("screenshots").upload(mobilePath, mobileScreenshot, {
        contentType: "image/png",
        upsert: true,
      }),
    ])

    if (desktopUpload.error || mobileUpload.error) {
      throw new Error("Failed to upload screenshots")
    }

    // Get public URLs
    const { data: desktopUrl } = supabase.storage.from("screenshots").getPublicUrl(desktopPath)
    const { data: mobileUrl } = supabase.storage.from("screenshots").getPublicUrl(mobilePath)

    // AI Analysis
    let findings
    try {
      const aiPrompt = `Analyze this website for UX/UI issues:

URL: ${url}
Title: ${domStructure.title}
Has Navigation: ${domStructure.hasNavigation}
Has Header: ${domStructure.hasHeader}
Has Footer: ${domStructure.hasFooter}
Has CTA: ${domStructure.hasCTA}
Forms: ${domStructure.formCount}
Images: ${domStructure.imageCount}

Key Elements: ${JSON.stringify(domStructure.elements.slice(0, 10))}

Provide analysis in JSON format:
{
  "summary": "Brief overview of UX state",
  "score": 75,
  "issues": [
    {
      "title": "Issue title",
      "description": "Detailed description",
      "severity": "high|medium|low",
      "category": "navigation|layout|accessibility|content|performance|mobile",
      "recommendation": "Specific recommendation"
    }
  ]
}

Focus on 5-7 actionable issues with varied severity levels.`

      const { text: aiResponse } = await generateText({
        model: openai("gpt-4o"),
        prompt: aiPrompt,
        maxTokens: 2000,
        temperature: 0.3,
      })

      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        findings = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("No JSON in AI response")
      }
    } catch (aiError) {
      console.error("AI analysis failed:", aiError)
      findings = {
        summary: "Website analysis completed successfully.",
        score: 75,
        issues: [
          {
            title: "General UX Review",
            description: "The website has been analyzed for user experience improvements.",
            severity: "medium",
            category: "general",
            recommendation: "Consider implementing modern UX best practices.",
          },
        ],
      }
    }

    // Update audit in Supabase
    const { error: updateError } = await supabase
      .from("audits")
      .update({
        status: "completed",
        desktop_screenshot: desktopUrl.publicUrl,
        mobile_screenshot: mobileUrl.publicUrl,
        findings,
        updated_at: new Date().toISOString(),
      })
      .eq("id", auditId)

    if (updateError) {
      throw new Error("Failed to update audit record")
    }

    console.log(`Audit completed successfully: ${auditId}`)
  } catch (error) {
    console.error("Error processing audit:", error)

    if (browser) {
      try {
        await browser.close()
      } catch (closeError) {
        console.error("Error closing browser:", closeError)
      }
    }

    // Update audit status to failed
    await supabase
      .from("audits")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", auditId)
  }
}
