USE aster;
CREATE TABLE IF NOT EXISTS community_messages (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 user_id CHAR(36) NOT NULL,
 client_id CHAR(36) NOT NULL,
 room VARCHAR(20) NOT NULL,
 content TEXT NOT NULL,
 reply_id BIGINT UNSIGNED NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 edited_at DATETIME(3) NULL,
 deleted_at DATETIME(3) NULL,
 FOREIGN KEY(user_id) REFERENCES users(id),
 UNIQUE KEY idempotent_message(user_id,client_id),
 INDEX room_messages(room,id)
);
CREATE TABLE IF NOT EXISTS community_reports (
 message_id BIGINT UNSIGNED NOT NULL,
 user_id CHAR(36) NOT NULL,
 reason VARCHAR(30) NOT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(message_id,user_id),
 FOREIGN KEY(message_id) REFERENCES community_messages(id),
 FOREIGN KEY(user_id) REFERENCES users(id)
);
INSERT IGNORE INTO schema_migrations(version) VALUES ('005_community');
