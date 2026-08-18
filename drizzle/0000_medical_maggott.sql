CREATE TABLE "answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instance_id" uuid NOT NULL,
	"field_id" text NOT NULL,
	"value" jsonb,
	"failed" boolean DEFAULT false NOT NULL,
	"fail_note" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instance_id" uuid NOT NULL,
	"field_id" text NOT NULL,
	"kind" text DEFAULT 'photo' NOT NULL,
	"storage_key" text NOT NULL,
	"filename" text,
	"mime" text NOT NULL,
	"size" integer NOT NULL,
	"width" integer,
	"height" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checklists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"version" integer NOT NULL,
	"title_cs" text NOT NULL,
	"title_en" text NOT NULL,
	"definition" jsonb NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instance_id" uuid NOT NULL,
	"type" text NOT NULL,
	"field_id" text,
	"payload" jsonb,
	"actor" text DEFAULT 'installer' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"checklist_slug" text NOT NULL,
	"checklist_version" integer NOT NULL,
	"definition" jsonb NOT NULL,
	"label" text NOT NULL,
	"customer_name" text,
	"customer_email" text,
	"lang" text DEFAULT 'cs' NOT NULL,
	"status" text DEFAULT 'created' NOT NULL,
	"prefill" jsonb,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_activity_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_instance_id_form_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."form_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_instance_id_form_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."form_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_instance_id_form_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."form_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "answers_instance_field_idx" ON "answers" USING btree ("instance_id","field_id");--> statement-breakpoint
CREATE INDEX "answers_instance_idx" ON "answers" USING btree ("instance_id");--> statement-breakpoint
CREATE INDEX "attachments_instance_field_idx" ON "attachments" USING btree ("instance_id","field_id");--> statement-breakpoint
CREATE UNIQUE INDEX "checklists_slug_version_idx" ON "checklists" USING btree ("slug","version");--> statement-breakpoint
CREATE INDEX "events_instance_idx" ON "events" USING btree ("instance_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "form_instances_token_idx" ON "form_instances" USING btree ("token");--> statement-breakpoint
CREATE INDEX "form_instances_status_idx" ON "form_instances" USING btree ("status");