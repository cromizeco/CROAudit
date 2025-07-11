// Debug test script to check API endpoints
async function debugTest() {
  console.log("🔍 Cromize Debug Test")
  console.log("====================")

  try {
    // Test health endpoint
    console.log("1. Testing health endpoint...")
    const healthResponse = await fetch("http://localhost:3000/api/health")
    const healthData = await healthResponse.json()
    console.log("Health check:", healthData)

    if (healthData.status !== "healthy") {
      console.log("❌ Environment variables missing:")
      Object.entries(healthData.checks).forEach(([key, value]) => {
        console.log(`   ${key}: ${value ? "✅" : "❌"}`)
      })
      return
    }

    // Test audit creation with a simple URL
    console.log("\n2. Testing audit creation...")
    const testUrl = "https://example.com"

    const auditResponse = await fetch("http://localhost:3000/api/audit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ url: testUrl }),
    })

    console.log("Response status:", auditResponse.status)
    console.log("Response headers:", Object.fromEntries(auditResponse.headers.entries()))

    const responseText = await auditResponse.text()
    console.log("Raw response:", responseText.slice(0, 200))

    try {
      const auditData = JSON.parse(responseText)
      console.log("✅ Audit created:", auditData)

      if (auditData.auditId) {
        console.log("\n3. Testing audit fetch...")
        const fetchResponse = await fetch(`http://localhost:3000/api/audit/${auditData.auditId}`)
        const fetchData = await fetchResponse.json()
        console.log("✅ Audit fetched:", { id: fetchData.id, status: fetchData.status })
      }
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError)
      console.log("Response was not valid JSON")
    }
  } catch (error) {
    console.error("❌ Debug test failed:", error)
  }
}

// Run the debug test
debugTest()
