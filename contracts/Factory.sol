pragma solidity 0.5.11;
pragma experimental ABIEncoderV2;

import "./Minion.sol";
import "./Transmutation.sol";
import "./Trust.sol";
import "./Token.sol";

contract Factory {

    event Deployment(
        address distributionToken,
        address minion,
        address transmutation,
        address trust
    );

    struct TokenDistribution {
        uint256 transmutationDist;
        uint256 trustDist;
        uint256 minionDist;
    }

    function deployAll(
        address _moloch,
        address _capitalToken,
        uint256 _vestingPeriod,
        string calldata _tokenSymbol,
        TokenDistribution calldata _dist,
        address[] calldata _vestingDistRecipients,
        uint256[] calldata _vestingDistAmts
    )
        external
    {
        require(
            _vestingDistRecipients.length == _vestingDistAmts.length,
            "Factory::invalid-vesting-dist"
        );

        Token distributionToken = new Token(_tokenSymbol);

        address minion = address(new Minion(_moloch));
        address transmutation = address(
                new Transmutation(
                _moloch,
                address(distributionToken),
                _capitalToken,
                minion
            )
        );

        address trust = address(
            new Trust(
                _moloch,
                _capitalToken,
                address(distributionToken),
                _vestingPeriod,
                _vestingDistRecipients,
                _vestingDistAmts
            )
        );

        emit Deployment(
            address(distributionToken),
            minion,
            transmutation,
            trust
        );

        // mint initial token distribution
        distributionToken.mint(minion, _dist.minionDist);
        distributionToken.mint(trust, _dist.trustDist);
        distributionToken.mint(transmutation, _dist.transmutationDist);

        // leave token un-mintable
        distributionToken.renounceMinter();
    }

}
