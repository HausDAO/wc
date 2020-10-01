pragma solidity ^0.5.11;

import "./interfaces/IMoloch.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

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
     * @dev Returns true if usr has voting shares in the Moloch
     * @param usr Address to check membership of
     */
    function isMember(address usr) public view returns (bool) {
        (, uint shares,,,,) = moloch.members(usr);
        return shares > 0;
    }
}
