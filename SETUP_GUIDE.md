# Quick Start Guide - Clincial SaaS Platform

Congratulations! Your SaaS platform is now set up and ready for customization. This guide will help you get started.

## What's Been Created

Your repository now contains a complete, production-ready SaaS platform with:

### ✅ Core Features
- **Landing Page** - Professional homepage with hero, features, and CTA sections
- **Authentication** - Sign up/sign in with email/password and Google OAuth
- **User Dashboard** - Analytics, activity tracking, and account management
- **Pricing Page** - Three subscription tiers (Free, Pro, Enterprise)
- **Stripe Integration** - Complete payment processing and subscription management

### ✅ Technical Infrastructure
- **Next.js 14+** with App Router and TypeScript
- **PostgreSQL** database with Prisma ORM
- **NextAuth.js** for secure authentication
- **Tailwind CSS** for modern styling
- **API Routes** for all backend operations

## Next Steps

### 1. Set Up Your Development Environment

```bash
# Install dependencies (if not already done)
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and API keys
```

### 2. Configure Your Database

You need a PostgreSQL database. Options:

**Local (for development):**
```bash
# Install PostgreSQL locally or use Docker
docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres

# Update .env DATABASE_URL
DATABASE_URL="postgresql://postgres:password@localhost:5432/clincial?schema=public"
```

**Cloud (recommended for production):**
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Supabase](https://supabase.com) - Free tier available
- [Railway](https://railway.app) - Free tier available

After setting up your database:
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# View your database (optional)
npx prisma studio
```

### 3. Configure Stripe

1. **Create Stripe Account**: [https://stripe.com](https://stripe.com)

2. **Get API Keys**:
   - Go to Developers → API keys
   - Copy Secret key to `.env` as `STRIPE_SECRET_KEY`
   - Copy Publishable key to `.env` as `STRIPE_PUBLISHABLE_KEY`

3. **Create Products**:
   - Go to Products → Add product
   - Create: Basic ($29/month), Pro ($79/month), Enterprise (custom)
   - Copy each Price ID to `.env`

4. **Set Up Webhooks** (for local testing):
   ```bash
   # Install Stripe CLI
   brew install stripe/stripe-cli/stripe  # macOS
   # or download from: https://stripe.com/docs/stripe-cli

   # Forward webhooks to local
   stripe listen --forward-to localhost:3000/api/webhooks/stripe

   # Copy the webhook signing secret to .env
   ```

### 4. Set Up Authentication

**Generate NextAuth Secret:**
```bash
openssl rand -base64 32
# Copy output to .env as NEXTAUTH_SECRET
```

**Google OAuth (optional but recommended):**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Copy Client ID and Secret to `.env`

### 5. Run Your Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - you should see your landing page!

### 6. Test the Platform

**Try these features:**
1. Sign up for an account (email/password or Google)
2. View the dashboard
3. Check the pricing page
4. Test Stripe checkout (use test card: 4242 4242 4242 4242)

## Customization Guide

### Change Branding

**Update the name "Clincial":**
- `app/page.tsx` - Landing page hero
- `components/navigation.tsx` - Navigation bar
- `app/layout.tsx` - Page title and metadata
- `README.md` - Documentation

**Add your logo:**
- Replace SVG files in `public/` directory
- Update navigation component to use your logo

### Modify Colors/Styling

Edit `app/globals.css` or update Tailwind classes throughout the app.

**Primary color** is currently blue-600. Change all instances:
```bash
# Find and replace blue-600 with your color
# e.g., purple-600, green-600, etc.
```

### Add New Features

**New page:**
```bash
# Create app/your-page/page.tsx
# Add to navigation.tsx if needed
```

**New API endpoint:**
```bash
# Create app/api/your-endpoint/route.ts
export async function GET(req: Request) {
  return Response.json({ message: 'Hello' })
}
```

**New database model:**
1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add_feature`
3. Update API routes to use new model

### Restrict Features by Plan

```typescript
// In any server component or API route
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const session = await getServerSession(authOptions)
const subscription = await prisma.subscription.findFirst({
  where: { userId: session.user.id }
})

if (subscription.plan === 'free') {
  return Response.json({ error: 'Upgrade required' }, { status: 403 })
}
```

## Deployment to Production

### Vercel (Recommended)

1. **Push to GitHub**:
   ```bash
   git push origin main
   ```

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Vercel auto-detects Next.js

3. **Add Environment Variables**:
   - In Vercel dashboard, add ALL variables from `.env`
   - Update `NEXTAUTH_URL` to your production domain
   - Use production Stripe keys

4. **Set Up Production Database**:
   - Use Vercel Postgres, Supabase, or Railway
   - Update `DATABASE_URL` in Vercel
   - Run migrations: `npx prisma migrate deploy`

5. **Configure Stripe Webhooks**:
   - In Stripe Dashboard, add webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy webhook secret to Vercel environment variables

6. **Update OAuth**:
   - Add production redirect URI to Google OAuth settings
   - Update any other OAuth providers

## Important Files

- **README.md** - User documentation and setup guide
- **CLAUDE.md** - AI assistant guide for codebase
- **.env.example** - Template for environment variables
- **prisma/schema.prisma** - Database schema
- **lib/auth.ts** - Authentication configuration
- **lib/stripe.ts** - Stripe utilities

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run lint             # Run linter

# Database
npx prisma studio        # Database GUI
npx prisma migrate dev   # Create migration
npx prisma generate      # Generate Prisma client

# Stripe
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Troubleshooting

**Database connection fails:**
- Check DATABASE_URL is correct
- Ensure PostgreSQL is running
- Verify network/firewall settings

**Authentication not working:**
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your domain
- Ensure OAuth credentials are correct

**Stripe webhooks not received:**
- Check Stripe CLI is running (local)
- Verify webhook secret matches .env
- Check endpoint URL is accessible (production)

## Resources

- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **Prisma Docs**: [prisma.io/docs](https://www.prisma.io/docs)
- **NextAuth Docs**: [next-auth.js.org](https://next-auth.js.org)
- **Stripe Docs**: [stripe.com/docs](https://stripe.com/docs)
- **Tailwind CSS**: [tailwindcss.com](https://tailwindcss.com)

## Need Help?

1. Check the README.md for detailed documentation
2. Review CLAUDE.md for development guidelines
3. Check the troubleshooting section above
4. Search the official documentation for each technology

---

**You're all set!** Start customizing the platform for your specific SaaS business. The foundation is solid, secure, and production-ready. Good luck with your SaaS venture! 🚀
