// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title FlowFi Split Payments
 * @notice Handles social split payments and group expense management
 * @dev Enables splitting bills among friends with on-chain verification
 */
contract SplitPayments is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum SplitStatus {
        Created,
        Active,
        Completed,
        Cancelled
    }

    struct SplitPayment {
        bytes32 splitId;
        address creator;
        uint256 totalAmount;
        address token;
        string description;
        SplitStatus status;
        uint256 createdAt;
        uint256 deadline;
        address merchant;
    }

    struct Participant {
        address wallet;
        uint256 owedAmount;
        bool hasPaid;
        uint256 paidAt;
    }

    struct Group {
        string name;
        address[] members;
        address admin;
        bool isActive;
        uint256 createdAt;
    }

    mapping(bytes32 => SplitPayment) public splitPayments;
    mapping(bytes32 => mapping(address => Participant)) public participants;
    mapping(bytes32 => address[]) public splitParticipants;
    mapping(bytes32 => Group) public groups;
    mapping(address => bytes32[]) public userSplits;
    mapping(address => bytes32[]) public userGroups;

    bytes32[] public allSplitIds;
    bytes32[] public allGroupIds;

    uint256 public platformFee = 25; // 0.25%
    uint256 public constant BASIS_POINTS = 10000;

    event SplitCreated(bytes32 indexed splitId, address indexed creator, uint256 totalAmount);
    event ParticipantAdded(bytes32 indexed splitId, address indexed participant, uint256 amount);
    event PaymentMade(bytes32 indexed splitId, address indexed participant, uint256 amount);
    event SplitCompleted(bytes32 indexed splitId);
    event SplitCancelled(bytes32 indexed splitId);
    event GroupCreated(bytes32 indexed groupId, string name, address indexed admin);
    event MemberAdded(bytes32 indexed groupId, address indexed member);

    constructor() Ownable(msg.sender) {}

    function createSplit(
        uint256 _totalAmount,
        address _token,
        string calldata _description,
        uint256 _deadline,
        address _merchant
    ) external returns (bytes32 splitId) {
        require(_totalAmount > 0, "Amount must be positive");
        require(_deadline > block.timestamp, "Invalid deadline");

        splitId = keccak256(abi.encodePacked(msg.sender, _totalAmount, block.timestamp));

        splitPayments[splitId] = SplitPayment({
            splitId: splitId,
            creator: msg.sender,
            totalAmount: _totalAmount,
            token: _token,
            description: _description,
            status: SplitStatus.Created,
            createdAt: block.timestamp,
            deadline: _deadline,
            merchant: _merchant
        });

        allSplitIds.push(splitId);
        userSplits[msg.sender].push(splitId);

        emit SplitCreated(splitId, msg.sender, _totalAmount);
    }

    function addParticipant(
        bytes32 _splitId,
        address _participant,
        uint256 _amount
    ) external {
        SplitPayment storage split = splitPayments[_splitId];
        require(split.creator == msg.sender, "Only creator can add participants");
        require(split.status == SplitStatus.Created, "Split not in created state");
        require(participants[_splitId][_participant].wallet == address(0), "Participant already added");

        participants[_splitId][_participant] = Participant({
            wallet: _participant,
            owedAmount: _amount,
            hasPaid: false,
            paidAt: 0
        });

        splitParticipants[_splitId].push(_participant);
        userSplits[_participant].push(_splitId);

        emit ParticipantAdded(_splitId, _participant, _amount);
    }

    function addMultipleParticipants(
        bytes32 _splitId,
        address[] calldata _participants,
        uint256[] calldata _amounts
    ) external {
        require(_participants.length == _amounts.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < _participants.length; i++) {
            // Inline the addParticipant logic to avoid forward declaration issues
            SplitPayment storage split = splitPayments[_splitId];
            require(split.creator == msg.sender, "Only creator can add participants");
            require(split.status == SplitStatus.Created, "Split not in created state");
            require(participants[_splitId][_participants[i]].wallet == address(0), "Participant already added");

            participants[_splitId][_participants[i]] = Participant({
                wallet: _participants[i],
                owedAmount: _amounts[i],
                hasPaid: false,
                paidAt: 0
            });

            splitParticipants[_splitId].push(_participants[i]);
            userSplits[_participants[i]].push(_splitId);

            emit ParticipantAdded(_splitId, _participants[i], _amounts[i]);
        }
    }

    function activateSplit(bytes32 _splitId) external {
        SplitPayment storage split = splitPayments[_splitId];
        require(split.creator == msg.sender, "Only creator can activate");
        require(split.status == SplitStatus.Created, "Split not in created state");
        
        // Verify total amounts match
        uint256 totalOwed = 0;
        address[] memory participantList = splitParticipants[_splitId];
        for (uint256 i = 0; i < participantList.length; i++) {
            totalOwed += participants[_splitId][participantList[i]].owedAmount;
        }
        require(totalOwed == split.totalAmount, "Amounts don't match total");

        split.status = SplitStatus.Active;
    }

    function payShare(bytes32 _splitId) external payable nonReentrant {
        SplitPayment storage split = splitPayments[_splitId];
        Participant storage participant = participants[_splitId][msg.sender];
        
        require(split.status == SplitStatus.Active, "Split not active");
        require(block.timestamp <= split.deadline, "Payment deadline passed");
        require(participant.wallet != address(0), "Not a participant");
        require(!participant.hasPaid, "Already paid");

        uint256 fee = (participant.owedAmount * platformFee) / BASIS_POINTS;
        uint256 netAmount = participant.owedAmount - fee;

        if (split.token == address(0)) {
            require(msg.value >= participant.owedAmount, "Insufficient ETH");
            
            // Pay to merchant or creator
            address recipient = split.merchant != address(0) ? split.merchant : split.creator;
            payable(recipient).transfer(netAmount);
            payable(owner()).transfer(fee);
            
            // Refund excess
            if (msg.value > participant.owedAmount) {
                payable(msg.sender).transfer(msg.value - participant.owedAmount);
            }
        } else {
            IERC20 token = IERC20(split.token);
            address recipient = split.merchant != address(0) ? split.merchant : split.creator;
            
            token.safeTransferFrom(msg.sender, recipient, netAmount);
            token.safeTransferFrom(msg.sender, owner(), fee);
        }

        participant.hasPaid = true;
        participant.paidAt = block.timestamp;

        emit PaymentMade(_splitId, msg.sender, participant.owedAmount);

        // Check if split is completed
        if (isAllPaid(_splitId)) {
            split.status = SplitStatus.Completed;
            emit SplitCompleted(_splitId);
        }
    }

    function createEqualSplit(
        uint256 _totalAmount,
        address _token,
        string calldata _description,
        uint256 _deadline,
        address[] calldata _participants,
        address _merchant
    ) external returns (bytes32 splitId) {
        require(_participants.length > 0, "Need participants");
        require(_totalAmount > 0, "Amount must be positive");
        require(_deadline > block.timestamp, "Invalid deadline");

        splitId = keccak256(abi.encodePacked(msg.sender, _totalAmount, block.timestamp));

        splitPayments[splitId] = SplitPayment({
            splitId: splitId,
            creator: msg.sender,
            totalAmount: _totalAmount,
            token: _token,
            description: _description,
            status: SplitStatus.Created,
            createdAt: block.timestamp,
            deadline: _deadline,
            merchant: _merchant
        });

        allSplitIds.push(splitId);
        userSplits[msg.sender].push(splitId);
        
        uint256 amountPerPerson = _totalAmount / (_participants.length + 1); // +1 for creator
        
        // Add creator as participant
        participants[splitId][msg.sender] = Participant({
            wallet: msg.sender,
            owedAmount: amountPerPerson,
            hasPaid: false,
            paidAt: 0
        });
        splitParticipants[splitId].push(msg.sender);
        
        // Add other participants
        for (uint256 i = 0; i < _participants.length; i++) {
            participants[splitId][_participants[i]] = Participant({
                wallet: _participants[i],
                owedAmount: amountPerPerson,
                hasPaid: false,
                paidAt: 0
            });
            splitParticipants[splitId].push(_participants[i]);
            userSplits[_participants[i]].push(splitId);
        }
        
        // Activate the split
        splitPayments[splitId].status = SplitStatus.Active;
        
        emit SplitCreated(splitId, msg.sender, _totalAmount);
        return splitId;
    }

    function createGroup(
        string calldata _name,
        address[] calldata _members
    ) external returns (bytes32 groupId) {
        groupId = keccak256(abi.encodePacked(msg.sender, _name, block.timestamp));

        address[] memory allMembers = new address[](_members.length + 1);
        allMembers[0] = msg.sender;
        for (uint256 i = 0; i < _members.length; i++) {
            allMembers[i + 1] = _members[i];
        }

        groups[groupId] = Group({
            name: _name,
            members: allMembers,
            admin: msg.sender,
            isActive: true,
            createdAt: block.timestamp
        });

        allGroupIds.push(groupId);
        userGroups[msg.sender].push(groupId);

        for (uint256 i = 0; i < _members.length; i++) {
            userGroups[_members[i]].push(groupId);
        }

        emit GroupCreated(groupId, _name, msg.sender);
    }

    function createGroupSplit(
        bytes32 _groupId,
        uint256 _totalAmount,
        address _token,
        string calldata _description,
        uint256 _deadline,
        address _merchant
    ) external returns (bytes32 splitId) {
        Group memory group = groups[_groupId];
        require(group.admin == msg.sender, "Only group admin");
        require(group.isActive, "Group not active");
        require(_totalAmount > 0, "Amount must be positive");
        require(_deadline > block.timestamp, "Invalid deadline");

        splitId = keccak256(abi.encodePacked(msg.sender, _totalAmount, block.timestamp, _groupId));

        splitPayments[splitId] = SplitPayment({
            splitId: splitId,
            creator: msg.sender,
            totalAmount: _totalAmount,
            token: _token,
            description: _description,
            status: SplitStatus.Active,
            createdAt: block.timestamp,
            deadline: _deadline,
            merchant: _merchant
        });

        allSplitIds.push(splitId);
        userSplits[msg.sender].push(splitId);
        
        uint256 amountPerMember = _totalAmount / group.members.length;
        
        for (uint256 i = 0; i < group.members.length; i++) {
            participants[splitId][group.members[i]] = Participant({
                wallet: group.members[i],
                owedAmount: amountPerMember,
                hasPaid: false,
                paidAt: 0
            });
            splitParticipants[splitId].push(group.members[i]);
            userSplits[group.members[i]].push(splitId);
        }
        
        emit SplitCreated(splitId, msg.sender, _totalAmount);
        return splitId;
    }

    function cancelSplit(bytes32 _splitId) external {
        SplitPayment storage split = splitPayments[_splitId];
        require(split.creator == msg.sender, "Only creator can cancel");
        require(split.status == SplitStatus.Active || split.status == SplitStatus.Created, "Cannot cancel");

        split.status = SplitStatus.Cancelled;
        emit SplitCancelled(_splitId);
    }

    function isAllPaid(bytes32 _splitId) internal view returns (bool) {
        address[] memory participantList = splitParticipants[_splitId];
        for (uint256 i = 0; i < participantList.length; i++) {
            if (!participants[_splitId][participantList[i]].hasPaid) {
                return false;
            }
        }
        return true;
    }

    function getSplitInfo(bytes32 _splitId) external view returns (
        SplitPayment memory split,
        address[] memory participantList,
        bool[] memory paidStatus
    ) {
        split = splitPayments[_splitId];
        participantList = splitParticipants[_splitId];
        paidStatus = new bool[](participantList.length);
        
        for (uint256 i = 0; i < participantList.length; i++) {
            paidStatus[i] = participants[_splitId][participantList[i]].hasPaid;
        }
    }

    function getUserSplits(address _user) external view returns (bytes32[] memory) {
        return userSplits[_user];
    }

    function getUserGroups(address _user) external view returns (bytes32[] memory) {
        return userGroups[_user];
    }

    function getGroup(bytes32 _groupId) external view returns (Group memory) {
        return groups[_groupId];
    }

    function getAllSplitIds() external view returns (bytes32[] memory) {
        return allSplitIds;
    }

    function updatePlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 100, "Fee too high");
        platformFee = _newFee;
    }
}