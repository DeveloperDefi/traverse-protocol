const { expect } = require("chai");
const { ethers } = require("hardhat");

const E18 = (n) => ethers.parseUnits(n.toString(), 18);

describe("TraverseRouter — fee-on-transfer fix TRV-12 + full fill flow", function () {
  let trv, staking, router, owner, treasury, ops, user, solver;
  let chainId;

  beforeEach(async function () {
    [owner, treasury, ops, user, solver] = await ethers.getSigners();
    chainId = (await ethers.provider.getNetwork()).chainId;

    const TRV = await ethers.getContractFactory("TRV");
    trv = await TRV.deploy(owner.address);

    const Staking = await ethers.getContractFactory("TraverseStaking");
    staking = await Staking.deploy(await trv.getAddress(), owner.address);

    const Router = await ethers.getContractFactory("TraverseRouter");
    router = await Router.deploy(
      await staking.getAddress(), treasury.address, ops.address, owner.address
    );
    await staking.connect(owner).setRouter(await router.getAddress());

    // Register solver: needs >= 10,000 TRV staked.
    await trv.connect(owner).transfer(solver.address, E18(10_000));
    await trv.connect(solver).approve(await staking.getAddress(), E18(10_000));
    await staking.connect(solver).registerAsSolver(E18(10_000));
  });

  async function signIntent(signer, intent) {
    const domain = {
      name: "TraverseRouter",
      version: "1",
      chainId,
      verifyingContract: await router.getAddress(),
    };
    const types = {
      Intent: [
        { name: "user", type: "address" },
        { name: "inputToken", type: "address" },
        { name: "outputToken", type: "address" },
        { name: "inputAmount", type: "uint256" },
        { name: "minOutput", type: "uint256" },
        { name: "sourceChain", type: "uint256" },
        { name: "destChain", type: "uint256" },
        { name: "deadline", type: "uint256" },
        { name: "nonce", type: "uint256" },
      ],
    };
    return signer.signTypedData(domain, types, intent);
  }

  it("TRV-12: stores the amount actually received for fee-on-transfer tokens", async function () {
    const FOT = await ethers.getContractFactory("FeeOnTransferToken");
    const fot = await FOT.deploy(100); // 1% transfer fee
    const Mock = await ethers.getContractFactory("MockERC20");
    const out = await Mock.deploy("OUT", "OUT", 18);

    const inputAmount = E18(1000);
    await fot.mint(user.address, inputAmount);
    await fot.connect(user).approve(await router.getAddress(), inputAmount);

    const deadline = (await ethers.provider.getBlock("latest")).timestamp + 3600;
    const intent = {
      user: user.address,
      inputToken: await fot.getAddress(),
      outputToken: await out.getAddress(),
      inputAmount,
      minOutput: E18(900),
      sourceChain: chainId,
      destChain: chainId,
      deadline,
      nonce: 0,
    };
    const sig = await signIntent(user, intent);

    const tx = await router.connect(user).submitIntent(
      intent.inputToken, intent.outputToken, intent.inputAmount, intent.minOutput,
      intent.sourceChain, intent.destChain, intent.deadline, sig
    );
    const receipt = await tx.wait();

    // The router received only 990 (1% burned). Stored inputAmount must equal 990.
    const routerBal = await fot.balanceOf(await router.getAddress());
    expect(routerBal).to.equal(E18(990));

    // Recompute intentHash to look up stored intent.
    const evt = receipt.logs.map(l => { try { return router.interface.parseLog(l); } catch { return null; } })
      .find(e => e && e.name === "IntentCreated");
    const intentHash = evt.args.intentHash;
    const stored = await router.getIntent(intentHash);
    expect(stored.inputAmount).to.equal(E18(990));
  });

  it("full same-chain fill: delivers output, splits fee 70/20/10, accrues staker rewards", async function () {
    const Mock = await ethers.getContractFactory("MockERC20");
    const tin = await Mock.deploy("IN", "IN", 18);
    const out = await Mock.deploy("OUT", "OUT", 18);

    const inputAmount = E18(10_000);
    await tin.mint(user.address, inputAmount);
    await tin.connect(user).approve(await router.getAddress(), inputAmount);

    // Solver holds + approves output token.
    const actualOutput = E18(9_950);
    await out.mint(solver.address, actualOutput);
    await out.connect(solver).approve(await router.getAddress(), actualOutput);

    const deadline = (await ethers.provider.getBlock("latest")).timestamp + 3600;
    const intent = {
      user: user.address, inputToken: await tin.getAddress(), outputToken: await out.getAddress(),
      inputAmount, minOutput: E18(9_900), sourceChain: chainId, destChain: chainId, deadline, nonce: 0,
    };
    const sig = await signIntent(user, intent);
    const tx = await router.connect(user).submitIntent(
      intent.inputToken, intent.outputToken, inputAmount, intent.minOutput,
      chainId, chainId, deadline, sig
    );
    const receipt = await tx.wait();
    const evt = receipt.logs.map(l => { try { return router.interface.parseLog(l); } catch { return null; } })
      .find(e => e && e.name === "IntentCreated");
    const intentHash = evt.args.intentHash;

    await router.connect(solver).fillIntent(intentHash, actualOutput);

    // User received the output.
    expect(await out.balanceOf(user.address)).to.equal(actualOutput);

    // Fee = 5 bps of 10,000 = 5 tokens. staking 70% = 3.5, treasury 20% = 1.0, ops 10% = 0.5.
    const fee = E18(10_000) * 5n / 10_000n; // 5e18
    const stakingPortion = fee * 7000n / 10_000n;
    const treasuryPortion = fee * 2000n / 10_000n;
    const opsPortion = fee - stakingPortion - treasuryPortion;

    expect(await tin.balanceOf(treasury.address)).to.equal(treasuryPortion);
    expect(await tin.balanceOf(ops.address)).to.equal(opsPortion);
    // Solver got netInput = inputAmount - fee.
    expect(await tin.balanceOf(solver.address)).to.equal(inputAmount - fee);
    // Staking pending for the solver (sole staker) equals the staking portion, paid in input token.
    expect(await staking.pendingRewards(solver.address, await tin.getAddress())).to.equal(stakingPortion);
  });

  it("rejects cross-chain intents while crossChainEnabled is false", async function () {
    const Mock = await ethers.getContractFactory("MockERC20");
    const tin = await Mock.deploy("IN", "IN", 18);
    const out = await Mock.deploy("OUT", "OUT", 18);
    const inputAmount = E18(10_000);
    await tin.mint(user.address, inputAmount);
    await tin.connect(user).approve(await router.getAddress(), inputAmount);

    const deadline = (await ethers.provider.getBlock("latest")).timestamp + 3600;
    const intent = {
      user: user.address, inputToken: await tin.getAddress(), outputToken: await out.getAddress(),
      inputAmount, minOutput: E18(9_900), sourceChain: chainId, destChain: 999999n, deadline, nonce: 0,
    };
    const sig = await signIntent(user, intent);
    await expect(router.connect(user).submitIntent(
      intent.inputToken, intent.outputToken, inputAmount, intent.minOutput,
      chainId, 999999n, deadline, sig
    )).to.be.revertedWith("TraverseRouter: cross-chain not enabled");
  });
});
