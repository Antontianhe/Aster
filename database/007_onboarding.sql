USE aster;
CREATE TABLE IF NOT EXISTS account_preferences (
 user_id CHAR(36) PRIMARY KEY,
 contact VARCHAR(254) NOT NULL,
 channel ENUM('email','phone') NOT NULL,
 terms_version VARCHAR(60) NOT NULL,
 terms_accepted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 preview_verified_at TIMESTAMP NULL,
 analytics_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
 progress_sharing BOOLEAN NOT NULL DEFAULT FALSE,
 consent_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS verification_challenges (
 token_hash CHAR(64) PRIMARY KEY,
 user_id CHAR(36) NOT NULL,
 code_hash CHAR(64) NOT NULL,
 attempts INT NOT NULL DEFAULT 0,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 expires_at TIMESTAMP NOT NULL,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS account_roles (
 user_id CHAR(36) PRIMARY KEY,
 role ENUM('owner') NOT NULL,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
INSERT IGNORE INTO schema_migrations(version) VALUES ('007_onboarding');
