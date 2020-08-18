# Factory

> "Moloch whose soul is electricity and banks!"

This contract provides a 'one click' deploy of all contracts for the bootstrap round.

## public functions

    function deployAll(
        address _moloch,
        address _capitalToken,
        uint256 _vestingPeriod,
        string calldata _tokenSymbol,
        TokenDistribution calldata _dist,
        address[] calldata _vestingDistRecipients,
        uint256[] calldata _vestingDistAmts
    )
    
this function will deploy a standard erc20, then mint tokes to a vesting contract and fund the transmuation vault.



## Events

coming soon