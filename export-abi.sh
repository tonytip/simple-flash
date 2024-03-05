#/bin/bash
npx hardhat clear-abi
npx hardhat export-abi
cp cache/abi/contracts/SimpleFlash.sol/SimpleFlash.json ./abi/