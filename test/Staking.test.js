const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

const E18 = (n) => ethers.parseUnits(n.toString(), 18);

describe("TraverseStaking — security fixes TRV-09/10/11", function () {
  let trv, staking, owner, router, alice, bob, insurance;

  beforeEach(async function () {
    [owner, router, alice, bob, insurance] = await ethers.getSigners();

    const TRV = await ethers.getContractFactory("TRV");
    trv = await TRV.deploy(owner.address);

    const Staking = await ethers.getContractFactory("TraverseStaking");
    staking = await Staking.deploy(await trv.getAddress(), owner.address);

    // Use an EOA as the "router" so we can call distributeRevenue directly.
    await staking.connect(owner).setRouter(router.address);

    // Fund stakers with TRV.
    await trv.connect(owner).transfer(alice.address, E18(50_000));
    await trv.connect(owner).transfer(bob.address, E18(50_000));
  });

  async function stake(user, amount) {
    await trv.connect(user).approve(await staking.getAddress(), amount);
    await staking.connect(user).stake(amount);
  }

  // Helper: deliver `amount` of `token` to staking then notify (mimics Router).
  async function distribute(token, amount) {
    await token.connect(owner).transfer(await staking.getAddress(), amount);
    await staking.connect(router).distributeRevenue(await token.getAddress(), amount);
  }

  it("TRV-09: accrues and pays rewards in the exact token forwarded (multi-token)", async function () {
    const Mock = await ethers.getContractFactory("MockERC20");
    const usdc = await Mock.deploy("USDC", "USDC", 6);
    const weth = await Mock.deploy("WETH", "WETH", 18);
    await usdc.mint(owner.address, 1_000_000n);
    await weth.mint(owner.address, E18(1000));

    await stake(alice, E18(10_000));
    await stake(bob, E18(30_000)); // alice 25%, bob 75%

    await distribute(usdc, 1_000_000n); // 1.0 USDC (6 dp)
    await distribute(weth, E18(4));

    // Alice = 25%
    expect(await staking.pendingRewards(alice.address, await usdc.getAddress())).to.equal(250_000n);
    expect(await staking.pendingRewards(alice.address, await weth.getAddress())).to.equal(E18(1));
    // Bob = 75%
    expect(await staking.pendingRewards(bob.address, await weth.getAddress())).to.equal(E18(3));

    const before = await weth.balanceOf(alice.address);
    await staking.connect(alice).claimRewards();
    expect(await weth.balanceOf(alice.address)).to.equal(before + E18(1));
    expect(await usdc.balanceOf(alice.address)).to.equal(250_000n);
    // Reward tokens are tracked.
    expect((await staking.getRewardTokens()).length).to.equal(2);
  });

  it("TRV-11: fees distributed with no stakers are carried, not orphaned", async function () {
    const Mock = await ethers.getContractFactory("MockERC20");
    const usdc = await Mock.deploy("USDC", "USDC", 6);
    await usdc.mint(owner.address, 2_000_000n);

    // No stakers yet — should be carried in undistributed.
    await distribute(usdc, 1_000_000n);
    expect(await staking.undistributed(await usdc.getAddress())).to.equal(1_000_000n);

    await stake(alice, E18(10_000));
    // Next distribution folds in the carried amount.
    await distribute(usdc, 1_000_000n);
    expect(await staking.undistributed(await usdc.getAddress())).to.equal(0n);
    expect(await staking.pendingRewards(alice.address, await usdc.getAddress())).to.equal(2_000_000n);
  });

  it("TRV-10: slash reaches active stake AND cooling-down stake; no isSolver dodge", async function () {
    await stake(alice, E18(20_000));
    await staking.connect(alice).registerAsSolver(0);
    expect(await staking.isSolver(alice.address)).to.equal(true);

    // Alice tries to dodge: unstake below minimum -> auto-deregistered.
    await staking.connect(alice).unstake(E18(15_000));
    expect(await staking.isSolver(alice.address)).to.equal(false);

    const info1 = await staking.stakers(alice.address);
    expect(info1.staked).to.equal(E18(5_000));
    expect(info1.unstakeAmount).to.equal(E18(15_000));

    // Governance slashes 18,000: 5,000 from active + 13,000 from cooldown.
    await staking.connect(owner).slash(alice.address, E18(18_000), insurance.address);

    const info2 = await staking.stakers(alice.address);
    expect(info2.staked).to.equal(0n);
    expect(info2.unstakeAmount).to.equal(E18(2_000));
    expect(await trv.balanceOf(insurance.address)).to.equal(E18(18_000));
  });

  it("TRV-10: slash cannot exceed active + cooling-down stake", async function () {
    await stake(alice, E18(12_000));
    await staking.connect(alice).registerAsSolver(0);
    await expect(
      staking.connect(owner).slash(alice.address, E18(20_000), insurance.address)
    ).to.be.revertedWith("TraverseStaking: slash exceeds total stake");
  });

  it("TRV-10: only owner can slash", async function () {
    await stake(alice, E18(12_000));
    await expect(
      staking.connect(bob).slash(alice.address, E18(1), insurance.address)
    ).to.be.reverted;
  });
});
