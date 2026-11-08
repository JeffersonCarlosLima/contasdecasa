CREATE TYPE "public"."import_batch_status" AS ENUM('rascunho', 'confirmado', 'desfeito');--> statement-breakpoint
CREATE TYPE "public"."import_row_situation" AS ENUM('nova', 'duplicada', 'possivel_vinculo');--> statement-breakpoint
CREATE TYPE "public"."import_row_type" AS ENUM('despesa', 'receita', 'salario', 'ignorar');--> statement-breakpoint
CREATE TYPE "public"."import_rule_match_type" AS ENUM('contem', 'comeca');--> statement-breakpoint
CREATE TABLE "import_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"payment_method_id" uuid NOT NULL,
	"owner_member_id" uuid,
	"layout" text NOT NULL,
	"filename" text NOT NULL,
	"file_size" integer NOT NULL,
	"row_count" integer DEFAULT 0 NOT NULL,
	"status" "import_batch_status" DEFAULT 'rascunho' NOT NULL,
	"imported_by" uuid NOT NULL,
	"confirmed_at" timestamp with time zone,
	"confirmed_by" uuid,
	"undone_at" timestamp with time zone,
	"undone_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"name" text NOT NULL,
	"config" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_rows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"family_id" uuid NOT NULL,
	"line_no" integer NOT NULL,
	"date" date NOT NULL,
	"description_original" text NOT NULL,
	"description_normalized" text NOT NULL,
	"amount_cents" bigint NOT NULL,
	"type" "import_row_type" DEFAULT 'despesa' NOT NULL,
	"ignore_reason" text,
	"category_id" uuid,
	"owner_member_id" uuid,
	"payment_method_id" uuid,
	"selected" boolean DEFAULT true NOT NULL,
	"fingerprint" text NOT NULL,
	"situation" "import_row_situation" DEFAULT 'nova' NOT NULL,
	"matched_expense_id" uuid,
	"linked_expense_id" uuid,
	"linked_row_id" uuid,
	"created_expense_id" uuid,
	"target_member_income_id" uuid,
	"applied_extra_cents" bigint,
	"previous_salary_cents" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"match_type" "import_rule_match_type" DEFAULT 'contem' NOT NULL,
	"pattern" text NOT NULL,
	"category_id" uuid NOT NULL,
	"owner_member_id" uuid,
	"payment_method_id" uuid,
	"priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "import_batch_id" uuid;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "fingerprint" text;--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_owner_member_id_family_members_id_fk" FOREIGN KEY ("owner_member_id") REFERENCES "public"."family_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_imported_by_family_members_id_fk" FOREIGN KEY ("imported_by") REFERENCES "public"."family_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_confirmed_by_family_members_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."family_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_undone_by_family_members_id_fk" FOREIGN KEY ("undone_by") REFERENCES "public"."family_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_mappings" ADD CONSTRAINT "import_mappings_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_batch_id_import_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."import_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_owner_member_id_family_members_id_fk" FOREIGN KEY ("owner_member_id") REFERENCES "public"."family_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_matched_expense_id_expenses_id_fk" FOREIGN KEY ("matched_expense_id") REFERENCES "public"."expenses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_linked_expense_id_expenses_id_fk" FOREIGN KEY ("linked_expense_id") REFERENCES "public"."expenses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_created_expense_id_expenses_id_fk" FOREIGN KEY ("created_expense_id") REFERENCES "public"."expenses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_target_member_income_id_member_incomes_id_fk" FOREIGN KEY ("target_member_income_id") REFERENCES "public"."member_incomes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rules" ADD CONSTRAINT "import_rules_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rules" ADD CONSTRAINT "import_rules_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rules" ADD CONSTRAINT "import_rules_owner_member_id_family_members_id_fk" FOREIGN KEY ("owner_member_id") REFERENCES "public"."family_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rules" ADD CONSTRAINT "import_rules_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "import_batches_family_idx" ON "import_batches" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "import_batches_family_created_idx" ON "import_batches" USING btree ("family_id","created_at");--> statement-breakpoint
CREATE INDEX "import_batches_status_idx" ON "import_batches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "import_mappings_family_idx" ON "import_mappings" USING btree ("family_id");--> statement-breakpoint
CREATE UNIQUE INDEX "import_mappings_family_name_uq" ON "import_mappings" USING btree ("family_id","name");--> statement-breakpoint
CREATE INDEX "import_rows_batch_idx" ON "import_rows" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "import_rows_family_idx" ON "import_rows" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "import_rows_fingerprint_idx" ON "import_rows" USING btree ("family_id","fingerprint");--> statement-breakpoint
CREATE INDEX "import_rules_family_idx" ON "import_rules" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "import_rules_family_priority_idx" ON "import_rules" USING btree ("family_id","priority");--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_import_batch_id_import_batches_id_fk" FOREIGN KEY ("import_batch_id") REFERENCES "public"."import_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expenses_import_batch_idx" ON "expenses" USING btree ("import_batch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "expenses_family_fingerprint_uq" ON "expenses" USING btree ("family_id","fingerprint") WHERE "expenses"."fingerprint" is not null and "expenses"."deleted_at" is null;