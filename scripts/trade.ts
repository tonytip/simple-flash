import hre from "hardhat";
import fs from "fs";
import * as _ from "lodash";
import moment from 'moment'
const { findPath } = require("./libraries");
import { Pair, Pool, Flow } from "./interfaces";
import { getContractInstance } from "./contract-instance";
import { SimpleSwap } from "../typechain-types";


const CONTRACT_DEPLOYED = require("../constants/contracts.json");
const PAIRS = require("../constants/pairs.json");
const simpleSwapAddress = CONTRACT_DEPLOYED[hre.network.name]["simple-swap"];
const abi = require("./../abi/SimpleSwap.json");

const instance = getContractInstance(simpleSwapAddress, abi) as SimpleSwap;

async function main() {
  console.log("Start finding...");
  let start = moment();
  const TRADE_AMOUNT = hre.ethers.utils.parseUnits("100", 18).toString();
  for (let i = 0; i < PAIRS.length; i++) {
    let pool = PAIRS[i];
    // console.log("--------", pool.pairs, "----------");
    let paths = findPath(pool, "USDT");
    if (paths.length == 2) {
      await tradeStatic(paths[0], TRADE_AMOUNT);
      await tradeStatic(paths[1], TRADE_AMOUNT);
    }
  }
  let end = moment();
  console.log("Done in " + end.diff(start, "seconds") + " seconds");
  console.log("Wait for 5 minutes...");
  await new Promise((resolve) => setTimeout(resolve, 5*60*1000));
}

async function tradeStatic(flow: Flow, amount: string) {
    try {
        await instance.callStatic.swap(flow.tokens, flow.fees, amount);
        console.log("Seem to have profit...", flow.pair);
        tradeReal(flow, amount);
      } catch (error) {
        if (error.reason == "NP") {
        //   console.log("Not profit");
        } else {
        //   console.log("REVERT: " + error.reason);
        }
      }
}

async function tradeReal(flow: Flow, amount: string) {
    try {
        console.log("Process real trade...", flow.pair);
        const tx = await instance.swap(flow.tokens, flow.fees, amount);
        console.log("REAL: Done...", tx.hash);
        // console.log(tx);
      } catch (error) {
        if (error.reason == "NP") {
          console.log("Not profit");
        } else {
          console.log("REVERT: " + error.reason);
        }
      }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
