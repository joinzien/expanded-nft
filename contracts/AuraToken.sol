//SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC777/ERC777.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract AuraToken is ERC777, Ownable {
    /**
     * See {ERC777-constructor}.
     */
    constructor() ERC777("New Aura Token", "AURA", new address[](0)) Ownable() {
        _ERC1820_REGISTRY.setInterfaceImplementer(
            address(this),
            keccak256("ERC777Token"),
            address(this)
        );
    }

    function mint(address to, uint256 value) public onlyOwner {
        _mint(to, value, "", "");
    }
}
