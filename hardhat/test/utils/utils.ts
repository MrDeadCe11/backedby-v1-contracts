import { BigNumber, BigNumberish } from "ethers";
import { ethers } from "hardhat";




export async function getTimestamp(): Promise<number> {
  const blockNumber = await ethers.provider.send("eth_blockNumber", []);
  const block = await ethers.provider.send("eth_getBlockByNumber", [blockNumber, false]);
  return block.timestamp;
}

export const getDefaultSigners = async () => {
  const defaultSigners = await ethers.getSigners();
  return {
    admin: defaultSigners[0],
    user: defaultSigners[1],
    user2: defaultSigners[2],
  };
};
