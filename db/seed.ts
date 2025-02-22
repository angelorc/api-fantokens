import { db } from '.'
import { prices_history } from './schema'

async function main() {
  console.log('Seeding the database...')

  const values = Array.from({ length: 10_000 }, (_, i) => {
    const date = new Date(Date.now() - 1_000 * 60 * 5 * i)
    const denom = ['BTC', 'ETH', 'LTC'][Math.floor(Math.random() * 3)]
    const price = Math.random() * 10_000
    return { time: date, denom, price }
  })

  await db.insert(prices_history).values(values)

  console.log('Seeding complete.')
  return process.exit(0)
}

main().catch(console.error)