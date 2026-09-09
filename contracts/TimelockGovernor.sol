// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.28;

/**
 * @title TimelockGovernor
 * @notice 48-Hour delay window controller with 2-of-3 multisig quorum and instant emergency circuit breaker.
 */
contract TimelockGovernor {
    address public admin1;
    address public admin2;
    address public admin3;

    uint256 public delay; // Delay in seconds (e.g. 172800 = 48 hours)
    bool public isPaused;

    struct Proposal {
        address target;
        uint256 value;
        bytes data;
        uint256 eta;
        uint8 approvalMask; // bit 0 for admin1, bit 1 for admin2, bit 2 for admin3
        bool executed;
    }

    mapping(bytes32 => Proposal) public proposals;

    event ProposalQueued(bytes32 indexed proposalId, address target, uint256 eta);
    event ProposalApproved(bytes32 indexed proposalId, address approver, uint8 newMask);
    event ProposalExecuted(bytes32 indexed proposalId, address target);
    event EmergencyPaused(address indexed triggerAdmin);
    event Unpaused();

    modifier onlyAdmin() {
        require(msg.sender == admin1 || msg.sender == admin2 || msg.sender == admin3, "Timelock: caller not admin");
        _;
    }

    modifier whenNotPaused() {
        require(!isPaused, "Timelock: system is emergency paused");
        _;
    }

    constructor(address _a1, address _a2, address _a3, uint256 _delay) {
        require(_a1 != address(0) && _a2 != address(0) && _a3 != address(0), "Timelock: zero admin");
        require(_a1 != _a2 && _a2 != _a3 && _a1 != _a3, "Timelock: duplicate admins");
        admin1 = _a1;
        admin2 = _a2;
        admin3 = _a3;
        delay = _delay;
    }

    function emergencyPause() external onlyAdmin {
        isPaused = true;
        emit EmergencyPaused(msg.sender);
    }

    function unpause(bytes32 hash, bytes calldata sig1, bytes calldata sig2) external {
        bytes32 ethHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
        address s1 = recover(ethHash, sig1);
        address s2 = recover(ethHash, sig2);

        require(s1 != s2, "Timelock: duplicate unpause signers");
        require(isAdmin(s1) && isAdmin(s2), "Timelock: invalid unpause multisig signers");

        isPaused = false;
        emit Unpaused();
    }

    function queueProposal(address target, uint256 value, bytes calldata data) external onlyAdmin whenNotPaused returns (bytes32) {
        uint256 eta = block.timestamp + delay;
        bytes32 proposalId = keccak256(abi.encode(target, value, data, eta, block.chainid));

        require(proposals[proposalId].eta == 0, "Timelock: proposal already queued");

        uint8 initialMask = getAdminBit(msg.sender);
        proposals[proposalId] = Proposal({
            target: target,
            value: value,
            data: data,
            eta: eta,
            approvalMask: initialMask,
            executed: false
        });

        emit ProposalQueued(proposalId, target, eta);
        return proposalId;
    }

    function approveProposal(bytes32 proposalId) external onlyAdmin whenNotPaused {
        Proposal storage p = proposals[proposalId];
        require(p.eta > 0, "Timelock: proposal not found");
        require(!p.executed, "Timelock: proposal already executed");

        uint8 bit = getAdminBit(msg.sender);
        p.approvalMask |= bit;

        emit ProposalApproved(proposalId, msg.sender, p.approvalMask);
    }

    function executeProposal(bytes32 proposalId) external payable whenNotPaused returns (bytes memory) {
        Proposal storage p = proposals[proposalId];
        require(p.eta > 0, "Timelock: proposal not found");
        require(!p.executed, "Timelock: proposal already executed");
        require(block.timestamp >= p.eta, "Timelock: delay has not yet elapsed");
        require(countApprovals(p.approvalMask) >= 2, "Timelock: requires 2-of-3 multisig quorum");

        p.executed = true;

        (bool success, bytes memory returnData) = p.target.call{value: p.value}(p.data);
        require(success, "Timelock: proposal execution reverted");

        emit ProposalExecuted(proposalId, p.target);
        return returnData;
    }

    function isAdmin(address a) public view returns (bool) {
        return a == admin1 || a == admin2 || a == admin3;
    }

    function getAdminBit(address a) internal view returns (uint8) {
        if (a == admin1) return 1;
        if (a == admin2) return 2;
        if (a == admin3) return 4;
        return 0;
    }

    function countApprovals(uint8 mask) public pure returns (uint8 count) {
        if (mask & 1 != 0) count++;
        if (mask & 2 != 0) count++;
        if (mask & 4 != 0) count++;
    }

    function recover(bytes32 hash, bytes memory sig) internal pure returns (address) {
        require(sig.length == 65, "Timelock: invalid sig length");
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
        if (v < 27) v += 27;
        return ecrecover(hash, v, r, s);
    }
}
