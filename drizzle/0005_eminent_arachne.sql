ALTER TABLE `study_attempts` ADD `memory_rating` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `study_attempts` ADD `rating_source` text DEFAULT 'inferred' NOT NULL;--> statement-breakpoint
ALTER TABLE `study_attempts` ADD `response_ms` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `study_attempts` ADD `scheduled_days` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `study_attempts` ADD `elapsed_days` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `study_attempts` ADD `scheduler_version` text DEFAULT 'legacy' NOT NULL;--> statement-breakpoint
ALTER TABLE `study_progress` ADD `stability` real DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `study_progress` ADD `difficulty` real DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE `study_progress` ADD `lapses` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `study_progress` ADD `fsrs_state` integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE `study_progress` ADD `fsrs_reps` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `study_progress` ADD `learning_steps` integer DEFAULT 0 NOT NULL;