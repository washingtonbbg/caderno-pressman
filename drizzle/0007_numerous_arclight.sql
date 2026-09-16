CREATE TABLE `study_plans` (
	`user_id` text NOT NULL,
	`program` text NOT NULL,
	`minutes` integer NOT NULL,
	`days` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `study_plans_user_program` ON `study_plans` (`user_id`,`program`);--> statement-breakpoint
ALTER TABLE `study_attempts` ADD `study_ms` integer DEFAULT 0 NOT NULL;