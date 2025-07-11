// Test script to verify the audit functionality
async function testAudit() {
  const testUrl = "https://setget.com/"

  console.log("🧪 Testing Cromize Audit System")
  console.log("================================")

  try {
    // Test audit creation
    console.log("1. Creating audit for:", testUrl)
    const response = await fetch("http://localhost:3000/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: testUrl }),
    })

    const data = await response.json()
    console.log("✅ Audit created:", data.auditId)

    // Poll for completion
    console.log("2. Waiting for audit completion...")
    let attempts = 0
    const maxAttempts = 30 // 5 minutes max

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 10000)) // Wait 10 seconds

      const statusResponse = await fetch(`http://localhost:3000/api/audit/${data.auditId}`)
      const statusData = await statusResponse.json()

      console.log(`   Status: ${statusData.status} (attempt ${attempts + 1}/${maxAttempts})`)

      if (statusData.status === "completed") {
        console.log("✅ Audit completed successfully!")
        console.log("📊 Results:")
        console.log("   - Desktop screenshot:", statusData.desktop_screenshot ? "✅" : "❌")
        console.log("   - Mobile screenshot:", statusData.mobile_screenshot ? "✅" : "❌")
        console.log("   - AI findings:", statusData.findings ? "✅" : "❌")

        if (statusData.findings) {
          console.log("   - UX Score:", statusData.findings.score || "N/A")
          console.log("   - Issues found:", statusData.findings.issues?.length || 0)
          console.log("   - Summary:", statusData.findings.summary?.slice(0, 100) + "...")
        }

        return statusData
      } else if (statusData.status === "failed") {
        console.log("❌ Audit failed")
        return null
      }

      attempts++
    }

    console.log("⏰ Audit timed out")
    return null
  } catch (error) {
    console.error("❌ Test failed:", error)
    return null
  }
}

// Run the test
testAudit()
