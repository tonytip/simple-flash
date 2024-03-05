import fs from "fs";
import { Pair, Pool, Flow } from "./interfaces";

const POOLS = require("../constants/pools.json");

async function getPairs() {
  let foundPairs = [];
  for (let i = 0; i < POOLS.length - 2; i++) {
    const poolA = POOLS[i];

    let listTokens = [poolA.token0Id, poolA.token1Id];

    for (let j = i + 1; j < POOLS.length - 1; j++) {
      const poolB = POOLS[j];
      if (checkNotSamePool(poolA, poolB) && (listTokens.includes(poolB.token0Id) || listTokens.includes(poolB.token1Id))) {
        listTokens.push(poolB.token0Id);
        listTokens.push(poolB.token1Id);

        for (let k = j + 1; k < POOLS.length; k++) {
          const poolC = POOLS[k];
          if (checkNotSamePool(poolA, poolC) && checkNotSamePool(poolB, poolC) && listTokens.includes(poolC.token0Id) && listTokens.includes(poolC.token1Id)) {
            let tokens = [poolA.token0Id, poolA.token1Id, poolB.token0Id, poolB.token1Id, poolC.token0Id, poolC.token1Id];
            let pairs = [poolA.pair, poolB.pair, poolC.pair].join("-");
            console.log(`Found pairs: ${pairs}`);
            foundPairs.push({
              "pairs": pairs,
              "poolA": poolA,
              "poolB": poolB,
              "poolC": poolC,
            });
            console.log(`Found ${foundPairs.length} pairs`);
          }
        }

        listTokens.pop();
        listTokens.pop();
      }
    }
  }

  await fs.writeFileSync("./constants/pairs.json", JSON.stringify(foundPairs, null, 4));
}

function checkNotSamePool(poolA: Pool, poolB: Pool) {
  if (poolA.token0Id == poolB.token0Id && poolA.token1Id == poolB.token1Id) {
    return false;
  }
  if (poolA.token0Id == poolB.token1Id && poolA.token1Id == poolB.token0Id) {
    return false;
  }
  return true;
}

async function main() {
  await getPairs();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
