CREATE TABLE `business_locations` (
	`game_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`id` text NOT NULL,
	`tile_id` integer NOT NULL,
	`data` text NOT NULL,
	PRIMARY KEY(`game_id`, `id`),
	FOREIGN KEY (`game_id`) REFERENCES `game_saves`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `command_receipts` (
	`game_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`id` text NOT NULL,
	`request_hash` text NOT NULL,
	`version` integer NOT NULL,
	PRIMARY KEY(`game_id`, `id`),
	FOREIGN KEY (`game_id`) REFERENCES `game_saves`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`game_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`data` text NOT NULL,
	PRIMARY KEY(`game_id`, `id`),
	FOREIGN KEY (`game_id`) REFERENCES `game_saves`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`game_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`id` text NOT NULL,
	`hired` integer NOT NULL,
	`salary` integer NOT NULL,
	`data` text NOT NULL,
	PRIMARY KEY(`game_id`, `id`),
	FOREIGN KEY (`game_id`) REFERENCES `game_saves`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "positive_salary" CHECK("employees"."salary">0)
);
--> statement-breakpoint
CREATE TABLE `financial_accounts` (
	`game_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`id` text NOT NULL,
	`balance` integer NOT NULL,
	PRIMARY KEY(`game_id`, `id`),
	FOREIGN KEY (`game_id`) REFERENCES `game_saves`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "nonnegative_assets" CHECK("financial_accounts"."id" not in ('cash','inventory','fixedAssets') or "financial_accounts"."balance">=0)
);
--> statement-breakpoint
CREATE TABLE `game_clock` (
	`game_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`id` text NOT NULL,
	`second` integer NOT NULL,
	`tick` integer NOT NULL,
	`speed` integer NOT NULL,
	`data` text NOT NULL,
	PRIMARY KEY(`game_id`, `id`),
	FOREIGN KEY (`game_id`) REFERENCES `game_saves`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "valid_speed" CHECK("game_clock"."speed" in (0,1,2,5,10))
);
--> statement-breakpoint
CREATE TABLE `game_events` (
	`game_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`id` text NOT NULL,
	`data` text NOT NULL,
	PRIMARY KEY(`game_id`, `id`),
	FOREIGN KEY (`game_id`) REFERENCES `game_saves`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `game_saves` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`player_name` text NOT NULL,
	`company_name` text NOT NULL,
	`difficulty` text NOT NULL,
	`version` integer NOT NULL,
	`sim_second` integer NOT NULL,
	`state` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "valid_state" CHECK(json_valid("game_saves"."state")),
	CONSTRAINT "valid_version" CHECK("game_saves"."version" >= 0),
	CONSTRAINT "valid_difficulty" CHECK("game_saves"."difficulty" in ('easy','normal','hard'))
);
--> statement-breakpoint
CREATE INDEX `saves_owner_updated` ON `game_saves` (`owner_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `inventory` (
	`game_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`id` text NOT NULL,
	`quantity` integer NOT NULL,
	`value` integer NOT NULL,
	`price` integer NOT NULL,
	PRIMARY KEY(`game_id`, `id`),
	FOREIGN KEY (`game_id`) REFERENCES `game_saves`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "nonnegative_stock" CHECK("inventory"."quantity">=0 and "inventory"."value">=0 and "inventory"."price">0 and ("inventory"."quantity">0 or "inventory"."value"=0))
);
--> statement-breakpoint
CREATE TABLE `inventory_movements` (
	`game_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`value` integer NOT NULL,
	`second` integer NOT NULL,
	`reference` text NOT NULL,
	PRIMARY KEY(`game_id`, `id`),
	FOREIGN KEY (`game_id`) REFERENCES `game_saves`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "nonzero_movement" CHECK("inventory_movements"."quantity"<>0)
);
--> statement-breakpoint
CREATE TABLE `ledger_entries` (
	`game_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`id` text NOT NULL,
	`sequence` integer NOT NULL,
	`second` integer NOT NULL,
	`cause` text NOT NULL,
	`reference` text NOT NULL,
	`flow` text NOT NULL,
	`lines` text NOT NULL,
	PRIMARY KEY(`game_id`, `id`),
	FOREIGN KEY (`game_id`) REFERENCES `game_saves`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ledger_history` ON `ledger_entries` (`game_id`,`sequence`);--> statement-breakpoint
CREATE TABLE `mission_progress` (
	`game_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`id` integer NOT NULL,
	`completed` integer NOT NULL,
	PRIMARY KEY(`game_id`, `id`),
	FOREIGN KEY (`game_id`) REFERENCES `game_saves`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `products` (
	`game_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`cost` integer NOT NULL,
	`data` text NOT NULL,
	PRIMARY KEY(`game_id`, `id`),
	FOREIGN KEY (`game_id`) REFERENCES `game_saves`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sale_items` (
	`game_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`id` text NOT NULL,
	`sale_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`price` integer NOT NULL,
	`cost` integer NOT NULL,
	PRIMARY KEY(`game_id`, `id`),
	FOREIGN KEY (`game_id`) REFERENCES `game_saves`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "positive_quantity" CHECK("sale_items"."quantity">0 and "sale_items"."price">0 and "sale_items"."cost">=0)
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`game_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`id` text NOT NULL,
	`second` integer NOT NULL,
	`revenue` integer NOT NULL,
	`cost` integer NOT NULL,
	PRIMARY KEY(`game_id`, `id`),
	FOREIGN KEY (`game_id`) REFERENCES `game_saves`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "positive_sales" CHECK("sales"."revenue">0 and "sales"."cost">=0)
);
--> statement-breakpoint
CREATE TABLE `simulation_ticks` (
	`game_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`id` integer NOT NULL,
	`second` integer NOT NULL,
	PRIMARY KEY(`game_id`, `id`),
	FOREIGN KEY (`game_id`) REFERENCES `game_saves`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "positive_tick" CHECK("simulation_ticks"."id">0)
);
--> statement-breakpoint
CREATE TABLE `world_tiles` (
	`game_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`id` text NOT NULL,
	`kind` text NOT NULL,
	`owned` integer NOT NULL,
	`data` text NOT NULL,
	PRIMARY KEY(`game_id`, `id`),
	FOREIGN KEY (`game_id`) REFERENCES `game_saves`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
