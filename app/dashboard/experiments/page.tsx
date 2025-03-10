/*
This server page provides experiments dashboard content.
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
import { Beaker, Plus } from "lucide-react"

export default async function ExperimentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Experiments</h1>
        <Button>
          <Plus className="mr-2 size-4" />
          New Experiment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Experiments</CardTitle>
          <CardDescription>
            Your currently running experimental designs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                id: "exp-001",
                name: "Catalyst A Optimization",
                status: "Running",
                progress: 45
              },
              {
                id: "exp-002",
                name: "Temperature Sensitivity Analysis",
                status: "Running",
                progress: 78
              },
              {
                id: "exp-003",
                name: "Reaction Time Optimization",
                status: "Setup",
                progress: 10
              }
            ].map(experiment => (
              <div
                key={experiment.id}
                className="flex items-center justify-between border-b pb-4"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 rounded-md p-2">
                    <Beaker className="text-primary size-5" />
                  </div>
                  <div>
                    <p className="font-medium">{experiment.name}</p>
                    <p className="text-muted-foreground text-sm">
                      ID: {experiment.id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {experiment.status}
                    </span>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {experiment.progress}% complete
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
          <CardTitle>Completed Experiments</CardTitle>
          <CardDescription>Your finished experimental results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                id: "exp-845",
                name: "Process B Parameter Screening",
                status: "Completed",
                date: "2025-02-15"
              },
              {
                id: "exp-782",
                name: "Solvent Selection Study",
                status: "Completed",
                date: "2025-02-10"
              }
            ].map(experiment => (
              <div
                key={experiment.id}
                className="flex items-center justify-between border-b pb-4"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-green-100 p-2 dark:bg-green-900">
                    <Beaker className="size-5 text-green-600 dark:text-green-300" />
                  </div>
                  <div>
                    <p className="font-medium">{experiment.name}</p>
                    <p className="text-muted-foreground text-sm">
                      ID: {experiment.id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                      {experiment.status}
                    </span>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {experiment.date}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Results
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
