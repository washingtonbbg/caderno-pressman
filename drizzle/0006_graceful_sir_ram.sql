CREATE TABLE `research_notes` (
	`user_id` text NOT NULL,
	`question_id` text NOT NULL,
	`content` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `research_notes_user_question` ON `research_notes` (`user_id`,`question_id`);