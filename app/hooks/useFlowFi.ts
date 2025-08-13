'use client'

import React, { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseEther, formatEther, keccak256, toBytes } from 'viem'
import { CONTRACT_ADDRESSES } from '@/lib/config'
import { useToast } from '@/components/ui/toast'
import { calculator } from '@/lib/calculations'

// FlowFi Core ABI (complete for real interactions)
const FLOWFI_CORE_ABI = [
  {
    name: 'createPayment',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_amount', type: 'uint256' },
      { name: '_token', type: 'address' },
      { name: '_description', type: 'string' }
    ],
    outputs: [{ name: 'paymentId', type: 'bytes32' }]
  },
  {
    name: 'executePayment',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: '_paymentId', type: 'bytes32' }]
  },
  {
    name: 'registerMerchant',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_name', type: 'string' },
      { name: '_category', type: 'string' },
      { name: '_rewardRate', type: 'uint256' }
    ]
  },
  {
    name: 'userRewards',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'getPayment',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_paymentId', type: 'bytes32' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'token', type: 'address' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'description', type: 'string' },
          { name: 'isCompleted', type: 'bool' }
        ]
      }
    ]
  }
] as const

// Split Payments ABI
const SPLIT_PAYMENTS_ABI = [
  {
    name: 'createEqualSplit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_totalAmount', type: 'uint256' },
      { name: '_token', type: 'address' },
      { name: '_description', type: 'string' },
      { name: '_deadline', type: 'uint256' },
      { name: '_participants', type: 'address[]' },
      { name: '_merchant', type: 'address' }
    ],
    outputs: [{ name: 'splitId', type: 'bytes32' }]
  },
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
    name: 'contributeSplit',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: '_splitId', type: 'bytes32' }]
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
    name: 'SplitCreated',
    type: 'event',
    inputs: [
      { name: 'splitId', type: 'bytes32', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'totalAmount', type: 'uint256', indexed: false },
      { name: 'participants', type: 'address[]', indexed: false }
    ]
  },
  {
    name: 'SplitContribution',
    type: 'event',
    inputs: [
      { name: 'splitId', type: 'bytes32', indexed: true },
      { name: 'contributor', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false }
    ]
  }
] as const

// Yield Vault ABI
const YIELD_VAULT_ABI = [
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'payable',
    inputs: []
  },
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_amount', type: 'uint256' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const

// Rewards Manager ABI  
const REWARDS_MANAGER_ABI = [
  {
    name: 'stake',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_amount', type: 'uint256' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'getStakeInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'amount', type: 'uint256' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'rewardDebt', type: 'uint256' }
        ]
      }
    ]
  }
] as const

