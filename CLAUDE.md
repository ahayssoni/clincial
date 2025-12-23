# CLAUDE.md - AI Assistant Guide for clincial

**Last Updated:** 2025-12-23
**Repository:** ahayssoni/clincial
**Current Status:** Production-Ready SaaS Platform

---

## Table of Contents

1. [Repository Overview](#repository-overview)
2. [Project Purpose](#project-purpose)
3. [Codebase Structure](#codebase-structure)
4. [Development Workflow](#development-workflow)
5. [Git Conventions](#git-conventions)
6. [Code Style & Conventions](#code-style--conventions)
7. [Testing Practices](#testing-practices)
8. [Deployment](#deployment)
9. [AI Assistant Guidelines](#ai-assistant-guidelines)
10. [Common Tasks](#common-tasks)

---

## Repository Overview

**Repository Name:** clincial
**Repository URL:** ahayssoni/clincial
**Initial Commit:** 2cc97f2 - December 12, 2025
**Current Branch:** claude/add-claude-documentation-eaGrw
**Project Type:** Full-Stack SaaS Platform
**Tech Stack:** Next.js 14+, TypeScript, Prisma, PostgreSQL, Stripe

### Current State

This repository is a production-ready SaaS platform with:
- Next.js 14+ with App Router and TypeScript
- Authentication system (NextAuth.js with email/password + Google OAuth)
- PostgreSQL database with Prisma ORM
- Stripe integration for subscriptions
- Landing page, pricing page, and dashboard
- Complete API routes for auth and payments
- Tailwind CSS for styling

**The platform is ready for customization and deployment.**

---

## Project Purpose

**Clincial** is a modern, full-stack SaaS platform template designed to help businesses quickly launch subscription-based services. The platform provides:

- **Complete Authentication System** - User registration, login, and OAuth integration
- **Subscription Management** - Stripe-powered payment processing and subscription handling
- **User Dashboard** - Analytics, activity tracking, and account management
- **Marketing Pages** - Professional landing page and pricing tiers
- **Developer-Friendly** - TypeScript, modern frameworks, and comprehensive documentation

**Target Users:** Entrepreneurs and developers building SaaS products who need a solid foundation to start from rather than building everything from scratch.

**Customization:** While "Clincial" is the current brand name, it's designed to be easily rebranded for any SaaS use case (project management, analytics, CRM, etc.).

---

## Codebase Structure

The project follows Next.js 14+ App Router conventions:

```
clincial/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── [...nextauth]/    # NextAuth.js handler
│   │   │   └── register/         # User registration
│   │   ├── create-checkout-session/  # Stripe checkout
│   │   ├── create-portal-session/    # Stripe billing portal
│   │   └── webhooks/
│   │       └── stripe/           # Stripe webhook handler
│   ├── auth/                     # Auth pages
│   │   ├── signin/               # Sign in page
│   │   └── signup/               # Sign up page
│   ├── dashboard/                # Dashboard pages
│   │   └── page.tsx              # Main dashboard
│   ├── pricing/                  # Pricing page
│   │   └── page.tsx
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Landing page
│   ├── globals.css               # Global styles
│   └── favicon.ico
├── components/                   # React components
│   ├── ui/                       # Reusable UI components
│   │   └── button.tsx
│   ├── navigation.tsx            # Main navigation
│   └── session-provider.tsx     # NextAuth session wrapper
├── lib/                          # Utility libraries
│   ├── auth.ts                   # NextAuth configuration
│   ├── prisma.ts                 # Prisma client instance
│   └── stripe.ts                 # Stripe utilities
├── prisma/                       # Database
│   └── schema.prisma             # Database schema
├── types/                        # TypeScript definitions
│   └── next-auth.d.ts            # NextAuth type extensions
├── public/                       # Static files
├── .env                          # Environment variables (gitignored)
├── .env.example                  # Env template
├── .gitignore
├── CLAUDE.md                     # This file
├── README.md                     # User documentation
├── next.config.ts                # Next.js config
├── tailwind.config.ts            # Tailwind config
├── tsconfig.json                 # TypeScript config
└── package.json                  # Dependencies
```

### Key Directories

- **app/** - All pages and API routes (Next.js App Router)
- **components/** - Reusable React components
- **lib/** - Shared utilities and configurations
- **prisma/** - Database schema and migrations
- **types/** - TypeScript type definitions

---

## Development Workflow

### Branch Strategy

This project uses feature branches with a specific naming convention:

**Branch Naming Pattern:** `claude/[description]-[session-id]`

**Example:** `claude/add-claude-documentation-eaGrw`

**Rules:**
- All development branches MUST start with `claude/`
- All development branches MUST end with the matching session ID
- Branch names should be descriptive and kebab-case
- Never push to branches that don't match this pattern (will fail with 403)

### Development Process

1. **Create/checkout feature branch:**
   ```bash
   git checkout -b claude/[feature-description]-[session-id]
   ```

2. **Make changes and commit:**
   ```bash
   git add [files]
   git commit -m "Clear, descriptive commit message"
   ```

3. **Push to remote:**
   ```bash
   git push -u origin claude/[branch-name]
   ```
   - If network errors occur, retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s)

4. **Create pull request** (when requested):
   ```bash
   gh pr create --title "PR title" --body "PR description"
   ```

### Commit Message Guidelines

**Format:** Use clear, imperative mood commit messages

**Good examples:**
- "Add user authentication module"
- "Fix null pointer exception in data parser"
- "Update documentation for API endpoints"
- "Refactor database connection logic"

**Bad examples:**
- "updates" (too vague)
- "Fixed stuff" (not descriptive)
- "WIP" (work in progress should not be final commit message)

**Structure for detailed commits:**
```
Brief summary (50 chars or less)

More detailed explanation if needed. Wrap at 72 characters.
Explain the problem this commit solves and why this approach
was chosen.

- Bullet points are okay
- Use present tense: "Add feature" not "Added feature"
```

---

## Git Conventions

### Network Resilience

All git network operations (push, fetch, pull) should implement retry logic:

**Retry strategy:**
- Maximum 4 retry attempts
- Exponential backoff: 2s, 4s, 8s, 16s
- Only retry on network failures, not authentication/permission errors

**Example retry implementation:**
```bash
# Push with retry logic
for i in 1 2 3 4; do
  git push -u origin [branch-name] && break ||
  ([ $i -lt 4 ] && sleep $((2**i)) || exit 1)
done
```

### Fetching and Pulling

**Prefer specific branches:**
```bash
git fetch origin [branch-name]
git pull origin [branch-name]
```

**Avoid:**
```bash
git fetch --all  # Too broad, slower
git pull         # Ambiguous source
```

---

## Code Style & Conventions

### Next.js & TypeScript Standards

This project uses Next.js 14+ with TypeScript. Follow these conventions:

**File naming:**
- React components: PascalCase (`Button.tsx`, `Navigation.tsx`)
- Utilities and hooks: camelCase (`auth.ts`, `stripe.ts`)
- Pages: lowercase (`page.tsx`, `layout.tsx`)
- API routes: lowercase (`route.ts`)

**Component structure:**
- Use functional components with TypeScript
- Props should be properly typed with interfaces
- Server components by default, use `'use client'` only when needed
- Export components as default from pages, named exports from utilities

**Code organization:**
- Keep components small and focused
- Extract repeated logic into custom hooks or utilities
- Group related functionality in directories
- Use barrel exports sparingly

### General Principles

1. **Simplicity over cleverness** - Write clear, readable code
2. **Avoid over-engineering** - Don't add features not explicitly requested
3. **Security first** - Always consider OWASP top 10 vulnerabilities
4. **Minimal abstraction** - Don't create abstractions for one-time use
5. **No premature optimization** - Optimize when there's a proven need

### Code Quality Standards

**DO:**
- Write self-documenting code with clear variable/function names
- Add comments only where logic isn't self-evident
- Validate at system boundaries (user input, external APIs)
- Handle errors gracefully
- Keep functions focused and single-purpose

**DON'T:**
- Add features beyond what was requested
- Refactor working code unnecessarily
- Add error handling for impossible scenarios
- Create helper functions for one-time operations
- Use feature flags without explicit requirement

### Security Guidelines

Always protect against:
- **Command Injection** - Sanitize all shell/system commands
- **XSS (Cross-Site Scripting)** - Escape user input in HTML/JS
- **SQL Injection** - Use parameterized queries
- **Path Traversal** - Validate file paths
- **Authentication/Authorization** - Properly implement access controls
- **Sensitive Data Exposure** - Never commit secrets, API keys, passwords

**Never commit:**
- `.env` files with secrets
- `credentials.json` or similar
- API keys or tokens
- Private keys
- Database passwords

---

## Testing Practices

> **Status:** To be established

### Testing Strategy (Template)

Once a testing framework is chosen, document:

1. **Test types used:**
   - Unit tests
   - Integration tests
   - End-to-end tests
   - Other (specify)

2. **Testing framework:** [To be determined]

3. **Running tests:**
   ```bash
   # Command to run all tests
   # Command to run specific tests
   # Command to run with coverage
   ```

4. **Test coverage requirements:**
   - Minimum coverage percentage (if any)
   - Critical paths that must be tested
   - Areas that can skip tests

5. **Writing tests:**
   - Test file naming conventions
   - Test organization patterns
   - Mock/stub strategies

---

## Deployment

### Recommended: Vercel

This Next.js application is optimized for Vercel deployment:

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Import in Vercel:**
   - Go to vercel.com
   - Import your GitHub repository
   - Vercel auto-detects Next.js

3. **Configure Environment Variables:**
   Add all variables from `.env` in Vercel dashboard:
   - DATABASE_URL
   - NEXTAUTH_URL (your production URL)
   - NEXTAUTH_SECRET
   - GOOGLE_CLIENT_ID/SECRET
   - All STRIPE_* variables

4. **Deploy:**
   - Vercel builds and deploys automatically
   - Every push to main triggers redeployment

### Database Options

**Production databases:**
- **Vercel Postgres** - Native integration
- **Supabase** - PostgreSQL with extras
- **Railway** - Simple PostgreSQL hosting
- **PlanetScale** - Serverless (requires MySQL adapter)

After choosing, update DATABASE_URL and run:
```bash
npx prisma migrate deploy
```

### Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Stripe webhooks configured for production URL
- [ ] Google OAuth redirect URIs updated
- [ ] NEXTAUTH_URL set to production domain
- [ ] Build succeeds locally (`npm run build`)
- [ ] .env is gitignored (never commit secrets)

---

## AI Assistant Guidelines

### Working with This Repository

**Before making changes:**

1. **Read before writing** - Always read files before modifying them
2. **Understand context** - Review related files to understand the codebase
3. **Check for patterns** - Look for existing code patterns to maintain consistency
4. **Search comprehensively** - Use search tools to find all occurrences

**When implementing features:**

1. **Use TodoWrite tool** - Track tasks and show progress
2. **Ask for clarification** - If requirements are unclear, ask before implementing
3. **Make focused changes** - Only change what's necessary
4. **Test your changes** - Run tests if they exist
5. **Update documentation** - Keep CLAUDE.md and other docs current

**Code modification workflow:**

```
1. Read relevant files
2. Plan changes (use TodoWrite for complex tasks)
3. Make minimal necessary changes
4. Test changes
5. Commit with clear message
6. Update documentation if needed
```

### Tool Usage Preferences

**For file operations:**
- Use `Read` for reading files (not `cat`)
- Use `Edit` for modifying files (not `sed/awk`)
- Use `Write` for creating new files (not `echo >`)
- Use `Glob` for finding files by pattern (not `find`)
- Use `Grep` for searching file contents (not `grep/rg`)

**For exploration:**
- Use `Task` tool with `subagent_type=Explore` for codebase exploration
- Don't manually search when exploring architecture or patterns
- Use specialized agents for complex multi-step tasks

**For git operations:**
- Use `Bash` tool for git commands
- Always include descriptive `description` parameter
- Run independent commands in parallel when possible
- Chain dependent commands with `&&`

### Communication Style

**When interacting with users:**
- Be concise and direct
- Don't use emojis unless explicitly requested
- Focus on technical accuracy over validation
- Provide objective guidance, even if it disagrees with user assumptions
- Output text directly, never use bash echo to communicate

### Security Awareness

**Always check for:**
- Hardcoded credentials or secrets
- SQL injection vulnerabilities
- Command injection risks
- XSS vulnerabilities
- Insecure file operations
- OWASP top 10 vulnerabilities

**If you introduce a vulnerability:**
- Immediately fix it
- Explain what was wrong
- Provide the secure alternative

### Error Handling

**When encountering errors:**
1. Read and understand the error message
2. Check relevant code and configuration
3. Search for similar issues in the codebase
4. Propose a fix with explanation
5. Test the fix if possible

**Don't:**
- Ignore errors and continue
- Make blind changes hoping they'll work
- Add generic try/catch blocks without proper handling

---

## Common Tasks

### Development Workflow

**Running the application locally:**
```bash
npm run dev
# Opens at http://localhost:3000
```

**Building for production:**
```bash
npm run build
npm start
```

**Linting:**
```bash
npm run lint
```

### Database Operations

**Generate Prisma client:**
```bash
npx prisma generate
```

**Create a migration:**
```bash
npx prisma migrate dev --name description_of_changes
```

**Apply migrations to production:**
```bash
npx prisma migrate deploy
```

**Open Prisma Studio (database GUI):**
```bash
npx prisma studio
# Opens at http://localhost:5555
```

**Reset database (development only):**
```bash
npx prisma migrate reset
```

### Stripe Management

**Test webhooks locally:**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the webhook signing secret to .env
```

**Create test products:**
1. Go to Stripe Dashboard → Products
2. Create products for each tier
3. Add monthly recurring prices
4. Copy Price IDs to .env

### Common Modifications

**Adding a new page:**
1. Create `app/your-page/page.tsx`
2. Add route to navigation if needed
3. Update sitemap/SEO as needed

**Adding a new API endpoint:**
1. Create `app/api/your-endpoint/route.ts`
2. Export GET, POST, etc. functions
3. Add authentication if needed
4. Update types if necessary

**Adding a database model:**
1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add_model_name`
3. Update relevant API routes and pages
4. Generate new Prisma client

**Customizing authentication:**
1. Edit `lib/auth.ts` for NextAuth config
2. Modify `app/api/auth/[...nextauth]/route.ts` if needed
3. Update UI in `app/auth/signin` or `signup`

### SaaS-Specific Tasks

**Adding a new subscription tier:**
1. Create product/price in Stripe dashboard
2. Copy Price ID to .env
3. Update `app/pricing/page.tsx`
4. Update Prisma schema if new features needed
5. Update dashboard to show tier-specific features

**Restricting features by plan:**
```typescript
// In your component or API route
const subscription = await prisma.subscription.findFirst({
  where: { userId: session.user.id }
})

if (subscription.plan === 'free') {
  // Restrict access
}
```

**Managing user subscriptions:**
- Users can upgrade/downgrade via Stripe billing portal
- Access via "Manage Subscription" button (implement in dashboard)
- Uses `/api/create-portal-session` endpoint

### Debugging

**Check environment variables:**
```bash
# Ensure all required vars are set
cat .env
```

**View logs:**
- Development: Check terminal running `npm run dev`
- Production (Vercel): Vercel dashboard → Your project → Logs

**Database issues:**
```bash
# Check connection
npx prisma db pull

# View current schema
npx prisma studio
```

**Authentication issues:**
- Check NEXTAUTH_SECRET is set
- Verify NEXTAUTH_URL matches current domain
- Check OAuth credentials are correct

---

## Updating This Document

This CLAUDE.md file should be updated whenever:

- Project structure changes significantly
- New development workflows are established
- Technology stack is chosen or changes
- Coding conventions are defined or modified
- New common tasks are identified
- Deployment processes change
- Testing practices are established or updated

**Update frequency:** Keep this document current with the codebase. An outdated CLAUDE.md is worse than no CLAUDE.md.

**Ownership:** This document is maintained collectively. Any AI assistant or developer working on the project should update it when making significant changes.

---

## Questions or Issues

If you encounter situations not covered in this guide:

1. Check the README.md for additional context
2. Review existing code for patterns and conventions
3. Search for similar examples in the codebase
4. Ask the user for clarification
5. Update this document with the resolution

---

**Document Version:** 1.0.0
**Created by:** AI Assistant (Claude)
**Last Updated:** 2025-12-23
