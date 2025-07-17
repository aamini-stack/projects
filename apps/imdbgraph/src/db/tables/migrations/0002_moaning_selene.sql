DROP INDEX "trigram_index";--> statement-breakpoint
DROP INDEX "episode_show_id_index";--> statement-breakpoint
DROP INDEX "show_rating_index";--> statement-breakpoint
CREATE INDEX "episode_show_id_index" ON "episode" USING btree ("show_id" text_ops);--> statement-breakpoint
CREATE INDEX "show_rating_index" ON "show" USING btree ("rating" float8_ops);