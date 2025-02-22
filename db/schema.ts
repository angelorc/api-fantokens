import { pgTable } from "drizzle-orm/pg-core";
import { numeric } from "drizzle-orm/pg-core";
import { text, timestamp } from "drizzle-orm/pg-core";

export const prices_history = pgTable('prices_history', {
  time: timestamp({ withTimezone: true }).notNull(),
  denom: text('denom').notNull(),
  price: numeric('price'),
})
