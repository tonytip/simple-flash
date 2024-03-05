import hre from "hardhat";

const CONTRACT_DEPLOYED = require("../constants/contracts.json");

async function main() {
  const ContractName = "SimpleSwap";
  const ContractKey = "simple-swap";
  const Contract = await hre.ethers.getContractFactory(ContractName);

  const proxyAddress = CONTRACT_DEPLOYED[hre.network.name][ContractKey];

  console.log(`Upgrading the contract: ${proxyAddress} on ${hre.network.name}`);

  await hre.upgrades.prepareUpgrade(proxyAddress, Contract);

  const contract = await hre.upgrades.upgradeProxy(proxyAddress, Contract);

  await contract.deployed();

  const currentImplAddress = await hre.upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("New implementation address:", currentImplAddress);

  console.log(`Verifying contract ...`);

  await hre.run(`verify:verify`, {
    address: currentImplAddress,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
