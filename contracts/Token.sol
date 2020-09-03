pragma solidity 0.5.11;

import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";

contract Token is ERC20Detailed, ERC20Mintable {

    constructor(
        string memory name,
        string memory symbol
    )
        public
        ERC20Detailed(name, symbol, 18) {}
}
