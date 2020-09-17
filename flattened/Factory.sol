
// File: @openzeppelin/contracts/token/ERC20/IERC20.sol

pragma solidity ^0.5.0;

/**
 * @dev Interface of the ERC20 standard as defined in the EIP. Does not include
 * the optional functions; to access them see {ERC20Detailed}.
 */
interface IERC20 {
    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

// File: contracts/interfaces/IMoloch.sol

pragma solidity ^0.5.0;

interface IMoloch {

    function depositToken() external view returns(address);
    function getProposalFlags(uint256 proposalId) external view
        returns (bool[6] memory);
    function members(address usr) external view
        returns (address, uint256, uint256, bool, uint256, uint256);
    function userTokenBalances(address user, address token) external view
        returns (uint256);

    function cancelProposal(uint256 proposalId) external;
    function withdrawBalance(address token, uint256 amount) external;

    function submitProposal(
        address applicant,
        uint256 sharesRequested,
        uint256 lootRequested,
        uint256 tributeOffered,
        address tributeToken,
        uint256 paymentRequested,
        address paymentToken,
        string calldata details
    ) external returns (uint256 proposalId);
}

// File: contracts/Minion.sol

pragma solidity 0.5.11;


contract Minion {

    // --- Constants ---
    string public constant MINION_ACTION_DETAILS = '{"isMinion": true, "title":"MINION", "description":"';

    // --- State and data structures ---
    IMoloch public moloch;
    address public molochApprovedToken;
    mapping (uint256 => Action) public actions; // proposalId => Action

    struct Action {
        uint256 value;
        address to;
        address proposer;
        bool executed;
        bytes data;
    }

    // --- Events ---
    event ActionProposed(uint256 proposalId, address proposer);
    event ActionCanceled(uint256 proposalId);
    event ActionExecuted(uint256 proposalId, address executor);

    // --- Modifiers ---
    modifier memberOnly() {
        require(isMember(msg.sender), "Minion::not member");
        _;
    }

    // --- Constructor ---
    constructor(address _moloch) public {
        moloch = IMoloch(_moloch);
        molochApprovedToken = moloch.depositToken();
    }

    // --- Fallback function ---
    function() external payable {}

    // withdraw funds from the moloch
    function doWithdraw(address _token, uint256 _amount) public {
        moloch.withdrawBalance(_token, _amount);
    }

    function proposeAction(
        address _actionTo,
        uint256 _actionValue,
        bytes calldata _actionData,
        string calldata _description
    )
        external
        memberOnly
        returns (uint256)
    {
        // can't call arbitrary functions on parent moloch, and no calls to
        // zero address allows us to check that Minion submitted
        // the proposal without getting the proposal struct from the moloch
        require(
            !(_actionTo == address(0) || _actionTo == address(moloch)),
            "Minion::invalid _actionTo"
        );

        string memory details = string(abi.encodePacked(MINION_ACTION_DETAILS, _description, '"}'));

        uint256 proposalId = moloch.submitProposal(
            address(this),
            0,
            0,
            0,
            molochApprovedToken,
            0,
            molochApprovedToken,
            details
        );

        Action memory action = Action({
            value: _actionValue,
            to: _actionTo,
            proposer: msg.sender,
            executed: false,
            data: _actionData
        });

        actions[proposalId] = action;

        emit ActionProposed(proposalId, msg.sender);
        return proposalId;
    }

    function cancelAction(uint256 _proposalId) external {
        Action memory action = actions[_proposalId];
        require(msg.sender == action.proposer, "Minion::not proposer");
        delete actions[_proposalId];
        emit ActionCanceled(_proposalId);
        moloch.cancelProposal(_proposalId);
    }

    function executeAction(uint256 _proposalId) external returns (bytes memory) {
        Action memory action = actions[_proposalId];
        bool[6] memory flags = moloch.getProposalFlags(_proposalId);

        // minion did not submit this proposal
        require(action.to != address(0), "Minion::invalid _proposalId");
        require(!action.executed, "Minion::action executed");
        require(address(this).balance >= action.value, "Minion::insufficient eth");
        require(flags[2], "Minion::proposal not passed");

        // execute call
        actions[_proposalId].executed = true;
        (bool success, bytes memory retData) = action.to.call.value(action.value)(action.data);
        require(success, "Minion::call failure");
        emit ActionExecuted(_proposalId, msg.sender);
        return retData;
    }

    // --- View functions ---
    function isMember(address usr) public view returns (bool) {
        (, uint shares,,,,) = moloch.members(usr);
        return shares > 0;
    }
}

// File: @openzeppelin/contracts/math/SafeMath.sol

pragma solidity ^0.5.0;

/**
 * @dev Wrappers over Solidity's arithmetic operations with added overflow
 * checks.
 *
 * Arithmetic operations in Solidity wrap on overflow. This can easily result
 * in bugs, because programmers usually assume that an overflow raises an
 * error, which is the standard behavior in high level programming languages.
 * `SafeMath` restores this intuition by reverting the transaction when an
 * operation overflows.
 *
 * Using this library instead of the unchecked operations eliminates an entire
 * class of bugs, so it's recommended to use it always.
 */
library SafeMath {
    /**
     * @dev Returns the addition of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `+` operator.
     *
     * Requirements:
     * - Addition cannot overflow.
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return sub(a, b, "SafeMath: subtraction overflow");
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting with custom message on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     * - Subtraction cannot overflow.
     *
     * _Available since v2.4.0._
     */
    function sub(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b <= a, errorMessage);
        uint256 c = a - b;

        return c;
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `*` operator.
     *
     * Requirements:
     * - Multiplication cannot overflow.
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");

        return c;
    }

