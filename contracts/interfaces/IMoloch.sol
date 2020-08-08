pragma solidity ^0.5.0;

interface IMoloch {
    function userTokenBalances(address user, address token) external view returns (uint256);


    ////////// tdwol
    // function cancelProposal(uint) external;
    // function withdrawBalance(address, uint) external;
    // function members(address) external view returns (uint,uint,uint,uint,uint,uint);
    // function submitProposal(
    //     address,
    //     uint256,
    //     uint256,
    //     uint256,
    //     address,
    //     uint256,
    //     address,
    //     string calldata) external returns (uint256 proposalId);
}
