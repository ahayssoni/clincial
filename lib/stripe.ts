import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

export const getStripeCustomer = async (email: string, userId: string) => {
  const customers = await stripe.customers.list({
    email: email,
    limit: 1
  })

  if (customers.data.length > 0) {
    return customers.data[0]
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email: email,
    metadata: {
      userId: userId
    }
  })

  return customer
}

export const createCheckoutSession = async ({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
}: {
  customerId: string
  priceId: string
  successUrl: string
  cancelUrl: string
}) => {
  return await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
  })
}

export const createBillingPortalSession = async ({
  customerId,
  returnUrl,
}: {
  customerId: string
  returnUrl: string
}) => {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}
