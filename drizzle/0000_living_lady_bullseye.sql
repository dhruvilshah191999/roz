CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"code" text NOT NULL,
	"display_name" text NOT NULL,
	"pin_hash" text,
	"pin_failed" integer DEFAULT 0 NOT NULL,
	"pin_locked_until" timestamp with time zone,
	"balance" integer DEFAULT 0 NOT NULL,
	"lifetime_earned" integer DEFAULT 0 NOT NULL,
	"streak" integer DEFAULT 0 NOT NULL,
	"best_streak" integer DEFAULT 0 NOT NULL,
	"last_full_day" date,
	"shield_week" text,
	"name_prompted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "accounts_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "daily_puzzles" (
	"day" date NOT NULL,
	"game" text NOT NULL,
	"puzzle" jsonb NOT NULL,
	CONSTRAINT "daily_puzzles_day_game_pk" PRIMARY KEY("day","game")
);
--> statement-breakpoint
CREATE TABLE "daily_results" (
	"account_id" uuid NOT NULL,
	"day" date NOT NULL,
	"game" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"solved_at" timestamp with time zone,
	"elapsed_ms" integer,
	"moves" integer,
	"hints_used" integer DEFAULT 0 NOT NULL,
	"under_par" boolean DEFAULT false NOT NULL,
	CONSTRAINT "daily_results_account_id_day_game_pk" PRIMARY KEY("account_id","day","game")
);
--> statement-breakpoint
CREATE TABLE "ledger" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"account_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"reason" text NOT NULL,
	"ref_day" date,
	"ref_game" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"tier_coins" integer NOT NULL,
	"rupees" integer NOT NULL,
	"brand" text NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_results" ADD CONSTRAINT "daily_results_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger" ADD CONSTRAINT "ledger_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "daily_results_day_game_idx" ON "daily_results" USING btree ("day","game");--> statement-breakpoint
CREATE INDEX "daily_results_account_day_idx" ON "daily_results" USING btree ("account_id","day");--> statement-breakpoint
CREATE INDEX "ledger_account_created_idx" ON "ledger" USING btree ("account_id","created_at");