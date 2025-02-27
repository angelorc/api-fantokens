import { logger, schedules } from "@trigger.dev/sdk/v3";
import { db } from "~~/db";
import { fetchBitsongSupply } from "~/utils";
import { assets } from 'chain-registry/mainnet/bitsong'
import { fantokens } from "~~/db/schema";

export const fetchSupplyTask = schedules.task({
  id: "fetch-supply",
  cron: "*/1 * * * *",
  maxDuration: 20,
  queue: {
    concurrencyLimit: 1
  },
  retry: {
    maxAttempts: 4,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
    factor: 1.8,
    randomize: false,
  },
  run: async (payload, { ctx }) => {
    logger.log("Running supply ingestion task");

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

    logger.log('End supply ingestion task');

    return { result: "Success" };
  },
});