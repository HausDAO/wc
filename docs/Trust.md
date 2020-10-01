# Trust
> "Moloch whose love is endless oil and stone!"

Moloch extension to enable vesting with conditions

Tokens will be distributed into this vesting contract.
These tokens will be unlocked for claiming by recipients if one of the following conditions is met:
1. The `_vestingPeriod` has expired
2. The Dao's entire balance of `molochCapitalToken` has been spent.

### Comments and known issues

The tokens in this contract should equal the sum of recipient amounts.
Any additional tokens held in the contract will be lost.
If the provided amount of tokens is less than the sum of recipient amounts it will be insolvent, but tokens can be added at any time.

Anyone can send `molochCapitalToken` to the Dao, but only the Dao's Guild Bank balance is considered for the unlocking of the trust.
That is, tokens are only considered if `moloch.collectTokens` is called.
This function can only be called by an address with delegated shares in the Dao, but could be used to delay the unlocking of the Trust.
For example, a Dao delegate could continually send 1 wei worth of `molochCapitalToken` into the Dao followed by a call to `collectTokens`, preventing the Trust from being unlocked until the collected tokens were distributed via a proposal.
This attack could be continued until the offending member (or the member with the offending delegate) was guild-kicked.

The Dao must have a nonzero Guild Bank balance of `molochCapitalToken` when the trust is deployed, or else the trust could be unlocked immediately.


## Constructor

    constructor(
        address _moloch,
        address _molochCapitalToken,
        address _distributionToken,
        uint256 _vestingPeriod,
        address[] memory _recipients,
        uint256[] memory _amts
    )

Takes a Dao address, the token which is used for capital payments during this round, the token which is distributed to vested recipients, the locking period as a unix time delta from deploy (in seconds), linked arrays of recipients and the amounts.

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
