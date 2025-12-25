'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Button } from './ui/button'

export default function Navigation() {
  const { data: session } = useSession()

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Clincial
            </Link>
            <div className="hidden md:flex ml-10 space-x-8">
              <Link href="/#features" className="text-gray-700 hover:text-blue-600">
                Features
              </Link>
              <Link href="/pricing" className="text-gray-700 hover:text-blue-600">
                Pricing
              </Link>
              <Link href="/#about" className="text-gray-700 hover:text-blue-600">
                About
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {session ? (
              <>
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">Dashboard</Button>
                </Link>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => signOut()}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="outline" size="sm">Sign In</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="primary" size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
