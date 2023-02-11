import { task } from "hardhat/config";
import BB_Polygon_MAINNET from "../deployments/BB-polygon-mainnet.json";
import BB_Polygon_MUMBAI from "../deployments/BB-polygon-mumbai.json"; 
import BB_LOCALHOST from "../deployments/BB-localhost.json";  
import treasuryLocalhost from "../deployments/BB-treasury-localhost.json";
import treasuryMumbai from "../deployments/BB-treasury-mumbai.json";
import treasuryPolygon from "../deployments/BB-treasury-polygon.json";
import erc20sLocalhost from "../deployments/erc20s-localhost.json";
import erc20sMumbai from "../deployments/erc20s-mumbai.json";
import erc20sPolygon from "../deployments/erc20s-polygon.json";


type Contracts = "BBProfiles" | "BBTiers" | "BBPosts" | "BBSubscriptionsFactory" | "BBSubscriptions";

task("verifyContract", "verify").setAction(async (_, { ethers }) => {
  const [admin] = await ethers.getSigners();
  let addresses, erc20s, treasury;

  if (hre.network.name == "polygon-mainnet") {
    addresses = BB_Polygon_MAINNET
    erc20s = erc20sPolygon;
    treasury = treasuryPolygon;
  } else if (hre.network.name == "polygon-mumbai") {
    addresses = BB_Polygon_MUMBAI
    erc20s = erc20sMumbai;
    treasury = treasuryMumbai;
  } else {
    addresses = BB_LOCALHOST
    erc20s = erc20sLocalhost;
    treasury = treasuryLocalhost;
  }

  const contracts: Record<Contracts, string> = {
    BBProfiles: addresses.BBProfiles,
    BBTiers: addresses.BBTiers,
    BBPosts: addresses.BBPosts,
    BBSubscriptionsFactory: addresses.BBSubscriptionsFactory,
    BBSubscriptions: addresses.BBSubscriptions
  };

  for (const [name, address] of Object.entries(contracts)) {

    const constructorArguments: Record<Contracts, string[]> = {
      BBProfiles: [],
      BBTiers: [addresses.BBProfiles],
      BBPosts: [addresses.BBProfiles],
      BBSubscriptionsFactory: [addresses.BBProfiles, addresses.BBTiers, treasury.Treasury],
      BBSubscriptions: [addresses.BBProfiles, addresses.BBTiers, addresses.BBSubscriptionsFactory, erc20s.DAI],
    };

    console.log(`Starting verification of ${name}`);   

    const constructorArgs = Object.entries(constructorArguments).find((entry) => entry[0] === name)?.[1];
    console.log(`Constructor arguments: ${constructorArgs}`);

    console.log(`${name} is deployed to address: ${address}`);
    
    if (hre.network.name !== ("localhost" || "hardhat")) {
      try {
        const code = await ethers.provider.getCode(address);
        if (code === "0x") {
          console.log(`${name} contract deployment has not completed. waiting to verify...`);
        }

        await hre.run("verify:verify", {
          address: address,
          contract: `contracts/${name}.sol:${name}`,
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
