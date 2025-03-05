/*
 * This server page displays case studies showcasing successful implementations.
 */

"use server"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

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
        <Card className="border-primary/10 border">
          <CardContent className="p-6 sm:p-10">
            <div className="flex flex-col items-center gap-6 md:flex-row">
              <div className="bg-primary text-primary-foreground rounded-full p-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
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
                <Button className="hover:opacity-90">
                  <a href="#">
                    View Success Story
                    <span className="ml-2">→</span>
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Case Study 1 */}
        <Card className="h-full">
          <CardContent className="p-6">
            <div className="mb-3 flex items-center gap-3">
              <div className="bg-primary text-primary-foreground rounded-full p-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </div>
              <span className="text-muted-foreground text-sm font-medium">
                Semiconductor
              </span>
            </div>
            <h3 className="mb-1 text-xl font-bold">
              30% Efficiency Boost in Semiconductor Manufacturing
            </h3>
            <p className="mb-4 text-base font-medium">Microchip Technologies</p>
            <div className="mb-4 space-y-2">
              <div>
                <p className="font-semibold">Challenge:</p>
                <p className="text-muted-foreground">
                  Optimizing silicon wafer production with lower defect rates
                </p>
              </div>
              <div>
                <p className="font-semibold">Outcome:</p>
                <p className="text-muted-foreground">
                  Reduced defect rates by 45% while increasing throughput by 30%
                </p>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              <a href="#">Read Full Case Study</a>
            </Button>
          </CardContent>
        </Card>

        {/* Case Study 2 */}
        <Card className="h-full">
          <CardContent className="p-6">
            <div className="mb-3 flex items-center gap-3">
              <div className="bg-primary text-primary-foreground rounded-full p-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 2v8L4.72 18.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45L14 10V2"></path>
                  <path d="M10 2a2.5 2.5 0 0 1 4 0"></path>
                </svg>
              </div>
              <span className="text-muted-foreground text-sm font-medium">
                Pharmaceuticals
              </span>
            </div>
            <h3 className="mb-1 text-xl font-bold">
              Pharmaceutical Process Optimization
            </h3>
            <p className="mb-4 text-base font-medium">BioPharma Solutions</p>
            <div className="mb-4 space-y-2">
              <div>
                <p className="font-semibold">Challenge:</p>
                <p className="text-muted-foreground">
                  Reducing time-to-market for new drug formulations
                </p>
              </div>
              <div>
                <p className="font-semibold">Outcome:</p>
                <p className="text-muted-foreground">
                  Cut development time by 40% through adaptive experimental
                  design
                </p>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              <a href="#">Read Full Case Study</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
