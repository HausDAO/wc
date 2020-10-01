# Transmutation

> "Moloch whose blood is running money!"

Transmutation is a contract that enables the process for HausDAO funding proposals.
The `giveToken` is slowly traded into the Dao as `getToken` is used.

The Transmutation contract holds `giveToken` (e.g. HAUS) which can only be distributed through Dao proposals (with owner approval to transfer as a fail-safe).
The `giveToken` is swapped with the Dao for `getToken` (held in the Dao) through moloch proposals.
If passed, these proposals will send `giveToken` as tribute to the Dao and allow some `applicant` address to withdraw the proposed amount of `getToken`.
The rate of `giveToken` to `getToken` for a valid proposal will be set based on social consensus within the Dao.

### Comments and known issues

When a proposal is made through the Transmutation contract, the proposed amount of `giveToken` is immediately locked up in the Dao.
After a failed or cancelled proposal through the Transmutation contract, `Transmutation.withdrawGiveToken` must be called to retrieve these tokens.
As a result of this dynamic, any address that holds voting shares in the moloch can cancel any Transmutation proposal until the proposal is sponsored.
Members with voting shares can also atomically call `Transmutation.propose` followed by `Moloch.sponsorProposal`, which would allow locking up any amount of `giveToken` until the proposal is voted down.
The expected response to this would be to `guildKick` the proposer from the Dao, but the member would retain their voting shares until the `guildKick` proposal was processed, meaning they could likely perform the same attack a second time immediately after the griefing proposal is processed.
In short, a rogue Dao member could lock all of the Transmutation contract's `giveToken` for up to two Dao voting periods.

## Constructor

    constructor(
        address _moloch,
        address _giveToken,
        address _getToken,
        address _owner
    )

* The constructor takes The DAO address (_moloch).
* The token (_giveToken) which is held by this contract and is used to replace funds when the payment token is requested in a proposal.
* The token address (_getToken) that is considered the 'payment token' for the round .
* The owner of the contract (_owner). Should be a Minion

Both the DAO and the Minion are approved to move funds from this contract. The DAO must be approved to so this contract can make tribute to it through a proposal. And the Minion Owner is approved so tokens can be pulled out of this contract by a DAO proposal.

## Public Functions

`  function withdrawGiveToken()`

this is for the case where the dao sends some tokens to this contract through a proposal. This contract must be able to call withdrawBalance

## Member Only Functions

`  function cancel(uint256 _proposalId) external`

if a proposal is made in error this allows any DAO member to cancel it. Avoiding having to sponsored the proposal and then vote it down.

    function propose(
        address _applicant,
        uint256 _giveAmt,
        uint256 _getAmt,
        string calldata _details
    )

This is a wrapper around the moloch submitProposal function. It will ask for payment in the getToken and give tribute in the giveToken. _details is a param to collect a short desctiption and is substituted with the constant TRANSMUTATION_DETAILS which is used for front ends to display some details about the proposal.

## Events

    event Propose(uint256 proposalId, address sender);
    event Cancel(uint256 proposalId, address sender);
    event Deploy(
        address moloch,
        address giveToken,
        address getToken,
        address owner
    );
