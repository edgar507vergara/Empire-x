CREATE TRIGGER game_version_guard BEFORE UPDATE ON game_saves
WHEN NEW.version <> OLD.version+1 OR NEW.owner_id <> OLD.owner_id OR NEW.id <> OLD.id
BEGIN SELECT RAISE(ABORT,'version_conflict'); END;
--> statement-breakpoint
CREATE TRIGGER game_limit_guard BEFORE INSERT ON game_saves
WHEN (SELECT count(*) FROM game_saves WHERE owner_id=NEW.owner_id)>=8
BEGIN SELECT RAISE(ABORT,'save_limit'); END;
--> statement-breakpoint
CREATE TRIGGER ledger_balance_guard BEFORE INSERT ON ledger_entries
WHEN (SELECT sum(json_extract(value,'$.amount')) FROM json_each(NEW.lines)) <> 0
BEGIN SELECT RAISE(ABORT,'unbalanced_entry'); END;
--> statement-breakpoint
CREATE TRIGGER snapshot_balance_insert BEFORE INSERT ON game_saves
WHEN json_extract(NEW.state,'$.id')<>NEW.id OR (SELECT sum(value) FROM json_each(NEW.state,'$.accounts'))<>0 OR json_extract(NEW.state,'$.accounts.cash')<0
BEGIN SELECT RAISE(ABORT,'invalid_snapshot'); END;
--> statement-breakpoint
CREATE TRIGGER snapshot_balance_update BEFORE UPDATE ON game_saves
WHEN json_extract(NEW.state,'$.id')<>NEW.id OR (SELECT sum(value) FROM json_each(NEW.state,'$.accounts'))<>0 OR json_extract(NEW.state,'$.accounts.cash')<0
BEGIN SELECT RAISE(ABORT,'invalid_snapshot'); END;
--> statement-breakpoint
CREATE TRIGGER game_clock_owner_insert BEFORE INSERT ON game_clock
WHEN NOT EXISTS(SELECT 1 FROM game_saves WHERE id=NEW.game_id AND owner_id=NEW.owner_id)
BEGIN SELECT RAISE(ABORT,'owner_mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER game_clock_owner_update BEFORE UPDATE ON game_clock
WHEN NOT EXISTS(SELECT 1 FROM game_saves WHERE id=NEW.game_id AND owner_id=NEW.owner_id)
BEGIN SELECT RAISE(ABORT,'owner_mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER world_tiles_owner_insert BEFORE INSERT ON world_tiles
WHEN NOT EXISTS(SELECT 1 FROM game_saves WHERE id=NEW.game_id AND owner_id=NEW.owner_id)
BEGIN SELECT RAISE(ABORT,'owner_mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER world_tiles_owner_update BEFORE UPDATE ON world_tiles
WHEN NOT EXISTS(SELECT 1 FROM game_saves WHERE id=NEW.game_id AND owner_id=NEW.owner_id)
BEGIN SELECT RAISE(ABORT,'owner_mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER companies_owner_insert BEFORE INSERT ON companies
WHEN NOT EXISTS(SELECT 1 FROM game_saves WHERE id=NEW.game_id AND owner_id=NEW.owner_id)
BEGIN SELECT RAISE(ABORT,'owner_mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER companies_owner_update BEFORE UPDATE ON companies
WHEN NOT EXISTS(SELECT 1 FROM game_saves WHERE id=NEW.game_id AND owner_id=NEW.owner_id)
BEGIN SELECT RAISE(ABORT,'owner_mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER business_locations_owner_insert BEFORE INSERT ON business_locations
WHEN NOT EXISTS(SELECT 1 FROM game_saves WHERE id=NEW.game_id AND owner_id=NEW.owner_id)
BEGIN SELECT RAISE(ABORT,'owner_mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER business_locations_owner_update BEFORE UPDATE ON business_locations
WHEN NOT EXISTS(SELECT 1 FROM game_saves WHERE id=NEW.game_id AND owner_id=NEW.owner_id)
BEGIN SELECT RAISE(ABORT,'owner_mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER products_owner_insert BEFORE INSERT ON products
WHEN NOT EXISTS(SELECT 1 FROM game_saves WHERE id=NEW.game_id AND owner_id=NEW.owner_id)
BEGIN SELECT RAISE(ABORT,'owner_mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER products_owner_update BEFORE UPDATE ON products
WHEN NOT EXISTS(SELECT 1 FROM game_saves WHERE id=NEW.game_id AND owner_id=NEW.owner_id)
BEGIN SELECT RAISE(ABORT,'owner_mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER inventory_owner_insert BEFORE INSERT ON inventory
WHEN NOT EXISTS(SELECT 1 FROM game_saves WHERE id=NEW.game_id AND owner_id=NEW.owner_id)
BEGIN SELECT RAISE(ABORT,'owner_mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER inventory_owner_update BEFORE UPDATE ON inventory
WHEN NOT EXISTS(SELECT 1 FROM game_saves WHERE id=NEW.game_id AND owner_id=NEW.owner_id)
BEGIN SELECT RAISE(ABORT,'owner_mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER employees_owner_insert BEFORE INSERT ON employees
WHEN NOT EXISTS(SELECT 1 FROM game_saves WHERE id=NEW.game_id AND owner_id=NEW.owner_id)
BEGIN SELECT RAISE(ABORT,'owner_mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER employees_owner_update BEFORE UPDATE ON employees
WHEN NOT EXISTS(SELECT 1 FROM game_saves WHERE id=NEW.game_id AND owner_id=NEW.owner_id)
BEGIN SELECT RAISE(ABORT,'owner_mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER financial_accounts_owner_insert BEFORE INSERT ON financial_accounts
WHEN NOT EXISTS(SELECT 1 FROM game_saves WHERE id=NEW.game_id AND owner_id=NEW.owner_id)
BEGIN SELECT RAISE(ABORT,'owner_mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER financial_accounts_owner_update BEFORE UPDATE ON financial_accounts
WHEN NOT EXISTS(SELECT 1 FROM game_saves WHERE id=NEW.game_id AND owner_id=NEW.owner_id)
BEGIN SELECT RAISE(ABORT,'owner_mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER ledger_entries_owner_insert BEFORE INSERT ON ledger_entries
WHEN NOT EXISTS(SELECT 1 FROM game_saves WHERE id=NEW.game_id AND owner_id=NEW.owner_id)
BEGIN SELECT RAISE(ABORT,'owner_mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER ledger_entries_owner_update BEFORE UPDATE ON ledger_entries
WHEN NOT EXISTS(SELECT 1 FROM game_saves WHERE id=NEW.game_id AND owner_id=NEW.owner_id)
BEGIN SELECT RAISE(ABORT,'owner_mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER sales_owner_insert BEFORE INSERT ON sales
WHEN NOT EXISTS(SELECT 1 FROM game_saves WHERE id=NEW.game_id AND owner_id=NEW.owner_id)
BEGIN SELECT RAISE(ABORT,'owner_mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER sales_owner_update BEFORE UPDATE ON sales
WHEN NOT EXISTS(SELECT 1 FROM game_saves WHERE id=NEW.game_id AND owner_id=NEW.owner_id)
BEGIN SELECT RAISE(ABORT,'owner_mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER sale_items_owner_insert BEFORE INSERT ON sale_items
WHEN NOT EXISTS(SELECT 1 FROM game_saves WHERE id=NEW.game_id AND owner_id=NEW.owner_id)
BEGIN SELECT RAISE(ABORT,'owner_mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER sale_items_owner_update BEFORE UPDATE ON sale_items
WHEN NOT EXISTS(SELECT 1 FROM game_saves WHERE id=NEW.game_id AND owner_id=NEW.owner_id)
BEGIN SELECT RAISE(ABORT,'owner_mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER inventory_movements_owner_insert BEFORE INSERT ON inventory_movements
WHEN NOT EXISTS(SELECT 1 FROM game_saves WHERE id=NEW.game_id AND owner_id=NEW.owner_id)
BEGIN SELECT RAISE(ABORT,'owner_mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER inventory_movements_owner_update BEFORE UPDATE ON inventory_movements
WHEN NOT EXISTS(SELECT 1 FROM game_saves WHERE id=NEW.game_id AND owner_id=NEW.owner_id)
BEGIN SELECT RAISE(ABORT,'owner_mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER game_events_owner_insert BEFORE INSERT ON game_events
WHEN NOT EXISTS(SELECT 1 FROM game_saves WHERE id=NEW.game_id AND owner_id=NEW.owner_id)
BEGIN SELECT RAISE(ABORT,'owner_mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER game_events_owner_update BEFORE UPDATE ON game_events
WHEN NOT EXISTS(SELECT 1 FROM game_saves WHERE id=NEW.game_id AND owner_id=NEW.owner_id)
BEGIN SELECT RAISE(ABORT,'owner_mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER simulation_ticks_owner_insert BEFORE INSERT ON simulation_ticks
WHEN NOT EXISTS(SELECT 1 FROM game_saves WHERE id=NEW.game_id AND owner_id=NEW.owner_id)
BEGIN SELECT RAISE(ABORT,'owner_mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER simulation_ticks_owner_update BEFORE UPDATE ON simulation_ticks
WHEN NOT EXISTS(SELECT 1 FROM game_saves WHERE id=NEW.game_id AND owner_id=NEW.owner_id)
BEGIN SELECT RAISE(ABORT,'owner_mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER mission_progress_owner_insert BEFORE INSERT ON mission_progress
WHEN NOT EXISTS(SELECT 1 FROM game_saves WHERE id=NEW.game_id AND owner_id=NEW.owner_id)
BEGIN SELECT RAISE(ABORT,'owner_mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER mission_progress_owner_update BEFORE UPDATE ON mission_progress
WHEN NOT EXISTS(SELECT 1 FROM game_saves WHERE id=NEW.game_id AND owner_id=NEW.owner_id)
BEGIN SELECT RAISE(ABORT,'owner_mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER command_receipts_owner_insert BEFORE INSERT ON command_receipts
WHEN NOT EXISTS(SELECT 1 FROM game_saves WHERE id=NEW.game_id AND owner_id=NEW.owner_id)
BEGIN SELECT RAISE(ABORT,'owner_mismatch'); END;
--> statement-breakpoint
CREATE TRIGGER command_receipts_owner_update BEFORE UPDATE ON command_receipts
WHEN NOT EXISTS(SELECT 1 FROM game_saves WHERE id=NEW.game_id AND owner_id=NEW.owner_id)
BEGIN SELECT RAISE(ABORT,'owner_mismatch'); END;
