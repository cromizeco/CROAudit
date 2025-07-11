// Complete test for the full Cromize flow
async function testCompleteFlow() {
  console.log("🚀 Complete Cromize Flow Test")
  console.log("=============================")

  try {
    // Test 1: Health Check
    console.log("1. Testing health endpoint...")
    const healthResponse = await fetch("http://localhost:3000/api/health")
    const healthData = await healthResponse.json()

    if (healthData.status === "healthy") {
      console.log("✅ Health check passed")
    } else {
      console.log("❌ Health check failed")
    }
  } catch (error) {
    console.error("Error during health check:", error)
  }
}
