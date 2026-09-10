// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.28;

import "./QUSD.sol";

/**
 * @title TestnetFaucet
 * @notice Permissionless testing faucet for BNB-QUSD ecosystem testing on BSC Testnet.
 * @dev Distributes test QUSD and collateral simulation tokens to test CDP borrowing and DEX swaps.
 */
contract TestnetFaucet {
    QUSD public immutable qusd;
    address public owner;

    uint256 public constant DRIP_AMOUNT = 500 * 1e18; // 500 QUSD per drip
    uint256 public constant COOLDOWN_PERIOD = 1 hours;

    mapping(address => uint256) public lastDripTime;

    event DripClaimed(address indexed recipient, uint256 amount);
    event FaucetFunded(address indexed funder, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "TestnetFaucet: caller is not owner");
        _;
    }

    constructor(address _qusd) {
        require(_qusd != address(0), "TestnetFaucet: zero QUSD address");
        qusd = QUSD(_qusd);
        owner = msg.sender;
    }

    /**
     * @notice Allows any user to claim test QUSD once per hour.
     */
    function requestTestQusd() external {
        require(
            block.timestamp >= lastDripTime[msg.sender] + COOLDOWN_PERIOD,
            "TestnetFaucet: drip cooldown active (1 request per hour)"
        );

        lastDripTime[msg.sender] = block.timestamp;

        // Try direct transfer if faucet is funded
        uint256 faucetBalance = qusd.balanceOf(address(this));
        if (faucetBalance >= DRIP_AMOUNT) {
            require(qusd.transfer(msg.sender, DRIP_AMOUNT), "TestnetFaucet: transfer failed");
        } else {
            // Or fallback if authorized as vault
            try qusd.mint(msg.sender, DRIP_AMOUNT) returns (bool ok) {
                require(ok, "TestnetFaucet: mint failed");
            } catch {
                revert("TestnetFaucet: faucet depleted; please fund faucet contract");
            }
        }

        emit DripClaimed(msg.sender, DRIP_AMOUNT);
    }

    /**
     * @notice Check cooldown time remaining for an account.
     */
    function getRemainingCooldown(address user) external view returns (uint256) {
        if (block.timestamp >= lastDripTime[user] + COOLDOWN_PERIOD) {
            return 0;
        }
        return (lastDripTime[user] + COOLDOWN_PERIOD) - block.timestamp;
    }
}
