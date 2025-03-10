/*
This server page provides analytics dashboard content.
*/

"use server"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"

export default async function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Experiments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <p className="text-muted-foreground text-xs">+3% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Active Optimizations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-muted-foreground text-xs">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">76%</div>
            <p className="text-muted-foreground text-xs">+4% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$138K</div>
            <p className="text-muted-foreground text-xs">+8% from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>
              Overview of experiment performance over time
            </CardDescription>
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
