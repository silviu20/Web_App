/*
This server page provides the main dashboard interface for authenticated users.
*/

"use server"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function DashboardHomePage() {
  const { userId } = await auth()

  // If user is not authenticated, redirect to the dashboard root for auth check
  if (!userId) {
    redirect("/dashboard")
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Experiments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Active Optimizations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Efficiency Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Experiments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  name: "Process A Optimization",
                  date: "2023-03-08",
                  status: "In Progress"
                },
                {
                  name: "Material B Testing",
                  date: "2023-03-05",
                  status: "Completed"
                },
                {
                  name: "Catalyst C Analysis",
                  date: "2023-03-01",
                  status: "Completed"
                }
              ].map((experiment, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b pb-2"
                >
                  <div>
                    <p className="font-medium">{experiment.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {experiment.date}
                    </p>
                  </div>
                  <span
                    className={`rounded px-2 py-1 text-sm ${
                      experiment.status === "Completed"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    }`}
                  >
                    {experiment.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center rounded-md border">
              <p className="text-muted-foreground">
                Chart visualization would appear here
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
