import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, Wallet } from "ethers";
import { ethers } from "hardhat";

import * as subscriptionsInterface from "../artifacts/contracts/BBSubscriptions.sol/BBSubscriptions.json";
import { BBProfiles } from "./../typechain-types/contracts/BBProfiles";
import { BBSubscriptions } from "./../typechain-types/contracts/BBSubscriptions";
import { BBSubscriptionsFactory } from "./../typechain-types/contracts/BBSubscriptionsFactory";
import { BBTiers } from "./../typechain-types/contracts/BBTiers";
import { DebugERC20 } from "./../typechain-types/contracts/utils/DebugERC20";
import { DebugGasOracle } from "./../typechain-types/contracts/utils/DebugGasOracle";
import { deployBackedByFixture } from "./backby.fixture";
import { getDefaultSigners, getTimestamp } from "./utils/utils";

export async function shouldBehaveLikeBackedBySubscriptions() {
  describe("Subscriptions Factory", function () {
    let signers: { [key: string]: SignerWithAddress };
    let treasury: Wallet;
    let erc20: DebugERC20;
    let bbProfiles: BBProfiles;
    let bbTiers: BBTiers;
    let bbSubscriptionsFactory: BBSubscriptionsFactory;
    let deployedSubscription: BBSubscriptions;
    let gasOracle: DebugGasOracle;
    let profileId: BigNumber;
    let tierSetId: BigNumber;
    let prepaidGas: BigNumber;

    beforeEach("Set up test", async function () {
      signers = await getDefaultSigners();

      const { _treasury, _erc20, _gasOracle, _bbProfiles, _bbTiers, _bbSubscriptionsFactory } = await loadFixture(
        deployBackedByFixture,
      );

      bbSubscriptionsFactory = _bbSubscriptionsFactory;
      treasury = _treasury;
      erc20 = _erc20;
      gasOracle = _gasOracle;
      bbTiers = _bbTiers;
      bbProfiles = _bbProfiles;

      //set gas oracle
      await bbSubscriptionsFactory.setGasOracle(gasOracle.address);
      //get deployed address
      const deployedSubscriptionAddress = await bbSubscriptionsFactory.callStatic.deploySubscriptions(erc20.address);
      //deploy subscriptions for test erc20
      await expect(bbSubscriptionsFactory.deploySubscriptions(erc20.address)).to.emit(
        bbSubscriptionsFactory,
        "DeployedSubscription",
      );

      //get deployed contract
      deployedSubscription = new ethers.Contract(
        deployedSubscriptionAddress,
        subscriptionsInterface.abi,
        signers.admin,
      ) as BBSubscriptions;

      //get test profile id
      profileId = await bbProfiles.callStatic.createProfile(signers.user.address, signers.user2.address, "testCid");
      // create test profile
      await expect(
        bbProfiles.connect(signers.admin).createProfile(signers.user.address, signers.user2.address, "testCid"),
      ).to.emit(bbProfiles, "NewProfile");

      prepaidGas = await bbSubscriptionsFactory.connect(signers.admin).getSubscriptionFee(erc20.address);

      tierSetId = await bbTiers
        .connect(signers.user)
        .callStatic.createTiers(
          profileId,
          [1, 5, 10],
          ["a", "b", "c"],
          [false, false, false],
          [erc20.address],
          [prepaidGas],
        );

      //create test tier
      await expect(
        bbTiers
          .connect(signers.user)
          .createTiers(profileId, [1, 5, 10], ["a", "b", "c"], [false, false, false], [erc20.address], [prepaidGas]),
      ).to.emit(bbTiers, "NewTierSet");

      const contribution = BigNumber.from("10");

      await expect(
        bbSubscriptionsFactory.connect(signers.user).createSubscriptionProfile(profileId, tierSetId, contribution),
      )
        .to.emit(bbSubscriptionsFactory, "NewSubscriptionProfile")
        .withArgs(profileId, tierSetId, contribution);

      await expect(
        await erc20.connect(signers.user2).approve(deployedSubscription.address, ethers.utils.parseEther("100")),
      ).to.not.be.reverted;

      await expect(
        deployedSubscription
          .connect(signers.user2)
          .subscribe(profileId, tierSetId, prepaidGas, { value: prepaidGas }),
      ).to.not.be.reverted;
    });

    describe("deployment and setup", function () {
      it("should correctly deploy subscriptions contract", async function () {
        expect(await bbSubscriptionsFactory.isSubscriptionsDeployed(erc20.address)).to.be.true;
      });
    });
    describe("subscribe()", function (){
      it.only("should subscribe to a deployed subscription", async function () {
        const expectedPrice = ethers.utils.parseEther("10");
        // const gas = await bbSubscriptionsFactory.getSubscriptionFee(erc20.address);
        console.log(await deployedSubscription.getSubscriptionFromProfile(profileId, tierSetId, signers.user2.address))
        // expect(await deployedSubscription.connect(signers.user2).subscribe(profileId, tierSetId, expectedPrice, {value: expectedPrice}))
      })
    })
    describe("performUpkeep()", function () {
      // it.only("should execute the performUpkeep Function", async function () {
      //   const renewalData = ethers.utils.defaultAbiCoder.encode(["uint256[] renewIndexes", "address refundReceiver"],[[1, 5, 10], signers.user.address])
      //   await expect(deployedSubscription.performUpkeep(renewalData)).to.not.be.reverted;
      // });
    });
  });
}
