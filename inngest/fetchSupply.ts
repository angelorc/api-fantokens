import { db } from "~~/db";
import { inngest } from "./client";
import { assets } from 'chain-registry/mainnet/bitsong/index.js'
import { fantokens } from "~~/db/schema";

const slugMap = {
  'ft4B030260D99E3ABE2B604EA2B33BAF3C085CDA12': 'luca-testa',
  'ft2D8E7041556CE93E1EFD66C07C45D551A6AAAE09': 'adam-clay',
  'ftD4B6290EDEE1EC7B97AB5A1DC6C177EFD08ADCC3': 'carolina-marquez',
  'ft25B30C386CDDEBD1413D5AE1180956AE9EB3B9F7': 'nicola-fasano',
  'ft575B10B0CEE2C164D9ED6A96313496F164A9607C': 'delta9',
  'ft7020C2A8E984EEBCBB383E91CD6FBB067BB2272B': 'vibranium',
  'ftE4903ECC861CA45F2C2BC7EAB8255D2E6E87A33A': 'rawanne',
  'ft52EEB0EE509AC546ED92EAC8591F731F213DDD16': 'blackjack',
  'ft56664FC98A2CF5F4FBAC3566D1A11D891AD88305': 'fonti',
  'ft24C9FA4F10B0F235F4A815B15FC774E046A2B2EB': 'puro-lobo',
  'ft2DD67F5D99E9A141142B48474FA7B6B3FF00A3FE': 'karina',
  'ft387C1C279D962ED80C09C1D592A92C4275FD7C5D': 'n43',
  'ft99091610CCC66F4277C66D14AF2BC4C5EE52E27A': '404-deep-records',
  'ft85AE1716C5E39EA6D64BBD7898C3899A7B500626': 'enmoda'
}

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
          const slug = slugMap[coin.denom];
          return {
            denom: coin.denom,
            symbol: _coin.symbol,
            name: _coin.name,
            decimals: 6,
            supply: parseInt(coin.amount),
            logo,
            slug: slug ?? undefined
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