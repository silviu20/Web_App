/*
This client layout provides a custom background for the login page.
*/

"use client"

import { BlurredDashboardBackground } from "@/components/dashboard/blurred-dashboard-background"

export default function LoginLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen">
      {/* Blurred dashboard background */}
      <BlurredDashboardBackground />

      {/* Login content */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