    /**
     * @dev Returns the integer division of two unsigned integers. Reverts on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return div(a, b, "SafeMath: division by zero");
    }

    /**
     * @dev Returns the integer division of two unsigned integers. Reverts with custom message on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     *
     * _Available since v2.4.0._
     */
    function div(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        // Solidity only automatically asserts when dividing by 0
        require(b > 0, errorMessage);
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * Reverts when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        return mod(a, b, "SafeMath: modulo by zero");
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * Reverts with custom message when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     *
     * _Available since v2.4.0._
     */
    function mod(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b != 0, errorMessage);
        return a % b;
    }
}

// File: contracts/Transmutation.sol

pragma solidity ^0.5.11;




contract Transmutation {

    using SafeMath for uint256;

    // --- Constants ---
    uint256 constant MAX_UINT = 2**256 - 1;
    string public constant TRANSMUTATION_DETAILS = '{"isTransmutation": true, "title":"TRANSMUTATION", "description":"';

    // --- State ---
    IMoloch public moloch;
    address public giveToken;
    address public getToken;

    // --- Events ---
    event Propose(uint256 proposalId, address sender);
    event Cancel(uint256 proposalId, address sender);
    event Deploy(
        address moloch,
        address giveToken,
        address getToken,
        address owner
    );

    // --- Modifiers ---
    modifier memberOnly() {
        require(isMember(msg.sender), "Transmutation::not-member");
        _;
    }

    // --- Constructor ---
    /**
     * @dev Constructor
     * @param _moloch The molochDao to propose token swaps with
     * @param _giveToken The token to use as Moloch proposal tributeToken
     * @param _getToken The token to use as Moloch proposal paymentToken
     * @param _owner Address approved to transfer this contract's _giveToken
     */
    constructor(
        address _moloch,
        address _giveToken,
        address _getToken,
        address _owner
    )
        public
    {
        moloch = IMoloch(_moloch);
        getToken = _getToken;
        giveToken = _giveToken;

        emit Deploy(_moloch, _giveToken, _getToken, _owner);

        // approve moloch and owner to transfer our giveToken
        require(
            IERC20(_giveToken).approve(_moloch, MAX_UINT),
            "Transmutation::approval-failure"
        );
        require(
            IERC20(_giveToken).approve(_owner, MAX_UINT),
            "Transmutation::approval-failure"
        );
    }

    // --- Public functions ---

    /**
     * @dev Triggers a withdraw of giveToken from the Moloch
     */
    function withdrawGiveToken() public {
        moloch.withdrawBalance(
            giveToken,
            moloch.userTokenBalances(address(this), giveToken)
        );
    }

    // --- Member-only functions ---

    /**
     * @dev Makes a proposal taking tribute from this contract in the form of
     * giveToken and sending _getToken to _applicant as proposal payment
     * @param _applicant Recipient of the proposal's _getToken from the moloch
     * @param _giveAmt Amount of _giveToken to swap for _getAmt of _getToken
     * @param _getAmt Amount of _getToken to swap for _giveAmt of _giveToken
     * @param _details Proposal details
     */
    function propose(
        address _applicant,
        uint256 _giveAmt,
        uint256 _getAmt,
        string calldata _details
    )
        external
        memberOnly
        returns (uint256)
    {
        // this contract cannot accept any tokens except _giveToken
        require(_applicant != address(this), "Transmutation::invalid-applicant");

        string memory propDetails = string(abi.encodePacked(TRANSMUTATION_DETAILS, _details, '"}'));

        // make a Moloch proposal with _giveToken as tributeToken and
        // _getToken as paymentToken
        uint256 proposalId = moloch.submitProposal(
            _applicant,
            0,
            0,
            _giveAmt,
            giveToken,
            _getAmt,
            getToken,
            propDetails
        );

        emit Propose(proposalId, msg.sender);
        return proposalId;
    }

    /**
     * @dev Cancel a Moloch proposal. Can be called by any dao member
     * @param _proposalId The id of the proposal to cancel
     */
    function cancel(uint256 _proposalId) external memberOnly {
        emit Cancel(_proposalId, msg.sender);
        moloch.cancelProposal(_proposalId);
    }

    // --- View functions ---

    /**
     * @dev Returns true if usr has shares in the Moloch
     * @param usr Address to check membership of
     */
    function isMember(address usr) public view returns (bool) {
        (, uint shares,,,,) = moloch.members(usr);
        return shares > 0;
    }
}

