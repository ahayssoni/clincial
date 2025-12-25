import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-blue-600">Clincial</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Your powerful SaaS platform for modern businesses.
            Streamline your workflow and boost productivity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/signup">
              <Button size="lg">Get Started Free</Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg">View Pricing</Button>
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            No credit card required • 14-day free trial
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Powerful Features
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              title="Easy to Use"
              description="Intuitive interface designed for users of all skill levels. Get started in minutes."
              icon="🚀"
            />
            <FeatureCard
              title="Secure & Reliable"
              description="Enterprise-grade security with 99.9% uptime guarantee. Your data is safe."
              icon="🔒"
            />
            <FeatureCard
              title="Scalable"
              description="Grow from startup to enterprise. Our platform scales with your needs."
              icon="📈"
            />
            <FeatureCard
              title="Team Collaboration"
              description="Work together seamlessly with real-time collaboration tools."
              icon="👥"
            />
            <FeatureCard
              title="Analytics"
              description="Deep insights and analytics to help you make data-driven decisions."
              icon="📊"
            />
            <FeatureCard
              title="24/7 Support"
              description="Our dedicated support team is here to help you succeed."
              icon="💬"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of teams already using Clincial
          </p>
          <Link href="/auth/signup">
            <Button size="lg" variant="secondary">
              Start Your Free Trial
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Clincial</h3>
              <p className="text-gray-400">
                Building the future of productivity
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/#features">Features</Link></li>
                <li><Link href="/pricing">Pricing</Link></li>
                <li><Link href="/dashboard">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/#about">About</Link></li>
                <li><Link href="/blog">Blog</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/privacy">Privacy</Link></li>
                <li><Link href="/terms">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Clincial. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="p-6 bg-gray-50 rounded-lg hover:shadow-lg transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
