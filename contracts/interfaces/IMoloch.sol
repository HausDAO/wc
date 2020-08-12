pragma solidity ^0.5.0;

interface IMoloch {
    function userTokenBalances(address user, address token) external view returns (uint256);
}
