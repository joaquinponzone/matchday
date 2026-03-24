CREATE TABLE `matches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`api_football_id` integer NOT NULL,
	`opponent` text NOT NULL,
	`opponent_logo` text,
	`competition` text NOT NULL,
	`competition_logo` text,
	`match_date` text NOT NULL,
	`venue` text,
	`is_home` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`chelsea_score` integer,
	`opponent_score` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `matches_api_football_id_unique` ON `matches` (`api_football_id`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`match_id` integer NOT NULL,
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
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idempotency_key_idx` ON `notifications` (`idempotency_key`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`email` text,
	`telegram_chat_id` text,
	`timezone` text DEFAULT 'America/Argentina/Buenos_Aires' NOT NULL,
	`email_enabled` integer DEFAULT 0 NOT NULL,
	`telegram_enabled` integer DEFAULT 0 NOT NULL,
	`in_app_enabled` integer DEFAULT 1 NOT NULL,
	`notify_day_before` integer DEFAULT 1 NOT NULL,
	`notify_match_day` integer DEFAULT 1 NOT NULL,
	`day_before_hour` integer DEFAULT 20 NOT NULL,
	`match_day_hour` integer DEFAULT 9 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
