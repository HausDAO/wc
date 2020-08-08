pragma solidity 0.5.11;
// pragma experimental ABIEncoderV2;

import "./Minion.sol";
import "./Transmutation.sol";
import "./Trust.sol";
import "./Token.sol";

// - deploy:
    // - minion
    // - haus token
        // - initial distributions
    // - vesting contract
        // - set initial distributinos
    // - transmutator
contract Factory {

    function deployAll(
        address _moloch,
        address _capitalToken,
        uint256 _vestingPeriod,
        string calldata _tokenSymbol,
        address[] calldata _tokenDistRecipients,
        uint256[] calldata _tokenDistAmts,
        address[] calldata _vestingDistRecipients,
        uint256[] calldata _vestingDistAmts
    )
        external
    {
        require(
            _tokenDistRecipients.length == _tokenDistAmts.length,
            "Factory:invalid-token-dist"
        );
        require(
            _vestingDistRecipients.length == _vestingDistAmts.length,
            "Factory::invalid-vesting-dist"
        );

        Token distributionToken = new Token("name", "SYM");

        address minion = address(new Minion(_moloch));
        new Transmutation(
            _moloch,
            address(distributionToken),
            _capitalToken,
            minion
        );
        new Trust(
            _moloch,
            _capitalToken,
            address(distributionToken),
            _vestingPeriod,
            _vestingDistRecipients,
            _vestingDistAmts
        );

        // mint initial token distribution
        for (uint256 i = 0; i < _tokenDistRecipients.length; i++) {
            distributionToken.mint(_tokenDistRecipients[i], _tokenDistAmts[i]);
        }
        distributionToken.renounceMinter();
    }

}
