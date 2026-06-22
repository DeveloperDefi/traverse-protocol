/**
 * Vortex VTX Protocol — Hardhat Deployment Script
 *
 * Deployment order:
 *   1. VTX token
 *   2. VortexTimelock
 *   3. VortexGovernor  (requires VTX + Timelock)
 *   4. VortexStaking   (requires VTX)
 *   5. VortexTreasury
 *   6. VortexRouter    (requires Staking + Treasury)
 *   7. Wire contracts  (setRouter on Staking, etc.)
 *   8. Transfer ownership of Router, Staking, Treasury → Timelock
 *   9. Configure Timelock roles (Governor as proposer, zero as executor)
 */

const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying Vortex VTX Protocol...");
  console.log("Deployer:", deployer.address);
  console.log(
    "Balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH\n"
  );

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Deploy VTX Token
  // ─────────────────────────────────────────────────────────────────────────
  console.log("1. Deploying VTX token...");
  const VTX = await ethers.getContractFactory("VTX");
  const vtx = await VTX.deploy(deployer.address); // full supply → deployer
  await vtx.waitForDeployment();
  const vtxAddress = await vtx.getAddress();
  console.log("   VTX deployed to:", vtxAddress);

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Deploy VortexTimelock
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n2. Deploying VortexTimelock...");
  const VortexTimelock = await ethers.getContractFactory("VortexTimelock");

  // Temporary: deployer is proposer during setup; replaced by Governor below.
  const timelockProposers  = [deployer.address];
  // address(0) means anyone can execute after the delay.
  const timelockExecutors  = [ethers.ZeroAddress];
  // Deployer holds admin initially to configure roles, then renounces.
  const timelockAdmin      = deployer.address;

  const timelock = await VortexTimelock.deploy(
    timelockProposers,
    timelockExecutors,
    timelockAdmin
  );
  await timelock.waitForDeployment();
  const timelockAddress = await timelock.getAddress();
  console.log("   VortexTimelock deployed to:", timelockAddress);

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Deploy VortexGovernor
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n3. Deploying VortexGovernor...");
  const VortexGovernor = await ethers.getContractFactory("VortexGovernor");
  const governor = await VortexGovernor.deploy(vtxAddress, timelockAddress);
  await governor.waitForDeployment();
  const governorAddress = await governor.getAddress();
  console.log("   VortexGovernor deployed to:", governorAddress);

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Deploy VortexStaking
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n4. Deploying VortexStaking...");
  const VortexStaking = await ethers.getContractFactory("VortexStaking");
  const staking = await VortexStaking.deploy(vtxAddress, deployer.address);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("   VortexStaking deployed to:", stakingAddress);

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Deploy VortexTreasury
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n5. Deploying VortexTreasury...");
  const VortexTreasury = await ethers.getContractFactory("VortexTreasury");
  const treasury = await VortexTreasury.deploy(deployer.address);
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log("   VortexTreasury deployed to:", treasuryAddress);

  // ─────────────────────────────────────────────────────────────────────────
  // 6. Deploy VortexRouter
  //    Operations wallet: deployer for now (update via governance post-launch)
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n6. Deploying VortexRouter...");
  const VortexRouter = await ethers.getContractFactory("VortexRouter");
  const router = await VortexRouter.deploy(
    stakingAddress,
    treasuryAddress,
    deployer.address, // opsWallet — replace with multisig post-launch
    deployer.address  // owner    — transferred to Timelock below
  );
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log("   VortexRouter deployed to:", routerAddress);

  // ─────────────────────────────────────────────────────────────────────────
  // 7. Wire Contracts
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n7. Wiring contracts...");

  // Tell Staking which Router is authorised to call distributeRevenue()
  let tx = await staking.setRouter(routerAddress);
  await tx.wait();
  console.log("   Staking.setRouter() done");

  // Staking distributes rewards in the same token the Router sends fees in
  // (each ERC-20 inputToken). For a single-token reward model, set as needed.
  // Example: set rewardToken to address(0) for ETH rewards, or to a specific ERC-20.
  // tx = await staking.setRewardToken(someRewardTokenAddress);

  // ─────────────────────────────────────────────────────────────────────────
  // 8. Transfer Ownership → Timelock
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n8. Transferring ownership to Timelock...");

  // Ownable2Step: first accept must be called from Timelock side, but for
  // simplicity in this deploy we use transferOwnership (the Timelock inherits
  // TimelockController which can call acceptOwnership via governance if needed).
  // If using Ownable2Step properly, schedule Timelock.acceptOwnership() calls.

  tx = await router.transferOwnership(timelockAddress);
  await tx.wait();
  console.log("   Router ownership transferred to Timelock");

  tx = await staking.transferOwnership(timelockAddress);
  await tx.wait();
  console.log("   Staking ownership transferred to Timelock");

  tx = await treasury.transferOwnership(timelockAddress);
  await tx.wait();
  console.log("   Treasury ownership transferred to Timelock");

  // ─────────────────────────────────────────────────────────────────────────
  // 9. Configure Timelock Roles
  //    - Grant PROPOSER_ROLE to Governor
  //    - Revoke PROPOSER_ROLE from deployer (clean up)
  //    - Revoke TIMELOCK_ADMIN_ROLE from deployer (self-governed from now on)
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n9. Configuring Timelock roles...");

  const PROPOSER_ROLE      = await timelock.PROPOSER_ROLE();
  const CANCELLER_ROLE     = await timelock.CANCELLER_ROLE();
  const TIMELOCK_ADMIN     = await timelock.DEFAULT_ADMIN_ROLE();

  // Grant Governor the proposer and canceller roles
  tx = await timelock.grantRole(PROPOSER_ROLE,  governorAddress);
  await tx.wait();
  console.log("   PROPOSER_ROLE granted to Governor");

  tx = await timelock.grantRole(CANCELLER_ROLE, governorAddress);
  await tx.wait();
  console.log("   CANCELLER_ROLE granted to Governor");

  // Revoke deployer's proposer role
  tx = await timelock.revokeRole(PROPOSER_ROLE, deployer.address);
  await tx.wait();
  console.log("   PROPOSER_ROLE revoked from deployer");

  // Renounce admin role — timelock is now self-governed
  tx = await timelock.renounceRole(TIMELOCK_ADMIN, deployer.address);
  await tx.wait();
  console.log("   TIMELOCK_ADMIN_ROLE renounced by deployer");

  // ─────────────────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════");
  console.log("  Vortex VTX Protocol — Deployment Complete");
  console.log("═══════════════════════════════════════════════");
  console.log("  VTX Token     :", vtxAddress);
  console.log("  Timelock      :", timelockAddress);
  console.log("  Governor      :", governorAddress);
  console.log("  Staking       :", stakingAddress);
  console.log("  Treasury      :", treasuryAddress);
  console.log("  Router        :", routerAddress);
  console.log("═══════════════════════════════════════════════\n");

  // Persist addresses for verification / integration
  const addresses = {
    vtx:      vtxAddress,
    timelock: timelockAddress,
    governor: governorAddress,
    staking:  stakingAddress,
    treasury: treasuryAddress,
    router:   routerAddress,
    network:  (await ethers.provider.getNetwork()).name,
    chainId:  Number((await ethers.provider.getNetwork()).chainId),
    deployedAt: new Date().toISOString(),
  };

  const fs = require("fs");
  fs.writeFileSync(
    "./deployments.json",
    JSON.stringify(addresses, null, 2)
  );
  console.log("  Addresses saved to deployments.json");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
