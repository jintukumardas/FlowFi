import { formatEther, parseEther } from 'viem'

// Reward calculation constants
export const REWARD_RATES = {
  BRONZE: 0.01, // 1%
  SILVER: 0.015, // 1.5%
  GOLD: 0.02, // 2%
  PLATINUM: 0.025, // 2.5%
} as const

export const TIER_THRESHOLDS = {
  BRONZE: 0,
  SILVER: 0.1, // 0.1 ETH in payments
  GOLD: 0.5, // 0.5 ETH in payments
  PLATINUM: 2.0, // 2.0 ETH in payments
} as const

export const YIELD_APY = 0.05 // 5% APY for vault deposits

export interface PaymentRecord {
  id: string
  amount: string
  timestamp: Date
  merchant: string
  description: string
  rewardEarned: string
}

export interface SplitRecord {
  id: string
  totalAmount: string
  userContribution: string
  timestamp: Date
  participants: string[]
  description: string
  status: 'pending' | 'completed' | 'expired'
}

export interface VaultRecord {
  amount: string
  timestamp: Date
  type: 'deposit' | 'withdrawal'
}

export class FlowFiCalculator {
  private payments: PaymentRecord[] = []
  private splits: SplitRecord[] = []
  private vaultTransactions: VaultRecord[] = []

  constructor() {
    // Load from localStorage if available
    this.loadFromStorage()
  }

  // Payment calculations
  addPayment(amount: string, merchant: string, description: string): PaymentRecord {
    const totalPayments = this.getTotalPayments()
    const tier = this.getUserTier(totalPayments)
    const rewardRate = REWARD_RATES[tier]
    const rewardEarned = (parseFloat(amount) * rewardRate).toFixed(6)

    const payment: PaymentRecord = {
      id: `payment_${Date.now()}`,
      amount,
      timestamp: new Date(),
      merchant,
      description,
      rewardEarned
    }

    this.payments.push(payment)
    this.saveToStorage()
    return payment
  }

  // Split calculations
  addSplit(totalAmount: string, participants: string[], description: string, userAddress: string): SplitRecord {
    const userContribution = (parseFloat(totalAmount) / participants.length).toFixed(6)
    
    const split: SplitRecord = {
      id: `split_${Date.now()}`,
      totalAmount,
      userContribution,
      timestamp: new Date(),
      participants,
      description,
      status: 'pending'
    }

    this.splits.push(split)
    this.saveToStorage()
    return split
  }

  contributeSplit(splitId: string): boolean {
    const splitIndex = this.splits.findIndex(s => s.id === splitId)
    if (splitIndex === -1) return false

    const split = this.splits[splitIndex]
    if (split.status !== 'pending') return false

    // Add as payment for reward calculation
    this.addPayment(split.userContribution, 'Split Payment', split.description)
    
    // Update split status
    this.splits[splitIndex].status = 'completed'
    this.saveToStorage()
    return true
  }

  // Vault calculations
  addVaultDeposit(amount: string): VaultRecord {
    const deposit: VaultRecord = {
      amount,
      timestamp: new Date(),
      type: 'deposit'
    }

    this.vaultTransactions.push(deposit)
    this.saveToStorage()
    return deposit
  }

  addVaultWithdrawal(amount: string): VaultRecord {
    const withdrawal: VaultRecord = {
      amount,
      timestamp: new Date(),
      type: 'withdrawal'
    }

    this.vaultTransactions.push(withdrawal)
    this.saveToStorage()
    return withdrawal
  }

  // Getters and calculations
  getTotalPayments(): number {
    return this.payments.reduce((total, payment) => total + parseFloat(payment.amount), 0)
  }

  getTotalRewards(): number {
    return this.payments.reduce((total, payment) => total + parseFloat(payment.rewardEarned), 0)
  }

  getUserTier(totalPayments?: number): keyof typeof REWARD_RATES {
    const total = totalPayments ?? this.getTotalPayments()
    
    if (total >= TIER_THRESHOLDS.PLATINUM) return 'PLATINUM'
    if (total >= TIER_THRESHOLDS.GOLD) return 'GOLD'
    if (total >= TIER_THRESHOLDS.SILVER) return 'SILVER'
    return 'BRONZE'
  }

  getCurrentVaultBalance(): number {
    return this.vaultTransactions.reduce((balance, tx) => {
      return tx.type === 'deposit' 
        ? balance + parseFloat(tx.amount)
        : balance - parseFloat(tx.amount)
    }, 0)
  }

