import { http, createConfig } from 'wagmi'
import { morphTestnet } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

// Morph Testnet Configuration
export const morphTestnetConfig = {
  id: 2710,
  name: 'Morph Testnet',
  network: 'morph-testnet',
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
    default: { name: 'Morph Explorer', url: 'https://explorer-testnet.morphl2.io' },
  },
  testnet: true,
}

// Contract Addresses (Update after deployment)
export const CONTRACT_ADDRESSES = {
  FLOWFI_CORE: '0x...', // Will be updated after deployment
  REWARDS_MANAGER: '0x...', // Will be updated after deployment  
  SPLIT_PAYMENTS: '0x...', // Will be updated after deployment
  YIELD_VAULT: '0x...', // Will be updated after deployment
} as const

// Wagmi Configuration
export const config = createConfig({
  chains: [morphTestnetConfig],
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
    }),
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