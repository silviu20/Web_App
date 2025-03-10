/*
This server page provides help center content.
*/

"use server"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  HelpCircle,
  Search,
  FileText,
  Book,
  Lightbulb,
  PlayCircle,
  MessagesSquare
} from "lucide-react"

export default async function HelpCenterPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Help Center</h1>

      {/* Search bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="text-muted-foreground absolute left-3 top-1/2 size-5 -translate-y-1/2" />
            <Input placeholder="Search help topics..." className="pl-10" />
            <Button className="absolute right-1 top-1/2 h-7 -translate-y-1/2">
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick help categories */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="overflow-hidden">
          <div className="bg-primary text-primary-foreground p-4">
            <Book className="size-6" />
          </div>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>New to SynSilicO™? Start here!</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  Platform overview
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  Setting up your first experiment
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  Understanding the dashboard
                </a>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="bg-primary text-primary-foreground p-4">
            <FileText className="size-6" />
          </div>
          <CardHeader>
            <CardTitle>Documentation</CardTitle>
            <CardDescription>Detailed guides and references</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  API Reference
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  Data import/export
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  Integration guides
                </a>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="bg-primary text-primary-foreground p-4">
            <PlayCircle className="size-6" />
          </div>
          <CardHeader>
            <CardTitle>Video Tutorials</CardTitle>
            <CardDescription>Learn by watching</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  Optimization walkthrough
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  Advanced analytics
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  Results interpretation
                </a>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="size-5" />
            <span>Frequently Asked Questions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                question: "How do I set up a new experimental design?",
                answer:
                  "Navigate to the Experiments tab and click the 'New Experiment' button. Follow the guided setup process to define your parameters, constraints, and optimization objectives."
              },
              {
                question:
                  "What's the difference between experiments and optimizations?",
                answer:
                  "Experiments are for data collection and hypothesis testing. Optimizations use existing experimental data to find the optimal settings for your process or product."
              },
              {
                question: "How can I export my results?",
                answer:
                  "On any results page, look for the Export button in the top-right corner. You can export data in CSV, Excel, or PDF formats."
              },
              {
                question: "Can I integrate with my existing lab systems?",
                answer:
                  "Yes, we support integration with major LIMS and automation systems. See our documentation for API details and integration guides."
              }
            ].map((faq, index) => (
              <div key={index} className="border-b pb-4">
                <h3 className="mb-2 font-medium">{faq.question}</h3>
                <p className="text-muted-foreground text-sm">{faq.answer}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessagesSquare className="size-5" />
            <span>Need More Help?</span>
          </CardTitle>
          <CardDescription>
            Our support team is ready to assist you
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row">
          <Button className="flex items-center gap-2">
            <HelpCircle className="size-4" />
            <span>Contact Support</span>
          </Button>
          <Button variant="outline">Schedule a Demo</Button>
        </CardContent>
      </Card>
    </div>
  )
}
