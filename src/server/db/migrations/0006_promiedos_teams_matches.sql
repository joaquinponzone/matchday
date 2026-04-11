-- Promiedos: text team_key PK and external_match_id for fixtures.
-- Clears notifications and matches (breaking change vs football-data.org IDs).

DELETE FROM `notifications`;
--> statement-breakpoint
DELETE FROM `matches`;
--> statement-breakpoint
DELETE FROM `followed_teams`;
--> statement-breakpoint
DROP TABLE `teams`;
--> statement-breakpoint
CREATE TABLE `teams` (
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
DROP TABLE `matches`;
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`external_match_id` text NOT NULL,
	`team_key` text DEFAULT 'pm:unknown' NOT NULL,
	`opponent` text NOT NULL,
	`opponent_logo` text,
	`competition` text NOT NULL,
	`competition_logo` text,
	`match_date` text NOT NULL,
	`venue` text,
	`is_home` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`team_name` text,
	`team_short_name` text,
	`team_crest` text,
	`team_score` integer,
	`opponent_score` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `matches_external_match_id_unique` ON `matches` (`external_match_id`);
