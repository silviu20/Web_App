/*
This server page serves as the main dashboard entry point with sign-in protection.
*/

"use server"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const { userId } = await auth()

  // If user is not authenticated, redirect directly to login with custom background
  if (!userId) {
    redirect("/login?redirect_url=/dashboard/home")
  }

  // If user is authenticated, redirect to the actual dashboard content
  redirect("/dashboard/home")
}
