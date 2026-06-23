// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title TraverseTimelock — Governance Timelock Executor
 * @notice Wraps OpenZeppelin's TimelockController with Traverse-specific defaults.
 *
 * Configuration:
 *   - Minimum delay: 2 days — no governance action can be executed sooner.
 *   - Proposers: set to the TraverseGovernor address during deployment.
 *   - Executors: address(0) — any account can execute a ready operation
 *     (decentralised execution; callers pay their own gas).
 *   - Admin: address(0) after setup (no permanent admin key; timelock governs itself).
 *
 * Post-deployment, ownership of TraverseRouter, TraverseStaking, and TraverseTreasury
 * is transferred to this contract so that all parameter changes go through governance.
 */
contract TraverseTimelock is TimelockController {
    // ─────────────────────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Minimum timelock delay: 2 days.
    uint256 public constant MIN_DELAY = 2 days;

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @param proposers  Addresses allowed to schedule operations (Governor contract).
     * @param executors  Addresses allowed to execute; pass address(0) to allow anyone.
     * @param admin      Optional admin address; set to address(0) to renounce admin role
     *                   immediately and make the timelock self-governed.
     */
    constructor(
        address[] memory proposers,
        address[] memory executors,
        address admin
    )
        TimelockController(MIN_DELAY, proposers, executors, admin)
    {}
}
