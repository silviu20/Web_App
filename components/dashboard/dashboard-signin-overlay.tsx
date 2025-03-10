"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"

export default function DashboardWithSignInOverlay() {
  const router = useRouter()

  const handleSignIn = () => {
    router.push("/login?redirect_url=/dashboard/home")
  }

  return (
    <div className="relative min-h-screen w-full">
      {/* Dashboard UI in background (blurred) */}
      <div className="absolute inset-0 blur-sm brightness-50">
        <div className="grid h-full grid-cols-12 gap-4 p-8">
          {/* This is a simplified dashboard mockup that will be blurred in the background */}
          <div className="bg-muted col-span-3 rounded-lg p-4 shadow-md">
            <div className="bg-primary/20 mb-4 h-8 w-24 rounded-md"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="bg-primary/10 h-10 rounded-md"></div>
              ))}
            </div>
          </div>
          <div className="col-span-9 space-y-4">
            <div className="bg-muted h-32 rounded-lg p-4 shadow-md">
              <div className="grid h-full grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-primary/10 rounded-md"></div>
                ))}
              </div>
            </div>
            <div className="bg-muted h-64 rounded-lg p-4 shadow-md">
              <div className="bg-primary/20 mb-4 h-8 w-32 rounded-md"></div>
              <div className="grid h-4/5 grid-cols-2 gap-4">
                <div className="bg-primary/10 rounded-md"></div>
                <div className="bg-primary/10 rounded-md"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sign-in overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-[400px] shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Sign In Required</CardTitle>
              <CardDescription>
                Please sign in to access the dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <p className="text-muted-foreground text-center">
                You need to be signed in to view and manage your experiments and
                optimizations.
              </p>
              <Button size="lg" className="w-full" onClick={handleSignIn}>
                Sign In
              </Button>
              <p className="text-muted-foreground text-xs">
                Don't have an account? You'll be able to sign up on the next
                screen.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
