pragma solidity ^0.5.11;

import "./interfaces/IMoloch.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


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

