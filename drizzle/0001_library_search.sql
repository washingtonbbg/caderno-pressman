CREATE VIRTUAL TABLE library_passages_fts USING fts5(id UNINDEXED, content, tokenize='unicode61 remove_diacritics 2');
--> statement-breakpoint
CREATE TRIGGER library_passages_insert AFTER INSERT ON library_passages BEGIN INSERT INTO library_passages_fts(id,content) VALUES(new.id,new.content); END;
--> statement-breakpoint
CREATE TRIGGER library_passages_update AFTER UPDATE OF content ON library_passages BEGIN DELETE FROM library_passages_fts WHERE id=old.id; INSERT INTO library_passages_fts(id,content) VALUES(new.id,new.content); END;
--> statement-breakpoint
CREATE TRIGGER library_passages_delete AFTER DELETE ON library_passages BEGIN DELETE FROM library_passages_fts WHERE id=old.id; END;
