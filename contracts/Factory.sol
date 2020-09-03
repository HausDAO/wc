pragma solidity 0.5.11;

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
