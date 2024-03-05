import { Pair, Pool, Flow } from "./interfaces";
import * as _ from "lodash";

function findPath(pair: Pair, start: string): Flow[] {
  let forward: Pool[] = [];
  let reserve: Pool[];
  if (inPool(pair.poolA, start)) {
    forward.push(pair.poolA);
    let next = nextToken(pair.poolA, start);
    if (inPool(pair.poolB, next)) {
      forward.push(pair.poolB);
      forward.push(pair.poolC);
    } else {
      forward.push(pair.poolC);
      forward.push(pair.poolB);
    }
  } else if (inPool(pair.poolB, start)) {
    forward.push(pair.poolB);
    let next = nextToken(pair.poolB, start);
    if (inPool(pair.poolC, next)) {
      forward.push(pair.poolC);
      forward.push(pair.poolA);
    } else {
      forward.push(pair.poolA);
      forward.push(pair.poolC);
    }
  } else {
    return [];
  }

  reserve = [forward[2], forward[1], forward[0]];

  return [extractFlow(forward, start), extractFlow(reserve, start)];
}

function extractFlow(pools: Pool[], start: string): Flow {
  let tokens: string[] = [];
  let fees: string[] = [];
  let next: string = start;
  let pair: string = start;

  for (let i = 0; i < pools.length; i++) {
    tokens.push(next == pools[i].token0 ? pools[i].token0Id : pools[i].token1Id);
    fees.push(pools[i].feeTier);
    next = nextToken(pools[i], next);
    if (next != "") {
      pair = pair + "-" + next;
    }
  }

  return { pair, tokens, fees };
}

function inPool(pool: Pool, token: string) {
  return pool.token0 == token || pool.token1 == token;
}
function nextToken(pool: Pool, start: string): string {
  if (pool.token0 == start) {
    return pool.token1;
  } else if (pool.token1 == start) {
    return pool.token0;
  }

  return "";
}

export { findPath };
