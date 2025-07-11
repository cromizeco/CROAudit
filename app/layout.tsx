import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Cromize - AI-Powered UI/UX Audit Tool",
  description:
    "Get comprehensive AI-powered website audits with real screenshots, detailed analysis, and actionable UX recommendations",
  keywords: "UX audit, UI analysis, website optimization, user experience, AI-powered",
  authors: [{ name: "Cromize" }],
  viewport: "width=device-width, initial-scale=1",
    generator: 'v0.dev'
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-inter antialiased">{children}</body>
    </html>
  )
}
