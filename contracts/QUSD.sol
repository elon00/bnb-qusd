// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.28;

/**
 * @title QUSD (Quantum USD)
 * @notice BEP-20 Collateralized Stablecoin pegged to $1.00 USD on BNB Chain.
 * @dev Minting and burning are strictly authorized by the QUSDVault CDP contract.
 */
contract QUSD {
    string public constant name = "Quantum USD";
    string public constant symbol = "QUSD";
    uint8 public constant decimals = 18;

    uint256 public totalSupply;
    address public vault;
    address public governor;
    bool public isPaused;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event VaultUpdated(address indexed oldVault, address indexed newVault);
    event PausedStateChanged(bool isPaused);

    modifier onlyVault() {
        require(msg.sender == vault, "QUSD: caller is not authorized vault");
        _;
    }

    modifier onlyGovernor() {
        require(msg.sender == governor, "QUSD: caller is not authorized governor");
        _;
    }

    modifier whenNotPaused() {
        require(!isPaused, "QUSD: token transfers are paused by circuit breaker");
        _;
    }

    constructor(address _governor) {
        require(_governor != address(0), "QUSD: invalid governor address");
        governor = _governor;
    }

    function setVault(address _vault) external onlyGovernor {
        require(_vault != address(0), "QUSD: invalid vault address");
        emit VaultUpdated(vault, _vault);
        vault = _vault;
    }

    function setPaused(bool _paused) external onlyGovernor {
        isPaused = _paused;
        emit PausedStateChanged(_paused);
    }

    function transfer(address to, uint256 value) external whenNotPaused returns (bool) {
        require(to != address(0), "QUSD: transfer to zero address");
        require(balanceOf[msg.sender] >= value, "QUSD: insufficient balance");

        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        require(spender != address(0), "QUSD: approve to zero address");
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external whenNotPaused returns (bool) {
        require(to != address(0), "QUSD: transfer to zero address");
        require(balanceOf[from] >= value, "QUSD: insufficient balance");
        require(allowance[from][msg.sender] >= value, "QUSD: insufficient allowance");

        allowance[from][msg.sender] -= value;
        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
        return true;
    }

    function mint(address to, uint256 amount) external onlyVault whenNotPaused returns (bool) {
        require(to != address(0), "QUSD: mint to zero address");
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
        return true;
    }

    function burn(address from, uint256 amount) external onlyVault returns (bool) {
        require(balanceOf[from] >= amount, "QUSD: burn amount exceeds balance");
        balanceOf[from] -= amount;
        totalSupply -= amount;
        emit Transfer(from, address(0), amount);
        return true;
    }
}
