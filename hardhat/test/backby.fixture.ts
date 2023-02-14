import { BBErrorCodesV01 } from './../types/contracts/BBErrorsV01.sol/BBErrorCodesV01';
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Wallet } from "ethers";
import { ethers } from "hardhat";

import { BBPosts } from "./../types/contracts/BBPosts";
import { BBProfiles } from "./../types/contracts/BBProfiles";
import { BBSubscriptions } from "./../types/contracts/BBSubscriptions";
import { BBSubscriptionsFactory } from "./../types/contracts/BBSubscriptionsFactory";
import { BBTiers } from "./../types/contracts/BBTiers";
import { DebugERC20 } from "./../types/contracts/utils/DebugERC20";
import { DebugGasOracle } from "./../types/contracts/utils/DebugGasOracle";
import { getDefaultSigners } from "./utils/utils";

export async function deployBackedByFixture() {
  const signers: { [key: string]: SignerWithAddress } = await getDefaultSigners();

  //create a treasury wallet for tests.
  const _treasury: Wallet = ethers.Wallet.createRandom();

  //deploy test Erc20
  const ERC20Factory = await ethers.getContractFactory("DebugERC20", signers.admin);
  const _erc20: DebugERC20 = (await ERC20Factory.deploy("testToken", "TT")) as DebugERC20;

  //deploy test gas oracle
  const GasOracleFactory = await ethers.getContractFactory("DebugGasOracle", signers.admin);
  const _gasOracle: DebugGasOracle = (await GasOracleFactory.deploy()) as DebugGasOracle;

  //deploy bbProfiles
  const bbProfilesFactory = await ethers.getContractFactory("BBProfiles", signers.admin);
  const _bbProfiles: BBProfiles = (await bbProfilesFactory.deploy()) as BBProfiles;

  //deploy bb tiers
  const bbTiersFactory = await ethers.getContractFactory("BBTiers", signers.admin);
  const _bbTiers: BBTiers = (await bbTiersFactory.deploy(_bbProfiles.address)) as BBTiers;

  // deploy bbPost
  const bbPostsFactory = await ethers.getContractFactory("BBPosts", signers.admin);
  const _bbPosts: BBPosts = (await bbPostsFactory.deploy(_bbProfiles.address)) as BBPosts;

  // deploy bbSubscriptionsFactory
  const bbSubscriptionsFactoryFactory = await ethers.getContractFactory("BBSubscriptionsFactory", signers.admin);
  const _bbSubscriptionsFactory: BBSubscriptionsFactory = (await bbSubscriptionsFactoryFactory.deploy(
    _bbProfiles.address,
    _bbTiers.address,
    _treasury.address,
  )) as BBSubscriptionsFactory;

  //deploy bbSubscriptions
  const bbSubscriptionFactory = await ethers.getContractFactory("BBSubscriptions", signers.admin);
  const _bbSubscriptions: BBSubscriptions = (await bbSubscriptionFactory.deploy(
    _bbProfiles.address,
    _bbTiers.address,
    _bbSubscriptionsFactory.address,
    _erc20.address,
  )) as BBSubscriptions;

  return { _treasury, _erc20, _gasOracle, _bbProfiles, _bbTiers, _bbPosts, _bbSubscriptionsFactory, _bbSubscriptions };
}
