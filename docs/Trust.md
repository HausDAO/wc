# Trust
> "Moloch whose love is endless oil and stone!"

Moloch extension to enable vesting with conditions

Tokens will be distributed into this vesting contract. These tokens will be unlocked when the bootstraping phase is completed (all funds donated for the bootstraping phase are spent) or 1 year after the summoning of the DAO.

The tokens in this contract should equal the sum of recipient amounts, and extra will be lost, if to little it will be insolvent but more tokens can be added.

## Constructor

    constructor(
        address _moloch,
        address _molochCapitalToken,
        address _distributionToken,
        uint256 _vestingPeriod,
        address[] memory _recipients,
        uint256[] memory _amts
    )
    
Takes a Dao address, the token which is used for capital payments during this round, the token which is distributed to vested recipients, the locking period as a unix time delta from deploy, linked arrays of recipients and the amounts.

## public functions

`  function unlock()`

if all conditions are meet the funds can be unlocked by anyone, meaning recipients can withdraw their portion of funds

`  function claim(address recipient)`

anyone can call claim and if they have some amount if the contract it will be withdrawn to their account

## Events

    event Deploy(
        address moloch,
        address distributionToken,
        uint256 vestingPeriod,
        address[] recipients
    );
    event Unlock(address unlocker);
    event Claim(address recipient, uint256 amt);
