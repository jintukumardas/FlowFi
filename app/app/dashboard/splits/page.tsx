'use client'

import { useState, useEffect } from 'react'
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Users, Clock, CheckCircle, XCircle, Plus, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useFlowFi } from '@/hooks/useFlowFi'
import { FlowFiIcon } from '@/components/FlowFiIcon'
import { SplitModal } from '@/components/SplitModal'
import { DashboardNav } from '@/components/DashboardNav'
import { formatEther, parseEther } from 'viem'
import { useToast } from '@/components/ui/toast'

interface SplitBill {
  id: string
  description: string
  totalAmount: string
  amountPerPerson: string
  participants: string[]
  creator: string
  status: 'pending' | 'completed' | 'expired'
  deadline: Date
  paidParticipants: string[]
  createdAt: Date
  isCompleted: boolean
  totalPaid: string
}

export default function SplitsPage() {
  const { address, isConnected } = useAccount()
  const { data: balance } = useBalance({ address })
  const { createSplit, isLoading, currentStep, userSplitIds, SPLIT_PAYMENTS_ABI, CONTRACT_ADDRESSES, activeSplits: calculatedSplits, calculator } = useFlowFi()
  const { addToast } = useToast()
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false)
  const [splits, setSplits] = useState<SplitBill[]>([])
  const [isLoadingSplits, setIsLoadingSplits] = useState(false)
  const { writeContract, data: hash } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  // Read user's split IDs from contract
  const { data: splitIds, refetch: refetchSplitIds } = useReadContract({
    address: CONTRACT_ADDRESSES.SPLIT_PAYMENTS as `0x${string}`,
    abi: SPLIT_PAYMENTS_ABI,
    functionName: 'getUserSplits',
    args: address ? [address] : undefined,
  })

  // Use calculated splits from the calculator
  useEffect(() => {
    if (calculatedSplits && calculatedSplits.length > 0) {
      // Convert SplitRecord to SplitBill format
      const convertedSplits: SplitBill[] = calculatedSplits.map(split => ({
        id: split.id,
        description: split.description,
        totalAmount: split.totalAmount,
        amountPerPerson: split.userContribution,
        participants: split.participants,
        creator: split.participants[0], // Assume first participant is creator
        status: split.status,
        deadline: new Date(split.timestamp.getTime() + 24 * 60 * 60 * 1000),
        paidParticipants: split.status === 'completed' ? [address!] : [],
        createdAt: split.timestamp,
        isCompleted: split.status === 'completed',
        totalPaid: split.status === 'completed' ? split.totalAmount : '0'
      }))
      setSplits(convertedSplits)
    } else if (address) {
      // Show demo split if no calculated splits exist
      const demoSplits: SplitBill[] = [
        {
          id: 'demo_split_1',
          description: 'Demo: Group Dinner Split',
          totalAmount: '0.01',
          amountPerPerson: '0.005',
          participants: [address, '0x742d35Cc6438C0532925a3b8AAD43E6eDeDA2DB3'],
          creator: address,
          status: 'pending',
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
          paidParticipants: [],
          createdAt: new Date(),
          isCompleted: false,
          totalPaid: '0'
        }
      ]
      setSplits(demoSplits)
    }
  }, [calculatedSplits, address])

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>Please connect your wallet to view splits</CardDescription>
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'completed': return 'text-green-600 bg-green-50 border-green-200'
      case 'expired': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'expired': return <XCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const formatTimeRemaining = (deadline: Date) => {
    const now = new Date()
    const diff = deadline.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h remaining`
    }
    
    return `${hours}h ${minutes}m remaining`
  }

  const activeSplits = splits.filter(s => s.status === 'pending')
  const completedSplits = splits.filter(s => s.status === 'completed')
  const expiredSplits = splits.filter(s => s.status === 'expired')

  const handlePaySplit = async (splitId: string) => {
    const split = splits.find(s => s.id === splitId)
    if (!split) return

    try {
      // Use calculator to handle the split contribution
      const success = calculator.contributeSplit(splitId)
      
      if (success) {
        // Update local state
        setSplits(prev => prev.map(s => 
          s.id === splitId 
            ? { ...s, status: 'completed' as const, paidParticipants: [...s.paidParticipants, address!] }
            : s
        ))

        const contributionAmount = parseEther(split.amountPerPerson)
        
        writeContract({
          address: CONTRACT_ADDRESSES.SPLIT_PAYMENTS as `0x${string}`,
          abi: SPLIT_PAYMENTS_ABI,
          functionName: 'contributeSplit',
          args: [splitId as `0x${string}`],
          value: contributionAmount
        })

        addToast({
          title: 'Split Payment Successful! 🎉',
          description: `Paid ${split.amountPerPerson} ETH to split. Rewards earned!`,
          variant: 'success'
        })
      } else {
        addToast({
          title: 'Payment Failed',
          description: 'Split not found or already completed',
          variant: 'error'
        })
      }

    } catch (error: any) {
      console.error('Payment error:', error)
      addToast({
        title: 'Payment Failed',
        description: error?.message || 'Unknown error',
        variant: 'error'
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <ArrowLeft className="h-5 w-5" />
            <FlowFiIcon />
            <span className="text-2xl font-bold text-gray-900">Split Bills</span>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button onClick={() => setIsSplitModalOpen(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="mr-2 h-4 w-4" />
            Create Split
          </Button>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Split Bills Dashboard</h1>
          <p className="text-gray-600">Manage your shared expenses and split bills</p>
        </div>

        {/* Statistics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Total Splits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{splits.length}</div>
              <p className="text-xs text-blue-600">All time</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-700">Active Splits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900">{activeSplits.length}</div>
              <p className="text-xs text-yellow-600">Pending payment</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{completedSplits.length}</div>
              <p className="text-xs text-green-600">Successfully paid</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Total Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">
                {splits.reduce((sum, split) => sum + parseFloat(split.totalAmount), 0).toFixed(4)} ETH
              </div>
              <p className="text-xs text-purple-600">Split amount</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Splits */}
        {activeSplits.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <span>Active Splits ({activeSplits.length})</span>
              </CardTitle>
              <CardDescription>Bills waiting for payments from participants</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeSplits.map((split) => (
                  <div key={split.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{split.description}</h3>
                        <p className="text-sm text-gray-600">
                          Created by {split.creator === address ? 'You' : `${split.creator.slice(0, 6)}...${split.creator.slice(-4)}`}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full border text-xs font-medium ${getStatusColor(split.status)}`}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(split.status)}
                          <span className="capitalize">{split.status}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Total Amount</p>
                        <p className="font-semibold">{split.totalAmount} ETH</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Per Person</p>
                        <p className="font-semibold">{split.amountPerPerson} ETH</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Participants</p>
                        <p className="font-semibold">{split.participants.length} people</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Time Remaining</p>
                        <p className="font-semibold text-yellow-700">{formatTimeRemaining(split.deadline)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="text-gray-600">
                          {split.paidParticipants.length} of {split.participants.length} paid
                        </span>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${(split.paidParticipants.length / split.participants.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => handlePaySplit(split.id)}
                        disabled={split.paidParticipants.includes(address!) || isConfirming}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isConfirming ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : split.paidParticipants.includes(address!) ? 'Paid' : 'Pay Now'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Splits History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>Split History</span>
            </CardTitle>
            <CardDescription>All your split bill transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {splits.length > 0 ? (
              <div className="space-y-4">
                {splits.map((split) => (
                  <div key={split.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{split.description}</h3>
                        <p className="text-sm text-gray-600">
                          {split.createdAt.toLocaleDateString()} • 
                          {split.creator === address ? ' Created by you' : ` Created by ${split.creator.slice(0, 6)}...${split.creator.slice(-4)}`}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full border text-xs font-medium ${getStatusColor(split.status)}`}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(split.status)}
                          <span className="capitalize">{split.status}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Total: <span className="font-medium text-gray-900">{split.totalAmount} ETH</span></p>
                      </div>
                      <div>
                        <p className="text-gray-500">Per person: <span className="font-medium text-gray-900">{split.amountPerPerson} ETH</span></p>
                      </div>
                      <div>
                        <p className="text-gray-500">Participants: <span className="font-medium text-gray-900">{split.participants.length}</span></p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Split Bills Yet</h3>
                <p className="text-gray-600 mb-4">Create your first split bill to share expenses with friends</p>
                <Button onClick={() => setIsSplitModalOpen(true)} className="bg-green-600 hover:bg-green-700">
                  Create Your First Split
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Split Modal */}
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