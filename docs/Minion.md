# Minion

> "Moloch whose fingers are ten armies!"

A contract that allows execution of arbitrary calls voted on by members of a Moloch DAO.

## Constructor

    constructor(address _moloch)
    
Takes the DAO address of the parent.

## public functions

`  function doWithdraw(address _token, uint256 _amount)`

this is for the case where the DAO sends some tokens to this contract through a proposal. This contract must be able to call withdrawBalance

`      function proposeAction(
        address _actionTo,
        uint256 _actionValue,
        bytes memory _actionData,
        string memory _description
    )`

This submits a proposal to the parent DAO, takes a target contract and the hex data of the function to call if the proposal passes.

This data is stored in memory.

`function executeAction(uint256 _proposalId)`

if the proposal passes the hex data is executed against the target contract.



## Events

    event ActionProposed(uint256 proposalId, address proposer);
    event ActionExecuted(uint256 proposalId, address executor);