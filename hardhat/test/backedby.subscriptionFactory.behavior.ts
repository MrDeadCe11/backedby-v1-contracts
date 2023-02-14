import { DebugERC20 } from './../types/contracts/utils/DebugERC20';
import { BBErrorCodesV01 } from './../types/contracts/BBErrorsV01.sol/BBErrorCodesV01';
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, Wallet } from "ethers";
import { ethers } from "hardhat";

import { BBPosts } from "./../types/contracts/BBPosts";
import { BBProfiles } from "./../types/contracts/BBProfiles";
import { BBSubscriptions } from "./../types/contracts/BBSubscriptions";
import { BBSubscriptionsFactory } from "./../types/contracts/BBSubscriptionsFactory";
import { BBTiers } from "./../types/contracts/BBTiers";
import { deployBackedByFixture } from "./backby.fixture";
import { getDefaultSigners } from "./utils/utils";

export async function shouldBehaveLikeBackedBySubscriptionFactory() {
  describe("Subscriptions Factory", function () {
    let signers: { [key: string]: SignerWithAddress };
    let treasury: Wallet;
    let erc20: DebugERC20;
    let bbProfiles: BBProfiles;
    let bbTiers: BBTiers;
    let bbPosts: BBPosts;
    let bbSubscriptionsFactory: BBSubscriptionsFactory;
    let bbSubscriptions: BBSubscriptions;
    let bbErrors: BBErrorCodesV01;


    describe("Deployment and setup", function () {

      beforeEach("Set up test", async function () {
        signers = await getDefaultSigners();
  
        const { _treasury, _erc20, _bbProfiles, _bbTiers, _bbPosts, _bbSubscriptionsFactory, _bbSubscriptions } =
          await loadFixture(deployBackedByFixture);
  
        bbSubscriptionsFactory = _bbSubscriptionsFactory;
        treasury = _treasury;
        erc20 = _erc20;
      });

      it("Should correctly deploy the Subscriptions Factory", async function () {
        expect(await bbSubscriptionsFactory.getTreasuryOwner()).to.eq(signers.admin.address);
        expect(await bbSubscriptionsFactory.getGasOracleOwner()).to.eq(signers.admin.address);
        expect(await bbSubscriptionsFactory.getSubscriptionFeeOwner()).to.eq(signers.admin.address);
        expect(await bbSubscriptionsFactory.getTreasury()).to.eq(treasury.address);
        expect(await bbSubscriptionsFactory.getGasOracle()).to.eq(ethers.constants.AddressZero);
        expect((await bbSubscriptionsFactory.getContributionBounds()).toString()).to.be.eq("1,100");
        expect(await bbSubscriptionsFactory.getGracePeriod()).to.eq("172800");
      });

      it("deploySubscriptions should succeed", async function () {
        const subscriptionAddress = await bbSubscriptionsFactory.callStatic.deploySubscriptions(erc20.address);
        await expect(bbSubscriptionsFactory.deploySubscriptions(erc20.address)).to.emit(bbSubscriptionsFactory,  "DeployedSubscription").withArgs(erc20.address, subscriptionAddress);
      });

      it("deploySubscriptions should fail when called by wrong EOA", async function () {
        const subscriptionAddress = await bbSubscriptionsFactory.callStatic.deploySubscriptions(erc20.address);
        await expect(bbSubscriptionsFactory.connect(signers.user).deploySubscriptions(erc20.address)).to.be.rejectedWith('1');
      });

      it("setSubscriptionFeeOwner should succeed", async function () {
        expect(await bbSubscriptionsFactory.connect(signers.admin).setSubscriptionFeeOwner(signers.user.address)).to.not.be.reverted;
        expect(await bbSubscriptionsFactory.getSubscriptionFeeOwner()).to.eq(signers.user.address);
      });

      it("setSubscriptionFeeOwner should revert if not called by owner", async function () {
        return await expect(bbSubscriptionsFactory.connect(signers.user2).setSubscriptionFeeOwner(signers.user2.address)).to.be.revertedWith("1");
      });

      it("setGasOracleOwner should succeed", async function () {
        expect(await bbSubscriptionsFactory.connect(signers.admin).setGasOracleOwner(signers.user.address)).to.not.be.reverted;
        expect(await bbSubscriptionsFactory.getGasOracleOwner()).to.eq(signers.user.address);
      });

      it("setGasOracleOwner should revert if not called by owner", async function () {
        await expect(bbSubscriptionsFactory.connect(signers.user2).setGasOracleOwner(signers.user2.address)).to.be.revertedWith("1");
      });

      it("setTreasuryOwner should succeed", async function () {
        expect(await bbSubscriptionsFactory.connect(signers.admin).setTreasuryOwner(signers.user.address)).to.not.be.reverted;
        expect(await bbSubscriptionsFactory.getTreasuryOwner()).to.eq(signers.user.address);
      });

      it("setTreasuryOwner should revert if not called by owner", async function () {
        await expect(bbSubscriptionsFactory.connect(signers.user2).setTreasuryOwner(signers.user2.address)).to.be.revertedWith("1");
      });

      it("setTreasury should succeed", async function () {
        expect(await bbSubscriptionsFactory.connect(signers.admin).setTreasury(signers.user.address)).to.not.be.reverted;
        expect(await bbSubscriptionsFactory.getTreasury()).to.eq(signers.user.address);
      });

      it("setTreasury should revert if not called by owner", async function () {
        await expect(bbSubscriptionsFactory.connect(signers.user2).setTreasury(signers.user2.address)).to.be.revertedWith("1");
      });
      it("setSubscriptionFee should succeed", async function () {
        expect(await bbSubscriptionsFactory.connect(signers.admin).setSubscriptionFee(erc20.address, ethers.utils.parseEther("1"))).to.not.be.reverted;
        expect(await bbSubscriptionsFactory.getTreasury()).to.eq(signers.user.address);
      });

      it("setSubscriptionFee should revert if not called by owner", async function () {
        await expect(bbSubscriptionsFactory.connect(signers.user2).setSubscriptionFee(erc20.address, ethers.utils.parseEther("1"))).to.be.revertedWith("1");
      });

    });

    describe("Functions", function () {
      beforeEach("Set up test", async function () {
        signers = await getDefaultSigners();
  
        const { _treasury, _erc20, _bbProfiles, _bbTiers, _bbPosts, _bbSubscriptionsFactory, _bbSubscriptions } =
          await loadFixture(deployBackedByFixture);
  
        bbSubscriptionsFactory = _bbSubscriptionsFactory;
        treasury = _treasury;
        bbSubscriptions = _bbSubscriptions;
        bbProfiles = _bbProfiles;

        // bbProfiles.connect(signers.user).createProfile(signers.user.address)
      });      
    });
  });
}
