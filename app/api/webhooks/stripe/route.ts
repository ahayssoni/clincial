import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = (await headers()).get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  const session = event.data.object as Stripe.Checkout.Session

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      // Payment successful, activate subscription
      if (session.mode === 'subscription') {
        const subscriptionId = session.subscription as string
        const customerId = session.customer as string

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)

        await prisma.subscription.updateMany({
          where: {
            stripeCustomerId: customerId
          },
          data: {
            stripeSubscriptionId: subscriptionId,
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
            status: 'active'
          }
        })
      }
      break

    case 'customer.subscription.updated':
      const updatedSubscription = event.data.object as Stripe.Subscription

      await prisma.subscription.updateMany({
        where: {
          stripeSubscriptionId: updatedSubscription.id
        },
        data: {
          stripePriceId: updatedSubscription.items.data[0].price.id,
          stripeCurrentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
          status: updatedSubscription.status === 'active' ? 'active' : 'canceled'
        }
      })
      break

    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object as Stripe.Subscription

      await prisma.subscription.updateMany({
        where: {
          stripeSubscriptionId: deletedSubscription.id
        },
        data: {
          status: 'canceled',
          plan: 'free'
        }
      })
      break

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
