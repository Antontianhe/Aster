USE aster;
CREATE TABLE IF NOT EXISTS auth_login_attempts (
 username VARCHAR(30) CHARACTER SET ascii COLLATE ascii_general_ci PRIMARY KEY,
 failed_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
 locked_until DATETIME(6) NULL
);
INSERT IGNORE INTO schema_migrations(version) VALUES ('008_login_lockout');
