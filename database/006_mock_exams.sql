USE aster;
CREATE TABLE IF NOT EXISTS mock_exam_plans (
 id CHAR(36) PRIMARY KEY,
 user_id CHAR(36) NOT NULL,
 exam_date DATE NOT NULL,
 plan JSON NOT NULL,
 blueprint JSON NULL,
 result JSON NULL,
 generated_at DATETIME NULL,
 deleted_at DATETIME NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id),
 INDEX mock_due(user_id,exam_date)
);
INSERT IGNORE INTO schema_migrations(version) VALUES ('006_mock_exams');
