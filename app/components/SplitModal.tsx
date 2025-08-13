'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Users, AlertCircle, Plus, Trash2 } from 'lucide-react'
import { isAddress } from 'viem'

interface SplitModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateSplit: (totalAmount: string, description: string, participants: string[], merchantAddress: string) => void
  isLoading: boolean
  currentStep: string
}

export function SplitModal({ isOpen, onClose, onCreateSplit, isLoading, currentStep }: SplitModalProps) {
  const [totalAmount, setTotalAmount] = useState('0.01')
  const [description, setDescription] = useState('Group Bill Split')
  const [merchantAddress, setMerchantAddress] = useState('')
  const [participants, setParticipants] = useState(['0x742d35Cc6438C0532925a3b8AAD43E6eDeDA2DB3'])
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const addParticipant = () => {
    setParticipants([...participants, ''])
  }

  const removeParticipant = (index: number) => {
    if (participants.length > 1) {
      setParticipants(participants.filter((_, i) => i !== index))
    }
  }

  const updateParticipant = (index: number, address: string) => {
    const newParticipants = [...participants]
    newParticipants[index] = address
    setParticipants(newParticipants)
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      newErrors.totalAmount = 'Total amount must be greater than 0'
    }
    
    if (!description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (merchantAddress && !isAddress(merchantAddress)) {
      newErrors.merchantAddress = 'Invalid merchant address'
    }
    
    participants.forEach((participant, index) => {
      if (!participant.trim()) {
        newErrors[`participant_${index}`] = 'Participant address is required'
      } else if (!isAddress(participant)) {
        newErrors[`participant_${index}`] = 'Invalid Ethereum address'
      }
    })
    
    // Check for duplicate participants
    const uniqueParticipants = new Set(participants.filter(p => p.trim()))
    if (uniqueParticipants.size !== participants.length) {
      newErrors.participants = 'Duplicate participant addresses found'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm() && !isLoading) {
      onCreateSplit(totalAmount, description, participants, merchantAddress)
    }
  }

  const handleQuickFill = (preset: 'dinner' | 'grocery' | 'trip') => {
    const presets = {
      dinner: {
        amount: '0.025',
        description: 'Group Dinner Bill',
        merchant: '0x8ba1f109551bD432803012645Hac136c94ba5d00',
        participants: [
          '0x742d35Cc6438C0532925a3b8AAD43E6eDeDA2DB3',
          '0x1234567890123456789012345678901234567890'
        ]
      },
      grocery: {
        amount: '0.015',
        description: 'Grocery Store Split',
        merchant: '0x9876543210987654321098765432109876543210',
        participants: [
          '0x742d35Cc6438C0532925a3b8AAD43E6eDeDA2DB3',
          '0x1111111111111111111111111111111111111111'
        ]
      },
      trip: {
        amount: '0.05',
        description: 'Weekend Trip Expenses',
        merchant: '',
        participants: [
          '0x742d35Cc6438C0532925a3b8AAD43E6eDeDA2DB3',
          '0x2222222222222222222222222222222222222222',
          '0x3333333333333333333333333333333333333333'
        ]
      }
    }
    
    const preset_data = presets[preset]
    setTotalAmount(preset_data.amount)
    setDescription(preset_data.description)
    setMerchantAddress(preset_data.merchant)
    setParticipants(preset_data.participants)
    setErrors({})
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <span>Create Split Payment</span>
            </CardTitle>
            <CardDescription>
              Split bills with friends using smart contracts
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
                onClick={() => handleQuickFill('dinner')}
                disabled={isLoading}
              >
                Dinner
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleQuickFill('grocery')}
                disabled={isLoading}
              >
                Grocery
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleQuickFill('trip')}
                disabled={isLoading}
              >
                Trip
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Total Amount */}
            <div className="space-y-2">
              <label htmlFor="totalAmount" className="text-sm font-medium text-gray-700">
                Total Amount (ETH) *
              </label>
              <input
                id="totalAmount"
                type="number"
                step="0.0001"
                min="0"
                value={totalAmount}
                onChange={(e) => {
                  setTotalAmount(e.target.value)
                  if (errors.totalAmount) {
                    setErrors(prev => ({ ...prev, totalAmount: '' }))
                  }
                }}
                placeholder="0.01"
                className={`w-full px-3 py-2 border rounded-md text-sm ${
                  errors.totalAmount ? 'border-red-300 bg-red-50' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                disabled={isLoading}
              />
              {errors.totalAmount && (
                <p className="text-red-600 text-xs flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.totalAmount}</span>
                </p>
              )}
              <p className="text-xs text-gray-500">
                Each participant pays: {participants.length > 0 ? (parseFloat(totalAmount || '0') / participants.length).toFixed(4) : '0'} ETH
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-gray-700">
                Split Description *
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
                placeholder="What is this split for?"
                className={`w-full px-3 py-2 border rounded-md text-sm ${
                  errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                disabled={isLoading}
              />
              {errors.description && (
                <p className="text-red-600 text-xs flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.description}</span>
                </p>
              )}
            </div>

            {/* Merchant Address (Optional) */}
            <div className="space-y-2">
              <label htmlFor="merchantAddress" className="text-sm font-medium text-gray-700">
                Merchant Address (Optional)
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
                placeholder="0x... (leave empty if no specific merchant)"
                className={`w-full px-3 py-2 border rounded-md text-sm font-mono ${
                  errors.merchantAddress ? 'border-red-300 bg-red-50' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                disabled={isLoading}
              />
              {errors.merchantAddress && (
                <p className="text-red-600 text-xs flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.merchantAddress}</span>
                </p>
              )}
            </div>

            {/* Participants */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Participants ({participants.length}) *
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addParticipant}
                  disabled={isLoading}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
              
              {participants.map((participant, index) => (
                <div key={index} className="flex space-x-2">
                  <input
                    type="text"
                    value={participant}
                    onChange={(e) => {
                      updateParticipant(index, e.target.value)
                      if (errors[`participant_${index}`]) {
                        setErrors(prev => ({ ...prev, [`participant_${index}`]: '' }))
                      }
                    }}
                    placeholder={`Participant ${index + 1} address`}
                    className={`flex-1 px-3 py-2 border rounded-md text-sm font-mono ${
                      errors[`participant_${index}`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                    disabled={isLoading}
                  />
                  {participants.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => removeParticipant(index)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
              
              {errors.participants && (
                <p className="text-red-600 text-xs flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.participants}</span>
                </p>
              )}
              
              {/* Show participant-specific errors */}
              {participants.map((_, index) => 
                errors[`participant_${index}`] && (
                  <p key={index} className="text-red-600 text-xs flex items-center space-x-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>Participant {index + 1}: {errors[`participant_${index}`]}</span>
                  </p>
                )
              )}
            </div>

            {/* Split Info */}
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <div className="text-sm font-medium text-green-800 mb-1">Split Details</div>
              <div className="text-xs text-green-700 space-y-1">
                <div>• Each participant pays: {participants.length > 0 ? (parseFloat(totalAmount || '0') / participants.length).toFixed(4) : '0'} ETH</div>
                <div>• 24-hour deadline for payments</div>
                <div>• Automatic refund if not all participants pay</div>
              </div>
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
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {currentStep || 'Creating...'}
                  </>
                ) : (
                  'Create Split'
                )}
              </Button>
            </div>
          </form>

          {/* Help Text */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Split will be created on Morph Holesky Testnet</p>
            <p>• All participants will receive notifications</p>
            <p>• Smart contract handles payment collection</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}