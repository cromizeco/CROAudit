"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  Search,
  Zap,
  Monitor,
  Smartphone,
  BarChart3,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Clock,
  TrendingUp,
  Eye,
} from "lucide-react"

interface RecentAudit {
  id: string
  url: string
  status: string
  created_at: string
  updated_at: string
  findings?: {
    score?: number
  }
}

export default function HomePage() {
  const [url, setUrl] = useState("https://setget.com/")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [healthStatus, setHealthStatus] = useState("")
  const [recentAudits, setRecentAudits] = useState<RecentAudit[]>([])
  const [loadingRecent, setLoadingRecent] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchRecentAudits()
  }, [])

  const fetchRecentAudits = async () => {
    try {
      const response = await fetch("/api/audits/recent")
      if (response.ok) {
        const data = await response.json()
        setRecentAudits(data.audits || [])
      }
    } catch (error) {
      console.error("Failed to fetch recent audits:", error)
    } finally {
      setLoadingRecent(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setError("")

    // Validate URL
    let validUrl = url.trim()
    if (!validUrl.startsWith("http://") && !validUrl.startsWith("https://")) {
      validUrl = `https://${validUrl}`
    }

    try {
      new URL(validUrl)
    } catch {
      setError("Please enter a valid URL")
      return
    }

    setIsLoading(true)

    try {
      console.log("Making request to /api/audit with URL:", validUrl)

      const response = await fetch("/api/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ url: validUrl }),
      })

      const responseText = await response.text()
      console.log("Response:", responseText.substring(0, 500))

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`)
      }

      if (response.ok) {
        console.log("Audit created successfully:", data.auditId)
        router.push(`/audit/${data.auditId}`)
      } else {
        throw new Error(data.error || `Server error: ${response.status}`)
      }
    } catch (error) {
      console.error("Request failed:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      setError(`Failed to start audit: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testHealthCheck = async () => {
    try {
      setHealthStatus("checking")
      const response = await fetch("/api/health")
      const text = await response.text()
      const data = JSON.parse(text)

      if (data.status === "healthy") {
        setHealthStatus("healthy")
        setTimeout(() => setHealthStatus(""), 3000)
      } else {
        setHealthStatus("error")
        setTimeout(() => setHealthStatus(""), 3000)
      }
    } catch (error) {
      console.error("Health check failed:", error)
      setHealthStatus("error")
      setTimeout(() => setHealthStatus(""), 3000)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-400 border-green-500/20"
      case "pending":
        return "bg-[rgb(252,178,25)]/10 text-[rgb(252,178,25)] border-[rgb(252,178,25)]/20"
      case "failed":
        return "bg-red-500/10 text-red-400 border-red-500/20"
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 glass-effect sticky top-0 z-50">
        <div className="container mx-auto mobile-padding py-4 md:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-[rgb(252,178,25)] to-[rgb(252,178,25)]/80 flex items-center justify-center glow-effect">
                <Zap className="h-5 w-5 md:h-6 md:w-6 text-black" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold gradient-text font-poppins">Cromize</h1>
            </div>
            <Button
              onClick={testHealthCheck}
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10 bg-transparent text-xs md:text-sm"
              disabled={healthStatus === "checking"}
            >
              {healthStatus === "checking" ? (
                <>
                  <Loader2 className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />
                  <span className="hidden md:inline">Checking...</span>
                </>
              ) : healthStatus === "healthy" ? (
                <>
                  <CheckCircle className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4 text-green-400" />
                  <span className="hidden md:inline">Healthy</span>
                </>
              ) : healthStatus === "error" ? (
                <>
                  <AlertCircle className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4 text-red-400" />
                  <span className="hidden md:inline">Error</span>
                </>
              ) : (
                <>
                  <span className="md:hidden">Health</span>
                  <span className="hidden md:inline">Test Health</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto mobile-padding py-12 md:py-20">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8 md:mb-12">
            <div className="inline-flex items-center px-3 md:px-4 py-2 rounded-full bg-[rgb(252,178,25)]/10 border border-[rgb(252,178,25)]/20 mb-4 md:mb-6">
              <TrendingUp className="mr-2 h-4 w-4 text-[rgb(252,178,25)]" />
              <span className="text-[rgb(252,178,25)] text-xs md:text-sm font-medium">AI-Powered UX Analysis</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold mb-4 md:mb-6 gradient-text leading-tight font-poppins">
              Visual UI/UX
              <br />
              <span className="text-[rgb(252,178,25)]">Audit Tool</span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-400 mb-8 md:mb-12 max-w-4xl mx-auto leading-relaxed">
              Get comprehensive AI-powered insights on your website's user experience with real screenshots, detailed
              analysis, and actionable recommendations.
            </p>
          </div>

          {/* Audit Form */}
          <Card className="glass-effect max-w-2xl mx-auto mb-12 md:mb-16">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center justify-center space-x-2 text-lg md:text-xl font-poppins">
                <Search className="h-5 w-5 text-[rgb(252,178,25)]" />
                <span>Enter Website URL to Audit</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="https://setget.com/"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="bg-black/50 border-white/20 text-white placeholder-gray-500 text-base md:text-lg py-4 md:py-6 px-4 md:px-6 rounded-xl focus:border-[rgb(252,178,25)] focus:ring-[rgb(252,178,25)]/20"
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <div className="flex items-start space-x-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3 md:p-4">
                    <AlertCircle className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm md:text-base">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || !url.trim()}
                  className="w-full bg-[rgb(252,178,25)] hover:bg-[rgb(252,178,25)]/90 text-black font-semibold py-4 md:py-6 text-base md:text-lg rounded-xl transition-all duration-200 glow-effect"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />
                      <span className="hidden md:inline">Analyzing Website...</span>
                      <span className="md:hidden">Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <BarChart3 className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                      <span className="hidden md:inline">Run Complete Audit</span>
                      <span className="md:hidden">Run Audit</span>
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Recent Audits Section */}
          {!loadingRecent && recentAudits.length > 0 && (
            <div className="mb-12 md:mb-16">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 gradient-text font-poppins">Recent Audits</h2>
              <div className="grid gap-4 md:gap-6 max-w-4xl mx-auto">
                {recentAudits.slice(0, 3).map((audit) => (
                  <Card
                    key={audit.id}
                    className="glass-effect hover:bg-white/5 transition-all duration-300 cursor-pointer"
                    onClick={() => router.push(`/audit/${audit.id}`)}
                  >
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-3 md:space-y-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <ExternalLink className="h-4 w-4 text-[rgb(252,178,25)] flex-shrink-0" />
                            <p className="text-white font-medium truncate text-sm md:text-base">{audit.url}</p>
                          </div>
                          <div className="flex items-center space-x-4 text-xs md:text-sm text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3 md:h-4 md:w-4" />
                              <span>{new Date(audit.updated_at).toLocaleDateString()}</span>
                            </div>
                            {audit.findings?.score && (
                              <div className="flex items-center space-x-1">
                                <BarChart3 className="h-3 w-3 md:h-4 md:w-4" />
                                <span>{audit.findings.score}/100</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className={getStatusColor(audit.status)}>
                            {audit.status === "completed" ? (
                              <>
                                <CheckCircle className="mr-1 h-3 w-3" />
                                <span className="hidden md:inline">Completed</span>
                                <span className="md:hidden">Done</span>
                              </>
                            ) : audit.status === "pending" ? (
                              <>
                                <Clock className="mr-1 h-3 w-3" />
                                <span className="hidden md:inline">Processing</span>
                                <span className="md:hidden">Pending</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="mr-1 h-3 w-3" />
                                Failed
                              </>
                            )}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[rgb(252,178,25)] hover:bg-[rgb(252,178,25)]/10"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            <span className="hidden md:inline">View</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <Card className="glass-effect hover:bg-white/5 transition-all duration-300 group">
              <CardContent className="p-6 md:p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[rgb(252,178,25)]/10 border border-[rgb(252,178,25)]/20 flex items-center justify-center mx-auto mb-6 group-hover:glow-effect transition-all duration-300">
                  <BarChart3 className="h-8 w-8 text-[rgb(252,178,25)]" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-3 text-white font-poppins">AI-Powered Analysis</h3>
                <p className="text-gray-400 leading-relaxed text-sm md:text-base">
                  Advanced analysis of website UX patterns and identification of improvement opportunities with
                  precision.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect hover:bg-white/5 transition-all duration-300 group">
              <CardContent className="p-6 md:p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[rgb(252,178,25)]/10 border border-[rgb(252,178,25)]/20 flex items-center justify-center mx-auto mb-6 group-hover:glow-effect transition-all duration-300">
                  <Search className="h-8 w-8 text-[rgb(252,178,25)]" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-3 text-white font-poppins">Real Screenshots</h3>
                <p className="text-gray-400 leading-relaxed text-sm md:text-base">
                  Get actual screenshots of your website with detailed annotations highlighting specific issues and
                  improvements.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect hover:bg-white/5 transition-all duration-300 group">
              <CardContent className="p-6 md:p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[rgb(252,178,25)]/10 border border-[rgb(252,178,25)]/20 flex items-center justify-center mx-auto mb-6 group-hover:glow-effect transition-all duration-300">
                  <div className="flex space-x-1">
                    <Monitor className="h-6 w-6 text-[rgb(252,178,25)]" />
                    <Smartphone className="h-6 w-6 text-[rgb(252,178,25)]" />
                  </div>
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-3 text-white font-poppins">Multi-Device Analysis</h3>
                <p className="text-gray-400 leading-relaxed text-sm md:text-base">
                  Comprehensive analysis across desktop and mobile viewports to ensure optimal user experience
                  everywhere.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
