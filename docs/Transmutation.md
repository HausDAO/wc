# Transmutation

> "Moloch whose blood is running money!"

Transmutation is a contract that enables and enforces the process for HausDAO funding proposals.

* Funding proposals against the GuildBank tokens can only be made through the Transmutation contract to ensure the correct amount of HAUS tokens are added to the GuildBank in exchange.
* Funding proposals can only be made from the Transmutation vault.
* Funding proposals cannot be more than 25% of the initial GuildBank holdings per month

## Constructor

    constructor(
        address _moloch,
        address _giveToken,
        address _getToken,
        address _owner
    )
    
* The constructor takes The DAO address (_moloch).
* The token address (_giveToken) that is considered the 'payment token' for the round .
* The token (_getToken) which is held by this contract and is used to replace funds when the payment token is requested in a proposal.
* The owner of the contract (_owner). Should be a Minion

Both the DAO and the Minion are approved to move funds from this contract. The DAO must be approved to so this contract can make tribute to it through a proposal. And the Minion Owner is approved so tokens can be pulled out of this contract by a DAO proposal.

## Public Functions

`  function withdrawGiveToken()`

this is for the case where the dao sends some tokens to this contract through a proposal. This contract must be able to call withdrawBalance

## Member Only Functions

`  function cancel(uint256 _proposalId) external`

if a proposal is made in error this allows any DAO member to cancel it. Avoiding having to sponsored the proposal and then vote it down. Also without this there could be a situation where a mistake or bad member could lock up to many tokens in the DAO escrow.

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
