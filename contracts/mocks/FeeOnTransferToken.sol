// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice ERC-20 that burns a fixed basis-point fee on every transfer.
///         Used to test fee-on-transfer accounting (TRV-12).
contract FeeOnTransferToken is ERC20 {
    uint256 public immutable feeBps; // e.g. 100 = 1%

    constructor(uint256 _feeBps) ERC20("FeeOnTransfer", "FOT") {
        feeBps = _feeBps;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function _update(address from, address to, uint256 value) internal override {
        if (from == address(0) || to == address(0) || feeBps == 0) {
            super._update(from, to, value); // mint/burn: no fee
            return;
        }
        uint256 fee = (value * feeBps) / 10_000;
        super._update(from, address(0), fee); // burn the fee
        super._update(from, to, value - fee);
    }
}
