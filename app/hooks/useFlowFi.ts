'use client'

import React, { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseEther, formatEther, keccak256, toBytes } from 'viem'
import { CONTRACT_ADDRESSES } from '@/lib/config'

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
  const { writeContract, data: hash, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // Read user's FFI token balance
  const { data: ffiBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.REWARDS_MANAGER as `0x${string}`,
    abi: REWARDS_MANAGER_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  const demoPayment = async () => {
    if (!address) {
      alert('Please connect your wallet first!')
      return
    }

    setIsLoading(true)
    setCurrentStep('Creating payment...')
    
    try {
      // First register as merchant if not already done
      await new Promise(resolve => setTimeout(resolve, 500))
      setCurrentStep('Registering demo merchant...')
      
      writeContract({
        address: CONTRACT_ADDRESSES.FLOWFI_CORE as `0x${string}`,
        abi: FLOWFI_CORE_ABI,
        functionName: 'registerMerchant',
        args: [
          'Demo Coffee Shop',
          'Food & Beverage', 
          BigInt(200) // 2% rewards
        ]
      })

      // Wait for merchant registration
      await new Promise(resolve => setTimeout(resolve, 2000))
      setCurrentStep('Creating payment to coffee shop...')

      // Create payment to self (acting as merchant)
      const amount = parseEther('0.002') // 0.002 ETH (~$5)
      
      writeContract({
        address: CONTRACT_ADDRESSES.FLOWFI_CORE as `0x${string}`,
        abi: FLOWFI_CORE_ABI,
        functionName: 'createPayment',
        args: [
          address, // Pay to self for demo
          amount,
          '0x0000000000000000000000000000000000000000' as `0x${string}`, // ETH
          'Demo Coffee Shop Payment - FlowFi Hackathon'
        ]
      })

    } catch (error: any) {
      console.error('Payment error:', error)
      alert(`Payment failed: ${error?.message || 'Unknown error'}. Make sure you have enough ETH and are connected to Morph Holesky testnet (Chain ID: 2810).`)
    } finally {
      setIsLoading(false)
      setCurrentStep('')
    }
  }

  const demoSplit = async () => {
    if (!address) {
      alert('Please connect your wallet first!')
      return
    }

    setIsLoading(true)
    setCurrentStep('Creating split bill...')
    
    try {
      // Create a real split payment on-chain
      const amount = parseEther('0.003') // 0.003 ETH split
      const deadline = Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours from now
      const participants = [
        '0x742d35Cc6438C0532925a3b8AAD43E6eDeDA2DB3', // Demo participant 1
        '0x8ba1f109551bD432803012645Hac136c94ba5d00' // Demo participant 2 (fixed address length)
      ]

      writeContract({
        address: CONTRACT_ADDRESSES.SPLIT_PAYMENTS as `0x${string}`,
        abi: SPLIT_PAYMENTS_ABI,
        functionName: 'createEqualSplit',
        args: [
          amount,
          '0x0000000000000000000000000000000000000000' as `0x${string}`, // ETH
          'Demo Group Dinner Split - FlowFi Hackathon',
          BigInt(deadline),
          participants as `0x${string}`[],
          '0x0000000000000000000000000000000000000000' as `0x${string}` // No specific merchant
        ]
      })

    } catch (error: any) {
      console.error('Split error:', error)
      alert(`Split creation failed: ${error?.message || 'Unknown error'}. Make sure you're connected to Morph Holesky testnet.`)
    } finally {
      setIsLoading(false)
      setCurrentStep('')
    }
  }

  const demoStaking = async () => {
    if (!address) {
      alert('Please connect your wallet first!')
      return
    }

    // Check if user has FFI tokens to stake
    const balance = ffiBalance ? Number(ffiBalance) : 0
    if (balance === 0) {
      alert('You need FFI tokens to stake! Make a payment first to earn rewards, then come back to stake them.')
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
      alert(`Staking failed: ${error?.message || 'Unknown error'}. Make sure you have FFI tokens to stake.`)
    } finally {
      setIsLoading(false)
      setCurrentStep('')
    }
  }

  // Effect to show success message when transaction completes
  React.useEffect(() => {
    if (isSuccess && hash) {
      const explorerUrl = `https://explorer-holesky.morphl2.io/tx/${hash}`
      alert(`Transaction successful! 🎉\n\nView on Morph Explorer:\n${explorerUrl}`)
    }
  }, [isSuccess, hash])

  return {
    demoPayment,
    demoSplit,
    demoStaking,
    isLoading: isLoading || isConfirming,
    currentStep,
    hash,
    error,
    ffiBalance: ffiBalance ? formatEther(ffiBalance as bigint) : '0'
  }
}