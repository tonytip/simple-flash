import hre from "hardhat";

const provider = new hre.ethers.providers.JsonRpcProvider(hre.network.config.url);

// @ts-ignore
const signer = new hre.ethers.Wallet(hre.network.config.accounts[0]).connect(provider);

export function getContractInstance(contractName: string, abi: string) {
  const contract = new hre.ethers.Contract(contractName, abi);
  const instance = contract.connect(signer);
  return instance;
}
