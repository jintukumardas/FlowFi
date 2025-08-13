// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title FlowFi Core Payment System
 * @notice Main contract for FlowFi payment processing with rewards integration
 * @dev Deployed on Morph L2 for consumer payments
 */
contract FlowFiCore is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Payment {
        address from;
        address to;
        uint256 amount;
        address token;
        uint256 timestamp;
        string description;
        bool isCompleted;
    }

    struct RecurringPayment {
        address from;
        address to;
        uint256 amount;
        address token;
        uint256 interval;
        uint256 nextPayment;
        bool isActive;
        string description;
    }

    struct Merchant {
        address wallet;
        string name;
        string category;
        uint256 rewardRate;
        bool isActive;
    }

    mapping(bytes32 => Payment) public payments;
    mapping(bytes32 => RecurringPayment) public recurringPayments;
    mapping(address => Merchant) public merchants;
    mapping(address => uint256) public userRewards;
    
    address public rewardsManager;
    address public splitPaymentsContract;
    uint256 public platformFee = 30; // 0.3%
    uint256 public constant BASIS_POINTS = 10000;
    
    bytes32[] public allPaymentIds;
    bytes32[] public allRecurringIds;
    
    event PaymentCreated(bytes32 indexed paymentId, address indexed from, address indexed to, uint256 amount);
    event PaymentCompleted(bytes32 indexed paymentId);
    event RecurringPaymentCreated(bytes32 indexed recurringId, address indexed from, address indexed to);
    event RecurringPaymentExecuted(bytes32 indexed recurringId, bytes32 indexed paymentId);
    event MerchantRegistered(address indexed merchant, string name);
    event RewardsEarned(address indexed user, uint256 amount);

    constructor() Ownable(msg.sender) {}

    function setRewardsManager(address _rewardsManager) external onlyOwner {
        rewardsManager = _rewardsManager;
    }

    function setSplitPaymentsContract(address _splitPayments) external onlyOwner {
        splitPaymentsContract = _splitPayments;
    }

    function registerMerchant(
        string calldata _name,
        string calldata _category,
        uint256 _rewardRate
    ) external {
        require(_rewardRate <= 500, "Reward rate too high"); // Max 5%
        
        merchants[msg.sender] = Merchant({
            wallet: msg.sender,
            name: _name,
            category: _category,
            rewardRate: _rewardRate,
            isActive: true
        });

        emit MerchantRegistered(msg.sender, _name);
    }

    function createPayment(
        address _to,
        uint256 _amount,
        address _token,
        string calldata _description
    ) external returns (bytes32 paymentId) {
        require(_to != address(0), "Invalid recipient");
        require(_amount > 0, "Amount must be positive");

        paymentId = keccak256(abi.encodePacked(msg.sender, _to, _amount, block.timestamp));
        
        payments[paymentId] = Payment({
            from: msg.sender,
            to: _to,
            amount: _amount,
            token: _token,
            timestamp: block.timestamp,
            description: _description,
            isCompleted: false
        });

        allPaymentIds.push(paymentId);
        emit PaymentCreated(paymentId, msg.sender, _to, _amount);
    }

    function executePayment(bytes32 _paymentId) external payable nonReentrant {
        Payment storage payment = payments[_paymentId];
        require(payment.from == msg.sender, "Only sender can execute");
        require(!payment.isCompleted, "Payment already completed");

        uint256 fee = (payment.amount * platformFee) / BASIS_POINTS;
        uint256 netAmount = payment.amount - fee;

        if (payment.token == address(0)) {
            require(msg.value >= payment.amount, "Insufficient ETH");
            
            payable(payment.to).transfer(netAmount);
            payable(owner()).transfer(fee);
        } else {
            IERC20 token = IERC20(payment.token);
            token.safeTransferFrom(msg.sender, payment.to, netAmount);
            token.safeTransferFrom(msg.sender, owner(), fee);
        }

        payment.isCompleted = true;

        // Calculate and distribute rewards
        if (merchants[payment.to].isActive) {
            uint256 rewardAmount = (payment.amount * merchants[payment.to].rewardRate) / BASIS_POINTS;
            userRewards[msg.sender] += rewardAmount;
            emit RewardsEarned(msg.sender, rewardAmount);
        }

        emit PaymentCompleted(_paymentId);
    }

    function createRecurringPayment(
        address _to,
        uint256 _amount,
        address _token,
        uint256 _interval,
        string calldata _description
    ) external returns (bytes32 recurringId) {
        require(_to != address(0), "Invalid recipient");
        require(_amount > 0, "Amount must be positive");
        require(_interval >= 1 days, "Interval too short");

        recurringId = keccak256(abi.encodePacked(msg.sender, _to, _amount, _interval, block.timestamp));
        
        recurringPayments[recurringId] = RecurringPayment({
            from: msg.sender,
            to: _to,
            amount: _amount,
            token: _token,
            interval: _interval,
            nextPayment: block.timestamp + _interval,
            isActive: true,
            description: _description
        });

        allRecurringIds.push(recurringId);
        emit RecurringPaymentCreated(recurringId, msg.sender, _to);
    }

    function executeRecurringPayment(bytes32 _recurringId) external nonReentrant {
        RecurringPayment storage recurring = recurringPayments[_recurringId];
        require(recurring.isActive, "Recurring payment not active");
        require(block.timestamp >= recurring.nextPayment, "Too early");

        // Create and execute payment
        bytes32 paymentId = keccak256(abi.encodePacked(_recurringId, block.timestamp));
        
        payments[paymentId] = Payment({
            from: recurring.from,
            to: recurring.to,
            amount: recurring.amount,
            token: recurring.token,
            timestamp: block.timestamp,
            description: recurring.description,
            isCompleted: false
        });

        allPaymentIds.push(paymentId);

        uint256 fee = (recurring.amount * platformFee) / BASIS_POINTS;
        uint256 netAmount = recurring.amount - fee;

        if (recurring.token == address(0)) {
            require(address(this).balance >= recurring.amount, "Insufficient contract balance");
            payable(recurring.to).transfer(netAmount);
            payable(owner()).transfer(fee);
        } else {
            IERC20 token = IERC20(recurring.token);
            token.safeTransfer(recurring.to, netAmount);
            token.safeTransfer(owner(), fee);
        }

        payments[paymentId].isCompleted = true;
        recurring.nextPayment += recurring.interval;

        // Calculate rewards for merchant payments
        if (merchants[recurring.to].isActive) {
            uint256 rewardAmount = (recurring.amount * merchants[recurring.to].rewardRate) / BASIS_POINTS;
            userRewards[recurring.from] += rewardAmount;
            emit RewardsEarned(recurring.from, rewardAmount);
        }

        emit RecurringPaymentExecuted(_recurringId, paymentId);
        emit PaymentCompleted(paymentId);
    }

    function cancelRecurringPayment(bytes32 _recurringId) external {
        RecurringPayment storage recurring = recurringPayments[_recurringId];
        require(recurring.from == msg.sender, "Only sender can cancel");
        recurring.isActive = false;
    }

    function depositForRecurring() external payable {
        // Allow users to deposit ETH for automatic recurring payments
    }

    function getPayment(bytes32 _paymentId) external view returns (Payment memory) {
        return payments[_paymentId];
    }

    function getRecurringPayment(bytes32 _recurringId) external view returns (RecurringPayment memory) {
        return recurringPayments[_recurringId];
    }

    function getMerchant(address _merchant) external view returns (Merchant memory) {
        return merchants[_merchant];
    }

    function getAllPaymentIds() external view returns (bytes32[] memory) {
        return allPaymentIds;
    }

    function getAllRecurringIds() external view returns (bytes32[] memory) {
        return allRecurringIds;
    }

    function updatePlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 100, "Fee too high"); // Max 1%
        platformFee = _newFee;
    }

    receive() external payable {
        // Allow ETH deposits for recurring payments
    }
}