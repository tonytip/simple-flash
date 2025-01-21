import { ethers } from "hardhat";
import { request, gql } from "graphql-request";
import fs from "fs";

import {Pool} from './interfaces';

const POOLS = require("../constants/pools.json");

const endpoint = "https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-bsc";
const totalPools = 21234;
async function main() {
  await getPools();
}

async function getPools() {
  const document = gql`
    query getPools ($first: Int, $skip: Int) {
        pools(orderBy: totalValueLockedUSD, orderDirection: desc, first: $first, skip: $skip, where: {totalValueLockedUSDUntracked_gt: "20000"}) {
          id
          totalValueLockedUSD
          feeTier
          token0 {
            id
            symbol
            name
            decimals
          }
          token1 {
            id
            symbol
            name
            decimals
          }
        }
    }
  `;

  let tokens = {};
  let pools: Pool[] = [];
  let downloaded = 0;
  while (downloaded < 6000 ) {
    const data = await request(endpoint, document, { first: 1000, skip: downloaded });
    if (data.pools.length == 0) {
      console.log("Done");
      break;
    }
    data.pools.forEach((pool) => {
      pools.push({
        id: pool.id,
        feeTier: pool.feeTier,
        totalValueLockedUSD: pool.totalValueLockedUSD,
        token0: pool.token0.symbol,
        token0Id: pool.token0.id,
        token1: pool.token1.symbol,
        token1Id: pool.token1.id,
        pair: pool.token0.symbol + "_" + pool.token1.symbol
      });
      if (!tokens.hasOwnProperty(pool.token0.symbol)) {
        tokens[pool.token0.id] = {
          symbol: pool.token0.symbol,
          name: pool.token0.name,
          decimal: pool.token0.decimals,
          id: pool.token0.id,
        };
      }
      if (!tokens.hasOwnProperty(pool.token1.symbol)) {
        tokens[pool.token1.id] = {
          symbol: pool.token1.symbol,
          name: pool.token1.name,
          decimal: pool.token1.decimals,
          id: pool.token1.id,
        };
      }
    });
    downloaded += data.pools.length;
    console.log("Downloaded:", data.pools.length, ", Total: ", downloaded);
  }

  await fs.writeFileSync("./constants/pools.json", JSON.stringify(pools, null, 4));
  await fs.writeFileSync("./constants/tokens.json", JSON.stringify(tokens, null, 4));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
