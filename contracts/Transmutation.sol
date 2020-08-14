pragma solidity ^0.5.11;

import "./Minion.sol";
import "./moloch/Moloch.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Transmutation {

    using SafeMath for uint256;

    // --- Constants ---
    uint256 constant MAX_UINT = 2**256 - 1;
    string public constant TRANSMUTATION_DETAILS = '{"isTransmutation": true, "title":"TRANSMUTATION", "description":"';

    // --- State ---
    Moloch public moloch;
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
        require(_isMember(msg.sender), "Transmutation::not-member");
        _;
    }

    // --- Constructor ---
    constructor(
        address _moloch,
        address _giveToken,
        address _getToken,
        address _owner
    )
        public
    {
        moloch = Moloch(_moloch);
        getToken = _getToken;
        giveToken = _giveToken;

        emit Deploy(_moloch, _giveToken, _getToken, _owner);

        require(
            IERC20(giveToken).approve(_moloch, MAX_UINT),
            "Transmutation::approval-failure"
        );
        require(
            IERC20(giveToken).approve(_owner, MAX_UINT),
            "Transmutation::approval-failure"
        );
    }

    // --- Public functions ---

    function withdrawGiveToken() public {
        moloch.withdrawBalance(
            giveToken,
            moloch.userTokenBalances(address(this), giveToken)
        );
    }

    // --- Member-only functions ---

    // any dao member can cancel
    function cancel(uint256 _proposalId) external memberOnly {
        emit Cancel(_proposalId, msg.sender);
        moloch.cancelProposal(_proposalId);
        withdrawGiveToken();
    }

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
        require(_applicant != address(this), "Transmutation::invalid-applicant");

        string memory propDetails = string(abi.encodePacked(TRANSMUTATION_DETAILS, _details, '"}'));

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

    // --- View functions ---

    function _isMember(address usr) internal view returns (bool) {
        (, uint shares,,,,) = moloch.members(usr);
        return shares > 0;
    }
}
