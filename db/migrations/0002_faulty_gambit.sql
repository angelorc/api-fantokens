CREATE TABLE "fantokens" (
	"denom" text PRIMARY KEY NOT NULL,
	"symbol" text,
	"name" text NOT NULL,
	"decimals" numeric NOT NULL,
	"supply" numeric NOT NULL
);
