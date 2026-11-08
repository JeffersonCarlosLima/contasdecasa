ALTER TABLE "payment_methods" ADD COLUMN "archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD COLUMN "card_last4" text;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD COLUMN "closing_day" smallint;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD COLUMN "due_day" smallint;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_card_last4_chk" CHECK ("payment_methods"."card_last4" is null or "payment_methods"."card_last4" ~ '^[0-9]{4}$');--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_closing_day_chk" CHECK ("payment_methods"."closing_day" is null or ("payment_methods"."closing_day" >= 1 and "payment_methods"."closing_day" <= 31));--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_due_day_chk" CHECK ("payment_methods"."due_day" is null or ("payment_methods"."due_day" >= 1 and "payment_methods"."due_day" <= 31));--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_both_days_chk" CHECK (("payment_methods"."closing_day" is null and "payment_methods"."due_day" is null) or ("payment_methods"."closing_day" is not null and "payment_methods"."due_day" is not null));