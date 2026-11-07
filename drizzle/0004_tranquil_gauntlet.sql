UPDATE "expenses" SET "reference_month" = date_trunc('month', "reference_month")::date WHERE extract(day from "reference_month") <> 1;
--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_reference_month_day1" CHECK (extract(day from "expenses"."reference_month") = 1);
