CREATE TABLE "fantokens" (
	"denom" text PRIMARY KEY NOT NULL,
	"symbol" text,
	"name" text NOT NULL,
	"decimals" numeric NOT NULL,
	"supply" numeric NOT NULL,
	"logo" text,
	"coingecko_id" text,
	"slug" text
);
--> statement-breakpoint
CREATE TABLE "prices_history" (
	"time" timestamp with time zone NOT NULL,
	"denom" text NOT NULL,
	"price" numeric
);
