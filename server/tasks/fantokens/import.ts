import {
  fetchBitsongSupply,
  fetchCoingeckoPrice,
  fetchPools,
  getPoolByDenom,
  getPriceFromPool
} from "~/utils";
import { db } from "~~/db";
import { fantokens } from "~~/db/schema";
import { assets } from 'chain-registry/mainnet/bitsong'

export default defineTask({
  meta: {
    name: "fantokens:import",
    description: "Sync fantokens from bitsong supply",
  },
  async run({ payload, context }) {
    console.log("Syncing fantokens from bitsong supply");

    let supply = (await fetchBitsongSupply()).filter(coin => coin.denom.startsWith('ft'));

    const enrichedFantokens = supply.map(coin => {
      const _coin = assets.assets.find(c => c.base === coin.denom);
      if (_coin) {
        const logo = _coin.images?.find(i => i.png)?.png;
        return {
          denom: coin.denom,
          symbol: _coin.symbol,
          name: _coin.name,
          decimals: 6,
          supply: parseInt(coin.amount),
          logo
        }
      }

      return {
        denom: coin.denom,
        symbol: coin.denom,
        name: coin.denom,
        decimals: 6,
        supply: parseInt(coin.amount)
      }
    });

    await db.insert(fantokens)
      .values(enrichedFantokens)
      .onConflictDoUpdate({
        target: fantokens.denom,
        set: {
          symbol: fantokens.symbol,
          name: fantokens.name,
          supply: fantokens.supply,
          logo: fantokens.logo
        }
      })

    console.log('End syncing fantokens');

    return { result: 'success' };
  },
});