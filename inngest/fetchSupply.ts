import { db } from "~~/db";
import { inngest } from "./client";
import { assets } from 'chain-registry/mainnet/bitsong'
import { fantokens } from "~~/db/schema";

export default inngest.createFunction(
  { 
    id: "fetch-supply",
    name: 'Fetch Supply',
    concurrency: 1,
  },
  { cron: "*/15 * * * *" },
  async ({ event, step }) => {
    const _fantokens = await step.run('fetch-fantokens', async () => {
      const supply = (await fetchBitsongSupply()).filter(coin => coin.denom.startsWith('ft'));

      return supply.map(coin => {
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
    })

    console.log(_fantokens);

    await step.run('save-fantokens', async () => {
      return await db.insert(fantokens)
        // @ts-ignore
        .values(_fantokens)
        .onConflictDoUpdate({
          target: fantokens.denom,
          set: {
            // @ts-ignore
            symbol: fantokens.symbol,
            name: fantokens.name,
            supply: fantokens.supply,
            logo: fantokens.logo
          }
        })
    })

    return {
      success: true
    };
  }
);