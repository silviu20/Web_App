/*
This server page provides billing and subscription management with tiered pricing options.
*/

"use server"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  CreditCard,
  Download,
  Shield,
  CheckCircle,
  AlertCircle,
  Check,
  X,
  ArrowRight
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export default async function BillingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Billing & Subscription</h1>

      {/* Tier selection tabs */}
      <Tabs defaultValue="monthly" className="w-full">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Choose Your Plan</h2>
          <TabsList>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">
              Yearly
              <Badge
                variant="outline"
                className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              >
                Save 20%
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="monthly" className="mt-0">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Trial Tier */}
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle>Trial</CardTitle>
                <div className="mt-2 flex items-end text-2xl font-bold">
                  Free
                  <span className="text-muted-foreground ml-1 text-sm font-normal">
                    for 14 days
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">Basic experiments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">5 experiments total</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">Standard optimization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <X className="text-muted-foreground size-4" />
                    <span className="text-muted-foreground text-sm">
                      Limited storage
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <X className="text-muted-foreground size-4" />
                    <span className="text-muted-foreground text-sm">
                      Basic analytics only
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" disabled>
                  Current Plan
                </Button>
              </CardFooter>
            </Card>

            {/* Basic Tier */}
            <Card className="border-2 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Basic</CardTitle>
                  <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    POPULAR
                  </span>
                </div>
                <div className="mt-2 text-2xl font-bold">
                  $9.99
                  <span className="text-muted-foreground text-sm font-normal">
                    /month
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">All Trial features</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">50 experiments/month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">Enhanced optimization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">5GB storage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">Standard analytics</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Subscribe Now
                </Button>
              </CardFooter>
            </Card>

            {/* Advanced Tier */}
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle>Advanced</CardTitle>
                <div className="mt-2 text-2xl font-bold">
                  $29.99
                  <span className="text-muted-foreground text-sm font-normal">
                    /month
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">All Basic features</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">Unlimited experiments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">Advanced optimization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">25GB storage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">Advanced analytics</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Upgrade to Advanced</Button>
              </CardFooter>
            </Card>

            {/* Expert Tier */}
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle>Expert</CardTitle>
                <div className="mt-2 text-2xl font-bold">
                  $99.99
                  <span className="text-muted-foreground text-sm font-normal">
                    /month
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">All Advanced features</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">
                      Custom Bayesian optimization
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">Custom experiment configs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">100GB storage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">Priority support</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Upgrade to Expert</Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="yearly" className="mt-0">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Trial Tier */}
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle>Trial</CardTitle>
                <div className="mt-2 flex items-end text-2xl font-bold">
                  Free
                  <span className="text-muted-foreground ml-1 text-sm font-normal">
                    for 14 days
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">Basic experiments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">5 experiments total</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">Standard optimization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <X className="text-muted-foreground size-4" />
                    <span className="text-muted-foreground text-sm">
                      Limited storage
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <X className="text-muted-foreground size-4" />
                    <span className="text-muted-foreground text-sm">
                      Basic analytics only
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" disabled>
                  Current Plan
                </Button>
              </CardFooter>
            </Card>

            {/* Basic Tier */}
            <Card className="border-2 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Basic</CardTitle>
                  <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    POPULAR
                  </span>
                </div>
                <div className="mt-2 text-2xl font-bold">
                  $95.90
                  <span className="text-muted-foreground text-sm font-normal">
                    /year
                  </span>
                </div>
                <p className="text-sm text-green-600">Save $23.98 annually</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">All Trial features</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">50 experiments/month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">Enhanced optimization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">5GB storage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">Standard analytics</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Subscribe Now
                </Button>
              </CardFooter>
            </Card>

            {/* Advanced Tier */}
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle>Advanced</CardTitle>
                <div className="mt-2 text-2xl font-bold">
                  $287.90
                  <span className="text-muted-foreground text-sm font-normal">
                    /year
                  </span>
                </div>
                <p className="text-sm text-green-600">Save $71.98 annually</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">All Basic features</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">Unlimited experiments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">Advanced optimization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">25GB storage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">Advanced analytics</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Upgrade to Advanced</Button>
              </CardFooter>
            </Card>

            {/* Expert Tier */}
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle>Expert</CardTitle>
                <div className="mt-2 text-2xl font-bold">
                  $959.90
                  <span className="text-muted-foreground text-sm font-normal">
                    /year
                  </span>
                </div>
                <p className="text-sm text-green-600">Save $239.98 annually</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">All Advanced features</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">
                      Custom Bayesian optimization
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">Custom experiment configs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">100GB storage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    <span className="text-sm">Priority support</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Upgrade to Expert</Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Features Comparison */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Plan Features Comparison</CardTitle>
          <CardDescription>
            Detailed comparison of features across different plans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">Feature</th>
                  <th className="p-2 text-center">Trial</th>
                  <th className="bg-blue-50 p-2 text-center dark:bg-blue-900/20">
                    Basic
                  </th>
                  <th className="p-2 text-center">Advanced</th>
                  <th className="p-2 text-center">Expert</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2 font-medium">Number of Experiments</td>
                  <td className="p-2 text-center">5 total</td>
                  <td className="bg-blue-50 p-2 text-center dark:bg-blue-900/20">
                    50/month
                  </td>
                  <td className="p-2 text-center">Unlimited</td>
                  <td className="p-2 text-center">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Storage Capacity</td>
                  <td className="p-2 text-center">500MB</td>
                  <td className="bg-blue-50 p-2 text-center dark:bg-blue-900/20">
                    5GB
                  </td>
                  <td className="p-2 text-center">25GB</td>
                  <td className="p-2 text-center">100GB</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Analytics Features</td>
                  <td className="p-2 text-center">Basic only</td>
                  <td className="bg-blue-50 p-2 text-center dark:bg-blue-900/20">
                    Standard
                  </td>
                  <td className="p-2 text-center">Advanced</td>
                  <td className="p-2 text-center">Custom</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Bayesian Optimization</td>
                  <td className="p-2 text-center">Limited</td>
                  <td className="bg-blue-50 p-2 text-center dark:bg-blue-900/20">
                    Standard
                  </td>
                  <td className="p-2 text-center">Advanced</td>
                  <td className="p-2 text-center">Custom</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Export Options</td>
                  <td className="p-2 text-center">CSV only</td>
                  <td className="bg-blue-50 p-2 text-center dark:bg-blue-900/20">
                    CSV, Excel
                  </td>
                  <td className="p-2 text-center">CSV, Excel, PDF</td>
                  <td className="p-2 text-center">All formats + API</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Customer Support</td>
                  <td className="p-2 text-center">Community</td>
                  <td className="bg-blue-50 p-2 text-center dark:bg-blue-900/20">
                    Email
                  </td>
                  <td className="p-2 text-center">Email + Chat</td>
                  <td className="p-2 text-center">Priority + Phone</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Team Members</td>
                  <td className="p-2 text-center">1</td>
                  <td className="bg-blue-50 p-2 text-center dark:bg-blue-900/20">
                    2
                  </td>
                  <td className="p-2 text-center">5</td>
                  <td className="p-2 text-center">10</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">Can I switch between plans?</h3>
            <p className="text-muted-foreground text-sm">
              Yes, you can upgrade or downgrade your plan at any time. Changes
              take effect at the start of your next billing cycle.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">What happens when my trial ends?</h3>
            <p className="text-muted-foreground text-sm">
              When your 14-day trial ends, you'll need to choose a paid plan to
              continue using SynSilicO™. Your data will be preserved for 30
              days if you don't subscribe.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Do you offer refunds?</h3>
            <p className="text-muted-foreground text-sm">
              We offer a 14-day money-back guarantee on all paid plans. If
              you're not satisfied, contact our support team for a full refund.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Can I customize my plan?</h3>
            <p className="text-muted-foreground text-sm">
              Custom plans are available for enterprise customers. Contact our
              sales team for more information.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline">Contact Support</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
