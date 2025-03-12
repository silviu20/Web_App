// app/dashboard/optimizations/create/page.tsx
"use server"

import { CreateOptimizationForm } from "@/components/optimization/create-optimization-form"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function CreateOptimizationPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/login?redirect_url=/dashboard/optimizations/create")
  }

  return (
    <div className="mx-auto max-w-4xl py-6">
      <h1 className="mb-6 text-3xl font-bold">Create New Optimization</h1>
      <CreateOptimizationForm />
    </div>
  )
}
