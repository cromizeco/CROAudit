// Test script specifically for setget.com
async function testSetGet() {
  console.log("🧪 Testing Cromize with SetGet.com")
  console.log("==================================")

  try {
    // Test health endpoint first
    console.log("1. Testing health endpoint...")
    const healthResponse = await fetch("http://localhost:3000/api/health")
    const healthText = await healthResponse.text()

    console.log("Health status:", healthResponse.status)
    console.log("Health content-type:", healthResponse.headers.get("content-type"))

    if (healthResponse.ok) {
      const healthData = JSON.parse(healthText)
      console.log("✅ Health check passed:", healthData.status)
    } else {
      console.log("❌ Health check failed")
      return
    }

    // Test audit creation with setget.com
    console.log("\n2. Testing audit creation with setget.com...")
    const testUrl = "https://setget.com/"

    const auditResponse = await fetch("http://localhost:3000/api/audit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ url: testUrl }),
    })

    const auditText = await auditResponse.text()
    console.log("Audit status:", auditResponse.status)
    console.log("Audit content-type:", auditResponse.headers.get("content-type"))
    console.log("Audit response:", auditText.substring(0, 200))

    if (auditResponse.ok) {
      const auditData = JSON.parse(auditText)
      console.log("✅ Audit created:", auditData.auditId)

      // Test audit fetch immediately
      console.log("\n3. Testing immediate audit fetch...")
      const fetchResponse = await fetch(`http://localhost:3000/api/audit/${auditData.auditId}`)
      const fetchText = await fetchResponse.text()

      console.log("Fetch status:", fetchResponse.status)
      console.log("Fetch content-type:", fetchResponse.headers.get("content-type"))

      if (fetchResponse.ok) {
        const fetchData = JSON.parse(fetchText)
        console.log("✅ Audit fetched:", { id: fetchData.id, status: fetchData.status })

        // Wait for processing to complete
        console.log("\n4. Waiting for processing to complete...")
        let attempts = 0
        const maxAttempts = 10

        while (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 1000))

          const statusResponse = await fetch(`http://localhost:3000/api/audit/${auditData.auditId}`)
          const statusData = await statusResponse.json()

          console.log(`   Attempt ${attempts + 1}: Status = ${statusData.status}`)

          if (statusData.status === "completed") {
            console.log("🎉 SetGet.com audit completed successfully!")
            console.log("   - UX Score:", statusData.findings?.score)
            console.log("   - Issues found:", statusData.findings?.issues?.length)
            console.log("   - Summary:", statusData.findings?.summary?.substring(0, 100) + "...")

            if (statusData.findings?.issues) {
              console.log("\n   Top Issues:")
              statusData.findings.issues.slice(0, 3).forEach((issue, i) => {
                console.log(`   ${i + 1}. ${issue.title} (${issue.severity})`)
              })
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
      } else {
        console.log("❌ Audit fetch failed")
      }
    } else {
      console.log("❌ Audit creation failed")
      console.log("Error response:", auditText)
    }
  } catch (error) {
    console.error("❌ Test failed:", error)
    return null
  }
}

// Run the test
testSetGet()
