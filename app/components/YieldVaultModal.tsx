'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { X, TrendingUp, AlertCircle, Coins } from 'lucide-react'

interface YieldVaultModalProps {
  isOpen: boolean
  onClose: () => void
  onDeposit: (amount: string) => void
  onWithdraw: (amount: string) => void
  isLoading: boolean
  currentStep: string
  userBalance: string
  vaultBalance: string
}

export function YieldVaultModal({ 
  isOpen, 
  onClose, 
  onDeposit, 
  onWithdraw, 
  isLoading, 
  currentStep,
  userBalance,
  vaultBalance
}: YieldVaultModalProps) {
  const [action, setAction] = useState<'deposit' | 'withdraw'>('deposit')
  const [amount, setAmount] = useState('')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    
    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0'
    } else if (action === 'deposit' && parseFloat(amount) > parseFloat(userBalance)) {
      newErrors.amount = 'Insufficient balance'
    } else if (action === 'withdraw' && parseFloat(amount) > parseFloat(vaultBalance)) {
      newErrors.amount = 'Insufficient vault balance'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm() && !isLoading) {
      if (action === 'deposit') {
        onDeposit(amount)
      } else {
        onWithdraw(amount)
      }
    }
  }

  const setMaxAmount = () => {
    const maxAmount = action === 'deposit' ? userBalance : vaultBalance
    setAmount(maxAmount)
    setErrors({})
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <span>Yield Vault</span>
            </CardTitle>
            <CardDescription>
              Earn yield on your idle ETH with automated strategies
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Action Selector */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setAction('deposit')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                action === 'deposit' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              disabled={isLoading}
            >
              Deposit
            </button>
            <button
              onClick={() => setAction('withdraw')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                action === 'withdraw' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              disabled={isLoading}
            >
              Withdraw
            </button>
          </div>

          {/* Balances Display */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-xs text-blue-600 font-medium">Wallet Balance</div>
              <div className="text-lg font-bold text-blue-900">{parseFloat(userBalance).toFixed(4)} ETH</div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="text-xs text-orange-600 font-medium">Vault Balance</div>
              <div className="text-lg font-bold text-orange-900">{parseFloat(vaultBalance).toFixed(4)} ETH</div>
            </div>
          </div>

          {/* APY Display */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-green-800">Current APY</div>
                <div className="text-xs text-green-600">Morph L2 Optimized Strategy</div>
              </div>
              <div className="text-2xl font-bold text-green-900">5.2%</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="amount" className="text-sm font-medium text-gray-700">
                  Amount (ETH) *
                </label>
                <button
                  type="button"
                  onClick={setMaxAmount}
                  className="text-xs text-blue-600 hover:text-blue-800"
                  disabled={isLoading}
                >
                  Max: {action === 'deposit' ? userBalance : vaultBalance}
                </button>
              </div>
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
                } focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                disabled={isLoading}
              />
              {errors.amount && (
                <p className="text-red-600 text-xs flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.amount}</span>
                </p>
              )}
            </div>

            {/* Yield Calculation */}
            {amount && parseFloat(amount) > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                <div className="flex items-center space-x-2 text-gray-800">
                  <Coins className="h-4 w-4" />
                  <span className="text-sm font-medium">Estimated Returns</span>
                </div>
                <div className="text-xs text-gray-600 mt-1 space-y-1">
                  <div>Daily: ~{(parseFloat(amount) * 0.052 / 365).toFixed(6)} ETH</div>
                  <div>Monthly: ~{(parseFloat(amount) * 0.052 / 12).toFixed(4)} ETH</div>
                  <div>Yearly: ~{(parseFloat(amount) * 0.052).toFixed(4)} ETH</div>
                </div>
              </div>
            )}

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
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {currentStep || 'Processing...'}
                  </>
                ) : (
                  action === 'deposit' ? 'Deposit to Vault' : 'Withdraw from Vault'
                )}
              </Button>
            </div>
          </form>

          {/* Strategy Info */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Automated yield farming on Morph L2</p>
            <p>• No lock-up period, withdraw anytime</p>
            <p>• Smart contract audited and verified</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}