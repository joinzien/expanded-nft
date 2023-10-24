// SPDX-License-Identifier: GPL-3.0

/**

    Test pass ERC721 contract

 */

pragma solidity ^0.8.19;

import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

contract TestPassTwo is ERC721Upgradeable {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    CountersUpgradeable.Counter private _tokenIds;

    function initialize() public initializer {
        __ERC721_init("Test Pass One", "TPO");
    }

    function mint(address player) public returns (uint256) {
        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _mint(player, newItemId);

        return newItemId;
    }
}