// File: contracts/Trust.sol

pragma solidity ^0.5.11;





/**
* A trust that allows recipients to claim tokens after either
* the unlockTime has passed or the referenced Moloch has a zero
* balance of some capitalToken in it's guild bank
*/
contract Trust {

    // --- Constants ---
    address public constant MOLOCH_GUILD_ADDR = address(0xdead);

    // --- State ---
    IMoloch public moloch;
    address public molochCapitalToken;
    address public distributionToken;

    bool public unlocked;
    uint256 public unlockTime;
    mapping (address => uint256) public distributions;

    // --- Events ---
    event Deploy(
        address moloch,
        address distributionToken,
        uint256 vestingPeriod,
        address[] recipients
    );
    event Unlock(address unlocker);
    event Claim(address recipient, uint256 amt);

    // --- Constructor ---
    /**
     * @dev Constructor
     * @param _moloch Address of Moloch to check guild bank for capital token
     * @param _molochCapitalToken Address of caputal token to check guild bank for
     * @param _distributionToken Address of token to distribute to recipients.
     * This contract assumes that it holds enough tokens to cover the
     * before being unlocked
     * @param _vestingPeriod Maximum time to lock tokens for
     * @param _recipients Addresses to distribute tokens to
     * @param _amts Amounts of tokens to distribute
     * _recipients[i] gets _amts[i] tokens
     */
    constructor(
        address _moloch,
        address _molochCapitalToken,
        address _distributionToken,
        uint256 _vestingPeriod,
        address[] memory _recipients,
        uint256[] memory _amts
    )
        public
    {
        moloch = IMoloch(_moloch);
        molochCapitalToken = _molochCapitalToken;
        distributionToken = _distributionToken;

        require(_vestingPeriod > 0, "Trust::invalid-vesting-period");
        unlockTime = SafeMath.add(block.timestamp, _vestingPeriod);

        uint256 numDists = _recipients.length;
        require(_amts.length == numDists, "Trust::invalid-distributions");
        for (uint256 i = 0; i < numDists; i++) {
            distributions[_recipients[i]] = SafeMath.add(
                distributions[_recipients[i]],
                _amts[i]
            );
        }

        emit Deploy(_moloch, _distributionToken, _vestingPeriod, _recipients);
    }

    // --- external functions ---

    /**
     * @dev unlocks funds if unlockTime has passed OR if the Moloch's guild
     * bank has expended all of it's molochCapitalToken
     * (all capital has been used)
     */
    function unlock() external {
        require(!unlocked, "Trust::already-unlocked");
        require(
            block.timestamp > unlockTime ||
            moloch.userTokenBalances(MOLOCH_GUILD_ADDR, molochCapitalToken) == 0,
            "Trust::not-vested"
        );
        unlocked = true;
        emit Unlock(msg.sender);
    }

    /**
     * @dev transfers a user's balance of distribution tokens to a recipient
     * @param recipient Address to distribute owed tokens to
     */
    function claim(address recipient) external {
        require(unlocked, "Trust::tokens-locked");
        uint256 amt = distributions[recipient];
        require(amt > 0, "Trust::no-distribution");
        distributions[recipient] = 0;
        emit Claim(recipient, amt);
        require(
            IERC20(distributionToken).transfer(recipient, amt),
            "Trust::transfer-failed"
        );
    }

}

