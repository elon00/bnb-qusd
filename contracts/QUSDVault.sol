// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.28;

import "./QUSD.sol";

/**
 * @title QUSDVault
 * @notice Collateralized Debt Position (CDP) engine for QUSD on BNB Chain.
 * @dev Enforces 150% over-collateralization and 130% liquidation threshold.
 */
contract QUSDVault {
    QUSD public immutable qusd;
    address public governor;

    // Collateral Ratios in Basis Points (10000 = 100%)
    uint256 public constant MIN_COLLATERAL_RATIO_BPS = 15000; // 150%
    uint256 public constant LIQUIDATION_THRESHOLD_BPS = 13000; // 130%
    uint256 public constant LIQUIDATION_BONUS_BPS = 1000;     // 10% bonus for liquidators

    // Stability fee modulated by Conway Automaton (in bps, e.g. 150 = 1.5% APR)
    uint256 public stabilityFeeBps = 150; 
    uint256 public bnbPriceUsd = 600 * 1e8; // Standard 8-decimal Chainlink oracle price ($600.00)

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

    modifier onlyGovernor() {
        require(msg.sender == governor, "QUSDVault: caller is not governor");
        _;
    }

    constructor(address _qusd, address _governor) {
        require(_qusd != address(0) && _governor != address(0), "QUSDVault: zero address");
        qusd = QUSD(_qusd);
        governor = _governor;
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
    function depositAndMint(uint256 mintQusdAmount) external payable {
        Position storage pos = positions[msg.sender];
        pos.collateralBnbWei += msg.value;
        pos.debtQusdWei += mintQusdAmount;
        pos.lastUpdateTimestamp = block.timestamp;

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
    function repayAndWithdraw(uint256 repayQusdAmount, uint256 withdrawBnbAmount) external {
        Position storage pos = positions[msg.sender];
        require(pos.debtQusdWei >= repayQusdAmount, "QUSDVault: repay exceeds debt");
        require(pos.collateralBnbWei >= withdrawBnbAmount, "QUSDVault: insufficient collateral");

        if (repayQusdAmount > 0) {
            require(qusd.burn(msg.sender, repayQusdAmount), "QUSDVault: burn failed");
            pos.debtQusdWei -= repayQusdAmount;
        }

        pos.collateralBnbWei -= withdrawBnbAmount;
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
    function liquidate(address user) external {
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
}
