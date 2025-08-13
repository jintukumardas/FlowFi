// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title FlowFi Rewards Manager
 * @notice Manages FlowFi rewards token (FFI) and staking mechanisms
 * @dev Rewards are earned through payments and can be staked for yield
 */
contract RewardsManager is ERC20, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct StakeInfo {
        uint256 amount;
        uint256 timestamp;
        uint256 rewardDebt;
    }

    struct RewardTier {
        uint256 minSpent;
        uint256 multiplier; // In basis points (100 = 1%)
        string tierName;
    }

    mapping(address => StakeInfo) public userStakes;
    mapping(address => uint256) public userSpending;
    mapping(address => bool) public authorizedMinters;
    
    RewardTier[] public rewardTiers;
    
    uint256 public totalStaked;
    uint256 public rewardRate = 1000; // 10% APY in basis points
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant SECONDS_IN_YEAR = 365 days;
    
    address public flowFiCore;
    address public yieldVault;
    
    event RewardsMinted(address indexed user, uint256 amount);
    event TokensStaked(address indexed user, uint256 amount);
    event TokensUnstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event TierUpdated(address indexed user, string tierName);

    constructor() ERC20("FlowFi Token", "FFI") Ownable(msg.sender) {
        // Initialize reward tiers
        rewardTiers.push(RewardTier(0, 100, "Bronze")); // 1% bonus
        rewardTiers.push(RewardTier(1000 * 1e18, 150, "Silver")); // 1.5% bonus
        rewardTiers.push(RewardTier(5000 * 1e18, 200, "Gold")); // 2% bonus
        rewardTiers.push(RewardTier(25000 * 1e18, 300, "Platinum")); // 3% bonus
    }

    modifier onlyAuthorized() {
        require(authorizedMinters[msg.sender] || msg.sender == owner(), "Not authorized to mint");
        _;
    }

    function setFlowFiCore(address _flowFiCore) external onlyOwner {
        flowFiCore = _flowFiCore;
        authorizedMinters[_flowFiCore] = true;
    }

    function setYieldVault(address _yieldVault) external onlyOwner {
        yieldVault = _yieldVault;
        authorizedMinters[_yieldVault] = true;
    }

    function addAuthorizedMinter(address _minter) external onlyOwner {
        authorizedMinters[_minter] = true;
    }

    function removeAuthorizedMinter(address _minter) external onlyOwner {
        authorizedMinters[_minter] = false;
    }

    function mintRewards(address _user, uint256 _baseAmount, uint256 _spentAmount) external onlyAuthorized {
        // Update user spending for tier calculation
        userSpending[_user] += _spentAmount;
        
        // Calculate rewards with tier multiplier
        uint256 tierMultiplier = getUserTierMultiplier(_user);
        uint256 rewardAmount = (_baseAmount * tierMultiplier) / BASIS_POINTS;
        
        _mint(_user, rewardAmount);
        
        // Check for tier upgrade
        string memory newTier = checkTierUpgrade(_user);
        if (bytes(newTier).length > 0) {
            emit TierUpdated(_user, newTier);
        }
        
        emit RewardsMinted(_user, rewardAmount);
    }

    function stake(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Cannot stake 0 tokens");
        require(balanceOf(msg.sender) >= _amount, "Insufficient balance");

        StakeInfo storage userStake = userStakes[msg.sender];
        
        // Claim existing rewards
        if (userStake.amount > 0) {
            claimStakingRewards();
        }

        // Update stake info
        userStake.amount += _amount;
        userStake.timestamp = block.timestamp;
        userStake.rewardDebt = calculatePendingRewards(msg.sender);
        
        totalStaked += _amount;
        
        // Transfer tokens to this contract
        _transfer(msg.sender, address(this), _amount);
        
        emit TokensStaked(msg.sender, _amount);
    }

    function unstake(uint256 _amount) external nonReentrant {
        StakeInfo storage userStake = userStakes[msg.sender];
        require(userStake.amount >= _amount, "Insufficient staked amount");

        // Claim pending rewards
        claimStakingRewards();

        // Update stake info
        userStake.amount -= _amount;
        totalStaked -= _amount;

        // Transfer tokens back to user
        _transfer(address(this), msg.sender, _amount);

        emit TokensUnstaked(msg.sender, _amount);
    }

    function claimStakingRewards() public nonReentrant {
        uint256 pending = calculatePendingRewards(msg.sender);
        if (pending > 0) {
            StakeInfo storage userStake = userStakes[msg.sender];
            userStake.rewardDebt = pending;
            userStake.timestamp = block.timestamp;
            
            _mint(msg.sender, pending);
            emit RewardsClaimed(msg.sender, pending);
        }
    }

    function calculatePendingRewards(address _user) public view returns (uint256) {
        StakeInfo memory userStake = userStakes[_user];
        if (userStake.amount == 0) return 0;

        uint256 timeStaked = block.timestamp - userStake.timestamp;
        uint256 yearlyReward = (userStake.amount * rewardRate) / BASIS_POINTS;
        uint256 timeReward = (yearlyReward * timeStaked) / SECONDS_IN_YEAR;
        
        return timeReward - userStake.rewardDebt;
    }

    function getUserTierMultiplier(address _user) public view returns (uint256) {
        uint256 userSpent = userSpending[_user];
        
        for (int256 i = int256(rewardTiers.length) - 1; i >= 0; i--) {
            if (userSpent >= rewardTiers[uint256(i)].minSpent) {
                return rewardTiers[uint256(i)].multiplier;
            }
        }
        
        return rewardTiers[0].multiplier; // Default to Bronze
    }

    function getUserTier(address _user) public view returns (string memory) {
        uint256 userSpent = userSpending[_user];
        
        for (int256 i = int256(rewardTiers.length) - 1; i >= 0; i--) {
            if (userSpent >= rewardTiers[uint256(i)].minSpent) {
                return rewardTiers[uint256(i)].tierName;
            }
        }
        
        return rewardTiers[0].tierName; // Default to Bronze
    }

    function checkTierUpgrade(address _user) internal view returns (string memory) {
        uint256 userSpent = userSpending[_user];
        
        // Check if user qualifies for a higher tier
        for (uint256 i = 1; i < rewardTiers.length; i++) {
            if (userSpent >= rewardTiers[i].minSpent && userSpent < rewardTiers[i].minSpent + 1000 * 1e18) {
                return rewardTiers[i].tierName;
            }
        }
        
        return "";
    }

    function addRewardTier(
        uint256 _minSpent,
        uint256 _multiplier,
        string calldata _tierName
    ) external onlyOwner {
        rewardTiers.push(RewardTier(_minSpent, _multiplier, _tierName));
    }

    function updateRewardRate(uint256 _newRate) external onlyOwner {
        require(_newRate <= 5000, "Rate too high"); // Max 50% APY
        rewardRate = _newRate;
    }

    function getStakeInfo(address _user) external view returns (StakeInfo memory) {
        return userStakes[_user];
    }

    function getAllTiers() external view returns (RewardTier[] memory) {
        return rewardTiers;
    }

    // Emergency functions
    function emergencyWithdraw() external nonReentrant {
        StakeInfo storage userStake = userStakes[msg.sender];
        uint256 amount = userStake.amount;
        require(amount > 0, "No tokens staked");

        userStake.amount = 0;
        totalStaked -= amount;

        _transfer(address(this), msg.sender, amount);
        emit TokensUnstaked(msg.sender, amount);
    }
}