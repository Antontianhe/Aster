USE aster;
CREATE TABLE IF NOT EXISTS credentials(
 user_id CHAR(36) PRIMARY KEY, username VARCHAR(30) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL UNIQUE,
 password_hash VARCHAR(255) NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS auth_sessions(
 token_hash CHAR(64) PRIMARY KEY, user_id CHAR(36) NOT NULL, expires_at DATETIME NOT NULL,
 FOREIGN KEY(user_id) REFERENCES users(id), INDEX idx_session_expiry(expires_at)
);
CREATE TABLE IF NOT EXISTS workspace_state(
 user_id CHAR(36) PRIMARY KEY, content JSON NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS portal_records(
 user_id CHAR(36) PRIMARY KEY, content JSON NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id)
);
INSERT IGNORE INTO schema_migrations(version) VALUES ('003_accounts');
