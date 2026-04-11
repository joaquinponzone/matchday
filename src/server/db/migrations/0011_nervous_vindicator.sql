DROP TABLE `matches`;--> statement-breakpoint
ALTER TABLE `notifications` ADD `promiedos_fixture_url` text;--> statement-breakpoint
ALTER TABLE `notifications` DROP COLUMN `match_id`;--> statement-breakpoint
ALTER TABLE `teams` ADD `team_kind` text DEFAULT 'club' NOT NULL;