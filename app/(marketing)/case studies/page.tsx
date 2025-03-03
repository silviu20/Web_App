/*
 * This server page displays case studies showcasing successful implementations.
 */

"use server"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { ArrowRight, Award, BarChart, Factory, Flask, Zap } from "lucide-react"
import Link from "next/link"

interface CaseStudyProps {
  title: string
  company: string
  industry: string
  challenge: string
  outcome: string
  icon: React.ReactNode
}

const caseStudies: CaseStudyProps[] = [
  {
    title: "30% Efficiency Boost in Semiconductor Manufacturing",
    company: "Microchip Technologies",
    industry: "Semiconductor",
    challenge: "Optimizing silicon wafer production with lower defect rates",
    outcome: "Reduced defect rates by 45% while increasing throughput by 30%",
    icon: <Zap className="size-6" />
  },
  {
    title: "Pharmaceutical Process Optimization",
    company: "BioPharma Solutions",
    industry: "Pharmaceuticals",
    challenge: "Reducing time-to-market for new drug formulations",
    outcome: "Cut development time by 40% through adaptive experimental design",
    icon: <Flask className="size-6" />
  },
  {
    title: "Materials Science Breakthrough",
    company: "Advanced Materials Inc.",
    industry: "Materials Science",
    challenge: "Developing novel polymer composites with specific properties",
    outcome: "Discovered optimal formulation in 65% fewer experiments",
    icon: <Award className="size-6" />
  },
  {
    title: "Energy Efficiency in Chemical Processing",
    company: "ChemGlobal",
    industry: "Chemicals",
    challenge: "Minimizing energy consumption in batch processing",
    outcome: "Reduced energy usage by 28% while maintaining product quality",
    icon: <Factory className="size-6" />
  }
]

function CaseStudyCard({
  title,
  company,
  industry,
  challenge,
  outcome,
  icon
}: CaseStudyProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="mb-3 flex items-center gap-3">
          <div className="bg-primary text-primary-foreground rounded-full p-2">
            {icon}
          </div>
          <span className="text-muted-foreground text-sm font-medium">
            {industry}
          </span>
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-base font-medium">
          {company}
        </CardDescription>
      </CardHeader>
      <CardContent className="grow space-y-2">
        <div>
          <p className="font-semibold">Challenge:</p>
          <p className="text-muted-foreground">{challenge}</p>
        </div>
        <div>
          <p className="font-semibold">Outcome:</p>
          <p className="text-muted-foreground">{outcome}</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" asChild>
          <Link href="#">
            Read Full Case Study
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export default async function CaseStudiesPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold">Case Studies</h1>
        <p className="text-muted-foreground mx-auto max-w-2xl">
          Discover how leading organizations have transformed their experimental
          design and optimization processes with SynSilicO™.
        </p>
      </div>

      <div className="mb-16">
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="p-6 sm:p-10">
            <div className="flex flex-col items-center gap-6 md:flex-row">
              <div className="bg-primary text-primary-foreground rounded-full p-4">
                <BarChart className="size-12" />
              </div>
              <div className="flex-1">
                <h2 className="mb-4 text-2xl font-bold">
                  Featured: 87% ROI Improvement in Precision Manufacturing
                </h2>
                <p className="mb-6">
                  Global leader in precision manufacturing achieves breakthrough
                  efficiency gains and unprecedented return on investment
                  through adaptive experimental design optimization.
                </p>
                <Button className="hover:opacity-90" asChild>
                  <Link href="#">
                    View Success Story
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {caseStudies.map((caseStudy, index) => (
          <CaseStudyCard key={index} {...caseStudy} />
        ))}
      </div>
    </div>
  )
}