  calculateVaultYield(): number {
    const currentBalance = this.getCurrentVaultBalance()
    if (currentBalance === 0) return 0

    // Calculate time-weighted yield
    let totalYield = 0
    let currentAmount = 0

    this.vaultTransactions
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .forEach((tx, index) => {
        if (index > 0) {
          const prevTx = this.vaultTransactions[index - 1]
          const timeDiff = tx.timestamp.getTime() - prevTx.timestamp.getTime()
          const daysElapsed = timeDiff / (1000 * 60 * 60 * 24)
          const dailyRate = YIELD_APY / 365
          
          totalYield += currentAmount * dailyRate * daysElapsed
        }

        currentAmount = tx.type === 'deposit' 
          ? currentAmount + parseFloat(tx.amount)
          : currentAmount - parseFloat(tx.amount)
      })

    // Add yield for time since last transaction
    if (this.vaultTransactions.length > 0) {
      const lastTx = this.vaultTransactions[this.vaultTransactions.length - 1]
      const timeDiff = Date.now() - lastTx.timestamp.getTime()
      const daysElapsed = timeDiff / (1000 * 60 * 60 * 24)
      const dailyRate = YIELD_APY / 365
      
      totalYield += currentAmount * dailyRate * daysElapsed
    }

    return totalYield
  }

  getActiveSplits(): SplitRecord[] {
    return this.splits.filter(split => {
      if (split.status === 'completed') return false
      
      // Check if expired (24 hours)
      const deadline = new Date(split.timestamp.getTime() + 24 * 60 * 60 * 1000)
      if (new Date() > deadline) {
        // Mark as expired
        const splitIndex = this.splits.findIndex(s => s.id === split.id)
        if (splitIndex !== -1) {
          this.splits[splitIndex].status = 'expired'
          this.saveToStorage()
        }
        return false
      }
      
      return true
    })
  }

  getRecentPayments(limit: number = 5): PaymentRecord[] {
    return this.payments
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  // Storage management
  private saveToStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('flowfi_payments', JSON.stringify(this.payments))
      localStorage.setItem('flowfi_splits', JSON.stringify(this.splits))
      localStorage.setItem('flowfi_vault', JSON.stringify(this.vaultTransactions))
    }
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const payments = localStorage.getItem('flowfi_payments')
        const splits = localStorage.getItem('flowfi_splits')
        const vault = localStorage.getItem('flowfi_vault')

        if (payments) {
          this.payments = JSON.parse(payments).map((p: any) => ({
            ...p,
            timestamp: new Date(p.timestamp)
          }))
        }

        if (splits) {
          this.splits = JSON.parse(splits).map((s: any) => ({
            ...s,
            timestamp: new Date(s.timestamp)
          }))
        }

        if (vault) {
          this.vaultTransactions = JSON.parse(vault).map((v: any) => ({
            ...v,
            timestamp: new Date(v.timestamp)
          }))
        }
      } catch (error) {
        console.error('Error loading from storage:', error)
      }
    }
  }

  // Reset for demo purposes
  reset() {
    this.payments = []
    this.splits = []
    this.vaultTransactions = []
    this.saveToStorage()
  }

  // Get stats for dashboard
  getStats() {
    const totalPayments = this.getTotalPayments()
    const totalRewards = this.getTotalRewards()
    const tier = this.getUserTier()
    const vaultBalance = this.getCurrentVaultBalance()
    const vaultYield = this.calculateVaultYield()
    const activeSplits = this.getActiveSplits()

    return {
      totalPayments: totalPayments.toFixed(4),
      totalRewards: totalRewards.toFixed(6),
      tier,
      tierProgress: this.getTierProgress(),
      vaultBalance: vaultBalance.toFixed(4),
      vaultYield: vaultYield.toFixed(6),
      activeSplitsCount: activeSplits.length,
      recentPayments: this.getRecentPayments(),
      activeSplits
    }
  }

  private getTierProgress(): { current: number; next: number; progress: number } {
    const total = this.getTotalPayments()
    const tier = this.getUserTier()
    
    const tiers = Object.entries(TIER_THRESHOLDS)
    const currentIndex = tiers.findIndex(([name]) => name === tier)
    
    if (currentIndex === tiers.length - 1) {
      // Already at highest tier
      return { current: total, next: total, progress: 100 }
    }

    const currentThreshold = tiers[currentIndex][1]
    const nextThreshold = tiers[currentIndex + 1][1]
    const progress = ((total - currentThreshold) / (nextThreshold - currentThreshold)) * 100

    return {
      current: total,
      next: nextThreshold,
      progress: Math.min(progress, 100)
    }
  }
}

// Singleton instance
export const calculator = new FlowFiCalculator()
