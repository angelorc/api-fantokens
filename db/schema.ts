import { pgTable, pgView } from "drizzle-orm/pg-core";
import { numeric } from "drizzle-orm/pg-core";
import { text, timestamp } from "drizzle-orm/pg-core";

export const prices_history = pgTable('prices_history', {
  time: timestamp({ withTimezone: true }).notNull(),
  denom: text('denom').notNull(),
  price: numeric('price'),
})

export const fantokens = pgTable('fantokens', {
  denom: text('denom').primaryKey().notNull(),
  symbol: text('symbol'),
  name: text('name').notNull(),
  decimals: numeric('decimals').notNull().$defaultFn(() => '6'),
  supply: numeric('supply').notNull().$defaultFn(() => '0'),
  logo: text('logo'),
  coingecko_id: text('coingecko_id'),
  slug: text('slug'),
})

export const prices = pgView('prices', {
  denom: text('denom'),
  last_price: numeric('last_price'),
  '1h_pct_change': numeric('1h_pct_change'),
  '1d_pct_change': numeric('1d_pct_change'),
  '7d_pct_change': numeric('7d_pct_change'),
  '30d_pct_change': numeric('30d_pct_change'),
}).existing()

export const one_hour_candle = pgView('one_hour_candle', {
  bucket: timestamp({ withTimezone: true }).notNull(),
  denom: text('denom').notNull(),
  open: numeric('open'),
  high: numeric('high'),
  low: numeric('low'),
  close: numeric('close'),
}).existing()

export const one_day_candle = pgView('one_day_candle', {
  bucket: timestamp({ withTimezone: true }).notNull(),
  denom: text('denom').notNull(),
  open: numeric('open'),
  high: numeric('high'),
  low: numeric('low'),
  close: numeric('close'),
}).existing()

export const one_week_candle = pgView('one_week_candle', {
  bucket: timestamp({ withTimezone: true }).notNull(),
  denom: text('denom').notNull(),
  open: numeric('open'),
  high: numeric('high'),
  low: numeric('low'),
  close: numeric('close'),
}).existing()

export const one_month_candle = pgView('one_month_candle', {
  bucket: timestamp({ withTimezone: true }).notNull(),
  denom: text('denom').notNull(),
  open: numeric('open'),
  high: numeric('high'),
  low: numeric('low'),
  close: numeric('close'),
}).existing()