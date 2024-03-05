interface Pool {
  id: string;
  feeTier: string;
  totalValueLockedUSD: string;
  token0: string;
  token0Id: string;
  token1: string;
  token1Id: string;
  pair: string;
}

interface Pair {
  pairs: string;
  poolA: Pool;
  poolB: Pool;
  poolC: Pool;
}

interface Token {
  id: string;
  name: string;
  symbol: string;
  decimal: string;
}

interface Flow {
  pair: string;
  tokens: string[];
  fees: string[];
}

// 👇️ named export
export { Pool, Token, Pair, Flow };
