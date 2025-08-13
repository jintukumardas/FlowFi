import { http, createConfig } from 'wagmi'
import { injected } from 'wagmi/connectors'

// Morph Holesky Testnet Configuration (Updated Chain ID)
export const morphTestnetConfig = {
  id: 2810,
  name: 'Morph Holesky Testnet',
  network: 'morph-holesky',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['https://rpc-quicknode-holesky.morphl2.io'] },
    default: { http: ['https://rpc-quicknode-holesky.morphl2.io'] },
  },
  blockExplorers: {
    default: { name: 'Morph Explorer', url: 'https://explorer-holesky.morphl2.io' },
  },
  testnet: true,
}

// Contract Addresses (Deployed on Morph Holesky Testnet)
export const CONTRACT_ADDRESSES = {
  FLOWFI_CORE: '0xC3d8AfB3462f726Db9d793DefdCFC67D7E12DBa3',
  REWARDS_MANAGER: '0xfF0e7F71a0e19E0BF037Bd90Ba30A2Ee409E53a7',
  SPLIT_PAYMENTS: '0xe4ab654a03826E15039913D0D0E1E4Af2117bA0d', 
  YIELD_VAULT: '0x3b4cAE62020487263Fc079312f9199a1b014BF6b',
} as const

// Simplified Wagmi Configuration (Injected wallet only for demo)
export const config = createConfig({
  chains: [morphTestnetConfig],
  connectors: [
    injected(),
  ],
  transports: {
    [morphTestnetConfig.id]: http(),
  },
})

// Demo Configuration
export const DEMO_CONFIG = {
  DEMO_MERCHANT: {
    address: '0x742d35Cc6438C0532925a3b8AAD43E6eDeDA2DB3', // Example address
    name: 'Demo Coffee Shop',
    category: 'Food & Beverage',
    rewardRate: 200, // 2%
  },
  TEST_AMOUNTS: {
    SMALL_PAYMENT: '0.001', // 0.001 ETH
    MEDIUM_PAYMENT: '0.005', // 0.005 ETH
    LARGE_PAYMENT: '0.01', // 0.01 ETH
  },
  FAUCET_URL: 'https://morphfaucet.com/',
}