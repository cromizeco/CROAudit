// Simple test to verify the basic functionality
async function simpleTest() {
  console.log("🧪 Simple Cromize Test")
  console.log("======================")

  try {
    // Test health endpoint
    console.log("1. Testing health endpoint...")
    const healthResponse = await fetch("http://localhost:3000/api/health")
    const healthText = await healthResponse.text()

    console.log("Health response status:", healthResponse.status)
    console.log("Health response:", healthText.substring(0, 200))

    if (healthResponse.ok) {
      const healthData = JSON.parse(healthText)
      console.log("✅ Health check passed:", healthData.status)
    } else {
      console.log("❌ Health check failed")
      return
    }

    // Test audit creation
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

    const auditText = await auditResponse.text()
    console.log("Audit response status:", auditResponse.status)
    console.log("Audit response:", auditText.substring(0, 200))

    if (auditResponse.ok) {
      const auditData = JSON.parse(auditText)
      console.log("✅ Audit created:", auditData.auditId)

      // Test audit fetch
      console.log("\n3. Testing audit fetch...")
      const fetchResponse = await fetch(`http://localhost:3000/api/audit/${auditData.auditId}`)
      const fetchText = await fetchResponse.text()

      console.log("Fetch response status:", fetchResponse.status)

      if (fetchResponse.ok) {
        const fetchData = JSON.parse(fetchText)
        console.log("✅ Audit fetched:", { id: fetchData.id, status: fetchData.status })

        // Wait and check again
        console.log("\n4. Waiting 6 seconds and checking status...")
        await new Promise((resolve) => setTimeout(resolve, 6000))

        const finalResponse = await fetch(`http://localhost:3000/api/audit/${auditData.auditId}`)
        const finalData = await finalResponse.json()
        console.log("✅ Final status:", finalData.status)

        if (finalData.status === "completed") {
          console.log("🎉 Test completed successfully!")
          console.log("   - Score:", finalData.findings?.score)
          console.log("   - Issues found:", finalData.findings?.issues?.length)
        }
      } else {
        console.log("❌ Audit fetch failed")
      }
    } else {
      console.log("❌ Audit creation failed")
    }
  } catch (error) {
    console.error("❌ Test failed:", error)
  }
}

// Run the test
simpleTest()
