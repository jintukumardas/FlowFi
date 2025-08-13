'use client'

import { useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, Zap, Users, Gift, TrendingUp, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const [isLoading, setIsLoading] = useState(false)

  const startDemo = async () => {
    setIsLoading(true)
    try {
      // Connect to wallet if not connected
      if (!isConnected) {
        const injectedConnector = connectors.find(c => c.id === 'injected')
        if (injectedConnector) {
          await connect({ connector: injectedConnector })
        }
      }
      // Simulate demo setup delay
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (error) {
      console.error('Demo setup error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const features = [
    {
      icon: <Zap className="h-8 w-8 text-blue-600" />,
      title: "Smart Payments",
      description: "Recurring subscriptions with dynamic pricing and automatic execution"
    },
    {
      icon: <Users className="h-8 w-8 text-green-600" />,
      title: "Social Splits", 
      description: "Split bills with friends using on-chain verification and group management"
    },
    {
      icon: <Gift className="h-8 w-8 text-purple-600" />,
      title: "Cashback Rewards",
      description: "Earn FFI tokens on every payment with tier-based bonus multipliers"
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-orange-600" />,
      title: "Auto Yield",
      description: "Idle balances automatically generate yield through smart contracts"
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"></div>
          <span className="text-2xl font-bold text-gray-900">FlowFi</span>
        </div>
        
        <div className="flex items-center space-x-4">
          {isConnected ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <Button variant="outline" onClick={() => disconnect()}>
                Disconnect
              </Button>
              <Link href="/dashboard">
                <Button>Dashboard</Button>
              </Link>
            </div>
          ) : (
            <Button onClick={() => connect({ connector: connectors[0] })}>
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="text-center py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Consumer Payment Infrastructure
            <span className="block text-blue-600 mt-2">with Smart Rewards</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            FlowFi enables smart recurring payments, social split bills, and automatic rewards 
            on Morph L2. Built for the PayFi future.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={startDemo}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg animate-pulse-glow"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Setting up demo...
                </>
              ) : (
                <>
                  Try Demo Mode
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
            
            <div className="text-sm text-gray-500">
              <span className="font-medium">3-click demo:</span> Pay → Earn → Stake
            </div>
          </div>

          {isLoading && (
            <Card className="max-w-md mx-auto mt-8 border-blue-200">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm">Connecting to Morph testnet...</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-sm">Funding test wallet from faucet...</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm">Initializing demo merchant...</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why FlowFi on Morph L2?
            </h2>
            <p className="text-lg text-gray-600">
              Built for consumer-scale payments with optimistic + ZK architecture
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow card-gradient">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Morph L2 Advantages
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-600">~$0.01</div>
              <div className="text-sm text-gray-600">Average transaction cost</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">~2s</div>
              <div className="text-sm text-gray-600">Transaction finality</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-purple-600">100%</div>
              <div className="text-sm text-gray-600">EVM compatible</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <p className="mb-4">
            Built for Morph Consumer Buildathon 2025
          </p>
          <div className="flex justify-center space-x-6 text-sm">
            <a href="https://docs.morphl2.io" target="_blank" rel="noopener noreferrer" 
               className="hover:text-blue-400 transition-colors">
              Morph Docs
            </a>
            <a href="https://morphfaucet.com" target="_blank" rel="noopener noreferrer"
               className="hover:text-blue-400 transition-colors">
              Testnet Faucet
            </a>
            <a href="https://explorer-testnet.morphl2.io" target="_blank" rel="noopener noreferrer"
               className="hover:text-blue-400 transition-colors">
              Block Explorer
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}