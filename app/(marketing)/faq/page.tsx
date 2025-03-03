/*
 * This server page displays frequently asked questions organized by category.
 */

"use server"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

// FAQ data organized by categories
const faqData = {
  general: [
    {
      question: "What is SynSilicO™?",
      answer:
        "SynSilicO™ is an adaptive experimental design and optimization platform that helps scientists and engineers drastically reduce the number of experiments needed to achieve optimal results. Our AI-driven approach identifies the most informative experiments to run next, cutting through costs and accelerating innovation cycles."
    },
    {
      question:
        "How does SynSilicO™ differ from traditional Design of Experiments (DoE) software?",
      answer:
        "Unlike traditional DoE software that requires a predefined experimental matrix, SynSilicO™ uses adaptive algorithms that learn from each experiment's results to intelligently suggest the next experiments. This approach typically requires 60-80% fewer experiments than traditional methods while achieving superior results."
    },
    {
      question: "What industries can benefit from SynSilicO™?",
      answer:
        "SynSilicO™ is designed for any industry involving experimental optimization, including semiconductor manufacturing, materials science, chemical processing, pharmaceuticals, food science, and more. Any process with multiple variables that needs to be optimized can benefit from our platform."
    },
    {
      question: "Is SynSilicO™ cloud-based or on-premises?",
      answer:
        "We offer both options. Our cloud-based solution provides the easiest setup and ongoing updates, while our on-premises solution is available for organizations with specific security or compliance requirements."
    }
  ],
  technical: [
    {
      question: "What algorithms does SynSilicO™ use for optimization?",
      answer:
        "SynSilicO™ employs a suite of adaptive algorithms including Bayesian optimization, multi-armed bandits, and proprietary techniques specifically designed for experimental contexts. The platform automatically selects the best algorithm based on your specific use case and data characteristics."
    },
    {
      question: "Can SynSilicO™ handle multi-objective optimization problems?",
      answer:
        "Yes, SynSilicO™ excels at multi-objective optimization, allowing you to balance competing objectives like quality, cost, and throughput. Our platform will help you identify the Pareto frontier of optimal solutions to make informed trade-off decisions."
    },
    {
      question:
        "How many parameters or factors can SynSilicO™ optimize simultaneously?",
      answer:
        "SynSilicO™ can handle dozens of parameters simultaneously, though performance will depend on the complexity of relationships between parameters. Our platform includes tools to help identify the most influential parameters, allowing you to focus on what matters most."
    },
    {
      question:
        "How does SynSilicO™ handle noisy or uncertain experimental data?",
      answer:
        "Our platform is designed from the ground up to handle real-world experimental uncertainty. It incorporates robust statistical methods to account for measurement noise, process variation, and experimental error to ensure reliable recommendations despite noisy data."
    }
  ],
  pricing: [
    {
      question: "How is SynSilicO™ priced?",
      answer:
        "We offer flexible pricing options including monthly and annual subscriptions. Our pricing is based on the scale of your optimization needs, with plans for individuals, small teams, and enterprise-wide deployments. Visit our pricing page for details or contact us for a custom quote."
    },
    {
      question: "Is there a free trial available?",
      answer:
        "Yes, we offer a 14-day free trial that gives you full access to SynSilicO™'s features. This allows you to test the platform with your own data and see the benefits firsthand before committing to a subscription."
    },
    {
      question:
        "Are there any limits on experiments or users in the pricing plans?",
      answer:
        "Different plans have different limits on the number of active optimization projects, experiments, and user accounts. Our enterprise plans offer customizable limits to meet the needs of larger organizations or more extensive experimental programs."
    },
    {
      question: "Do you offer academic or research discounts?",
      answer:
        "Yes, we offer special pricing for academic institutions and non-profit research organizations. Contact our sales team with details about your organization to learn more about our academic pricing options."
    }
  ],
  support: [
    {
      question: "What kind of support is included with SynSilicO™?",
      answer:
        "All plans include access to our comprehensive documentation, video tutorials, and community forums. Our paid plans include email support with guaranteed response times. Enterprise plans also include dedicated support contacts and optional onboarding assistance."
    },
    {
      question: "Do you offer training for new users?",
      answer:
        "Yes, we provide both self-paced training resources and live training sessions. Our enterprise plans include customized training sessions for your team, focusing on your specific use cases and optimization challenges."
    },
    {
      question:
        "How can I get help integrating SynSilicO™ with our existing systems?",
      answer:
        "Our platform includes standard APIs for integration with common lab information management systems and data repositories. For custom integrations, our professional services team can provide specialized assistance, or you can work with one of our certified integration partners."
    },
    {
      question: "What if I encounter a bug or technical issue?",
      answer:
        "You can report bugs and technical issues through our support portal. Our engineering team prioritizes critical issues, and we maintain a public roadmap of bug fixes and feature enhancements. Enterprise customers receive priority attention for critical issues."
    }
  ]
}

export default async function FaqPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold">Frequently Asked Questions</h1>
        <p className="text-muted-foreground mx-auto max-w-2xl">
          Find answers to common questions about SynSilicO™ and how it can
          transform your experimental optimization process.
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        {Object.entries(faqData).map(([category, questions]) => (
          <TabsContent key={category} value={category} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl capitalize">
                  {category} Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {questions.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-muted-foreground">{faq.answer}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <div className="mt-16 text-center">
        <h2 className="mb-6 text-2xl font-semibold">Still have questions?</h2>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button asChild>
            <Link href="/contact">Contact Us</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/tutorials">Browse Tutorials</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
