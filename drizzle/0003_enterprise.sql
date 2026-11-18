CREATE TABLE enterprise_journal(game_id text NOT NULL REFERENCES game_saves(id) ON DELETE CASCADE,owner_id text NOT NULL REFERENCES profiles(id),id text NOT NULL,second integer NOT NULL,company_id text NOT NULL,facility_id text NOT NULL,data text NOT NULL CHECK(json_valid(data)),PRIMARY KEY(game_id,id));
--> statement-breakpoint
CREATE INDEX enterprise_history ON enterprise_journal(game_id,owner_id,second);
--> statement-breakpoint
CREATE TRIGGER enterprise_owner BEFORE INSERT ON enterprise_journal WHEN NOT EXISTS(SELECT 1 FROM game_saves WHERE id=NEW.game_id AND owner_id=NEW.owner_id) BEGIN SELECT RAISE(ABORT,'owner_mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER enterprise_balanced BEFORE INSERT ON enterprise_journal WHEN (SELECT coalesce(sum(json_extract(value,'$.amount')),0) FROM json_each(NEW.data,'$.lines'))!=0 BEGIN SELECT RAISE(ABORT,'unbalanced_entry'); END;
--> statement-breakpoint
CREATE TRIGGER enterprise_immutable BEFORE UPDATE ON enterprise_journal BEGIN SELECT RAISE(ABORT,'immutable_journal'); END;
