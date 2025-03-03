/*
 * This server page displays a grid of tutorials for users to browse.
 */

"use server"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { BookOpen, Code, Video } from "lucide-react"

interface TutorialProps {
  title: string
  description: string
  category: string
  icon: React.ReactNode
}

const tutorials: TutorialProps[] = [
  {
    title: "Getting Started with SynSilicO™",
    description:
      "Learn the basics of experimental design optimization with our platform",
    category: "Beginner",
    icon: <BookOpen className="size-5" />
  },
  {
    title: "Advanced Configuration Techniques",
    description:
      "Dive deep into powerful configuration options for professional users",
    category: "Advanced",
    icon: <Code className="size-5" />
  },
  {
    title: "Video Walkthrough: Optimization Process",
    description:
      "Watch a step-by-step demonstration of the optimization process",
    category: "Video",
    icon: <Video className="size-5" />
  },
  {
    title: "Creating Custom Processes",
    description:
      "Learn how to define and optimize your own production processes",
    category: "Intermediate",
    icon: <Code className="size-5" />
  },
  {
    title: "Data Integration Guide",
    description:
      "Connect your existing data sources to maximize optimization potential",
    category: "Integration",
    icon: <BookOpen className="size-5" />
  },
  {
    title: "Interpreting Results Dashboard",
    description:
      "Make sense of your optimization results with powerful analytics",
    category: "Analytics",
    icon: <Video className="size-5" />
  }
]

function TutorialCard({ title, description, category, icon }: TutorialProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{title}</CardTitle>
          <div className="bg-primary text-primary-foreground rounded-full p-2">
            {icon}
          </div>
        </div>
        <div className="text-muted-foreground text-sm font-medium">
          {category}
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardContent>
    </Card>
  )
}

export default async function TutorialsPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold">Tutorials</h1>
        <p className="text-muted-foreground mx-auto max-w-2xl">
          Explore our comprehensive tutorials to get the most out of SynSilicO™
          and optimize your experimental design process.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tutorials.map((tutorial, index) => (
          <TutorialCard key={index} {...tutorial} />
        ))}
      </div>
    </div>
  )
}
