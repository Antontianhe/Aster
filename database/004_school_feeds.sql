USE aster;
CREATE TABLE IF NOT EXISTS school_feeds(
 user_id CHAR(36) PRIMARY KEY, url_encrypted TEXT NOT NULL,
 cached_items JSON, checked_at DATETIME, etag VARCHAR(500), last_error VARCHAR(500),
 FOREIGN KEY(user_id) REFERENCES users(id)
);
INSERT IGNORE INTO schema_migrations(version) VALUES ('004_school_feeds');
