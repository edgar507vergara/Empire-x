CREATE TABLE save_backups (game_id text NOT NULL REFERENCES game_saves(id) ON DELETE CASCADE, owner_id text NOT NULL REFERENCES profiles(id), id text NOT NULL, state text NOT NULL CHECK(json_valid(state)), created_at integer NOT NULL, PRIMARY KEY(game_id,id));
--> statement-breakpoint
CREATE TABLE management_journal (game_id text NOT NULL REFERENCES game_saves(id) ON DELETE CASCADE, owner_id text NOT NULL REFERENCES profiles(id), id text NOT NULL, second integer NOT NULL, data text NOT NULL CHECK(json_valid(data)), PRIMARY KEY(game_id,id));
--> statement-breakpoint
CREATE INDEX management_history ON management_journal(game_id,owner_id,second);
--> statement-breakpoint
CREATE TRIGGER backup_owner BEFORE INSERT ON save_backups WHEN NOT EXISTS(SELECT 1 FROM game_saves WHERE id=NEW.game_id AND owner_id=NEW.owner_id) BEGIN SELECT RAISE(ABORT,'owner_mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER management_owner BEFORE INSERT ON management_journal WHEN NOT EXISTS(SELECT 1 FROM game_saves WHERE id=NEW.game_id AND owner_id=NEW.owner_id) BEGIN SELECT RAISE(ABORT,'owner_mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER backup_immutable BEFORE UPDATE ON save_backups BEGIN SELECT RAISE(ABORT,'immutable_backup'); END;
--> statement-breakpoint
CREATE TRIGGER management_immutable BEFORE UPDATE ON management_journal BEGIN SELECT RAISE(ABORT,'immutable_journal'); END;
