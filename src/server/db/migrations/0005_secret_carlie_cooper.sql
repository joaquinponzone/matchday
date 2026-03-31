ALTER TABLE `users` ADD `nickname` text;--> statement-breakpoint
CREATE UNIQUE INDEX `users_nickname_unique` ON `users` (`nickname`);