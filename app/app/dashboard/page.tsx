'use client'

import { useState } from 'react'
import { useAccount, useBalance } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Wallet, Gift, TrendingUp, Users, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { CONTRACT_ADDRESSES } from '@/lib/config'
import { useFlowFi } from '@/hooks/useFlowFi'
import { FlowFiIcon } from '@/components/FlowFiIcon'
import { PaymentModal } from '@/components/PaymentModal'
import { YieldVaultModal } from '@/components/YieldVaultModal'
import { SplitModal } from '@/components/SplitModal'
import { DashboardNav } from '@/components/DashboardNav'

export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const { data: balance } = useBalance({ address })
  const { 
    makePayment, 
    createSplit, 
    depositToVault, 
    withdrawFromVault, 
    isLoading, 
    currentStep, 
    hash, 
    ffiBalance, 
    vaultBalance, 
    userRewards,
    vaultYield,
    userTier,
    tierProgress,
    totalPayments,
    activeSplitsCount,
    recentPayments,
    stats
  } = useFlowFi()
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isYieldModalOpen, setIsYieldModalOpen] = useState(false)
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false)

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>Please connect your wallet to access the dashboard</CardDescription>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-1.5">
            <FlowFiIcon />
            <span className="text-2xl font-bold text-gray-900 -ml-0.5 tracking-tight">FlowFi</span>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">FlowFi Dashboard</h1>
          <p className="text-gray-600">Manage your payments, rewards, and social splits</p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPayments} ETH</div>
              <p className="text-xs text-gray-500">Wallet: {balance?.formatted?.slice(0, 6)} ETH</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">FFI Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ffiBalance} FFI</div>
              <p className="text-xs text-green-600">
                {Number(ffiBalance) > 0 ? 'Available to stake!' : 'Make payments to earn rewards'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Vault Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vaultBalance} ETH</div>
              <p className="text-xs text-blue-600">
                {Number(vaultYield) > 0 ? `+${vaultYield} ETH yield earned` : '5% APY available'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Tier Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{userTier}</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-orange-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${tierProgress.progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {tierProgress.progress < 100 ? `${(tierProgress.next - tierProgress.current).toFixed(3)} ETH to next tier` : 'Max tier reached!'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Wallet className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Make Payment</CardTitle>
              <CardDescription>Pay merchants and earn rewards</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                className="w-full" 
                onClick={() => setIsPaymentModalOpen(true)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {currentStep || 'Processing...'}
                  </>
                ) : (
                  'Pay Now'
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Split Bills</CardTitle>
              <CardDescription>Share expenses with friends</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/dashboard/splits" className="w-full">
                <Button 
                  variant="outline" 
                  className="w-full"
                >
                  Manage Splits
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Gift className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Rewards</CardTitle>
              <CardDescription>View and stake FFI tokens</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/dashboard/rewards" className="w-full">
                <Button 
                  variant="outline" 
                  className="w-full"
                >
                  View Rewards
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Yield Vault</CardTitle>
              <CardDescription>Earn yield on idle funds</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setIsYieldModalOpen(true)}
                disabled={isLoading}
              >
                Manage Vault
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Transaction Status */}
        {hash && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-800 font-medium">
                  Transaction submitted! Hash: {hash.slice(0, 10)}...
                </span>
                <a 
                  href={`https://explorer-holesky.morphl2.io/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-800 text-sm underline"
                >
                  View on Explorer →
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900">Quick Actions</CardTitle>
            <CardDescription className="text-green-700">
              Access FlowFi's core features with real smart contract interactions on Morph testnet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setIsPaymentModalOpen(true)}
              >
                Make Payment
              </Button>
              <Link href="/dashboard/splits">
                <Button 
                  variant="outline" 
                  className="border-green-300 text-green-700 w-full"
                >
                  Manage Splits
                </Button>
              </Link>
              <Link href="/dashboard/rewards">
                <Button 
                  variant="outline" 
                  className="border-green-300 text-green-700 w-full"
                >
                  View Rewards
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Contract Information */}
        <Card>
          <CardHeader>
            <CardTitle>FlowFi Smart Contracts</CardTitle>
            <CardDescription>
              All contracts deployed on Morph Holesky Testnet (Chain ID: 2810)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">FlowFi Core</span>
                <a 
                  href={`https://explorer-holesky.morphl2.io/address/${CONTRACT_ADDRESSES.FLOWFI_CORE}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  {CONTRACT_ADDRESSES.FLOWFI_CORE}
                </a>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">Rewards Manager</span>
                <a 
                  href={`https://explorer-holesky.morphl2.io/address/${CONTRACT_ADDRESSES.REWARDS_MANAGER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  {CONTRACT_ADDRESSES.REWARDS_MANAGER}
                </a>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">Split Payments</span>
                <a 
                  href={`https://explorer-holesky.morphl2.io/address/${CONTRACT_ADDRESSES.SPLIT_PAYMENTS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  {CONTRACT_ADDRESSES.SPLIT_PAYMENTS}
                </a>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-medium">Yield Vault</span>
                <a 
                  href={`https://explorer-holesky.morphl2.io/address/${CONTRACT_ADDRESSES.YIELD_VAULT}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  {CONTRACT_ADDRESSES.YIELD_VAULT}
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modals */}
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onPayment={(merchantAddress, amount, description) => {
            makePayment(merchantAddress, amount, description)
            setIsPaymentModalOpen(false)
          }}
          isLoading={isLoading}
          currentStep={currentStep}
        />

        <YieldVaultModal
          isOpen={isYieldModalOpen}
          onClose={() => setIsYieldModalOpen(false)}
          onDeposit={(amount) => {
            depositToVault(amount)
            setIsYieldModalOpen(false)
          }}
          onWithdraw={(amount) => {
            withdrawFromVault(amount)
            setIsYieldModalOpen(false)
          }}
          isLoading={isLoading}
          currentStep={currentStep}
          userBalance={balance?.formatted || '0'}
          vaultBalance={vaultBalance}
        />

        <SplitModal
          isOpen={isSplitModalOpen}
          onClose={() => setIsSplitModalOpen(false)}
          onCreateSplit={(totalAmount, description, participants, merchantAddress) => {
            createSplit(totalAmount, description, participants, merchantAddress)
            setIsSplitModalOpen(false)
          }}
          isLoading={isLoading}
          currentStep={currentStep}
        />
      </div>
    </div>
  )
}