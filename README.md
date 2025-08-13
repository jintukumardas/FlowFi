# FlowFi - Consumer Payment Infrastructure with Smart Rewards

**Built for Morph Consumer Buildathon 2025**

FlowFi is a consumer-facing payment platform that enables smart recurring payments, social split bills, and automatic rewards on Morph L2. It combines the best of PayFi and Consumer tracks to deliver real user value with innovative on-chain mechanics.

## 🚀 Live Demo

**Try the 3-click demo:**
1. **Pay** → Make a payment to earn rewards
2. **Earn** → Receive FFI tokens with tier bonuses  
3. **Stake** → Auto-stake for 10% APY yield

**Demo URL:** *(will be deployed)*

## 📋 Problem & Solution

### Problem
Consumer payments are stuck in Web2:
- ❌ No programmable rewards or yield
- ❌ Limited social features for group expenses  
- ❌ High fees for cross-border payments
- ❌ No transparency in loyalty programs

### Solution
FlowFi provides PayFi infrastructure with consumer focus:
- ✅ **Smart Recurring Payments** with dynamic pricing
- ✅ **Social Split Bills** with on-chain verification
- ✅ **Programmable Rewards** via FFI token system
- ✅ **Auto Yield Generation** on idle balances
- ✅ **QR Payment System** for merchants

## 🏗️ Architecture

### Smart Contracts (Morph L2)

| Contract | Address | Purpose |
|----------|---------|---------|
| FlowFiCore | `0x...` | Main payment processing & merchant registry |
| RewardsManager | `0x...` | FFI token, staking & tier management |  
| SplitPayments | `0x...` | Social bill splitting & group management |
| YieldVault | `0x...` | Automatic yield farming for idle funds |

### Frontend Stack
- **Next.js 14** with App Router
- **Wagmi v2 + Viem** for blockchain interactions
- **TailwindCSS** for responsive UI
- **Framer Motion** for animations

## 🎯 Key Features

### 1. Smart Payment System
- **One-time payments** with instant settlement
- **Recurring subscriptions** with automated execution
- **Merchant integration** via QR codes
- **Multi-token support** (ETH, USDT, etc.)

### 2. Rewards & Staking
- **FFI Token** (ERC20) earned on every payment
- **Tier system** with spending-based bonuses:
  - Bronze (0+): 1% bonus
  - Silver (1000+): 1.5% bonus  
  - Gold (5000+): 2% bonus
  - Platinum (25000+): 3% bonus
- **Staking mechanism** with 10% APY

### 3. Social Features  
- **Bill splitting** with custom or equal amounts
- **Group management** for recurring expenses
- **Payment verification** via blockchain proofs
- **Social notifications** and reminders

### 4. Yield Generation
- **Auto-deposit** idle balances to yield vault
- **5% APY** on ETH, **8% APY** on USDT
- **Rewards paid** in FFI tokens
- **Emergency withdrawal** anytime

## 💰 Tokenomics & Business Model

### Revenue Streams
1. **Platform Fees:**
   - 0.3% on regular payments
   - 0.25% on split payments
2. **Merchant Services:**
   - QR code generation & analytics
   - Loyalty program management
3. **Yield Optimization:**
   - Performance fees on vault strategies

### FFI Token Utility
- **Rewards medium** for all platform activities
- **Staking rewards** at 10% APY base rate
- **Governance token** for protocol decisions
- **Fee discounts** for active stakers

## 🌐 Why Morph L2?

### Technical Advantages
- **Optimistic + ZK hybrid** for best of both worlds
- **~$0.01 transaction costs** perfect for consumer payments
- **~2 second finality** for instant user experience  
- **100% EVM compatibility** for easy development

### Market Alignment
- **Consumer-focused** positioning matches our target
- **PayFi narrative** aligns with payment innovation
- **Growing ecosystem** with developer support
- **Bridge to Ethereum** mainnet when ready

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- NPM or Yarn
- Foundry (for contracts)
- Git

### Quick Start

1. **Clone Repository**
   ```bash
   git clone <repo-url>
   cd flowfi
   ```

2. **Install Dependencies**
   ```bash
   # Smart contracts
   cd contracts && forge install
   
   # Frontend
   cd ../app && npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Add your private key and RPC URL
   ```

4. **Deploy Contracts**
   ```bash
   cd contracts
   forge script script/Deploy.s.sol --rpc-url $MORPH_RPC_URL --broadcast --verify
   ```

5. **Start Frontend**  
   ```bash
   cd app
   npm run dev
   ```

Visit `http://localhost:3000` to see the app.

### Testing

```bash
# Smart contract tests
cd contracts && forge test -vv

# Frontend tests (if implemented)
cd app && npm test
```

## 📡 Deployment

### Morph Testnet Configuration
- **Chain ID:** 2710
- **RPC:** https://rpc-quicknode-holesky.morphl2.io
- **Explorer:** https://explorer-testnet.morphl2.io
- **Faucet:** https://morphfaucet.com

### Contract Verification
Contracts are verified on the Morph block explorer with source code and ABIs publicly available.

### Frontend Deployment
Deployed on Vercel with automatic CI/CD from GitHub.

## 📊 Market Opportunity

### Market Size
- **PayFi Market:** $2.85T (2024) → $4.78T (2029)
- **Consumer Payments:** $2.1T annually  
- **Target Segment:** Gen Z/Millennial crypto-native users

### Competitive Advantage
**vs Traditional (Venmo, PayPal):**
- ✅ Programmable rewards & yield
- ✅ Global, permissionless access  
- ✅ Transparent, verifiable transactions

**vs Other Crypto (MetaMask):**
- ✅ Consumer-focused UX
- ✅ Integrated social features
- ✅ Built-in yield generation

## 🔮 Roadmap

### Phase 1 (Current) - MVP
- ✅ Core payment contracts
- ✅ Basic frontend with demo
- ✅ Morph testnet deployment

### Phase 2 - Features  
- 🚧 Advanced splitting algorithms
- 🚧 Mobile app (React Native)
- 🚧 Merchant dashboard

### Phase 3 - Scale
- 📋 Mainnet deployment
- 📋 Cross-chain expansion  
- 📋 Institutional partnerships

## 👥 Team & Contact

Built by the FlowFi team for Morph Consumer Buildathon 2025.

**Resources Used:**
- [Morph Documentation](https://docs.morphl2.io)
- [Morph Testnet Faucet](https://morphfaucet.com)  
- [Block Explorer](https://explorer-testnet.morphl2.io)
- [Buildathon Hub](https://dorahacks.io/hackathon/morph-consumer-buildathon)

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ on Morph L2 for the consumer finance future**