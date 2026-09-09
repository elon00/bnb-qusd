// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.28;

/**
 * @title QBNBAutomaton
 * @notice Conway Cellular Automaton Governance & Ecosystem Asset on BNB Chain.
 * @dev Enforces 2.0% max epoch expansion and algorithmic entropy linkage.
 */
contract QBNBAutomaton {
    string public constant name = "Quantum BNB Automaton";
    string public constant symbol = "QBNB";
    uint8 public constant decimals = 18;

    uint256 public totalSupply;
    address public governor;

    // Epoch Configuration: 30 days
    uint256 public constant EPOCH_DURATION = 30 days;
    uint256 public constant MAX_EPOCH_MINT_BPS = 200; // 2.00% max expansion per epoch
    uint256 public currentEpochStartTime;
    uint256 public mintedThisEpoch;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event EpochMint(uint256 indexed epoch, address indexed recipient, uint256 amount);

    modifier onlyGovernor() {
        require(msg.sender == governor, "QBNB: caller is not governor");
        _;
    }

    constructor(address _governor, uint256 initialSupply) {
        require(_governor != address(0), "QBNB: zero governor");
        governor = _governor;
        currentEpochStartTime = block.timestamp;

        if (initialSupply > 0) {
            totalSupply = initialSupply;
            balanceOf[_governor] = initialSupply;
            emit Transfer(address(0), _governor, initialSupply);
        }
    }

    function transfer(address to, uint256 value) external returns (bool) {
        require(to != address(0), "QBNB: transfer to zero address");
        require(balanceOf[msg.sender] >= value, "QBNB: insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        require(spender != address(0), "QBNB: approve zero address");
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        require(to != address(0), "QBNB: transfer to zero address");
        require(balanceOf[from] >= value, "QBNB: insufficient balance");
        require(allowance[from][msg.sender] >= value, "QBNB: insufficient allowance");

        allowance[from][msg.sender] -= value;
        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
        return true;
    }

    /**
     * @notice Mint ecosystem tokens governed by 2.0% epoch cap.
     */
    function epochMint(address to, uint256 amount) external onlyGovernor returns (bool) {
        require(to != address(0), "QBNB: mint to zero address");

        // Advance epoch window if 30 days elapsed
        if (block.timestamp >= currentEpochStartTime + EPOCH_DURATION) {
            currentEpochStartTime = block.timestamp;
            mintedThisEpoch = 0;
        }

        // Maximum allowed mint in this epoch = 2% of totalSupply
        uint256 maxMintAllowed = (totalSupply * MAX_EPOCH_MINT_BPS) / 10000;
        require(mintedThisEpoch + amount <= maxMintAllowed, "QBNB: exceeds 2.0% max epoch expansion limit");

        mintedThisEpoch += amount;
        totalSupply += amount;
        balanceOf[to] += amount;

        emit EpochMint(currentEpochStartTime, to, amount);
        emit Transfer(address(0), to, amount);
        return true;
    }
}
