pragma solidity 0.5.11;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./Minion.sol";
import "./Transmutation.sol";
import "./Trust.sol";

contract Factory {

    event Deployment(
        address moloch,
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
        address _distributionToken,
        uint256 _vestingPeriod,
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
            _dist.minionDist
        );
        IERC20(_distributionToken).transferFrom(
            msg.sender,
            trust,
            _dist.trustDist
        );
        IERC20(_distributionToken).transferFrom(
            msg.sender,
            transmutation,
            _dist.transmutationDist
        );
    }

}
