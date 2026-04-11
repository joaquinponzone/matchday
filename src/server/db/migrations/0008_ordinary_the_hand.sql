ALTER TABLE `matches` RENAME COLUMN "api_football_id" TO "external_match_id";--> statement-breakpoint
DROP INDEX `matches_api_football_id_unique`;--> statement-breakpoint
DROP INDEX "matches_external_match_id_unique";--> statement-breakpoint
DROP INDEX "idempotency_key_idx";--> statement-breakpoint
DROP INDEX "prode_user_match_idx";--> statement-breakpoint
DROP INDEX "users_email_unique";--> statement-breakpoint
DROP INDEX "users_nickname_unique";--> statement-breakpoint
ALTER TABLE `matches` ALTER COLUMN "external_match_id" TO "external_match_id" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `matches_external_match_id_unique` ON `matches` (`external_match_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idempotency_key_idx` ON `notifications` (`idempotency_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `prode_user_match_idx` ON `prode_predictions` (`user_id`,`match_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_nickname_unique` ON `users` (`nickname`);--> statement-breakpoint
ALTER TABLE `matches` ALTER COLUMN "team_key" TO "team_key" text NOT NULL DEFAULT 'pm:unknown';--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_teams` (
	`team_key` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`short_name` text NOT NULL,
	`tla` text NOT NULL,
	`crest` text NOT NULL,
	`promiedos_url_name` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_teams`("team_key", "name", "short_name", "tla", "crest", "promiedos_url_name", "created_at", "updated_at") SELECT "team_key", "name", "short_name", "tla", "crest", "promiedos_url_name", "created_at", "updated_at" FROM `teams`;--> statement-breakpoint
DROP TABLE `teams`;--> statement-breakpoint
ALTER TABLE `__new_teams` RENAME TO `teams`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`match_id` integer,
	`channel` text NOT NULL,
	`timing` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`status` text DEFAULT 'sent' NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`error` text,
	`sent_at` text,
	`read_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_notifications`("id", "user_id", "match_id", "channel", "timing", "idempotency_key", "status", "title", "body", "error", "sent_at", "read_at", "created_at") SELECT "id", "user_id", "match_id", "channel", "timing", "idempotency_key", "status", "title", "body", "error", "sent_at", "read_at", "created_at" FROM `notifications`;--> statement-breakpoint
DROP TABLE `notifications`;--> statement-breakpoint
ALTER TABLE `__new_notifications` RENAME TO `notifications`;