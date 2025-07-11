"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Loader2,
  ArrowLeft,
  RefreshCw,
  Monitor,
  Smartphone,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  Phone,
  Rocket,
  Plus,
} from "lucide-react"
import Image from "next/image"

interface AuditData {
  id: string
  url: string
  status: string
  created_at: string
  updated_at: string
  desktop_screenshot?: string
  mobile_screenshot?: string
  findings?: {
    issues: Array<{
      title: string
      description: string
      severity: "low" | "medium" | "high"
      category: string
      recommendation?: string
    }>
    summary: string
    score?: number
  }
}

export default function AuditResultPage({ params }: { params: { id: string } }) {
  const [audit, setAudit] = useState<AuditData | null>(null)
  const [loading, setLoading] = useState(true)
  const [reauditLoading, setReauditLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState("")
  const router = useRouter()

  const fetchAudit = async () => {
    try {
      const response = await fetch(`/api/audit/${params.id}`)
      const responseText = await response.text()

      if (!response.headers.get("content-type")?.includes("application/json")) {
        throw new Error(`Server returned non-JSON response: ${responseText.substring(0, 100)}`)
      }

      const data = JSON.parse(responseText)

      if (response.ok) {
        setAudit(data)
        if (data.status === "pending") {
          setProgress(Math.min(progress + 15, 90))
        } else if (data.status === "completed") {
          setProgress(100)
        }
        setError("")
      } else {
        throw new Error(data.error || `Server error: ${response.status}`)
      }
    } catch (error) {
      console.error("Error fetching audit:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setError(`Failed to fetch audit: ${errorMessage}`)
    } finally {
      if (loading) {
        setLoading(false)
      }
    }
  }

  const handleReaudit = async () => {
    if (!audit) return

    setReauditLoading(true)
    setError("")

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ url: audit.url }),
      })

      const responseText = await response.text()
      const data = JSON.parse(responseText)

      if (response.ok) {
        router.push(`/audit/${data.auditId}`)
      } else {
        throw new Error(data.error || `Server error: ${response.status}`)
      }
    } catch (error) {
      console.error("Re-audit error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setError(`Failed to start re-audit: ${errorMessage}`)
    } finally {
      setReauditLoading(false)
    }
  }

  const handleNewAudit = () => {
    router.push("/")
  }

  const handleBookCall = () => {
    window.open("https://calendly.com/cromize/consultation", "_blank")
  }

  const handleGetStarted = () => {
    window.open("mailto:hello@cromize.com?subject=Landing Page Design Improvement", "_blank")
  }

  useEffect(() => {
    fetchAudit()

    const interval = setInterval(() => {
      if (audit?.status === "pending") {
        fetchAudit()
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [params.id, audit?.status])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[rgb(252,178,25)]/10 border border-[rgb(252,178,25)]/20 flex items-center justify-center mx-auto mb-6 glow-effect">
            <Loader2 className="h-8 w-8 animate-spin text-[rgb(252,178,25)]" />
          </div>
          <p className="text-xl text-gray-300">Loading audit results...</p>
        </div>
      </div>
    )
  }

  if (error && !audit) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center mobile-padding">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-6" />
          <p className="text-xl mb-4 text-gray-300">Error Loading Audit</p>
          <p className="text-sm text-gray-400 mb-6">{error}</p>
          <div className="space-x-4">
            <Button
              onClick={() => router.push("/")}
              className="bg-[rgb(252,178,25)] hover:bg-[rgb(252,178,25)]/90 text-black"
            >
              Back to Home
            </Button>
            <Button
              onClick={fetchAudit}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 bg-transparent"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!audit) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-6" />
          <p className="text-xl mb-6 text-gray-300">Audit not found</p>
          <Button
            onClick={() => router.push("/")}
            className="bg-[rgb(252,178,25)] hover:bg-[rgb(252,178,25)]/90 text-black"
          >
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-500/10 text-red-400 border-red-500/20"
      case "medium":
        return "bg-[rgb(252,178,25)]/10 text-[rgb(252,178,25)] border-[rgb(252,178,25)]/20"
      case "low":
        return "bg-green-500/10 text-green-400 border-green-500/20"
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 glass-effect sticky top-0 z-50">
        <div className="container mx-auto mobile-padding py-4 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="text-white hover:text-[rgb(252,178,25)] hover:bg-white/5 self-start"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                className={
                  audit.status === "completed"
                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                    : audit.status === "failed"
                      ? "bg-red-500/10 text-red-400 border-red-500/20"
                      : "bg-[rgb(252,178,25)]/10 text-[rgb(252,178,25)] border-[rgb(252,178,25)]/20"
                }
              >
                {audit.status === "completed" ? (
                  <>
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Completed
                  </>
                ) : audit.status === "failed" ? (
                  <>
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Failed
                  </>
                ) : (
                  <>
                    <Clock className="mr-1 h-3 w-3" />
                    Processing
                  </>
                )}
              </Badge>
              <Button
                onClick={handleNewAudit}
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden md:inline">New Audit</span>
                <span className="md:hidden">New</span>
              </Button>
              <Button
                onClick={handleReaudit}
                disabled={reauditLoading}
                className="bg-[rgb(252,178,25)] hover:bg-[rgb(252,178,25)]/90 text-black"
                size="sm"
              >
                {reauditLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="hidden md:inline">Re-auditing...</span>
                    <span className="md:hidden">Loading...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    <span className="hidden md:inline">Re-audit</span>
                    <span className="md:hidden">Refresh</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto mobile-padding py-6 md:py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6">
            <div className="flex items-center space-x-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-4">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* URL Info */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 space-y-3 md:space-y-0">
            <h1 className="text-3xl md:text-4xl font-bold gradient-text font-poppins">Audit Results</h1>
            {audit.findings?.score && (
              <div className="flex items-center space-x-2">
                <span className="text-2xl md:text-3xl font-bold text-[rgb(252,178,25)]">
                  {audit.findings.score}/100
                </span>
                <span className="text-gray-400">UX Score</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3 text-gray-400 mb-2">
            <ExternalLink className="h-4 w-4 flex-shrink-0" />
            <a
              href={audit.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[rgb(252,178,25)] transition-colors break-all text-sm md:text-base"
            >
              {audit.url}
            </a>
          </div>
          <p className="text-xs md:text-sm text-gray-500">Audited on {new Date(audit.created_at).toLocaleString()}</p>
        </div>

        {audit.status === "pending" ? (
          <div className="text-center py-16 md:py-20">
            <div className="w-20 h-20 rounded-3xl bg-[rgb(252,178,25)]/10 border border-[rgb(252,178,25)]/20 flex items-center justify-center mx-auto mb-6 glow-effect">
              <Loader2 className="h-10 w-10 animate-spin text-[rgb(252,178,25)]" />
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-white font-poppins">Analyzing Your Website</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto text-sm md:text-base">
              Our AI is capturing real screenshots, analyzing DOM structure, and generating comprehensive UX insights...
            </p>
            <div className="max-w-md mx-auto">
              <Progress value={progress} className="h-2 bg-gray-800" />
              <p className="text-sm text-gray-500 mt-2">{progress}% Complete</p>
            </div>
          </div>
        ) : audit.status === "failed" ? (
          <div className="text-center py-16 md:py-20">
            <AlertCircle className="h-20 w-20 text-red-400 mx-auto mb-6" />
            <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-white font-poppins">Audit Failed</h2>
            <p className="text-gray-400 mb-8 text-sm md:text-base">
              We encountered an issue while analyzing your website. Please try again.
            </p>
            <Button onClick={handleReaudit} className="bg-[rgb(252,178,25)] hover:bg-[rgb(252,178,25)]/90 text-black">
              Try Again
            </Button>
          </div>
        ) : (
          <>
            {/* Screenshots */}
            <div className="grid lg:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
              {/* Desktop Screenshot */}
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-white font-poppins">
                    <Monitor className="h-5 w-5 text-[rgb(252,178,25)]" />
                    <span>Desktop View</span>
                    <Badge variant="outline" className="text-xs">
                      1366×768
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {audit.desktop_screenshot ? (
                    <div className="relative group">
                      <Image
                        src={audit.desktop_screenshot || "/placeholder.svg"}
                        alt="Desktop screenshot"
                        width={800}
                        height={600}
                        className="w-full h-auto rounded-lg border border-white/10 transition-transform group-hover:scale-[1.02]"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-800/50 rounded-lg flex items-center justify-center border border-white/10">
                      <p className="text-gray-400 text-sm md:text-base">Screenshot processing...</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Mobile Screenshot */}
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-white font-poppins">
                    <Smartphone className="h-5 w-5 text-[rgb(252,178,25)]" />
                    <span>Mobile View</span>
                    <Badge variant="outline" className="text-xs">
                      375×667
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {audit.mobile_screenshot ? (
                    <div className="relative group">
                      <Image
                        src={audit.mobile_screenshot || "/placeholder.svg"}
                        alt="Mobile screenshot"
                        width={400}
                        height={800}
                        className="w-full h-auto rounded-lg border border-white/10 max-w-sm mx-auto transition-transform group-hover:scale-[1.02]"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ) : (
                    <div className="aspect-[9/16] bg-gray-800/50 rounded-lg flex items-center justify-center max-w-sm mx-auto border border-white/10">
                      <p className="text-gray-400 text-sm md:text-base">Screenshot processing...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Findings */}
            {audit.findings && (
              <Card className="glass-effect mb-8 md:mb-12">
                <CardHeader>
                  <CardTitle className="text-white text-xl md:text-2xl font-poppins">AI Analysis Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 md:space-y-8">
                  {audit.findings.summary && (
                    <div>
                      <h3 className="text-lg md:text-xl font-semibold mb-4 text-white font-poppins">
                        Executive Summary
                      </h3>
                      <div className="bg-black/30 rounded-xl p-4 md:p-6 border border-white/10">
                        <p className="text-gray-300 leading-relaxed text-sm md:text-base">{audit.findings.summary}</p>
                      </div>
                    </div>
                  )}

                  {audit.findings.issues && audit.findings.issues.length > 0 && (
                    <div>
                      <h3 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-white font-poppins">
                        Issues & Recommendations
                      </h3>
                      <div className="space-y-4">
                        {audit.findings.issues.map((issue, index) => (
                          <Card key={index} className="bg-black/30 border-white/10">
                            <CardContent className="p-4 md:p-6">
                              <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 space-y-2 md:space-y-0">
                                <h4 className="font-semibold text-base md:text-lg text-white font-poppins">
                                  {issue.title}
                                </h4>
                                <Badge className={getSeverityColor(issue.severity)}>
                                  {issue.severity.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-gray-300 mb-4 leading-relaxed text-sm md:text-base">
                                {issue.description}
                              </p>
                              {issue.recommendation && (
                                <div className="bg-[rgb(252,178,25)]/5 border border-[rgb(252,178,25)]/20 rounded-lg p-4">
                                  <p className="text-sm font-medium text-[rgb(252,178,25)] mb-2">💡 Recommendation</p>
                                  <p className="text-gray-300 text-sm">{issue.recommendation}</p>
                                </div>
                              )}
                              <div className="flex items-center justify-between mt-4">
                                <Badge variant="outline" className="text-xs border-white/20 text-gray-400">
                                  {issue.category}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* CTA Section */}
            <Card className="glass-effect">
              <CardContent className="p-6 md:p-8 text-center">
                <h3 className="text-xl md:text-2xl font-bold mb-4 text-white font-poppins">
                  Want us to improve your landing page design?
                </h3>
                <p className="text-gray-400 mb-6 md:mb-8 text-sm md:text-base max-w-2xl mx-auto">
                  Our expert team can help you implement these recommendations and create a high-converting landing page
                  that drives results.
                </p>
                <div className="flex flex-col md:flex-row gap-4 justify-center max-w-md mx-auto">
                  <Button
                    onClick={handleBookCall}
                    className="bg-[rgb(252,178,25)] hover:bg-[rgb(252,178,25)]/90 text-black font-semibold glow-effect flex-1"
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Book a Call
                  </Button>
                  <Button
                    onClick={handleGetStarted}
                    variant="outline"
                    className="border-[rgb(252,178,25)] text-[rgb(252,178,25)] hover:bg-[rgb(252,178,25)]/10 flex-1 bg-transparent"
                  >
                    <Rocket className="mr-2 h-4 w-4" />
                    Get Started
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
