// IMPORTS
const { expect, assert } = require("chai");
const { ethers, upgrades } =  require("hardhat");
const { impersonateFundErc20 } = require("../utils/utilities");
const { findPath } = require("../scripts/libraries");

const { abi } = require("../artifacts/contracts/interfaces/IERC20.sol/IERC20.json");

const PAIRS = require("../constants/pairs.json");

const provider = ethers.provider;

describe("Token contract", () => {
  let SIMPLESWAP, BORROW_AMOUNT, FUND_AMOUNT, initialFundingHuman, txArbitrage, gasUsedUSD;

  const DECIMALS = 18;

  const ROUTER_V3 = "0x1b81D678ffb9C0263b24A97847620C99d213eB14";

  const USDT_WHALE = "0x4B16c5dE96EB2117bBE5fd171E4d203624B014aa";
  const TOKEN_A = "0x55d398326f99059ff775485246999027b3197955"; // USDT

  // Assume borrowing Token A
  const tokenBase = new ethers.Contract(TOKEN_A, abi, provider);

  beforeEach(async () => {
    // Get owner as signer
    [owner] = await ethers.getSigners();

    // Ensure Whale has balance
    const whale_balance = await provider.getBalance(USDT_WHALE);
    expect(whale_balance).not.equal("0");

    // Deploy smart contract
    const SimpleSwap = await ethers.getContractFactory("SimpleSwap");

    // @ts-ignore
    SIMPLESWAP = await upgrades.deployProxy(SimpleSwap, [ROUTER_V3], {
      kind: "uups",
    });

    // Configure Borrowing
    const borrowAmountHuman = "10000"; // borrow anything, even 1m
    BORROW_AMOUNT = ethers.utils.parseUnits(borrowAmountHuman, DECIMALS);

    // Configure Funding
    initialFundingHuman = "1000000"; // 100 assigned just to pass payback of loan whilst testing
    FUND_AMOUNT = ethers.utils.parseUnits(initialFundingHuman, DECIMALS);

    await impersonateFundErc20(tokenBase, USDT_WHALE, SIMPLESWAP.address, initialFundingHuman);
  });

  describe("Arbitrage execution", () => {
    it("ensures contract is funded", async () => {
      const simpleSwapBalance = await SIMPLESWAP.balanceOfToken(TOKEN_A);

      const simpleSwapBalanceHuman = ethers.utils.formatUnits(simpleSwapBalance, DECIMALS);
      expect(Number(simpleSwapBalanceHuman)).equal(Number(initialFundingHuman));
    });

    it("executes the arbitrage", async () => {
      for (let i = 0; i < 100; i++) {
        const pair = PAIRS[i];
        const paths = findPath(pair, "USDT");
        if (paths[0].tokens.length > 0) {
          console.log("Forward: " + paths[0].pair);
          txArbitrage = await SIMPLESWAP.swap(paths[0].tokens, paths[0].fees, BORROW_AMOUNT);
          assert(txArbitrage);
        }

        if (paths[1].tokens.length > 0) {
          console.log("Reserve: " + paths[1].pair);
          txArbitrage = await SIMPLESWAP.swap(paths[1].tokens, paths[1].fees, BORROW_AMOUNT);
          assert(txArbitrage);
        }
      }

      // TODO: need a way to calculate the amountOut for each run

    });

    // it("provides GAS output", async () => {
    //   const txReceipt = await provider.getTransactionReceipt(txArbitrage.hash);

    //   const effGasPrice = txReceipt.effectiveGasPrice;
    //   const txGasUsed = txReceipt.gasUsed;
    //   const gasUsedBNB = effGasPrice * txGasUsed;
    //   gasUsedUSD = ethers.utils.formatUnits(gasUsedBNB, 18) * 395; // USD to BNB price today

    //   console.log("Total Gas USD: " + gasUsedUSD);

    //   expect(gasUsedUSD).gte(0.1);
    // });
  });
});
