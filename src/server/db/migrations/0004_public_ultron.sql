CREATE TABLE `prode_predictions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`match_number` integer NOT NULL,
	`home_score` integer NOT NULL,
	`away_score` integer NOT NULL,
	`points` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `prode_user_match_idx` ON `prode_predictions` (`user_id`,`match_number`);--> statement-breakpoint
CREATE TABLE `teams` (
	`api_id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`short_name` text NOT NULL,
	`tla` text NOT NULL,
	`crest` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`reset_token` text,
	`reset_token_expires_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_followed_teams` (
	`user_id` integer NOT NULL,
	`team_key` text NOT NULL,
	`enabled` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`user_id`, `team_key`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_followed_teams`("user_id", "team_key", "enabled") SELECT "user_id", "team_key", "enabled" FROM `followed_teams`;--> statement-breakpoint
DROP TABLE `followed_teams`;--> statement-breakpoint
ALTER TABLE `__new_followed_teams` RENAME TO `followed_teams`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `matches` ADD `team_name` text;--> statement-breakpoint
ALTER TABLE `matches` ADD `team_short_name` text;--> statement-breakpoint
ALTER TABLE `matches` ADD `team_crest` text;--> statement-breakpoint
ALTER TABLE `matches` ADD `team_score` integer;--> statement-breakpoint
ALTER TABLE `matches` DROP COLUMN `chelsea_score`;--> statement-breakpoint
ALTER TABLE `notifications` ADD `user_id` integer NOT NULL REFERENCES users(id);--> statement-breakpoint
CREATE TABLE `__new_settings` (
	`user_id` integer PRIMARY KEY NOT NULL,
	`telegram_chat_id` text,
	`timezone` text DEFAULT 'America/Argentina/Buenos_Aires' NOT NULL,
	`telegram_enabled` integer DEFAULT 0 NOT NULL,
	`in_app_enabled` integer DEFAULT 1 NOT NULL,
	`notify_day_before` integer DEFAULT 1 NOT NULL,
	`notify_match_day` integer DEFAULT 1 NOT NULL,
	`day_before_hour` integer DEFAULT 20 NOT NULL,
	`match_day_hour` integer DEFAULT 9 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_settings`("user_id", "telegram_chat_id", "timezone", "telegram_enabled", "in_app_enabled", "notify_day_before", "notify_match_day", "day_before_hour", "match_day_hour", "created_at", "updated_at") SELECT "user_id", "telegram_chat_id", "timezone", "telegram_enabled", "in_app_enabled", "notify_day_before", "notify_match_day", "day_before_hour", "match_day_hour", "created_at", "updated_at" FROM `settings`;--> statement-breakpoint
DROP TABLE `settings`;--> statement-breakpoint
ALTER TABLE `__new_settings` RENAME TO `settings`;