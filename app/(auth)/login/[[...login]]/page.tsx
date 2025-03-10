/*
This client page provides a customized login experience with a blurred dashboard background.
*/

"use client"

import { SignIn } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { motion } from "framer-motion"
import { useSearchParams, useRouter } from "next/navigation"
import { useTheme } from "next-themes"

export default function LoginPage() {
  const { theme } = useTheme()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get("redirect_url") || "/"
  const router = useRouter()

  return (
    <div className="flex min-h-screen items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <SignIn
          appearance={{
            baseTheme: theme === "dark" ? dark : undefined,
            elements: {
              rootBox: "w-full mx-auto",
              card: "bg-background shadow-xl"
            }
          }}
          redirectUrl={redirectUrl}
          routing="path"
          path="/login"
        />
      </motion.div>
    </div>
  )
}
