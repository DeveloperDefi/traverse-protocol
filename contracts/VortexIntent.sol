// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title VortexIntent — Intent Storage and EIP-712 Signing
 * @notice Defines the Intent struct, IntentStatus enum, and all storage/events
 *         related to user intents in the Vortex protocol. Also provides EIP-712
 *         domain separation and intent-hash utilities consumed by VortexRouter.
 * @dev    Intended to be inherited by VortexRouter, not deployed standalone.
 */
abstract contract VortexIntent is EIP712 {
    using ECDSA for bytes32;

    // ─────────────────────────────────────────────────────────────────────────
    // Types
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Lifecycle state of an intent.
     * @param PENDING   Submitted, awaiting a solver to fill.
     * @param FILLED    Successfully executed by a solver.
     * @param CANCELLED Cancelled by the originating user.
     * @param EXPIRED   Deadline passed without a fill.
     */
    enum IntentStatus { PENDING, FILLED, CANCELLED, EXPIRED }

    /**
     * @notice A cross-chain swap intent created by a user.
     * @param user          Address that created and signed the intent.
     * @param solver        Address of the solver that filled (address(0) while pending).
     * @param inputToken    Token address the user provides (on sourceChain).
     * @param outputToken   Token address the user expects to receive (on destChain).
     * @param inputAmount   Exact amount of inputToken the user commits.
     * @param minOutput     Minimum acceptable amount of outputToken.
     * @param sourceChain   EVM chain ID of the input token's chain.
     * @param destChain     EVM chain ID of the output token's chain.
     * @param deadline      Unix timestamp after which the intent can be expired.
     * @param nonce         Per-user monotonic nonce to prevent replay.
     * @param status        Current lifecycle status of the intent.
     */
    struct Intent {
        address user;
        address solver;
        address inputToken;
        address outputToken;
        uint256 inputAmount;
        uint256 minOutput;
        uint256 sourceChain;
        uint256 destChain;
        uint256 deadline;
        uint256 nonce;
        IntentStatus status;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EIP-712 Type Hash
    // ─────────────────────────────────────────────────────────────────────────

    /// @dev Keccak256 of the canonical Intent struct type string.
    bytes32 public constant INTENT_TYPEHASH = keccak256(
        "Intent(address user,address inputToken,address outputToken,"
        "uint256 inputAmount,uint256 minOutput,uint256 sourceChain,"
        "uint256 destChain,uint256 deadline,uint256 nonce)"
    );

    // ─────────────────────────────────────────────────────────────────────────
    // Storage
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Maps intent hash → full Intent struct.
    mapping(bytes32 => Intent) public intents;

    /// @notice Per-user nonce, incremented on each submitted intent to prevent replay.
    mapping(address => uint256) public nonces;

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Emitted when a user submits a new intent.
     * @param intentHash   Unique EIP-712 hash identifying this intent.
     * @param user         Address of the intent creator.
     * @param inputToken   Token to be provided by the user.
     * @param outputToken  Token to be received by the user.
     * @param inputAmount  Amount of inputToken committed.
     * @param minOutput    Minimum acceptable output amount.
     * @param sourceChain  Chain ID of the source chain.
     * @param destChain    Chain ID of the destination chain.
     * @param deadline     Expiration timestamp of the intent.
     * @param nonce        Per-user replay-prevention nonce.
     */
    event IntentCreated(
        bytes32 indexed intentHash,
        address indexed user,
        address inputToken,
        address outputToken,
        uint256 inputAmount,
        uint256 minOutput,
        uint256 sourceChain,
        uint256 destChain,
        uint256 deadline,
        uint256 nonce
    );

    /**
     * @notice Emitted when a solver successfully fills an intent.
     * @param intentHash    Hash of the filled intent.
     * @param solver        Address of the winning solver.
     * @param user          Address of the intent creator.
     * @param actualOutput  Actual output amount delivered to the user.
     * @param feePaid       Protocol fee collected (in inputToken units).
     */
    event IntentFilled(
        bytes32 indexed intentHash,
        address indexed solver,
        address indexed user,
        uint256 actualOutput,
        uint256 feePaid
    );

    /**
     * @notice Emitted when a user cancels their pending intent.
     * @param intentHash Hash of the cancelled intent.
     * @param user       Address of the intent creator.
     */
    event IntentCancelled(
        bytes32 indexed intentHash,
        address indexed user
    );

    /**
     * @notice Emitted when a pending intent is marked expired.
     * @param intentHash Hash of the expired intent.
     * @param user       Address of the intent creator.
     */
    event IntentExpired(
        bytes32 indexed intentHash,
        address indexed user
    );

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @param name    EIP-712 domain name (e.g. "VortexRouter").
     * @param version EIP-712 domain version (e.g. "1").
     */
    constructor(string memory name, string memory version)
        EIP712(name, version)
    {}

    // ─────────────────────────────────────────────────────────────────────────
    // Internal Helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Computes the EIP-712 typed-data hash for an intent.
     * @param user         User address.
     * @param inputToken   Source token address.
     * @param outputToken  Destination token address.
     * @param inputAmount  Amount of source token.
     * @param minOutput    Minimum acceptable output.
     * @param sourceChain  Source chain ID.
     * @param destChain    Destination chain ID.
     * @param deadline     Expiration timestamp.
     * @param nonce        User nonce at time of submission.
     * @return intentHash The EIP-712 digest.
     */
    function _hashIntent(
        address user,
        address inputToken,
        address outputToken,
        uint256 inputAmount,
        uint256 minOutput,
        uint256 sourceChain,
        uint256 destChain,
        uint256 deadline,
        uint256 nonce
    ) internal view returns (bytes32 intentHash) {
        bytes32 structHash = keccak256(abi.encode(
            INTENT_TYPEHASH,
            user,
            inputToken,
            outputToken,
            inputAmount,
            minOutput,
            sourceChain,
            destChain,
            deadline,
            nonce
        ));
        intentHash = _hashTypedDataV4(structHash);
    }

    /**
     * @notice Recovers the signer from an EIP-712 intent hash and signature.
     * @param intentHash EIP-712 digest of the intent.
     * @param signature  65-byte ECDSA signature.
     * @return signer    Recovered signer address.
     */
    function _recoverSigner(bytes32 intentHash, bytes calldata signature)
        internal
        pure
        returns (address signer)
    {
        signer = ECDSA.recover(intentHash, signature);
    }

    /**
     * @notice Returns the EIP-712 domain separator for external tooling.
     */
    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
}
