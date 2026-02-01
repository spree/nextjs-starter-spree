'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

function extractBasePath(pathname: string): string {
  const match = pathname.match(/^\/([a-z]{2})\/([a-z]{2})(\/|$)/i)
  if (match) {
    return `/${match[1]}/${match[2]}`
  }
  return ''
}

export default function AccountPage() {
  const pathname = usePathname()
  const basePath = extractBasePath(pathname)

  // TODO: Implement authentication
  const isAuthenticated = false

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
          <p className="mt-2 text-gray-500">
            Sign in to access your account and order history.
          </p>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-500">Don&apos;t have an account? </span>
            <Link href={`${basePath}/account/register`} className="text-indigo-600 hover:text-indigo-700 font-medium">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Account</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href={`${basePath}/account/orders`}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <h2 className="text-lg font-medium text-gray-900">Order History</h2>
          <p className="mt-2 text-gray-500">View your past orders and track shipments.</p>
        </Link>

        <Link
          href={`${basePath}/account/addresses`}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <h2 className="text-lg font-medium text-gray-900">Addresses</h2>
          <p className="mt-2 text-gray-500">Manage your shipping and billing addresses.</p>
        </Link>

        <Link
          href={`${basePath}/account/profile`}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <h2 className="text-lg font-medium text-gray-900">Profile</h2>
          <p className="mt-2 text-gray-500">Update your account information.</p>
        </Link>
      </div>
    </div>
  )
}
