// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';

const m0000 = `CREATE TABLE \`bikes\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`name\` text NOT NULL,
	\`brand\` text,
	\`model\` text,
	\`year\` integer,
	\`type\` text DEFAULT 'road' NOT NULL,
	\`total_km\` real DEFAULT 0 NOT NULL,
	\`image_uri\` text,
	\`is_active\` integer DEFAULT 1 NOT NULL,
	\`created_at\` integer NOT NULL,
	\`updated_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`cached_shops\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`name\` text NOT NULL,
	\`lat\` real NOT NULL,
	\`lon\` real NOT NULL,
	\`address\` text,
	\`phone\` text,
	\`website\` text,
	\`opening_hours\` text,
	\`tags\` text,
	\`user_notes\` text,
	\`cached_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`parts\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`bike_id\` text NOT NULL,
	\`name\` text NOT NULL,
	\`category\` text DEFAULT 'other' NOT NULL,
	\`service_interval_km\` real,
	\`replace_interval_km\` real,
	\`service_interval_days\` integer,
	\`replace_interval_days\` integer,
	\`km_at_last_service\` real DEFAULT 0 NOT NULL,
	\`km_at_last_replace\` real DEFAULT 0 NOT NULL,
	\`date_last_service\` integer,
	\`date_last_replace\` integer,
	\`install_km\` real DEFAULT 0 NOT NULL,
	\`notes\` text,
	\`is_active\` integer DEFAULT 1 NOT NULL,
	\`created_at\` integer NOT NULL,
	\`updated_at\` integer NOT NULL,
	FOREIGN KEY (\`bike_id\`) REFERENCES \`bikes\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE \`rides\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`bike_id\` text NOT NULL,
	\`distance_km\` real NOT NULL,
	\`date\` integer NOT NULL,
	\`title\` text,
	\`notes\` text,
	\`source\` text DEFAULT 'manual' NOT NULL,
	\`external_id\` text,
	\`created_at\` integer NOT NULL,
	FOREIGN KEY (\`bike_id\`) REFERENCES \`bikes\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE \`service_records\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`part_id\` text NOT NULL,
	\`bike_id\` text NOT NULL,
	\`type\` text NOT NULL,
	\`bike_km_at_service\` real NOT NULL,
	\`cost\` real,
	\`shop_id\` text,
	\`notes\` text,
	\`date\` integer NOT NULL,
	\`created_at\` integer NOT NULL,
	FOREIGN KEY (\`part_id\`) REFERENCES \`parts\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`bike_id\`) REFERENCES \`bikes\`(\`id\`) ON UPDATE no action ON DELETE no action
);`;

export default {
  journal,
  migrations: {
    m0000
  }
};
