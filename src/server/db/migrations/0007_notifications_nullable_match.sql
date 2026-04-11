-- Allow notifications without a row in `matches` (Promiedos-on-demand model).

PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `notifications_new` (
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
INSERT INTO `notifications_new` SELECT * FROM `notifications`;
--> statement-breakpoint
DROP TABLE `notifications`;
--> statement-breakpoint
ALTER TABLE `notifications_new` RENAME TO `notifications`;
--> statement-breakpoint
CREATE UNIQUE INDEX `idempotency_key_idx` ON `notifications` (`idempotency_key`);
--> statement-breakpoint
PRAGMA foreign_keys=ON;
