-- Remove `matches` table; drop notifications.match_id; add promiedos_fixture_url.

PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `notifications_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
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
	`promiedos_fixture_url` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `notifications_new` (`id`, `user_id`, `channel`, `timing`, `idempotency_key`, `status`, `title`, `body`, `error`, `sent_at`, `read_at`, `created_at`, `promiedos_fixture_url`)
SELECT `id`, `user_id`, `channel`, `timing`, `idempotency_key`, `status`, `title`, `body`, `error`, `sent_at`, `read_at`, `created_at`, NULL FROM `notifications`;
--> statement-breakpoint
DROP TABLE `notifications`;
--> statement-breakpoint
ALTER TABLE `notifications_new` RENAME TO `notifications`;
--> statement-breakpoint
CREATE UNIQUE INDEX `idempotency_key_idx` ON `notifications` (`idempotency_key`);
--> statement-breakpoint
PRAGMA foreign_keys=ON;
--> statement-breakpoint
DROP TABLE `matches`;
