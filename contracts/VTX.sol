// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

/**
 * @title VTX — Vortex Protocol Token
 * @notice ERC-20 governance and utility token for the Vortex cross-chain liquidity router.
 *         Fixed supply of 1,000,000,000 VTX minted entirely at deploy time.
 *         Supports EIP-2612 gasless approvals (Permit) and EIP-5805 on-chain voting (Votes).
 * @dev    No mint function exists after construction. Supply can only decrease via burn().
 */
contract VTX is ERC20, ERC20Permit, ERC20Votes {
    // ─────────────────────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Total fixed supply: 1,000,000,000 VTX (18 decimals).
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10 ** 18;

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @param initialHolder Address that receives the entire fixed supply on deploy.
     *                      Typically a multisig or distribution contract.
     */
    constructor(address initialHolder)
        ERC20("Vortex", "VTX")
        ERC20Permit("Vortex")
    {
        require(initialHolder != address(0), "VTX: zero address");
        _mint(initialHolder, TOTAL_SUPPLY);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Public Functions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Burns `amount` tokens from the caller's balance, reducing total supply.
     * @param amount The quantity of VTX (in wei) to destroy.
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    /**
     * @notice Burns `amount` tokens from `account` using the caller's allowance.
     * @param account The address whose tokens will be burned.
     * @param amount  The quantity of VTX (in wei) to destroy.
     */
    function burnFrom(address account, uint256 amount) external {
        _spendAllowance(account, msg.sender, amount);
        _burn(account, amount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Required Overrides (ERC20Votes / ERC20Permit share _update hook)
    // ─────────────────────────────────────────────────────────────────────────

    /// @inheritdoc ERC20
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    /// @inheritdoc ERC20Permit
    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
