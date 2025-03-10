/*
This server page provides user activity history.
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
import {
  History,
  Filter,
  Eye,
  Beaker,
  FileCog,
  LineChart,
  Settings,
  Download
} from "lucide-react"

export default async function HistoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Activity History</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 size-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 size-4" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your activity across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Today */}
            <div>
              <h3 className="mb-3 text-sm font-medium">Today</h3>
              <div className="space-y-4">
                {[
                  {
                    time: "10:42 AM",
                    action: "Viewed experiment results",
                    target: "Catalyst A Optimization",
                    icon: <Eye className="size-4" />,
                    category: "experiment"
                  },
                  {
                    time: "09:18 AM",
                    action: "Created new experiment",
                    target: "Temperature Sensitivity Analysis",
                    icon: <Beaker className="size-4" />,
                    category: "experiment"
                  },
                  {
                    time: "08:05 AM",
                    action: "Updated optimization parameters",
                    target: "Solvent Ratio Optimization",
                    icon: <FileCog className="size-4" />,
                    category: "optimization"
                  }
                ].map((activity, index) => (
                  <div key={index} className="flex">
                    <div className="mr-4 flex items-start">
                      <div className="bg-primary mt-1 size-2 rounded-full"></div>
                      <div className="bg-border mx-1 h-full w-px"></div>
                    </div>
                    <div className="flex flex-1 items-start gap-2 pb-4">
                      <div
                        className={`rounded-full p-1 ${
                          activity.category === "experiment"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                            : activity.category === "optimization"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                              : activity.category === "analytics"
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {activity.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {activity.action}
                          <span className="text-muted-foreground font-normal">
                            {" "}
                            — {activity.target}
                          </span>
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {activity.time}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Yesterday */}
            <div>
              <h3 className="mb-3 text-sm font-medium">Yesterday</h3>
              <div className="space-y-4">
                {[
                  {
                    time: "4:52 PM",
                    action: "Ran analytics report",
                    target: "Monthly Performance Summary",
                    icon: <LineChart className="size-4" />,
                    category: "analytics"
                  },
                  {
                    time: "2:30 PM",
                    action: "Updated account settings",
                    target: "Email notifications",
                    icon: <Settings className="size-4" />,
                    category: "settings"
                  },
                  {
                    time: "11:15 AM",
                    action: "Started optimization",
                    target: "Process B Parameter Screening",
                    icon: <FileCog className="size-4" />,
                    category: "optimization"
                  }
                ].map((activity, index) => (
                  <div key={index} className="flex">
                    <div className="mr-4 flex items-start">
                      <div className="bg-primary mt-1 size-2 rounded-full"></div>
                      <div className="bg-border mx-1 h-full w-px"></div>
                    </div>
                    <div className="flex flex-1 items-start gap-2 pb-4">
                      <div
                        className={`rounded-full p-1 ${
                          activity.category === "experiment"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                            : activity.category === "optimization"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                              : activity.category === "analytics"
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {activity.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {activity.action}
                          <span className="text-muted-foreground font-normal">
                            {" "}
                            — {activity.target}
                          </span>
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {activity.time}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <Button variant="outline" className="w-1/2">
              Load More History
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
