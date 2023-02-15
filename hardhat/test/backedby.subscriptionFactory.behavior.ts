import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, Wallet } from "ethers";
import { ethers } from "hardhat";

import * as subscriptionsInterface from "../artifacts/contracts/BBSubscriptions.sol/BBSubscriptions.json";
// import { BBErrorCodesV01 } from "./../types/contracts/BBErrorsV01.sol/BBErrorCodesV01";
// import { BBPosts } from "./../types/contracts/BBPosts";
import { BBProfiles } from "./../types/contracts/BBProfiles";
import { BBSubscriptions } from "./../types/contracts/BBSubscriptions";
import { BBSubscriptionsFactory } from "./../types/contracts/BBSubscriptionsFactory";
import { BBTiers } from "./../types/contracts/BBTiers";
import { DebugERC20 } from "./../types/contracts/utils/DebugERC20";
import { DebugGasOracle } from "./../types/contracts/utils/DebugGasOracle";
import { deployBackedByFixture } from "./backby.fixture";
import { getDefaultSigners, getTimestamp } from "./utils/utils";

export async function shouldBehaveLikeBackedBySubscriptionFactory() {
  describe("Subscriptions Factory", function () {
    let signers: { [key: string]: SignerWithAddress };
    let treasury: Wallet;
    let erc20: DebugERC20;
    let bbProfiles: BBProfiles;
    let bbTiers: BBTiers;
    // let bbPosts: BBPosts;
    let bbSubscriptionsFactory: BBSubscriptionsFactory;
    let deployedSubscription: BBSubscriptions;
    // let bbErrors: BBErrorCodesV01;
    let gasOracle: DebugGasOracle;
    let profileId: BigNumber;
    let tierSetId: BigNumber;

    beforeEach("Set up test", async function () {
      signers = await getDefaultSigners();

      const {
        _treasury,
        _erc20,
        _gasOracle,
        _bbProfiles,
        _bbTiers,
        _bbPosts,
        _bbSubscriptionsFactory,
        _bbSubscriptions,
      } = await loadFixture(deployBackedByFixture);

      bbSubscriptionsFactory = _bbSubscriptionsFactory;
      treasury = _treasury;
      erc20 = _erc20;
      gasOracle = _gasOracle;
      bbTiers = _bbTiers;
      bbProfiles = _bbProfiles;
    });

    describe("Deployment and setup", function () {
      it("Should correctly deploy the Subscriptions Factory", async function () {
        expect(await bbSubscriptionsFactory.getTreasuryOwner()).to.eq(signers.admin.address);
        expect(await bbSubscriptionsFactory.getGasOracleOwner()).to.eq(signers.admin.address);
        expect(await bbSubscriptionsFactory.getSubscriptionFeeOwner()).to.eq(signers.admin.address);
        expect(await bbSubscriptionsFactory.getTreasury()).to.eq(treasury.address);
        expect(await bbSubscriptionsFactory.getGasOracle()).to.eq(ethers.constants.AddressZero);
        expect((await bbSubscriptionsFactory.getContributionBounds()).toString()).to.be.eq("1,100");
        expect(await bbSubscriptionsFactory.getGracePeriod()).to.eq("172800");
      });

      describe("#deploySubscriptions()", function () {
        it("deploySubscriptions should succeed", async function () {
          //get subscription address
          const subscriptionAddress = await bbSubscriptionsFactory.callStatic.deploySubscriptions(erc20.address);
          //check for correct deployment
          await expect(bbSubscriptionsFactory.deploySubscriptions(erc20.address))
            .to.emit(bbSubscriptionsFactory, "DeployedSubscription")
            .withArgs(erc20.address, subscriptionAddress);
        });

        it("deploySubscriptions should revert if subscription is already deployed", async function () {
          //get subscription address
          const subscriptionAddress = await bbSubscriptionsFactory.callStatic.deploySubscriptions(erc20.address);
          //check for correct deployment
          await expect(bbSubscriptionsFactory.deploySubscriptions(erc20.address))
            .to.emit(bbSubscriptionsFactory, "DeployedSubscription")
            .withArgs(erc20.address, subscriptionAddress);
          //check for reversion
          await expect(bbSubscriptionsFactory.deploySubscriptions(erc20.address)).to.be.revertedWith("9");
        });
      });

      describe("#isSubscriptionDeployed()", function () {
        it("isSubscriptionDeployed should return false when subscription is not deployed", async function () {
          expect(await bbSubscriptionsFactory.isSubscriptionsDeployed(erc20.address)).to.be.false;
        });

        it("isSubscriptionDeployed should return true when subscription is deployed", async function () {
          //deploy subscriptions
          await bbSubscriptionsFactory.deploySubscriptions(erc20.address);
          //check subscription deployment
          expect(await bbSubscriptionsFactory.isSubscriptionsDeployed(erc20.address)).to.be.true;
        });
      });

      describe("#setSubscriptionFeeOwner()", function () {
        it("setSubscriptionFeeOwner should succeed", async function () {
          await expect(bbSubscriptionsFactory.connect(signers.admin).setSubscriptionFeeOwner(signers.user.address)).to
            .not.be.reverted;
          expect(await bbSubscriptionsFactory.getSubscriptionFeeOwner()).to.eq(signers.user.address);
        });

        it("setSubscriptionFeeOwner should revert if called by wrong EOA", async function () {
          return await expect(
            bbSubscriptionsFactory.connect(signers.user2).setSubscriptionFeeOwner(signers.user2.address),
          ).to.be.revertedWith("1");
        });
      });

      describe("#setGasOracleOwner()", function () {
        it("setGasOracleOwner should succeed", async function () {
          await expect(bbSubscriptionsFactory.connect(signers.admin).setGasOracleOwner(signers.user.address)).to.not.be
            .reverted;
          expect(await bbSubscriptionsFactory.getGasOracleOwner()).to.eq(signers.user.address);
        });

        it("setGasOracleOwner should revert if called by wrong EOA", async function () {
          await expect(
            bbSubscriptionsFactory.connect(signers.user2).setGasOracleOwner(signers.user2.address),
          ).to.be.revertedWith("1");
        });
      });

      describe("#setTreasuryOwner()", function () {
        it("setTreasuryOwner should succeed", async function () {
          await expect(bbSubscriptionsFactory.connect(signers.admin).setTreasuryOwner(signers.user.address)).to.not.be
            .reverted;
          expect(await bbSubscriptionsFactory.getTreasuryOwner()).to.eq(signers.user.address);
        });

        it("setTreasuryOwner should revert if called by wrong EOA", async function () {
          await expect(
            bbSubscriptionsFactory.connect(signers.user2).setTreasuryOwner(signers.user2.address),
          ).to.be.revertedWith("1");
        });
      });

      describe("#setTreasury()", function () {
        it("setTreasury should succeed", async function () {
          await expect(bbSubscriptionsFactory.connect(signers.admin).setTreasury(signers.user.address)).to.not.be
            .reverted;
          expect(await bbSubscriptionsFactory.getTreasury()).to.eq(signers.user.address);
        });

        it("setTreasury should revert if called by wrong EOA", async function () {
          await expect(
            bbSubscriptionsFactory.connect(signers.user2).setTreasury(signers.user2.address),
          ).to.be.revertedWith("1");
        });
      });

      describe("#setGasOracle()", function () {
        it("setGasOracle should succeed", async function () {
          await expect(bbSubscriptionsFactory.setGasOracle(gasOracle.address)).to.not.be.reverted;
          expect(await bbSubscriptionsFactory.getGasOracle()).to.eq(gasOracle.address);
        });

        it("setGasOracle should revert if called by wrong EOA", async function () {
          await expect(bbSubscriptionsFactory.connect(signers.user).setGasOracle(gasOracle.address)).to.be.revertedWith(
            "1",
          );
        });
      });
    });

    describe("Functions", function () {
      let prepaidGas: BigNumber;
      beforeEach("Set up function tests", async function () {
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
      });

      describe("#getSubscriptionFee()", function () {
        it("getSubscriptionFee should return correct fee", async function () {
          expect(await bbSubscriptionsFactory.connect(signers.admin).getSubscriptionFee(erc20.address)).to.eq(
            ethers.utils.parseUnits("13500000", "wei").mul(await gasOracle.getGasPrice()),
          );
        });

        it("setSubscriptionFee should succeed", async function () {
          await expect(
            bbSubscriptionsFactory
              .connect(signers.admin)
              .setSubscriptionFee(erc20.address, ethers.utils.parseEther("1")),
          ).to.not.be.reverted;

          expect(await bbSubscriptionsFactory.connect(signers.admin).getSubscriptionFee(erc20.address)).to.eq(
            ethers.utils.parseEther("1").mul(await gasOracle.getGasPrice()),
          );
        });

        it("setSubscriptionFee should revert if called by wrong EOA", async function () {
          await expect(
            bbSubscriptionsFactory
              .connect(signers.user2)
              .setSubscriptionFee(erc20.address, ethers.utils.parseEther("1")),
          ).to.be.revertedWith("1");
        });

        it("getSubscriptionFee should revert on unsupported currency.", async function () {
          await expect(
            bbSubscriptionsFactory.connect(signers.admin).getSubscriptionFee(signers.user.address),
          ).to.be.revertedWith("18");
        });
      });

      describe("#createSubscriptionProfile()", function () {
        it("createSubscriptionProfile should succeed with correct params", async function () {
          const contribution = BigNumber.from("10");
          await expect(
            bbSubscriptionsFactory.connect(signers.user).createSubscriptionProfile(profileId, tierSetId, contribution),
          )
            .to.emit(bbSubscriptionsFactory, "NewSubscriptionProfile")
            .withArgs(profileId, tierSetId, contribution);
        });

        it("createSubscriptionProfile should revert when called from invalid EOA", async function () {
          const contribution = BigNumber.from("10");
          await expect(
            bbSubscriptionsFactory.connect(signers.user2).createSubscriptionProfile(profileId, tierSetId, contribution),
          ).to.be.revertedWith("1");
        });

        it("createSubscriptionProfile should revert when profile already exists.", async function () {
          const contribution = BigNumber.from("10");
          await expect(
            bbSubscriptionsFactory.connect(signers.user).createSubscriptionProfile(profileId, tierSetId, contribution),
          )
            .to.emit(bbSubscriptionsFactory, "NewSubscriptionProfile")
            .withArgs(profileId, tierSetId, contribution);

          await expect(
            bbSubscriptionsFactory.connect(signers.user).createSubscriptionProfile(profileId, tierSetId, contribution),
          ).to.be.revertedWith("19");
        });

        it("createSubscriptionProfile should revert with out of bounds contribution(high)", async function () {
          const contribution = BigNumber.from("1000");

          await expect(
            bbSubscriptionsFactory.connect(signers.user).createSubscriptionProfile(profileId, tierSetId, contribution),
          ).to.be.revertedWith("2");
        });

        it("createSubscriptionProfile should revert with out of bounds contribution(low)", async function () {
          const contribution = BigNumber.from("0");

          await expect(
            bbSubscriptionsFactory.connect(signers.user).createSubscriptionProfile(profileId, tierSetId, contribution),
          ).to.be.revertedWith("2");
        });

        it("createSubscriptionProfile should revert with invalid profile id", async function () {
          const contribution = BigNumber.from("1000");
          const invalidProfileId = BigNumber.from("42");
          await expect(
            bbSubscriptionsFactory
              .connect(signers.user)
              .createSubscriptionProfile(invalidProfileId, tierSetId, contribution),
          ).to.be.revertedWith("5");
        });
      });
      
      describe("#setContribution", function () {

        it("setContribution should succeed", async function () {
          const newContribution = BigNumber.from("2");
          await expect( bbSubscriptionsFactory.connect(signers.user).setContribution(profileId, newContribution)).to.emit(bbSubscriptionsFactory, "EditContribution").withArgs(profileId, newContribution);
        });

        it("setContribution should revert when called by non profile owner", async function () {
          const newContribution = BigNumber.from("2");
          await expect( bbSubscriptionsFactory.connect(signers.user2).setContribution(profileId, newContribution)).to.be.rejectedWith("1");
        });

        it("setContribution should revert when called with out of bounds contribution", async function () {
          const newContribution = BigNumber.from("0");
          await expect( bbSubscriptionsFactory.connect(signers.user).setContribution(profileId, newContribution)).to.be.rejectedWith("2");
        });
      });

      describe("#isSubscriptionActve()", function () {
        beforeEach("subscribe to a deployed subscription", async function () {
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
              .subscribe(profileId, tierSetId, prepaidGas, { value: ethers.utils.parseEther(".5") }),
          ).to.not.be.reverted;
        });

        it("isSubscriptionActive should return true with active subscription", async function () {
          expect(await bbSubscriptionsFactory.isSubscriptionActive(profileId, tierSetId, signers.user.address)).to.be
            .true;
        });

        it("isSubscriptionActive should revert with invalid profile", async function () {
          const invalidProfileId = BigNumber.from("42");
          await expect(
            bbSubscriptionsFactory.isSubscriptionActive(invalidProfileId, tierSetId, signers.user.address),
          ).to.be.revertedWith("5");
        });

        it("isSubscriptionActive should return false after grace period", async function () {
          const timestamp = await getTimestamp();
          //mine past grace period
          await ethers.provider.send("evm_mine", [timestamp + 1728010]);
          expect(await bbSubscriptionsFactory.isSubscriptionActive(profileId, tierSetId, signers.user2.address)).to.be
            .false;
        });

        it("isSubscriptionActive should return true with owner as contract", async function () {
          const ownerContractFactory = await ethers.getContractFactory("DebugProfileOwner", signers.admin);
          const ownerContract = await ownerContractFactory.deploy();
          // set owner
          await ownerContract.setOwner(signers.user.address, true);

          // create owner contract profile
          const newProfile = await bbProfiles.callStatic.createProfile(
            ownerContract.address,
            signers.user.address,
            "testtest",
          );
          await bbProfiles.createProfile(ownerContract.address, signers.user.address, "testtest");

          expect(await bbSubscriptionsFactory.isSubscriptionActive(newProfile, tierSetId, signers.user.address)).to.be
            .true;
        });
      });
    });

    describe("another test", function () {
      it("should be a test", async function () {
        expect(true).to.be.true;
      });
    });
  });
}
