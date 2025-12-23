import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600">
            Choose the plan that's right for your business
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <PricingCard
            name="Free"
            price="$0"
            description="Perfect for trying out Clincial"
            features={[
              'Up to 3 users',
              '5 projects',
              'Basic analytics',
              'Community support',
              '1GB storage'
            ]}
            buttonText="Get Started"
            buttonLink="/auth/signup"
            highlighted={false}
          />

          <PricingCard
            name="Pro"
            price="$29"
            description="For growing teams"
            features={[
              'Up to 25 users',
              'Unlimited projects',
              'Advanced analytics',
              'Priority support',
              '100GB storage',
              'Custom integrations',
              'API access'
            ]}
            buttonText="Start Free Trial"
            buttonLink="/auth/signup?plan=pro"
            highlighted={true}
          />

          <PricingCard
            name="Enterprise"
            price="Custom"
            description="For large organizations"
            features={[
              'Unlimited users',
              'Unlimited projects',
              'Advanced analytics',
              '24/7 dedicated support',
              'Unlimited storage',
              'Custom integrations',
              'API access',
              'SSO & SAML',
              'SLA guarantee'
            ]}
            buttonText="Contact Sales"
            buttonLink="/contact"
            highlighted={false}
          />
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-6 text-left">
            <FAQItem
              question="Can I change plans later?"
              answer="Yes! You can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle."
            />
            <FAQItem
              question="Do you offer refunds?"
              answer="We offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund."
            />
            <FAQItem
              question="What payment methods do you accept?"
              answer="We accept all major credit cards (Visa, MasterCard, American Express) and PayPal."
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function PricingCard({
  name,
  price,
  description,
  features,
  buttonText,
  buttonLink,
  highlighted
}: {
  name: string
  price: string
  description: string
  features: string[]
  buttonText: string
  buttonLink: string
  highlighted: boolean
}) {
  return (
    <div className={`bg-white rounded-lg shadow-lg p-8 ${highlighted ? 'ring-2 ring-blue-600 scale-105' : ''}`}>
      {highlighted && (
        <div className="bg-blue-600 text-white text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
          Most Popular
        </div>
      )}
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{name}</h3>
      <div className="mb-4">
        <span className="text-4xl font-bold text-gray-900">{price}</span>
        {price !== 'Custom' && <span className="text-gray-600">/month</span>}
      </div>
      <p className="text-gray-600 mb-6">{description}</p>
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
      <Link href={buttonLink} className="block">
        <Button
          variant={highlighted ? 'primary' : 'outline'}
          className="w-full"
          size="lg"
        >
          {buttonText}
        </Button>
      </Link>
    </div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{question}</h3>
      <p className="text-gray-600">{answer}</p>
    </div>
  )
}
