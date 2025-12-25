import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getStripeCustomer, createCheckoutSession } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { priceId } = await req.json()

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      )
    }

    // Get or create Stripe customer
    const customer = await getStripeCustomer(
      session.user.email,
      session.user.id
    )

    // Update user's subscription with customer ID
    await prisma.subscription.updateMany({
      where: { userId: session.user.id },
      data: { stripeCustomerId: customer.id }
    })

    // Create checkout session
    const checkoutSession = await createCheckoutSession({
      customerId: customer.id,
      priceId,
      successUrl: `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
      cancelUrl: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
