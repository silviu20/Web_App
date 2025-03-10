/*
This server layout provides the dashboard structure with sidebar navigation.
*/

"use server"

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  // If user is not authenticated, redirect to login
  if (!userId) {
    redirect("/login?redirect_url=/dashboard/home")
  }

  return (
    <div className="flex h-screen w-full">
      <DashboardSidebar />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  )
}
