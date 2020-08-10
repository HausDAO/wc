pragma solidity ^0.5.11;

import "./interfaces/IMoloch.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Trust {

    address public constant MOLOCH_GUILD_ADDR = address(0xdead);

    IMoloch public moloch;
    address public molochCapitalToken;
    address public distributionToken;
    uint256 public unlockTime;

    bool public unlocked;
    mapping (address => uint256) public distributions;

    event Unlock(address unlocker);
    event Claim(address recipient, uint256 amt);

    constructor(
        address _moloch,
        address _molochCapitalToken,
        address _distributionToken,
        uint256 _vestingPeriod,
        address[] memory recipients,
        uint256[] memory amts
    )
        public
    {
        moloch = IMoloch(_moloch);
        molochCapitalToken = _molochCapitalToken;
        distributionToken = _distributionToken;

        require(_vestingPeriod > 0, "Trust::invalid-vesting-period");
        unlockTime = SafeMath.add(block.timestamp, _vestingPeriod);

        uint256 numDists = recipients.length;
        require(amts.length == numDists, "Trust::invalid-distributions");
        for (uint256 i = 0; i < numDists; i++) {
            distributions[recipients[i]] = SafeMath.add(
                distributions[recipients[i]],
                amts[i]
            );
        }
    }

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

