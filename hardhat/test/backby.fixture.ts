import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Wallet } from "ethers";
import { ethers } from "hardhat";

import { BBPosts } from "./../types/contracts/BBPosts";
import { BBProfiles } from "./../types/contracts/BBProfiles";
import { BBSubscriptions } from "./../types/contracts/BBSubscriptions";
import { BBSubscriptionsFactory } from "./../types/contracts/BBSubscriptionsFactory";
import { BBTiers } from "./../types/contracts/BBTiers";
import { DebugERC20 } from "./../types/contracts/utils/DebugERC20";
import { getDefaultSigners } from "./utils/utils";

export async function deployBackedByFixture() {
  const signers: { [key: string]: SignerWithAddress } = await getDefaultSigners();

  //create a treasury wallet for tests.
  const treasury: Wallet = ethers.Wallet.createRandom();

  //deploy test Erc20
  const ERC20Factory = await ethers.getContractFactory("ERC20", signers.admin);
  const erc20: DebugERC20 = (await ERC20Factory.deploy("testToken", "TT")) as DebugERC20;

  //deploy bbProfiles
  const bbProfilesFactory = await ethers.getContractFactory("BBProfiles", signers.admin);
  const bbProfiles: BBProfiles = (await bbProfilesFactory.deploy()) as BBProfiles;

  //deploy bb tiers
  const bbTiersFactory = await ethers.getContractFactory("bbTiers", signers.admin);
  const bbTiers: BBTiers = (await bbTiersFactory.deploy(bbProfiles.address)) as BBTiers;

  // deploy bbPost
  const bbPostsFactory = await ethers.getContractFactory("BBPosts", signers.admin);
  const bbPosts: BBPosts = (await bbPostsFactory.deploy(bbProfiles.address)) as BBPosts;

  // deploy bbSubscriptionsFactory
  const bbSubscriptionsFactoryFactory = await ethers.getContractFactory("BBSubscriptionsFactory", signers.admin);
  const bbSubscriptionsFactory: BBSubscriptionsFactory = (await bbSubscriptionsFactoryFactory.deploy(
    bbProfiles.address,
    bbTiers.address,
    treasury.address,
  )) as BBSubscriptionsFactory;

  //deploy bbSubscriptions
  const bbSubscriptionFactory = await ethers.getContractFactory("BBSubscriptions", signers.admin);
  const bbSubscriptions: BBSubscriptions = (await bbSubscriptionFactory.deploy(
    bbProfiles.address,
    bbTiers.address,
    bbSubscriptionsFactory.address,
    erc20.address,
  )) as BBSubscriptions;

  return { treasury, erc20, bbProfiles, bbTiers, bbPosts, bbSubscriptionsFactory, bbSubscriptions };
}
