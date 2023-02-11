import { ContractFactory } from "ethers";
import * as fs from "fs";
import { task } from "hardhat/config";

import treasuryLocalhost from "../deployments/BB-treasury-localhost.json";
import treasuryMumbai from "../deployments/BB-treasury-mumbai.json";
import treasuryPolygon from "../deployments/BB-treasury-polygon.json";
import erc20sLocalhost from "../deployments/erc20s-localhost.json";
import erc20sMumbai from "../deployments/erc20s-mumbai.json";
import erc20sPolygon from "../deployments/erc20s-polygon.json";


type Contracts = "BBProfiles" | "BBTiers" | "BBPosts" | "BBSubscriptionsFactory" | "BBSubscriptions";

task("deploy", "Deploy contracts and verify").setAction(async (_, { ethers }) => {
  const [admin] = await ethers.getSigners();
  let erc20s, treasury;

  if (hre.network.name == "polygon-mainnet") {
    erc20s = erc20sPolygon;
    treasury = treasuryPolygon;
  } else if (hre.network.name == "polygon-mumbai") {
    erc20s = erc20sMumbai;
    treasury = treasuryMumbai;
  } else {
    erc20s = erc20sLocalhost;
    treasury = treasuryLocalhost;
  }

  const contracts: Record<Contracts, ContractFactory> = {
    BBProfiles: await ethers.getContractFactory("BBProfiles", admin),
    BBTiers: await ethers.getContractFactory("BBTiers", admin),
    BBPosts: await ethers.getContractFactory("BBPosts", admin),
    BBSubscriptionsFactory: await ethers.getContractFactory("BBSubscriptionsFactory", admin),
    BBSubscriptions: await ethers.getContractFactory("BBSubscriptions", admin),
  };

  let deployments: Record<Contracts, string> = {
    BBProfiles: "",
    BBTiers: "",
    BBPosts: "",
    BBSubscriptionsFactory: "",
    BBSubscriptions: "",
  };



  const toFile = (path: string, deployment: Record<Contracts, string>) => {
    fs.writeFileSync(path, JSON.stringify(deployment), { encoding: "utf-8" });
  };

  for (const [name, contract] of Object.entries(contracts)) {

    const constructorArguments: Record<Contracts, string[]> = {
      BBProfiles: [],
      BBTiers: [deployments.BBProfiles],
      BBPosts: [deployments.BBProfiles],
      BBSubscriptionsFactory: [deployments.BBProfiles, deployments.BBTiers, treasury.Treasury],
      BBSubscriptions: [deployments.BBProfiles, deployments.BBTiers, deployments.BBSubscriptionsFactory, erc20s.DAI],
    };

    console.log(`Starting deployment of ${name}`);
    const factory = contract;

    const constructorArgs = Object.entries(constructorArguments).find((entry) => entry[0] === name)?.[1];
    console.log(`Constructor arguments: ${constructorArgs}`);

    const instance = constructorArgs ? await factory.deploy(...constructorArgs) : await factory.deploy();

    await instance.deployed();

    console.log(`${name} is deployed to address: ${instance.address}`);

    deployments[name as Contracts] = instance.address;
   
    toFile(`deployments/BB-${hre.network.name}.json`, deployments);
 
    if (hre.network.name !== ("localhost" || "hardhat")) {
      try {
        const code = await instance.instance?.provider.getCode(instance.address);
        if (code === "0x") {
          console.log(`${instance.name} contract deployment has not completed. waiting to verify...`);
          await instance.instance?.deployed();
        }

        await hre.run("verify:verify", {
          address: instance.address,
          constructorArguments: constructorArgs,
        });
      } catch ({ message }) {
        if ((message as string).includes("Reason: Already Verified")) {
          console.log("Reason: Already Verified");
        }
        console.error(message);
      }
    }
  }
});
