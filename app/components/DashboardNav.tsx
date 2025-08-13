'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Wallet, Users, Gift, TrendingUp } from 'lucide-react'

export function DashboardNav() {
  const pathname = usePathname()

  const navItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: Home,
      exact: true
    },
    {
      href: '/dashboard/rewards',
      label: 'Rewards',
      icon: Gift
    },
    {
      href: '/dashboard/splits',
      label: 'Splits',
      icon: Users
    }
  ]

  return (
    <div className="bg-white border-b border-gray-200 mb-6">
      <div className="max-w-6xl mx-auto px-6">
        <nav className="flex space-x-6">
          {navItems.map((item) => {
            const isActive = item.exact 
              ? pathname === item.href 
              : pathname.startsWith(item.href)
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}