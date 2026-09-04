CREATE TABLE `library_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`target` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bank_citations` (
	`id` text PRIMARY KEY NOT NULL,
	`question_id` text NOT NULL,
	`option_id` text,
	`version_id` text NOT NULL,
	`passage_id` text,
	`role` text NOT NULL,
	`locator` text DEFAULT '' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`verified` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `bank_questions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`option_id`) REFERENCES `bank_options`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`version_id`) REFERENCES `library_versions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`passage_id`) REFERENCES `library_passages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `bank_citation_question` ON `bank_citations` (`question_id`);--> statement-breakpoint
CREATE INDEX `bank_citation_version` ON `bank_citations` (`version_id`);--> statement-breakpoint
CREATE TABLE `library_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bank_options` (
	`id` text PRIMARY KEY NOT NULL,
	`question_id` text NOT NULL,
	`position` integer NOT NULL,
	`content` text NOT NULL,
	`analysis` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `bank_questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bank_option_order` ON `bank_options` (`question_id`,`position`);--> statement-breakpoint
CREATE TABLE `library_passages` (
	`id` text PRIMARY KEY NOT NULL,
	`version_id` text NOT NULL,
	`page` integer NOT NULL,
	`printed_page` text DEFAULT '' NOT NULL,
	`locator` text DEFAULT '' NOT NULL,
	`content` text NOT NULL,
	`method` text NOT NULL,
	`verified` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`version_id`) REFERENCES `library_versions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `library_passage_location` ON `library_passages` (`version_id`,`page`,`locator`);--> statement-breakpoint
CREATE TABLE `bank_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`legacy_number` integer,
	`tec_id` text,
	`source` text NOT NULL,
	`subject` text NOT NULL,
	`prompt` text NOT NULL,
	`answer_id` text NOT NULL,
	`status` text NOT NULL,
	`origin` text NOT NULL,
	`explanation` text DEFAULT '' NOT NULL,
	`review_note` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bank_questions_legacy_number_unique` ON `bank_questions` (`legacy_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `bank_questions_tec_id_unique` ON `bank_questions` (`tec_id`);--> statement-breakpoint
CREATE INDEX `bank_question_status` ON `bank_questions` (`status`);--> statement-breakpoint
CREATE TABLE `library_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`authors` text DEFAULT '' NOT NULL,
	`publisher` text DEFAULT '' NOT NULL,
	`identifier` text DEFAULT '' NOT NULL,
	`official_url` text DEFAULT '' NOT NULL,
	`topics` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `library_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`label` text NOT NULL,
	`published_on` text DEFAULT '' NOT NULL,
	`valid_from` text DEFAULT '' NOT NULL,
	`valid_until` text DEFAULT '' NOT NULL,
	`captured_at` text NOT NULL,
	`object_key` text,
	`filename` text,
	`mime` text,
	`size` integer,
	`sha256` text,
	`status` text DEFAULT 'declared' NOT NULL,
	`created_by` text NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `library_sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `library_versions_source` ON `library_versions` (`source_id`);