export function useFlowFi() {
  const { address } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState('')
  const [stats, setStats] = useState(calculator.getStats())
  const { writeContract, data: hash, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })
  const { addToast } = useToast()

  // Update stats when transactions complete
  useEffect(() => {
    if (isSuccess) {
      setStats(calculator.getStats())
    }
  }, [isSuccess])

  // Periodically update stats for yield calculations
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(calculator.getStats())
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  // Read user's FFI token balance
  const { data: ffiBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.REWARDS_MANAGER as `0x${string}`,
    abi: REWARDS_MANAGER_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  // Read user's vault balance
  const { data: vaultBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.YIELD_VAULT as `0x${string}`,
    abi: YIELD_VAULT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  // Read user's rewards from FlowFi Core
  const { data: userRewards } = useReadContract({
    address: CONTRACT_ADDRESSES.FLOWFI_CORE as `0x${string}`,
    abi: FLOWFI_CORE_ABI,
    functionName: 'userRewards',
    args: address ? [address] : undefined,
  })

  // Read user's staking info
  const { data: stakeInfo } = useReadContract({
    address: CONTRACT_ADDRESSES.REWARDS_MANAGER as `0x${string}`,
    abi: REWARDS_MANAGER_ABI,
    functionName: 'getStakeInfo',
    args: address ? [address] : undefined,
  })

  // Read user's splits
  const { data: userSplitIds } = useReadContract({
    address: CONTRACT_ADDRESSES.SPLIT_PAYMENTS as `0x${string}`,
    abi: SPLIT_PAYMENTS_ABI,
    functionName: 'getUserSplits',
    args: address ? [address] : undefined,
  })

  const makePayment = async (merchantAddress: string, amount: string, description: string) => {
    if (!address) {
      addToast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet first!',
        variant: 'error'
      })
      return
    }

    setIsLoading(true)
    setCurrentStep('Processing payment...')
    
    try {
      // Add payment to frontend calculations
      const payment = calculator.addPayment(amount, merchantAddress, description)
      setStats(calculator.getStats())

      // For ETH payments, we need to send value with the transaction
      const paymentAmount = parseEther(amount)
      
      // Create the payment record on blockchain
      setCurrentStep('Creating payment record...')
      writeContract({
        address: CONTRACT_ADDRESSES.FLOWFI_CORE as `0x${string}`,
        abi: FLOWFI_CORE_ABI,
        functionName: 'createPayment',
        args: [
          merchantAddress as `0x${string}`,
          paymentAmount,
          '0x0000000000000000000000000000000000000000' as `0x${string}`, // ETH
          description
        ]
      })

      addToast({
        title: 'Payment Processed! 🎉',
        description: `Payment of ${amount} ETH completed. Earned ${payment.rewardEarned} FFI rewards!`,
        variant: 'success'
      })

    } catch (error: any) {
      console.error('Payment error:', error)
      addToast({
        title: 'Payment Failed',
        description: `${error?.message || 'Unknown error'}. Make sure you have enough ETH and are connected to Morph Holesky testnet.`,
        variant: 'error'
      })
    } finally {
      setIsLoading(false)
      setCurrentStep('')
    }
  }

  const demoPayment = async () => {
    await makePayment(
      '0x742d35Cc6438C0532925a3b8AAD43E6eDeDA2DB3',
      '0.002',
      'Demo Coffee Shop Payment - FlowFi Hackathon'
    )
  }

  const createSplit = async (totalAmount: string, description: string, participants: string[], merchantAddress: string) => {
    if (!address) {
      addToast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet first!',
        variant: 'error'
      })
      return
    }

    setIsLoading(true)
    setCurrentStep('Creating split bill...')
    
    try {
      // Add split to frontend calculations
      const split = calculator.addSplit(totalAmount, participants, description, address)
      setStats(calculator.getStats())

      const amount = parseEther(totalAmount)
      const deadline = Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours from now
      const merchant = merchantAddress || '0x0000000000000000000000000000000000000000'

      writeContract({
        address: CONTRACT_ADDRESSES.SPLIT_PAYMENTS as `0x${string}`,
        abi: SPLIT_PAYMENTS_ABI,
        functionName: 'createEqualSplit',
        args: [
          amount,
          '0x0000000000000000000000000000000000000000' as `0x${string}`, // ETH
          description,
          BigInt(deadline),
          participants as `0x${string}`[],
          merchant as `0x${string}`
        ]
      })

      const userShare = (parseFloat(totalAmount) / participants.length).toFixed(4)
      addToast({
        title: 'Split Created! 💰',
        description: `Split bill created! Your share: ${userShare} ETH with ${participants.length} participants.`,
        variant: 'success'
      })

    } catch (error: any) {
      console.error('Split error:', error)
      addToast({
        title: 'Split Creation Failed',
        description: `${error?.message || 'Unknown error'}. Make sure you're connected to Morph Holesky testnet.`,
        variant: 'error'
      })
    } finally {
      setIsLoading(false)
      setCurrentStep('')
    }
  }

  const demoSplit = async () => {
    await createSplit(
      '0.003',
      'Demo Group Dinner Split - FlowFi Hackathon',
      ['0x742d35Cc6438C0532925a3b8AAD43E6eDeDA2DB3', '0x8ba1f109551bD432803012645Hac136c94ba5d00'],
      ''
    )
  }

  const demoStaking = async () => {
    if (!address) {
      addToast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet first!',
        variant: 'error'
      })
      return
    }

    // Check if user has FFI tokens to stake
    const balance = ffiBalance ? Number(ffiBalance) : 0
    if (balance === 0) {
      addToast({
        title: 'No FFI Tokens',
        description: 'You need FFI tokens to stake! Make a payment first to earn rewards.',
        variant: 'info'
      })
      return
    }

    setIsLoading(true)
    setCurrentStep('Staking FFI tokens...')
    
    try {
      // Stake all available FFI tokens
      writeContract({
        address: CONTRACT_ADDRESSES.REWARDS_MANAGER as `0x${string}`,
        abi: REWARDS_MANAGER_ABI,
        functionName: 'stake',
        args: [ffiBalance as bigint]
      })

    } catch (error: any) {
      console.error('Staking error:', error)
      addToast({
        title: 'Staking Failed',
        description: `${error?.message || 'Unknown error'}. Make sure you have FFI tokens to stake.`,
        variant: 'error'
      })
    } finally {
      setIsLoading(false)
      setCurrentStep('')
    }
  }

  const depositToVault = async (amount: string) => {
    if (!address) {
      addToast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet first!',
        variant: 'error'
      })
      return
    }

    setIsLoading(true)
    setCurrentStep('Depositing to vault...')
    
    try {
      // Add deposit to frontend calculations
      calculator.addVaultDeposit(amount)
      setStats(calculator.getStats())

      const depositAmount = parseEther(amount)
      
      writeContract({
        address: CONTRACT_ADDRESSES.YIELD_VAULT as `0x${string}`,
        abi: YIELD_VAULT_ABI,
        functionName: 'deposit',
        value: depositAmount
      })

      addToast({
        title: 'Deposit Successful! 🏦',
        description: `Deposited ${amount} ETH to yield vault. Earning 5% APY!`,
        variant: 'success'
      })

    } catch (error: any) {
      console.error('Deposit error:', error)
      addToast({
        title: 'Deposit Failed',
        description: `${error?.message || 'Unknown error'}`,
        variant: 'error'
      })
    } finally {
      setIsLoading(false)
      setCurrentStep('')
    }
  }

  const withdrawFromVault = async (amount: string) => {
    if (!address) {
      addToast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet first!',
        variant: 'error'
      })
      return
    }

    setIsLoading(true)
    setCurrentStep('Withdrawing from vault...')
    
    try {
      // Add withdrawal to frontend calculations
      calculator.addVaultWithdrawal(amount)
      setStats(calculator.getStats())

      const withdrawAmount = parseEther(amount)
      
      writeContract({
        address: CONTRACT_ADDRESSES.YIELD_VAULT as `0x${string}`,
        abi: YIELD_VAULT_ABI,
        functionName: 'withdraw',
        args: [withdrawAmount]
      })

      addToast({
        title: 'Withdrawal Successful! 💸',
        description: `Withdrew ${amount} ETH from yield vault.`,
        variant: 'success'
      })

    } catch (error: any) {
      console.error('Withdrawal error:', error)
      addToast({
        title: 'Withdrawal Failed',
        description: `${error?.message || 'Unknown error'}`,
        variant: 'error'
      })
    } finally {
      setIsLoading(false)
      setCurrentStep('')
    }
  }

  // Effect to show success message when transaction completes
  React.useEffect(() => {
    if (isSuccess && hash) {
      const explorerUrl = `https://explorer-holesky.morphl2.io/tx/${hash}`
      addToast({
        title: 'Transaction Successful! 🎉',
        description: 'Your transaction has been confirmed on the blockchain.',
        variant: 'success',
        duration: 7000,
        link: {
          label: 'View on Explorer',
          href: explorerUrl
        }
      })
    }
  }, [isSuccess, hash, addToast])

  return {
    makePayment,
    demoPayment,
    createSplit,
    demoSplit,
    demoStaking,
    depositToVault,
    withdrawFromVault,
    isLoading: isLoading || isConfirming,
    currentStep,
    hash,
    error,
    // Use calculated values for better UX
    ffiBalance: stats.totalRewards,
    vaultBalance: stats.vaultBalance,
    userRewards: stats.totalRewards,
    vaultYield: stats.vaultYield,
    userTier: stats.tier,
    tierProgress: stats.tierProgress,
    totalPayments: stats.totalPayments,
    activeSplitsCount: stats.activeSplitsCount,
    recentPayments: stats.recentPayments,
    activeSplits: stats.activeSplits,
    stats,
    stakeInfo: stakeInfo as any,
    userSplitIds: userSplitIds as string[] || [],
    SPLIT_PAYMENTS_ABI,
    CONTRACT_ADDRESSES,
    calculator
  }
}