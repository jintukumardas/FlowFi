'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatEther, parseEther } from 'viem'
import { CONTRACT_ADDRESSES } from '@/lib/config'
import { useFlowFi } from './useFlowFi'
import { useToast } from '@/components/ui/toast'

// Split Payments ABI (imported from useFlowFi)
const SPLIT_PAYMENTS_ABI = [
  {
    name: 'getSplit',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_splitId', type: 'bytes32' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'creator', type: 'address' },
          { name: 'totalAmount', type: 'uint256' },
          { name: 'amountPerParticipant', type: 'uint256' },
          { name: 'token', type: 'address' },
          { name: 'description', type: 'string' },
          { name: 'deadline', type: 'uint256' },
          { name: 'merchant', type: 'address' },
          { name: 'isCompleted', type: 'bool' },
          { name: 'totalPaid', type: 'uint256' }
        ]
      }
    ]
  },
  {
    name: 'getUserSplits',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [{ name: '', type: 'bytes32[]' }]
  },
  {
    name: 'getParticipants',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_splitId', type: 'bytes32' }],
    outputs: [{ name: '', type: 'address[]' }]
  },
  {
    name: 'hasPaid',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: '_splitId', type: 'bytes32' },
      { name: '_participant', type: 'address' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'contributeSplit',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: '_splitId', type: 'bytes32' }]
  }
] as const

export interface SplitBill {
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

export function useSplits() {
  const { address } = useAccount()
  const { addToast } = useToast()
  const [splits, setSplits] = useState<SplitBill[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { writeContract, data: hash } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  // Read user's split IDs
  const { data: userSplitIds, refetch: refetchSplitIds } = useReadContract({
    address: CONTRACT_ADDRESSES.SPLIT_PAYMENTS as `0x${string}`,
    abi: SPLIT_PAYMENTS_ABI,
    functionName: 'getUserSplits',
    args: address ? [address] : undefined,
  })

  // Fetch split details for each split ID
  useEffect(() => {
    const fetchSplits = async () => {
      if (!userSplitIds || !Array.isArray(userSplitIds) || userSplitIds.length === 0) {
        // Show demo splits if no real splits exist
        if (address) {
          const demoSplits: SplitBill[] = [
            {
              id: '0x0000000000000000000000000000000000000000000000000000000000000001',
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
        } else {
          setSplits([])
        }
        return
      }

      setIsLoading(true)
      try {
        const splitPromises = (userSplitIds as string[]).map(async (splitId: string) => {
          try {
            // For demo purposes, create mock split data
            // In production, this would fetch from the actual contract
            return {
              id: splitId,
              description: `Split #${splitId.slice(0, 8)}...`,
              totalAmount: '0.01',
              amountPerPerson: '0.005',
              participants: [address!, '0x742d35Cc6438C0532925a3b8AAD43E6eDeDA2DB3'],
              creator: address!,
              status: 'pending' as const,
              deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
              paidParticipants: [],
              createdAt: new Date(),
              isCompleted: false,
              totalPaid: '0'
            } as SplitBill
          } catch (error) {
            console.error(`Error fetching split ${splitId}:`, error)
            return null
          }
        })

        const fetchedSplits = await Promise.all(splitPromises)
        setSplits(fetchedSplits.filter((s): s is SplitBill => s !== null))
      } catch (error) {
        console.error('Error fetching splits:', error)
        setSplits([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchSplits()
  }, [userSplitIds, address])

  const contributeSplit = async (splitId: string, amount: string) => {
    if (!address) {
      addToast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet first!',
        variant: 'error'
      })
      return
    }

    try {
      const contributionAmount = parseEther(amount)
      
      writeContract({
        address: CONTRACT_ADDRESSES.SPLIT_PAYMENTS as `0x${string}`,
        abi: SPLIT_PAYMENTS_ABI,
        functionName: 'contributeSplit',
        args: [splitId as `0x${string}`],
        value: contributionAmount
      })

      addToast({
        title: 'Contribution Initiated',
        description: `Contributing ${amount} ETH to split...`,
        variant: 'info'
      })

      // Refetch splits after contribution
      setTimeout(() => refetchSplitIds(), 3000)

    } catch (error: any) {
      console.error('Contribution error:', error)
      addToast({
        title: 'Contribution Failed',
        description: error?.message || 'Unknown error',
        variant: 'error'
      })
    }
  }

  return {
    splits,
    isLoading: isLoading || isConfirming,
    contributeSplit,
    refetchSplits: refetchSplitIds
  }
}


