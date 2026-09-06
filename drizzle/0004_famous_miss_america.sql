ALTER TABLE `bank_questions` ADD `source_url` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `bank_questions` ADD `reference_text` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `bank_questions` ADD `bank_analysis` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `bank_questions` ADD `review_status` text DEFAULT 'needs_review' NOT NULL;--> statement-breakpoint
ALTER TABLE `bank_questions` ADD `suggested_answer` integer;