# Simple Flash

This simple project is to detect arbitrage oppertunities on BNB chain and try to use flash loan as the initial fund to do the arbitrage.
It implements triangle arbitrage method, swap from A -> B -> C -> A.
To do that, it will try to get all pools in Uniswap and PancakeSwap and try to build a working flow (A -> B -> C -> A).
To check if that flow is benefit, it will try to run on a forking network from real BNB mainnet.


## Steps

### Build flows
```
npx hardhat run scripts/get-pools.ts --network bsc
```