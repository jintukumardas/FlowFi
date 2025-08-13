// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title FlowFi Yield Vault
 * @notice Automatically generates yield on idle balances
 * @dev Simple yield mechanism for unused funds in FlowFi ecosystem
 */
contract YieldVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct UserDeposit {
        uint256 amount;
        uint256 depositTime;
        uint256 lastClaimTime;
        address token;
    }

    mapping(address => mapping(address => UserDeposit)) public userDeposits; // user => token => deposit
    mapping(address => bool) public supportedTokens;
    mapping(address => uint256) public tokenYieldRates; // Annual yield rate in basis points
    mapping(address => uint256) public totalDeposited;

    address public rewardsManager;
    address public flowFiCore;

    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant SECONDS_IN_YEAR = 365 days;
    uint256 public minDepositTime = 1 days;

    event Deposited(address indexed user, address indexed token, uint256 amount);
    event Withdrawn(address indexed user, address indexed token, uint256 amount);
    event YieldClaimed(address indexed user, address indexed token, uint256 yieldAmount);
    event TokenAdded(address indexed token, uint256 yieldRate);
    event YieldRateUpdated(address indexed token, uint256 newRate);

    constructor() Ownable(msg.sender) {
        // Add ETH as supported token (address(0) represents ETH)
        supportedTokens[address(0)] = true;
        tokenYieldRates[address(0)] = 500; // 5% APY for ETH
    }

    modifier onlyFlowFiCore() {
        require(msg.sender == flowFiCore, "Only FlowFi Core");
        _;
    }

    function setRewardsManager(address _rewardsManager) external onlyOwner {
        rewardsManager = _rewardsManager;
    }

    function setFlowFiCore(address _flowFiCore) external onlyOwner {
        flowFiCore = _flowFiCore;
    }

    function addSupportedToken(address _token, uint256 _yieldRate) external onlyOwner {
        require(_yieldRate <= 2000, "Yield rate too high"); // Max 20% APY
        supportedTokens[_token] = true;
        tokenYieldRates[_token] = _yieldRate;
        emit TokenAdded(_token, _yieldRate);
    }

    function updateYieldRate(address _token, uint256 _newRate) external onlyOwner {
        require(supportedTokens[_token], "Token not supported");
        require(_newRate <= 2000, "Yield rate too high");
        tokenYieldRates[_token] = _newRate;
        emit YieldRateUpdated(_token, _newRate);
    }

    function deposit(address _token, uint256 _amount) external payable nonReentrant {
        require(supportedTokens[_token], "Token not supported");
        require(_amount > 0, "Amount must be positive");

        UserDeposit storage userDeposit = userDeposits[msg.sender][_token];

        // Claim any existing yield before updating deposit
        if (userDeposit.amount > 0) {
            _claimYield(msg.sender, _token);
        }

        if (_token == address(0)) {
            require(msg.value == _amount, "ETH amount mismatch");
        } else {
            IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        }

        userDeposit.amount += _amount;
        userDeposit.depositTime = block.timestamp;
        userDeposit.lastClaimTime = block.timestamp;
        userDeposit.token = _token;

        totalDeposited[_token] += _amount;

        emit Deposited(msg.sender, _token, _amount);
    }

    function withdraw(address _token, uint256 _amount) external nonReentrant {
        UserDeposit storage userDeposit = userDeposits[msg.sender][_token];
        require(userDeposit.amount >= _amount, "Insufficient deposit");

        // Claim yield before withdrawal
        _claimYield(msg.sender, _token);

        userDeposit.amount -= _amount;
        totalDeposited[_token] -= _amount;

        if (_token == address(0)) {
            payable(msg.sender).transfer(_amount);
        } else {
            IERC20(_token).safeTransfer(msg.sender, _amount);
        }

        emit Withdrawn(msg.sender, _token, _amount);
    }

    function claimYield(address _token) external nonReentrant {
        _claimYield(msg.sender, _token);
    }

    function _claimYield(address _user, address _token) internal {
        UserDeposit storage userDeposit = userDeposits[_user][_token];
        if (userDeposit.amount == 0) return;

        uint256 yieldAmount = calculatePendingYield(_user, _token);
        if (yieldAmount > 0) {
            userDeposit.lastClaimTime = block.timestamp;

            // Mint FlowFi rewards tokens as yield
            if (rewardsManager != address(0)) {
                // Convert yield to FlowFi tokens (1:1 ratio for simplicity)
                try IRewardsManager(rewardsManager).mintRewards(_user, yieldAmount, 0) {
                    emit YieldClaimed(_user, _token, yieldAmount);
                } catch {
                    // If rewards minting fails, yield remains claimable
                }
            }
        }
    }

    function calculatePendingYield(address _user, address _token) public view returns (uint256) {
        UserDeposit memory userDeposit = userDeposits[_user][_token];
        if (userDeposit.amount == 0) return 0;

        uint256 timeElapsed = block.timestamp - userDeposit.lastClaimTime;
        if (timeElapsed < minDepositTime) return 0;

        uint256 yieldRate = tokenYieldRates[_token];
        uint256 annualYield = (userDeposit.amount * yieldRate) / BASIS_POINTS;
        uint256 yieldAmount = (annualYield * timeElapsed) / SECONDS_IN_YEAR;

        return yieldAmount;
    }

    function getUserDeposit(address _user, address _token) external view returns (UserDeposit memory) {
        return userDeposits[_user][_token];
    }

    function getTokenInfo(address _token) external view returns (bool supported, uint256 yieldRate, uint256 totalDeposits) {
        supported = supportedTokens[_token];
        yieldRate = tokenYieldRates[_token];
        totalDeposits = totalDeposited[_token];
    }

    // Auto-deposit function for FlowFi Core integration
    function autoDeposit(address _user, address _token, uint256 _amount) external onlyFlowFiCore {
        require(supportedTokens[_token], "Token not supported");
        require(_amount > 0, "Amount must be positive");

        UserDeposit storage userDeposit = userDeposits[_user][_token];

        // Claim any existing yield
        if (userDeposit.amount > 0) {
            _claimYield(_user, _token);
        }

        userDeposit.amount += _amount;
        userDeposit.depositTime = block.timestamp;
        userDeposit.lastClaimTime = block.timestamp;
        userDeposit.token = _token;

        totalDeposited[_token] += _amount;

        emit Deposited(_user, _token, _amount);
    }

    // Emergency functions
    function emergencyWithdraw(address _token) external nonReentrant {
        UserDeposit storage userDeposit = userDeposits[msg.sender][_token];
        uint256 amount = userDeposit.amount;
        require(amount > 0, "No deposit to withdraw");

        userDeposit.amount = 0;
        totalDeposited[_token] -= amount;

        if (_token == address(0)) {
            payable(msg.sender).transfer(amount);
        } else {
            IERC20(_token).safeTransfer(msg.sender, amount);
        }

        emit Withdrawn(msg.sender, _token, amount);
    }

    receive() external payable {
        // ETH deposits handled via deposit function
    }
}

// Interface for RewardsManager
interface IRewardsManager {
    function mintRewards(address _user, uint256 _baseAmount, uint256 _spentAmount) external;
}