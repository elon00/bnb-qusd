// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.28;

import "./QUSD.sol";

/**
 * @title AggregatorV3Interface
 * @dev Standard Chainlink Decentralized Oracle Interface
 */
interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    function description() external view returns (string memory);
    function version() external view returns (uint256);
    function getRoundData(uint80 _roundId) external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
}

/**
 * @title QUSDVault
 * @notice Collateralized Debt Position (CDP) engine for QUSD on BNB Chain.
 * @dev Enforces 150% over-collateralization, 130% liquidation threshold,
 *      Chainlink oracle staleness protection, price deviation circuit breakers,
 *      and reentrancy security.
 */
contract QUSDVault {
    QUSD public immutable qusd;
    address public governor;

    // Collateral Ratios in Basis Points (10000 = 100%)
    uint256 public constant MIN_COLLATERAL_RATIO_BPS = 15000; // 150%
    uint256 public constant LIQUIDATION_THRESHOLD_BPS = 13000; // 130%
    uint256 public constant LIQUIDATION_BONUS_BPS = 1000;     // 10% bonus for liquidators

    // Chainlink Oracle and Safeguard parameters
    address public chainlinkFeed; // BSC Testnet BNB/USD Feed: 0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526
    uint256 public constant MAX_ORACLE_STALENESS = 3600;      // 1 hour staleness ceiling
    uint256 public constant MAX_PRICE_DEVIATION_BPS = 2500;   // 25% single-step circuit breaker

    // Stability fee modulated by Conway Automaton (in bps, e.g. 150 = 1.5% APR)
    uint256 public stabilityFeeBps = 150; 
    uint256 public bnbPriceUsd = 600 * 1e8; // Standard 8-decimal price ($600.00 fallback / initial)

    // Global Solvency Tracking
    uint256 public totalCollateralBnbWei;
    uint256 public totalDebtQusdWei;

    // Reentrancy guard state
    uint256 private _reentrancyStatus;

    struct Position {
        uint256 collateralBnbWei; // BNB deposited in wei (1e18)
        uint256 debtQusdWei;      // QUSD borrowed in wei (1e18)
        uint256 lastUpdateTimestamp;
    }

    mapping(address => Position) public positions;

    event PositionUpdated(address indexed user, uint256 collateralBnb, uint256 debtQusd);
    event Liquidated(address indexed user, address indexed liquidator, uint256 debtRepaid, uint256 collateralSeized);
    event PriceUpdated(uint256 oldPrice, uint256 newPrice);
    event StabilityFeeUpdated(uint256 oldFee, uint256 newFee);
    event OracleFeedUpdated(address indexed oldFeed, address indexed newFeed);
    event CircuitBreakerTriggered(string reason, uint256 reportedPrice);

    modifier onlyGovernor() {
        require(msg.sender == governor, "QUSDVault: caller is not governor");
        _;
    }

    modifier nonReentrant() {
        require(_reentrancyStatus != 2, "QUSDVault: reentrant call");
        _reentrancyStatus = 2;
        _;
        _reentrancyStatus = 1;
    }

    constructor(address _qusd, address _governor) {
        require(_qusd != address(0) && _governor != address(0), "QUSDVault: zero address");
        qusd = QUSD(_qusd);
        governor = _governor;
        _reentrancyStatus = 1;
    }

    function setChainlinkFeed(address _feed) external onlyGovernor {
        require(_feed != address(0), "QUSDVault: zero feed address");
        emit OracleFeedUpdated(chainlinkFeed, _feed);
        chainlinkFeed = _feed;
    }

    /**
     * @notice Fetch and validate latest price from Chainlink Oracle with staleness protection.
     */
    function syncChainlinkPrice() public returns (uint256) {
        if (chainlinkFeed == address(0)) {
            return bnbPriceUsd; // Fallback to governed price if feed not attached
        }

        try AggregatorV3Interface(chainlinkFeed).latestRoundData() returns (
            uint80 roundId,
            int256 answer,
            uint256 /* startedAt */,
            uint256 updatedAt,
            uint80 answeredInRound
        ) {
            require(answer > 0, "QUSDVault: oracle price must be positive");
            require(answeredInRound >= roundId, "QUSDVault: oracle round incomplete");
            require(block.timestamp >= updatedAt && block.timestamp - updatedAt <= MAX_ORACLE_STALENESS, "QUSDVault: oracle price is stale");

            uint256 newPrice = uint256(answer);

            // Circuit Breaker: check deviation against prior price
            if (bnbPriceUsd > 0) {
                uint256 delta = newPrice > bnbPriceUsd ? newPrice - bnbPriceUsd : bnbPriceUsd - newPrice;
                uint256 deviationBps = (delta * 10000) / bnbPriceUsd;
                if (deviationBps > MAX_PRICE_DEVIATION_BPS) {
                    emit CircuitBreakerTriggered("Price deviation exceeded 25%", newPrice);
                    return bnbPriceUsd; // Reject extreme single-block flash swings
                }
            }

            emit PriceUpdated(bnbPriceUsd, newPrice);
            bnbPriceUsd = newPrice;
            return newPrice;
        } catch {
            return bnbPriceUsd;
        }
    }

    function setBnbPrice(uint256 _priceUsd8Decimals) external onlyGovernor {
        require(_priceUsd8Decimals > 0, "QUSDVault: price must be positive");
        emit PriceUpdated(bnbPriceUsd, _priceUsd8Decimals);
        bnbPriceUsd = _priceUsd8Decimals;
    }

    function setStabilityFeeBps(uint256 _newFeeBps) external onlyGovernor {
        require(_newFeeBps <= 1000, "QUSDVault: fee exceeds max 10%");
        emit StabilityFeeUpdated(stabilityFeeBps, _newFeeBps);
        stabilityFeeBps = _newFeeBps;
    }

    /**
     * @notice Deposit BNB collateral and mint QUSD in a single transaction.
     */
    function depositAndMint(uint256 mintQusdAmount) external payable nonReentrant {
        // Automatically synchronize oracle if feed configured
        if (chainlinkFeed != address(0)) {
            syncChainlinkPrice();
        }

        Position storage pos = positions[msg.sender];
        pos.collateralBnbWei += msg.value;
        pos.debtQusdWei += mintQusdAmount;
        pos.lastUpdateTimestamp = block.timestamp;

        totalCollateralBnbWei += msg.value;
        totalDebtQusdWei += mintQusdAmount;

        // Verify collateralization invariant: (collateralValue * 10000) / debt >= 15000 bps
        uint256 collateralValueUsdWei = (pos.collateralBnbWei * bnbPriceUsd) / 1e8;
        require(
            pos.debtQusdWei == 0 || (collateralValueUsdWei * 10000) / pos.debtQusdWei >= MIN_COLLATERAL_RATIO_BPS,
            "QUSDVault: position exceeds max safe 66.6% LTV (min 150% collateral required)"
        );

        if (mintQusdAmount > 0) {
            require(qusd.mint(msg.sender, mintQusdAmount), "QUSDVault: mint failed");
        }

        emit PositionUpdated(msg.sender, pos.collateralBnbWei, pos.debtQusdWei);
    }

    /**
     * @notice Repay QUSD and withdraw unlocked BNB collateral.
     */
    function repayAndWithdraw(uint256 repayQusdAmount, uint256 withdrawBnbAmount) external nonReentrant {
        if (chainlinkFeed != address(0)) {
            syncChainlinkPrice();
        }

        Position storage pos = positions[msg.sender];
        require(pos.debtQusdWei >= repayQusdAmount, "QUSDVault: repay exceeds debt");
        require(pos.collateralBnbWei >= withdrawBnbAmount, "QUSDVault: insufficient collateral");

        if (repayQusdAmount > 0) {
            require(qusd.burn(msg.sender, repayQusdAmount), "QUSDVault: burn failed");
            pos.debtQusdWei -= repayQusdAmount;
            totalDebtQusdWei -= repayQusdAmount;
        }

        pos.collateralBnbWei -= withdrawBnbAmount;
        totalCollateralBnbWei -= withdrawBnbAmount;
        pos.lastUpdateTimestamp = block.timestamp;

        // Verify remaining collateralization
        if (pos.debtQusdWei > 0) {
            uint256 collateralValueUsdWei = (pos.collateralBnbWei * bnbPriceUsd) / 1e8;
            require(
                (collateralValueUsdWei * 10000) / pos.debtQusdWei >= MIN_COLLATERAL_RATIO_BPS,
                "QUSDVault: remaining collateral drops below safe 150% ratio"
            );
        }

        if (withdrawBnbAmount > 0) {
            (bool sent, ) = msg.sender.call{value: withdrawBnbAmount}("");
            require(sent, "QUSDVault: failed to send BNB");
        }

        emit PositionUpdated(msg.sender, pos.collateralBnbWei, pos.debtQusdWei);
    }

    /**
     * @notice Liquidate underwater positions where collateral ratio < 130%.
     */
    function liquidate(address user) external nonReentrant {
        if (chainlinkFeed != address(0)) {
            syncChainlinkPrice();
        }

        Position storage pos = positions[user];
        require(pos.debtQusdWei > 0, "QUSDVault: user has no outstanding debt");

        uint256 collateralValueUsdWei = (pos.collateralBnbWei * bnbPriceUsd) / 1e8;
        uint256 currentRatioBps = (collateralValueUsdWei * 10000) / pos.debtQusdWei;

        require(currentRatioBps < LIQUIDATION_THRESHOLD_BPS, "QUSDVault: position is healthy and not liquidatable");

        uint256 debtToRepay = pos.debtQusdWei;
        // Collateral seized = (debt * (10000 + bonus) / 10000) converted to BNB
        uint256 bnbToSeize = (debtToRepay * 1e8 * (10000 + LIQUIDATION_BONUS_BPS)) / (bnbPriceUsd * 10000);
        if (bnbToSeize > pos.collateralBnbWei) {
            bnbToSeize = pos.collateralBnbWei; // Cap at all collateral
        }

        // Liquidator burns QUSD to repay user debt
        require(qusd.burn(msg.sender, debtToRepay), "QUSDVault: liquidation burn failed");

        pos.debtQusdWei = 0;
        pos.collateralBnbWei -= bnbToSeize;

        totalDebtQusdWei -= debtToRepay;
        totalCollateralBnbWei -= bnbToSeize;

        (bool sent, ) = msg.sender.call{value: bnbToSeize}("");
        require(sent, "QUSDVault: failed to send seized collateral");

        emit Liquidated(user, msg.sender, debtToRepay, bnbToSeize);
    }

    function getPositionHealth(address user) external view returns (uint256 collateralBnb, uint256 debtQusd, uint256 ratioBps, bool isLiquidatable) {
        Position memory pos = positions[user];
        collateralBnb = pos.collateralBnbWei;
        debtQusd = pos.debtQusdWei;
        if (debtQusd == 0) {
            return (collateralBnb, 0, type(uint256).max, false);
        }
        uint256 collateralValueUsdWei = (collateralBnb * bnbPriceUsd) / 1e8;
        ratioBps = (collateralValueUsdWei * 10000) / debtQusd;
        isLiquidatable = ratioBps < LIQUIDATION_THRESHOLD_BPS;
    }

    /**
     * @notice Global Solvency Invariant Checker
     */
    function getGlobalVaultHealth() external view returns (
        uint256 totalCollateralBnb,
        uint256 totalDebtQusd,
        uint256 globalCollateralRatioBps,
        bool isSolvent
    ) {
        totalCollateralBnb = totalCollateralBnbWei;
        totalDebtQusd = totalDebtQusdWei;
        if (totalDebtQusd == 0) {
            return (totalCollateralBnb, 0, type(uint256).max, true);
        }
        uint256 totalValueUsdWei = (totalCollateralBnb * bnbPriceUsd) / 1e8;
        globalCollateralRatioBps = (totalValueUsdWei * 10000) / totalDebtQusd;
        isSolvent = globalCollateralRatioBps >= LIQUIDATION_THRESHOLD_BPS;
    }
}
