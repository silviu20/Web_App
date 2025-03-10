/*
This server page provides optimization dashboard content.
*/

"use server"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileCog, Plus } from "lucide-react"

export default async function OptimizationPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Optimization</h1>
        <Button>
          <Plus className="mr-2 size-4" />
          New Optimization
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Active Optimizations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-muted-foreground text-xs">
              Running optimization tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Optimization Potential
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">34%</div>
            <p className="text-muted-foreground text-xs">
              Average projected improvement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Resource Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">67%</div>
            <p className="text-muted-foreground text-xs">
              Of available resource capacity
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Optimizations</CardTitle>
          <CardDescription>Your ongoing optimization processes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                id: "opt-128",
                name: "Catalyst Efficiency",
                status: "Running",
                improvement: "+28%"
              },
              {
                id: "opt-129",
                name: "Temperature Cycle",
                status: "Running",
                improvement: "+15%"
              },
              {
                id: "opt-130",
                name: "Solvent Ratio",
                status: "Running",
                improvement: "+22%"
              },
              {
                id: "opt-132",
                name: "Pressure Parameters",
                status: "Setup",
                improvement: "Pending"
              }
            ].map(optimization => (
              <div
                key={optimization.id}
                className="flex items-center justify-between border-b pb-4"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 rounded-md p-2">
                    <FileCog className="text-primary size-5" />
                  </div>
                  <div>
                    <p className="font-medium">{optimization.name}</p>
                    <p className="text-muted-foreground text-sm">
                      ID: {optimization.id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        optimization.status === "Running"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                      }`}
                    >
                      {optimization.status}
                    </span>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Improvement:{" "}
                      <span className="text-green-600 dark:text-green-400">
                        {optimization.improvement}
                      </span>
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Optimization Recommendations</CardTitle>
          <CardDescription>
            Suggested optimization opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                id: "rec-052",
                name: "Flow Rate Optimization",
                potential: "High",
                estimate: "+30%"
              },
              {
                id: "rec-053",
                name: "Process Timing Adjustment",
                potential: "Medium",
                estimate: "+18%"
              }
            ].map(recommendation => (
              <div
                key={recommendation.id}
                className="flex items-center justify-between border-b pb-4"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-amber-100 p-2 dark:bg-amber-900">
                    <FileCog className="size-5 text-amber-600 dark:text-amber-300" />
                  </div>
                  <div>
                    <p className="font-medium">{recommendation.name}</p>
                    <p className="text-muted-foreground text-sm">
                      Potential: {recommendation.potential}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">Est. Improvement</p>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      {recommendation.estimate}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Start
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
