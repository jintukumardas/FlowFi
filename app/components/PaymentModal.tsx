'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Wallet, AlertCircle, ExternalLink } from 'lucide-react'
import { isAddress } from 'viem'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onPayment: (merchantAddress: string, amount: string, description: string) => void
  isLoading: boolean
  currentStep: string
}

export function PaymentModal({ isOpen, onClose, onPayment, isLoading, currentStep }: PaymentModalProps) {
  const [merchantAddress, setMerchantAddress] = useState('')
  const [amount, setAmount] = useState('0.001')
  const [description, setDescription] = useState('FlowFi Payment')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    
    if (!merchantAddress.trim()) {
      newErrors.merchantAddress = 'Merchant address is required'
    } else if (!isAddress(merchantAddress)) {
      newErrors.merchantAddress = 'Invalid Ethereum address'
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0'
    }
    
    if (!description.trim()) {
      newErrors.description = 'Payment description is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm() && !isLoading) {
      onPayment(merchantAddress, amount, description)
    }
  }

  const handleQuickFill = (preset: 'coffee' | 'lunch' | 'custom') => {
    const presets = {
      coffee: {
        address: '0x742d35Cc6438C0532925a3b8AAD43E6eDeDA2DB3',
        amount: '0.002',
        description: 'Coffee Shop Payment'
      },
      lunch: {
        address: '0x8ba1f109551bD432803012645Hac136c94ba5d00',
        amount: '0.008',
        description: 'Restaurant Payment'
      },
      custom: {
        address: '',
        amount: '0.001',
        description: 'FlowFi Payment'
      }
    }
    
    const preset_data = presets[preset]
    setMerchantAddress(preset_data.address)
    setAmount(preset_data.amount)
    setDescription(preset_data.description)
    setErrors({})
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Wallet className="h-5 w-5 text-blue-600" />
              <span>Make Payment</span>
            </CardTitle>
            <CardDescription>
              Send payment to merchant and earn FFI rewards
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Quick Fill Buttons */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Quick Fill</label>
            <div className="grid grid-cols-3 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleQuickFill('coffee')}
                disabled={isLoading}
              >
                Coffee Shop
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleQuickFill('lunch')}
                disabled={isLoading}
              >
                Restaurant
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleQuickFill('custom')}
                disabled={isLoading}
              >
                Custom
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Merchant Address */}
            <div className="space-y-2">
              <label htmlFor="merchantAddress" className="text-sm font-medium text-gray-700">
                Merchant Address *
              </label>
              <input
                id="merchantAddress"
                type="text"
                value={merchantAddress}
                onChange={(e) => {
                  setMerchantAddress(e.target.value)
                  if (errors.merchantAddress) {
                    setErrors(prev => ({ ...prev, merchantAddress: '' }))
                  }
                }}
                placeholder="0x..."
                className={`w-full px-3 py-2 border rounded-md text-sm font-mono ${
                  errors.merchantAddress ? 'border-red-300 bg-red-50' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                disabled={isLoading}
              />
              {errors.merchantAddress && (
                <p className="text-red-600 text-xs flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.merchantAddress}</span>
                </p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium text-gray-700">
                Amount (ETH) *
              </label>
              <input
                id="amount"
                type="number"
                step="0.0001"
                min="0"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  if (errors.amount) {
                    setErrors(prev => ({ ...prev, amount: '' }))
                  }
                }}
                placeholder="0.001"
                className={`w-full px-3 py-2 border rounded-md text-sm ${
                  errors.amount ? 'border-red-300 bg-red-50' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                disabled={isLoading}
              />
              {errors.amount && (
                <p className="text-red-600 text-xs flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.amount}</span>
                </p>
              )}
              <p className="text-xs text-gray-500">
                ~${(parseFloat(amount || '0') * 2500).toFixed(2)} USD (estimated)
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-gray-700">
                Payment Description *
              </label>
              <input
                id="description"
                type="text"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  if (errors.description) {
                    setErrors(prev => ({ ...prev, description: '' }))
                  }
                }}
                placeholder="What is this payment for?"
                className={`w-full px-3 py-2 border rounded-md text-sm ${
                  errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                disabled={isLoading}
              />
              {errors.description && (
                <p className="text-red-600 text-xs flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.description}</span>
                </p>
              )}
            </div>

            {/* Rewards Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-center space-x-2 text-blue-800">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium">Reward Calculation</span>
              </div>
              <p className="text-xs text-blue-700 mt-1">
                You'll earn ~{(parseFloat(amount || '0') * 0.02).toFixed(4)} FFI tokens (2% reward rate)
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {currentStep || 'Processing...'}
                  </>
                ) : (
                  'Send Payment'
                )}
              </Button>
            </div>
          </form>

          {/* Help Text */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Payment will be processed on Morph Holesky Testnet</p>
            <p>• You'll earn FFI reward tokens for each payment</p>
            <p>• Transaction fees are typically ~$0.01</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}