'use client'

import { Check, Info, Star, Calendar, AlertCircle, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export default function TipsStep() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-medical-blue-800">Tips for Success</h2>
        <p className="text-gray-600">
          Here are some helpful tips to maximize your results and make your bioelectric regeneration 
          journey as effective as possible.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-l-4 border-l-medical-green-500">
          <CardContent className="p-5">
            <div className="flex items-start">
              <div className="mr-4 text-medical-green-600">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Consistency is Key</h3>
                <p className="text-sm text-gray-600">
                  Try to take your supplements and perform your modalities at the same time each day to establish 
                  a routine. Consistency leads to better compliance and results.
                </p>
                <div className="mt-3 text-sm text-medical-green-700 flex items-center">
                  <Check className="h-4 w-4 mr-1" />
                  <span>Use the daily checklist feature to stay on track</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-medical-blue-500">
          <CardContent className="p-5">
            <div className="flex items-start">
              <div className="mr-4 text-medical-blue-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Timing Matters</h3>
                <p className="text-sm text-gray-600">
                  Some supplements work best on an empty stomach, while others should be taken with food. 
                  Pay attention to the specific instructions for each product.
                </p>
                <div className="mt-3 text-sm text-medical-blue-700 flex items-center">
                  <Check className="h-4 w-4 mr-1" />
                  <span>Space binders at least 2 hours from food and other supplements</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-medical-orange-500">
          <CardContent className="p-5">
            <div className="flex items-start">
              <div className="mr-4 text-medical-orange-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Monitor Detox Reactions</h3>
                <p className="text-sm text-gray-600">
                  Some temporary detox symptoms are normal. Track these in your biomarkers section and adjust 
                  your protocol if symptoms become too intense.
                </p>
                <div className="mt-3 text-sm text-medical-orange-700 flex items-center">
                  <Check className="h-4 w-4 mr-1" />
                  <span>Stay hydrated to support toxin elimination</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-medical-purple-500">
          <CardContent className="p-5">
            <div className="flex items-start">
              <div className="mr-4 text-medical-purple-600">
                <Star className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Celebrate Progress</h3>
                <p className="text-sm text-gray-600">
                  Healing is not always linear. Make note of all improvements, no matter how small. 
                  These will add up to significant changes over time.
                </p>
                <div className="mt-3 text-sm text-medical-purple-700 flex items-center">
                  <Check className="h-4 w-4 mr-1" />
                  <span>Use the progress notes feature to document your journey</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h3 className="font-medium text-lg text-medical-blue-700 mb-4">Frequently Asked Questions</h3>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-left font-medium text-gray-800">
              What if I miss a day of supplements?
            </AccordionTrigger>
            <AccordionContent className="text-gray-600">
              Just resume your protocol the next day. Don't double-dose to make up for a missed day. 
              Consistency over time is more important than perfect adherence.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-2">
            <AccordionTrigger className="text-left font-medium text-gray-800">
              How quickly should I expect to see results?
            </AccordionTrigger>
            <AccordionContent className="text-gray-600">
              Results vary by individual. Some people report improvements within the first few weeks, 
              while others may take months to notice significant changes. The biomarker tracking features 
              will help you identify subtle improvements you might otherwise miss.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-3">
            <AccordionTrigger className="text-left font-medium text-gray-800">
              Can I adjust my phase durations later?
            </AccordionTrigger>
            <AccordionContent className="text-gray-600">
              Yes, you can adjust your phase durations at any time through the settings menu. Your 
              protocol is flexible and can be tailored to your body's unique needs and response.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-4">
            <AccordionTrigger className="text-left font-medium text-gray-800">
              What should I do if I have a strong detox reaction?
            </AccordionTrigger>
            <AccordionContent className="text-gray-600">
              If you experience uncomfortable detox symptoms, you can temporarily reduce your dosages
              or take a break for 1-2 days. Stay well-hydrated and consider supportive therapies like 
              Epsom salt baths. Use the tracking features to note what might have triggered the reaction.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-5">
            <AccordionTrigger className="text-left font-medium text-gray-800">
              Can I add custom biomarkers to track?
            </AccordionTrigger>
            <AccordionContent className="text-gray-600">
              Yes, you can add custom biomarkers in the settings section. This allows you to track 
              metrics that are specific to your health concerns and goals.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="mt-8 bg-medical-blue-50 p-6 rounded-lg border border-medical-blue-100">
        <div className="flex items-start">
          <div className="mr-4 text-medical-blue-600">
            <Info className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-medium text-medical-blue-700 mb-2">Remember</h3>
            <p className="text-sm text-medical-blue-600">
              The Bioelectric Regeneration protocol is a journey, not a race. Listen to your body, 
              be patient with the process, and use the tracking tools to guide your way. Your healing 
              path is unique, and this platform is designed to support your individual journey.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
