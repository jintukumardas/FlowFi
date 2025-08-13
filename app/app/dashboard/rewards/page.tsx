'use client'

import { useState } from 'react'
import { useAccount, useBalance } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Gift, Star, TrendingUp, Clock, Award, Zap } from 'lucide-react'
import Link from 'next/link'
import { useFlowFi } from '@/hooks/useFlowFi'
import { FlowFiIcon } from '@/components/FlowFiIcon'
import { DashboardNav } from '@/components/DashboardNav'

export default function RewardsPage() {
  const { address, isConnected } = useAccount()
  const { data: balance } = useBalance({ address })
  const { demoStaking, isLoading, currentStep, ffiBalance, userRewards, stakeInfo } = useFlowFi()

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>Please connect your wallet to view rewards</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalRewardsEarned = parseFloat(userRewards) + parseFloat(ffiBalance)
  const stakedAmount = stakeInfo?.amount ? parseFloat(stakeInfo.amount.toString()) / 1e18 : 0
  
  // Calculate tier based on staked amount
  const getTier = (stakedAmount: number) => {
    if (stakedAmount >= 1) return { name: 'Gold', bonus: '5%', color: 'text-yellow-600' }
    if (stakedAmount >= 0.5) return { name: 'Silver', bonus: '3%', color: 'text-gray-500' }
    return { name: 'Bronze', bonus: '1%', color: 'text-orange-600' }
  }

  const currentTier = getTier(stakedAmount)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <ArrowLeft className="h-5 w-5" />
            <FlowFiIcon />
            <span className="text-2xl font-bold text-gray-900">FlowFi Rewards</span>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </div>
          <div className="text-sm font-medium">
            {balance?.formatted?.slice(0, 6)} ETH
          </div>
        </div>
      </nav>

      <DashboardNav />

      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rewards Dashboard</h1>
          <p className="text-gray-600">Track your FFI rewards and staking benefits</p>
        </div>

        {/* Rewards Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 flex items-center">
                <Gift className="h-4 w-4 mr-1" />
                Available FFI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{parseFloat(ffiBalance).toFixed(4)} FFI</div>
              <p className="text-xs text-purple-600">Ready to stake</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700 flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                Total Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{totalRewardsEarned.toFixed(4)} FFI</div>
              <p className="text-xs text-green-600">Lifetime rewards</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 flex items-center">
                <Zap className="h-4 w-4 mr-1" />
                Staked Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{stakedAmount.toFixed(4)} FFI</div>
              <p className="text-xs text-blue-600">Earning yield</p>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 flex items-center">
                <Award className="h-4 w-4 mr-1" />
                Tier Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${currentTier.color}`}>{currentTier.name}</div>
              <p className="text-xs text-orange-600">{currentTier.bonus} reward bonus</p>
            </CardContent>
          </Card>
        </div>

        {/* Staking Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <span>Stake FFI Tokens</span>
            </CardTitle>
            <CardDescription>
              Stake your FFI tokens to earn additional rewards and unlock tier benefits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">Staking Benefits</h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Earn 8% APY on staked FFI tokens</li>
                    <li>• Unlock tier-based reward multipliers</li>
                    <li>• Access to exclusive features</li>
                    <li>• Vote on protocol governance</li>
                  </ul>
                </div>
                
                {parseFloat(ffiBalance) > 0 ? (
                  <Button 
                    onClick={demoStaking}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {currentStep || 'Staking...'}
                      </>
                    ) : (
                      `Stake ${parseFloat(ffiBalance).toFixed(4)} FFI Tokens`
                    )}
                  </Button>
                ) : (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 text-sm">No FFI tokens available to stake</p>
                    <p className="text-gray-500 text-xs mt-1">Make payments to earn FFI rewards</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-3">Tier System</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 rounded bg-white">
                      <span className="text-sm font-medium text-orange-600">Bronze (0+ FFI)</span>
                      <span className="text-xs text-gray-600">+1% rewards</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-white">
                      <span className="text-sm font-medium text-gray-500">Silver (0.5+ FFI)</span>
                      <span className="text-xs text-gray-600">+3% rewards</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-white">
                      <span className="text-sm font-medium text-yellow-600">Gold (1+ FFI)</span>
                      <span className="text-xs text-gray-600">+5% rewards</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Rewards Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span>Recent Rewards Activity</span>
            </CardTitle>
            <CardDescription>Your latest reward earnings and staking activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {parseFloat(userRewards) > 0 || parseFloat(ffiBalance) > 0 ? (
                <div className="space-y-3">
                  {parseFloat(ffiBalance) > 0 && (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-green-800">Payment Rewards Earned</p>
                          <p className="text-sm text-green-600">From merchant payments</p>
                        </div>
                      </div>
                      <div className="text-green-800 font-semibold">+{parseFloat(ffiBalance).toFixed(4)} FFI</div>
                    </div>
                  )}
                  
                  {stakedAmount > 0 && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-blue-800">Tokens Staked</p>
                          <p className="text-sm text-blue-600">Earning 8% APY</p>
                        </div>
                      </div>
                      <div className="text-blue-800 font-semibold">{stakedAmount.toFixed(4)} FFI</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Gift className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Rewards Yet</h3>
                  <p className="text-gray-600 mb-4">Make your first payment to start earning FFI rewards</p>
                  <Link href="/dashboard">
                    <Button variant="outline">Make a Payment</Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}