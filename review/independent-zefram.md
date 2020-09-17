<sup>independent review by Zefram (all issues addressed)</sup>

# HausDAO contract review notes

Repo: https://github.com/HausDAO/wc

Commit: `0092abc6604d4e122fba32102d21841c745a13a5`

## `Trust` requires a balance of `distributionToken` in order for `claim()` to work, but this is not guaranteed.

On line 67 of `Trust.sol`, `IERC20(distributionToken).transfer(recipient, amt)` transfers `amt` `distrubutionToken` to the recipient. This assumes that the `Trust` contract already has a balance of `distrubutionToken` at least the sum of all `amt`s. However, `distributionToken` is created in `Factory.sol`, where `Trust` is not given any tokens. It's also not possible to give `distributionToken` to `Trust` by setting it as a recipient in `Factory.deployAll()`, since the `Trust` contract is initialized in `deployAll()` itself.

## `Transmutation` also requires a balance of `distributionToken` to work, but it's not guaranteed

When `Transmutation` submits a proposal to Moloch, it requires a balance of at least `_giveAmt` `distrubutionToken`. This is not guaranteed, for the same reasons as `Trust`.

## `Transmutation` and `Trust` are created in `Factory`, but there's no good way to access their addresses

`Factory` creates the two contracts, but it neither returns their addresses nor emits them using an event. This would make accessing their addresses harder. It's still possible, but why make your life harder?

## `Transmutation.cancel()` kinda locks up `giveToken`

On line 43 of `Transmutation.sol`, the contract withdraws its `giveToken` balance from the DAO, but the tokens are stuck there. There's no explicit function that sends the tokens anywhere. Though if you're setting the minion as `_owner` then the minion could call `transferFrom()` to transfer the tokens out, but it's not a good idea to make the process this convoluted. Add `withdraw()` or something that explicitly transfers the `giveToken` out.

## `Trust.unlock()` condition not clear

Not sure why `moloch.userTokenBalances(MOLOCH_GUILD_ADDR, molochCapitalToken) == 0` should unlock the vesting. Seems to have come out of nowhere. Some comments would be nice.
