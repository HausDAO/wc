pragma solidity ^0.5.0;

interface IMoloch {

    function depositToken() external view returns(address);
    function getProposalFlags(uint256 proposalId) external view
        returns (bool[6] memory);
    function members(address usr) external view
        returns (address, uint256, uint256, bool, uint256, uint256);
    function userTokenBalances(address user, address token) external view
        returns (uint256);

    function cancelProposal(uint256 proposalId) external;
    function withdrawBalance(address token, uint256 amount) external;

    function submitProposal(
        address applicant,
        uint256 sharesRequested,
        uint256 lootRequested,
        uint256 tributeOffered,
        address tributeToken,
        uint256 paymentRequested,
        address paymentToken,
        string calldata details
    ) external returns (uint256 proposalId);
}
