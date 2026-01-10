import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function AboutPage() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>About Reactive RPS</CardTitle>
          <CardDescription>Frequently Asked Questions</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>What is Reactive RPS?</AccordionTrigger>
              <AccordionContent>
                Reactive Rock Paper Scissors is a demo showcasing a real-time AI that adapts to your gameplay. It's not just about winning or losing, but about syncing your actions with the AI.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>What is the 'Fluidity Score'?</AccordionTrigger>
              <AccordionContent>
                The Fluidity Score, a form of Qualimetric Analysis, measures the time difference between your move and the AI's reaction. A lower score means you are more in sync with the AI. This is a key innovation for measuring the real-time reactivity of our AI.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>What is QUINCE?</AccordionTrigger>
              <AccordionContent>
                QUINCE is our backend machine learning protocol. It analyzes gameplay data (we call them 'Reflex Snapshots' or %r) to adapt the AI's long-term strategy to your unique rhythm, without interrupting gameplay.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
