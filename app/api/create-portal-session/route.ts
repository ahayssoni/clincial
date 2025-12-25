import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createBillingPortalSession } from '@/lib/stripe'
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

    // Get user's subscription
    const subscription = await prisma.subscription.findFirst({
      where: { userId: session.user.id }
    })

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 400 }
      )
    }

    // Create billing portal session
    const portalSession = await createBillingPortalSession({
      customerId: subscription.stripeCustomerId,
      returnUrl: `${process.env.NEXTAUTH_URL}/dashboard`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error('Error creating portal session:', error)
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}
