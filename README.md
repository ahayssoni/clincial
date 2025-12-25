# Clincial - SaaS Platform

A modern, full-stack SaaS platform built with Next.js 14+, TypeScript, Prisma, and Stripe for subscription management.

## Features

- **Authentication** - NextAuth.js with email/password and Google OAuth
- **Database** - PostgreSQL with Prisma ORM
- **Payments** - Stripe integration for subscriptions
- **UI** - Tailwind CSS for modern, responsive design
- **TypeScript** - Full type safety throughout the application
- **API Routes** - RESTful API endpoints for all operations

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **Styling**: Tailwind CSS
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Stripe account (for payments)
- Google OAuth credentials (optional, for Google sign-in)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd clincial
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

   Update `.env` with your values:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/clincial?schema=public"

   # NextAuth.js
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"  # Generate with: openssl rand -base64 32

   # Google OAuth (optional)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"

   # Stripe
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."

   # Stripe Price IDs (from Stripe dashboard)
   STRIPE_PRICE_ID_BASIC="price_..."
   STRIPE_PRICE_ID_PRO="price_..."
   STRIPE_PRICE_ID_ENTERPRISE="price_..."
   ```

4. **Set up the database**

   Generate Prisma client:
   ```bash
   npx prisma generate
   ```

   Run database migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

   (Optional) Seed the database:
   ```bash
   npx prisma db seed
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to see your application.

## Project Structure

```
clincial/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   ├── auth/             # Authentication endpoints
│   │   ├── webhooks/         # Stripe webhooks
│   │   └── ...
│   ├── auth/                 # Auth pages (signin, signup)
│   ├── dashboard/            # Dashboard pages
│   ├── pricing/              # Pricing page
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Landing page
│   └── globals.css           # Global styles
├── components/               # React components
│   ├── ui/                   # UI components
│   ├── navigation.tsx
│   └── session-provider.tsx
├── lib/                      # Utility libraries
│   ├── auth.ts               # NextAuth configuration
│   ├── prisma.ts             # Prisma client
│   └── stripe.ts             # Stripe utilities
├── prisma/                   # Database schema and migrations
│   └── schema.prisma
├── types/                    # TypeScript type definitions
├── .env                      # Environment variables (not in git)
├── .env.example              # Example environment variables
├── CLAUDE.md                 # AI assistant documentation
└── README.md                 # This file
```

## Database Schema

The application uses the following main models:

- **User** - User accounts with authentication
- **Account** - OAuth provider accounts
- **Session** - NextAuth sessions
- **Subscription** - User subscriptions and Stripe data
- **VerificationToken** - Email verification tokens

To view the database schema:
```bash
npx prisma studio
```

## Setting Up Stripe

### 1. Create Stripe Account
- Sign up at [https://stripe.com](https://stripe.com)
- Get your API keys from the Dashboard

### 2. Create Products and Prices
1. Go to Products in Stripe Dashboard
2. Create three products: Basic, Pro, Enterprise
3. Add recurring prices (monthly) to each
4. Copy the Price IDs to your `.env` file

### 3. Set Up Webhooks
1. Install Stripe CLI: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
2. Forward webhooks to local:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
3. Copy the webhook signing secret to `.env`

For production:
1. Add webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
2. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
3. Copy the signing secret to your production environment

## Setting Up Google OAuth (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret to `.env`

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

Vercel will automatically:
- Install dependencies
- Build the application
- Set up continuous deployment

### Database for Production

Options:
- **Vercel Postgres** - Easy integration
- **Supabase** - Free PostgreSQL with extras
- **PlanetScale** - Serverless MySQL (requires schema changes)
- **Railway** - PostgreSQL with free tier

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio
- `npx prisma migrate dev` - Run database migrations
- `npx prisma generate` - Generate Prisma client

## Features Roadmap

The following features are set up and ready to customize:

- ✅ User authentication (email + OAuth)
- ✅ Landing page with features section
- ✅ Pricing page with three tiers
- ✅ User dashboard
- ✅ Stripe subscription management
- ✅ Database with Prisma ORM
- ⬜ Email notifications
- ⬜ Team/organization support
- ⬜ Advanced analytics
- ⬜ API rate limiting
- ⬜ Admin dashboard
- ⬜ User onboarding flow

## Customization Guide

### Change Branding

1. Update `Clincial` name in:
   - `app/page.tsx` - Landing page
   - `components/navigation.tsx` - Navigation
   - `app/layout.tsx` - Page title
   - `README.md` - This file

2. Add your logo:
   - Replace SVGs in `public/` directory
   - Update logo in navigation component

### Modify Pricing Plans

1. Update Stripe products and prices
2. Update environment variables with new Price IDs
3. Modify `app/pricing/page.tsx` with new plans
4. Update Prisma schema if adding new plan types

### Customize Landing Page

Edit `app/page.tsx`:
- Change hero text and description
- Update features list
- Modify CTA sections
- Update footer links

### Add New Features

1. Create new pages in `app/` directory
2. Add API routes in `app/api/`
3. Create components in `components/`
4. Update database schema in `prisma/schema.prisma`
5. Run migrations: `npx prisma migrate dev`

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correct
- Ensure PostgreSQL is running
- Check firewall/network settings

### Authentication Not Working
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your domain
- Verify OAuth credentials are correct

### Stripe Webhooks Failing
- Ensure webhook secret is correct
- Check Stripe CLI is running (local)
- Verify webhook endpoint is accessible (production)

### Build Errors
- Run `npm install` to ensure all dependencies are installed
- Delete `.next` folder and rebuild
- Check TypeScript errors with `npm run lint`

## Support

For issues with:
- **Next.js**: [Next.js Documentation](https://nextjs.org/docs)
- **Prisma**: [Prisma Documentation](https://www.prisma.io/docs)
- **NextAuth**: [NextAuth.js Documentation](https://next-auth.js.org)
- **Stripe**: [Stripe Documentation](https://stripe.com/docs)

## License

This project is for educational and commercial use. Modify as needed for your SaaS business.

## Next Steps

1. Set up your database and run migrations
2. Configure Stripe products and webhooks
3. Customize the branding and content
4. Add your specific business logic
5. Set up email notifications
6. Configure production deployment
7. Add analytics and monitoring
8. Implement your unique features

Happy building! 🚀
