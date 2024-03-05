import hre from "hardhat";
import fs from "fs";

const CONTRACT_DEPLOYED = require("../constants/contracts.json");

async function main() {
  const ContractName = "SimpleSwap";
  const ContractKey = "simple-swap";
  const ContractFactory = await hre.ethers.getContractFactory(ContractName);
  const SWAP_ROUTER = CONTRACT_DEPLOYED[hre.network.name]["swap-router"];

  const initdata = [SWAP_ROUTER];

  const contract = await hre.upgrades.deployProxy(ContractFactory, initdata, {
    kind: "uups",
  });
  await contract.deployed();
  console.log(`${ContractName} deployed to: ${contract.address}`);

  CONTRACT_DEPLOYED[hre.network.name][ContractKey] = contract.address;

  console.log(`Update contract list...`);
  await fs.writeFileSync("./constants/contracts.json", JSON.stringify(CONTRACT_DEPLOYED, null, 4));

  console.log(`Verifying contract ...`);
  await hre.run(`verify:verify`, {
    address: contract.address,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