// File: contracts/Factory.sol

pragma solidity 0.5.11;





contract Factory {

    event Deployment(
        address moloch,
        address distributionToken,
        address minion,
        address transmutation,
        address trust
    );

    /**
     * @dev Deploy Minion, Trust, and Transmutation and transfer initial token
     * distributions from caller to deployed contracts
     * @param _moloch Address of the molochDao referred to by deployed contracts
     * @param _capitalToken Address of the dao's capitalToken
     * @param _distributionToken Address of the dao's distribution token
     * @param _vestingPeriod Vesting period of the deployed Trust
     * @param _transmutationDist Amt of distribution token to give Transmutation
     * @param _trustDist Amt of distribution token to give Trust
     * @param _minionDist Amt of distribution token to give Minion
     * @param _vestingDistRecipients Recipients to pass to Trust
     * @param _vestingDistAmts Amts to pass to Trust
     */
    function deployAll(
        address _moloch,
        address _capitalToken,
        address _distributionToken,
        uint256 _vestingPeriod,
        uint256 _transmutationDist,
        uint256 _trustDist,
        uint256 _minionDist,
        address[] calldata _vestingDistRecipients,
        uint256[] calldata _vestingDistAmts
    )
        external
    {
        // sanity check
        require(
            _vestingDistRecipients.length == _vestingDistAmts.length,
            "Factory::invalid-vesting-dist"
        );

        // deploy contracts
        address minion = address(new Minion(_moloch));
        address transmutation = address(
                new Transmutation(
                _moloch,
                _distributionToken,
                _capitalToken,
                minion
            )
        );
        address trust = address(
            new Trust(
                _moloch,
                _capitalToken,
                _distributionToken,
                _vestingPeriod,
                _vestingDistRecipients,
                _vestingDistAmts
            )
        );

        emit Deployment(
            _moloch,
            _distributionToken,
            minion,
            transmutation,
            trust
        );

        // transfer initial token distribution
        IERC20(_distributionToken).transferFrom(
            msg.sender,
            minion,
            _minionDist
        );
        IERC20(_distributionToken).transferFrom(
            msg.sender,
            trust,
            _trustDist
        );
        IERC20(_distributionToken).transferFrom(
            msg.sender,
            transmutation,
            _transmutationDist
        );
    }

}
