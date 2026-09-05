CREATE TABLE `study_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`question_id` text NOT NULL,
	`ordinal` integer NOT NULL,
	`selected` integer NOT NULL,
	`confidence` text NOT NULL,
	`correct` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `study_attempts_sequence` ON `study_attempts` (`user_id`,`question_id`,`ordinal`);--> statement-breakpoint
CREATE TABLE `study_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`question_id` text NOT NULL,
	`attempts` integer NOT NULL,
	`correct` integer NOT NULL,
	`last_correct` integer NOT NULL,
	`confidence` text NOT NULL,
	`interval_days` integer NOT NULL,
	`due_at` integer NOT NULL,
	`last_at` integer NOT NULL,
	`first_correct` integer NOT NULL,
	`delayed_attempts` integer NOT NULL,
	`delayed_correct` integer NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`error_kind` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `study_progress_user_question` ON `study_progress` (`user_id`,`question_id`);